// =============================================================================
// BCIS — Cross-Validation Engine
//
// Accepts all FieldEvidence for a product, groups by (field_name, step_type),
// runs a deterministic confidence algorithm, and upserts FieldDecision +
// FieldDecisionEvidence join records.
//
// Rules:
// - No AI/LLM calls. Pure deterministic logic.
// - Does NOT write to supporting_evidence_ids (deprecated field).
// - Does NOT touch records where human_overridden = true.
// - Does NOT operate on hardcoded field names; runs on whatever evidence exists.
// =============================================================================

import { prisma } from '@/lib/prisma'
import { GLOBAL_ENGINE_DEFAULTS_BASELINE } from '@/server/matching/baseline-config'
import type { FieldEvidence, FieldConfidence, ValueType } from '@/generated/prisma/client'

// ---------------------------------------------------------------------------
// Source channel reliability weights
// Used to weight votes when multiple sources agree/conflict on a value.
// ---------------------------------------------------------------------------

const CHANNEL_WEIGHT: Record<string, number> = {
  OFFICIAL_BANK_WEBSITE:  1.5,
  OFFICIAL_CGC_SJPP_BNM:  1.5,
  AUTHORITY_PLATFORM:     1.2,
  INTERNAL_HANDBOOK:      1.0,
  FINANCIAL_MEDIA:        1.0,
  ADVISOR_CONSULTANT:     0.8,
  APPLICANT_COMMUNITY:    0.6,
}

function weightOf(channel: string): number {
  return CHANNEL_WEIGHT[channel] ?? 1.0
}

// ---------------------------------------------------------------------------
// Normalise a value for comparison: lowercase, trim, collapse whitespace
// ---------------------------------------------------------------------------

function normaliseForCompare(v: string | null | undefined): string {
  if (!v) return ''
  return v.toLowerCase().replace(/\s+/g, ' ').trim()
}

// ---------------------------------------------------------------------------
// Group evidence records into clusters by their normalised_value (or raw_value
// if normalized_value is absent). Each cluster accumulates total weight.
// ---------------------------------------------------------------------------

interface ValueCluster {
  canonicalValue:  string  // the raw/normalized value as provided
  normalised:      string  // lowercased for comparison
  totalWeight:     number
  evidenceIds:     string[]
  sources:         string[]
}

function buildClusters(records: FieldEvidence[]): ValueCluster[] {
  const clusters: ValueCluster[] = []

  for (const ev of records) {
    const canonical = ev.normalized_value ?? ev.raw_value ?? ev.raw_text
    const norm      = normaliseForCompare(canonical)
    const weight    = weightOf(ev.source_channel)

    const existing = clusters.find(c => c.normalised === norm)
    if (existing) {
      existing.totalWeight += weight
      existing.evidenceIds.push(ev.id)
      if (ev.source_url) existing.sources.push(ev.source_url)
    } else {
      clusters.push({
        canonicalValue: canonical,
        normalised:     norm,
        totalWeight:    weight,
        evidenceIds:    [ev.id],
        sources:        ev.source_url ? [ev.source_url] : [],
      })
    }
  }

  return clusters.sort((a, b) => b.totalWeight - a.totalWeight)
}

// ---------------------------------------------------------------------------
// assignConfidence — given the sorted clusters, decide confidence + final value
// ---------------------------------------------------------------------------

interface ValidationResult {
  finalValue:    string | null
  confidence:    FieldConfidence
  decisionBasis: string
  evidenceIds:   string[]
  combinedSources: string
}

function assignConfidence(
  records: FieldEvidence[],
  clusters: ValueCluster[],
): ValidationResult {
  const { confirmedMinWeight, likelyMinWeight, conflictThreshold } =
    GLOBAL_ENGINE_DEFAULTS_BASELINE.crossValidationThresholds
  const allEvidenceIds = records.map(e => e.id)
  const allSources     = [...new Set(records.filter(e => e.source_url).map(e => e.source_url!))]
  const combinedSources = allSources.slice(0, 30).join(';')

  if (clusters.length === 0) {
    return {
      finalValue:    null,
      confidence:    'MISSING',
      decisionBasis: '0 evidence records for this field',
      evidenceIds:   [],
      combinedSources: '',
    }
  }

  const leader    = clusters[0]
  const runnerUp  = clusters[1]
  const totalWeight = clusters.reduce((s, c) => s + c.totalWeight, 0)

  // CONFLICT: a competing cluster accounts for >= threshold of the leader weight
  const hasConflict = runnerUp !== undefined
    && runnerUp.totalWeight / leader.totalWeight >= conflictThreshold

  if (hasConflict) {
    return {
      finalValue:    null,
      confidence:    'CONFLICT',
      decisionBasis: `Conflict: "${leader.canonicalValue}" (weight ${leader.totalWeight.toFixed(1)}) vs "${runnerUp.canonicalValue}" (weight ${runnerUp.totalWeight.toFixed(1)}) — ${records.length} source(s) reviewed`,
      evidenceIds:   allEvidenceIds,
      combinedSources,
    }
  }

  if (leader.totalWeight >= confirmedMinWeight) {
    return {
      finalValue:    leader.canonicalValue,
      confidence:    'CONFIRMED',
      decisionBasis: `CONFIRMED from ${records.length} source(s); leading cluster weight ${leader.totalWeight.toFixed(1)} of total ${totalWeight.toFixed(1)}`,
      evidenceIds:   leader.evidenceIds,
      combinedSources,
    }
  }

  if (leader.totalWeight >= likelyMinWeight) {
    return {
      finalValue:    leader.canonicalValue,
      confidence:    'LIKELY',
      decisionBasis: `LIKELY from ${records.length} source(s); leading cluster weight ${leader.totalWeight.toFixed(1)} — more verification recommended`,
      evidenceIds:   leader.evidenceIds,
      combinedSources,
    }
  }

  // Single source below threshold
  return {
    finalValue:    leader.canonicalValue,
    confidence:    'ESTIMATED',
    decisionBasis: `ESTIMATED from ${records.length} source(s); single low-weight cluster (weight ${leader.totalWeight.toFixed(1)})`,
    evidenceIds:   leader.evidenceIds,
    combinedSources,
  }
}

