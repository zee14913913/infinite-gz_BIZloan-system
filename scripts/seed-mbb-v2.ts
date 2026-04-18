/**
 * Maybank (MBB) — SME产品数据库重建（新格式）
 * 执行日期：2026-04-18
 * 覆盖旧格式 seed，使用 product_rules / product_signals / screening_view 新结构
 *
 * 渠道执行记录：
 * 渠道1 ✅ maybank2u.com.my，PDS PDF (21 Jul 2025)，FAQ PDF，GGSM2.0官网，SJPP官网
 * 渠道2 ✅ SmallBusinessLoanMY，iMoney (Jan 2026)，RinggitPlus，FintechNews
 * 渠道3 ✅ Hazlinda Abdul Hamid (Head SME Banking) LinkedIn，Funding Societies合作页
 * 渠道4 ✅ 官方FAQ PDF（内含申请者常见问题），行业通用数据（seed-channel4-industry.ts）
 * 渠道5 ✅ Maybank SJPP官网（RM100K-10M），GGSM2.0官网（WC+CAPEX），CGC SPGE官网
 * 渠道6 ✅ 4条关键词全部执行；无2025年完整Maybank Digital申请者帖（标注）
 * 渠道7 ✅ FintechNews RM18B SME计划，Maybank BLR官方公告（Jul 11 2025）
 *
 * 运行: npx tsx scripts/seed-mbb-v2.ts
 */

import { prisma } from '../src/lib/prisma'

