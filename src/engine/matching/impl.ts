// =============================================================================
// BCIS Matching Engine — Implementation
//
// Implements all four public engine functions.
// All thresholds come from resolved config — no numeric literals allowed.
// =============================================================================

import type { CaseWithFinancials } from '@/types/case.types'
import type {
  GlobalEngineDefaults,
  BankPolicyConfig,
  ProductPolicyConfig,
} from '@/types/policy.types'

import {
  EligibilityFlagType,
  RiskFlagType,
  type EligibilityFlag,
  type RiskFlag,
  type MatchScore,
  type AmountMethodResult,
  type AmountCalculationBreakdown,
  type ScoringThresholds,
} from './types'

import { resolveConfig } from './resolvers'

import {
  monthsBetween,
  countProfitableYears,
  sumNetEquity,
  sumMarketValue,
  isFinitePositive,
  presentValue,
} from './helpers'

// ────────────────────────────────────────────────────────────────────────────
// Internal flag-builder helpers
// ────────────────────────────────────────────────────────────────────────────

function mkFlag(
  type: EligibilityFlagType,
  severity: EligibilityFlag['severity'],
  passed: boolean,
  field: string,
  actualValue: string | null,
  requiredValue: string | null,
  sourceConfig: EligibilityFlag['sourceConfig'],
  notes: string | null = null,
): EligibilityFlag {
  return { type, severity, passed, field, actualValue, requiredValue, sourceConfig, notes }
}

function mkRisk(
  type: RiskFlagType,
  severity: RiskFlag['severity'],
  descriptionZh: string,
  descriptionEn: string,
  mitigationSuggestion: string | null,
  sourceConfig: RiskFlag['sourceConfig'],
): RiskFlag {
  return { type, severity, descriptionZh, descriptionEn, mitigationSuggestion, sourceConfig }
}

// ────────────────────────────────────────────────────────────────────────────
// computeEligibilityFlagsImpl
// ────────────────────────────────────────────────────────────────────────────

