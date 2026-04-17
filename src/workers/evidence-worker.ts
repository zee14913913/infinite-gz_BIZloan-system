/**
 * BCIS — Evidence Cross-Validation Worker
 *
 * Run via: tsx src/workers/evidence-worker.ts
 * Do NOT run via node directly — this worker imports ESM modules from Prisma 7.
 */

import { Worker } from 'bullmq'
import { crossValidateProduct } from '../server/evidence/crossValidate'
import { QUEUE_NAMES } from '../lib/queues'
import type { EvidenceJobData } from '../types/jobs.types'

// ---------------------------------------------------------------------------
// Redis connection (same parsing logic as queues.ts)
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
      console.warn('[evidence-worker] Could not parse REDIS_URL; using localhost:6379')
    }
  } else {
    console.warn('[evidence-worker] REDIS_URL not set; connecting to localhost:6379')
  }
  return { host: 'localhost', port: 6379 }
}

// ---------------------------------------------------------------------------
// Worker
// ---------------------------------------------------------------------------

const worker = new Worker<EvidenceJobData>(
  QUEUE_NAMES.EVIDENCE,
  async (job) => {
    const { productId } = job.data
    console.log(`[evidence-worker] Job ${job.id} started — productId: ${productId}`)

    const summary = await crossValidateProduct(productId)

    console.log(
      `[evidence-worker] Job ${job.id} completed — ` +
      `created: ${summary.created}, updated: ${summary.updated}, ` +
      `skippedLocked: ${summary.skippedLocked}`,
    )
    return summary
  },
  {
    connection: getRedisConnection(),
    concurrency: 2,
  },
)

// ---------------------------------------------------------------------------
// Worker lifecycle events
// ---------------------------------------------------------------------------

worker.on('completed', (job) => {
  console.log(`[evidence-worker] ✓ Job ${job.id} finished successfully`)
})

worker.on('failed', (job, err) => {
  // Log failure but do NOT crash the worker process
  console.error(`[evidence-worker] ✗ Job ${job?.id ?? 'unknown'} failed:`, err.message)
})

worker.on('error', (err) => {
  console.error('[evidence-worker] Worker error (non-fatal):', err.message)
})

console.log('[evidence-worker] Started — listening on queue:', QUEUE_NAMES.EVIDENCE)
