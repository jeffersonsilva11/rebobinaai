// src/pipeline/jobs/ingest-title.ts
// Job principal: busca todos os dados de 1 título e salva no banco

import { prisma } from '@/lib/db'
import { tmdb } from '@/lib/apis/tmdb'
import { omdb } from '@/lib/apis/omdb'
import { youtube } from '@/lib/apis/youtube'
import { enrichTitle } from './enrich-title'

export interface IngestTitleInput {
  tmdbId: number
  type: 'MOVIE' | 'SERIES'
  priority?: 'high' | 'normal' | 'low'
}

export async function ingestTitle({ tmdbId, type }: IngestTitleInput) {
  console.log(`[ingest] Iniciando ${type} tmdbId=${tmdbId}`)

  // 1. Busca dados base no TMDB
  const tmdbData = type === 'MOVIE'
    ? await tmdb.getMovie(tmdbId)
    : await tmdb.getSeries(tmdbId)

  if (!tmdbData) throw new Error(`TMDB: título ${tmdbId} não encontrado`)

  // 2. Gera slug
  const slug = generateSlug(tmdbData.title, tmdbData.year)

  // 3. Busca em paralelo (mais rápido)
  const [omdbData, credits, externalIds, availability, videos] = await Promise.allSettled([
    omdb.getByImdbId(tmdbData.imdbId),
    tmdb.getCredits(tmdbId, type),
    tmdb.getExternalIds(tmdbId, type),
    tmdb.getWatchProviders(tmdbId, type, 'BR'),
    tmdb.getVideos(tmdbId, type),
  ])

  const omdb = getValue(omdbData)
  const cast = getValue(credits)
  const socials = getValue(externalIds)
  const providers = getValue(availability)
  const videoList = getValue(videos)

  // 4. Busca trailer no YouTube como fallback
  const trailerYoutubeId = videoList?.trailerKey
    ?? await youtube.findTrailer(`${tmdbData.titleOriginal} trailer oficial`)

  // 5. Upsert do título principal
  const title = await prisma.title.upsert({
    where: { tmdbId },
    create: {
      tmdbId,
      imdbId: tmdbData.imdbId,
      type,
      slug,
      titlePt: tmdbData.titlePt ?? tmdbData.titleOriginal,
      titleOriginal: tmdbData.titleOriginal,
      year: tmdbData.year,
      endYear: tmdbData.endYear,
      runtimeMin: tmdbData.runtimeMin,
      totalEpisodes: tmdbData.totalEpisodes,
      totalSeasons: tmdbData.totalSeasons,
      posterUrl: tmdbData.posterUrl ? `https://image.tmdb.org/t/p/w500${tmdbData.posterUrl}` : null,
      backdropUrl: tmdbData.backdropUrl ? `https://image.tmdb.org/t/p/original${tmdbData.backdropUrl}` : null,
      trailerYoutubeId,
      ratingAge: tmdbData.ratingAge,
      countries: tmdbData.countries,
      languages: tmdbData.languages,
      instagramId: socials?.instagramId,
      twitterId: socials?.twitterId,
      facebookId: socials?.facebookId,
      status: 'DRAFT', // Fica DRAFT até ser enriquecido pela IA
    },
    update: {
      titlePt: tmdbData.titlePt ?? tmdbData.titleOriginal,
      titleOriginal: tmdbData.titleOriginal,
      posterUrl: tmdbData.posterUrl ? `https://image.tmdb.org/t/p/w500${tmdbData.posterUrl}` : undefined,
      backdropUrl: tmdbData.backdropUrl ? `https://image.tmdb.org/t/p/original${tmdbData.backdropUrl}` : undefined,
      trailerYoutubeId: trailerYoutubeId ?? undefined,
      instagramId: socials?.instagramId,
      twitterId: socials?.twitterId,
      updatedAt: new Date(),
    },
  })

  // 6. Salva notas
  if (omdb || tmdbData.voteAverage) {
    await prisma.rating.upsert({
      where: { titleId: title.id },
      create: {
        titleId: title.id,
        imdbScore: omdb?.imdbRating ?? null,
        imdbVotes: omdb?.imdbVotes ?? null,
        rtTomatometer: omdb?.rtScore ?? null,
        metacritic: omdb?.metacriticScore ?? null,
      },
      update: {
        imdbScore: omdb?.imdbRating ?? undefined,
        imdbVotes: omdb?.imdbVotes ?? undefined,
        rtTomatometer: omdb?.rtScore ?? undefined,
        metacritic: omdb?.metacriticScore ?? undefined,
        lastSyncedAt: new Date(),
      },
    })
  }

  // 7. Salva gêneros
  if (tmdbData.genres?.length) {
    await syncGenres(title.id, tmdbData.genres)
  }

  // 8. Salva elenco + equipe
  if (cast) {
    await syncCast(title.id, cast)
  }

  // 9. Salva disponibilidade (onde assistir)
  if (providers) {
    await syncAvailability(title.id, providers)
  }

  console.log(`[ingest] Base salva para "${title.titleOriginal}" (${title.id})`)

  // 10. Dispara enriquecimento por IA
  await enrichTitle({ titleId: title.id })

  return title
}