export function computeEligibilityFlagsImpl(
  cas: CaseWithFinancials,
  productConfig: ProductPolicyConfig,
  bankConfig: BankPolicyConfig,
  globalDefaults: GlobalEngineDefaults,
): EligibilityFlag[] {
  const cfg = resolveConfig(productConfig, bankConfig, globalDefaults)
  const fin = cas.financials
  const flags: EligibilityFlag[] = []
  const now = new Date()
  const bo = bankConfig.globalOverrides

  // ── 1. INDUSTRY_EXCLUDED ─────────────────────────────────────────────────
  {
    const productExcludes = cfg.excludedIndustriesProduct.includes(cas.client.industryCategory)
    const bankExcludes    = cfg.excludedIndustriesBankLevel.includes(cas.client.industryCategory)
    if (productExcludes || bankExcludes) {
      flags.push(mkFlag(
        EligibilityFlagType.INDUSTRY_EXCLUDED,
        'HARD_BLOCK',
        false,
        'client.industryCategory',
        cas.client.industryCategory,
        'non-excluded industry',
        productExcludes ? 'PRODUCT' : 'BANK',
        `Industry excluded by ${productExcludes ? 'product' : 'bank'} configuration`,
      ))
    }
  }

  // ── 2. BELOW_MIN_ANNUAL_REVENUE ───────────────────────────────────────────
  {
    if (cfg.minAnnualRevenue !== null) {
      const revenue = fin.annualRevenueY1
      const source: EligibilityFlag['sourceConfig'] =
        productConfig.minAnnualRevenue !== null ? 'PRODUCT'
        : bo.defaultMinAnnualRevenue   !== undefined ? 'BANK'
        : 'GLOBAL'

      if (revenue === null) {
        // Data missing — advisory warning; cannot block without data
        flags.push(mkFlag(
          EligibilityFlagType.BELOW_MIN_ANNUAL_REVENUE,
          'WARNING',
          true,
          'financials.annualRevenueY1',
          null,
          `>= RM ${cfg.minAnnualRevenue.toLocaleString()}`,
          source,
          'Annual revenue not provided; manual verification required',
        ))
      } else if (revenue < cfg.minAnnualRevenue) {
        flags.push(mkFlag(
          EligibilityFlagType.BELOW_MIN_ANNUAL_REVENUE,
          'HARD_BLOCK',
          false,
          'financials.annualRevenueY1',
          `RM ${revenue.toLocaleString()}`,
          `>= RM ${cfg.minAnnualRevenue.toLocaleString()}`,
          source,
          null,
        ))
      }
    }
  }

  // ── 3. BELOW_MIN_YEARS_IN_BUSINESS ───────────────────────────────────────
  {
    if (cfg.minCompanyAgeMonths !== null) {
      const ageMonths = monthsBetween(cas.client.incorporationDate, now)
      const source: EligibilityFlag['sourceConfig'] =
        productConfig.minCompanyAgeMonths !== null ? 'PRODUCT'
        : bo.defaultMinYearsInBusiness    !== undefined ? 'BANK'
        : 'GLOBAL'

      if (ageMonths < cfg.minCompanyAgeMonths) {
        flags.push(mkFlag(
          EligibilityFlagType.BELOW_MIN_YEARS_IN_BUSINESS,
          'HARD_BLOCK',
          false,
          'client.incorporationDate',
          `${ageMonths} months in operation`,
          `>= ${cfg.minCompanyAgeMonths} months`,
          source,
          null,
        ))
      }
    }
  }

  // ── 4. BELOW_MIN_PROFITABLE_YEARS ────────────────────────────────────────
  {
    if (cfg.minProfitableYears > 0) {
      const profitableCount = countProfitableYears(
        fin.netProfitY1, fin.netProfitY2, fin.netProfitY3,
      )
      if (profitableCount < cfg.minProfitableYears) {
        // Severity: STRICT bank treats this as a hard block; otherwise soft
        const severity: EligibilityFlag['severity'] =
          cfg.ccrisStrictnessLevel === 'STRICT' ? 'HARD_BLOCK' : 'SOFT_BLOCK'
        const source: EligibilityFlag['sourceConfig'] =
          bo.defaultMinProfitableYears !== undefined ? 'BANK' : 'GLOBAL'
        flags.push(mkFlag(
          EligibilityFlagType.BELOW_MIN_PROFITABLE_YEARS,
          severity,
          false,
          'financials.netProfitY1/Y2/Y3',
          `${profitableCount} profitable year(s) out of last 3`,
          `>= ${cfg.minProfitableYears} profitable year(s)`,
          source,
          null,
        ))
      }
    }
  }

  // ── 5. BELOW_PRODUCT_DSCR_MIN ────────────────────────────────────────────
  // Triggered ONLY by productConfig.dscrMin — bank/global raise RiskFlags, not HARD_BLOCKs.
  {
    if (cfg.dscrHardMin !== null) {
      if (fin.calculatedDscr === null) {
        flags.push(mkFlag(
          EligibilityFlagType.BELOW_PRODUCT_DSCR_MIN,
          'WARNING',
          true,   // cannot confirm fail without data
          'financials.calculatedDscr',
          null,
          `>= ${cfg.dscrHardMin}`,
          'PRODUCT',
          'DSCR not yet calculated; run financial calculator before matching',
        ))
      } else if (fin.calculatedDscr < cfg.dscrHardMin) {
        flags.push(mkFlag(
          EligibilityFlagType.BELOW_PRODUCT_DSCR_MIN,
          'HARD_BLOCK',
          false,
          'financials.calculatedDscr',
          fin.calculatedDscr.toFixed(2),
          `>= ${cfg.dscrHardMin}`,
          'PRODUCT',
          null,
        ))
      }
    }
  }

  // ── 6. CTOS_BELOW_MIN ────────────────────────────────────────────────────
  {
    if (fin.ctosScore === null) {
      // Score not provided — advisory warning only; no hard block without data
      flags.push(mkFlag(
        EligibilityFlagType.CTOS_BELOW_MIN,
        'WARNING',
        true,
        'financials.ctosScore',
        null,
        `>= ${cfg.minCtosScore}`,
        bankConfig.minCtosScore !== null ? 'BANK' : 'GLOBAL',
        'CTOS score not provided; manual credit bureau check required',
      ))
    } else if (fin.ctosScore < cfg.minCtosScore) {
      // Escalate to HARD_BLOCK if score is in the soft range and bank opts in
      const inSoftRange = fin.ctosScore >= cfg.ctosSoftBlockLowerBound
      const severity: EligibilityFlag['severity'] =
        inSoftRange && cfg.ctosHardBlockOnSoftRange ? 'HARD_BLOCK' : 'SOFT_BLOCK'
      flags.push(mkFlag(
        EligibilityFlagType.CTOS_BELOW_MIN,
        severity,
        false,
        'financials.ctosScore',
        String(fin.ctosScore),
        `>= ${cfg.minCtosScore}`,
        bankConfig.minCtosScore !== null
          || bo.defaultMinCtosScore !== undefined ? 'BANK' : 'GLOBAL',
        null,
      ))
    }
  }

  // ── 7. CCRIS_MAJOR_ISSUE ─────────────────────────────────────────────────
  {
    if (fin.ccrisStatus === 'MAJOR_ISSUE') {
      const isHardBlock =
        cfg.ccrisMajorIssueIsHardBlock || cfg.ccrisStrictnessLevel === 'STRICT'
      flags.push(mkFlag(
        EligibilityFlagType.CCRIS_MAJOR_ISSUE,
        isHardBlock ? 'HARD_BLOCK' : 'SOFT_BLOCK',
        false,
        'financials.ccrisStatus',
        'MAJOR_ISSUE',
        'CLEAN or MINOR_ISSUE',
        cfg.ccrisMajorIssueIsHardBlock ? 'GLOBAL' : 'BANK',
        'Significant credit bureau impairment detected',
      ))
    }
  }

  // ── 8. COLLATERAL_INSUFFICIENT ───────────────────────────────────────────
  {
    const hasLtvRule      = cfg.ltvMax !== null
    const hasCoverageRule = cfg.collateralCoverageMin !== null

    if (hasLtvRule || hasCoverageRule) {
      const netEq  = sumNetEquity(fin.collaterals)
      const mktVal = sumMarketValue(fin.collaterals)
      let collateralFails = false
      let failDetail = ''

      if (fin.collaterals.length === 0) {
        collateralFails = true
        failDetail = 'No collateral items provided'
      }

      if (!collateralFails && hasLtvRule && mktVal > 0) {
        const ltv = (cas.requestedAmount / mktVal) * 100
        if (ltv > cfg.ltvMax!) {
          collateralFails = true
          failDetail = `LTV ${ltv.toFixed(1)}% exceeds maximum ${cfg.ltvMax}%`
        }
      }

      if (!collateralFails && hasCoverageRule && cas.requestedAmount > 0) {
        const coverage = (netEq / cas.requestedAmount) * 100
        if (coverage < cfg.collateralCoverageMin!) {
          collateralFails = true
          failDetail = `Coverage ${coverage.toFixed(1)}% is below minimum ${cfg.collateralCoverageMin}%`
        }
      }

      if (collateralFails) {
        const severity: EligibilityFlag['severity'] =
          cfg.collateralStrictnessLevel === 'STRICT'   ? 'HARD_BLOCK'
          : cfg.collateralStrictnessLevel === 'MODERATE' ? 'SOFT_BLOCK'
          : 'WARNING'
        flags.push(mkFlag(
          EligibilityFlagType.COLLATERAL_INSUFFICIENT,
          severity,
          false,
          'financials.collaterals',
          `netEquity RM ${netEq.toLocaleString()}`,
          hasCoverageRule
            ? `coverage >= ${cfg.collateralCoverageMin}% of requested amount`
            : `LTV <= ${cfg.ltvMax}%`,
          'PRODUCT',
          failDetail,
        ))
      }
    }
  }

  // ── 9. GUARANTEE_REQUIRED_NOT_AVAILABLE ──────────────────────────────────
  // The engine cannot determine actual CGC/SJPP eligibility from case data alone.
  // Severity is determined by the bank's guarantee usage preference, which signals
  // how likely the bank can fulfil the requirement.
  {
    if (cfg.guaranteeSchemeRequired) {
      const bankSupports = cfg.guaranteeSchemeUsagePreference === 'PREFERRED'
      const severity: EligibilityFlag['severity'] =
        cfg.guaranteeSchemeUsagePreference === 'DISCOURAGED' ? 'SOFT_BLOCK' : 'WARNING'
      flags.push(mkFlag(
        EligibilityFlagType.GUARANTEE_REQUIRED_NOT_AVAILABLE,
        severity,
        bankSupports,  // passed=true when bank actively supports guarantee schemes
        'product.guaranteeSchemeRequired',
        'guarantee scheme required by product',
        'guarantee scheme confirmed and available',
        'PRODUCT',
        'Guarantee scheme availability must be confirmed before submission',
      ))
    }
  }

  // ── 10. PRODUCT_SPECIFIC_HARDBLOCK — company type ────────────────────────
  {
    if (cfg.eligibleCompanyTypesProduct.length > 0) {
      const allowed = cfg.eligibleCompanyTypesProduct.includes(cas.client.companyType)
      if (!allowed) {
        flags.push(mkFlag(
          EligibilityFlagType.PRODUCT_SPECIFIC_HARDBLOCK,
          'HARD_BLOCK',
          false,
          'client.companyType',
          cas.client.companyType,
          cfg.eligibleCompanyTypesProduct.join(' | '),
          'PRODUCT',
          "Company type is not in the product's eligible company types",
        ))
      }
    }
  }

  return flags
}

