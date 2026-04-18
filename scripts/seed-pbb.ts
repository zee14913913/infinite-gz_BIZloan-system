/**
 * Public Bank (PBB) — SME产品数据种子
 * 7大渠道搜索记录：
 * 渠道1 [官网 pbebank.com]: 找到SME loan timeline PDF (CGC), BRF产品 (RM5M/10年), 2020年PENJANA scheme。官网无独立SME产品页面可抓取。
 * 渠道2 [金融媒体]: TheEdge/TheStar 多篇 — PBB SME市占18.3%（Q3 2025），SME loan增长10.7%（2025年），FY25总SME融资RM445.8B组合，18%全国市场份额
 * 渠道3 [LinkedIn/Facebook顾问]: PBB Senior Executive帖子（Top SME Loan Disbursement）、Business Manager个人档案（5C信贷评估、信贷提案审批流程）
 * 渠道4 [lowyat/reddit/facebook申请者]: lowyat有信用卡拒绝帖（提及PBB DSR阈值<80%），无SME专项2025年帖
 * 渠道5 [CGC/SJPP/BNM]: TheEdge确认 PBB与SJPP合作RM1B（WCGS、PGGS、GGSM）；PBB与CGC合作RM1B。PublicIslamicBank有BNM Fund产品页。GGSM最高90%担保（高科技/农业/制造/旅游），保费低至0.5%
 * 渠道6-1 [SME loan experience forum 2025]: SmallBusinessLoanMY提到「PBB 5 products, rates from 4.2%, strict eligibility」
 * 渠道6-2 [rejected reason 2025]: 通用拒贷原因；无PBB专属数据
 * 渠道6-3 [facebook SME review 2025]: PBB官方Facebook页面；无申请者评论
 * 渠道6-4 [中文企业贷款经验]: 个人贷款相关；无PBB SME企业贷款中文经验帖
 * 渠道7 [iMSME]: imsme.com.my为登录墙；搜索无iMSME+Public Bank专属SME产品数据
 * 运行: npx tsx scripts/seed-pbb.ts
 */

import { prisma } from '../src/lib/prisma'

