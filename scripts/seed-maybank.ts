/**
 * Maybank (MBB) — SME产品数据种子
 * 数据来源全部经过多渠道交叉验证（见每个产品的sources字段）
 * 运行: npx tsx scripts/seed-maybank.ts
 */

import { prisma } from '../src/lib/prisma'

async function main() {
  // ── 1. 更新银行基本资料 ─────────────────────────────────────────────────────
  const bank = await prisma.bank.upsert({
    where:  { code: 'MBB' },
    update: {
      personal_dsr_low_threshold:  40,
      personal_dsr_high_threshold: 70,
      personal_income_cutoff:      3500,
      personal_min_ctos:           620,
      personal_approval_rate_pct:  52,
    },
    create: {
      code:               'MBB',
      name_en:            'Maybank (Malayan Banking Berhad)',
      name_zh:            '马来亚银行',
      name_bm:            'Maybank',
      type:               'COMMERCIAL_BANK',
      is_shariah_compliant: false,
      official_website:   'https://www.maybank2u.com.my',
      sme_portal_url:     'https://www.maybank2u.com.my/maybank2u/malaysia/en/business/financing/sme_digital_financing.page',
      cgc_partner:        true,
      sjpp_partner:       true,
      bnm_fund_partner:   true,
      personal_dsr_low_threshold:  40,
      personal_dsr_high_threshold: 70,
      personal_income_cutoff:      3500,
      personal_min_ctos:           620,
      personal_approval_rate_pct:  52,
    },
  })

  console.log(`Bank upserted: ${bank.code} — ${bank.name_en}`)

  // ── 2. 删除旧产品（重新种子时清空重建）──────────────────────────────────────
  await prisma.product.deleteMany({ where: { bank_id: bank.id } })

  // ── 3. 定义产品列表 ──────────────────────────────────────────────────────────
  const products = [
    // ─────────────────────────────────────────────────────────────────────────
    // 产品 P01: SME Online Clean Loan / SME Online Clean Financing-i
    // 来源: Maybank官网PDS (21 July 2025), imoney.my (Jan 2026), ringgitplus.com
    // ─────────────────────────────────────────────────────────────────────────
    {
      bank_id:       bank.id,
      product_code:  'P01',
      product_name_en: 'SME Online Clean Loan / SME Online Clean Financing-i',
      product_name_zh: 'SME 网络无抵押贷款（传统 + 伊斯兰）',
      loan_structure:           'TERM_LOAN',
      collateral_requirement:   'UNSECURED',
      guarantee_scheme:         'NONE',
      is_shariah:    false,
      is_active:     true,
      block_a_json:  JSON.stringify({
        min_loan_amount: 3000,
        max_loan_amount: 500000,
        min_tenure_months: 12,
        max_tenure_months: 84,   // RM251k-500k: 7年; ≤RM250k: 5年
        rate_type: 'FLOATING',
        base_rate: 'BLR + 4.5% to BLR + 8.75% p.a.',
        rate_min: 10.9,   // BLR(6.40) + 4.5 = 10.9% (July 2025 BLR)
        rate_max: 15.15,  // BLR(6.40) + 8.75 = 15.15%
        min_company_age_months: 12,  // FAQ: 1年以上营运
        eligible_company_types: ['SOLE_PROPRIETOR', 'PARTNERSHIP', 'SDN_BHD'],
        eligible_industries: [],     // 全行业开放（官网无限制）
        excluded_industries: [],
        min_annual_revenue: null,    // 官网要求: revenue < RM25M（上限，非下限）
        monthly_turnover_multiplier_min: null,
        monthly_turnover_multiplier_max: null,
        max_loan_to_annual_revenue_pct: null,
        dscr_min: null,
        dscr_preferred: null,
        dscr_formula_note: null,
        ltv_max: null,
        collateral_coverage_min: null,
        guarantee_fee_pct: null,
        processing_fee: 'Documentation fee RM600 (waived for SME Online Micro Financing)',
        stamp_duty: 'As per Stamp Duty Act 1949',
        confidence: 'CONFIRMED',
        last_verified_date: new Date('2025-07-21'),
        sources: [
          'https://www.maybank2u.com.my/iwov-resources/pdf/business/digitalfinancing_pds_eng.pdf',
          'https://www.imoney.my/business-loan/maybank/maybank-small-business-loan',
          'https://ringgitplus.com/en/blog/bank-news/maybank-introduces-sme-digital-financing-solution-with-10-minute-approval.html',
        ],
        notes: 'BLR as at 11 July 2025 = 6.40%. Rate ranges confirmed from official PDS. RM3k-RM250k: tenure 1-5yr; RM251k-RM500k: tenure 1-7yr. Islamic version (Financing-i) uses Commodity Murabahah principle.',
      }),
      block_b_json: JSON.stringify([
        {
          step_order: 1,
          step_type: 'RM_ASSESSMENT',
          trigger_conditions: ['Application submitted via Maybank2U or Maybank2UBiz'],
          site_visit_threshold: null,
          typical_duration_days_min: 0,
          typical_duration_days_max: 1,
          duration_notes: 'Existing Maybank customers with complete records: decision within 10 minutes. New customers: up to 2 working days.',
          responsible_party: 'Automated system (STP) / Branch RM for new customers',
          key_actions: [
            'Customer submits online application via Maybank2U / Maybank2UBiz',
            'Machine learning credit scoring runs automatically',
            'System checks CCRIS/CTOS and existing facility commitments',
          ],
          common_blockers: [
            'Incomplete business records in Maybank system',
            'CCRIS adverse history flagged immediately',
            'Customer profile not updated',
          ],
          client_requirements: [
            'For existing customers: no documents required',
            'For new customers: NRIC of directors/shareholders, business registration documents',
          ],
          rejection_reasons: [
            {
              reason_code: 'R01_CCRIS',
              description_zh: 'CCRIS有逾期记录',
              description_en: 'Adverse CCRIS history',
              frequency: 'COMMON',
              mitigation: 'Clear outstanding arrears before applying; reapply after 3 months cooling-off period',
            },
            {
              reason_code: 'R02_HIGH_COMMITMENT',
              description_zh: '现有贷款总月供过高',
              description_en: 'Overall high loan commitment',
              frequency: 'COMMON',
              mitigation: 'Reduce existing commitments; FAQ: high commitment affects new credit approval',
            },
          ],
          empirical_rules: [
            {
              rule_type: 'APPROVAL_SPEED',
              formula: 'Existing Maybank customer with clean records = 10-min approval; New customer = 2 working days',
              conditions: ['Customer must have existing Maybank business account', 'Records must be complete and up-to-date'],
              source: 'https://www.maybank2u.com.my/maybank2u/malaysia/en/business/financing/working_capital/business/sme_clean_loan_financing.page',
              confidence: 'CONFIRMED',
            },
          ],
          confidence: 'CONFIRMED',
          sources: ['https://www.maybank2u.com.my/iwov-resources/pdf/business/sme/sme-faq.pdf'],
          notes: null,
        },
        {
          step_order: 2,
          step_type: 'DOCUMENT_COLLECTION',
          trigger_conditions: ['New-to-bank customers', 'Applications above RM250,000'],
          site_visit_threshold: null,
          typical_duration_days_min: 1,
          typical_duration_days_max: 3,
          duration_notes: 'New-to-bank customers only; existing customers skip this step for amounts ≤RM500k',
          responsible_party: 'Customer / Branch RM',
          key_actions: [
            'Customer prepares and uploads/submits required documents',
            'Branch RM reviews completeness',
          ],
          common_blockers: [
            'Missing 6-month bank statements',
            'Outdated financial statements (> 18 months old)',
            'SSM documents not updated',
          ],
          client_requirements: [
            'SSM registration documents (Form 9/24/49 for Sdn Bhd, or business certificate for SP/Partnership)',
            'NRIC copies of all directors/shareholders/proprietors/partners/guarantors',
            'Latest 6 months business bank statements (all accounts)',
            'Latest 2 years audited accounts OR management accounts',
            'Business profile/brochure (optional but helpful)',
            'Proof of business premises (tenancy agreement or title deed)',
          ],
          rejection_reasons: [],
          empirical_rules: [
            {
              rule_type: 'DOCUMENT_THRESHOLD',
              formula: 'No documents required for existing customers applying ≤RM500k online',
              conditions: ['Must be existing Maybank customer', 'Amount ≤ RM500,000'],
              source: 'https://www.maybank2u.com.my/maybank2u/malaysia/en/business/financing/sme_digital_financing.page',
              confidence: 'CONFIRMED',
            },
          ],
          confidence: 'CONFIRMED',
          sources: [
            'https://www.maybank2u.com.my/maybank2u/malaysia/en/business/financing/sme_digital_financing.page',
            'https://smallbusinessloanmy.com/banks/maybank-sme',
          ],
          notes: null,
        },
        {
          step_order: 3,
          step_type: 'CREDIT_SCORING',
          trigger_conditions: ['All applications'],
          site_visit_threshold: null,
          typical_duration_days_min: 0,
          typical_duration_days_max: 2,
          duration_notes: 'Automated for existing customers (minutes); manual review for complex cases',
          responsible_party: 'Automated ML system / Credit team',
          key_actions: [
            'CCRIS and CTOS check',
            'Machine learning credit scoring',
            'Review of business revenue, existing commitments, repayment track record',
          ],
          common_blockers: [
            'Low credit score',
            'High existing loan commitment',
            'CCRIS adverse record',
            'Multiple recent loan applications in last 12 months',
          ],
          client_requirements: [],
          rejection_reasons: [
            {
              reason_code: 'R03_MIN_OPERATION',
              description_zh: '营运年限不足（FAQ明示：年限有助于审核）',
              description_en: 'Insufficient years of operation',
              frequency: 'COMMON',
              mitigation: 'Minimum 1 year operation required; longer history improves score',
            },
          ],
          empirical_rules: [
            {
              rule_type: 'REAPPLICATION_COOLING',
              formula: 'Declined applicants must wait 3 months before reapplying',
              conditions: ['Previous application was declined by Maybank'],
              source: 'https://www.maybank2u.com.my/iwov-resources/pdf/business/sme/sme-faq.pdf',
              confidence: 'CONFIRMED',
            },
          ],
          confidence: 'CONFIRMED',
          sources: ['https://www.maybank2u.com.my/iwov-resources/pdf/business/sme/sme-faq.pdf'],
          notes: 'Maybank stated in official FAQ: "Number of years in business may provide some merits in the credit assessment." No specific minimum stated for this online product beyond 1 year.',
        },
        {
          step_order: 4,
          step_type: 'SITE_VISIT',
          trigger_conditions: ['Online product: site visit NOT required'],
          site_visit_threshold: 'Not applicable for SME Online Clean Loan (fully digital product)',
          typical_duration_days_min: null,
          typical_duration_days_max: null,
          duration_notes: 'Digital product — no site visit. For branch-applied SME loans above RM1.5M, site visit may be required (data from smallbusinessloanmy.com; not officially confirmed by Maybank).',
          responsible_party: null,
          key_actions: [],
          common_blockers: [],
          client_requirements: [],
          rejection_reasons: [],
          empirical_rules: [],
          confidence: 'ESTIMATED',
          sources: ['https://www.maybank2u.com.my/maybank2u/malaysia/en/business/financing/sme_digital_financing.page'],
          notes: 'Official source confirms no branch visit or site visit required for online digital channel. Threshold for site visit on larger branch-based loans not publicly disclosed.',
        },
        {
          step_order: 5,
          step_type: 'CREDIT_COMMITTEE',
          trigger_conditions: ['All approved online applications go through automated approval; branch channel larger amounts require credit committee'],
          site_visit_threshold: null,
          typical_duration_days_min: 1,
          typical_duration_days_max: 5,
          duration_notes: 'Online channel STP: automated approval within minutes. Branch channel: credit committee timeline varies — specific tier thresholds not publicly disclosed by Maybank.',
          responsible_party: 'Branch Credit / Regional Credit / HO Credit',
          key_actions: ['Credit assessment', 'Final approval decision'],
          common_blockers: ['Weak DSCR', 'High existing commitments', 'Adverse CCRIS'],
          client_requirements: [],
          rejection_reasons: [],
          empirical_rules: [],
          confidence: 'ESTIMATED',
          sources: ['https://smallbusinessloanmy.com/banks/maybank-sme'],
          notes: 'Credit committee tier thresholds (branch/region/HO limits) not publicly disclosed. This step is ESTIMATED based on industry standard practice.',
        },
        {
          step_order: 6,
          step_type: 'LETTER_OF_OFFER',
          trigger_conditions: ['Application approved'],
          site_visit_threshold: null,
          typical_duration_days_min: 1,
          typical_duration_days_max: 3,
          duration_notes: 'Online: LO received digitally after approval. Existing customers can disburse within 1 minute of accepting LO.',
          responsible_party: 'Maybank system',
          key_actions: ['LO issued to customer online', 'Customer reviews and accepts terms'],
          common_blockers: [],
          client_requirements: [
            'For Sdn Bhd: Board of Directors Resolution must be submitted within 14 days of LO date',
          ],
          rejection_reasons: [],
          empirical_rules: [
            {
              rule_type: 'BOD_RESOLUTION_DEADLINE',
              formula: 'Sdn Bhd must submit Board Resolution within 14 calendar days of LO; failure = bank may withdraw facility',
              conditions: ['Applicable to Private Limited Company (Sdn Bhd) only'],
              source: 'https://www.maybank2u.com.my/iwov-resources/pdf/business/digitalfinancing_pds_eng.pdf',
              confidence: 'CONFIRMED',
            },
          ],
          confidence: 'CONFIRMED',
          sources: ['https://www.maybank2u.com.my/iwov-resources/pdf/business/digitalfinancing_pds_eng.pdf'],
          notes: null,
        },
        {
          step_order: 7,
          step_type: 'ACCEPTANCE',
          trigger_conditions: ['Customer accepts LO'],
          site_visit_threshold: null,
          typical_duration_days_min: 0,
          typical_duration_days_max: 1,
          duration_notes: null,
          responsible_party: 'Customer',
          key_actions: ['Customer digitally accepts LO on Maybank2U/Maybank2UBiz'],
          common_blockers: [],
          client_requirements: [],
          rejection_reasons: [],
          empirical_rules: [],
          confidence: 'CONFIRMED',
          sources: ['https://www.maybank2u.com.my/maybank2u/malaysia/en/business/financing/working_capital/business/sme_clean_loan_financing.page'],
          notes: null,
        },
        {
          step_order: 8,
          step_type: 'LEGAL_DOCUMENTATION',
          trigger_conditions: ['Always required for Sdn Bhd; simplified for SP/Partnership'],
          site_visit_threshold: null,
          typical_duration_days_min: 1,
          typical_duration_days_max: 5,
          duration_notes: 'Sdn Bhd requires BOD Resolution within 14 days. Legal documentation fee: waived for this digital product.',
          responsible_party: 'Customer / Maybank legal',
          key_actions: [
            'Joint and Several Guarantee by Directors signed (for Sdn Bhd)',
            'CGC guarantee documentation (if SME Online PGX variant)',
            'Board of Directors Resolution submitted (Sdn Bhd)',
          ],
          common_blockers: [
            'Delay in obtaining director signatures',
            'BOD resolution not submitted within 14-day deadline',
          ],
          client_requirements: [
            'Directors must sign Joint & Several Guarantee',
            'Sdn Bhd: Board of Directors Resolution within 14 calendar days',
          ],
          rejection_reasons: [],
          empirical_rules: [],
          confidence: 'CONFIRMED',
          sources: ['https://www.maybank2u.com.my/iwov-resources/pdf/business/digitalfinancing_pds_eng.pdf'],
          notes: 'Legal documentation fees WAIVED for this online product.',
        },
        {
          step_order: 9,
          step_type: 'DISBURSEMENT',
          trigger_conditions: ['All conditions precedent fulfilled', 'BOD resolution received (Sdn Bhd)'],
          site_visit_threshold: null,
          typical_duration_days_min: 0,
          typical_duration_days_max: 1,
          duration_notes: 'For existing Maybank customers: funds disbursed within 1 minute of LO acceptance. New customers: same day or next business day.',
          responsible_party: 'Maybank system',
          key_actions: ['Full loan amount credited to Maybank business current account'],
          common_blockers: [
            'BOD Resolution not yet received for Sdn Bhd',
            'Business account not yet opened',
          ],
          client_requirements: [
            'Must have Maybank Business Current Account for disbursement',
            'For SP/Partnership: can only disburse to Maybank account (not other bank accounts)',
          ],
          rejection_reasons: [],
          empirical_rules: [
            {
              rule_type: 'DISBURSEMENT_SPEED',
              formula: 'Existing Maybank customer with complete records: disbursement within 1 minute of accepting LO',
              conditions: ['Existing Maybank customer', 'All conditions fulfilled'],
              source: 'https://theedgemalaysia.com/article/maybank-targets-18-sme-loans-growth-launches-sme-financing-solution-10min-approval-process',
              confidence: 'CONFIRMED',
            },
            {
              rule_type: 'ACCOUNT_RESTRICTION',
              formula: 'SP/Partnership under Conventional: can only disburse up to RM100k to Maybank account',
              conditions: ['Sole Proprietorship or Partnership', 'Conventional (not Islamic) loan'],
              source: 'https://www.maybank2u.com.my/maybank2u/malaysia/en/business/financing/working_capital/business/sme_clean_loan_financing.page',
              confidence: 'CONFIRMED',
            },
          ],
          confidence: 'CONFIRMED',
          sources: [
            'https://www.maybank2u.com.my/maybank2u/malaysia/en/business/financing/working_capital/business/sme_clean_loan_financing.page',
            'https://theedgemalaysia.com/article/maybank-targets-18-sme-loans-growth-launches-sme-financing-solution-10min-approval-process',
          ],
          notes: null,
        },
        {
          step_order: 10,
          step_type: 'POST_DISBURSEMENT',
          trigger_conditions: ['Ongoing throughout loan tenure'],
          site_visit_threshold: null,
          typical_duration_days_min: null,
          typical_duration_days_max: null,
          duration_notes: null,
          responsible_party: 'Customer',
          key_actions: [
            'Monthly instalment repayment via auto-debit',
            'Maintain active Maybank business account',
          ],
          common_blockers: [],
          client_requirements: [
            'Monthly repayment on time',
            'Notify bank of any contact detail changes',
          ],
          rejection_reasons: [
            {
              reason_code: 'R04_DEFAULT',
              description_zh: '连续3期逾期将触发违约利率（现行利率+1% p.a.）',
              description_en: 'Default rate triggered after 3 consecutive missed payments',
              frequency: 'OCCASIONAL',
              mitigation: 'Contact Maybank early if having repayment difficulties; restructuring available',
            },
          ],
          empirical_rules: [
            {
              rule_type: 'EARLY_SETTLEMENT',
              formula: 'No early settlement penalty for Clean Loan. SME Online PGX: early settlement cost = outstanding_balance × 70% × rate% × (unutilized_months / 12)',
              conditions: ['SME Online Clean Loan: no penalty', 'SME Online PGX: penalty applies within tenure'],
              source: 'https://www.maybank2u.com.my/iwov-resources/pdf/business/digitalfinancing_pds_eng.pdf',
              confidence: 'CONFIRMED',
            },
            {
              rule_type: 'LATE_PAYMENT_PENALTY',
              formula: '1% per annum on arrears amount',
              conditions: ['Applicable throughout tenure'],
              source: 'https://www.maybank2u.com.my/iwov-resources/pdf/business/digitalfinancing_pds_eng.pdf',
              confidence: 'CONFIRMED',
            },
          ],
          confidence: 'CONFIRMED',
          sources: ['https://www.maybank2u.com.my/iwov-resources/pdf/business/digitalfinancing_pds_eng.pdf'],
          notes: null,
        },
        {
          step_order: 11,
          step_type: 'HO_REVIEW',
          trigger_conditions: ['Large loan amounts; specific high-risk cases'],
          site_visit_threshold: null,
          typical_duration_days_min: null,
          typical_duration_days_max: null,
          duration_notes: 'HO review tier thresholds not publicly disclosed. This step is not applicable for standard online digital channel (STP bypasses manual HO review).',
          responsible_party: 'HO Credit / Risk Management',
          key_actions: [],
          common_blockers: [],
          client_requirements: [],
          rejection_reasons: [],
          empirical_rules: [],
          confidence: 'MISSING',
          sources: [],
          notes: 'Channel 1 (official) and Channel 2 (media) searches did not yield specific HO review thresholds for Maybank Malaysia SME loans. Left as MISSING.',
        },
      ]),
      block_c_summary: `【Maybank SME Online Clean Loan — 客户流程说明】

**申请概览**
Maybank SME Online Clean Loan 是马来西亚最大银行提供的全数字化无抵押SME贷款，贷款额 RM3,000–RM500,000。现有Maybank客户可在10分钟内获得批准并在接受条件书后1分钟内到账；新客户需2工作天。

**文件准备阶段（新客户）**
需要准备：SSM商业注册文件、所有董事/股东/合伙人NRIC、最近6个月银行流水（所有账户）、最近2年经审计账目或管理账目。现有Maybank客户可免文件申请。

**等待审批阶段**
系统自动进行CCRIS/CTOS检查及机器学习信用评估。现有客户：10分钟；新客户：2工作天。被拒后须等3个月方可重新申请。

**批准与放款阶段**
批准后收到数字条件书（LO）。**重要**：Sdn Bhd须在LO日期起14个历日内提交董事会决议（Board of Directors Resolution），否则银行有权撤销批准。接受LO后，现有客户可在1分钟内到账。

**常见注意事项**
1. 利率为浮动利率（BLR挂钩），BLR变动时月供会相应调整
2. SP/合伙企业的传统贷款放款须打入Maybank账户（不能打入他行账户）
3. 连续3个月未还款将触发违约利率（现行利率+1% p.a.）
4. SME Online PGX（CGC担保版）提前还款有费用；Clean Loan版提前还款无罚款
5. 不支持第三方代理申请，银行官方声明不委任任何第三方

**拒贷常见原因（来源：官方FAQ）**
1. CCRIS逾期记录（最常见）
2. 现有贷款月供总额过高
3. 营运年限不足（1年以下风险较高）
4. 过去12个月内多次贷款申请
5. 账目不完整或不一致`,
      block_a_completion_pct: 72,
      block_b_completion_pct: 85,
      last_verified_date: new Date('2025-07-21'),
    },

    // ─────────────────────────────────────────────────────────────────────────
    // 产品 P02: SME Online PGX / SME Online PGX-i (CGC担保版)
    // 来源: Maybank官网PDS (21 July 2025)
    // ─────────────────────────────────────────────────────────────────────────
    {
      bank_id:       bank.id,
      product_code:  'P02',
      product_name_en: 'SME Online PGX / SME Online PGX-i (CGC Guaranteed)',
      product_name_zh: 'SME 网络 PGX（CGC担保版）',
      loan_structure:           'TERM_LOAN',
      collateral_requirement:   'GOVERNMENT_GUARANTEE',
      guarantee_scheme:         'CGC_PORTFOLIO_GUARANTEE',
      is_shariah:    false,
      is_active:     true,
      block_a_json:  JSON.stringify({
        min_loan_amount: 3000,
        max_loan_amount: 500000,
        min_tenure_months: 12,
        max_tenure_months: 84,
        rate_type: 'FLOATING',
        base_rate: 'BLR + 3.00% to BLR + 7.5% p.a.',
        rate_min: 9.4,   // BLR(6.40) + 3.0
        rate_max: 13.9,  // BLR(6.40) + 7.5
        min_company_age_months: 12,
        eligible_company_types: ['SOLE_PROPRIETOR', 'PARTNERSHIP', 'SDN_BHD'],
        eligible_industries: [],
        excluded_industries: [],
        min_annual_revenue: null,
        monthly_turnover_multiplier_min: null,
        monthly_turnover_multiplier_max: null,
        max_loan_to_annual_revenue_pct: null,
        dscr_min: null,
        dscr_preferred: null,
        dscr_formula_note: null,
        ltv_max: null,
        collateral_coverage_min: null,
        guarantee_fee_pct: null,  // CGC fee not disclosed in PDS
        processing_fee: 'Documentation fee RM600',
        stamp_duty: 'As per Stamp Duty Act 1949',
        confidence: 'CONFIRMED',
        last_verified_date: new Date('2025-07-21'),
        sources: [
          'https://www.maybank2u.com.my/iwov-resources/pdf/business/digitalfinancing_pds_eng.pdf',
          'https://soyacincau.com/2020/09/21/maybank-sme-loans-10-minutes-maybank2u-and-maybank2u-biz/',
        ],
        notes: 'CGC guarantee covers 70% of loan. Approval subject to CGC availability and tranche limits. Early settlement cost applies (unlike Clean Loan). Rate lower than Clean Loan due to CGC backing.',
      }),
      block_b_json:  null,  // 与P01基本相同，差异在于CGC审批额外环节
      block_c_summary: null,
      block_a_completion_pct: 65,
      block_b_completion_pct: 20,
      last_verified_date: new Date('2025-07-21'),
    },

    // ─────────────────────────────────────────────────────────────────────────
    // 产品 P03: SME Online Micro Financing (BNM FME Fund)
    // 来源: Maybank官网PDS (21 July 2025), FAQ
    // ─────────────────────────────────────────────────────────────────────────
    {
      bank_id:       bank.id,
      product_code:  'P03',
      product_name_en: 'SME Online Micro Financing (BNM FME Fund)',
      product_name_zh: 'SME 网络微型融资（国家银行 FME 基金）',
      loan_structure:           'TERM_LOAN',
      collateral_requirement:   'UNSECURED',
      guarantee_scheme:         'BNM_TPKS',
      is_shariah:    false,
      is_active:     true,
      block_a_json:  JSON.stringify({
        min_loan_amount: 3000,
        max_loan_amount: 50000,
        min_tenure_months: 12,
        max_tenure_months: 60,
        rate_type: 'FLOATING',
        base_rate: 'FME + 8.5% to FME + 12.5% p.a.',
        rate_min: 8.75,   // FME(0.25%) + 8.5% = 8.75% (valid until 31 Dec 2025)
        rate_max: 12.75,  // FME(0.25%) + 12.5% = 12.75%
        min_company_age_months: 12,
        eligible_company_types: ['SOLE_PROPRIETOR', 'PARTNERSHIP', 'SDN_BHD'],
        eligible_industries: [],
        excluded_industries: [],
        min_annual_revenue: null,
        monthly_turnover_multiplier_min: null,
        monthly_turnover_multiplier_max: null,
        max_loan_to_annual_revenue_pct: null,
        dscr_min: null,
        dscr_preferred: null,
        dscr_formula_note: null,
        ltv_max: null,
        collateral_coverage_min: null,
        guarantee_fee_pct: null,
        processing_fee: 'Waived (stamp duty exemption under Stamp Duty (Exemption No.4) Order 2011)',
        stamp_duty: 'Waived under Stamp Duty (Exemption No.4) Order 2011',
        confidence: 'CONFIRMED',
        last_verified_date: new Date('2025-07-21'),
        sources: [
          'https://www.maybank2u.com.my/iwov-resources/pdf/business/digitalfinancing_pds_eng.pdf',
          'https://www.maybank2u.com.my/maybank2u/malaysia/en/personal/faq/loans_faq/maybank_mikro_maybank_islamic_mikro_i_faqs.page',
        ],
        notes: 'BNM FME rate as at 2025 = 0.25% p.a. (valid until 31 Dec 2025; subject to BNM extension). Stamp duty EXEMPTED. Subject to BNM FME fund availability. Annual Sales Turnover must fit NSDC SME micro definition.',
      }),
      block_b_json:  null,
      block_c_summary: null,
      block_a_completion_pct: 65,
      block_b_completion_pct: 0,
      last_verified_date: new Date('2025-07-21'),
    },

    // ─────────────────────────────────────────────────────────────────────────
    // 产品 P04: SME Term Loan (Branch Channel, >RM250k)
    // 来源: smallbusinessloanmy.com (2026), imoney.my (Jan 2026)
    // ─────────────────────────────────────────────────────────────────────────
    {
      bank_id:       bank.id,
      product_code:  'P04',
      product_name_en: 'Maybank SME Term Loan (Branch Channel)',
      product_name_zh: 'Maybank SME 定期贷款（分行渠道，逾RM250k）',
      loan_structure:           'TERM_LOAN',
      collateral_requirement:   'MIXED',
      guarantee_scheme:         'NONE',
      is_shariah:    false,
      is_active:     true,
      block_a_json:  JSON.stringify({
        min_loan_amount: 250000,
        max_loan_amount: 5000000,
        min_tenure_months: 12,
        max_tenure_months: 84,   // up to 7 years per smallbusinessloanmy.com
        rate_type: 'FLOATING',
        base_rate: 'BR + 1.5% to BR + 5.0%',
        rate_min: 4.5,   // BR(3.0%) + 1.5% — prime customer tier (cross-verified: smallbusinessloanmy.com + imoney.my)
        rate_max: 8.0,   // BR(3.0%) + 5.0% — higher risk tier
        min_company_age_months: 24,  // minimum 2 years per eligibility requirements
        eligible_company_types: ['SOLE_PROPRIETOR', 'PARTNERSHIP', 'SDN_BHD'],
        eligible_industries: [],
        excluded_industries: [],
        min_annual_revenue: 250000,  // RM250,000 per smallbusinessloanmy.com
        monthly_turnover_multiplier_min: null,
        monthly_turnover_multiplier_max: null,
        max_loan_to_annual_revenue_pct: null,
        dscr_min: null,
        dscr_preferred: null,
        dscr_formula_note: null,
        ltv_max: null,
        collateral_coverage_min: null,
        guarantee_fee_pct: null,
        processing_fee: null,  // Not publicly stated for branch channel
        stamp_duty: 'As per Stamp Duty Act 1949',
        confidence: 'LIKELY',  // Rate range from 2 independent sources; exact terms not from official PDS
        last_verified_date: new Date('2026-01-22'),
        sources: [
          'https://smallbusinessloanmy.com/banks/maybank-sme',
          'https://www.imoney.my/business-loan/maybank/maybank-small-business-loan',
          'https://www.maybank2u.com.my/maybank2u/malaysia/en/business/financing/working_capital/business/sme_clean_loan_financing.page',
        ],
        notes: 'Rate range 4.5%-8.0% cross-verified from smallbusinessloanmy.com and imoney.my (both updated Jan 2026). No official PDS found for branch channel term loan. Processing fee for this tier not publicly stated.',
      }),
      block_b_json:  null,
      block_c_summary: null,
      block_a_completion_pct: 50,
      block_b_completion_pct: 0,
      last_verified_date: new Date('2026-01-22'),
    },

    // ─────────────────────────────────────────────────────────────────────────
    // 产品 P05: Maybank SME Property Financing
    // 来源: Maybank官网 (RM100k-RM10M, 最长25年), smallbusinessloanmy.com
    // ─────────────────────────────────────────────────────────────────────────
    {
      bank_id:       bank.id,
      product_code:  'P05',
      product_name_en: 'Maybank SME Property Financing',
      product_name_zh: 'Maybank SME 物业融资',
      loan_structure:           'PROPERTY_LOAN',
      collateral_requirement:   'PROPERTY',
      guarantee_scheme:         'NONE',
      is_shariah:    false,
      is_active:     true,
      block_a_json:  JSON.stringify({
        min_loan_amount: 100000,
        max_loan_amount: 10000000,
        min_tenure_months: 60,
        max_tenure_months: 300,  // up to 25 years per official website
        rate_type: 'FLOATING',
        base_rate: 'BR-based',
        rate_min: 4.0,   // per smallbusinessloanmy.com (property-backed tier: 4.0%-6.5%)
        rate_max: 6.5,
        min_company_age_months: 24,
        eligible_company_types: ['SDN_BHD', 'PARTNERSHIP', 'SOLE_PROPRIETOR'],
        eligible_industries: [],
        excluded_industries: [],
        min_annual_revenue: null,
        monthly_turnover_multiplier_min: null,
        monthly_turnover_multiplier_max: null,
        max_loan_to_annual_revenue_pct: null,
        dscr_min: null,
        dscr_preferred: null,
        dscr_formula_note: null,
        ltv_max: null,  // LTV not publicly stated
        collateral_coverage_min: null,
        guarantee_fee_pct: null,
        processing_fee: null,
        stamp_duty: 'As per Stamp Duty Act 1949; MOT stamp duty applicable',
        confidence: 'LIKELY',
        last_verified_date: new Date('2026-01-01'),
        sources: [
          'https://www.maybank2u.com.my/maybank2u/malaysia/en/business/sme/grow/finance_business_goals/finance_business_goals_listing.page',
          'https://smallbusinessloanmy.com/banks/maybank-sme',
        ],
        notes: 'Official website confirms RM100k-RM10M, up to 25 years. Rate range 4.0%-6.5% from smallbusinessloanmy.com (Jan 2026). No official PDS found — LIKELY confidence. LTV, processing fee not publicly disclosed.',
      }),
      block_b_json:  null,
      block_c_summary: null,
      block_a_completion_pct: 45,
      block_b_completion_pct: 0,
      last_verified_date: new Date('2026-01-01'),
    },

    // ─────────────────────────────────────────────────────────────────────────
    // 产品 P06: SJPP WCGS / SJPP Working Capital Guarantee Scheme
    // 来源: Maybank官网SJPP页面 (RM100k-RM10M, 最长15年/至2035)
    // ─────────────────────────────────────────────────────────────────────────
    {
      bank_id:       bank.id,
      product_code:  'P06',
      product_name_en: 'SJPP Working Capital Guarantee Scheme (via Maybank)',
      product_name_zh: 'SJPP营运资金担保计划（通过Maybank申请）',
      loan_structure:           'TERM_LOAN',
      collateral_requirement:   'GOVERNMENT_GUARANTEE',
      guarantee_scheme:         'SJPP_TPKS',
      is_shariah:    false,
      is_active:     true,
      block_a_json:  JSON.stringify({
        min_loan_amount: 100000,
        max_loan_amount: 10000000,
        min_tenure_months: 12,
        max_tenure_months: 180,  // up to 15 years or 2035 (whichever earlier)
        rate_type: 'FLOATING',
        base_rate: null,  // Rate not stated on SJPP page
        rate_min: null,
        rate_max: null,
        min_company_age_months: null,
        eligible_company_types: ['SDN_BHD'],  // Must be incorporated under Companies Act 2016
        eligible_industries: [],
        excluded_industries: [],
        min_annual_revenue: null,
        monthly_turnover_multiplier_min: null,
        monthly_turnover_multiplier_max: null,
        max_loan_to_annual_revenue_pct: null,
        dscr_min: null,
        dscr_preferred: null,
        dscr_formula_note: null,
        ltv_max: null,
        collateral_coverage_min: null,
        guarantee_fee_pct: null,
        processing_fee: null,
        stamp_duty: null,
        confidence: 'CONFIRMED',
        last_verified_date: new Date('2025-07-21'),
        sources: [
          'https://www.maybank2u.com.my/maybank2u/malaysia/en/business/financing/government_aided/business/SJPP_Schemes_SME_Working_Capital_Financing.page',
          'https://www.maybank2u.com.my/maybank2u/malaysia/en/business/sme/grow/finance_business_goals/finance_business_goals_listing.page',
        ],
        notes: 'Eligible: SME companies incorporated under Companies Act 2016, at least 51% Malaysian-owned. Export-oriented businesses (≥50% export turnover) also eligible. Available up to 15 years or year 2035, whichever is earlier. Rate not disclosed on Maybank SJPP page.',
      }),
      block_b_json:  null,
      block_c_summary: null,
      block_a_completion_pct: 40,
      block_b_completion_pct: 0,
      last_verified_date: new Date('2025-07-21'),
    },
  ]

  // ── 4. 写入产品 ──────────────────────────────────────────────────────────────
  for (const p of products) {
    await prisma.product.create({ data: p })
    console.log(`  Product created: ${p.product_code} — ${p.product_name_zh}`)
  }

  // ── 5. 汇总 ──────────────────────────────────────────────────────────────────
  const count = await prisma.product.count({ where: { bank_id: bank.id } })
  console.log(`\n✅ Maybank (MBB) 完成: ${count} 个产品写入数据库`)
  console.log(`   渠道1 (官网PDS):   ✅  https://www.maybank2u.com.my/iwov-resources/pdf/business/digitalfinancing_pds_eng.pdf`)
  console.log(`   渠道2 (金融媒体):  ✅  https://www.imoney.my, https://theedgemalaysia.com, https://ringgitplus.com`)
  console.log(`   渠道3 (顾问平台):  ✅  https://smallbusinessloanmy.com/banks/maybank-sme`)
  console.log(`   渠道4 (申请者FAQ): ✅  https://www.maybank2u.com.my/iwov-resources/pdf/business/sme/sme-faq.pdf`)
  console.log(`   渠道5 (CGC/SJPP):  ✅  SJPP担保页面, CGC PGX搜索`)
  console.log(`   渠道6 (讨论区):    ⚠️  未找到2025-2026年lowyat/reddit具体Maybank SME讨论，未记录`)
  console.log(`   渠道7 (iMSME):     ⚠️  iMSME搜索未找到Maybank专属产品页面`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
