// ─────────────────────────────────────────────────────────────────────────────
// Client-safe enum constant objects.
// These mirror the Prisma enum values from schema.prisma EXACTLY,
// but contain NO Prisma import — safe for use in 'use client' components.
//
// Server components and API routes should import directly from:
//   '@/generated/prisma/client'
// Client components must import from this file instead.
// ─────────────────────────────────────────────────────────────────────────────

export const INSTITUTION_TYPE = {
  COMMERCIAL_BANK:  'COMMERCIAL_BANK',
  ISLAMIC_BANK:     'ISLAMIC_BANK',
  DFI:              'DFI',
  GUARANTEE_AGENCY: 'GUARANTEE_AGENCY',
  BNM_FUND:         'BNM_FUND',
  P2P_PLATFORM:     'P2P_PLATFORM',
  COOPERATIVE:      'COOPERATIVE',
} as const
export type InstitutionTypeValue = (typeof INSTITUTION_TYPE)[keyof typeof INSTITUTION_TYPE]

export const LOAN_STRUCTURE = {
  TERM_LOAN:        'TERM_LOAN',
  OVERDRAFT:        'OVERDRAFT',
  TRADE_FINANCE:    'TRADE_FINANCE',
  INVOICE_FINANCING:'INVOICE_FINANCING',
  HIRE_PURCHASE:    'HIRE_PURCHASE',
  LEASING:          'LEASING',
  REVOLVING_CREDIT: 'REVOLVING_CREDIT',
  BRIDGING_LOAN:    'BRIDGING_LOAN',
  PROPERTY_LOAN:    'PROPERTY_LOAN',
} as const
export type LoanStructureValue = (typeof LOAN_STRUCTURE)[keyof typeof LOAN_STRUCTURE]

export const COLLATERAL_REQUIREMENT = {
  UNSECURED:            'UNSECURED',
  PROPERTY:             'PROPERTY',
  FIXED_DEPOSIT:        'FIXED_DEPOSIT',
  GOVERNMENT_GUARANTEE: 'GOVERNMENT_GUARANTEE',
  MIXED:                'MIXED',
} as const
export type CollateralRequirementValue = (typeof COLLATERAL_REQUIREMENT)[keyof typeof COLLATERAL_REQUIREMENT]

export const GUARANTEE_SCHEME = {
  CGC_BIZMAJU:             'CGC_BIZMAJU',
  CGC_BIZWANITA:           'CGC_BIZWANITA',
  CGC_BIZJAMIN:            'CGC_BIZJAMIN',
  CGC_PORTFOLIO_GUARANTEE: 'CGC_PORTFOLIO_GUARANTEE',
  SJPP_TPKS:               'SJPP_TPKS',
  SJPP_TPUB:               'SJPP_TPUB',
  SJPP_TTSS:               'SJPP_TTSS',
  BNM_TPUB:                'BNM_TPUB',
  BNM_TPKS:                'BNM_TPKS',
  BNM_FSMI2:               'BNM_FSMI2',
  NONE:                    'NONE',
} as const
export type GuaranteeSchemeValue = (typeof GUARANTEE_SCHEME)[keyof typeof GUARANTEE_SCHEME]