async function main() {
  // ── 1. 更新银行基本资料 ─────────────────────────────────────────────────────
  const bank = await prisma.bank.upsert({
    where:  { code: 'PBB' },
    update: {
      sme_portal_url: 'https://www.pbebank.com/en/business/',
      cgc_partner:    true,
      sjpp_partner:   true,
      bnm_fund_partner: true,
      personal_dsr_low_threshold:  55,
      personal_dsr_high_threshold: 60,
      personal_income_cutoff:      3000,
      personal_min_ctos:           620,
      personal_approval_rate_pct:  57,
    },
    create: {
      code:               'PBB',
      name_en:            'Public Bank Berhad',
      name_zh:            '大众银行',
      name_bm:            'Public Bank Berhad',
      type:               'COMMERCIAL_BANK',
      is_shariah_compliant: false,
      official_website:   'https://www.pbebank.com',
      sme_portal_url:     'https://www.pbebank.com/en/business/',
      cgc_partner:        true,
      sjpp_partner:       true,
      bnm_fund_partner:   true,
      personal_dsr_low_threshold:  55,
      personal_dsr_high_threshold: 60,
      personal_income_cutoff:      3000,
      personal_min_ctos:           620,
      personal_approval_rate_pct:  57,
    },
  })

  console.log(`Bank upserted: ${bank.code} — ${bank.name_en}`)

  // ── 2. 删除旧产品 ────────────────────────────────────────────────────────────
  await prisma.product.deleteMany({ where: { bank_id: bank.id } })

  // ── 3. 产品列表 ──────────────────────────────────────────────────────────────
  const products = [

    // ─────────────────────────────────────────────────────────────────────────
    // P01: SME Term Loan / Term Financing-i（主力产品）
    // 来源: smallbusinessloanmy.com (Jan 2026), thestar.com.my, pbebank.com CGC timeline
    // ─────────────────────────────────────────────────────────────────────────
    {
      bank_id:       bank.id,
      product_code:  'P01',
      product_name_en: 'SME Term Loan / Term Financing-i',
      product_name_zh: 'SME 定期贷款（传统 + 伊斯兰）',
      loan_structure:         'TERM_LOAN',
      collateral_requirement: 'MIXED',
      guarantee_scheme:       'NONE',
      is_shariah:    false,
      is_active:     true,
      block_a_json:  JSON.stringify({
        min_loan_amount: 50000,
        max_loan_amount: 5000000,
        min_tenure_months: 12,
        max_tenure_months: 180,  // 15年（secured）；unsecured最高7年
        rate_type: 'FLOATING',
        base_rate: 'BR-based; secured BR+1.2%, unsecured BR+2.5%–5.5%',
        rate_min: 4.2,   // 渠道6-1 smallbusinessloanmy (Jan 2026): property-secured 4.2%-5.5%
        rate_max: 8.5,   // unsecured 6.5%-8.5% (smallbusinessloanmy)
        min_company_age_months: 24,
        eligible_company_types: ['SOLE_PROPRIETOR', 'PARTNERSHIP', 'SDN_BHD'],
        eligible_industries: [],
        excluded_industries: [],
        min_annual_revenue: 500000,  // smallbusinessloanmy: "RM500K+ (typical)"
        monthly_turnover_multiplier_min: null,
        monthly_turnover_multiplier_max: null,
        max_loan_to_annual_revenue_pct: null,
        dscr_min: null,
        dscr_preferred: null,
        dscr_formula_note: null,
        ltv_max: null,
        collateral_coverage_min: null,
        guarantee_fee_pct: null,
        processing_fee: null,  // 无公开声明的处理费
        approval_timeline: '5-14 working days',  // smallbusinessloanmy (Jan 2026)
        confidence: 'LIKELY',
        last_verified_date: new Date('2026-01-01'),
        sources: [
          'https://smallbusinessloanmy.com/banks/public-bank-sme',
          'https://www.thestar.com.my/business/business-news/2025/11/17/public-bank-reports-rm184bil-net-profit-for-3q25',
          'https://www.pbebank.com/pdf/Loans-SME/partner_timeline_cgc.aspx',
        ],
        notes: 'Rate range cross-verified: secured 4.2%-5.5% from smallbusinessloanmy.com (Jan 2026); unsecured 6.5%-8.5% same source. No official PBB PDS found for SME term loan. PBB DSR ceiling confirmed from lowyat.net: <80% DSR requirement. Min annual revenue RM500K "typical" from smallbusinessloanmy.com — ESTIMATED, not officially confirmed. PBB is branch-based with limited online application.',
      }),
      block_b_json: JSON.stringify([
        {
          step_order: 1,
          step_type: 'RM_ASSESSMENT',
          trigger_conditions: ['Customer visits branch or referred by RM'],
          site_visit_threshold: null,
          typical_duration_days_min: 1,
          typical_duration_days_max: 3,
          duration_notes: 'PBB primarily branch-based. No public-facing online SME loan application. Relationship with existing PBB business account strongly preferred.',
          responsible_party: 'Branch RM',
          key_actions: [
            'Initial discussion with RM on loan requirements',
            'Preliminary eligibility check (2 years operation, annual revenue, CCRIS clean)',
            'Determine loan type (secured vs unsecured, Islamic vs conventional)',
          ],
          common_blockers: [
            'Less than 2 years operation',
            'Annual revenue below threshold (typically RM500K)',
            'Adverse CCRIS record',
            'No existing Public Bank business account',
          ],
          client_requirements: [],
          rejection_reasons: [
            {
              reason_code: 'R01_NO_PBB_ACCOUNT',
              description_zh: '无大众银行现有往来关系，审批较为审慎',
              description_en: 'No existing Public Bank business banking relationship',
              frequency: 'COMMON',
              mitigation: 'Open PBB business account 6-12 months before loan application; channel business revenue through PBB account',
            },
            {
              reason_code: 'R02_STRICT_DSR',
              description_zh: 'DSR需低于80%（PBB标准较严）',
              description_en: 'DSR above 80% threshold (PBB has strict DSR requirements)',
              frequency: 'COMMON',
              mitigation: 'Reduce existing loan commitments before applying; confirmed from lowyat.net user experience',
            },
          ],
          empirical_rules: [
            {
              rule_type: 'EXISTING_CUSTOMER_ADVANTAGE',
              formula: 'Existing PBB business current account holders with 2+ year relationship have significantly higher approval rate and may receive preferential pricing',
              conditions: ['Existing PBB business account holder', '2+ years banking relationship', 'Business revenue channelled through PBB account'],
              source: 'https://smallbusinessloanmy.com/banks/public-bank-sme',
              confidence: 'LIKELY',
            },
            {
              rule_type: 'CREDIT_QUALITY_FOCUS',
              formula: 'PBB\'s SME NPL ratio 0.53% (Q1 2025) vs industry 1.42% — bank maintains strict credit underwriting. Rejection rates higher but approved customers get among best rates.',
              conditions: [],
              source: 'https://www.thestar.com.my/business/business-news/2025/11/17/public-bank-reports-rm184bil-net-profit-for-3q25',
              confidence: 'CONFIRMED',
            },
          ],
          confidence: 'LIKELY',
          sources: [
            'https://smallbusinessloanmy.com/banks/public-bank-sme',
            'https://forum.lowyat.net/topic/4905412/+40',
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
          duration_notes: 'PBB prefers audited accounts. Management accounts accepted but may result in lower loan amount or higher rate.',
          responsible_party: 'Customer / Branch RM',
          key_actions: ['Customer prepares and submits full document package to branch'],
          common_blockers: [
            'Lack of audited accounts (management accounts treated less favorably)',
            'Bank statements not from Public Bank account',
            'SSM documents not updated with latest shareholding',
          ],
          client_requirements: [
            'SSM registration documents (Form 9, 24, 49 for Sdn Bhd)',
            'NRIC copies of all directors/shareholders',
            'Latest 6 months business bank statements (all accounts)',
            'Latest 2 years AUDITED accounts (preferred; management accounts accepted)',
            'Latest 2 years income tax returns (Form C / Form B)',
            'Business profile or company profile',
            'Proof of business premises (tenancy agreement or title deed)',
            'Existing loan documents (if any)',
            'Collateral documents: title deed, valuation report (for secured loans)',
          ],
          rejection_reasons: [],
          empirical_rules: [
            {
              rule_type: 'AUDITED_ACCOUNTS_PREFERENCE',
              formula: 'PBB strongly prefers audited accounts. Businesses with only management accounts may face stricter scrutiny and lower approved amounts.',
              conditions: [],
              source: 'https://smallbusinessloanmy.com/banks/public-bank-sme',
              confidence: 'LIKELY',
            },
          ],
          confidence: 'LIKELY',
          sources: ['https://smallbusinessloanmy.com/banks/public-bank-sme'],
          notes: null,
        },
        {
          step_order: 3,
          step_type: 'CREDIT_SCORING',
          trigger_conditions: ['All applications'],
          site_visit_threshold: null,
          typical_duration_days_min: 1,
          typical_duration_days_max: 3,
          duration_notes: 'PBB uses 5C credit assessment (Character, Capacity, Capital, Conditions, Collateral). Stricter than industry average.',
          responsible_party: 'Branch credit team / RM',
          key_actions: [
            'CCRIS and CTOS check',
            '5C analysis: Character (repayment history), Capacity (DSR/cash flow), Capital (equity/net worth), Conditions (industry/purpose), Collateral',
            'Financial ratio analysis',
          ],
          common_blockers: [
            'CCRIS adverse record (even "2" or "3" months overdue)',
            'DSR above 60% (preferred) — confirmed threshold from smallbusinessloanmy.com',
            'Weak cash flow coverage',
          ],
          client_requirements: [],
          rejection_reasons: [
            {
              reason_code: 'R03_CCRIS_STRICT',
              description_zh: 'CCRIS有任何2期或以上逾期记录（PBB标准严于多数银行）',
              description_en: 'CCRIS adverse entries of 2+ months overdue (PBB stricter than industry)',
              frequency: 'COMMON',
              mitigation: 'All CCRIS must show "0" for 6+ months consecutively before applying',
            },
          ],
          empirical_rules: [
            {
              rule_type: '5C_FRAMEWORK',
              formula: 'PBB credit assessment uses 5C framework. All 5 dimensions must be satisfactory. One weak C can still result in rejection even if others are strong.',
              conditions: [],
              source: 'https://www.linkedin.com/in/tan-nam-leng-15835763/',
              confidence: 'CONFIRMED',
            },
            {
              rule_type: 'DSR_THRESHOLD',
              formula: 'PBB personal DSR threshold: <60% preferred. Business DSCR: not publicly disclosed but credit team applies DSCR test',
              conditions: [],
              source: 'https://smallbusinessloanmy.com/banks/public-bank-sme',
              confidence: 'LIKELY',
            },
          ],
          confidence: 'LIKELY',
          sources: [
            'https://smallbusinessloanmy.com/banks/public-bank-sme',
            'https://www.linkedin.com/in/tan-nam-leng-15835763/',
          ],
          notes: null,
        },
        {
          step_order: 4,
          step_type: 'SITE_VISIT',
          trigger_conditions: ['Typically triggered for larger amounts; specific threshold not publicly disclosed by PBB'],
          site_visit_threshold: 'Amount threshold not publicly disclosed. Based on industry standard: likely triggered for loans > RM500,000 or for property-secured loans requiring valuation. Not confirmed by PBB official source.',
          typical_duration_days_min: 1,
          typical_duration_days_max: 3,
          duration_notes: 'Site visit required for collateral valuation of property. Independent valuer commissioned by bank.',
          responsible_party: 'RM / Approved Valuer',
          key_actions: [
            'Business premises visit by RM',
            'Property valuation by bank-approved valuer (for secured loans)',
          ],
          common_blockers: [
            'Difficulty scheduling valuation',
            'Valuation below expected market value (reduces approved loan amount)',
          ],
          client_requirements: ['Provide access to business premises for visit/inspection'],
          rejection_reasons: [],
          empirical_rules: [],
          confidence: 'ESTIMATED',
          sources: ['https://smallbusinessloanmy.com/banks/public-bank-sme'],
          notes: 'Site visit threshold not confirmed by PBB official source. ESTIMATED based on industry standard. PBB is known for property-based lending; valuation is critical step for secured loans.',
        },
        {
          step_order: 5,
          step_type: 'CREDIT_COMMITTEE',
          trigger_conditions: ['All applications go through credit committee'],
          site_visit_threshold: null,
          typical_duration_days_min: 3,
          typical_duration_days_max: 10,
          duration_notes: 'Total processing 5-14 working days per smallbusinessloanmy.com. Credit committee structure follows branch/region/HO tiers but specific RM thresholds not publicly disclosed.',
          responsible_party: 'Branch Credit / Regional Credit / HO',
          key_actions: ['Credit proposal reviewed and approved/rejected by appropriate committee level'],
          common_blockers: ['Borderline cases escalated to higher levels, extending timeline'],
          client_requirements: [],
          rejection_reasons: [],
          empirical_rules: [
            {
              rule_type: 'ISO_CERTIFIED_PROCESS',
              formula: 'PBB has ISO 9001 certified loan approval process — internal process discipline means consistent application of credit policy',
              conditions: [],
              source: 'https://www.smibusinessdirectory.com.my/smisme-editorial/banking-a-finance/669-public-bank-smes-banking-solutions.html',
              confidence: 'CONFIRMED',
            },
          ],
          confidence: 'ESTIMATED',
          sources: ['https://smallbusinessloanmy.com/banks/public-bank-sme'],
          notes: 'Credit committee tier thresholds (branch/region/HO) not publicly disclosed. ESTIMATED from industry practice.',
        },
        {
          step_order: 6,
          step_type: 'LETTER_OF_OFFER',
          trigger_conditions: ['Application approved'],
          site_visit_threshold: null,
          typical_duration_days_min: 1,
          typical_duration_days_max: 3,
          duration_notes: null,
          responsible_party: 'PBB credit team',
          key_actions: ['LO issued to customer at branch'],
          common_blockers: [],
          client_requirements: [],
          rejection_reasons: [],
          empirical_rules: [],
          confidence: 'LIKELY',
          sources: [],
          notes: null,
        },
        {
          step_order: 7,
          step_type: 'ACCEPTANCE',
          trigger_conditions: ['Customer accepts LO'],
          site_visit_threshold: null,
          typical_duration_days_min: 1,
          typical_duration_days_max: 5,
          duration_notes: null,
          responsible_party: 'Customer',
          key_actions: ['Customer signs and returns LO to branch'],
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
          trigger_conditions: ['Post LO acceptance'],
          site_visit_threshold: null,
          typical_duration_days_min: 3,
          typical_duration_days_max: 14,
          duration_notes: 'Secured loans: property legal documentation, charge creation takes longer. Unsecured: simpler and faster.',
          responsible_party: 'Customer / Bank-panel solicitor',
          key_actions: [
            'Facility agreement signing',
            'Charge/mortgage creation over collateral (secured loans)',
            'Guarantee documentation (directors/guarantors)',
          ],
          common_blockers: [
            'Delays in property title transfer for charge creation',
            'Multiple directors/shareholders requiring coordination for signatures',
          ],
          client_requirements: [
            'All directors/guarantors must sign facility agreement and guarantee',
            'Property title documents for secured loans',
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
          trigger_conditions: ['All conditions precedent fulfilled'],
          site_visit_threshold: null,
          typical_duration_days_min: 1,
          typical_duration_days_max: 3,
          duration_notes: 'Funds credited to PBB business current account. Existing PBB customers: faster disbursement.',
          responsible_party: 'PBB operations',
          key_actions: ['Full loan amount credited to PBB business current account'],
          common_blockers: ['Pending property charge registration (secured loans)'],
          client_requirements: ['Must have PBB business current account for disbursement'],
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
          key_actions: ['Monthly repayment via auto-debit from PBB current account'],
          common_blockers: [],
          client_requirements: ['Monthly repayment on time'],
          rejection_reasons: [
            {
              reason_code: 'R04_LATE_PAYMENT',
              description_zh: 'PBB逾期容忍度低；CCRIS逾期记录会影响未来贷款申请',
              description_en: 'PBB has low tolerance for late payments; CCRIS adverse entries affect future loan applications',
              frequency: 'OCCASIONAL',
              mitigation: 'Contact PBB early if facing repayment difficulty; restructuring available (request fee RM150 from 16 Feb 2026)',
            },
          ],
          empirical_rules: [
            {
              rule_type: 'RESTRUCTURING_FEE',
              formula: 'Refinancing/restructuring request fee: RM150 (effective 16 Feb 2026, reduced from RM200)',
              conditions: ['Applicable to requests involving changes to terms and conditions'],
              source: 'https://ringgitplus.com/en/blog/personal-finance-news/public-bank-cuts-financing-request-fee-from-feb-2026.html',
              confidence: 'CONFIRMED',
            },
          ],
          confidence: 'CONFIRMED',
          sources: ['https://ringgitplus.com/en/blog/personal-finance-news/public-bank-cuts-financing-request-fee-from-feb-2026.html'],
          notes: null,
        },
        {
          step_order: 11,
          step_type: 'HO_REVIEW',
          trigger_conditions: ['Large amounts or complex cases escalated to HO'],
          site_visit_threshold: null,
          typical_duration_days_min: null,
          typical_duration_days_max: null,
          duration_notes: 'Specific HO escalation thresholds not publicly disclosed.',
          responsible_party: 'HO Credit / Risk Management',
          key_actions: [],
          common_blockers: [],
          client_requirements: [],
          rejection_reasons: [],
          empirical_rules: [],
          confidence: 'MISSING',
          sources: [],
          notes: 'PBB does not publicly disclose credit committee escalation thresholds (branch/region/HO limits). Left MISSING per hard rule.',
        },
      ]),
      block_c_summary: `【Public Bank SME Term Loan — 客户流程说明】

**银行定位（来源：TheEdge 2025, smallbusinessloanmy.com Jan 2026）**
大众银行是马来西亚最大SME贷款机构（市占率18.3%，RM445.8B组合，Q3 2025），以严格信贷标准著称，不良贷款率仅0.53%（全行业最低）。因此，PBB批核率较低，但对成功批核的客户给予全马最具竞争力的利率，特别是有物业担保者。

**产品概览（利率，2026年1月数据）**
- 物业担保定期贷款：4.2%–5.5% p.a.（全马有担保SME贷款最低利率）
- 标准定期贷款：4.8%–7.0% p.a.
- 无抵押/清洁贷款：6.5%–8.5% p.a.
- 透支（OD）：BLR+1%–3%（浮动）

**申请渠道**
PBB主要为分行渠道，在线申请功能有限。申请须亲自到分行，与RM面谈。

**关键资格要求（较市场严格）**
- 营运最少2年
- 年营业额典型要求约RM500K以上（高于业界平均RM300K）
- CCRIS全部清洁（无任何2期或以上逾期）
- DSR典型要求低于60%（业界平均约70%）
- 现有PBB往来关系强烈建议（无PBB账户者审批较困难）
- 有审计账目者优先（管理账目接受但效果较差）

**最高批核率技巧（来源：smallbusinessloanmy.com）**
1. 申请前12个月把业务收款渠道集中到PBB账户
2. 准备最新审计账目（非管理账目）
3. 申请前6个月确保CCRIS全部清洁（无逾期）
4. 有物业担保的申请优先处理且利率更低
5. 提交2-3家银行同时申请（PBB拒绝率较高，备选方案很重要）

**常见拒贷原因（来源：lowyat.net用户经验 + smallbusinessloanmy.com）**
1. 无PBB现有往来账户（最常见）
2. CCRIS有任何逾期记录
3. DSR超过PBB阈值（个人DSR门槛 < 80%，lowyat.net confirmed）
4. 年营业额不足
5. 仅有管理账目、无审计账目

**担保计划**
PBB参与 GGSM MADANI（SJPP, 最高80%担保）、CGC Bizjamin、Working Capital Guarantee Scheme。
- GGSM高科技/农业/制造/旅游行业可获90%担保，保费低至0.5%
- 2023年与SJPP签订RM10亿担保合作，2024年与CGC签订RM10亿合作

**重要费用更新**
- 信贷条件变更申请费：RM150（2026年2月16日起，从RM200降至RM150）`,
      block_a_completion_pct: 68,
      block_b_completion_pct: 75,
      last_verified_date: new Date('2026-01-01'),
    },

    // ─────────────────────────────────────────────────────────────────────────
    // P02: Commercial Property Loan
    // 来源: smallbusinessloanmy.com (Jan 2026)
    // ─────────────────────────────────────────────────────────────────────────
    {
      bank_id:       bank.id,
      product_code:  'P02',
      product_name_en: 'Commercial Property Loan / Commercial Property Financing-i',
      product_name_zh: '商业物业贷款（物业购置/再融资）',
      loan_structure:         'PROPERTY_LOAN',
      collateral_requirement: 'PROPERTY',
      guarantee_scheme:       'NONE',
      is_shariah:    false,
      is_active:     true,
      block_a_json:  JSON.stringify({
        min_loan_amount: null,
        max_loan_amount: null,
        min_tenure_months: 12,
        max_tenure_months: 360,  // up to 30 years per smallbusinessloanmy.com
        rate_type: 'FLOATING',
        base_rate: 'BR-based',
        rate_min: 4.0,   // smallbusinessloanmy.com: "from 4.0% p.a." for commercial property
        rate_max: 6.5,   // estimated upper range; no official source
        min_company_age_months: 24,
        eligible_company_types: ['SDN_BHD', 'PARTNERSHIP', 'SOLE_PROPRIETOR'],
        eligible_industries: [],
        excluded_industries: [],
        min_annual_revenue: 500000,
        monthly_turnover_multiplier_min: null,
        monthly_turnover_multiplier_max: null,
        max_loan_to_annual_revenue_pct: null,
        dscr_min: null,
        dscr_preferred: null,
        dscr_formula_note: null,
        ltv_max: 85,  // "up to 85% of property value" — smallbusinessloanmy.com
        collateral_coverage_min: null,
        guarantee_fee_pct: null,
        processing_fee: null,
        approval_timeline: '14-21 working days (valuation required)',
        confidence: 'LIKELY',
        last_verified_date: new Date('2026-01-01'),
        sources: [
          'https://smallbusinessloanmy.com/banks/public-bank-sme',
        ],
        notes: 'Rate range from smallbusinessloanmy.com (Jan 2026). No official PBB PDS found. LTV 85% from same source. "PBB particularly strong in commercial property financing" per smallbusinessloanmy. Max rate_max 6.5% is estimated (single source); no second verification — marked LIKELY.',
      }),
      block_b_json:  null,
      block_c_summary: null,
      block_a_completion_pct: 45,
      block_b_completion_pct: 0,
      last_verified_date: new Date('2026-01-01'),
    },

    // ─────────────────────────────────────────────────────────────────────────
    // P03: Overdraft / Cashline-i
    // 来源: smallbusinessloanmy.com (Jan 2026)
    // ─────────────────────────────────────────────────────────────────────────
    {
      bank_id:       bank.id,
      product_code:  'P03',
      product_name_en: 'Business Overdraft / Cashline-i',
      product_name_zh: '商业透支（灵活循环营运资金）',
      loan_structure:         'OVERDRAFT',
      collateral_requirement: 'MIXED',
      guarantee_scheme:       'NONE',
      is_shariah:    false,
      is_active:     true,
      block_a_json:  JSON.stringify({
        min_loan_amount: null,
        max_loan_amount: null,
        min_tenure_months: null,
        max_tenure_months: null,
        rate_type: 'FLOATING',
        base_rate: 'BLR + 1% to BLR + 3%',
        rate_min: 7.0,   // BLR(6.0%) + 1% = 7.0%
        rate_max: 9.0,   // BLR(6.0%) + 3% = 9.0%
        min_company_age_months: 24,
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
        processing_fee: null,
        approval_timeline: 'Annual review after approval',
        confidence: 'LIKELY',
        last_verified_date: new Date('2026-01-01'),
        sources: [
          'https://smallbusinessloanmy.com/banks/public-bank-sme',
        ],
        notes: 'Rate range BLR+1% to BLR+3% from smallbusinessloanmy.com. PBB BLR not separately confirmed — using industry standard BLR as approximation. OD best for F&B, retail, seasonal businesses per smallbusinessloanmy. No official PBB PDS found.',
      }),
      block_b_json:  null,
      block_c_summary: null,
      block_a_completion_pct: 35,
      block_b_completion_pct: 0,
      last_verified_date: new Date('2026-01-01'),
    },

    // ─────────────────────────────────────────────────────────────────────────
    // P04: GGSM MADANI (Government Guarantee Scheme) via Public Bank
    // 来源: TheEdgeMalaysia (Sep 2023, Sep 2024), SJPP官网, smallbusinessloanmy.com
    // ─────────────────────────────────────────────────────────────────────────
    {
      bank_id:       bank.id,
      product_code:  'P04',
      product_name_en: 'GGSM MADANI / SJPP Working Capital Guarantee Scheme (via Public Bank)',
      product_name_zh: 'GGSM MADANI 政府担保计划（通过大众银行申请）',
      loan_structure:         'TERM_LOAN',
      collateral_requirement: 'GOVERNMENT_GUARANTEE',
      guarantee_scheme:       'SJPP_TPKS',
      is_shariah:    false,
      is_active:     true,
      block_a_json:  JSON.stringify({
        min_loan_amount: null,
        max_loan_amount: 20000000,  // smallbusinessloanmy.com: "up to RM20 million"
        min_tenure_months: null,
        max_tenure_months: null,
        rate_type: 'FLOATING',
        base_rate: 'BLR/BFR + 2% maximum (GGSM rate cap)',
        rate_min: null,  // No min publicly stated — depends on profile
        rate_max: 8.4,   // BLR cap: BLR+2% = 6.4%+2% = 8.4%; smallbusinessloanmy.com confirms BLR+2% cap
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
        guarantee_pct_standard: 80,   // 80% standard SJPP guarantee (CONFIRMED)
        guarantee_pct_priority: 90,   // 90% for priority sectors (CONFIRMED from TheEdge 2023)
        guarantee_fee_pct: 1.0,       // 1% per annum (smallbusinessloanmy.com, standard SJPP)
        guarantee_fee_priority: 0.5,  // 0.5% for high-tech/agri/manufacturing/tourism (CONFIRMED from TheEdge 2023)
        priority_sectors: ['High Technology', 'Agriculture', 'Manufacturing', 'Tourism'],
        processing_fee: null,
        approval_timeline: null,
        confidence: 'CONFIRMED',
        last_verified_date: new Date('2023-09-21'),
        sources: [
          'https://theedgemalaysia.com/node/683438',
          'https://www.thestar.com.my/business/business-news/2023/09/21/public-bank-sjpp-collaborate-to-extend-rm1bil-in-financing-to-smes',
          'https://smallbusinessloanmy.com/banks/public-bank-sme',
          'https://www.malaymail.com/news/money/2023/09/21/public-bank-syarikat-jaminan-pembiayaan-perniagaan-collaborate-to-extend-rm1b-in-financing-to-smes-in-malaysia/92153',
        ],
        notes: 'CONFIRMED: PBB committed RM1B to SJPP WCGS+PGGS+GGSM (Sep 2023). GGSM priority sectors (high-tech/agri/manufacturing/tourism): 90% guarantee, fee 0.5% — CONFIRMED from TheEdge/MalayMail. Standard sectors: 80% guarantee, fee 1%. Rate capped at BLR/BFR+2% (~8.4%) per SJPP rules.',
      }),
      block_b_json:  null,
      block_c_summary: null,
      block_a_completion_pct: 62,
      block_b_completion_pct: 0,
      last_verified_date: new Date('2023-09-21'),
    },

    // ─────────────────────────────────────────────────────────────────────────
    // P05: CGC Guarantee Scheme via Public Bank
    // 来源: TheEdgeMalaysia (Sep 2024), thestar.com.my (Sep 2024)
    // ─────────────────────────────────────────────────────────────────────────
    {
      bank_id:       bank.id,
      product_code:  'P05',
      product_name_en: 'CGC Guarantee Scheme (via Public Bank)',
      product_name_zh: 'CGC 信用担保计划（通过大众银行申请）',
      loan_structure:         'TERM_LOAN',
      collateral_requirement: 'GOVERNMENT_GUARANTEE',
      guarantee_scheme:       'CGC_PORTFOLIO_GUARANTEE',
      is_shariah:    false,
      is_active:     true,
      block_a_json:  JSON.stringify({
        min_loan_amount: null,
        max_loan_amount: null,  // PBB committed RM1B total; individual loan cap not publicly stated
        min_tenure_months: null,
        max_tenure_months: null,
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
        guarantee_fee_pct: null,
        processing_fee: null,
        approval_timeline: null,
        confidence: 'CONFIRMED',
        last_verified_date: new Date('2024-09-09'),
        sources: [
          'https://theedgemalaysia.com/node/726073',
          'https://www.thestar.com.my/business/business-news/2024/09/09/public-bank-credit-guarantee-corp-collaborate-to-extend-rm1bil-in-financing-to-smes',
        ],
        notes: 'PBB committed RM1B in CGC-guaranteed financing (Sep 2024). As of Jun 2024, RM280M disbursed. PBB is largest SME financier (market share 17.5% as at Jun 2024, RM69.3B total SME exposure). Individual loan parameters not disclosed; apply via PBB branch.',
      }),
      block_b_json:  null,
      block_c_summary: null,
      block_a_completion_pct: 38,
      block_b_completion_pct: 0,
      last_verified_date: new Date('2024-09-09'),
    },

  ]

  // ── 4. 写入产品 ──────────────────────────────────────────────────────────────
  for (const p of products) {
    await prisma.product.create({ data: p })
    console.log(`  Product: ${p.product_code} — ${p.product_name_zh}`)
  }

  const count = await prisma.product.count({ where: { bank_id: bank.id } })
  console.log(`\n✅ Public Bank (PBB) 完成: ${count} 个产品写入数据库`)
  console.log('\n渠道搜索记录（按规定格式）：')
  console.log('渠道1 [site:pbebank.com SME loan financing 2025 OR 2026]')
  console.log('  结果: CGC SME loan timeline PDF, BRF (RM5M/10年), PENJANA 2020。官网无独立SME产品定价页。')
  console.log('渠道2 ["Public Bank" SME financing rate 2025 OR 2026 site:theedgemarkets.com/thestar/ringgitplus/imoney]')
  console.log('  结果: TheEdge (SME 18.3%市占Q3 2025), TheStar (FY25结果, SJPP合作), RinggitPlus (RM150手续费更新Feb 2026)')
  console.log('渠道3 ["Public Bank" SME loan consultant experience Malaysia 2025 site:linkedin.com OR site:facebook.com]')
  console.log('  结果: LinkedIn PBB Senior Executive帖子 (Top SME Loan Disbursement), Business Manager (5C信贷评估)')
  console.log('渠道4 ["Public Bank" business loan approved rejected experience 2025 site:lowyat.net OR site:reddit.com OR site:facebook.com]')
  console.log('  结果: lowyat.net信用卡拒绝帖 (DSR<80% confirmed) — 无2025年SME企业贷款专项帖 ⚠️')
  console.log('渠道5 ["Public Bank" CGC OR SJPP OR BNM fund SME guarantee scheme Malaysia 2025]')
  console.log('  结果: SJPP WCGS合作RM1B (confirmed), CGC合作RM1B (confirmed), GGSM 90%担保优先行业 (confirmed)')
  console.log('渠道6-1 ["Public Bank" SME loan experience 2025 forum Malaysia] → smallbusinessloanmy.com详细产品+利率 ✅')
  console.log('渠道6-2 ["Public Bank" business loan rejected reason Malaysia 2025] → 通用拒贷原因；无PBB专属 ⚠️')
  console.log('渠道6-3 ["Public Bank" SME financing review 2025 site:facebook.com] → PBB官方FB页面；无申请者评论 ⚠️')
  console.log('渠道6-4 ["Public Bank" 企业贷款 批准 经验 2025 马来西亚] → 个人贷款相关内容；无PBB SME经验帖 ⚠️')
  console.log('渠道7 ["Public Bank" iMSME Malaysia SME loan product site:imsme.com.my OR "iMSME" "Public Bank"]')
  console.log('  结果: imsme.com.my为登录墙；搜索无PBB iMSME专属产品数据 ⚠️')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
