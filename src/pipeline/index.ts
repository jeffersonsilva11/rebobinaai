// src/pipeline/index.ts
// Entry point do worker BullMQ

import { Worker } from 'bullmq'
import IORedis from 'ioredis'
import { ingestTitle } from './jobs/ingest-title'
import { enrichTitle } from './jobs/enrich-title'
import { syncTitleAvailability } from './jobs/sync-availability'
import { syncTitleRatings } from './jobs/sync-ratings'

const connection = new IORedis(process.env.REDIS_URL ?? 'redis://localhost:6380', {
  maxRetriesPerRequest: null,
})

new Worker('ingest-title', async (job) => ingestTitle(job.data), { connection, concurrency: 3 })
new Worker('enrich-title', async (job) => enrichTitle(job.data), { connection, concurrency: 5 })
new Worker('sync-availability', async (job) => syncTitleAvailability(job.data.titleId), {
  connection, concurrency: 10,
})
new Worker('sync-ratings', async (job) => syncTitleRatings(job.data.titleId), {
  connection, concurrency: 5,
})

console.log('[pipeline] Workers iniciados (ingest, enrich, sync-availability, sync-ratings)')