async function main() {
  const bank = await prisma.bank.upsert({
    where:  { code: 'MBB' },
    update: {
      sme_portal_url:   'https://www.maybank2u.com.my/maybank2u/malaysia/en/business/financing/sme_digital_financing.page',
      cgc_partner:      true,
      sjpp_partner:     true,
      bnm_fund_partner: true,
    },
    create: {
      code:                 'MBB',
      name_en:              'Malayan Banking Berhad (Maybank)',
      name_zh:              '马来亚银行',
      name_bm:              'Malayan Banking Berhad',
      type:                 'COMMERCIAL_BANK',
      is_shariah_compliant: false,
      official_website:     'https://www.maybank2u.com.my',
      sme_portal_url:       'https://www.maybank2u.com.my/maybank2u/malaysia/en/business/financing/sme_digital_financing.page',
      cgc_partner:          true,
      sjpp_partner:         true,
      bnm_fund_partner:     true,
      personal_dsr_low_threshold:  40,
      personal_dsr_high_threshold: 70,
      personal_income_cutoff:      3500,
      personal_min_ctos:           620,
      personal_approval_rate_pct:  52,
    },
  })
  console.log(`✅ Bank upserted: ${bank.code} — ${bank.name_en}`)

  // ─── 产品列表（新格式）────────────────────────────────────────────────────
  const products = [

    // ═══════════════════════════════════════════════════════════════════════
    // P01: Maybank SME Digital Financing (Instant Online Loan)
    // ═══════════════════════════════════════════════════════════════════════
    {
      product_code:           'P01',
      product_name_en:        'Maybank SME Digital Financing (Instant Online Loan)',
      product_name_zh:        'Maybank SME 数字融资（即时网上贷款）',
      loan_structure:         'TERM_LOAN',
      collateral_requirement: 'UNSECURED',
      guarantee_scheme:       'NONE',
      is_shariah:             false,
      is_active:              true,
      // Legacy fields for BCIS matching engine
      block_a_json: JSON.stringify({
        min_loan_amount: 3000,
        max_loan_amount: 20000000,
        min_tenure_months: 12,
        max_tenure_months: 300,
        rate_type: 'FLOATING',
        base_rate: 'BLR-based (undisclosed spread)',
        rate_min: null,
        rate_max: null,
        maybank_blr: 6.40,   // CONFIRMED: official Jul 11 2025
        maybank_br: 2.75,    // CONFIRMED: official Jul 9 2025
        collateral_required_below_500k: false,
        min_company_age_months: 12,
        eligible_company_types: ['SOLE_PROPRIETOR', 'PARTNERSHIP', 'SDN_BHD'],
        eligible_industries: [],
        excluded_industries: [],
        min_annual_revenue: null,
        instant_tier_max_rm: 500000,
        approval_time_existing: '10 minutes',
        approval_time_new: '2 working days',
        disbursement_time_existing_solo_partner: '1 minute (≤RM500K)',
        confidence: 'CONFIRMED',
        last_verified_date: new Date('2025-07-21'),
        sources: [
          'https://www.maybank2u.com.my/maybank2u/malaysia/en/business/financing/sme_digital_financing.page',
          'https://www.maybank2u.com.my/iwov-resources/pdf/business/digitalfinancing_pds_eng.pdf',
          'https://www.maybank2u.com.my/iwov-resources/pdf/business/sme/sme-faq.pdf',
        ],
      }),
      block_b_json: null,
      block_c_summary: `Maybank SME Digital Financing — 马来西亚最快SME贷款（10分钟批准）

**核心参数（官方确认）**
- 最低：RM3,000 | 最高：RM20,000,000
- 年限：最长25年（视设施类型）
- RM500K以下：无需文件、无需担保
- 现有Maybank客户：10分钟批准，1分钟放款

**利率**
- BLR = 6.40% p.a.（2025年7月11日起，CONFIRMED）
- BR = 2.75% p.a.（CONFIRMED）
- 实际spread未公开，需询问RM

**申请要求**
- 最低营运年限：1年（FAQ确认）
- 董事个人CCRIS/信用卡良好
- 信用卡：最多3张，利用率≤70%（FAQ官方建议）
- 选择性提交6个月流水（官方：会提升批准率）

**战略提示（给顾问）**
1. 先协助客户开设Maybank业务账户 → 解锁instant track
2. CGC Portfolio Guarantee Extra可作为边缘案件增信工具
3. 伊斯兰版本有ceiling rate保护 + 无复利 — 浮动利率环境更佳`,
      block_a_completion_pct: 78,
      block_b_completion_pct: 0,
      last_verified_date: new Date('2025-07-21'),
      product_rules_json: JSON.stringify([
        { rule_category: 'eligibility', rule_key: 'min_years_in_operation', rule_value: 1, rule_operator: '>=', source_type: 'official', confidence_level: 'A', status: 'active', source_url: 'https://www.maybank2u.com.my/iwov-resources/pdf/business/sme/sme-faq.pdf', evidence_date: '2025-07-01' },
        { rule_category: 'financial', rule_key: 'amount_min_rm', rule_value: 3000, rule_operator: '>=', source_type: 'official', confidence_level: 'A', status: 'active', source_url: 'https://www.maybank2u.com.my/maybank2u/malaysia/en/business/financing/sme_digital_financing.page', evidence_date: '2025-07-21' },
        { rule_category: 'financial', rule_key: 'amount_max_rm', rule_value: 20000000, rule_operator: '<=', source_type: 'official', confidence_level: 'A', status: 'active', source_url: 'https://www.maybank2u.com.my/maybank2u/malaysia/en/business/financing/sme_digital_financing.page', evidence_date: '2025-07-21' },
        { rule_category: 'financial', rule_key: 'instant_tier_max_rm_no_docs_no_collateral', rule_value: 500000, rule_operator: '<=', source_type: 'official', confidence_level: 'A', status: 'active', source_url: 'https://www.maybank2u.com.my/maybank2u/malaysia/en/business/financing/sme_digital_financing.page', evidence_date: '2025-07-21' },
        { rule_category: 'financial', rule_key: 'tenure_max_months', rule_value: 300, rule_operator: '<=', source_type: 'official', confidence_level: 'A', status: 'active', source_url: 'https://www.maybank2u.com.my/maybank2u/malaysia/en/business/financing/sme_digital_financing.page', evidence_date: '2025-07-21' },
        { rule_category: 'structure', rule_key: 'collateral_required_below_500k', rule_value: false, rule_operator: 'EQUALS', source_type: 'official', confidence_level: 'A', status: 'active', source_url: 'https://www.maybank2u.com.my/maybank2u/malaysia/en/business/financing/sme_digital_financing.page', evidence_date: '2025-07-21' },
        { rule_category: 'cashflow', rule_key: 'bank_statement_6m_optional_improves_approval', rule_value: true, rule_operator: 'EQUALS', source_type: 'official', confidence_level: 'A', status: 'active', source_url: 'https://www.maybank.com/islamic/en/business/financing/sme_digital_financing.page', evidence_date: '2025-01-01' },
        { rule_category: 'guarantor', rule_key: 'director_personal_ccris_reviewed', rule_value: true, rule_operator: 'EQUALS', source_type: 'official', confidence_level: 'A', status: 'active', source_url: 'https://www.maybank2u.com.my/iwov-resources/pdf/business/sme/sme-faq.pdf', evidence_date: '2025-07-01' },
        { rule_category: 'guarantor', rule_key: 'credit_card_max_count_guideline', rule_value: 3, rule_operator: '<=', source_type: 'official', confidence_level: 'A', status: 'active', source_url: 'https://www.maybank2u.com.my/iwov-resources/pdf/business/sme/sme-faq.pdf', evidence_date: '2025-07-01' },
        { rule_category: 'guarantor', rule_key: 'credit_card_utilisation_max_pct', rule_value: 70, rule_operator: '<=', source_type: 'official', confidence_level: 'A', status: 'active', source_url: 'https://www.maybank2u.com.my/iwov-resources/pdf/business/sme/sme-faq.pdf', evidence_date: '2025-07-01' },
        { rule_category: 'pricing', rule_key: 'maybank_blr_pct', rule_value: 6.40, rule_operator: 'EQUALS', source_type: 'official', confidence_level: 'A', status: 'active', source_url: 'https://www.maybank.com/en/news/2025/07/09/maybank-reduce-base-rate-blr.page', evidence_date: '2025-07-11' },
        { rule_category: 'pricing', rule_key: 'maybank_br_pct', rule_value: 2.75, rule_operator: 'EQUALS', source_type: 'official', confidence_level: 'A', status: 'active', source_url: 'https://www.maybank.com/en/news/2025/07/09/maybank-reduce-base-rate-blr.page', evidence_date: '2025-07-11' },
        { rule_category: 'pricing', rule_key: 'actual_spread_published', rule_value: null, rule_operator: 'EQUALS', source_type: 'official', confidence_level: 'A', status: 'active', notes: 'Actual SME Digital Financing spread NOT publicly disclosed. Enquire from RM.' },
        { rule_category: 'process', rule_key: 'approval_time_existing_customer_minutes', rule_value: 10, rule_operator: 'EQUALS', source_type: 'official', confidence_level: 'A', status: 'active', source_url: 'https://www.maybank2u.com.my/maybank2u/malaysia/en/business/financing/sme_digital_financing.page', evidence_date: '2025-07-21' },
        { rule_category: 'process', rule_key: 'approval_time_new_customer_days', rule_value: 2, rule_operator: 'EQUALS', source_type: 'official', confidence_level: 'A', status: 'active', source_url: 'https://www.maybank2u.com.my/maybank2u/malaysia/en/business/financing/sme_digital_financing.page', evidence_date: '2025-07-21' },
      ]),
      product_signals_json: JSON.stringify([
        { signal_type: 'process_hint', signal_text: 'Existing Maybank customers: 10-min approval, 1-min disbursement (≤RM500K Sole Prop/Partnership). Open Maybank account first to unlock fastest track.', source_type: 'official', confidence_level: 'A', cross_verified_count: 2, source_url: 'https://www.maybank2u.com.my/maybank2u/malaysia/en/business/financing/sme_digital_financing.page', evidence_date: '2025-07-21' },
        { signal_type: 'mitigation', signal_text: "Optional 6-month bank statement 'would increase chances of approval' — official Islamic page confirmation. Submit proactively even for instant tier.", source_type: 'official', confidence_level: 'A', cross_verified_count: 2, source_url: 'https://www.maybank.com/islamic/en/business/financing/sme_digital_financing.page', evidence_date: '2025-01-01' },
        { signal_type: 'reject_reason', signal_text: 'Director credit card utilisation > 70% or > 3 cards flagged as risk signal per official FAQ.', source_type: 'official', confidence_level: 'A', cross_verified_count: 1, source_url: 'https://www.maybank2u.com.my/iwov-resources/pdf/business/sme/sme-faq.pdf', evidence_date: '2025-07-01' },
        { signal_type: 'reject_reason', signal_text: 'Company loan under restructuring/rescheduling at another bank negatively impacts application (FAQ).', source_type: 'official', confidence_level: 'A', cross_verified_count: 2, source_url: 'https://www.maybank2u.com.my/iwov-resources/pdf/business/sme/sme-faq.pdf', evidence_date: '2025-07-01' },
        { signal_type: 'structure_hint', signal_text: 'Machine-learning STP model — Maybank account transaction history likely primary underwriting input. Clean account with regular deposits critical for existing customers.', source_type: 'semi_official', confidence_level: 'B', cross_verified_count: 2, source_url: 'https://ringgitplus.com/en/blog/bank-news/maybank-introduces-sme-digital-financing-solution-with-10-minute-approval.html', evidence_date: '2021-08-09' },
        { signal_type: 'mitigation', signal_text: 'CGC Portfolio Guarantee Extra (SPGE/SPGE-i) available as add-on — can expand approved limit or improve borderline case outcome.', source_type: 'official', confidence_level: 'A', cross_verified_count: 1, source_url: 'https://www.maybank.com/islamic/en/business/financing/sme-clean-financing-i.page', evidence_date: '2025-01-01' },
      ]),
      screening_view_json: JSON.stringify({
        product_name: 'Maybank SME Digital Financing',
        facility_type: 'digital_clean',
        target_segment_summary: 'SME & Micro (Sole Prop/Partnership/Sdn Bhd), min 1yr, all industries. Flagship digital product optimised for speed and no-collateral access.',
        key_hard_eligibility: ['Min 1 year in operation (official)', 'Sole Prop / Partnership / Sdn Bhd only', 'Malaysia-registered business'],
        key_soft_preferences: ['Existing Maybank customer for 10-min/1-min track', 'Director CCRIS/CTOS clean', 'Director credit card ≤3 cards ≤70% utilisation', '6-month bank statement submitted voluntarily'],
        high_risk_triggers: ['Company or director loan under R&R at other bank', 'Director adverse CCRIS', '< 1 year operation', 'Annual sales > RM25M (likely needs Personalised BF tier)'],
        recommended_mitigants: ['Open Maybank business account before applying', 'Submit 6-month statement proactively', 'CGC SPGE for borderline cases', 'Clear director credit card balances <70%'],
        good_fit_profile: 'Existing Maybank customer, 1-5yr ops, monthly sales RM20K-300K, director clean CCRIS, needs <RM500K urgently no collateral',
        bad_fit_profile: 'New to Maybank, director CCRIS adverse, company R&R, <1yr ops, needs >RM2M better via Personalised BF',
        notes_for_credit_memo: [
          'Rate spread undisclosed — confirm from RM. BLR=6.40%, BR=2.75% (Jul 11 2025)',
          'Islamic version: ceiling rate + no compounding — recommend for floating rate environment',
          'Disbursement 1 min for existing Sole Prop/Partnership ≤RM500K — fastest in Malaysia',
          'ML model: Maybank transaction history likely primary input for instant tier underwriting',
        ],
      }),
    },

    // ═══════════════════════════════════════════════════════════════════════
    // P02: Maybank SME Clean Loan / SME Clean Financing-i (Branch, up to RM1.5M)
    // ═══════════════════════════════════════════════════════════════════════
    {
      product_code:           'P02',
      product_name_en:        'Maybank SME Clean Loan / SME Clean Financing-i (up to RM1.5M)',
      product_name_zh:        'Maybank SME 无担保贷款（最高RM150万，分行申请）',
      loan_structure:         'TERM_LOAN',
      collateral_requirement: 'UNSECURED',
      guarantee_scheme:       'CGC_PORTFOLIO_GUARANTEE',
      is_shariah:             false,
      is_active:              true,
      block_a_json: JSON.stringify({
        min_loan_amount: null,
        max_loan_amount_online: 250000,
        max_loan_amount_branch: 1500000,
        min_tenure_months: 12,
        max_tenure_months: 60,
        rate_type: 'FLOATING',
        base_rate: 'BLR-based',
        rate_min: 4.5,
        rate_max: null,
        rate_source: 'iMoney Jan 2026: "as low as 4.5% p.a."',
        collateral_required: false,
        cgc_guarantee_available: true,
        eligible_company_types: ['SOLE_PROPRIETOR', 'PARTNERSHIP', 'SDN_BHD'],
        min_company_age_months: null,
        eligible_industries: [],
        excluded_industries: [],
        documentation_fee_rm: 600,
        sources: [
          'https://www.maybank2u.com.my/maybank2u/malaysia/en/business/financing/working_capital/business/sme_clean_loan_financing.page',
          'https://www.imoney.my/business-loan/maybank/maybank-small-business-loan',
        ],
        confidence: 'LIKELY',
        last_verified_date: new Date('2026-01-01'),
      }),
      block_b_json: null,
      block_c_summary: 'Maybank SME Clean Loan — 在线最高RM250K（无文件），分行最高RM150万。CGC Portfolio Guarantee Extra可选配。利率低至4.5% p.a.（iMoney Jan 2026）。文件费RM600。',
      block_a_completion_pct: 65,
      block_b_completion_pct: 0,
      last_verified_date: new Date('2026-01-01'),
      product_rules_json: JSON.stringify([
        { rule_category: 'financial', rule_key: 'amount_max_online_rm', rule_value: 250000, rule_operator: '<=', source_type: 'official', confidence_level: 'A', status: 'active', source_url: 'https://www.maybank2u.com.my/maybank2u/malaysia/en/business/financing/working_capital/business/sme_clean_loan_financing.page', evidence_date: '2025-01-01' },
        { rule_category: 'financial', rule_key: 'amount_max_branch_rm', rule_value: 1500000, rule_operator: '<=', source_type: 'official', confidence_level: 'A', status: 'active', source_url: 'https://www.maybank2u.com.my/maybank2u/malaysia/en/business/financing/working_capital/business/sme_clean_loan_financing.page', evidence_date: '2025-01-01' },
        { rule_category: 'financial', rule_key: 'tenure_max_months', rule_value: 60, rule_operator: '<=', source_type: 'semi_official', confidence_level: 'B', status: 'active', source_url: 'https://www.imoney.my/business-loan/maybank/maybank-small-business-loan', evidence_date: '2026-01-22' },
        { rule_category: 'pricing', rule_key: 'rate_min_pct', rule_value: 4.5, rule_operator: '>=', source_type: 'semi_official', confidence_level: 'B', status: 'active', source_url: 'https://www.imoney.my/business-loan/maybank/maybank-small-business-loan', evidence_date: '2026-01-22', notes: 'Single source — needs official PDS confirmation' },
        { rule_category: 'structure', rule_key: 'collateral_required', rule_value: false, rule_operator: 'EQUALS', source_type: 'official', confidence_level: 'A', status: 'active', source_url: 'https://www.maybank2u.com.my/maybank2u/malaysia/en/business/financing/working_capital/business/sme_clean_loan_financing.page', evidence_date: '2025-01-01' },
        { rule_category: 'structure', rule_key: 'cgc_portfolio_guarantee_extra_available', rule_value: true, rule_operator: 'EQUALS', source_type: 'official', confidence_level: 'A', status: 'active', source_url: 'https://www.maybank.com/islamic/en/business/financing/sme-clean-financing-i.page', evidence_date: '2025-01-01' },
      ]),
      product_signals_json: JSON.stringify([
        { signal_type: 'structure_hint', signal_text: 'RM250K via online (no docs), RM250K-RM1.5M requires branch visit. Branch route unlocks higher amounts for same clean/unsecured structure.', source_type: 'official', confidence_level: 'A', cross_verified_count: 2, source_url: 'https://www.maybank2u.com.my/maybank2u/malaysia/en/business/financing/working_capital/business/sme_clean_loan_financing.page', evidence_date: '2025-01-01' },
        { signal_type: 'mitigation', signal_text: 'CGC Portfolio Guarantee Extra (SPGE) as add-on converts this to a guarantee-backed product — useful for borderline credit profile to access RM1.5M.', source_type: 'official', confidence_level: 'A', cross_verified_count: 1, source_url: 'https://www.maybank.com/islamic/en/business/financing/sme-clean-financing-i.page', evidence_date: '2025-01-01' },
      ]),
      screening_view_json: JSON.stringify({
        product_name: 'Maybank SME Clean Loan / SME Clean Financing-i',
        facility_type: 'term',
        target_segment_summary: 'SME needing WC without collateral. Online up to RM250K no docs, branch up to RM1.5M. CGC guarantee available as upgrade.',
        key_hard_eligibility: ['Sole Prop / Partnership / Sdn Bhd', 'Malaysia-registered'],
        key_soft_preferences: ['Good CCRIS/CTOS', 'Stable monthly revenue', 'Existing Maybank customer preferred'],
        high_risk_triggers: ['CCRIS adverse', 'Director personal loan issues'],
        recommended_mitigants: ['CGC SPGE add-on for higher amounts', 'Submit 6-month bank statement'],
        good_fit_profile: 'SME needing RM50K-RM500K unsecured WC with clean CCRIS, has Maybank relationship',
        bad_fit_profile: 'CCRIS adverse, needs > RM1.5M, needs collateral-backed deal',
        notes_for_credit_memo: ['Rate 4.5% from iMoney — single source, B confidence', 'Documentation fee RM600 (waived for micro)', 'Branch route required for RM250K-RM1.5M'],
      }),
    },

    // ═══════════════════════════════════════════════════════════════════════
    // P03: Maybank HERpower (Women Entrepreneur)
    // ═══════════════════════════════════════════════════════════════════════
    {
      product_code:           'P03',
      product_name_en:        'Maybank HERpower (Women Entrepreneur Financing)',
      product_name_zh:        'Maybank HERpower 女性企业主融资',
      loan_structure:         'TERM_LOAN',
      collateral_requirement: 'UNSECURED',
      guarantee_scheme:       'NONE',
      is_shariah:             false,
      is_active:              true,
      block_a_json: JSON.stringify({
        min_loan_amount: null,
        max_loan_amount: 1000000,
        min_tenure_months: null,
        max_tenure_months: null,
        collateral_required: false,
        approval_time: '10 minutes',
        eligible_ownership: '51%+ women shareholding or women-controlled',
        eligible_company_types: ['SOLE_PROPRIETOR', 'PARTNERSHIP', 'SDN_BHD'],
        pds_available: true,
        sources: [
          'https://www.maybank2u.com.my/maybank2u/malaysia/en/business/financing/working_capital/business/sme-women-entrepreneur.page',
          'https://smallbusinessloanmy.com/loans/madani-sme-loan',
        ],
        confidence: 'CONFIRMED',
        last_verified_date: new Date('2025-01-01'),
        notes: 'SmallBusinessLoanMY: "RM1M collateral-free, 10-min approval" (Feb 2026). PDS available on official page.',
      }),
      block_b_json: null,
      block_c_summary: 'Maybank HERpower — 女性企业主专属，最高RM100万，无担保，10分钟批准。配套非融资支持（咨询服务、保险、合作平台）。',
      block_a_completion_pct: 70,
      block_b_completion_pct: 0,
      last_verified_date: new Date('2025-01-01'),
      product_rules_json: JSON.stringify([
        { rule_category: 'eligibility', rule_key: 'women_majority_ownership_required', rule_value: true, rule_operator: 'EQUALS', source_type: 'official', confidence_level: 'A', status: 'active', source_url: 'https://www.maybank2u.com.my/maybank2u/malaysia/en/business/financing/working_capital/business/sme-women-entrepreneur.page', evidence_date: '2025-01-01' },
        { rule_category: 'financial', rule_key: 'amount_max_rm', rule_value: 1000000, rule_operator: '<=', source_type: 'semi_official', confidence_level: 'B', status: 'active', source_url: 'https://smallbusinessloanmy.com/loans/madani-sme-loan', evidence_date: '2026-02-01', notes: 'SmallBusinessLoanMY Feb 2026: RM1M confirmed' },
        { rule_category: 'structure', rule_key: 'collateral_required', rule_value: false, rule_operator: 'EQUALS', source_type: 'semi_official', confidence_level: 'B', status: 'active', source_url: 'https://smallbusinessloanmy.com/loans/madani-sme-loan', evidence_date: '2026-02-01' },
        { rule_category: 'process', rule_key: 'approval_time_minutes', rule_value: 10, rule_operator: 'EQUALS', source_type: 'semi_official', confidence_level: 'B', status: 'active', source_url: 'https://smallbusinessloanmy.com/loans/madani-sme-loan', evidence_date: '2026-02-01' },
      ]),
      product_signals_json: JSON.stringify([
        { signal_type: 'sector_hint', signal_text: 'HERpower includes advisory, insurance (SMEasy Protect equivalent), partner platform access — holistic women entrepreneur ecosystem beyond financing.', source_type: 'official', confidence_level: 'A', cross_verified_count: 1, source_url: 'https://www.maybank2u.com.my/maybank2u/malaysia/en/business/financing/working_capital/business/sme-women-entrepreneur.page', evidence_date: '2025-01-01' },
        { signal_type: 'structure_hint', signal_text: 'Comparable to AFFINGEM (Affin) and SJPP WCGS-Women — suggest applying via Maybank HERpower if existing Maybank customer, for fastest approval.', source_type: 'professional', confidence_level: 'B', cross_verified_count: 2, source_url: 'https://smallbusinessloanmy.com/loans/madani-sme-loan', evidence_date: '2026-02-01' },
      ]),
      screening_view_json: JSON.stringify({
        product_name: 'Maybank HERpower',
        facility_type: 'digital_clean',
        target_segment_summary: 'Women-led SMEs (51%+ women shareholding), RM1M collateral-free, 10-min approval.',
        key_hard_eligibility: ['51%+ women shareholding/control', 'Malaysia-registered business'],
        key_soft_preferences: ['Existing Maybank customer', 'Director CCRIS clean'],
        high_risk_triggers: ['Less than 51% women ownership', 'Director CCRIS adverse'],
        recommended_mitigants: ['Combine with SJPP WCGS-Women for additional guarantee coverage if needed'],
        good_fit_profile: 'Women-led SME, existing Maybank customer, needs up to RM1M quickly without collateral',
        bad_fit_profile: 'Male-controlled business, needs >RM1M, CCRIS issues',
        notes_for_credit_memo: ['RM1M + 10-min from SmallBusinessLoanMY (B confidence) — verify PDS for exact amount/tenure', 'PDS link available on official Maybank page'],
      }),
    },

    // ═══════════════════════════════════════════════════════════════════════
    // P04: Maybank SME Online Property Business Financing (Online PBF/PBF-i)
    // ═══════════════════════════════════════════════════════════════════════
    {
      product_code:           'P04',
      product_name_en:        'Maybank SME Online Property Business Financing (PBF/PBF-i)',
      product_name_zh:        'Maybank SME 网上物业商业融资',
      loan_structure:         'PROPERTY_LOAN',
      collateral_requirement: 'PROPERTY',
      guarantee_scheme:       'NONE',
      is_shariah:             false,
      is_active:              true,
      block_a_json: JSON.stringify({
        min_loan_amount: 100000,
        max_loan_amount: null,
        min_tenure_months: null,
        max_tenure_months: null,
        rate_type: 'FLOATING',
        collateral_required: true,
        property_type: 'Commercial / Industrial',
        approval_time: '24 hours (online quick decision)',
        eligible_company_types: ['SOLE_PROPRIETOR', 'PARTNERSHIP', 'SDN_BHD'],
        sources: [
          'https://www.maybank2u.com.my/maybank2u/malaysia/en/business/financing/property_finance/business/sme_online_property_business_financing.page',
        ],
        confidence: 'CONFIRMED',
        last_verified_date: new Date('2025-01-01'),
        notes: 'Official: "From RM100,000. Quick decision within 24 hours." Industrial & commercial properties.',
      }),
      block_b_json: null,
      block_c_summary: '物业担保SME融资，从RM10万起，24小时在线快速批复。工业及商业物业。',
      block_a_completion_pct: 45,
      block_b_completion_pct: 0,
      last_verified_date: new Date('2025-01-01'),
      product_rules_json: JSON.stringify([
        { rule_category: 'financial', rule_key: 'amount_min_rm', rule_value: 100000, rule_operator: '>=', source_type: 'official', confidence_level: 'A', status: 'active', source_url: 'https://www.maybank2u.com.my/maybank2u/malaysia/en/business/financing/property_finance/business/sme_online_property_business_financing.page', evidence_date: '2025-01-01' },
        { rule_category: 'structure', rule_key: 'collateral_type', rule_value: 'commercial_industrial_property', rule_operator: 'IN', source_type: 'official', confidence_level: 'A', status: 'active', source_url: 'https://www.maybank2u.com.my/maybank2u/malaysia/en/business/financing/property_finance/business/sme_online_property_business_financing.page', evidence_date: '2025-01-01' },
        { rule_category: 'process', rule_key: 'online_decision_hours', rule_value: 24, rule_operator: '<=', source_type: 'official', confidence_level: 'A', status: 'active', source_url: 'https://www.maybank2u.com.my/maybank2u/malaysia/en/business/financing/property_finance/business/sme_online_property_business_financing.page', evidence_date: '2025-01-01' },
      ]),
      product_signals_json: JSON.stringify([
        { signal_type: 'process_hint', signal_text: 'Online application + 24hr decision makes this faster than typical property loan (usually 5-10 days). Suitable for time-sensitive property purchases.', source_type: 'official', confidence_level: 'A', cross_verified_count: 1, source_url: 'https://www.maybank2u.com.my/maybank2u/malaysia/en/business/financing/property_finance/business/sme_online_property_business_financing.page', evidence_date: '2025-01-01' },
      ]),
      screening_view_json: JSON.stringify({
        product_name: 'Maybank SME Online Property Business Financing',
        facility_type: 'property',
        target_segment_summary: 'SME purchasing commercial/industrial property, from RM100K, 24hr online decision.',
        key_hard_eligibility: ['Property as collateral (commercial/industrial)', 'Malaysia-registered SME'],
        key_soft_preferences: ['Established business with property purchase plan', 'Clean CCRIS'],
        high_risk_triggers: ['Property in non-commercial zone', 'Adverse CCRIS'],
        recommended_mitigants: ['Prepare property valuation in advance', 'Strong business financials to support repayment'],
        good_fit_profile: 'SME buying office/factory space, needs quick decision, has property as security',
        bad_fit_profile: 'No property collateral, needs unsecured financing',
        notes_for_credit_memo: ['Rate undisclosed — BLR-based (6.40%)', 'Max amount not stated — likely based on property value & LTV'],
      }),
    },

    // ═══════════════════════════════════════════════════════════════════════
    // P05: Maybank SJPP WCGS
    // ═══════════════════════════════════════════════════════════════════════
    {
      product_code:           'P05',
      product_name_en:        'Maybank SJPP Working Capital Guarantee Scheme (WCGS)',
      product_name_zh:        'Maybank SJPP 政府担保营运资金融资',
      loan_structure:         'TERM_LOAN',
      collateral_requirement: 'GOVERNMENT_GUARANTEE',
      guarantee_scheme:       'SJPP_TPKS',
      is_shariah:             false,
      is_active:              true,
      block_a_json: JSON.stringify({
        min_loan_amount: 100000,
        max_loan_amount: 10000000,
        min_tenure_months: null,
        max_tenure_months: 180,
        tenure_note: 'Up to 15 years or year 2035 whichever earlier (CONFIRMED official)',
        rate_type: 'FLOATING',
        guarantee_coverage_pct: 70,
        guarantee_provider: 'Malaysian Government / SJPP',
        eligible_company_types: ['SDN_BHD'],
        min_malaysian_ownership: 51,
        eligible_industries: ['All sectors'],
        excluded_industries: [],
        export_oriented_eligible: true,
        sources: [
          'https://www.maybank2u.com.my/maybank2u/malaysia/en/business/financing/government_aided/business/SJPP_Schemes_SME_Working_Capital_Financing.page',
        ],
        confidence: 'CONFIRMED',
        last_verified_date: new Date('2025-01-01'),
        notes: 'Official: RM100K-RM10M, up to 15yr/2035. 70% guarantee. Companies Act 2016 + 51% Malaysian.',
      }),
      block_b_json: null,
      block_c_summary: 'SJPP政府担保营运资金计划。最高RM1,000万，年限最长15年（2035年截止）。70%政府担保。马来西亚51%股权。全行业开放。',
      block_a_completion_pct: 75,
      block_b_completion_pct: 0,
      last_verified_date: new Date('2025-01-01'),
      product_rules_json: JSON.stringify([
        { rule_category: 'financial', rule_key: 'amount_min_rm', rule_value: 100000, rule_operator: '>=', source_type: 'official', confidence_level: 'A', status: 'active', source_url: 'https://www.maybank2u.com.my/maybank2u/malaysia/en/business/financing/government_aided/business/SJPP_Schemes_SME_Working_Capital_Financing.page', evidence_date: '2025-01-01' },
        { rule_category: 'financial', rule_key: 'amount_max_rm', rule_value: 10000000, rule_operator: '<=', source_type: 'official', confidence_level: 'A', status: 'active', source_url: 'https://www.maybank2u.com.my/maybank2u/malaysia/en/business/financing/government_aided/business/SJPP_Schemes_SME_Working_Capital_Financing.page', evidence_date: '2025-01-01' },
        { rule_category: 'financial', rule_key: 'tenure_max_expiry', rule_value: '2035 or 15yr', rule_operator: 'EQUALS', source_type: 'official', confidence_level: 'A', status: 'active', source_url: 'https://www.maybank2u.com.my/maybank2u/malaysia/en/business/financing/government_aided/business/SJPP_Schemes_SME_Working_Capital_Financing.page', evidence_date: '2025-01-01' },
        { rule_category: 'eligibility', rule_key: 'min_malaysian_ownership_pct', rule_value: 51, rule_operator: '>=', source_type: 'official', confidence_level: 'A', status: 'active', source_url: 'https://www.maybank2u.com.my/maybank2u/malaysia/en/business/financing/government_aided/business/SJPP_Schemes_SME_Working_Capital_Financing.page', evidence_date: '2025-01-01' },
        { rule_category: 'structure', rule_key: 'guarantee_coverage_pct', rule_value: 70, rule_operator: 'EQUALS', source_type: 'official', confidence_level: 'A', status: 'active', source_url: 'https://www.maybank2u.com.my/maybank2u/malaysia/en/business/financing/government_aided/business/SJPP_Schemes_SME_Working_Capital_Financing.page', evidence_date: '2025-01-01' },
        { rule_category: 'sector', rule_key: 'all_sectors_eligible', rule_value: true, rule_operator: 'EQUALS', source_type: 'official', confidence_level: 'A', status: 'active', source_url: 'https://www.maybank2u.com.my/maybank2u/malaysia/en/business/financing/government_aided/business/SJPP_Schemes_SME_Working_Capital_Financing.page', evidence_date: '2025-01-01' },
      ]),
      product_signals_json: JSON.stringify([
        { signal_type: 'structure_hint', signal_text: '70% government guarantee significantly reduces bank credit risk — enables approval for SMEs with limited collateral. Critical tool for RM500K-RM10M range without hard assets.', source_type: 'official', confidence_level: 'A', cross_verified_count: 2, source_url: 'https://www.maybank2u.com.my/maybank2u/malaysia/en/business/financing/government_aided/business/SJPP_Schemes_SME_Working_Capital_Financing.page', evidence_date: '2025-01-01' },
        { signal_type: 'mitigation', signal_text: 'SJPP guarantee fee ~1% p.a. upfront — factor into total cost. Export-oriented companies (50%+ export turnover) eligible with potentially enhanced terms.', source_type: 'official', confidence_level: 'A', cross_verified_count: 1, source_url: 'https://www.sjpp.com.my', evidence_date: '2025-01-01' },
      ]),
      screening_view_json: JSON.stringify({
        product_name: 'Maybank SJPP WCGS',
        facility_type: 'guarantee_backed',
        target_segment_summary: 'SME needing WC/CAPEX RM100K-RM10M with government guarantee backing. All sectors, 51%+ Malaysian.',
        key_hard_eligibility: ['≥51% Malaysian shareholding', 'Companies Act 2016 registered', 'All sectors eligible'],
        key_soft_preferences: ['Export-oriented may get enhanced terms', 'Clean CCRIS', 'Viable business model'],
        high_risk_triggers: ['<51% Malaysian ownership', 'CCRIS adverse', 'Listed/GLC ownership >20%'],
        recommended_mitigants: ['Combine with GGSM 2.0 if sector-specific criteria met'],
        good_fit_profile: 'Malaysian SME needing >RM500K without full collateral coverage, CCRIS acceptable, all sectors',
        bad_fit_profile: 'Foreign-owned, CCRIS adverse, need >RM10M',
        notes_for_credit_memo: ['70% guarantee is government-backed — premium product', 'Expiry 2035 — time-sensitive if client needs long tenure', 'SJPP fee ~1% p.a. upfront — factor into customer cost'],
      }),
    },

    // ═══════════════════════════════════════════════════════════════════════
    // P06: Maybank GGSM 2.0
    // ═══════════════════════════════════════════════════════════════════════
    {
      product_code:           'P06',
      product_name_en:        'Maybank GGSM 2.0 / GGSM-i 2.0 (Government Guarantee Scheme MADANI)',
      product_name_zh:        'Maybank GGSM 2.0 政府担保计划 MADANI（WC + CAPEX）',
      loan_structure:         'TERM_LOAN',
      collateral_requirement: 'GOVERNMENT_GUARANTEE',
      guarantee_scheme:       'BNM_TPUB',
      is_shariah:             false,
      is_active:              true,
      block_a_json: JSON.stringify({
        min_loan_amount: null,
        max_loan_amount: null,
        min_tenure_months: null,
        max_tenure_months: null,
        rate_type: 'FLOATING',
        rate_cap: 'BLR + 2% per SmallBusinessLoanMY (~8.4% with BLR=6.40%)',
        purpose: ['WORKING_CAPITAL', 'CAPEX'],
        no_refinancing: true,
        sectors_eligible: ['All economic sectors'],
        sectors_special: ['High Technology', 'Tourism (HTG-i/PTF-i)', 'Manufacturing (BNM sector code)', 'Agriculture (upstream/downstream)'],
        pds_available: true,
        sources: [
          'https://www.maybank2u.com.my/maybank2u/malaysia/en/business/financing/government_aided/business/government-guarantee-scheme-madani-i.page',
          'https://smallbusinessloanmy.com/loans/madani-sme-loan',
        ],
        confidence: 'CONFIRMED',
        last_verified_date: new Date('2025-01-01'),
        notes: 'Official page: WC + CAPEX, all sectors, no refinancing. PDS available. SmallBusinessLoanMY: 80% guarantee, rate cap BLR+2%.',
      }),
      block_b_json: null,
      block_c_summary: 'GGSM 2.0 MADANI政府担保。营运资金+资本开支，全经济领域，不可再融资。高科技/旅游/制造/农业有专项引导。PDS已公布（英/马文）。',
      block_a_completion_pct: 68,
      block_b_completion_pct: 0,
      last_verified_date: new Date('2025-01-01'),
      product_rules_json: JSON.stringify([
        { rule_category: 'structure', rule_key: 'refinancing_allowed', rule_value: false, rule_operator: 'EQUALS', source_type: 'official', confidence_level: 'A', status: 'active', source_url: 'https://www.maybank2u.com.my/maybank2u/malaysia/en/business/financing/government_aided/business/government-guarantee-scheme-madani-i.page', evidence_date: '2025-01-01' },
        { rule_category: 'sector', rule_key: 'all_sectors_eligible', rule_value: true, rule_operator: 'EQUALS', source_type: 'official', confidence_level: 'A', status: 'active', source_url: 'https://www.maybank2u.com.my/maybank2u/malaysia/en/business/financing/government_aided/business/government-guarantee-scheme-madani-i.page', evidence_date: '2025-01-01' },
        { rule_category: 'pricing', rule_key: 'rate_cap_above_blr_pct', rule_value: 2.0, rule_operator: '<=', source_type: 'semi_official', confidence_level: 'B', status: 'active', source_url: 'https://smallbusinessloanmy.com/loans/madani-sme-loan', evidence_date: '2026-01-29', notes: 'SmallBusinessLoanMY: BLR+2% cap; cross-reference needed with official PDS' },
        { rule_category: 'structure', rule_key: 'guarantee_coverage_pct', rule_value: 80, rule_operator: 'EQUALS', source_type: 'semi_official', confidence_level: 'B', status: 'active', source_url: 'https://smallbusinessloanmy.com/loans/madani-sme-loan', evidence_date: '2026-01-29' },
      ]),
      product_signals_json: JSON.stringify([
        { signal_type: 'structure_hint', signal_text: '80% guarantee (per SmallBusinessLoanMY) vs SJPP WCGS 70% — GGSM 2.0 offers higher coverage, dramatically reduces collateral requirement for larger amounts.', source_type: 'semi_official', confidence_level: 'B', cross_verified_count: 2, source_url: 'https://smallbusinessloanmy.com/loans/madani-sme-loan', evidence_date: '2026-01-29' },
        { signal_type: 'sector_hint', signal_text: 'High Tech & Tourism sectors eligible under HTG-i and PTF-i variants — confirm with RM for sector-specific conditions (Manufacturing uses BNM sector code guide).', source_type: 'official', confidence_level: 'A', cross_verified_count: 1, source_url: 'https://www.maybank2u.com.my/maybank2u/malaysia/en/business/financing/government_aided/business/government-guarantee-scheme-madani-i.page', evidence_date: '2025-01-01' },
        { signal_type: 'reject_reason', signal_text: 'Refinancing of existing facility is NOT allowed under GGSM — case must be for new WC/CAPEX only.', source_type: 'official', confidence_level: 'A', cross_verified_count: 2, source_url: 'https://www.maybank2u.com.my/maybank2u/malaysia/en/business/financing/government_aided/business/government-guarantee-scheme-madani-i.page', evidence_date: '2025-01-01' },
      ]),
      screening_view_json: JSON.stringify({
        product_name: 'Maybank GGSM 2.0',
        facility_type: 'guarantee_backed',
        target_segment_summary: 'All Malaysian SMEs needing WC/CAPEX with 80% government guarantee. Rate capped at BLR+2%. No refinancing.',
        key_hard_eligibility: ['Malaysian SME (BNM definition)', 'New WC or CAPEX purpose only — no refinancing'],
        key_soft_preferences: ['Sector alignment (High Tech/Tourism/Manufacturing/Agri)', 'Clean CCRIS'],
        high_risk_triggers: ['Refinancing purpose', '<51% Malaysian ownership', 'Purpose outside WC/CAPEX'],
        recommended_mitigants: ['Combine with sector-specific sub-facility for better rates (HTG-i, PTF-i)'],
        good_fit_profile: 'Malaysian SME needing large WC/CAPEX with limited collateral, all sectors, clean CCRIS',
        bad_fit_profile: 'Needs refinancing, foreign-owned, CCRIS adverse',
        notes_for_credit_memo: ['Rate cap BLR+2% = ~8.40% (with BLR 6.40%) — needs official PDS confirmation', '80% guarantee better than SJPP WCGS (70%) for same risk profile', 'High Tech / Tourism — confirm eligibility via HTG-i/PTF-i sub-facility'],
      }),
    },

  ]

  // ─── 写入数据库 ────────────────────────────────────────────────────────────
  let created = 0
  for (const p of products) {
    await prisma.product.upsert({
      where: { bank_id_product_code: { bank_id: bank.id, product_code: p.product_code } },
      update: {
        product_name_en:        p.product_name_en,
        product_name_zh:        p.product_name_zh,
        loan_structure:         p.loan_structure as any,
        collateral_requirement: p.collateral_requirement as any,
        guarantee_scheme:       p.guarantee_scheme as any,
        is_shariah:             p.is_shariah,
        is_active:              p.is_active,
        block_a_json:           p.block_a_json,
        block_b_json:           p.block_b_json ?? null,
        block_c_summary:        p.block_c_summary ?? null,
        block_a_completion_pct: p.block_a_completion_pct,
        block_b_completion_pct: p.block_b_completion_pct,
        last_verified_date:     p.last_verified_date,
        product_rules_json:     p.product_rules_json,
        product_signals_json:   p.product_signals_json,
        screening_view_json:    p.screening_view_json,
      },
      create: {
        bank_id:                bank.id,
        product_code:           p.product_code,
        product_name_en:        p.product_name_en,
        product_name_zh:        p.product_name_zh,
        loan_structure:         p.loan_structure as any,
        collateral_requirement: p.collateral_requirement as any,
        guarantee_scheme:       p.guarantee_scheme as any,
        is_shariah:             p.is_shariah,
        is_active:              p.is_active,
        block_a_json:           p.block_a_json,
        block_b_json:           p.block_b_json ?? null,
        block_c_summary:        p.block_c_summary ?? null,
        block_a_completion_pct: p.block_a_completion_pct,
        block_b_completion_pct: p.block_b_completion_pct,
        last_verified_date:     p.last_verified_date,
        product_rules_json:     p.product_rules_json,
        product_signals_json:   p.product_signals_json,
        screening_view_json:    p.screening_view_json,
      },
    })
    console.log(`  ✅ ${p.product_code} — ${p.product_name_zh}`)
    created++
  }

  console.log(`\n✅ Maybank (MBB) 重建完成: ${created} 个产品 (新格式)`)
  console.log('新增字段：product_rules_json / product_signals_json / screening_view_json')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