// ────────────────────────────────────────────────────────────────────────────
// computeRiskFlagsImpl
// ────────────────────────────────────────────────────────────────────────────

export function computeRiskFlagsImpl(
  cas: CaseWithFinancials,
  productConfig: ProductPolicyConfig,
  bankConfig: BankPolicyConfig,
  globalDefaults: GlobalEngineDefaults,
  effectiveInflow: number,
  _estimatedMaxAmount: number | null,
): RiskFlag[] {
  const cfg = resolveConfig(productConfig, bankConfig, globalDefaults)
  const fin = cas.financials
  const flags: RiskFlag[] = []
  const now = new Date()
  const ageMonths = monthsBetween(cas.client.incorporationDate, now)
  const bo = bankConfig.globalOverrides

  // ── 1. DSCR_WEAK ─────────────────────────────────────────────────────────
  // Raised when DSCR is above the product's hard floor (else eligibility handles it)
  // but below the preferred threshold.
  {
    if (fin.calculatedDscr !== null && cfg.dscrPreferred !== null) {
      const aboveProductFloor =
        cfg.dscrHardMin === null || fin.calculatedDscr >= cfg.dscrHardMin
      if (aboveProductFloor && fin.calculatedDscr < cfg.dscrPreferred) {
        // Severity HIGH if below global market minimum; MEDIUM if merely below preferred
        const belowGlobalMin =
          fin.calculatedDscr < globalDefaults.defaultDscrMin
        flags.push(mkRisk(
          RiskFlagType.DSCR_WEAK,
          belowGlobalMin ? 'HIGH' : 'MEDIUM',
          `DSCR ${fin.calculatedDscr.toFixed(2)} 低于建议水平 ${cfg.dscrPreferred}`,
          `DSCR ${fin.calculatedDscr.toFixed(2)} is below the preferred threshold of ${cfg.dscrPreferred}`,
          '建议降低申请额度、延长还款年限或先偿还部分现有贷款',
          productConfig.dscrPreferred !== null ? 'PRODUCT'
          : bo.defaultDscrPreferred   !== undefined ? 'BANK'
          : 'GLOBAL',
        ))
      }
    }
  }

  // ── 2. HIGH_BOUNCE_CHEQUES ────────────────────────────────────────────────
  {
    const bounces = fin.bounceChequeCount12m
    if (bounces !== null && bounces > cfg.bounceChequeRiskFlagThreshold) {
      // If already above hard-block threshold, eligibility flags it separately;
      // risk flag still raised here with HIGH severity to inform scoring.
      const severity: RiskFlag['severity'] =
        bounces > cfg.bounceChequeHardBlockThreshold ? 'HIGH' : 'MEDIUM'
      flags.push(mkRisk(
        RiskFlagType.HIGH_BOUNCE_CHEQUES,
        severity,
        `过去12个月有 ${bounces} 次退票，超出风险阈值`,
        `${bounces} bounced cheques in the last 12 months exceeds the risk threshold`,
        '建议提供退票原因说明，并展示近3个月流水已明显改善',
        bo.defaultBounceChequeRiskFlagThreshold !== undefined ? 'BANK' : 'GLOBAL',
      ))
    }
  }

  // ── 3. HIGH_CASH_INFLOW_PCT ───────────────────────────────────────────────
  {
    if (fin.cashInflowPct !== null && fin.cashInflowPct > cfg.maxCashInflowPct) {
      flags.push(mkRisk(
        RiskFlagType.HIGH_CASH_INFLOW_PCT,
        'MEDIUM',
        `现金进账占比 ${(fin.cashInflowPct * 100).toFixed(1)}% 偏高，核实存在困难`,
        `Cash inflow proportion ${(fin.cashInflowPct * 100).toFixed(1)}% exceeds the threshold`,
        '建议提供更多非现金交易记录（发票、转账流水）以增加可核实性',
        bo.defaultMaxCashInflowPct !== undefined ? 'BANK' : 'GLOBAL',
      ))
    }
  }

  // ── 4. HIGH_CUSTOMER_CONCENTRATION ───────────────────────────────────────
  {
    const conc = fin.singleCustomerConcentrationPct
    if (conc !== null && conc > cfg.maxSingleCustomerConcentrationPct) {
      flags.push(mkRisk(
        RiskFlagType.HIGH_CUSTOMER_CONCENTRATION,
        'MEDIUM',
        `单一客源占进账比例 ${(conc * 100).toFixed(1)}%，收入集中风险较高`,
        `Single customer accounts for ${(conc * 100).toFixed(1)}% of total inflows`,
        '建议开拓多元客户以分散收入风险，提供多份客户合同佐证',
        bo.defaultMaxSingleCustomerConcentrationPct !== undefined ? 'BANK' : 'GLOBAL',
      ))
    }
  }

  // ── 5. CTOS_WEAK ─────────────────────────────────────────────────────────
  // Raised when score is above the hard minimum but below the "clean" threshold
  {
    if (fin.ctosScore !== null) {
      const aboveMinimum = fin.ctosScore >= cfg.minCtosScore
      const belowClean   = fin.ctosScore < cfg.ctosCleanThreshold
      if (aboveMinimum && belowClean) {
        flags.push(mkRisk(
          RiskFlagType.CTOS_WEAK,
          'LOW',
          `CTOS 分数 ${fin.ctosScore} 已达最低要求，但低于理想水平`,
          `CTOS score ${fin.ctosScore} passes the minimum but is below the preferred clean threshold`,
          '建议申请人查阅完整 CTOS 报告并纠正可修复的记录',
          bankConfig.minCtosScore !== null
          || bo.defaultCtosCleanThreshold !== undefined ? 'BANK' : 'GLOBAL',
        ))
      }
    }
  }

  // ── 6. CCRIS_MINOR_ISSUE ─────────────────────────────────────────────────
  {
    if (fin.ccrisStatus === 'MINOR_ISSUE' && cfg.ccrisMinorIssueRaisesRiskFlag) {
      if (cfg.ccrisStrictnessLevel !== 'LENIENT') {
        const severity: RiskFlag['severity'] =
          cfg.ccrisStrictnessLevel === 'STRICT' ? 'MEDIUM' : 'LOW'
        flags.push(mkRisk(
          RiskFlagType.CCRIS_MINOR_ISSUE,
          severity,
          'CCRIS 有轻微瑕疵记录',
          'CCRIS record shows minor credit issues',
          '建议提供书面说明，并证明相关事项已解决或正在正常还款中',
          'BANK',
        ))
      }
    }
  }

  // ── 7. INDUSTRY_HIGH_RISK ────────────────────────────────────────────────
  {
    const riskLevel = cfg.industryRiskLevel(cas.client.industryCategory)
    if (riskLevel === 'VERY_HIGH' || riskLevel === 'HIGH') {
      flags.push(mkRisk(
        RiskFlagType.INDUSTRY_HIGH_RISK,
        riskLevel === 'VERY_HIGH' ? 'HIGH' : 'MEDIUM',
        `${cas.client.industryCategory} 行业属 ${riskLevel} 风险，银行审批普遍偏保守`,
        `${cas.client.industryCategory} is classified ${riskLevel} risk — banks typically apply conservative criteria`,
        '建议搭配足额抵押物或申请 CGC/SJPP 担保，以提升审批概率',
        cfg.isBankIndustryMapOverridden(cas.client.industryCategory) ? 'BANK' : 'GLOBAL',
      ))
    }
  }

  // ── 8. SHORT_TRACK_RECORD ────────────────────────────────────────────────
  // Raised when company age is above the hard floor but below the bank's preferred threshold
  {
    if (cfg.preferredBusinessAgeYearsMin !== null) {
      const preferredAgeMonths  = cfg.preferredBusinessAgeYearsMin * 12
      const aboveHardFloor =
        cfg.minCompanyAgeMonths === null || ageMonths >= cfg.minCompanyAgeMonths
      if (aboveHardFloor && ageMonths < preferredAgeMonths) {
        flags.push(mkRisk(
          RiskFlagType.SHORT_TRACK_RECORD,
          'LOW',
          `公司运营 ${ageMonths} 个月，低于此银行偏好的最短 ${preferredAgeMonths} 个月`,
          `Company has been operating ${ageMonths} months, below the bank's preferred minimum of ${preferredAgeMonths} months`,
          '建议提供详细的业务计划书、客户合同记录及稳定的流水历史',
          'BANK',
        ))
      }
    }
  }

  // ── 9. LEVERAGE_HIGH ─────────────────────────────────────────────────────
  {
    const debtRatio = fin.totalDebtToAnnualRevenuePct
    if (debtRatio !== null && debtRatio > cfg.maxTotalDebtToAnnualRevenuePct) {
      flags.push(mkRisk(
        RiskFlagType.LEVERAGE_HIGH,
        'MEDIUM',
        `总债务占年营收比例 ${debtRatio.toFixed(1)}%，杠杆率偏高`,
        `Total debt-to-revenue ratio ${debtRatio.toFixed(1)}% exceeds the threshold`,
        '建议先行偿还部分现有债务，或申请较低额度',
        bo.defaultMaxTotalDebtToAnnualRevenuePct !== undefined ? 'BANK' : 'GLOBAL',
      ))
    }
  }

  // ── 10. STATEMENT_QUALITY_ISSUE (composite) ───────────────────────────────
  // TODO [Phase 3 data]: This composite flag requires a dedicated config field,
  // e.g. GlobalEngineDefaults.statementQualityCompositeThreshold, that specifies
  // how many individual sub-issues (HIGH_BOUNCE_CHEQUES, HIGH_CASH_INFLOW_PCT,
  // HIGH_CUSTOMER_CONCENTRATION, low ending-balance ratio) must co-occur and at
  // what combined weight before the composite flag fires.
  //
  // Until that field is defined and seeded, this flag is intentionally NOT raised.
  // Individual sub-issues are already surfaced as separate RiskFlags above.
  // Implementing a fallback count threshold here (e.g. ">=2 issues") is forbidden
  // per Phase 2B spec because that would be a hardcoded magic number.
  void effectiveInflow  // satisfies linter; effectiveInflow used in callers

  return flags
}

