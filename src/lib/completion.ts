// Block A / Block B completion percentage calculators
// Source: Corporate-Loan_Assessment.md Phase 2 spec
import type { ProductBlockA, ProcessStep } from '@/types/bank.types'

// ProductBlockA has exactly 28 fields per spec §3.1
const BLOCK_A_TOTAL = 28

function isFilled(v: unknown): boolean {
  if (v === null || v === undefined) return false
  if (typeof v === 'string' && v.trim() === '') return false
  if (Array.isArray(v) && v.length === 0) return false
  return true
}

export function calcBlockACompletion(blockA: Partial<ProductBlockA> | null | undefined): number {
  if (!blockA) return 0
  const fields: unknown[] = [
    blockA.min_loan_amount, blockA.max_loan_amount,
    blockA.min_tenure_months, blockA.max_tenure_months,
    blockA.rate_type, blockA.base_rate, blockA.rate_min, blockA.rate_max,
    blockA.min_company_age_months,
    blockA.eligible_company_types, blockA.eligible_industries, blockA.excluded_industries,
    blockA.min_annual_revenue,
    blockA.monthly_turnover_multiplier_min, blockA.monthly_turnover_multiplier_max,
    blockA.max_loan_to_annual_revenue_pct,
    blockA.dscr_min, blockA.dscr_preferred, blockA.dscr_formula_note,
    blockA.ltv_max, blockA.collateral_coverage_min, blockA.guarantee_fee_pct,
    blockA.processing_fee, blockA.stamp_duty,
    blockA.confidence, blockA.last_verified_date, blockA.sources, blockA.notes,
  ]
  return Math.round((fields.filter(isFilled).length / BLOCK_A_TOTAL) * 100)
}

// Block B: 11 steps total; a step is filled if step_type is set
export function calcBlockBCompletion(steps: ProcessStep[] | null | undefined): number {
  if (!steps || steps.length === 0) return 0
  const filled = steps.filter(s => !!s.step_type).length
  return Math.round((filled / 11) * 100)
}