// ---------------------------------------------------------------------------
// inferValueType — heuristic to determine ValueType from the final value
// ---------------------------------------------------------------------------

function inferValueType(v: string | null): ValueType {
  if (!v) return 'TEXT'
  const stripped = v.trim()
  if (/^\d+(\.\d+)?$/.test(stripped)) return 'POINT_VALUE'
  if (/^\d+.*[-–].*\d+/.test(stripped)) return 'RANGE'
  if (/[+\-*/÷×^]/.test(stripped) || /\b(x|×)\b/i.test(stripped)) return 'FORMULA'
  return 'TEXT'
}

// ---------------------------------------------------------------------------
// crossValidateProduct — main export
// ---------------------------------------------------------------------------

export interface CrossValidationSummary {
  productId:     string
  created:       number
  updated:       number
  skippedLocked: number
  total:         number
}

export async function crossValidateProduct(productId: string): Promise<CrossValidationSummary> {
  // Load all evidence for this product
  const allEvidence = await prisma.fieldEvidence.findMany({
    where: { product_id: productId },
    orderBy: { created_at: 'asc' },
  })

  // Group by (field_name + step_type) — null step_type treated as ''
  const groups = new Map<string, FieldEvidence[]>()
  for (const ev of allEvidence) {
    const key = `${ev.field_name}|||${ev.step_type ?? ''}`
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(ev)
  }

  let created       = 0
  let updated       = 0
  let skippedLocked = 0

  for (const [key, records] of groups.entries()) {
    const [fieldName, stepTypePart] = key.split('|||')
    // stepType stored as '' when null so the @@unique where key and create value are always consistent.
    // NULL != NULL in SQLite unique indexes, so we never store null — always use '' for "no step_type".
    const stepType = stepTypePart  // already '' when original was null (from `ev.step_type ?? ''` above)

    // Skip human-overridden decisions — do NOT overwrite
    const existing = await prisma.fieldDecision.findUnique({
      where: { product_id_field_name_step_type: {
        product_id: productId,
        field_name:  fieldName,
        step_type:   stepType,
      }},
      select: { id: true, human_overridden: true },
    })
    if (existing?.human_overridden) { skippedLocked++; continue }

    const clusters = buildClusters(records)
    const result   = assignConfidence(records, clusters)
    const valueType = inferValueType(result.finalValue)

    // NOTE: supporting_evidence_ids is deprecated — do NOT write to it here.
    // Evidence links are stored exclusively in FieldDecisionEvidence join table.
    const decision = await prisma.fieldDecision.upsert({
      where: { product_id_field_name_step_type: {
        product_id: productId,
        field_name:  fieldName,
        step_type:   stepType,
      }},
      create: {
        product_id:     productId,
        field_name:     fieldName,
        step_type:      stepType,
        final_value:    result.finalValue,
        value_type:     valueType,
        confidence:     result.confidence,
        decision_basis: result.decisionBasis,
        combined_sources: result.combinedSources,
        // human_overridden defaults to false via schema — not set explicitly
        // supporting_evidence_ids is DEPRECATED — intentionally omitted
      },
      update: {
        final_value:    result.finalValue,
        value_type:     valueType,
        confidence:     result.confidence,
        decision_basis: result.decisionBasis,
        combined_sources: result.combinedSources,
        // supporting_evidence_ids is DEPRECATED — intentionally omitted
      },
    })

    // Rebuild FieldDecisionEvidence links for this decision
    // Delete existing links first, then re-insert from engine result
    await prisma.fieldDecisionEvidence.deleteMany({ where: { decision_id: decision.id } })
    if (result.evidenceIds.length > 0) {
      for (const eid of result.evidenceIds) {
        try {
          await prisma.fieldDecisionEvidence.create({
            data: { decision_id: decision.id, evidence_id: eid },
          })
        } catch { /* ignore duplicate key on re-run */ }
      }
    }

    if (existing) updated++; else created++
  }

  return {
    productId,
    created,
    updated,
    skippedLocked,
    total: created + updated + skippedLocked,
  }
}
