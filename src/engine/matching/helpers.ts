// =============================================================================
// BCIS Matching Engine — Pure Utility Helpers
// No config dependencies. No numeric thresholds. No business logic.
// =============================================================================

import type { CollateralView } from '@/types/case.types'

/**
 * Returns the whole number of calendar months elapsed from `from` to `to`.
 * Positive when `to` is after `from`.
 */
export function monthsBetween(from: Date, to: Date): number {
  return (
    (to.getFullYear() - from.getFullYear()) * 12 +
    (to.getMonth() - from.getMonth())
  )
}

/**
 * Counts how many of the supplied profit figures are strictly positive.
 * null and zero values are not counted as profitable years.
 */
export function countProfitableYears(...profits: (number | null)[]): number {
  return profits.filter((p): p is number => p !== null && p > 0).length
}

/** Sum of netEquity across all collateral items. */
export function sumNetEquity(collaterals: CollateralView[]): number {
  return collaterals.reduce((acc, c) => acc + c.netEquity, 0)
}

/** Sum of estimatedMarketValue across all collateral items. */
export function sumMarketValue(collaterals: CollateralView[]): number {
  return collaterals.reduce((acc, c) => acc + c.estimatedMarketValue, 0)
}

/**
 * Returns true when n is a finite number strictly greater than zero.
 * Used to determine whether an amount-method produced a valid ceiling.
 */
export function isFinitePositive(n: number | null | undefined): n is number {
  return typeof n === 'number' && Number.isFinite(n) && n > 0
}

/**
 * Standard amortised-loan present value.
 *   PV = pmt × (1 − (1+r)^−n) / r
 * Degenerates to  PV = pmt × n  when r === 0 (zero-interest case).
 *
 * @param monthlyPayment  Maximum affordable monthly repayment (RM)
 * @param monthlyRate     Monthly interest rate expressed as a decimal (e.g. 0.004)
 * @param periods         Loan tenure in months
 */
export function presentValue(
  monthlyPayment: number,
  monthlyRate: number,
  periods: number,
): number {
  if (monthlyRate === 0) return monthlyPayment * periods
  return (monthlyPayment * (1 - Math.pow(1 + monthlyRate, -periods))) / monthlyRate
}