// ────────────────────────────────────────────────────────────────────────────
// computeMatchScoreImpl
// ────────────────────────────────────────────────────────────────────────────

export function computeMatchScoreImpl(
  eligibilityFlags: EligibilityFlag[],
  riskFlags: RiskFlag[],
  thresholds: ScoringThresholds,
): MatchScore {
  // Gate 1: any unresolved HARD_BLOCK → immediately INELIGIBLE
  const hasHardBlock = eligibilityFlags.some(
    f => f.severity === 'HARD_BLOCK' && !f.passed,
  )
  if (hasHardBlock) return 'INELIGIBLE'

  // Gate 2: score by risk flag severity counts
  const highCount   = riskFlags.filter(f => f.severity === 'HIGH').length
  const mediumCount = riskFlags.filter(f => f.severity === 'MEDIUM').length

  if (highCount   >= thresholds.highRiskFlagCountForLow)    return 'LOW'
  if (highCount   >= thresholds.highRiskFlagCountForMedium) return 'MEDIUM'
  if (mediumCount >= thresholds.medRiskFlagCountForMedium)  return 'MEDIUM'
  return 'HIGH'
}

// ────────────────────────────────────────────────────────────────────────────
// computeAmountRangeImpl
// ────────────────────────────────────────────────────────────────────────────

