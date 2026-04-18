/**
 * Affin Bank Berhad (AFFIN) — SME产品数据种子
 * Priority 7
 * 7大渠道执行记录：
 *
 * 渠道1 [site:affinalways.com SME loan financing + PDS fetch]
 *   ✅ Tawarruq Term Financing-i PDS (Oct 1, 2025): BFR=6.56%，Ceiling Rate 12%
 *   ✅ SMEmerge/SMEmerge-i官网: RM300K，12-24个月营运，SJPP 70%担保，无担保，6个月流水
 *   ✅ AFFINGEM/-i官网: RM1M无抵押（初创RM300K），BFR+0.50%起，女性企业主（51%+）
 *   ✅ GGSM3官网: 营运≥3年，SJPP担保，全经济领域
 *   ✅ 产品线确认: WC/CAPEX TL/OD/Trade，SME Property Financing，SJPP/CGC/BNM/Green全线
 *   ✅ Affin SBR=2.75%（baserate.my + affinalways.com确认）
 *
 * 渠道2 ["Affin Bank" SME loan 2025/2026 TheStar/TheEdge/SmallBusinessLoanMY]
 *   ✅ businesstoday.my (2023): WC/CAPEX TL/OD/Trade产品线（Tawarruq/Murabahah等）
 *   ✅ Malay Mail (Aug 2022): BizDana/-i RM100K-RM400K，6-36个月，CGC 70%，无抵押
 *   ✅ DayakDaily (Aug 25, 2025): Affin+CGC RM500M MoU，Sarawak年增长50%，Kuching 13th分行
 *   ✅ iMoney (May 2025): SMEmerge-i 无担保需保人，批准5-7工作日
 *   ⚠️ SmallBusinessLoanMY: 无Affin Bank专属页面
 *
 * 渠道3 ["Affin Bank" SME consultant 2025 LinkedIn/Facebook]
 *   ✅ LinkedIn: Datuk Wan Razly Abdullah (President & Group CEO) — 目标成为SME/初创首选银行
 *   ✅ LinkedIn: Affin Bank公司页面 — SME Colony, SMEssential, AFFIN ASPIRA生态系统
 *   ✅ TheAsianBanker 2021: Affin获颁金融包容奖，26,000+商业账户，9,000+ SME客户
 *
 * 渠道4 行业通用（补做已完成，见 seed-channel4-industry.ts）
 *   ✅ DSCR ≥ 1.2x，CCRIS 12个月，BNM flat rate禁令，6个月流水，iMoney快批
 *
 * 渠道5 ["Affin Bank" CGC SJPP BNM guarantee scheme 2025]
 *   ✅ CGC: Affin+CGC累计担保RM3.75亿（截至Aug 2022），RM500M MoU (Aug 25, 2025) CONFIRMED
 *   ✅ SJPP GGSM3: Affin官网确认参与，营运≥3年 CONFIRMED
 *   ✅ BNM: Affin Islamic参与BNM IA Platform (IAP Integrated) CONFIRMED
 *   ✅ SMEmerge: SJPP 70%担保 CONFIRMED（官网）
 *
 * 渠道6-1 ["Affin Bank" SME loan experience 2025 forum Malaysia]
 *   ⚠️ 无2025年Affin专属SME帖
 *
 * 渠道6-2 ["Affin Bank" business loan rejected reason Malaysia 2025]
 *   ⚠️ 无2025年Affin专属SME拒贷帖
 *
 * 渠道6-3 ["Affin Bank" SME financing review site:facebook.com]
 *   ⚠️ 无有效评论（官方FB帖为CSR/产品推广内容）
 *
 * 渠道6-4 [Affin Bank 企业贷款 批准 经验 马来西亚 2025]
 *   ⚠️ 无2025年中文Affin SME帖
 *
 * 渠道7 ["Affin Bank" iMSME Malaysia]
 *   ⚠️ iMSME为登录墙；无Affin专属iMSME产品数据
 *
 * 运行: npx tsx scripts/seed-affin.ts
 */

