// src/pipeline/scripts/seed-top-titles.ts
// Popula banco com títulos populares do TMDB

import { prisma } from '../../lib/db'
import { tmdb } from '../../lib/apis/tmdb'
import { ingestTitle } from '../jobs/ingest-title'

const args = process.argv.slice(2)
const limit = parseInt(args[args.indexOf('--limit') + 1] ?? '50')
const statusOnly = args.includes('--status')
const verbose = args.includes('--verbose')

async function showStatus() {
  const total = await prisma.title.count()
  const published = await prisma.title.count({ where: { status: 'PUBLISHED' } })
  const draft = await prisma.title.count({ where: { status: 'DRAFT' } })
  console.log(`
═══ STATUS ═══
Total:      ${total}
Publicados: ${published}
Drafts:     ${draft}
`)
}

async function main() {
  if (statusOnly) {
    await showStatus()
    process.exit(0)
  }

  console.log(`→ Buscando ${limit} títulos populares...`)

  // Busca em múltiplas páginas (20 por página)
  const pages = Math.ceil(limit / 20)
  const toIngest: { tmdbId: number; type: 'MOVIE' | 'SERIES' }[] = []

  for (let page = 1; page <= pages; page++) {
    const [movies, series] = await Promise.all([
      tmdb.getPopularMovies(page),
      tmdb.getPopularSeries(page),
    ])

    toIngest.push(...movies.map((m: any) => ({ tmdbId: m.id, type: 'MOVIE' as const })))
    toIngest.push(...series.map((s: any) => ({ tmdbId: s.id, type: 'SERIES' as const })))
  }

  const unique = toIngest.slice(0, limit)
  console.log(`→ ${unique.length} títulos para processar\n`)

  let processed = 0
  let skipped = 0

  for (const item of unique) {
    const exists = await prisma.title.findFirst({
      where: { tmdbId: item.tmdbId },
      select: { id: true, enrichedAt: true },
    })

    if (exists?.enrichedAt) {
      skipped++
      if (verbose) console.log(`- ${item.tmdbId} já existe, pulando`)
      continue
    }

    try {
      await ingestTitle(item)
      processed++
      console.log(`✓ [${processed}/${unique.length}] tmdbId=${item.tmdbId}`)
    } catch (err: any) {
      console.error(`× tmdbId=${item.tmdbId}:`, err.message)
    }

    // Respeita rate limit
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