export function computeAmountRangeImpl(
  cas: CaseWithFinancials,
  productConfig: ProductPolicyConfig,
  bankConfig: BankPolicyConfig,
  globalDefaults: GlobalEngineDefaults,
  effectiveInflow: number,
): AmountCalculationBreakdown {
  const cfg = resolveConfig(productConfig, bankConfig, globalDefaults)
  const fin = cas.financials

  // ── Method A: TURNOVER ────────────────────────────────────────────────────
  const methodA: AmountMethodResult = (() => {
    if (!isFinitePositive(effectiveInflow)) {
      return {
        method: 'TURNOVER' as const,
        rawLimit: 0,
        notes: 'Effective monthly inflow is zero or unavailable',
      }
    }
    const limit = effectiveInflow * cfg.turnoverMultiplierMax
    return {
      method: 'TURNOVER' as const,
      rawLimit: limit,
      notes: `RM ${effectiveInflow.toLocaleString()} effective inflow × ${cfg.turnoverMultiplierMax}× multiplier`,
    }
  })()

  // ── Method B: REVENUE ─────────────────────────────────────────────────────
  const methodB: AmountMethodResult = (() => {
    if (!isFinitePositive(fin.annualRevenueY1)) {
      return {
        method: 'REVENUE' as const,
        rawLimit: 0,
        notes: 'annualRevenueY1 is zero or unavailable',
      }
    }
    const limit = fin.annualRevenueY1! * (cfg.maxLoanToAnnualRevenuePct / 100)
    return {
      method: 'REVENUE' as const,
      rawLimit: limit,
      notes: `RM ${fin.annualRevenueY1!.toLocaleString()} annual revenue × ${cfg.maxLoanToAnnualRevenuePct}% cap`,
    }
  })()

  // ── Method C: DSCR back-calculation ──────────────────────────────────────
  // max loan = PV(rateMin/12, maxTenure, −(ebitdaY1/12 ÷ dscrMin))
  const methodC: AmountMethodResult = (() => {
    const missing: string[] = []
    if (!isFinitePositive(fin.ebitdaY1))          missing.push('ebitdaY1')
    if (cfg.dscrForAmountSizing === null)           missing.push('dscrForAmountSizing')
    if (cfg.rateMin === null)                       missing.push('productConfig.rateMin')
    if (cfg.maxTenureMonths === null)               missing.push('productConfig.maxTenureMonths')

    if (missing.length > 0) {
      return {
        method: 'DSCR' as const,
        rawLimit: 0,
        notes: `Cannot compute — missing: ${missing.join(', ')}`,
      }
    }

    const ebitda      = fin.ebitdaY1!
    const dscrTarget  = cfg.dscrForAmountSizing!
    const annualRate  = cfg.rateMin!
    const tenure      = cfg.maxTenureMonths!

    const maxMonthlyPayment = (ebitda / 12) / dscrTarget
    const monthlyRate       = (annualRate / 100) / 12
    const limit             = presentValue(maxMonthlyPayment, monthlyRate, tenure)

    return {
      method: 'DSCR' as const,
      rawLimit: limit,
      notes: [
        `EBITDA RM ${ebitda.toLocaleString()}/yr`,
        `÷ 12 ÷ DSCR ${dscrTarget}`,
        `→ max monthly pmt RM ${maxMonthlyPayment.toFixed(0)}`,
        `@ rate ${annualRate}% over ${tenure} months`,
      ].join(' '),
    }
  })()

  const methods: AmountMethodResult[] = [methodA, methodB, methodC]

  // ── Binding constraint selection ──────────────────────────────────────────
  // The binding method is whichever valid ceiling is SMALLEST (most conservative).
  type Binding = AmountCalculationBreakdown['bindingMethod']

  interface Candidate { method: Binding; value: number }

  const candidates: Candidate[] = [
    ...(isFinitePositive(methodA.rawLimit) ? [{ method: 'TURNOVER'    as Binding, value: methodA.rawLimit }] : []),
    ...(isFinitePositive(methodB.rawLimit) ? [{ method: 'REVENUE'     as Binding, value: methodB.rawLimit }] : []),
    ...(isFinitePositive(methodC.rawLimit) ? [{ method: 'DSCR'        as Binding, value: methodC.rawLimit }] : []),
    ...(isFinitePositive(cfg.maxLoanAmount) ? [{ method: 'PRODUCT_CAP' as Binding, value: cfg.maxLoanAmount! }] : []),
  ]

  if (candidates.length === 0) {
    return {
      methods,
      bindingMethod:      'NONE',
      effectiveInflowUsed: effectiveInflow,
      finalMin:            null,
      finalMax:            null,
    }
  }

  const binding  = candidates.reduce((min, c) => c.value < min.value ? c : min)
  const finalMax = binding.value

  // finalMin: lower bound from the TURNOVER method's min-multiplier,
  // clamped upward by the product's absolute minimum loan amount
  const lowerFromTurnover = isFinitePositive(effectiveInflow)
    ? effectiveInflow * cfg.turnoverMultiplierMin
    : null
  const productFloor  = cfg.minLoanAmount ?? 0
  const rawFinalMin   = lowerFromTurnover !== null
    ? Math.max(lowerFromTurnover, productFloor)
    : productFloor

  return {
    methods,
    bindingMethod:       binding.method,
    effectiveInflowUsed: effectiveInflow,
    finalMin:            isFinitePositive(rawFinalMin) ? rawFinalMin : null,
    finalMax,
  }
}