import { prisma } from '../src/lib/prisma'

async function main() {
  const bank = await prisma.bank.upsert({
    where:  { code: 'AFFIN' },
    update: {
      sme_portal_url:   'https://www.affinalways.com/en/sme-loans-financing',
      cgc_partner:      true,
      sjpp_partner:     true,
      bnm_fund_partner: true,
    },
    create: {
      code:                 'AFFIN',
      name_en:              'Affin Bank Berhad',
      name_zh:              '盈丰银行',
      name_bm:              'Affin Bank Berhad',
      type:                 'COMMERCIAL_BANK',
      is_shariah_compliant: false,
      official_website:     'https://www.affinalways.com',
      sme_portal_url:       'https://www.affinalways.com/en/sme-loans-financing',
      cgc_partner:          true,
      sjpp_partner:         true,
      bnm_fund_partner:     true,
    },
  })

  console.log(`Bank upserted: ${bank.code} — ${bank.name_en}`)
  await prisma.product.deleteMany({ where: { bank_id: bank.id } })

  const products = [

    // ─────────────────────────────────────────────────────────────────────────
    // P01: Affin SME Working Capital & CAPEX Term Loan/Financing-i（主力产品）
    // ─────────────────────────────────────────────────────────────────────────
    {
      bank_id:                bank.id,
      product_code:           'P01',
      product_name_en:        'Affin SME Working Capital & CAPEX Term Loan / Tawarruq Term Financing-i',
      product_name_zh:        'Affin SME 营运资金与资本开支定期贷款（常规/伊斯兰）',
      loan_structure:         'TERM_LOAN',
      collateral_requirement: 'MIXED',
      guarantee_scheme:       'NONE',
      is_shariah:             false,
      is_active:              true,
      block_a_json: JSON.stringify({
        min_loan_amount:         null,
        max_loan_amount:         null,   // 官网无明确上限；根据项目评估
        min_tenure_months:       null,
        max_tenure_months:       null,
        rate_type:               'FLOATING',
        base_rate:               'BFR-based',
        affin_bfr:               6.56,   // CONFIRMED: Tawarruq Term Financing-i PDS (Oct 1, 2025)
        affin_sbr:               2.75,   // CONFIRMED: baserate.my + affinalways.com
        ceiling_profit_rate:     12.0,   // CONFIRMED: PDS (Oct 2025) "capped at Ceiling Profit Rate of 12%"
        rate_min:                null,
        rate_max:                null,
        rate_note:               'BFR+spread，具体利率未公开。AFFINGEM: BFR+0.50% = 7.06%（特殊计划）。一般商业Term Loan利率待RM评估。',
        facility_types:          ['TERM_LOAN', 'OVERDRAFT', 'TRADE'],
        collateral_types:        ['PROPERTY', 'FIXED_DEPOSIT', 'CASH'],
        eligible_company_types:  ['SOLE_PROPRIETOR', 'PARTNERSHIP', 'LLP', 'SDN_BHD'],
        min_company_age_months:  null,
        eligible_industries:     [],
        excluded_industries:     [],
        min_annual_revenue:      null,
        profit_calculation:      'Monthly rest basis (CONFIRMED from PDS)',
        sources: [
          'https://www.affinalways.com/storage/AffinAlways%20Collaterals/SME%20Collaterals/Loans%20_%20Financing/Term%20Financing-i/Tawarruq-Term-Financing-i-PDS-ENG.pdf',
          'https://www.affinalways.com/en/sme-loans-financing',
        ],
        confidence:            'CONFIRMED',
        last_verified_date:    new Date('2025-10-01'),
        notes:                 'BFR=6.56% + Ceiling 12% CONFIRMED from PDS (Oct 1, 2025). Rate spread undisclosed. Profit on monthly rest CONFIRMED.',
      }),
      block_b_json: JSON.stringify([
        {
          step_order: 1, step_type: 'RM_ASSESSMENT',
          description: 'RM初步接触与预筛',
          typical_duration_days_min: 1, typical_duration_days_max: 3,
          duration_notes: 'Affin ASPIRA提供综合初创/SME生态系统服务。SME Colony数字平台提供资源、市场解决方案和网络支持。',
          responsible_party: 'SME Relationship Manager',
          key_actions: [
            '确认公司营运年限与规模',
            '评估融资目的（WC/CAPEX/物业）',
            '确认马来西亚注册 + 51%马来西亚股权',
            '初步CCRIS/CTOS评估',
          ],
          common_blockers: ['营运年限不足', 'CCRIS逾期'],
          site_visit_threshold: null, credit_committee_threshold: null,
          confidence: 'LIKELY', sources: [],
        },
        {
          step_order: 2, step_type: 'DOCUMENT_COLLECTION',
          description: '文件收集',
          typical_duration_days_min: 1, typical_duration_days_max: 5,
          responsible_party: 'Customer',
          required_documents: [
            'SSM注册文件（Form 9/24/49等）',
            '6个月银行流水（Affin官网均要求6个月）',
            '2年审计账目（标准产品）',
            '所有董事/股东IC',
            '营业场所证明',
            '抵押文件（如有）',
          ],
          common_blockers: ['流水与税务不一致'],
          site_visit_threshold: null, credit_committee_threshold: null,
          confidence: 'CONFIRMED',
          sources: ['https://www.affinalways.com/en/sme-loans-financing'],
          notes: '6个月流水为Affin SME系列产品统一文件要求（SMEmerge/AFFINGEM/GGSM3官网均标注）',
        },
        {
          step_order: 3, step_type: 'CREDIT_SCORING',
          description: '信贷评分与CCRIS查询',
          typical_duration_days_min: 1, typical_duration_days_max: 2,
          responsible_party: 'Credit System',
          key_actions: ['CCRIS 12个月记录审查', 'CTOS查询', '内部信贷模型评分'],
          common_blockers: ['CCRIS有逾期', '现有贷款DSR超限'],
          site_visit_threshold: null, credit_committee_threshold: null,
          confidence: 'LIKELY', sources: [],
        },
        {
          step_order: 4, step_type: 'SITE_VISIT',
          description: 'Site Visit（视情况）',
          typical_duration_days_min: 1, typical_duration_days_max: 5,
          site_visit_threshold: 'MISSING — Affin未公布具体门槛',
          credit_committee_threshold: null,
          responsible_party: 'RM / Valuer',
          key_actions: ['物业担保：委托估价师', 'RM实地业务考察'],
          common_blockers: ['估价低'],
          confidence: 'ESTIMATED', sources: [],
        },
        {
          step_order: 5, step_type: 'CREDIT_COMMITTEE',
          description: '信贷委员会审批',
          typical_duration_days_min: 2, typical_duration_days_max: 7,
          site_visit_threshold: null,
          credit_committee_threshold: 'MISSING — Affin未公开层级门槛',
          responsible_party: 'Credit Committee',
          key_actions: ['按授权层级批核'],
          common_blockers: [],
          confidence: 'ESTIMATED', sources: [],
        },
        {
          step_order: 6, step_type: 'LETTER_OF_OFFER',
          description: 'LO发出',
          typical_duration_days_min: 1, typical_duration_days_max: 3,
          responsible_party: 'Affin Credit',
          key_actions: ['发出正式LO'],
          common_blockers: [], site_visit_threshold: null, credit_committee_threshold: null,
          confidence: 'LIKELY', sources: [],
        },
        {
          step_order: 7, step_type: 'LEGAL_DOCUMENTATION',
          description: '法律文件签署',
          typical_duration_days_min: 3, typical_duration_days_max: 14,
          responsible_party: 'Customer / Panel Solicitor',
          key_actions: ['融资协议', '抵押登记（如有）'],
          common_blockers: [], site_visit_threshold: null, credit_committee_threshold: null,
          confidence: 'LIKELY', sources: [],
        },
        {
          step_order: 8, step_type: 'DISBURSEMENT',
          description: '放款',
          typical_duration_days_min: 1, typical_duration_days_max: 3,
          responsible_party: 'Affin Operations',
          key_actions: ['贷款拨入Affin业务账户'],
          common_blockers: [], site_visit_threshold: null, credit_committee_threshold: null,
          confidence: 'LIKELY', sources: [],
        },
      ]),
      block_c_summary: `【Affin Bank SME — 客户指引】

**银行定位（2025年）**
Affin Bank战略重点：成为马来西亚SME/初创首选银行。CEO Datuk Wan Razly Abdullah领导，提供AFFIN ASPIRA、SME Colony等超越融资的生态系统支持。
- SME贷款Sarawak年增长约50%（CEO Aug 2025确认）
- 与CGC累计担保RM3.75亿（至2022），RM500M新MoU（Aug 25, 2025）
- 特别关注Sabah/Sarawak MSME及东马未开发市场

**利率（来源：Affin官网PDS Oct 2025）**
- BFR = 6.56% p.a.（Oct 1, 2025，CONFIRMED）
- AFFINGEM（女性计划）：BFR+0.50% = 7.06% p.a. 起
- 天花板利率（Ceiling Profit Rate）：12%（浮动利率贷款上限，CONFIRMED）
- 利润按月计算（monthly rest basis，CONFIRMED）

**关键产品一览**
| 产品 | 最高额度 | 资格 | 特色 |
|------|---------|------|------|
| WC/CAPEX TL/OD | 按项目 | 一般SME | 有担保/无担保均可 |
| SMEmerge-i | RM300K | 12-24个月营运 | SJPP 70%担保，无抵押 |
| BizDana-i | RM400K | 6-36个月营运 | CGC 70%担保，无抵押 |
| AFFINGEM/-i | RM1M | 女性51%+持股 | BFR+0.50%起，TL/OD |
| GGSM3（SJPP） | 见SJPP | ≥3年营运 | 政府担保，全经济领域 |
| SME物业融资 | 按项目 | 一般SME | 物业购买/再融资 |

**资格要求（通用）**
- 马来西亚注册，51%马来西亚持股
- 营运年限：视产品而定（SMEmerge 12-24个月，GGSM3≥3年，一般≥2年）
- 文件：6个月银行流水（所有Affin SME产品统一要求）

**独特优势**
- 初创/startup生态最完整（SMEmerge/BizDana/AFFINGEM/AFFIN ASPIRA）
- Sabah/Sarawak重点布局（13th Sarawak分行即将开业）
- 审批5-7工作日（iMoney确认）`,
      block_a_completion_pct: 55,
      block_b_completion_pct: 70,
      last_verified_date: new Date('2025-10-01'),
    },

    // ─────────────────────────────────────────────────────────────────────────
    // P02: SMEmerge / SMEmerge-i（初创营运资金）
    // ─────────────────────────────────────────────────────────────────────────
    {
      bank_id: bank.id, product_code: 'P02',
      product_name_en: 'Affin SMEmerge / SMEmerge-i Start-Up Financing',
      product_name_zh: 'Affin SMEmerge 初创营运资金融资（12-24个月）',
      loan_structure:  'TERM_LOAN',
      collateral_requirement: 'GOVERNMENT_GUARANTEE',
      guarantee_scheme: 'SJPP_TPKS',
      is_shariah: false, is_active: true,
      block_a_json: JSON.stringify({
        min_loan_amount:         null,
        max_loan_amount:         300000,   // CONFIRMED: affinalways.com SMEmerge page
        min_tenure_months:       null,
        max_tenure_months:       84,        // CONFIRMED: affinalways.com: "Up to 84 months"
        rate_type:               'FLOATING',
        rate_min:                null,
        rate_max:                null,
        collateral_required:     false,     // CONFIRMED: "No collaterals required"
        guarantee_coverage:      70,        // CONFIRMED: "70% guarantee coverage from SJPP"
        guarantee_provider:      'SJPP',
        company_age_min_months:  12,        // CONFIRMED: "Business in operation between 12 to 24 months"
        company_age_max_months:  24,
        eligible_company_types:  ['SOLE_PROPRIETOR', 'PARTNERSHIP', 'SDN_BHD'],
        min_malaysian_ownership: 51,
        documents_required:      ['6 months bank statements (CONFIRMED)'],
        facility_type:           'TERM_LOAN',
        sources: [
          'https://www.affinalways.com/en/smemerge-start-up-financing-scheme',
        ],
        confidence: 'CONFIRMED',
        last_verified_date: new Date('2025-01-01'),
        notes: 'RM300K + 84months + no collateral + SJPP 70% + 12-24months operation CONFIRMED from affinalways.com. 6-month bank statement requirement CONFIRMED.',
      }),
      block_b_json: null, block_c_summary: null,
      block_a_completion_pct: 80, block_b_completion_pct: 0,
      last_verified_date: new Date('2025-01-01'),
    },

    // ─────────────────────────────────────────────────────────────────────────
    // P03: BizDana-i（初创营运资金，6-36个月）
    // ─────────────────────────────────────────────────────────────────────────
    {
      bank_id: bank.id, product_code: 'P03',
      product_name_en: 'Affin BizDana / BizDana-i Start-Up Financing (CGC)',
      product_name_zh: 'Affin BizDana 初创融资（CGC 70%担保，6-36个月）',
      loan_structure:  'TERM_LOAN',
      collateral_requirement: 'GOVERNMENT_GUARANTEE',
      guarantee_scheme: 'CGC_PORTFOLIO_GUARANTEE',
      is_shariah: false, is_active: true,
      block_a_json: JSON.stringify({
        min_loan_amount:         100000,   // CONFIRMED: Malay Mail Aug 2022: "RM100,000"
        max_loan_amount:         400000,   // CONFIRMED: Malay Mail Aug 2022: "maximum RM400,000"
        min_tenure_months:       null,
        max_tenure_months:       84,        // Malay Mail 2022: "repayment tenure of up to seven years"
        rate_type:               'FLOATING',
        rate_min:                null,
        rate_max:                null,
        collateral_required:     false,     // CONFIRMED: "no collateral needed"
        guarantee_coverage:      70,        // CONFIRMED: "guarantee coverage of 70 per cent" (CGC)
        guarantee_provider:      'CGC',
        company_age_min_months:  6,         // CONFIRMED: Malay Mail: "six months in operations"
        company_age_max_months:  36,        // CONFIRMED: Malay Mail: "businesses between six and 36 months"
        eligible_company_types:  ['SOLE_PROPRIETOR', 'PARTNERSHIP', 'SDN_BHD'],
        purpose:                 'Working capital',
        total_cgc_guarantee_disbursed: '≥RM375M to Affin Bank (CGC CEO confirmed, Aug 2022)',
        sources: [
          'https://www.malaymail.com/news/money/2022/08/24/affin-bank-credit-guarantee-corp-allocate-rm50m-for-bizdana-i-start-up-financing-scheme/24546',
        ],
        confidence: 'CONFIRMED',
        last_verified_date: new Date('2022-08-24'),
        notes: 'RM100K-RM400K + 6-36 months + CGC 70% + no collateral CONFIRMED from Malay Mail (Aug 2022). Product updated in 2022 from original RM300K cap. BizDana-i page currently unavailable (affinalways.com 503). Status 2025: LIKELY STILL ACTIVE — part of Affin ASPIRA ecosystem.',
      }),
      block_b_json: null, block_c_summary: null,
      block_a_completion_pct: 72, block_b_completion_pct: 0,
      last_verified_date: new Date('2022-08-24'),
    },

    // ─────────────────────────────────────────────────────────────────────────
    // P04: AFFINGEM Financing Scheme/-i（女性企业主）
    // ─────────────────────────────────────────────────────────────────────────
    {
      bank_id: bank.id, product_code: 'P04',
      product_name_en: 'AFFINGEM Financing Scheme / AFFINGEM-i (Women Entrepreneurs)',
      product_name_zh: 'AFFINGEM 女性企业主融资计划',
      loan_structure:  'TERM_LOAN',
      collateral_requirement: 'UNSECURED',
      guarantee_scheme: 'CGC_BIZWANITA',
      is_shariah: false, is_active: true,
      block_a_json: JSON.stringify({
        min_loan_amount:         null,
        max_loan_amount:         1000000,  // CONFIRMED: affinalways.com: "Up to RM1,000,000 collateral-free"
        max_loan_amount_startup: 300000,   // CONFIRMED: "maximum financing for start-up company is up to RM300,000"
        min_tenure_months:       null,
        max_tenure_months:       84,        // CONFIRMED: "Up to seven (7) years or 84 months (TL)"
        rate_type:               'FLOATING',
        base_rate:               'BFR-based',
        rate_spread_min:         0.50,      // CONFIRMED: "As low as BLR/BFR +0.50%"
        rate_min:                7.06,      // BFR(6.56%) + 0.50% = 7.06%
        facility_types:          ['TERM_LOAN', 'OVERDRAFT'],
        collateral_required:     false,     // CONFIRMED: "collateral-free"
        eligible_ownership:      'Women entrepreneurs: Sole Prop owned by Malaysian woman; Partnership/LLP/Sdn Bhd with ≥51% shares held by Malaysian women',
        purpose:                 ['WORKING_CAPITAL', 'CAPEX'],
        documents_required:      ['6 months bank statements'],
        sources: [
          'https://www.affinalways.com/en/affingem-financing-scheme',
        ],
        confidence: 'CONFIRMED',
        last_verified_date: new Date('2025-01-01'),
        notes: 'RM1M collateral-free + BFR+0.50% + 7 years CONFIRMED from affinalways.com. 51% women ownership CONFIRMED. Start-up capped at RM300K CONFIRMED.',
      }),
      block_b_json: null, block_c_summary: null,
      block_a_completion_pct: 82, block_b_completion_pct: 0,
      last_verified_date: new Date('2025-01-01'),
    },

    // ─────────────────────────────────────────────────────────────────────────
    // P05: Affin SJPP GGSM3（政府担保，营运≥3年）
    // ─────────────────────────────────────────────────────────────────────────
    {
      bank_id: bank.id, product_code: 'P05',
      product_name_en: 'Affin SJPP Government Guarantee Scheme MADANI 3 (GGSM3)',
      product_name_zh: 'Affin SJPP 政府担保计划 MADANI 3（营运≥3年）',
      loan_structure:  'TERM_LOAN',
      collateral_requirement: 'GOVERNMENT_GUARANTEE',
      guarantee_scheme: 'SJPP_TPKS',
      is_shariah: false, is_active: true,
      block_a_json: JSON.stringify({
        min_loan_amount:         null,
        max_loan_amount:         null,   // SJPP GGSM3: 最高RM20M（视规模）
        min_tenure_months:       null,
        max_tenure_months:       null,
        rate_type:               'FLOATING',
        rate_min:                null, rate_max: null,
        min_company_age_months:  36,   // CONFIRMED: Affin官网 GGSM3: "minimum 3 years in operation"
        eligible_company_types:  ['SOLE_PROPRIETOR', 'PARTNERSHIP', 'LLP', 'SDN_BHD'],
        eligible_industries:     ['All economic sectors'],
        guarantee_provider:      'SJPP',
        shariah_requirement:     'Islamic financing: Shariah-compliant business only',
        sources: [
          'https://www.affinalways.com/en/government-guarantee-scheme-madani',
          'https://www.sjpp.com.my/schemes/government-guarantee-scheme-madani-ggsm-3',
        ],
        confidence: 'CONFIRMED',
        last_verified_date: new Date('2025-01-01'),
        notes: 'Affin participation in GGSM3 CONFIRMED from affinalways.com. Min 3 years operation CONFIRMED. SJPP GGSM3 focus sectors: all, with special sectors at 80% guarantee.',
      }),
      block_b_json: null, block_c_summary: null,
      block_a_completion_pct: 60, block_b_completion_pct: 0,
      last_verified_date: new Date('2025-01-01'),
    },

    // ─────────────────────────────────────────────────────────────────────────
    // P06: Affin CGC Portfolio Guarantee (RM500M MoU 2025)
    // ─────────────────────────────────────────────────────────────────────────
    {
      bank_id: bank.id, product_code: 'P06',
      product_name_en: 'Affin CGC Portfolio Guarantee (RM500M MoU, Aug 2025)',
      product_name_zh: 'Affin CGC 组合担保（RM5亿MoU，2025年8月）',
      loan_structure:  'TERM_LOAN',
      collateral_requirement: 'GOVERNMENT_GUARANTEE',
      guarantee_scheme: 'CGC_PORTFOLIO_GUARANTEE',
      is_shariah: false, is_active: true,
      block_a_json: JSON.stringify({
        min_loan_amount:         null,
        max_loan_amount:         null,
        mou_total_allocation:    500000000,  // CONFIRMED: RM500M (Bernama Aug 25, 2025)
        mou_date:                '2025-08-25',
        mou_focus:               'MSMEs and MTCs nationally, with special attention on Sabah and Sarawak',
        guarantee_provider:      'CGC',
        historical_cgc_total:    '≥ RM375M disbursed to Affin Bank cumulatively (CGC CEO, Aug 2022)',
        affin_sarawak_growth:    '~50% year-on-year (CEO Wan Razly, Aug 2025)',
        new_sarawak_branch:      '13th branch at Hikmah Exchange, Kuching (announced Aug 2025)',
        eligible_targets:        ['MSME', 'MTC', 'Start-up financing', 'Working capital', 'Sustainable financing'],
        sources: [
          'https://www.bernama.com/en/news.php/?id=2460576',
          'https://dayakdaily.com/sarawak-sabah-smes-can-tap-into-rm500-mln-financing-under-affin-cgc-partnership',
        ],
        confidence: 'CONFIRMED',
        last_verified_date: new Date('2025-08-25'),
        notes: 'RM500M MoU signed Aug 25, 2025 in Kuching. National scope with Sabah/Sarawak emphasis CONFIRMED from Bernama + DayakDaily. Affin Sarawak ~50% YoY growth CONFIRMED from CEO statement.',
      }),
      block_b_json: null, block_c_summary: null,
      block_a_completion_pct: 55, block_b_completion_pct: 0,
      last_verified_date: new Date('2025-08-25'),
    },

  ]

  for (const p of products) {
    await prisma.product.create({ data: p })
    console.log(`  Product: ${p.product_code} — ${p.product_name_zh}`)
  }

  const count = await prisma.product.count({ where: { bank_id: bank.id } })
  console.log(`\n✅ Affin Bank (AFFIN) 完成: ${count} 个产品写入数据库`)
  console.log('\n7大渠道执行汇总：')
  console.log('渠道1 ✅ BFR=6.56%(PDS Oct 2025) + SMEmerge(RM300K/SJPP 70%) + AFFINGEM(RM1M/BFR+0.50%) + GGSM3参与')
  console.log('渠道2 ✅ BizDana RM400K/CGC(MalayMail 2022) + RM500M MoU(DayakDaily Aug 2025) + iMoney 5-7日批准')
  console.log('渠道3 ✅ LinkedIn: CEO + Affin ASPIRA/SME Colony生态系统 + TheAsianBanker 2021')
  console.log('渠道4 ✅ 行业通用数据（已录入 seed-channel4-industry.ts）')
  console.log('渠道5 ✅ CGC RM375M累计+RM500M新MoU + SJPP GGSM3 + BNM IA Platform CONFIRMED')
  console.log('渠道6(1-4) ⚠️ 无2025年Affin专属SME申请经验帖')
  console.log('渠道7 ⚠️ iMSME为登录墙')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
