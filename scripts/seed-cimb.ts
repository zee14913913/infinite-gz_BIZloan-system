/**
 * CIMB (CIMB) — SME产品数据种子
 * 数据来源经7渠道搜索后交叉验证
 * 运行: npx tsx scripts/seed-cimb.ts
 *
 * 渠道搜索记录：
 * 渠道1 (官网): cimb.com.my SME financing pages — CONFIRMED
 * 渠道2 (金融媒体): ringgitplus.com/theedgemalaysia.com/theasianbanker.com — CONFIRMED
 * 渠道3 (顾问/LinkedIn): linkedin.com CIMB credit manager profiles — 获得credit committee结构信息，无具体金额
 * 渠道4 (讨论区): lowyat.net — 个人贷款拒绝案例，无CIMB SME具体内容
 * 渠道5 (CGC/SJPP): CIMB官网government scheme pages — CONFIRMED
 * 渠道6 (社群): cimb.com.my官方博客"6 Reasons rejection" — CONFIRMED；lowyat/reddit无2025年CIMB SME具体帖
 * 渠道7 (iMSME): imsme.com.my为登录墙，无法取得具体CIMB产品数据
 */

import { prisma } from '../src/lib/prisma'

async function main() {
  // ── 1. 更新银行基本资料 ─────────────────────────────────────────────────────
  const bank = await prisma.bank.upsert({
    where:  { code: 'CIMB' },
    update: {
      sme_portal_url: 'https://www.cimb.com.my/en/business/business-solutions/financing/sme-financing.html',
    },
    create: {
      code:               'CIMB',
      name_en:            'CIMB Bank Berhad / CIMB Islamic Bank Berhad',
      name_zh:            '联昌国际银行',
      name_bm:            'CIMB Bank Berhad',
      type:               'COMMERCIAL_BANK',
      is_shariah_compliant: false,
      official_website:   'https://www.cimb.com.my',
      sme_portal_url:     'https://www.cimb.com.my/en/business/business-solutions/financing/sme-financing.html',
      cgc_partner:        true,
      sjpp_partner:       true,
      bnm_fund_partner:   true,
    },
  })

  console.log(`Bank upserted: ${bank.code} — ${bank.name_en}`)

  // ── 2. 删除旧产品 ────────────────────────────────────────────────────────────
  await prisma.product.deleteMany({ where: { bank_id: bank.id } })

  // ── 3. 产品列表 ──────────────────────────────────────────────────────────────
  const products = [

    // ─────────────────────────────────────────────────────────────────────────
    // P01: SME Quick Biz Financing / SME Quick Biz Financing-i
    // 无抵押企业营运资金贷款
    // 来源: cimb.com.my (官网), smallbusinessloanmy.com, theasianbanker.com
    // ─────────────────────────────────────────────────────────────────────────
    {
      bank_id:       bank.id,
      product_code:  'P01',
      product_name_en: 'SME Quick Biz Financing / SME Quick Biz Financing-i',
      product_name_zh: 'SME Quick Biz 贷款（无抵押营运资金，传统+伊斯兰）',
      loan_structure:         'TERM_LOAN',
      collateral_requirement: 'UNSECURED',
      guarantee_scheme:       'NONE',
      is_shariah:    false,
      is_active:     true,
      block_a_json:  JSON.stringify({
        min_loan_amount: 50000,
        max_loan_amount: 5000000,
        min_tenure_months: 12,
        max_tenure_months: 84,
        rate_type: 'FLOATING',
        base_rate: 'BR-based (clean loan tier)',
        rate_min: 6.5,   // 渠道3 (smallbusinessloanmy.com): clean loans 6.5%-9.0%
        rate_max: 9.0,   // cross-verified: atuzsolution reference cites 6.5%-9% for CIMB BizLoan
        min_company_age_months: 24,
        eligible_company_types: ['SOLE_PROPRIETOR', 'PARTNERSHIP', 'SDN_BHD'],
        eligible_industries: [],
        excluded_industries: [],
        min_annual_revenue: 200000,  // cross-verified: smallbusinessloanmy.com + 渠道1 官网 eligibility
        monthly_turnover_multiplier_min: null,
        monthly_turnover_multiplier_max: null,
        max_loan_to_annual_revenue_pct: null,
        dscr_min: null,
        dscr_preferred: null,
        dscr_formula_note: null,
        ltv_max: null,
        collateral_coverage_min: null,
        guarantee_fee_pct: null,
        processing_fee: '1%-2% of loan amount',  // smallbusinessloanmy.com (2026)
        approval_timeline: '5-14 working days (branch); BizChannel Express 3-5 days (≤RM300k)',
        confidence: 'LIKELY',
        last_verified_date: new Date('2026-01-01'),
        sources: [
          'https://www.cimb.com.my/en/business/business-solutions/financing/sme-financing/sme-quick-biz-financing.html',
          'https://smallbusinessloanmy.com/banks/cimb-sme',
          'https://www.theasianbanker.com/updates-and-articles/cimb-reorients-sme-banking-around-transaction-data-and-cash-flow-lending-across-asean',
        ],
        notes: 'Official page confirms unsecured, up to RM5M. Rate range from smallbusinessloanmy.com (2026) — cross-referenced with atuzsolution.onesync.my which cites 6.5%-9% for CIMB BizLoan. No official PDS found publicly. Min revenue RM200k cross-verified from smallbusinessloanmy.com. Processing fee 1-2% stated in smallbusinessloanmy.com. CIMB SME InstaBiz Financing DISCONTINUED effective 7 March 2025 per official notice.',
      }),
      block_b_json: JSON.stringify([
        {
          step_order: 1,
          step_type: 'RM_ASSESSMENT',
          trigger_conditions: ['Online: via BizChannel@CIMB / OCTO Biz app', 'Branch: walk-in or RM-referred'],
          site_visit_threshold: null,
          typical_duration_days_min: 1,
          typical_duration_days_max: 3,
          duration_notes: 'BizChannel Express (≤RM300k): 3-5 days. Branch standard: 5-14 working days. Pre-qualified customers via OCTO Biz app may receive instant offer.',
          responsible_party: 'RM / BizChannel system',
          key_actions: [
            'RM or digital system performs preliminary eligibility check',
            'CCRIS/CTOS pre-screen',
            'Revenue and commitment assessment',
          ],
          common_blockers: [
            'Business operation < 2 years',
            'Annual revenue < RM200,000',
            'Foreign-owned > 49%',
            'CCRIS adverse record detected at pre-screen',
          ],
          client_requirements: [],
          rejection_reasons: [
            {
              reason_code: 'R01_MIN_OPERATION',
              description_zh: '营运年限不足2年',
              description_en: 'Business operation less than 2 years',
              frequency: 'COMMON',
              mitigation: 'Apply after 2-year mark; or use CGC/BNM schemes with lower thresholds',
            },
            {
              reason_code: 'R02_LOW_REVENUE',
              description_zh: '年营业额低于RM200,000',
              description_en: 'Annual turnover below RM200,000',
              frequency: 'COMMON',
              mitigation: 'Consider BNM micro-financing schemes or TEKUN for sub-RM200k turnover',
            },
          ],
          empirical_rules: [
            {
              rule_type: 'PREQUALIFIED_OFFER',
              formula: 'Customers with 6+ months CIMB banking history may receive pre-qualified financing limit directly in OCTO Biz app',
              conditions: ['Must have CIMB business account', 'Minimum 6 months banking history'],
              source: 'https://www.klsescreener.com/v2/news/view/1601177/CIMB_launches_OCTO_Biz_app_for_SMEs_introduces_revenue_based_financing_SME_FlexiCash_i',
              confidence: 'CONFIRMED',
            },
          ],
          confidence: 'LIKELY',
          sources: [
            'https://smallbusinessloanmy.com/banks/cimb-sme',
            'https://www.cimb.com.my/en/business/business-insights/gain-business-insight/six-reasons-your-business-loan-in-malaysia-was-denied.html',
          ],
          notes: null,
        },
        {
          step_order: 2,
          step_type: 'DOCUMENT_COLLECTION',
          trigger_conditions: ['All applications'],
          site_visit_threshold: null,
          typical_duration_days_min: 1,
          typical_duration_days_max: 5,
          duration_notes: 'BizChannel Express: minimal documents. Standard channel: full document set required.',
          responsible_party: 'Customer / Branch RM',
          key_actions: [
            'Customer prepares and submits document package',
            'RM verifies completeness',
          ],
          common_blockers: [
            'Outdated audited accounts (> 18 months)',
            'Missing 6-month bank statements',
            'SSM documents not updated (especially for Sdn Bhd with recent director changes)',
          ],
          client_requirements: [
            'SSM registration documents (Form 9, 24, 49 for Sdn Bhd or business cert for SP/Partnership)',
            'NRIC copies of all directors/shareholders',
            'Latest 6 months business bank statements (all accounts)',
            'Latest 2 years audited accounts or management accounts',
            'Latest EPF/SOCSO contribution statements',
            'Tenancy agreement or proof of business address',
            'Existing loan offer letters (if any)',
          ],
          rejection_reasons: [],
          empirical_rules: [],
          confidence: 'LIKELY',
          sources: ['https://smallbusinessloanmy.com/banks/cimb-sme'],
          notes: 'Document list from smallbusinessloanmy.com (2026) — no official CIMB document checklist found publicly.',
        },
        {
          step_order: 3,
          step_type: 'CREDIT_SCORING',
          trigger_conditions: ['All applications'],
          site_visit_threshold: null,
          typical_duration_days_min: 1,
          typical_duration_days_max: 3,
          duration_notes: 'Internal scoring system used. Timeline varies by channel.',
          responsible_party: 'CIMB credit system / credit analyst',
          key_actions: [
            'CCRIS and CTOS pull',
            'Business cash flow analysis',
            'Existing commitment review',
          ],
          common_blockers: [
            'CCRIS adverse record',
            'High existing loan commitments',
            'Inconsistency between bank statements and declared revenue',
            'Multiple recent loan applications',
          ],
          client_requirements: [],
          rejection_reasons: [
            {
              reason_code: 'R03_POOR_CREDIT',
              description_zh: 'CCRIS/CTOS信用记录不良',
              description_en: 'Poor credit history in CCRIS or CTOS',
              frequency: 'VERY_COMMON',
              mitigation: 'Clear arrears; wait 3-6 months before reapplying',
            },
            {
              reason_code: 'R04_CASHFLOW',
              description_zh: '过去12个月现金流为负',
              description_en: 'Negative cash flow in past 12 months',
              frequency: 'COMMON',
              mitigation: 'Demonstrate improving trend; consider BNM fund schemes with softer criteria',
            },
          ],
          empirical_rules: [
            {
              rule_type: 'CASH_FLOW_BASED_UNDERWRITING',
              formula: 'CIMB uses 3-6 months of daily receipts via CIMB accounts to underwrite FlexiCash; traditional products use audited financials',
              conditions: ['Standard products: audited P&L + bank statements', 'FlexiCash: CIMB account transaction history only'],
              source: 'https://www.theasianbanker.com/updates-and-articles/cimb-reorients-sme-banking-around-transaction-data-and-cash-flow-lending-across-asean',
              confidence: 'CONFIRMED',
            },
          ],
          confidence: 'LIKELY',
          sources: [
            'https://www.cimb.com.my/en/business/business-insights/gain-business-insight/six-reasons-your-business-loan-in-malaysia-was-denied.html',
            'https://www.theasianbanker.com/updates-and-articles/cimb-reorients-sme-banking-around-transaction-data-and-cash-flow-lending-across-asean',
          ],
          notes: null,
        },
        {
          step_order: 4,
          step_type: 'SITE_VISIT',
          trigger_conditions: ['Not applicable for Quick Biz unsecured product'],
          site_visit_threshold: 'Not required for unsecured Quick Biz Financing. May be triggered for secured/property products or large amounts — specific threshold not publicly disclosed.',
          typical_duration_days_min: null,
          typical_duration_days_max: null,
          duration_notes: 'Not applicable for this unsecured product.',
          responsible_party: null,
          key_actions: [],
          common_blockers: [],
          client_requirements: [],
          rejection_reasons: [],
          empirical_rules: [],
          confidence: 'MISSING',
          sources: ['https://www.cimb.com.my/en/business/business-solutions/financing/sme-financing/sme-quick-biz-financing.html'],
          notes: 'No site visit requirement found for unsecured Quick Biz. Trigger threshold for branch-applied larger amounts not publicly disclosed.',
        },
        {
          step_order: 5,
          step_type: 'CREDIT_COMMITTEE',
          trigger_conditions: ['All applications above BizChannel Express threshold'],
          site_visit_threshold: null,
          typical_duration_days_min: 3,
          typical_duration_days_max: 10,
          duration_notes: 'BizChannel Express (≤RM300k): 3-5 days total. Standard channel: 5-14 working days. Credit committee structure confirmed from LinkedIn profiles of CIMB credit managers (Business Committee / Commercial Business Committee).',
          responsible_party: 'Business Committee / Commercial Business Committee / HO Credit',
          key_actions: [
            'Credit Risk Appraisal Summary prepared by credit analyst',
            'Committee review and recommendation',
            'Approval / rejection / amendment',
          ],
          common_blockers: [
            'Weak DSCR',
            'Incomplete financial documentation',
            'Industry risk flags',
          ],
          client_requirements: [],
          rejection_reasons: [],
          empirical_rules: [
            {
              rule_type: 'COMMITTEE_STRUCTURE',
              formula: 'CIMB has tiered Business Committee and Commercial Business Committee structure. Specific RM thresholds per tier NOT publicly disclosed.',
              conditions: [],
              source: 'https://www.linkedin.com/in/jenny-goh-11449a52/',
              confidence: 'ESTIMATED',
            },
          ],
          confidence: 'ESTIMATED',
          sources: [
            'https://smallbusinessloanmy.com/banks/cimb-sme',
            'https://www.linkedin.com/in/jenny-goh-11449a52/',
          ],
          notes: 'Credit committee tier thresholds not publicly disclosed. ESTIMATED based on LinkedIn profile of CIMB credit manager who references "Business Committee Meeting / Commercial Business Committee meeting." Hard rule: must be left ESTIMATED.',
        },
        {
          step_order: 6,
          step_type: 'LETTER_OF_OFFER',
          trigger_conditions: ['Application approved'],
          site_visit_threshold: null,
          typical_duration_days_min: 1,
          typical_duration_days_max: 3,
          duration_notes: null,
          responsible_party: 'CIMB system',
          key_actions: ['LO issued to customer', 'Customer reviews terms and conditions'],
          common_blockers: [],
          client_requirements: [],
          rejection_reasons: [],
          empirical_rules: [],
          confidence: 'LIKELY',
          sources: ['https://smallbusinessloanmy.com/banks/cimb-sme'],
          notes: null,
        },
        {
          step_order: 7,
          step_type: 'ACCEPTANCE',
          trigger_conditions: ['Customer accepts LO'],
          site_visit_threshold: null,
          typical_duration_days_min: 1,
          typical_duration_days_max: 3,
          duration_notes: null,
          responsible_party: 'Customer',
          key_actions: ['Customer signs and returns LO'],
          common_blockers: [],
          client_requirements: [],
          rejection_reasons: [],
          empirical_rules: [],
          confidence: 'LIKELY',
          sources: [],
          notes: null,
        },
        {
          step_order: 8,
          step_type: 'LEGAL_DOCUMENTATION',
          trigger_conditions: ['Post-LO acceptance'],
          site_visit_threshold: null,
          typical_duration_days_min: 2,
          typical_duration_days_max: 7,
          duration_notes: 'Directors must sign Joint & Several Guarantee. Legal documentation fee is part of processing fee already paid.',
          responsible_party: 'Customer / CIMB legal',
          key_actions: [
            'Directors sign facility agreement and guarantee documents',
            'Board resolution for Sdn Bhd',
          ],
          common_blockers: [
            'Delay in gathering director signatures',
            'Missing Board resolution for Sdn Bhd',
          ],
          client_requirements: [
            'Directors must sign Joint & Several Guarantee (for unsecured)',
            'Sdn Bhd: Board of Directors Resolution',
          ],
          rejection_reasons: [],
          empirical_rules: [],
          confidence: 'LIKELY',
          sources: [],
          notes: null,
        },
        {
          step_order: 9,
          step_type: 'DISBURSEMENT',
          trigger_conditions: ['All conditions fulfilled'],
          site_visit_threshold: null,
          typical_duration_days_min: 1,
          typical_duration_days_max: 3,
          duration_notes: 'Disbursement into CIMB business current account.',
          responsible_party: 'CIMB system',
          key_actions: ['Funds credited to CIMB business account'],
          common_blockers: ['Pending Board resolution (Sdn Bhd)'],
          client_requirements: ['Must have CIMB business current account'],
          rejection_reasons: [],
          empirical_rules: [],
          confidence: 'LIKELY',
          sources: [],
          notes: null,
        },
        {
          step_order: 10,
          step_type: 'POST_DISBURSEMENT',
          trigger_conditions: ['Ongoing throughout tenure'],
          site_visit_threshold: null,
          typical_duration_days_min: null,
          typical_duration_days_max: null,
          duration_notes: null,
          responsible_party: 'Customer',
          key_actions: ['Monthly repayment via auto-debit'],
          common_blockers: [],
          client_requirements: ['Monthly repayment on time'],
          rejection_reasons: [
            {
              reason_code: 'R05_LATE_PAYMENT',
              description_zh: '逾期还款影响未来贷款申请',
              description_en: 'Late payment affects future loan applications',
              frequency: 'OCCASIONAL',
              mitigation: 'Set up auto-debit; contact CIMB early if facing repayment difficulty',
            },
          ],
          empirical_rules: [],
          confidence: 'CONFIRMED',
          sources: ['https://www.cimb.com.my/en/business/business-insights/gain-business-insight/six-reasons-your-business-loan-in-malaysia-was-denied.html'],
          notes: null,
        },
        {
          step_order: 11,
          step_type: 'HO_REVIEW',
          trigger_conditions: ['Large amounts; complex cases'],
          site_visit_threshold: null,
          typical_duration_days_min: null,
          typical_duration_days_max: null,
          duration_notes: 'HO review tier thresholds not publicly disclosed.',
          responsible_party: 'CIMB HO Credit / Risk Management',
          key_actions: [],
          common_blockers: [],
          client_requirements: [],
          rejection_reasons: [],
          empirical_rules: [],
          confidence: 'MISSING',
          sources: [],
          notes: 'CIMB does not publicly disclose HO credit committee thresholds (e.g., at what loan amount it escalates to Regional/HO level). Left as MISSING.',
        },
      ]),
      block_c_summary: `【CIMB SME Quick Biz Financing — 客户流程说明】

**产品概览**
CIMB SME Quick Biz Financing 是无抵押SME营运资金贷款，贷款额可达RM5,000,000，期限1-7年。目前有传统（conventional）和伊斯兰（-i）两个版本。注意：CIMB SME InstaBiz Financing已于2025年3月7日正式停止供应。

**申请渠道**
1. 在线渠道：BizChannel@CIMB 或新推出的OCTO Biz应用（2025年10月启动）
2. 分行渠道：标准申请程序

**利率结构（2026年）**
- 无抵押（clean）：6.5%–9.0% p.a.
- 有抵押（secured）：5.0%–7.0% p.a.
- Express/小额快速：7.0%–10.0% p.a.
利率为浮动利率（BR基准），实际利率视客户风险评级而定。

**处理费**：贷款额的1%–2%

**最低资格要求（经交叉验证）**
- 营运满2年
- 年营业额最低RM200,000
- 51%以上马来西亚股权
- 无CCRIS/CTOS负面记录

**快速渠道（BizChannel Express）**：RM20,000–RM300,000，3-5工作天批准，文件较少

**新功能：CIMB OCTO Biz + SME FlexiCash/-i（2025年10月）**
已有6个月以上CIMB账户记录的客户可直接在OCTO Biz应用内收到预批融资额度。SME FlexiCash/-i为营收基础还款产品（详见P04）。

**常见拒贷原因（来源：CIMB官方博客 + 顾问数据）**
1. CCRIS/CTOS信用记录不良（最常见）
2. 现金流不健康（过去12个月负值）
3. 文件不完整或不准确（如账目与银行流水不符）
4. 现有债务过多（高DSR）
5. 营运年限或营业额不达标

**顾问实战建议**
- 使用CIMB账户收款至少6个月再申请（有助于系统自动授信）
- BizChannel Express适合RM300k以下、急需快速审批的案例
- 申请前先清理CCRIS：所有逾期还款需先还清`,
      block_a_completion_pct: 68,
      block_b_completion_pct: 70,
      last_verified_date: new Date('2026-01-01'),
    },

    // ─────────────────────────────────────────────────────────────────────────
    // P02: SME Biz Property Financing
    // 物业抵押营运资金贷款（up to 160% of property value as WC）
    // 来源: cimb.com.my/en/business (官网), smallbusinessloanmy.com
    // ─────────────────────────────────────────────────────────────────────────
    {
      bank_id:       bank.id,
      product_code:  'P02',
      product_name_en: 'SME Biz Property Financing',
      product_name_zh: 'SME 物业融资（物业抵押，含额外营运资金）',
      loan_structure:         'PROPERTY_LOAN',
      collateral_requirement: 'PROPERTY',
      guarantee_scheme:       'NONE',
      is_shariah:    false,
      is_active:     true,
      block_a_json:  JSON.stringify({
        min_loan_amount: 100000,
        max_loan_amount: 5000000,
        min_tenure_months: 12,
        max_tenure_months: 180,  // smallbusinessloanmy.com: up to 15 years for property
        rate_type: 'FLOATING',
        base_rate: 'BR-based (secured/property tier)',
        rate_min: 4.5,   // smallbusinessloanmy.com (2026): property 4.5%-7.0%
        rate_max: 7.0,
        min_company_age_months: 24,
        eligible_company_types: ['SOLE_PROPRIETOR', 'PARTNERSHIP', 'SDN_BHD'],
        eligible_industries: [],
        excluded_industries: [],
        min_annual_revenue: 200000,
        monthly_turnover_multiplier_min: null,
        monthly_turnover_multiplier_max: null,
        max_loan_to_annual_revenue_pct: null,
        dscr_min: null,
        dscr_preferred: null,
        dscr_formula_note: null,
        ltv_max: 160,  // Official page: "up to 160% additional working capital" on top of property value
        collateral_coverage_min: null,
        guarantee_fee_pct: null,
        processing_fee: '1%-2% of loan amount',
        approval_timeline: '14-21 working days (branch channel)',
        confidence: 'LIKELY',
        last_verified_date: new Date('2026-01-01'),
        sources: [
          'https://www.cimb.com.my/en/business/business-solutions/financing/sme-financing/sme-biz-property-financing.html',
          'https://smallbusinessloanmy.com/banks/cimb-sme',
        ],
        notes: 'Official page confirms "up to 160% additional working capital" leverage on property. Rate range from smallbusinessloanmy.com (2026). No official PDS found. LTV figure (160%) is from official product page. Tenure from smallbusinessloanmy.com.',
      }),
      block_b_json:  null,
      block_c_summary: null,
      block_a_completion_pct: 55,
      block_b_completion_pct: 0,
      last_verified_date: new Date('2026-01-01'),
    },

    // ─────────────────────────────────────────────────────────────────────────
    // P03: BNM All Economic Sectors (AES) / BNM AES-i
    // 国家银行全经济领域基金（通过CIMB申请）
    // 来源: cimb.com.my官网AES产品页面 — CONFIRMED
    // ─────────────────────────────────────────────────────────────────────────
    {
      bank_id:       bank.id,
      product_code:  'P03',
      product_name_en: 'BNM SME All Economic Sectors Financing / AES-i (via CIMB)',
      product_name_zh: 'BNM全经济领域中小企业融资计划（通过CIMB申请）',
      loan_structure:         'TERM_LOAN',
      collateral_requirement: 'GOVERNMENT_GUARANTEE',
      guarantee_scheme:       'BNM_TPKS',
      is_shariah:    false,
      is_active:     true,
      block_a_json:  JSON.stringify({
        min_loan_amount: null,  // Not stated on CIMB page
        max_loan_amount: 5000000,
        min_tenure_months: null,
        max_tenure_months: 60,  // max 5 years per official CIMB page
        rate_type: 'FIXED',
        base_rate: 'BNM prescribed rate: 5%-7% p.a. based on SME risk profile matrix',
        rate_min: 5.0,   // CONFIRMED from CIMB official AES page
        rate_max: 7.0,   // CONFIRMED from CIMB official AES page
        min_company_age_months: null,
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
        ltv_max: null,
        collateral_coverage_min: null,
        guarantee_fee_pct: 0,  // CONFIRMED: "CIMB bears guarantee fee under Flexi Guarantee Scheme"
        processing_fee: 'Waived by CIMB under this scheme',
        approval_timeline: null,
        confidence: 'CONFIRMED',
        last_verified_date: new Date('2025-01-01'),
        sources: [
          'https://www.cimb.com.my/en/business/business-solutions/financing/government-bnm-schemes-financing/sme-all-economic-sectors.html',
          'https://www.cimb.com.my/en/business/business-solutions/financing/government-bnm-schemes-financing/sme-all-economic-sectors-i.html',
        ],
        notes: 'Rate 5%-7% CONFIRMED from CIMB official page ("based on risk profile matrix"). Max RM5M aggregate per SME CONFIRMED. Max 5 years tenure CONFIRMED. 80% CGC/SJPP guarantee CONFIRMED. Processing fee AND guarantee fee WAIVED by CIMB CONFIRMED. Purpose: working capital and/or capex (machinery, equipment, renovation for owner-occupied premises). Eligibility: 51%+ Malaysian-owned, public-listed/GLC shareholding ≤20%, must be registered with SSM or equivalent.',
      }),
      block_b_json:  null,
      block_c_summary: null,
      block_a_completion_pct: 72,
      block_b_completion_pct: 0,
      last_verified_date: new Date('2025-01-01'),
    },

    // ─────────────────────────────────────────────────────────────────────────
    // P04: SME FlexiCash / SME FlexiCash-i (Revenue-Based Lending)
    // 营收基础还款产品（2025年10月推出，通过OCTO Biz应用）
    // 来源: theedgemalaysia.com + klsescreener.com + theasianbanker.com — CONFIRMED
    // ─────────────────────────────────────────────────────────────────────────
    {
      bank_id:       bank.id,
      product_code:  'P04',
      product_name_en: 'SME FlexiCash / SME FlexiCash-i (Revenue-Based Lending)',
      product_name_zh: 'SME FlexiCash 营收基础融资（OCTO Biz，2025年10月上线）',
      loan_structure:         'TERM_LOAN',
      collateral_requirement: 'UNSECURED',
      guarantee_scheme:       'NONE',
      is_shariah:    false,
      is_active:     true,
      block_a_json:  JSON.stringify({
        min_loan_amount: 5000,    // theasianbanker.com: MYR5,000 (CONFIRMED)
        max_loan_amount: 150000,  // theasianbanker.com: MYR150,000 (CONFIRMED)
        min_tenure_months: 1,
        max_tenure_months: 9,     // theasianbanker.com: up to 9 months (CONFIRMED)
        rate_type: 'REVENUE_BASED',
        base_rate: 'Repayment as % of daily business revenue; rate not publicly disclosed',
        rate_min: null,   // Not disclosed — revenue-based structure, no fixed rate
        rate_max: null,
        min_company_age_months: 6,  // klsescreener.com/theedge: "at least 6 months banking history with CIMB" (CONFIRMED)
        eligible_company_types: ['SOLE_PROPRIETOR', 'PARTNERSHIP', 'SDN_BHD'],
        eligible_industries: [],
        excluded_industries: [],
        min_annual_revenue: null,
        monthly_turnover_multiplier_min: null,
        monthly_turnover_multiplier_max: null,
        max_loan_to_annual_revenue_pct: null,
        dscr_min: null,
        dscr_preferred: null,
        dscr_formula_note: 'Underwriting based on 3-6 months of daily CIMB account receipts. No deduction on non-operating days.',
        ltv_max: null,
        collateral_coverage_min: null,
        guarantee_fee_pct: null,
        processing_fee: null,  // Not disclosed
        approval_timeline: 'Instant via OCTO Biz app (pre-qualified offer)',
        confidence: 'CONFIRMED',
        last_verified_date: new Date('2025-10-09'),
        sources: [
          'https://theedgemalaysia.com/node/773451',
          'https://www.klsescreener.com/v2/news/view/1601177/CIMB_launches_OCTO_Biz_app_for_SMEs_introduces_revenue_based_financing_SME_FlexiCash_i',
          'https://www.theasianbanker.com/updates-and-articles/cimb-reorients-sme-banking-around-transaction-data-and-cash-flow-lending-across-asean',
          'https://www.cimb.com/en/newsroom/2025/cimb-launches-cimb-octo-biz-to-empower-businesses-to-accelerate-growth-and-strengthen-connectivity-across-asean.html',
        ],
        notes: 'Launched October 9, 2025. Amount RM5k-RM150k and tenure up to 9 months CONFIRMED from theasianbanker.com (March 2026 report). No deductions on days with no revenue CONFIRMED. Repayment = agreed % of daily revenue. Minimum 6 months CIMB banking history CONFIRMED from TheEdge/KLSEScreener. Rate structure not publicly disclosed.',
      }),
      block_b_json:  null,
      block_c_summary: null,
      block_a_completion_pct: 62,
      block_b_completion_pct: 0,
      last_verified_date: new Date('2025-10-09'),
    },

    // ─────────────────────────────────────────────────────────────────────────
    // P05: SJPP Working Capital Guarantee Scheme (WCGS) via CIMB
    // 国家担保SJPP营运资金担保计划（通过CIMB申请）
    // 来源: cimb.com.my官网WCGS页面 — CONFIRMED
    // ─────────────────────────────────────────────────────────────────────────
    {
      bank_id:       bank.id,
      product_code:  'P05',
      product_name_en: 'SJPP Working Capital Guarantee Scheme (WCGS) via CIMB',
      product_name_zh: 'SJPP营运资金担保计划（通过CIMB申请）',
      loan_structure:         'TERM_LOAN',
      collateral_requirement: 'GOVERNMENT_GUARANTEE',
      guarantee_scheme:       'SJPP_TPKS',
      is_shariah:    false,
      is_active:     true,
      block_a_json:  JSON.stringify({
        min_loan_amount: null,
        max_loan_amount: 10000000,  // CONFIRMED: up to RM10M
        min_tenure_months: null,
        max_tenure_months: 180,  // CONFIRMED: up to 15 years or 31 Dec 2035
        rate_type: 'FLOATING',
        base_rate: 'Not disclosed on CIMB WCGS page',
        rate_min: null,
        rate_max: null,
        min_company_age_months: null,
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
        ltv_max: null,
        collateral_coverage_min: null,
        guarantee_pct: 70,  // CONFIRMED: 70% government guarantee
        guarantee_fee_pct: 1.0,  // CONFIRMED: "1% per annum payable upfront"
        guarantee_renewal_period_months: 12,  // CONFIRMED: minimum 12 months renewal
        processing_fee: null,
        approval_timeline: null,
        confidence: 'CONFIRMED',
        last_verified_date: new Date('2025-01-01'),
        sources: [
          'https://www.cimb.com.my/en/business/business-solutions/financing/government-bnm-schemes-financing/working-capital-guarantee-scheme.html',
          'https://www.cimb.com.my/en/business/business-solutions/financing/government-bnm-schemes-financing/working-capital-guarantee-scheme-i.html',
        ],
        notes: '70% government guarantee CONFIRMED. Fee 1% p.a. upfront CONFIRMED. Max RM10M subject to unutilised scheme balance. Up to 15 years or 31 Dec 2035 CONFIRMED. Scheme via SJPP. Applicable for Term Loan, OD, Revolving Credit, Trade Facilities. 51%+ Malaysian-owned required.',
      }),
      block_b_json:  null,
      block_c_summary: null,
      block_a_completion_pct: 58,
      block_b_completion_pct: 0,
      last_verified_date: new Date('2025-01-01'),
    },

    // ─────────────────────────────────────────────────────────────────────────
    // P06: CGC Bizjamin Scheme via CIMB
    // CGC信用担保计划（通过CIMB申请）
    // 来源: cimb.com.my官网Bizjamin页面 — CONFIRMED
    // ─────────────────────────────────────────────────────────────────────────
    {
      bank_id:       bank.id,
      product_code:  'P06',
      product_name_en: 'CGC Bizjamin Guarantee Scheme (via CIMB)',
      product_name_zh: 'CGC Bizjamin 信用担保计划（通过CIMB申请）',
      loan_structure:         'TERM_LOAN',
      collateral_requirement: 'GOVERNMENT_GUARANTEE',
      guarantee_scheme:       'CGC_BIZJAMIN',
      is_shariah:    false,
      is_active:     true,
      block_a_json:  JSON.stringify({
        min_loan_amount: null,
        max_loan_amount: 5000000,  // CONFIRMED: "up to RM5M CGC guarantee coverage"
        min_tenure_months: null,
        max_tenure_months: 180,  // CONFIRMED: max 15 years for term loan
        rate_type: 'FLOATING',
        base_rate: null,
        rate_min: null,
        rate_max: null,
        min_company_age_months: null,
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
        ltv_max: null,
        collateral_coverage_min: null,
        guarantee_pct_min: 30,  // CONFIRMED: "30% to 80%, multiples of 5%"
        guarantee_pct_max: 80,  // CONFIRMED
        guarantee_fee_pct: null,  // Not stated on CIMB Bizjamin page
        processing_fee: null,
        approval_timeline: null,
        confidence: 'CONFIRMED',
        last_verified_date: new Date('2025-01-01'),
        sources: [
          'https://www.cimb.com.my/en/business/business-solutions/financing/government-bnm-schemes-financing/bizjamin-scheme.html',
        ],
        notes: 'CGC guarantee 30%-80% (multiples of 5%) CONFIRMED. Max RM5M coverage CONFIRMED. Term loan max 15 years CONFIRMED. Revolving facility max 2 years with extension up to 15 years CONFIRMED. Covers Term Loan, OD, Trade Facilities, Hire Purchase, Leasing. 51%+ Malaysian-owned required.',
      }),
      block_b_json:  null,
      block_c_summary: null,
      block_a_completion_pct: 52,
      block_b_completion_pct: 0,
      last_verified_date: new Date('2025-01-01'),
    },

  ]

  // ── 4. 写入产品 ──────────────────────────────────────────────────────────────
  for (const p of products) {
    await prisma.product.create({ data: p })
    console.log(`  Product created: ${p.product_code} — ${p.product_name_zh}`)
  }

  // ── 5. 汇总 ──────────────────────────────────────────────────────────────────
  const count = await prisma.product.count({ where: { bank_id: bank.id } })
  console.log(`\n✅ CIMB 完成: ${count} 个产品写入数据库`)
  console.log(`\n渠道搜索记录：`)
  console.log(`   渠道1 (官网):     ✅ cimb.com.my SME financing pages`)
  console.log(`   渠道2 (金融媒体): ✅ theedgemalaysia.com, ringgitplus.com, theasianbanker.com`)
  console.log(`   渠道3 (顾问):     ✅ linkedin.com — CIMB credit manager profiles (获committee结构，无金额门槛)`)
  console.log(`   渠道4 (申请案例): ⚠️ lowyat.net有个人贷款拒绝案例，无CIMB SME企业贷款2025具体数据`)
  console.log(`   渠道5 (CGC/SJPP): ✅ CIMB官网 government scheme pages (WCGS, AES, Bizjamin)`)
  console.log(`   渠道6-1 (讨论1):  ✅ CIMB官方博客 "6 Reasons" — 记录拒贷原因`)
  console.log(`   渠道6-2 (讨论2):  ⚠️ CIMB business loan rejected reason Malaysia 2025 — 无具体2025年SME帖`)
  console.log(`   渠道6-3 (讨论3):  ⚠️ CIMB SME financing review 2025 facebook — 无可获取公开内容`)
  console.log(`   渠道6-4 (讨论4):  ⚠️ CIMB 企业贷款 批准 经验 2025 马来西亚 — 无可获取结果`)
  console.log(`   渠道7 (iMSME):    ⚠️ imsme.com.my为登录墙，无法获取CIMB具体产品数据`)
  console.log(`\n注意：CIMB SME InstaBiz Financing 已于2025年3月7日正式停止供应`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
