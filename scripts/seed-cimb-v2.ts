/**
 * CIMB Bank Berhad (CIMB) — SME产品数据库重建（新格式 v2）
 * 执行日期：2026-04-18
 *
 * 关键利率（官方确认）：
 * - CIMB BLR/BFR = 6.60% (effective 14 Jul 2025) — CONFIRMED: official CIMB announcement
 * - CIMB BR = 3.75% (effective 14 Jul 2025) — CONFIRMED
 * - CIMB SBR = 2.75% — CONFIRMED
 * - 注意：CIMB BR=3.75%，高于Maybank BR=2.75%（各行BR不同）
 *
 * 重要发现：
 * - SME InstaBiz Financing 已于 2025年3月7日 暂停（官网确认）
 * - Quick Biz Financing: RM5M无担保，仍在运营
 * - BNM AES (CIMB): RM5M上限，80% CGC/SJPP担保，免担保费（官网确认）
 * - SME Biz Property: 150%以上融资比例（160%更多WC）
 * - BizJamin: CGC, 30-80%, 最高RM5M, 15年
 *
 * 渠道执行记录：
 * 渠道1 ✅ cimb.com.my SME页面，CIMB BLR官方公告(Jul 14 2025)，Quick Biz-i官网，AES官网，BizJamin官网
 * 渠道2 ✅ SmallBusinessLoanMY (Jan 2026): 4产品表+利率，TheEdge: CIMB RM30B SME计划
 * 渠道3 ✅ BizChannel@CIMB平台信息；buySolar合作（Solar RM1M SME/RM5M商业）
 * 渠道4 ✅ 行业通用数据（seed-channel4-industry.ts）；SmallBusinessLoanMY处理费1-2%
 * 渠道5 ✅ AES官网（80%担保免担保费）；BizJamin（CGC 30-80%）
 * 渠道6 ✅ 4条全部执行；无2025年CIMB专属SME完整申请经验帖
 * 渠道7 ✅ CIMB RM30B计划新闻稿(2022)；CGC+SJPP合作确认
 *
 * 运行: npx tsx scripts/seed-cimb-v2.ts
 */

import { prisma } from '../src/lib/prisma'

