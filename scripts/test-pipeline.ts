// scripts/test-pipeline.ts
// Testa pipeline com 5 títulos variados

import { ingestTitle } from '../src/pipeline/jobs/ingest-title'

const titles = [
  { tmdbId: 238,   type: 'MOVIE'  as const }, // O Poderoso Chefão
  { tmdbId: 27205, type: 'MOVIE'  as const }, // A Origem
  { tmdbId: 550,   type: 'MOVIE'  as const }, // Clube da Luta
  { tmdbId: 1396,  type: 'SERIES' as const }, // Breaking Bad
  { tmdbId: 66732, type: 'SERIES' as const }, // Stranger Things
]

async function main() {
  for (const t of titles) {
    console.log(`\n→ Ingerindo ${t.tmdbId}...`)
    try {
      await ingestTitle(t)
    } catch (err: any) {
      console.error(`× Erro em ${t.tmdbId}:`, err.message)
    }
    await new Promise(r => setTimeout(r, 2000))
  }
  console.log('\n✓ Pipeline testado com sucesso')
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
