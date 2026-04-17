/**
 * BCIS — Export Worker (Phase 7 stub)
 *
 * Run via: tsx src/workers/export-worker.ts
 * Do NOT run via node directly — this worker imports ESM modules from Prisma 7.
 *
 * Phase 7 stub. Real export logic will be implemented in a later phase.
 */

import { Worker } from 'bullmq'
import { QUEUE_NAMES } from '../lib/queues'
import type { ExportJobData } from '../types/jobs.types'

// ---------------------------------------------------------------------------
// Redis connection
// ---------------------------------------------------------------------------

function getRedisConnection() {
  const url = process.env.REDIS_URL
  if (url) {
    try {
      const parsed = new URL(url)
      return {
        host:     parsed.hostname || 'localhost',
        port:     parseInt(parsed.port || '6379', 10),
        password: parsed.password || undefined,
        username: parsed.username || undefined,
        tls:      parsed.protocol === 'rediss:' ? {} : undefined,
      }
    } catch {
      console.warn('[export-worker] Could not parse REDIS_URL; using localhost:6379')
    }
  } else {
    console.warn('[export-worker] REDIS_URL not set; connecting to localhost:6379')
  }
  return { host: 'localhost', port: 6379 }
}

// ---------------------------------------------------------------------------
// Worker (stub)
// ---------------------------------------------------------------------------

const worker = new Worker<ExportJobData>(
  QUEUE_NAMES.EXPORT,
  async (job) => {
    console.log(
      `[export-worker] Export job received — not yet implemented. ` +
      `Job ${job.id}, requestedBy: ${job.data.requestedBy}`,
    )
    // Phase 7 stub: complete successfully without doing real work
    return { stub: true, message: 'Export not yet implemented' }
  },
  {
    connection: getRedisConnection(),
    concurrency: 1,
  },
)

// ---------------------------------------------------------------------------
// Worker lifecycle events
// ---------------------------------------------------------------------------

worker.on('completed', (job) => {
  console.log(`[export-worker] ✓ Job ${job.id} (stub) acknowledged`)
})

worker.on('failed', (job, err) => {
  console.error(`[export-worker] ✗ Job ${job?.id ?? 'unknown'} failed:`, err.message)
})

worker.on('error', (err) => {
  console.error('[export-worker] Worker error (non-fatal):', err.message)
})

console.log('[export-worker] Started (stub) — listening on queue:', QUEUE_NAMES.EXPORT)
