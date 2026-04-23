// src/pipeline/jobs/ingest-title.ts
// Job principal: busca todos os dados de 1 título e salva no banco

import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { tmdb } from '@/lib/apis/tmdb'
import { omdb as omdbClient } from '@/lib/apis/omdb'
import { youtube } from '@/lib/apis/youtube'
import { enrichTitle } from './enrich-title'

type Tx = Prisma.TransactionClient

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
  const slug = generateSlug(tmdbData.titleOriginal, tmdbData.year)

  // 3. Busca em paralelo (mais rápido)
  const [omdbResult, credits, externalIds, availability, videos] = await Promise.allSettled([
    omdbClient.getByImdbId(tmdbData.imdbId),
    tmdb.getCredits(tmdbId, type),
    tmdb.getExternalIds(tmdbId, type),
    tmdb.getWatchProviders(tmdbId, type, 'BR'),
    tmdb.getVideos(tmdbId, type),
  ])

  const omdb = getValue(omdbResult)
  const cast = getValue(credits)
  const socials = getValue(externalIds)
  const providers = getValue(availability)
  const videoList = getValue(videos)

  // 4. Busca trailer no YouTube como fallback
  const trailerYoutubeId = videoList?.trailerKey
    ?? await youtube.findTrailer(`${tmdbData.titleOriginal} trailer oficial`)

  // 5-9. Escrita atômica no banco (tudo ou nada)
  const title = await prisma.$transaction(async (tx) => {
    // Upsert do título principal
    const t = await tx.title.upsert({
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
        status: 'DRAFT',
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

    // Notas
    if (omdb || tmdbData.voteAverage) {
      await tx.rating.upsert({
        where: { titleId: t.id },
        create: {
          titleId: t.id,
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

    // Gêneros / cast / availability — dependem do Title existir, por isso dentro da mesma tx
    if (tmdbData.genres?.length) await syncGenres(tx, t.id, tmdbData.genres)
    if (cast) await syncCast(tx, t.id, cast)
    if (providers) await syncAvailability(tx, t.id, providers)

    return t
  }, { timeout: 30_000 })

  console.log(`[ingest] Base salva para "${title.titleOriginal}" (${title.id})`)

  // 10. Enriquecimento por IA — fora da transação (chama APIs externas, pode demorar)
  await enrichTitle({ titleId: title.id, overview: tmdbData.overview })

  return title
}

// ─────────────────────────────────────
// Sincroniza gêneros
// ─────────────────────────────────────
async function syncGenres(tx: Tx, titleId: string, genres: { id: number; name: string }[]) {
  for (const g of genres) {
    const genre = await tx.genre.upsert({
      where: { tmdbId: g.id },
      create: {
        tmdbId: g.id,
        nameEn: g.name,
        namePt: translateGenre(g.name),
        slug: slugify(g.name),
      },
      update: {},
    })

    await tx.titleGenre.upsert({
      where: { titleId_genreId: { titleId, genreId: genre.id } },
      create: { titleId, genreId: genre.id },
      update: {},
    })
  }
}

// ─────────────────────────────────────
// Sincroniza elenco
// ─────────────────────────────────────
async function syncCast(tx: Tx, titleId: string, credits: any) {
  const allPeople = [
    ...(credits.cast?.slice(0, 15) ?? []).map((p: any) => ({ ...p, role: 'ACTOR' })),
    ...(credits.crew?.filter((p: any) =>
      ['Director', 'Screenplay', 'Writer', 'Director of Photography', 'Original Music Composer'].includes(p.job)
    ) ?? []).map((p: any) => ({ ...p, role: mapCrewRole(p.job) })),
  ]

  for (const person of allPeople) {
    const p = await tx.person.upsert({
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

    await tx.titleCast.upsert({
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
async function syncAvailability(tx: Tx, titleId: string, providers: any) {
  const br = providers?.BR
  if (!br) return

  await tx.titleAvailability.updateMany({
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
    const platform = await tx.platform.findFirst({
      where: { tmdbProviderId: entry.provider_id },
    })

    if (!platform) continue

    const deeplink = buildDeeplink(platform, br.link)

    await tx.titleAvailability.upsert({
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
        deeplinkUrl: deeplink,
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

function buildDeeplink(platform: any, tmdbLink?: string): string | null {
  if (tmdbLink) return tmdbLink
  if (!platform.baseUrlBr) return null
  return platform.baseUrlBr
}
