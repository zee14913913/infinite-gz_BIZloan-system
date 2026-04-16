// =============================================================================
// BCIS — Financial Calculator
//
// Computes the engine-readable aggregate and derived fields from raw
// CaseFinancials inputs.  Writes results back to the DB.
//
// All discount multipliers come from GLOBAL_ENGINE_DEFAULTS_BASELINE
// (temporary) until Phase 3 seeds real config.  No hardcoded multipliers
// inside this module.
// =============================================================================

import { prisma } from '@/lib/prisma'
import type { CaseFinancials, BankAccountSummary } from '@/generated/prisma/client'
import { GLOBAL_ENGINE_DEFAULTS_BASELINE } from '@/server/matching/baseline-config'

// ---------------------------------------------------------------------------
// applyStatementDiscounts
// Applies per-config multipliers to raw inflow.
// Multiplier values come from config — not from this file.
// ---------------------------------------------------------------------------

function applyStatementDiscounts(
  rawInflow: number,
  fin: Pick<
    CaseFinancials,
    'bounce_cheque_count_12m' | 'single_customer_concentration_pct' |
    'avg_monthly_ending_balance' | 'cash_inflow_pct'
  > & { avg_monthly_inflow_6m: number | null },
): number {
  const d = GLOBAL_ENGINE_DEFAULTS_BASELINE.statementDiscounts
  let multiplier = 1.0

  const bounces = fin.bounce_cheque_count_12m ?? 0
  if      (bounces > d.bounceTier2MaxCount) multiplier *= d.bounceTier3Multiplier
  else if (bounces > d.bounceTier1MaxCount) multiplier *= d.bounceTier2Multiplier
  else if (bounces >= d.bounceTier1MaxCount) multiplier *= d.bounceTier1Multiplier

  const conc = fin.single_customer_concentration_pct ?? 0
  if (conc > d.concentrationThresholdPct) multiplier *= d.concentrationMultiplier

  const inflow = fin.avg_monthly_inflow_6m ?? 0
  const ending = fin.avg_monthly_ending_balance ?? 0
  if (inflow > 0 && ending / inflow < d.lowBalanceRatioThreshold) {
    multiplier *= d.lowBalanceMultiplier
  }

  const cashPct = fin.cash_inflow_pct ?? 0
  if (cashPct > d.highCashInflowThresholdPct) multiplier *= d.highCashInflowMultiplier

  return rawInflow * multiplier
}

// ---------------------------------------------------------------------------
// mapCtosGrade
// Thresholds sourced from GlobalEngineDefaults.ctosGradeThresholds.
// ---------------------------------------------------------------------------

export function mapCtosGrade(score: number | null): string | null {
  if (score === null) return null
  const t = GLOBAL_ENGINE_DEFAULTS_BASELINE.ctosGradeThresholds
  if (score >= t.excellent) return 'EXCELLENT'
  if (score >= t.veryGood)  return 'VERY_GOOD'
  if (score >= t.good)      return 'GOOD'
  if (score >= t.fair)      return 'FAIR'
  return 'POOR'
}

// ---------------------------------------------------------------------------
// recalculateFinancials
// Reads raw fields from DB, computes derived fields, and writes them back.
// Returns the updated CaseFinancials record.
// ---------------------------------------------------------------------------

export async function recalculateFinancials(caseId: string) {
  const fin = await prisma.caseFinancials.findUnique({
    where: { case_id: caseId },
    include: { existing_loans: true, collaterals: true },
  })
  if (!fin) return null

  // ── C. Aggregate existing debt ───────────────────────────────────────────
  const totalMonthlyRepayment = fin.existing_loans.reduce(
    (sum, l) => sum + l.monthly_repayment, 0,
  )
  const totalOutstanding = fin.existing_loans.reduce(
    (sum, l) => sum + l.outstanding_balance, 0,
  )

  // ── B. Effective inflow after statement discounts ────────────────────────
  const rawInflow = fin.avg_monthly_inflow_6m ?? fin.avg_monthly_inflow_12m ?? 0
  const effectiveInflow = applyStatementDiscounts(rawInflow, {
    bounce_cheque_count_12m:           fin.bounce_cheque_count_12m,
    single_customer_concentration_pct: fin.single_customer_concentration_pct,
    avg_monthly_ending_balance:        fin.avg_monthly_ending_balance,
    cash_inflow_pct:                   fin.cash_inflow_pct,
    avg_monthly_inflow_6m:             fin.avg_monthly_inflow_6m,
  })

  // ── F. Derived financial indicators ─────────────────────────────────────
  const ebitda = fin.ebitda_y1
  const annualRepayment = totalMonthlyRepayment * 12

  const calculatedDscr = ebitda && annualRepayment > 0
    ? ebitda / annualRepayment
    : null

  const calculatedFcf = ebitda !== null
    ? ebitda - annualRepayment
    : null

  const annualRevenue = fin.annual_revenue_y1
  const totalDebtToRevenue = annualRevenue && annualRevenue > 0 && totalOutstanding > 0
    ? (totalOutstanding / annualRevenue) * 100
    : null

  const ctosGrade = mapCtosGrade(fin.ctos_score)

  // Write all computed values in one update
  const updated = await prisma.caseFinancials.update({
    where: { id: fin.id },
    data: {
      total_existing_monthly_repayment: totalMonthlyRepayment,
      total_existing_outstanding:       totalOutstanding,
      effective_monthly_inflow:         effectiveInflow,
      calculated_dscr:                  calculatedDscr,
      calculated_fcf:                   calculatedFcf,
      total_debt_to_annual_revenue_pct: totalDebtToRevenue,
      ctos_grade:                       ctosGrade,
    },
    include: { bank_accounts: true, existing_loans: true, collaterals: true },
  })

  return updated
}

