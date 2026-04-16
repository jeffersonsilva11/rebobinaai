// src/app/api/webhooks/cron/route.ts
// Endpoint chamado pelo Vercel Cron

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { tmdb } from '@/lib/apis/tmdb'
import { ingestTitle } from '@/pipeline/jobs/ingest-title'
import { syncTitleRatings } from '@/pipeline/jobs/sync-ratings'
import { headers } from 'next/headers'

function isCronAuthorized(): boolean {
  const authHeader = headers().get('authorization')
  return authHeader === `Bearer ${process.env.CRON_SECRET}`
}

// Rota cron é sempre dinâmica (roda sob demanda do Vercel Cron)
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  if (!isCronAuthorized()) {
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
// JOB 1: Atualiza onde assistir
// ─────────────────────────────────────
async function runAvailabilitySync() {
  const syncJob = await prisma.syncJob.create({
    data: { jobType: 'AVAILABILITY', status: 'RUNNING', startedAt: new Date() },
  })

  try {
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

    const watchlistTitles = await prisma.watchlistItem.findMany({
      where: { notifyAvailable: true, status: 'WANT' },
      select: { titleId: true },
      distinct: ['titleId'],
    })

    const allTitleIds = Array.from(new Set([
      ...popularTitles.map((p) => p.titleId!),
      ...watchlistTitles.map((w) => w.titleId),
    ]))

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

          const providers = await tmdb.getWatchProviders(title.tmdbId, title.type, 'BR')

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

            if (!wasAvailable) {
              await notifyUsersOfAvailability(titleId, platform.id, platform.name)
            }
          }
        })
      )

      processed += batch.length
      console.log(`[availability] ${processed}/${allTitleIds.length}`)

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
// JOB 2: Busca novos títulos
// ─────────────────────────────────────
async function runNewTitlesSync() {
  const syncJob = await prisma.syncJob.create({
    data: { jobType: 'NEW_TITLES', status: 'RUNNING', startedAt: new Date() },
  })

  try {
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
      const exists = await prisma.title.findFirst({ where: { tmdbId: item.tmdbId } })
      if (exists) continue

      try {
        await ingestTitle(item)
        processed++
        await sleep(1000)
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
// JOB 3: Atualiza notas
// ─────────────────────────────────────
async function runRatingsSync() {
  const titles = await prisma.title.findMany({
    where: { status: 'PUBLISHED', imdbId: { not: null } },
    select: { id: true, imdbId: true },
    take: 200,
    orderBy: { updatedAt: 'asc' },
  })

  let processed = 0
  for (const title of titles) {
    try {
      await syncTitleRatings(title.id)
      processed++
    } catch { /* silently skip */ }
    await sleep(200)
  }

  return NextResponse.json({ ok: true, processed })
}

// ─────────────────────────────────────
// JOB 4: Snapshot de comportamento
// ─────────────────────────────────────
async function runBehaviorSnapshot() {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const searchEvents = await prisma.searchEvent.findMany({
    where: { createdAt: { gte: weekAgo } },
    select: { interpretedIntent: true, resultsShown: true, resultClicked: true, stateBr: true },
  })

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

  const period = new Date()
  period.setHours(0, 0, 0, 0)

  await prisma.behaviorSnapshot.upsert({
    where: { period },
    create: {
      period,
      topSearchedMoods: moodCounts,
      regionalBreakdown: stateCounts,
    },
    update: {
      topSearchedMoods: moodCounts,
      regionalBreakdown: stateCounts,
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

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
