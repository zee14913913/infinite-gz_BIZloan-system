// ─────────────────────────────────────────────────────────────────────────────
// Bank / Product types matching Corporate-Loan_Assessment.md §3.1
// These are the runtime shapes of block_a_json and block_b_json columns.
// ─────────────────────────────────────────────────────────────────────────────

export type FieldConfidenceValue = 'CONFIRMED' | 'LIKELY' | 'ESTIMATED' | 'CONFLICT' | 'MISSING'

export interface ProductBlockA {
  min_loan_amount:                   number | null
  max_loan_amount:                   number | null
  min_tenure_months:                 number | null
  max_tenure_months:                 number | null
  rate_type:                         'FIXED' | 'FLOATING' | 'BFR_BASED' | null
  base_rate:                         string | null
  rate_min:                          number | null
  rate_max:                          number | null
  min_company_age_months:            number | null
  eligible_company_types:            string[]
  eligible_industries:               string[]
  excluded_industries:               string[]
  min_annual_revenue:                number | null
  monthly_turnover_multiplier_min:   number | null
  monthly_turnover_multiplier_max:   number | null
  max_loan_to_annual_revenue_pct:    number | null
  dscr_min:                          number | null
  dscr_preferred:                    number | null
  dscr_formula_note:                 string | null
  ltv_max:                           number | null
  collateral_coverage_min:           number | null
  guarantee_fee_pct:                 number | null
  processing_fee:                    string | null
  stamp_duty:                        string | null
  confidence:                        FieldConfidenceValue | null
  last_verified_date:                string | null
  sources:                           string[]
  notes:                             string | null
}

export type ProcessStepType =
  | 'DOCUMENT_COLLECTION' | 'RM_ASSESSMENT' | 'CREDIT_SCORING'
  | 'SITE_VISIT' | 'CREDIT_COMMITTEE' | 'HO_REVIEW'
  | 'LETTER_OF_OFFER' | 'ACCEPTANCE' | 'LEGAL_DOCUMENTATION'
  | 'DISBURSEMENT' | 'POST_DISBURSEMENT'

export const ALL_STEP_TYPES: ProcessStepType[] = [
  'DOCUMENT_COLLECTION', 'RM_ASSESSMENT', 'CREDIT_SCORING',
  'SITE_VISIT', 'CREDIT_COMMITTEE', 'HO_REVIEW',
  'LETTER_OF_OFFER', 'ACCEPTANCE', 'LEGAL_DOCUMENTATION',
  'DISBURSEMENT', 'POST_DISBURSEMENT',
]

export const PROCESS_STEP_LABELS: Record<ProcessStepType, string> = {
  DOCUMENT_COLLECTION:  '文件收集',
  RM_ASSESSMENT:        'RM初步评估',
  CREDIT_SCORING:       '信用评分',
  SITE_VISIT:           '实地考察',
  CREDIT_COMMITTEE:     '信贷委员会审批',
  HO_REVIEW:            '总部复核',
  LETTER_OF_OFFER:      '发出贷款条件书',
  ACCEPTANCE:           '客户接受条件书',
  LEGAL_DOCUMENTATION:  '法律文件签署',
  DISBURSEMENT:         '贷款放款',
  POST_DISBURSEMENT:    '放款后跟进',
}

export interface RejectionReason {
  reason_code:      string
  description_zh:   string
  description_en:   string
  frequency:        'COMMON' | 'OCCASIONAL' | 'RARE'
  mitigation:       string | null
}

export interface EmpiricalRule {
  rule_type:   string
  formula:     string
  conditions:  string[]
  source:      string | null
  confidence:  FieldConfidenceValue
}

export interface ProcessStep {
  step_type:                  ProcessStepType
  step_order:                 number
  trigger_conditions:         string[]
  site_visit_threshold:       string | null
  typical_duration_days_min:  number | null
  typical_duration_days_max:  number | null
  duration_notes:             string | null
  responsible_party:          string | null
  key_actions:                string[]
  common_blockers:            string[]
  client_requirements:        string[]
  rejection_reasons:          RejectionReason[]
  empirical_rules:            EmpiricalRule[]
  confidence:                 FieldConfidenceValue
  sources:                    string[]
  notes:                      string | null
}

// Default empty structures for new products
export function defaultBlockA(): ProductBlockA {
  return {
    min_loan_amount: null, max_loan_amount: null,
    min_tenure_months: null, max_tenure_months: null,
    rate_type: null, base_rate: null, rate_min: null, rate_max: null,
    min_company_age_months: null,
    eligible_company_types: [], eligible_industries: [], excluded_industries: [],
    min_annual_revenue: null,
    monthly_turnover_multiplier_min: null, monthly_turnover_multiplier_max: null,
    max_loan_to_annual_revenue_pct: null,
    dscr_min: null, dscr_preferred: null, dscr_formula_note: null,
    ltv_max: null, collateral_coverage_min: null, guarantee_fee_pct: null,
    processing_fee: null, stamp_duty: null,
    confidence: null, last_verified_date: null, sources: [], notes: null,
  }
}

export function defaultBlockB(): ProcessStep[] {
  return ALL_STEP_TYPES.map((step_type, i) => ({
    step_type,
    step_order: i + 1,
    trigger_conditions: [], site_visit_threshold: null,
    typical_duration_days_min: null, typical_duration_days_max: null,
    duration_notes: null, responsible_party: null,
    key_actions: [], common_blockers: [], client_requirements: [],
    rejection_reasons: [], empirical_rules: [],
    confidence: 'MISSING' as FieldConfidenceValue,
    sources: [], notes: null,
  }))
}

export function safeParseJSON<T>(json: string | null | undefined, fallback: T): T {
  if (!json) return fallback
  try { return JSON.parse(json) as T } catch { return fallback }
}

// Confidence badge CSS class helper
export const CONFIDENCE_BADGE: Record<FieldConfidenceValue, string> = {
  CONFIRMED: 'badge-confirmed',
  LIKELY:    'badge-todo',
  ESTIMATED: 'badge-conflict',
  CONFLICT:  'badge-conflict',
  MISSING:   'badge-missing',
}