// ─────────────────────────────────────
// Sincroniza gêneros
// ─────────────────────────────────────
async function syncGenres(titleId: string, genres: { id: number; name: string }[]) {
  for (const g of genres) {
    // Upsert do gênero
    const genre = await prisma.genre.upsert({
      where: { tmdbId: g.id },
      create: {
        tmdbId: g.id,
        nameEn: g.name,
        namePt: translateGenre(g.name),
        slug: slugify(g.name),
      },
      update: {},
    })

    // Cria relação se não existir
    await prisma.titleGenre.upsert({
      where: { titleId_genreId: { titleId, genreId: genre.id } },
      create: { titleId, genreId: genre.id },
      update: {},
    })
  }
}

// ─────────────────────────────────────
// Sincroniza elenco
// ─────────────────────────────────────
async function syncCast(titleId: string, credits: any) {
  const allPeople = [
    ...(credits.cast?.slice(0, 15) ?? []).map((p: any) => ({ ...p, role: 'ACTOR' })),
    ...(credits.crew?.filter((p: any) =>
      ['Director', 'Screenplay', 'Writer', 'Director of Photography', 'Original Music Composer'].includes(p.job)
    ) ?? []).map((p: any) => ({ ...p, role: mapCrewRole(p.job) })),
  ]

  for (const person of allPeople) {
    const p = await prisma.person.upsert({
      where: { tmdbPersonId: person.id },
      create: {
        tmdbPersonId: person.id,
        name: person.name,
        slug: generateSlug(person.name),
        photoUrl: person.profile_path
          ? `https://image.tmdb.org/t/p/w185${person.profile_path}`
          : null,
      },
      update: {
        photoUrl: person.profile_path
          ? `https://image.tmdb.org/t/p/w185${person.profile_path}`
          : undefined,
      },
    })

    await prisma.titleCast.upsert({
      where: {
        titleId_personId_role: {
          titleId,
          personId: p.id,
          role: person.role as any,
        },
      },
      create: {
        titleId,
        personId: p.id,
        role: person.role as any,
        characterName: person.character ?? null,
        order: person.order ?? 0,
      },
      update: {},
    })
  }
}

// ─────────────────────────────────────
// Sincroniza disponibilidade (onde assistir)
// ─────────────────────────────────────
async function syncAvailability(titleId: string, providers: any) {
  const br = providers?.BR
  if (!br) return

  // Marca todas existentes como inativas primeiro
  await prisma.titleAvailability.updateMany({
    where: { titleId, country: 'BR' },
    data: { isActive: false },
  })

  const entries = [
    ...(br.flatrate ?? []).map((p: any) => ({ ...p, accessType: 'SUBSCRIPTION' as const })),
    ...(br.rent ?? []).map((p: any) => ({ ...p, accessType: 'RENT' as const })),
    ...(br.buy ?? []).map((p: any) => ({ ...p, accessType: 'BUY' as const })),
    ...(br.free ?? []).map((p: any) => ({ ...p, accessType: 'FREE' as const })),
  ]

  for (const entry of entries) {
    // Busca plataforma pelo tmdbProviderId
    const platform = await prisma.platform.findFirst({
      where: { tmdbProviderId: entry.provider_id },
    })

    if (!platform) continue

    const deeplink = buildDeeplink(platform, titleId)

    await prisma.titleAvailability.upsert({
      where: {
        titleId_platformId_country_accessType: {
          titleId,
          platformId: platform.id,
          country: 'BR',
          accessType: entry.accessType,
        },
      },
      create: {
        titleId,
        platformId: platform.id,
        country: 'BR',
        accessType: entry.accessType,
        deeplinkUrl: deeplink,
        isActive: true,
        syncedAt: new Date(),
      },
      update: {
        isActive: true,
        syncedAt: new Date(),
      },
    })
  }
}

// ─────────────────────────────────────
// Helpers
// ─────────────────────────────────────
function getValue<T>(result: PromiseSettledResult<T>): T | null {
  return result.status === 'fulfilled' ? result.value : null
}

function generateSlug(title: string, year?: number): string {
  const base = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
  return year ? `${base}-${year}` : base
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

function mapCrewRole(job: string): string {
  const map: Record<string, string> = {
    'Director': 'DIRECTOR',
    'Screenplay': 'WRITER',
    'Writer': 'WRITER',
    'Director of Photography': 'DOP',
    'Original Music Composer': 'MUSIC',
    'Producer': 'PRODUCER',
    'Editor': 'EDITOR',
  }
  return map[job] ?? 'WRITER'
}

function translateGenre(name: string): string {
  const map: Record<string, string> = {
    'Action': 'Ação', 'Adventure': 'Aventura', 'Animation': 'Animação',
    'Comedy': 'Comédia', 'Crime': 'Crime', 'Documentary': 'Documentário',
    'Drama': 'Drama', 'Family': 'Família', 'Fantasy': 'Fantasia',
    'History': 'Histórico', 'Horror': 'Terror', 'Music': 'Música',
    'Mystery': 'Mistério', 'Romance': 'Romance', 'Science Fiction': 'Ficção Científica',
    'TV Movie': 'Telefilme', 'Thriller': 'Suspense', 'War': 'Guerra',
    'Western': 'Faroeste',
  }
  return map[name] ?? name
}

function buildDeeplink(platform: any, titleId: string): string | null {
  if (!platform.baseUrlBr) return null
  // Cada plataforma tem seu padrão — a URL específica do título
  // vem do TMDB em providers[BR].link quando disponível
  return platform.baseUrlBr
}