async function main() {
  const bank = await prisma.bank.upsert({
    where:  { code: 'CIMB' },
    update: {
      sme_portal_url:   'https://www.cimb.com.my/en/business/business-solutions/financing/sme-financing.html',
      cgc_partner:      true,
      sjpp_partner:     true,
      bnm_fund_partner: true,
    },
    create: {
      code:                 'CIMB',
      name_en:              'CIMB Bank Berhad',
      name_zh:              '联昌国际银行',
      name_bm:              'CIMB Bank Berhad',
      type:                 'COMMERCIAL_BANK',
      is_shariah_compliant: false,
      official_website:     'https://www.cimb.com.my',
      sme_portal_url:       'https://www.cimb.com.my/en/business/business-solutions/financing/sme-financing.html',
      cgc_partner:          true,
      sjpp_partner:         true,
      bnm_fund_partner:     true,
      personal_dsr_low_threshold:  65,
      personal_dsr_high_threshold: 75,
      personal_income_cutoff:      3000,
      personal_min_ctos:           615,
      personal_approval_rate_pct:  51,
    },
  })
  console.log(`✅ Bank upserted: ${bank.code} — ${bank.name_en}`)

  const products = [

    // ═══════════════════════════════════════════════════════════════════════
    // P01: CIMB SME Quick Biz Financing / Quick Biz Financing-i
    // ═══════════════════════════════════════════════════════════════════════
    {
      product_code:           'P01',
      product_name_en:        'CIMB SME Quick Biz Financing / Quick Biz Financing-i',
      product_name_zh:        'CIMB SME 快捷营运资金融资（无担保，最高RM500万）',
      loan_structure:         'TERM_LOAN',
      collateral_requirement: 'UNSECURED',
      guarantee_scheme:       'NONE',
      is_shariah:             false,
      is_active:              true,
      block_a_json: JSON.stringify({
        min_loan_amount: null,
        max_loan_amount: 5000000,
        min_tenure_months: null,
        max_tenure_months: null,
        rate_type: 'FLOATING',
        cimb_blr: 6.60,
        cimb_br: 3.75,
        cimb_sbr: 2.75,
        rate_min: 6.5,
        rate_max: 9.0,
        rate_source: 'SmallBusinessLoanMY Jan 2026: clean loan 6.5-9.0% p.a.',
        collateral_required: false,
        eligible_company_types: ['SOLE_PROPRIETOR', 'PARTNERSHIP', 'LLP', 'SDN_BHD'],
        min_company_age_months: null,
        min_annual_revenue: null,
        processing_fee: '1-2% of loan amount (SmallBusinessLoanMY)',
        confidence: 'CONFIRMED',
        last_verified_date: new Date('2026-01-01'),
        sources: [
          'https://www.cimb.com.my/en/business/business-solutions/financing/sme-financing/sme-quick-biz-financing.html',
          'https://smallbusinessloanmy.com/banks/cimb-sme',
        ],
        notes: 'RM5M + no collateral CONFIRMED from CIMB official. Rate range from SmallBusinessLoanMY (LIKELY). InstaBiz discontinued 7 Mar 2025; Quick Biz is replacement for clean WC.',
      }),
      block_b_json: null,
      block_c_summary: 'CIMB SME Quick Biz — 无担保，最高RM500万，最快获取营运资金。SmallBusinessLoanMY利率6.5%-9%（LIKELY）。处理费1-2%。CIMB BLR=6.60%（Jul 14 2025 CONFIRMED）。InstaBiz已于2025年3月7日暂停。',
      block_a_completion_pct: 62,
      block_b_completion_pct: 0,
      last_verified_date: new Date('2026-01-01'),
      product_rules_json: JSON.stringify([
        { rule_category: 'financial', rule_key: 'amount_max_rm', rule_value: 5000000, rule_operator: '<=', source_type: 'official', confidence_level: 'A', status: 'active', source_url: 'https://www.cimb.com.my/en/business/business-solutions/financing/sme-financing/sme-quick-biz-financing.html', evidence_date: '2025-01-01' },
        { rule_category: 'structure', rule_key: 'collateral_required', rule_value: false, rule_operator: 'EQUALS', source_type: 'official', confidence_level: 'A', status: 'active', source_url: 'https://www.cimb.com.my/en/business/business-solutions/financing/sme-financing/sme-quick-biz-financing.html', evidence_date: '2025-01-01' },
        { rule_category: 'pricing', rule_key: 'cimb_blr_pct', rule_value: 6.60, rule_operator: 'EQUALS', source_type: 'official', confidence_level: 'A', status: 'active', source_url: 'https://www.cimb.com.my/en/business/important-notices/2025/notice-on-standardised-base-rate.html', evidence_date: '2025-07-14' },
        { rule_category: 'pricing', rule_key: 'cimb_br_pct', rule_value: 3.75, rule_operator: 'EQUALS', source_type: 'official', confidence_level: 'A', status: 'active', source_url: 'https://www.cimb.com.my/en/business/important-notices/2025/notice-on-standardised-base-rate.html', evidence_date: '2025-07-14' },
        { rule_category: 'pricing', rule_key: 'rate_range_clean_loan_pct', rule_value: '6.5-9.0', rule_operator: 'APPROX_RANGE', source_type: 'semi_official', confidence_level: 'B', status: 'active', source_url: 'https://smallbusinessloanmy.com/banks/cimb-sme', evidence_date: '2026-01-01' },
        { rule_category: 'process', rule_key: 'processing_fee_pct_of_loan', rule_value: '1-2%', rule_operator: 'APPROX_RANGE', source_type: 'semi_official', confidence_level: 'B', status: 'active', source_url: 'https://smallbusinessloanmy.com/banks/cimb-sme', evidence_date: '2026-01-01' },
        { rule_category: 'eligibility', rule_key: 'min_malaysian_ownership_pct', rule_value: 51, rule_operator: '>=', source_type: 'semi_official', confidence_level: 'B', status: 'active', source_url: 'https://smallbusinessloanmy.com/banks/cimb-sme', evidence_date: '2026-01-01' },
      ]),
      product_signals_json: JSON.stringify([
        { signal_type: 'process_hint', signal_text: 'CIMB SME InstaBiz discontinued 7 March 2025. Quick Biz is the current flagship clean WC product. Confirm active status at branch.', source_type: 'official', confidence_level: 'A', cross_verified_count: 1, source_url: 'https://cimb.com.my/en/business/solutions-products/financing/sme-financing/sme-instabiz-financing.html', evidence_date: '2025-03-07' },
        { signal_type: 'structure_hint', signal_text: 'Quick Biz max RM5M no collateral — highest unsecured SME limit among Malaysia mainstream banks (vs Maybank Digital RM500K no-collateral tier). For RM500K-RM5M clean loan, CIMB may have edge.', source_type: 'semi_official', confidence_level: 'B', cross_verified_count: 2, source_url: 'https://smallbusinessloanmy.com/banks/cimb-sme', evidence_date: '2026-01-01' },
        { signal_type: 'process_hint', signal_text: 'BizChannel@CIMB: Apply online, minimal documentation. Standard bank SME process 2-4 weeks (SmallBusinessLoanMY Jan 2026).', source_type: 'semi_official', confidence_level: 'B', cross_verified_count: 2, source_url: 'https://smallbusinessloanmy.com/sme-loans-malaysia', evidence_date: '2026-01-29' },
      ]),
      screening_view_json: JSON.stringify({
        product_name: 'CIMB SME Quick Biz Financing',
        facility_type: 'term',
        target_segment_summary: 'Clean WC financing without collateral, up to RM5M. CIMB flagship SME product post-InstaBiz discontinuation.',
        key_hard_eligibility: ['≥51% Malaysian ownership', 'Viable SME (BNM definition)', 'Malaysia-registered business'],
        key_soft_preferences: ['CIMB existing customer', 'CCRIS/CTOS clean', 'Strong cash flow (6 months bank statements)', 'Annual revenue consistent'],
        high_risk_triggers: ['CCRIS adverse', 'Director personal loans in arrears', '<2 years operation', 'CCRIS shows R&R at other bank'],
        recommended_mitigants: ['Add CGC Portfolio Guarantee for borderline cases', 'Submit 6-month bank statements proactively', 'BizChannel@CIMB for digital track'],
        good_fit_profile: 'Malaysian SME, 2+ years ops, monthly sales RM100K+, clean CCRIS, needs RM500K-RM3M working capital without collateral',
        bad_fit_profile: 'CCRIS adverse, <2 years ops, foreign-owned, needs specific purpose (property/equipment — use other products)',
        notes_for_credit_memo: [
          'Rate 6.5-9.0% from SmallBusinessLoanMY B confidence — get official PDS from CIMB RM for actual spread',
          'CIMB BLR=6.60%, BR=3.75% (different from Maybank BLR=6.40%) — rate comparison must use same basis',
          'Processing fee 1-2% — factor into total cost',
          'InstaBiz discontinued Mar 7 2025 — Quick Biz is replacement. Verify current product name at branch.',
        ],
      }),
    },

    // ═══════════════════════════════════════════════════════════════════════
    // P02: CIMB SME Biz Property Financing
    // ═══════════════════════════════════════════════════════════════════════
    {
      product_code:           'P02',
      product_name_en:        'CIMB SME Biz Property Financing',
      product_name_zh:        'CIMB SME 物业商业融资（160% MoA含营运资金）',
      loan_structure:         'PROPERTY_LOAN',
      collateral_requirement: 'PROPERTY',
      guarantee_scheme:       'NONE',
      is_shariah:             false,
      is_active:              true,
      block_a_json: JSON.stringify({
        min_loan_amount: 100000,
        max_loan_amount: 5000000,
        min_tenure_months: 60,
        max_tenure_months: 180,
        rate_type: 'FLOATING',
        rate_min: 4.5,
        rate_max: 7.0,
        rate_source: 'SmallBusinessLoanMY Jan 2026: property 4.5-7.0%',
        margin_of_advance_pct: 160,
        margin_note: 'Up to 160% MoA — means working capital can be rolled into property loan. SmallBusinessLoanMY: "up to 150%", cimb.com.my: "up to 160%"',
        collateral_required: true,
        collateral_type: 'Commercial/Industrial Property',
        eligible_company_types: ['SOLE_PROPRIETOR', 'PARTNERSHIP', 'LLP', 'SDN_BHD'],
        sources: [
          'https://www.cimb.com.my/en/business/business-solutions/financing/sme-financing/sme-biz-property-financing.html',
          'https://smallbusinessloanmy.com/banks/cimb-sme',
        ],
        confidence: 'LIKELY',
        last_verified_date: new Date('2026-01-01'),
        notes: 'CIMB official: "scale your business with up to 160% additional working capital". SmallBusinessLoanMY: SME Property Financing RM100K-RM5M, 4.5-7%, 5-15yr.',
      }),
      block_b_json: null,
      block_c_summary: 'CIMB SME Biz Property — 物业担保，高达160%融资比例（超过物业价值，额外部分为营运资金）。最高RM500万，5-15年。',
      block_a_completion_pct: 68,
      block_b_completion_pct: 0,
      last_verified_date: new Date('2026-01-01'),
      product_rules_json: JSON.stringify([
        { rule_category: 'financial', rule_key: 'amount_min_rm', rule_value: 100000, rule_operator: '>=', source_type: 'semi_official', confidence_level: 'B', status: 'active', source_url: 'https://smallbusinessloanmy.com/banks/cimb-sme', evidence_date: '2026-01-01' },
        { rule_category: 'financial', rule_key: 'amount_max_rm', rule_value: 5000000, rule_operator: '<=', source_type: 'semi_official', confidence_level: 'B', status: 'active', source_url: 'https://smallbusinessloanmy.com/banks/cimb-sme', evidence_date: '2026-01-01' },
        { rule_category: 'financial', rule_key: 'tenure_max_months', rule_value: 180, rule_operator: '<=', source_type: 'semi_official', confidence_level: 'B', status: 'active', source_url: 'https://smallbusinessloanmy.com/banks/cimb-sme', evidence_date: '2026-01-01' },
        { rule_category: 'pricing', rule_key: 'rate_range_property_pct', rule_value: '4.5-7.0', rule_operator: 'APPROX_RANGE', source_type: 'semi_official', confidence_level: 'B', status: 'active', source_url: 'https://smallbusinessloanmy.com/banks/cimb-sme', evidence_date: '2026-01-01' },
        { rule_category: 'structure', rule_key: 'margin_of_advance_max_pct', rule_value: 160, rule_operator: '<=', source_type: 'official', confidence_level: 'A', status: 'active', source_url: 'https://www.cimb.com.my/en/business/business-solutions/financing/sme-financing/sme-biz-property-financing.html', evidence_date: '2025-01-01', notes: 'CIMB official: "up to 160% additional working capital"' },
        { rule_category: 'structure', rule_key: 'collateral_type', rule_value: 'commercial_industrial_property', rule_operator: 'IN', source_type: 'official', confidence_level: 'A', status: 'active', source_url: 'https://www.cimb.com.my/en/business/business-solutions/financing/sme-financing/sme-biz-property-financing.html', evidence_date: '2025-01-01' },
      ]),
      product_signals_json: JSON.stringify([
        { signal_type: 'structure_hint', signal_text: '160% MoA is unique — allows bundling WC within property loan structure. E.g. property worth RM1M → borrow RM1.6M (RM1M property financing + RM600K WC). Compare to HLB SMElite 150%.', source_type: 'official', confidence_level: 'A', cross_verified_count: 2, source_url: 'https://www.cimb.com.my/en/business/business-solutions/financing/sme-financing/sme-biz-property-financing.html', evidence_date: '2025-01-01' },
        { signal_type: 'sector_hint', signal_text: 'Best for businesses that own or are purchasing commercial/industrial premises and want to unlock working capital from the same facility without separate unsecured loan.', source_type: 'professional', confidence_level: 'B', cross_verified_count: 1, source_url: 'https://smallbusinessloanmy.com/banks/cimb-sme', evidence_date: '2026-01-01' },
      ]),
      screening_view_json: JSON.stringify({
        product_name: 'CIMB SME Biz Property Financing',
        facility_type: 'property',
        target_segment_summary: 'SME with commercial/industrial property as collateral. Up to 160% MoA — unique WC bundling capability.',
        key_hard_eligibility: ['Commercial/industrial property as collateral', 'Malaysian SME, ≥51% Malaysian ownership'],
        key_soft_preferences: ['Strong property valuation', 'Clean CCRIS', 'Good DSC ratio'],
        high_risk_triggers: ['Property in non-commercial zone', 'LTV exceeds 90%+ risk tolerance', 'CCRIS adverse'],
        recommended_mitigants: ['Independent valuation before application', 'Use 160% MoA to consolidate WC and property into single facility'],
        good_fit_profile: 'SME owning or purchasing commercial premises, wants WC alongside property loan, CCRIS clean',
        bad_fit_profile: 'No property, residential property only, CCRIS adverse',
        notes_for_credit_memo: ['Rate 4.5-7.0% B confidence from SmallBusinessLoanMY', '160% MoA confirmed official — differentiated vs other banks', 'Bundle WC within property loan = single facility, simpler servicing'],
      }),
    },

    // ═══════════════════════════════════════════════════════════════════════
    // P03: CIMB BNM AES (All Economic Sectors) — free guarantee fee
    // ═══════════════════════════════════════════════════════════════════════
    {
      product_code:           'P03',
      product_name_en:        'CIMB BNM AES Scheme (All Economic Sectors Financing)',
      product_name_zh:        'CIMB BNM 全经济领域融资（免担保费，80%担保）',
      loan_structure:         'TERM_LOAN',
      collateral_requirement: 'GOVERNMENT_GUARANTEE',
      guarantee_scheme:       'BNM_TPUB',
      is_shariah:             false,
      is_active:              true,
      block_a_json: JSON.stringify({
        min_loan_amount: null,
        max_loan_amount: 5000000,
        min_tenure_months: null,
        max_tenure_months: 60,
        rate_type: 'FIXED',
        rate_max: 7.0,
        guarantee_fee: 'WAIVED by CIMB under Flexi Guarantee Scheme (CONFIRMED)',
        guarantee_coverage_pct: 80,
        guarantee_provider: 'CGC or SJPP',
        processing_fee: 'WAIVED (CONFIRMED: official page)',
        eligible_company_types: ['SOLE_PROPRIETOR', 'PARTNERSHIP', 'LLP', 'SDN_BHD'],
        min_malaysian_ownership: 51,
        plc_glc_max_ownership_pct: 20,
        purpose: ['WORKING_CAPITAL', 'CAPEX'],
        no_refinancing: true,
        excluded_uses: ['Share purchase', 'Refinancing', 'Land/real estate', 'Property development', 'Investment holding companies'],
        sources: [
          'https://www.cimb.com.my/en/business/business-solutions/financing/government-bnm-schemes-financing/sme-all-economic-sectors.html',
        ],
        confidence: 'CONFIRMED',
        last_verified_date: new Date('2025-01-01'),
        notes: 'CONFIRMED from official: max RM5M, 5yr, 80% CGC/SJPP guarantee, guarantee fee WAIVED, processing fee WAIVED. PLC/GLC ownership ≤20%.',
      }),
      block_b_json: null,
      block_c_summary: 'CIMB BNM AES — BNM全经济领域基金，最高RM500万，最长5年。80%担保。CIMB独家：承担担保费（免费给客户）+ 免处理费。用于营运资金/资本开支，不可再融资。',
      block_a_completion_pct: 85,
      block_b_completion_pct: 0,
      last_verified_date: new Date('2025-01-01'),
      product_rules_json: JSON.stringify([
        { rule_category: 'financial', rule_key: 'amount_max_rm', rule_value: 5000000, rule_operator: '<=', source_type: 'official', confidence_level: 'A', status: 'active', source_url: 'https://www.cimb.com.my/en/business/business-solutions/financing/government-bnm-schemes-financing/sme-all-economic-sectors.html', evidence_date: '2025-01-01' },
        { rule_category: 'financial', rule_key: 'tenure_max_months', rule_value: 60, rule_operator: '<=', source_type: 'official', confidence_level: 'A', status: 'active', source_url: 'https://www.cimb.com.my/en/business/business-solutions/financing/government-bnm-schemes-financing/sme-all-economic-sectors.html', evidence_date: '2025-01-01' },
        { rule_category: 'pricing', rule_key: 'rate_max_pct', rule_value: 7.0, rule_operator: '<=', source_type: 'official', confidence_level: 'A', status: 'active', source_url: 'https://www.cimb.com.my/en/business/business-solutions/financing/government-bnm-schemes-financing/sme-all-economic-sectors.html', evidence_date: '2025-01-01' },
        { rule_category: 'pricing', rule_key: 'guarantee_fee_waived', rule_value: true, rule_operator: 'EQUALS', source_type: 'official', confidence_level: 'A', status: 'active', source_url: 'https://www.cimb.com.my/en/business/business-solutions/financing/government-bnm-schemes-financing/sme-all-economic-sectors.html', evidence_date: '2025-01-01', notes: 'CIMB bears guarantee fee under Flexi Guarantee Scheme — unique competitive edge' },
        { rule_category: 'pricing', rule_key: 'processing_fee_waived', rule_value: true, rule_operator: 'EQUALS', source_type: 'official', confidence_level: 'A', status: 'active', source_url: 'https://www.cimb.com.my/en/business/business-solutions/financing/government-bnm-schemes-financing/sme-all-economic-sectors.html', evidence_date: '2025-01-01' },
        { rule_category: 'structure', rule_key: 'guarantee_coverage_pct', rule_value: 80, rule_operator: 'EQUALS', source_type: 'official', confidence_level: 'A', status: 'active', source_url: 'https://www.cimb.com.my/en/business/business-solutions/financing/government-bnm-schemes-financing/sme-all-economic-sectors.html', evidence_date: '2025-01-01' },
        { rule_category: 'structure', rule_key: 'refinancing_allowed', rule_value: false, rule_operator: 'EQUALS', source_type: 'official', confidence_level: 'A', status: 'active', source_url: 'https://www.cimb.com.my/en/business/business-solutions/financing/government-bnm-schemes-financing/sme-all-economic-sectors.html', evidence_date: '2025-01-01' },
        { rule_category: 'eligibility', rule_key: 'min_malaysian_ownership_pct', rule_value: 51, rule_operator: '>=', source_type: 'official', confidence_level: 'A', status: 'active', source_url: 'https://www.cimb.com.my/en/business/business-solutions/financing/government-bnm-schemes-financing/sme-all-economic-sectors.html', evidence_date: '2025-01-01' },
        { rule_category: 'eligibility', rule_key: 'plc_glc_max_ownership_pct', rule_value: 20, rule_operator: '<=', source_type: 'official', confidence_level: 'A', status: 'active', source_url: 'https://www.cimb.com.my/en/business/business-solutions/financing/government-bnm-schemes-financing/sme-all-economic-sectors.html', evidence_date: '2025-01-01' },
      ]),
      product_signals_json: JSON.stringify([
        { signal_type: 'mitigation', signal_text: 'CIMB waives guarantee fee (Flexi Guarantee Scheme) + processing fee — saves client typically 1-2% upfront. This makes CIMB AES cheaper than same product at other banks.', source_type: 'official', confidence_level: 'A', cross_verified_count: 1, source_url: 'https://www.cimb.com.my/en/business/business-solutions/financing/government-bnm-schemes-financing/sme-all-economic-sectors.html', evidence_date: '2025-01-01' },
        { signal_type: 'reject_reason', signal_text: 'Refinancing is NOT allowed — purpose must be new WC or CAPEX. Applications attempting to refinance existing CIMB or other bank facility will be declined.', source_type: 'official', confidence_level: 'A', cross_verified_count: 2, source_url: 'https://www.cimb.com.my/en/business/business-solutions/financing/government-bnm-schemes-financing/sme-all-economic-sectors.html', evidence_date: '2025-01-01' },
        { signal_type: 'reject_reason', signal_text: 'PLC/GLC ownership >20% disqualifies. Government-linked companies partly owning the SME may trigger this restriction.', source_type: 'official', confidence_level: 'A', cross_verified_count: 1, source_url: 'https://www.cimb.com.my/en/business/business-solutions/financing/government-bnm-schemes-financing/sme-all-economic-sectors.html', evidence_date: '2025-01-01' },
      ]),
      screening_view_json: JSON.stringify({
        product_name: 'CIMB BNM AES Scheme',
        facility_type: 'guarantee_backed',
        target_segment_summary: 'All Malaysian SMEs needing WC/CAPEX up to RM5M. 80% govt guarantee. CIMB absorbs guarantee + processing fee — best total cost for BNM scheme.',
        key_hard_eligibility: ['≥51% Malaysian ownership', 'PLC/GLC ownership ≤20%', 'New WC/CAPEX only — no refinancing', 'BNM SME definition compliant'],
        key_soft_preferences: ['CCRIS clean', 'Viable business plan for WC/CAPEX use', 'All sectors eligible'],
        high_risk_triggers: ['Refinancing purpose', 'PLC/GLC >20% ownership', 'Excluded uses (shares/land/property dev)'],
        recommended_mitigants: ['Document WC/CAPEX purpose clearly in application', 'CIMB zero guarantee fee = lower total cost vs other banks for same scheme'],
        good_fit_profile: 'Malaysian SME needing RM500K-RM5M fresh WC or CAPEX, limited collateral, CCRIS acceptable',
        bad_fit_profile: 'Wants to refinance, PLC-linked company, >RM5M need',
        notes_for_credit_memo: [
          'CRITICAL ADVANTAGE: CIMB waives guarantee fee + processing fee → saves ~1-2% vs same scheme at other banks',
          '80% guarantee coverage vs SJPP WCGS 70% — higher protection',
          'Rate cap 7.0% official — fixed rate based on BNM fund',
          'Max 5 years tenure — shorter than SJPP WCGS (15yr)',
        ],
      }),
    },

    // ═══════════════════════════════════════════════════════════════════════
    // P04: CIMB BizJamin (CGC Guarantee Scheme)
    // ═══════════════════════════════════════════════════════════════════════
    {
      product_code:           'P04',
      product_name_en:        'CIMB BizJamin (CGC Guarantee Scheme)',
      product_name_zh:        'CIMB BizJamin CGC担保计划（30-80%担保，最高RM500万）',
      loan_structure:         'TERM_LOAN',
      collateral_requirement: 'GOVERNMENT_GUARANTEE',
      guarantee_scheme:       'CGC_BIZJAMIN',
      is_shariah:             false,
      is_active:              true,
      block_a_json: JSON.stringify({
        min_loan_amount: null,
        max_loan_amount: 5000000,
        min_tenure_months: null,
        max_tenure_months_tl: 180,
        max_tenure_months_od: 24,
        rate_type: 'FLOATING',
        guarantee_coverage_pct_min: 30,
        guarantee_coverage_pct_max: 80,
        guarantee_provider: 'CGC (Credit Guarantee Corporation)',
        guarantee_note: 'CGC guarantee 30%-80% in multiples of 5%, up to RM5M whichever lower',
        facility_types: ['TERM_LOAN', 'OVERDRAFT', 'TRADE', 'HIRE_PURCHASE', 'LEASING'],
        eligible_company_types: ['SOLE_PROPRIETOR', 'PARTNERSHIP', 'LLP', 'SDN_BHD'],
        min_malaysian_ownership: 51,
        sources: [
          'https://www.cimb.com.my/en/business/business-solutions/financing/government-bnm-schemes-financing/bizjamin-scheme.html',
        ],
        confidence: 'CONFIRMED',
        last_verified_date: new Date('2025-01-01'),
        notes: 'Official: CGC 30-80% coverage, max RM5M, TL tenure 15yr, OD/revolving 2yr extendable to 15yr. All facility types (TL/OD/Trade/HP/Leasing). 51% Malaysian.',
      }),
      block_b_json: null,
      block_c_summary: 'BizJamin — CGC担保，30%-80%，最高RM500万。Term Loan最长15年。可覆盖TL/OD/贸易融资/HP/租赁，最广覆盖。适合有可行项目但缺担保的SME。',
      block_a_completion_pct: 80,
      block_b_completion_pct: 0,
      last_verified_date: new Date('2025-01-01'),
      product_rules_json: JSON.stringify([
        { rule_category: 'financial', rule_key: 'amount_max_rm', rule_value: 5000000, rule_operator: '<=', source_type: 'official', confidence_level: 'A', status: 'active', source_url: 'https://www.cimb.com.my/en/business/business-solutions/financing/government-bnm-schemes-financing/bizjamin-scheme.html', evidence_date: '2025-01-01' },
        { rule_category: 'financial', rule_key: 'tl_tenure_max_months', rule_value: 180, rule_operator: '<=', source_type: 'official', confidence_level: 'A', status: 'active', source_url: 'https://www.cimb.com.my/en/business/business-solutions/financing/government-bnm-schemes-financing/bizjamin-scheme.html', evidence_date: '2025-01-01' },
        { rule_category: 'financial', rule_key: 'od_initial_tenure_months', rule_value: 24, rule_operator: 'EQUALS', source_type: 'official', confidence_level: 'A', status: 'active', source_url: 'https://www.cimb.com.my/en/business/business-solutions/financing/government-bnm-schemes-financing/bizjamin-scheme.html', evidence_date: '2025-01-01', notes: 'Revolving: 2yr initial, extendable, max 15yr total' },
        { rule_category: 'structure', rule_key: 'guarantee_coverage_pct_range', rule_value: '30-80', rule_operator: 'BETWEEN', source_type: 'official', confidence_level: 'A', status: 'active', source_url: 'https://www.cimb.com.my/en/business/business-solutions/financing/government-bnm-schemes-financing/bizjamin-scheme.html', evidence_date: '2025-01-01' },
        { rule_category: 'structure', rule_key: 'facility_types_covered', rule_value: ['TL', 'OD', 'Trade', 'HP', 'Leasing'], rule_operator: 'IN', source_type: 'official', confidence_level: 'A', status: 'active', source_url: 'https://www.cimb.com.my/en/business/business-solutions/financing/government-bnm-schemes-financing/bizjamin-scheme.html', evidence_date: '2025-01-01' },
        { rule_category: 'eligibility', rule_key: 'min_malaysian_ownership_pct', rule_value: 51, rule_operator: '>=', source_type: 'official', confidence_level: 'A', status: 'active', source_url: 'https://www.cimb.com.my/en/business/business-solutions/financing/government-bnm-schemes-financing/bizjamin-scheme.html', evidence_date: '2025-01-01' },
      ]),
      product_signals_json: JSON.stringify([
        { signal_type: 'structure_hint', signal_text: 'BizJamin covers HP and Leasing — rare among guarantee schemes. Useful for equipment acquisition without separate trade-specific scheme.', source_type: 'official', confidence_level: 'A', cross_verified_count: 1, source_url: 'https://www.cimb.com.my/en/business/business-solutions/financing/government-bnm-schemes-financing/bizjamin-scheme.html', evidence_date: '2025-01-01' },
        { signal_type: 'mitigation', signal_text: 'Variable guarantee % (30-80%) allows structuring around client creditworthiness — stronger credit may qualify for lower coverage (lower CGC fee) while weaker credit can access higher 80% protection.', source_type: 'official', confidence_level: 'A', cross_verified_count: 1, source_url: 'https://www.cimb.com.my/en/business/business-solutions/financing/government-bnm-schemes-financing/bizjamin-scheme.html', evidence_date: '2025-01-01' },
      ]),
      screening_view_json: JSON.stringify({
        product_name: 'CIMB BizJamin',
        facility_type: 'guarantee_backed',
        target_segment_summary: 'SME with viable projects but insufficient collateral. CGC 30-80% guarantee, all facility types including HP/Leasing, max RM5M 15yr.',
        key_hard_eligibility: ['≥51% Malaysian ownership', 'BNM SME classification', 'Viable project/business'],
        key_soft_preferences: ['CCRIS clean', 'Good business plan', 'Demonstrated repayment capacity'],
        high_risk_triggers: ['CCRIS adverse', 'No clear repayment source', '<51% Malaysian ownership'],
        recommended_mitigants: ['Use higher CGC % for weaker credit profiles', 'Structure HP/Leasing under BizJamin for equipment acquisition'],
        good_fit_profile: 'SME needing equipment (HP), trade facilities, or term loan with CGC backing. Has viable project but limited collateral.',
        bad_fit_profile: 'CCRIS severely adverse, non-Malaysian majority owned',
        notes_for_credit_memo: ['15-year TL tenure — longest among CGC schemes', 'HP/Leasing coverage differentiates vs SJPP WCGS', 'CGC guarantee fee not waived here (unlike AES) — factor ~1-2% p.a. into client cost'],
      }),
    },

    // ═══════════════════════════════════════════════════════════════════════
    // P05: CIMB SME Renewable Energy Financing (Solar PV)
    // ═══════════════════════════════════════════════════════════════════════
    {
      product_code:           'P05',
      product_name_en:        'CIMB SME Renewable Energy Financing / RE Financing-i (Solar PV)',
      product_name_zh:        'CIMB SME 可再生能源融资（太阳能光伏，最高RM100万）',
      loan_structure:         'TERM_LOAN',
      collateral_requirement: 'MIXED',
      guarantee_scheme:       'NONE',
      is_shariah:             false,
      is_active:              true,
      block_a_json: JSON.stringify({
        min_loan_amount: null,
        max_loan_amount_sme: 1000000,
        max_loan_amount_commercial: 5000000,
        max_financing_pct: 100,
        max_tenure_months: 120,
        rate_type: 'FLOATING',
        purpose: 'Solar PV system (including system cost, NEM meter, installation, professional fees)',
        eligible_company_types: ['SOLE_PROPRIETOR', 'PARTNERSHIP', 'LLP', 'SDN_BHD'],
        sme_vs_commercial_note: 'SME: up to RM1M; Commercial: up to RM5M',
        sources: [
          'https://www.cimb.com.my/en/business/business-solutions/financing/sme-financing/sme-renewable-energy-financing-i.html',
          'https://www.buysolar.my/cimb-business-loan',
        ],
        confidence: 'CONFIRMED',
        last_verified_date: new Date('2025-01-01'),
        notes: 'buySolar.my (CIMB partner): up to 100% of solar cost, SME max RM1M, Commercial RM5M, up to 10yr. BNM LCTF green financing also available separately.',
      }),
      block_b_json: null,
      block_c_summary: 'CIMB太阳能/可再生能源融资。SME最高RM100万（商业最高RM500万），最长10年，100%融资比例。覆盖系统成本+NEM+安装。绿色转型最佳工具。',
      block_a_completion_pct: 70,
      block_b_completion_pct: 0,
      last_verified_date: new Date('2025-01-01'),
      product_rules_json: JSON.stringify([
        { rule_category: 'financial', rule_key: 'amount_max_sme_rm', rule_value: 1000000, rule_operator: '<=', source_type: 'semi_official', confidence_level: 'B', status: 'active', source_url: 'https://www.buysolar.my/cimb-business-loan', evidence_date: '2025-01-01' },
        { rule_category: 'financial', rule_key: 'amount_max_commercial_rm', rule_value: 5000000, rule_operator: '<=', source_type: 'semi_official', confidence_level: 'B', status: 'active', source_url: 'https://www.buysolar.my/cimb-business-loan', evidence_date: '2025-01-01' },
        { rule_category: 'financial', rule_key: 'financing_pct_of_cost_max', rule_value: 100, rule_operator: '<=', source_type: 'semi_official', confidence_level: 'B', status: 'active', source_url: 'https://www.buysolar.my/cimb-business-loan', evidence_date: '2025-01-01' },
        { rule_category: 'financial', rule_key: 'tenure_max_months', rule_value: 120, rule_operator: '<=', source_type: 'semi_official', confidence_level: 'B', status: 'active', source_url: 'https://www.buysolar.my/cimb-business-loan', evidence_date: '2025-01-01' },
        { rule_category: 'sector', rule_key: 'purpose_solar_pv', rule_value: true, rule_operator: 'EQUALS', source_type: 'official', confidence_level: 'A', status: 'active', source_url: 'https://www.cimb.com.my/en/business/business-solutions/financing/sme-financing/sme-renewable-energy-financing-i.html', evidence_date: '2025-01-01' },
      ]),
      product_signals_json: JSON.stringify([
        { signal_type: 'sector_hint', signal_text: 'Solar financing 100% of cost including installation — no upfront capital needed. NEM (Net Energy Metering) eligible projects can offset electricity bills.', source_type: 'semi_official', confidence_level: 'B', cross_verified_count: 2, source_url: 'https://www.buysolar.my/cimb-business-loan', evidence_date: '2025-01-01' },
        { signal_type: 'structure_hint', signal_text: 'BNM LCTF (Low Carbon Transition Financing) available as alternative for broader ESG adoption — CIMB committed RM100M in Jan 2022, up to RM10M at ≤5% p.a.', source_type: 'official', confidence_level: 'A', cross_verified_count: 1, source_url: 'https://www.cimb.com/en/newsroom/2022/cimb-commits-rm30-billion-in-financing-to-accelerate-the-revitalisation-and-continued-growth-of-sme-businesses-by-2024.html', evidence_date: '2022-09-01' },
      ]),
      screening_view_json: JSON.stringify({
        product_name: 'CIMB SME Renewable Energy Financing',
        facility_type: 'term',
        target_segment_summary: 'SME adopting solar PV. 100% financing up to RM1M (SME) / RM5M (Commercial), 10yr tenure.',
        key_hard_eligibility: ['Solar PV project purpose', 'Malaysian SME', 'CIMB-registered solar installer'],
        key_soft_preferences: ['NEM-eligible project', 'Good repayment capacity', 'Property or asset backing'],
        high_risk_triggers: ['Non-solar purpose', 'Unregistered installer'],
        recommended_mitigants: ['Use buySolar.my CIMB partner network for streamlined application', 'Pair with LCTF for broader ESG upgrade if needed'],
        good_fit_profile: 'SME factory/warehouse owner installing solar panels, needs 100% financing, 10yr payback period',
        bad_fit_profile: 'Non-solar renewable project, needs >RM1M as SME',
        notes_for_credit_memo: ['Rate undisclosed — BLR-based (6.60%)', 'buySolar.my is official CIMB partner — streamlined application', 'LCTF alternative: broader ESG projects up to RM10M at ≤5% p.a.'],
      }),
    },

  ]

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
        block_c_summary:        p.block_c_summary,
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
        block_c_summary:        p.block_c_summary,
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

  console.log(`\n✅ CIMB Bank 重建完成: ${created} 个产品 (新格式)`)
  console.log('关键发现：InstaBiz暂停(Mar 7 2025) | BLR=6.60%(最高) | AES免担保费+处理费 | Quick Biz RM5M无担保')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
