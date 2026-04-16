// src/pipeline/queues.ts
// Definição das filas BullMQ

import { Queue } from 'bullmq'
import IORedis from 'ioredis'

const connection = new IORedis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
})

export const ingestQueue = new Queue('ingest-title', { connection })
export const enrichQueue = new Queue('enrich-title', { connection })
export const syncQueue = new Queue('sync-availability', { connection })
