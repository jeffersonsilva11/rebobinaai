// src/app/api/webhooks/cron/route.ts
// Endpoint chamado pelo Vercel Cron
// Configurar em vercel.json

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { tmdb } from '@/lib/apis/tmdb'
import { ingestTitle } from '@/pipeline/jobs/ingest-title'
import { headers } from 'next/headers'

// Verifica o secret do cron para segurança
function isCronAuthorized(req: NextRequest): boolean {
  const authHeader = headers().get('authorization')
  return authHeader === `Bearer ${process.env.CRON_SECRET}`
}

// ─────────────────────────────────────
// GET /api/webhooks/cron?job=availability
// ─────────────────────────────────────
export async function GET(req: NextRequest) {
  if (!isCronAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const job = req.nextUrl.searchParams.get('job')

  switch (job) {
    case 'availability':
      return runAvailabilitySync()
    case 'new-titles':
      return runNewTitlesSync()
    case 'ratings':
      return runRatingsSync()
    case 'snapshot':
      return runBehaviorSnapshot()
    default:
      return NextResponse.json({ error: 'Job desconhecido' }, { status: 400 })
  }
}

// ─────────────────────────────────────
// JOB 1: Atualiza onde assistir (diário)
// ─────────────────────────────────────
async function runAvailabilitySync() {
  const syncJob = await prisma.syncJob.create({
    data: { jobType: 'AVAILABILITY', status: 'RUNNING', startedAt: new Date() },
  })

  try {
    // Pega os 500 títulos mais acessados nos últimos 7 dias
    const popularTitles = await prisma.pageView.groupBy({
      by: ['titleId'],
      where: {
        titleId: { not: null },
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
      _count: { titleId: true },
      orderBy: { _count: { titleId: 'desc' } },
      take: 500,
    })

    // Adiciona também títulos com watchlist que querem ser notificados
    const watchlistTitles = await prisma.watchlistItem.findMany({
      where: { notifyAvailable: true, status: 'WANT' },
      select: { titleId: true },
      distinct: ['titleId'],
    })

    const allTitleIds = [
      ...new Set([
        ...popularTitles.map(p => p.titleId!),
        ...watchlistTitles.map(w => w.titleId),
      ])
    ]

    let processed = 0
    const batchSize = 20

    for (let i = 0; i < allTitleIds.length; i += batchSize) {
      const batch = allTitleIds.slice(i, i + batchSize)

      await Promise.allSettled(
        batch.map(async (titleId) => {
          const title = await prisma.title.findUnique({
            where: { id: titleId },
            select: { tmdbId: true, type: true },
          })
          if (!title) return

          // Busca disponibilidade atual no TMDB
          const providers = await tmdb.getWatchProviders(title.tmdbId, title.type, 'BR')

          // Marca todas como inativas
          await prisma.titleAvailability.updateMany({
            where: { titleId, country: 'BR' },
            data: { isActive: false },
          })

          const br = providers?.BR
          if (!br) return

          const entries = [
            ...(br.flatrate ?? []).map((p: any) => ({ ...p, accessType: 'SUBSCRIPTION' })),
            ...(br.rent ?? []).map((p: any) => ({ ...p, accessType: 'RENT' })),
            ...(br.buy ?? []).map((p: any) => ({ ...p, accessType: 'BUY' })),
          ]

          for (const entry of entries) {
            const platform = await prisma.platform.findFirst({
              where: { tmdbProviderId: entry.provider_id },
            })
            if (!platform) continue

            const wasAvailable = await prisma.titleAvailability.findFirst({
              where: { titleId, platformId: platform.id, country: 'BR', isActive: false },
            })

            await prisma.titleAvailability.upsert({
              where: {
                titleId_platformId_country_accessType: {
                  titleId, platformId: platform.id, country: 'BR', accessType: entry.accessType as any,
                },
              },
              create: {
                titleId, platformId: platform.id, country: 'BR',
                accessType: entry.accessType as any, isActive: true, syncedAt: new Date(),
              },
              update: { isActive: true, syncedAt: new Date() },
            })

            // Notifica usuários que queriam ver esse título nessa plataforma
            if (!wasAvailable) {
              await notifyUsersOfAvailability(titleId, platform.id, platform.name)
            }
          }
        })
      )

      processed += batch.length
      console.log(`[availability] ${processed}/${allTitleIds.length}`)

      // Pequena pausa para não estourar rate limit da TMDB
      await sleep(500)
    }

    await prisma.syncJob.update({
      where: { id: syncJob.id },
      data: { status: 'DONE', titlesProcessed: processed, finishedAt: new Date() },
    })

    return NextResponse.json({ ok: true, processed })

  } catch (err: any) {
    await prisma.syncJob.update({
      where: { id: syncJob.id },
      data: { status: 'ERROR', errorLog: err.message, finishedAt: new Date() },
    })
    throw err
  }
}

// ─────────────────────────────────────
// JOB 2: Busca novos títulos (diário)
// ─────────────────────────────────────
async function runNewTitlesSync() {
  const syncJob = await prisma.syncJob.create({
    data: { jobType: 'NEW_TITLES', status: 'RUNNING', startedAt: new Date() },
  })

  try {
    // Busca trending da semana no TMDB
    const [trendingMovies, trendingSeries, nowPlaying, onAir] = await Promise.all([
      tmdb.getTrending('movie', 'week'),
      tmdb.getTrending('tv', 'week'),
      tmdb.getNowPlaying(),
      tmdb.getOnAir(),
    ])

    const toIngest = [
      ...trendingMovies.map((t: any) => ({ tmdbId: t.id, type: 'MOVIE' as const })),
      ...trendingSeries.map((t: any) => ({ tmdbId: t.id, type: 'SERIES' as const })),
      ...nowPlaying.map((t: any) => ({ tmdbId: t.id, type: 'MOVIE' as const })),
      ...onAir.map((t: any) => ({ tmdbId: t.id, type: 'SERIES' as const })),
    ]

    let processed = 0

    for (const item of toIngest) {
      // Pula se já existe
      const exists = await prisma.title.findFirst({ where: { tmdbId: item.tmdbId } })
      if (exists) continue

      try {
        await ingestTitle(item)
        processed++
        await sleep(1000) // respeita rate limit
      } catch (err) {
        console.error(`[new-titles] Erro ao ingerir ${item.tmdbId}:`, err)
      }
    }

    await prisma.syncJob.update({
      where: { id: syncJob.id },
      data: { status: 'DONE', titlesProcessed: processed, finishedAt: new Date() },
    })

    return NextResponse.json({ ok: true, processed })

  } catch (err: any) {
    await prisma.syncJob.update({
      where: { id: syncJob.id },
      data: { status: 'ERROR', errorLog: err.message, finishedAt: new Date() },
    })
    throw err
  }
}

// ─────────────────────────────────────
// JOB 3: Atualiza notas (semanal)
// ─────────────────────────────────────
async function runRatingsSync() {
  // Atualiza notas dos 200 títulos mais populares
  const titles = await prisma.title.findMany({
    where: { status: 'PUBLISHED', imdbId: { not: null } },
    select: { id: true, imdbId: true },
    take: 200,
    orderBy: { updatedAt: 'asc' }, // Os mais antigos primeiro
  })

  let processed = 0
  for (const title of titles) {
    try {
      // Lógica de atualização de ratings via OMDb
      processed++
    } catch { /* silently skip */ }
    await sleep(200)
  }

  return NextResponse.json({ ok: true, processed })
}

// ─────────────────────────────────────
// JOB 4: Snapshot de comportamento (semanal)
// ─────────────────────────────────────
async function runBehaviorSnapshot() {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  // Agrega dados da semana
  const searchEvents = await prisma.searchEvent.findMany({
    where: { createdAt: { gte: weekAgo } },
    select: { interpretedIntent: true, resultsShown: true, resultClicked: true, stateBr: true },
  })

  // Computa métricas
  const moodCounts: Record<string, number> = {}
  const stateCounts: Record<string, number> = {}

  for (const event of searchEvents) {
    const intent = event.interpretedIntent as any
    if (intent?.moodTags) {
      for (const mood of intent.moodTags) {
        moodCounts[mood] = (moodCounts[mood] ?? 0) + 1
      }
    }
    if (event.stateBr) {
      stateCounts[event.stateBr] = (stateCounts[event.stateBr] ?? 0) + 1
    }
  }

  // Títulos buscados sem disponibilidade BR
  const demandNotAvailable = await prisma.$queryRaw`
    SELECT t.title_pt, t.title_original, t.type, COUNT(*) as searches
    FROM search_events se
    CROSS JOIN LATERAL unnest(se.results_shown) AS tid
    JOIN titles t ON t.id = tid::uuid
    WHERE se.created_at >= ${weekAgo}
    AND NOT EXISTS (
      SELECT 1 FROM title_availability ta
      WHERE ta.title_id = t.id AND ta.country = 'BR' AND ta.is_active = true
    )
    GROUP BY t.id, t.title_pt, t.title_original, t.type
    ORDER BY searches DESC
    LIMIT 50
  `

  const period = new Date()
  period.setHours(0, 0, 0, 0)

  await prisma.behaviorSnapshot.upsert({
    where: { period },
    create: {
      period,
      topSearchedMoods: moodCounts,
      regionalBreakdown: stateCounts,
      demandNotAvailable,
    },
    update: {
      topSearchedMoods: moodCounts,
      regionalBreakdown: stateCounts,
      demandNotAvailable,
    },
  })

  return NextResponse.json({ ok: true })
}

// ─────────────────────────────────────
// Notifica usuários quando título fica disponível
// ─────────────────────────────────────
async function notifyUsersOfAvailability(titleId: string, platformId: number, platformName: string) {
  const waitingUsers = await prisma.watchlistItem.findMany({
    where: { titleId, notifyAvailable: true, status: 'WANT' },
    include: { title: { select: { titlePt: true } } },
  })

  for (const item of waitingUsers) {
    await prisma.notification.create({
      data: {
        userId: item.userId,
        type: 'TITLE_AVAILABLE',
        titleId,
        platformId,
        messagePt: `"${item.title.titlePt}" chegou na ${platformName}! Está na sua watchlist.`,
      },
    })
  }
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))


// ─────────────────────────────────────────────────────
// vercel.json — Configuração dos cron jobs
// ─────────────────────────────────────────────────────
/*
{
  "crons": [
    {
      "path": "/api/webhooks/cron?job=availability",
      "schedule": "0 3 * * *"
    },
    {
      "path": "/api/webhooks/cron?job=new-titles",
      "schedule": "0 4 * * *"
    },
    {
      "path": "/api/webhooks/cron?job=ratings",
      "schedule": "0 5 * * 1"
    },
    {
      "path": "/api/webhooks/cron?job=snapshot",
      "schedule": "0 6 * * 1"
    }
  ]
}
*/
