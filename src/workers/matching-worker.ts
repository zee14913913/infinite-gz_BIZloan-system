/**
 * BCIS — Matching Engine Worker
 *
 * Run via: tsx src/workers/matching-worker.ts
 * Do NOT run via node directly — this worker imports ESM modules from Prisma 7.
 */

import { Worker } from 'bullmq'
import { prisma } from '../lib/prisma'
import { mapCaseToEngineCase } from '../server/matching/mapCaseToEngineCase'
import { mapProductToPolicyConfig } from '../server/matching/mapProductToPolicyConfig'
import { runMatchingEngine } from '../server/matching/runMatchingEngine'
import { persistMatchingResults } from '../server/matching/persistMatchingResults'
import {
  GLOBAL_ENGINE_DEFAULTS_BASELINE,
  getTemporaryBankPolicyConfig,
} from '../server/matching/baseline-config'
import { QUEUE_NAMES } from '../lib/queues'
import type { MatchingJobData } from '../types/jobs.types'

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
      console.warn('[matching-worker] Could not parse REDIS_URL; using localhost:6379')
    }
  } else {
    console.warn('[matching-worker] REDIS_URL not set; connecting to localhost:6379')
  }
  return { host: 'localhost', port: 6379 }
}

const SCORE_ORDER: Record<string, number> = { HIGH: 0, MEDIUM: 1, LOW: 2, INELIGIBLE: 3 }

// ---------------------------------------------------------------------------
// Worker
// ---------------------------------------------------------------------------

const worker = new Worker<MatchingJobData>(
  QUEUE_NAMES.MATCHING,
  async (job) => {
    const { caseId, triggeredBy } = job.data
    console.log(`[matching-worker] Job ${job.id} started — caseId: ${caseId}, triggeredBy: ${triggeredBy}`)

    // Load case
    const caseRecord = await prisma.case.findUnique({
      where: { id: caseId },
      include: {
        client: true,
        financials: { include: { collaterals: true } },
      },
    })
    if (!caseRecord) throw new Error(`Case ${caseId} not found`)

    // Load products
    const products = await prisma.product.findMany({
      where:   { is_active: true },
      include: { bank: true },
      take:    50,
    })
    if (products.length === 0) {
      console.log(`[matching-worker] Job ${job.id} — no active products, nothing to match`)
      return { evaluated: 0, persisted: 0 }
    }

    // Run engine
    const engineCase   = mapCaseToEngineCase(caseRecord)
    const productResults = products.map(product => {
      const productConfig = mapProductToPolicyConfig(product)
      const bankConfig    = getTemporaryBankPolicyConfig(product.bank.code)
      const engineResult  = runMatchingEngine(
        engineCase, productConfig, bankConfig, GLOBAL_ENGINE_DEFAULTS_BASELINE,
      )
      return { productId: product.id, engineResult }
    })

    // Persist
    const persisted = await persistMatchingResults(caseId, productResults)

    // Log top 3
    const sorted = [...productResults].sort(
      (a, b) => (SCORE_ORDER[a.engineResult.matchScore] ?? 9) - (SCORE_ORDER[b.engineResult.matchScore] ?? 9),
    )
    const topSummary = sorted.slice(0, 3).map(r =>
      `${r.productId}:${r.engineResult.matchScore}`
    ).join(', ')

    console.log(
      `[matching-worker] Job ${job.id} completed — ` +
      `evaluated: ${products.length}, persisted: ${persisted}, top3: [${topSummary}]`,
    )
    return { evaluated: products.length, persisted }
  },
  {
    connection: getRedisConnection(),
    concurrency: 1,  // matching is CPU-heavier; process one at a time
  },
)

// ---------------------------------------------------------------------------
// Worker lifecycle events
// ---------------------------------------------------------------------------

worker.on('completed', (job) => {
  console.log(`[matching-worker] ✓ Job ${job.id} finished successfully`)
})

worker.on('failed', (job, err) => {
  console.error(`[matching-worker] ✗ Job ${job?.id ?? 'unknown'} failed:`, err.message)
})

worker.on('error', (err) => {
  console.error('[matching-worker] Worker error (non-fatal):', err.message)
})

console.log('[matching-worker] Started — listening on queue:', QUEUE_NAMES.MATCHING)
