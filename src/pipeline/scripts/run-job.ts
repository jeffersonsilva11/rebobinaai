// src/pipeline/scripts/run-job.ts
// Roda um job avulso pela CLI
// npx tsx src/pipeline/scripts/run-job.ts enrich <titleId>

import { ingestTitle } from '../jobs/ingest-title'
import { enrichTitle } from '../jobs/enrich-title'
import { syncTitleAvailability } from '../jobs/sync-availability'

const [job, arg] = process.argv.slice(2)

async function main() {
  switch (job) {
    case 'ingest': {
      const [tmdbId, type] = arg.split(':')
      await ingestTitle({ tmdbId: Number(tmdbId), type: type as 'MOVIE' | 'SERIES' })
      break
    }
    case 'enrich':
      await enrichTitle({ titleId: arg })
      break
    case 'sync':
      await syncTitleAvailability(arg)
      break
    default:
      console.error('Uso: run-job.ts <ingest|enrich|sync> <arg>')
      process.exit(1)
  }
  console.log('✓ Job concluído')
}

main().then(() => process.exit(0))
