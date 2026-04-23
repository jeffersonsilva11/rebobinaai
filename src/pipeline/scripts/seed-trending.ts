// src/pipeline/scripts/seed-trending.ts
// Script: busca trending semanal do TMDB e dispara ingestão

import { prisma } from '../../lib/db'
import { tmdb } from '../../lib/apis/tmdb'
import { ingestTitle } from '../jobs/ingest-title'

async function main() {
  console.log('→ Buscando trending semanal do TMDB...')

  const [trendingMovies, trendingSeries] = await Promise.all([
    tmdb.getTrending('movie', 'week'),
    tmdb.getTrending('tv', 'week'),
  ])

  const toIngest = [
    ...trendingMovies.map((t: any) => ({ tmdbId: t.id, type: 'MOVIE' as const })),
    ...trendingSeries.map((t: any) => ({ tmdbId: t.id, type: 'SERIES' as const })),
  ]

  console.log(`→ ${toIngest.length} títulos em alta\n`)

  let processed = 0
  let skipped = 0

  for (const item of toIngest) {
    const exists = await prisma.title.findFirst({
      where: { tmdbId: item.tmdbId },
      select: { id: true, enrichedAt: true },
    })

    if (exists?.enrichedAt) {
      skipped++
      continue
    }

    try {
      await ingestTitle(item)
      processed++
      console.log(`✓ [${processed}/${toIngest.length}] ${item.tmdbId}`)
    } catch (err: any) {
      console.error(`× ${item.tmdbId}:`, err.message)
    }

    await new Promise((r) => setTimeout(r, 1500))
  }

  console.log(`\n✓ ${processed} processados, ${skipped} já existiam`)
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
