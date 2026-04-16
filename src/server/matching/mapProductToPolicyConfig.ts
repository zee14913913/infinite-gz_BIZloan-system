// =============================================================================
// BCIS — Product → PolicyConfig mapper
//
// Converts a persisted Prisma Product row (with block_a_json) into the
// ProductPolicyConfig shape consumed by the matching engine.
//
// Rules:
// - All missing fields map to null/empty — no synthetic values introduced.
// - Eligible/excluded industry and company-type arrays are cast from string[]
//   to their domain enum types; unrecognised values are filtered out.
// - The mapping is deterministic and one-way.
// =============================================================================

import type { Product } from '@/generated/prisma/client'
import type { ProductPolicyConfig } from '@/types/policy.types'
import type { IndustryCategory, CompanyType } from '@/types/case.types'
import { defaultBlockA } from '@/types/bank.types'
import type { ProductBlockA } from '@/types/bank.types'

// ---------------------------------------------------------------------------
// parseBlockA — safe JSON parse with typed fallback
// ---------------------------------------------------------------------------

function parseBlockA(raw: string | null | undefined): ProductBlockA {
  if (!raw) return defaultBlockA()
  try {
    return JSON.parse(raw) as ProductBlockA
  } catch {
    return defaultBlockA()
  }
}

// ---------------------------------------------------------------------------
// castIndustries — filter string[] to valid IndustryCategory[]
// ---------------------------------------------------------------------------

const VALID_INDUSTRIES = new Set<IndustryCategory>([
  'MANUFACTURING', 'TRADING_RETAIL', 'FOOD_BEVERAGE', 'CONSTRUCTION',
  'PROPERTY_DEVELOPER', 'IT_TECHNOLOGY', 'PROFESSIONAL_SERVICES', 'EDUCATION',
  'HEALTHCARE', 'LOGISTICS_TRANSPORT', 'AGRICULTURE', 'HOSPITALITY_TOURISM',
  'FINANCIAL_SERVICES', 'OTHER',
])

function castIndustries(values: string[]): IndustryCategory[] {
  return values.filter((v): v is IndustryCategory => VALID_INDUSTRIES.has(v as IndustryCategory))
}

// ---------------------------------------------------------------------------
// castCompanyTypes — filter string[] to valid CompanyType[]
// ---------------------------------------------------------------------------

const VALID_COMPANY_TYPES = new Set<CompanyType>([
  'SDN_BHD', 'BHD', 'ENTERPRISE', 'PARTNERSHIP', 'LLP', 'SOLE_PROPRIETOR',
])

function castCompanyTypes(values: string[]): CompanyType[] {
  return values.filter((v): v is CompanyType => VALID_COMPANY_TYPES.has(v as CompanyType))
}

// ---------------------------------------------------------------------------
// mapProductToPolicyConfig — main export
// ---------------------------------------------------------------------------

export function mapProductToPolicyConfig(product: Product): ProductPolicyConfig {
  const a = parseBlockA(product.block_a_json)

  return {
    productId: product.id,

    // Hard eligibility
    minCompanyAgeMonths:    a.min_company_age_months,
    minAnnualRevenue:       a.min_annual_revenue,
    eligibleCompanyTypes:   castCompanyTypes(a.eligible_company_types ?? []),
    eligibleIndustries:     castIndustries(a.eligible_industries ?? []),
    excludedIndustries:     castIndustries(a.excluded_industries ?? []),

    // DSCR
    dscrMin:         a.dscr_min,
    dscrPreferred:   a.dscr_preferred,
    dscrFormulaNote: a.dscr_formula_note,

    // Amount sizing
    monthlyTurnoverMultiplierMin: a.monthly_turnover_multiplier_min,
    monthlyTurnoverMultiplierMax: a.monthly_turnover_multiplier_max,
    maxLoanToAnnualRevenuePct:    a.max_loan_to_annual_revenue_pct,

    // Loan bounds
    minLoanAmount:   a.min_loan_amount,
    maxLoanAmount:   a.max_loan_amount,
    minTenureMonths: a.min_tenure_months,
    maxTenureMonths: a.max_tenure_months,

    // Rate
    rateMin:  a.rate_min,
    rateMax:  a.rate_max,
    rateType: a.rate_type,
    baseRate: a.base_rate,

    // Collateral
    ltvMax:               a.ltv_max,
    collateralCoverageMin: a.collateral_coverage_min,
    guaranteeFeePct:      a.guarantee_fee_pct,
    // Guarantee scheme required when the product's guarantee_scheme is not NONE.
    // The product table stores the scheme name; the engine just needs the boolean.
    guaranteeSchemeRequired: product.guarantee_scheme !== 'NONE',

    // Fees
    processingFee: a.processing_fee,
    stampDuty:     a.stamp_duty,

    // Data quality
    confidence:       a.confidence,
    lastVerifiedDate: a.last_verified_date,
    sources:          a.sources ?? [],
    notes:            a.notes,
  }
}
