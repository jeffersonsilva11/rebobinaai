// src/pipeline/index.ts
// Entry point do worker BullMQ

import { Worker } from 'bullmq'
import IORedis from 'ioredis'
import { ingestTitle } from './jobs/ingest-title'
import { enrichTitle } from './jobs/enrich-title'
import { syncTitleAvailability } from './jobs/sync-availability'

const connection = new IORedis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
})

new Worker('ingest-title', async (job) => ingestTitle(job.data), { connection })
new Worker('enrich-title', async (job) => enrichTitle(job.data), { connection })
new Worker('sync-availability', async (job) => syncTitleAvailability(job.data.titleId), {
  connection,
})

console.log('[pipeline] Workers iniciados')
