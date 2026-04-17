// =============================================================================
// BCIS — BullMQ Queue Definitions
//
// Shared queue infrastructure for all background workers.
// Redis connection is lazy: queues are defined at module load but connections
// are not established until the first enqueue or worker start.
// =============================================================================

import { Queue } from 'bullmq'

// ---------------------------------------------------------------------------
// Queue name constants — single source of truth
// ---------------------------------------------------------------------------

export const QUEUE_NAMES = {
  EVIDENCE: 'bcis-evidence',
  MATCHING: 'bcis-matching',
  EXPORT:   'bcis-export',
} as const

// ---------------------------------------------------------------------------
// Redis connection config
// ---------------------------------------------------------------------------

function getRedisConnection() {
  const url = process.env.REDIS_URL
  if (!url) {
    console.warn(
      '[BCIS] REDIS_URL is not set. BullMQ workers will attempt to connect to redis://localhost:6379. ' +
      'Set REDIS_URL in your .env.local for non-default Redis hosts.',
    )
  }

  // BullMQ accepts a connection string directly as of v5.
  // Parse a redis:// URL into host/port for ioredis.
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
      console.warn('[BCIS] Could not parse REDIS_URL; falling back to localhost:6379')
    }
  }

  return { host: 'localhost', port: 6379 }
}

// Single shared connection config — all queues use the same object reference
const redisConnection = getRedisConnection()

// ---------------------------------------------------------------------------
// Queue instances
// ---------------------------------------------------------------------------

export const evidenceQueue = new Queue(QUEUE_NAMES.EVIDENCE, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts:    3,
    backoff:     { type: 'exponential', delay: 2000 },
    removeOnComplete: { count: 100 },
    removeOnFail:     { count: 50 },
  },
})

export const matchingQueue = new Queue(QUEUE_NAMES.MATCHING, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts:    2,
    backoff:     { type: 'exponential', delay: 3000 },
    removeOnComplete: { count: 100 },
    removeOnFail:     { count: 50 },
  },
})

export const exportQueue = new Queue(QUEUE_NAMES.EXPORT, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts:    1,
    removeOnComplete: { count: 50 },
    removeOnFail:     { count: 25 },
  },
})