// ---------------------------------------------------------------------------
// aggregateBankAccounts
// Re-aggregates avg_monthly_inflow_6m/12m and bounce count from individual
// BankAccountSummary rows and updates the CaseFinancials parent.
// Called after any BankAccountSummary add/edit/delete.
// ---------------------------------------------------------------------------

export async function aggregateBankAccounts(
  financialsId: string,
  accounts: BankAccountSummary[],
) {
  const inflow6  = accounts.reduce((s, a) => s + (a.avg_monthly_inflow ?? 0), 0) || null
  const ending   = accounts.length > 0
    ? accounts.reduce((s, a) => s + (a.avg_ending_balance ?? 0), 0) / accounts.length
    : null
  const bounces  = accounts.reduce((s, a) => s + a.bounce_count, 0)

  await prisma.caseFinancials.update({
    where: { id: financialsId },
    data: {
      avg_monthly_inflow_6m:     inflow6,
      avg_monthly_ending_balance: ending,
      bounce_cheque_count_12m:   bounces,
    },
  })
}

// ---------------------------------------------------------------------------
// Director personal DSR types
// ---------------------------------------------------------------------------

export interface DirectorIncomeItem {
  income_type:  string
  gross_monthly_amount: number
  recognition_rate:     number   // 0.0–1.0
}

export interface DirectorPersonalLoanItem {
  monthly_repayment: number
}

export interface DirectorDsrInput {
  income_items:           DirectorIncomeItem[]
  personal_loans:         DirectorPersonalLoanItem[]
  /** If already computed by caller, these override the JSON derivation. */
  total_recognized_monthly_income?:   number | null
  total_personal_monthly_commitment?: number | null
}

export interface DirectorDsrResult {
  totalRecognizedIncome:   number
  totalMonthlyCommitment:  number
  personalDsr:             number | null
  creditBand:              'STRONG' | 'ACCEPTABLE' | 'MARGINAL' | 'WEAK' | null
}

// ---------------------------------------------------------------------------
// computeDirectorPersonalDsr
// All band thresholds come from baseline-config — no hardcoded numbers.
// ---------------------------------------------------------------------------

export function computeDirectorPersonalDsr(input: DirectorDsrInput): DirectorDsrResult {
  const bands = GLOBAL_ENGINE_DEFAULTS_BASELINE.personalDsrBands

  const totalRecognizedIncome =
    input.total_recognized_monthly_income ??
    input.income_items.reduce(
      (sum, item) => sum + item.gross_monthly_amount * item.recognition_rate,
      0,
    )

  const totalMonthlyCommitment =
    input.total_personal_monthly_commitment ??
    input.personal_loans.reduce((sum, l) => sum + l.monthly_repayment, 0)

  if (totalRecognizedIncome <= 0) {
    return { totalRecognizedIncome, totalMonthlyCommitment, personalDsr: null, creditBand: null }
  }

  const personalDsr = (totalMonthlyCommitment / totalRecognizedIncome) * 100

  let creditBand: DirectorDsrResult['creditBand']
  if      (personalDsr < bands.strongMax)     creditBand = 'STRONG'
  else if (personalDsr < bands.acceptableMax) creditBand = 'ACCEPTABLE'
  else if (personalDsr < bands.marginalMax)   creditBand = 'MARGINAL'
  else                                        creditBand = 'WEAK'

  return { totalRecognizedIncome, totalMonthlyCommitment, personalDsr, creditBand }
}

// ---------------------------------------------------------------------------
// recalculateDirectorDsr
// Reads director JSON fields from DB, computes DSR, writes results back.
// ---------------------------------------------------------------------------

export async function recalculateDirectorDsr(directorId: string) {
  const director = await prisma.directorProfile.findUnique({ where: { id: directorId } })
  if (!director) return null

  let incomeItems: DirectorIncomeItem[] = []
  let personalLoans: DirectorPersonalLoanItem[] = []

  try { incomeItems  = JSON.parse(director.income_items_json  ?? '[]') } catch { /* ignore */ }
  try { personalLoans = JSON.parse(director.personal_loans_json ?? '[]') } catch { /* ignore */ }

  const result = computeDirectorPersonalDsr({
    income_items:  incomeItems,
    personal_loans: personalLoans,
    total_recognized_monthly_income:   director.total_recognized_monthly_income,
    total_personal_monthly_commitment: director.total_personal_monthly_commitment,
  })

  const updated = await prisma.directorProfile.update({
    where: { id: directorId },
    data: {
      total_recognized_monthly_income:   result.totalRecognizedIncome   || null,
      total_personal_monthly_commitment: result.totalMonthlyCommitment  || null,
      calculated_personal_dsr:           result.personalDsr,
      personal_credit_score:             result.creditBand ?? undefined,
    },
  })

  return { ...updated, dsrResult: result }
}
