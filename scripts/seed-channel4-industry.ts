/**
 * 渠道4补做 — 马来西亚SME银行业通用经验数据
 * 标注：行业通用，非任何单一银行专属
 *
 * 执行的4条关键词（补做）：
 * 1. Malaysia SME business loan experience 2025 owner approved
 * 2. Malaysia SME loan DSCR cashflow bank requirement real case 2025
 * 3. 马来西亚 中小企业 贷款 批准 经验 银行 2025
 * 4. Malaysia SME loan application tips bank statement ratio 2025
 *
 * 运行: npx tsx scripts/seed-channel4-industry.ts
 */

import { prisma } from '../src/lib/prisma'

async function main() {
  // 以 upsert 方式写入 IndustryInsight 表（若表不存在则以注释记录）
  // 本脚本同时作为数据档案，供其他 seed 脚本引用

  const insights = [

    // ─────────────────────────────────────────────────────────────────────────
    // I01: DSCR目标标准
    // 来源: johorloan.com (2025) "What to Consider Before Taking a Business Loan in Malaysia"
    // 关键词②命中
    // ─────────────────────────────────────────────────────────────────────────
    {
      code:        'CH4-I01',
      category:    'CREDIT_ASSESSMENT',
      title:       'DSCR目标 ≥ 1.2x（马来西亚银行业实战标准）',
      content:     'Target a Debt Service Coverage Ratio (DSCR) ≥ 1.2x。需stress-test for slower sales or delayed receivables。比较EIR不只headline rate；需含所有费用的总还款额。利率须区分固定/浮动（浮动随OPR/BLR/BR变动）。',
      applicability: 'INDUSTRY_GENERAL',
      bank_specific: null,
      source_url:  'https://www.johorloan.com/latestnews/nid/169868/',
      source_type: 'FINANCIAL_MEDIA',
      verified_date: new Date('2025-01-01'),
      confidence:  'CONFIRMED',
    },

    // ─────────────────────────────────────────────────────────────────────────
    // I02: CCRIS审查范围
    // 来源: Alliance Bank Digital SME Express官方FAQ（官方确认）
    // 关键词④命中
    // ─────────────────────────────────────────────────────────────────────────
    {
      code:        'CH4-I02',
      category:    'CREDIT_ASSESSMENT',
      title:       'CCRIS审查过去12个月（官方确认）',
      content:     'Alliance Bank官方FAQ原文："The Bank will look at past 12 months records."（CCRIS审查过去12个月）。公司若有ongoing restructuring/rescheduling会影响申请。所有公司董事/股东的个人CCRIS同时被审查。UOB亦确认：个人信用与公司信用均影响审批，各银行标准不同。',
      applicability: 'INDUSTRY_GENERAL',
      bank_specific: null,
      source_url:  'https://www.alliancebank.com.my/digital/business-banking/Apply-For-Financing/dsme-express-financing',
      source_type: 'BANK_OFFICIAL',
      verified_date: new Date('2025-01-01'),
      confidence:  'CONFIRMED',
    },

    // ─────────────────────────────────────────────────────────────────────────
    // I03: BNM新政策 — 禁止flat rate/Rule of 78
    // 来源: sparksparkfinance.com citing BNM Policy Document on Personal Financing
    // 关键词③命中
    // 影响: AmBank等使用flat rate的银行SME产品定价透明度
    // ─────────────────────────────────────────────────────────────────────────
    {
      code:        'CH4-I03',
      category:    'REGULATORY',
      title:       'BNM新政策(2025-09-30)：禁止flat rate/Rule of 78个人融资',
      content:     '2025年9月30日起，BNM《Policy Document on Personal Financing》规定：银行不得再使用平息利率（Flat Rate）或Rule of 78计算个人融资利息。只允许固定利率或浮动利率，并必须按剩余本金计息。注意：此政策明确针对"个人融资（Personal Financing）"，SME贷款是否同等适用须向银行确认。AmBank等历史上使用flat rate的银行SME产品定价透明度将受新规影响。',
      applicability: 'INDUSTRY_GENERAL',
      bank_specific: 'Particularly relevant to AmBank (AMB) which historically quotes flat rates for SME products',
      source_url:  'https://sparksparkfinance.com/personal-finance/wealth-management/what-is-personal-loan/',
      source_type: 'FINANCIAL_MEDIA',
      verified_date: new Date('2025-09-30'),
      confidence:  'CONFIRMED',
    },

    // ─────────────────────────────────────────────────────────────────────────
    // I04: 6个月银行流水提升批准率
    // 来源: Maybank官方SME Digital Financing页面原文
    // 关键词④命中
    // ─────────────────────────────────────────────────────────────────────────
    {
      code:        'CH4-I04',
      category:    'APPLICATION_TIPS',
      title:       '提交6个月银行流水可提升批准机会（Maybank官方确认）',
      content:     'Maybank官方SME Digital Financing页面原文："Latest 6 months bank statement (optional but these documents might increase your chances of approval)"。即使不强制要求，主动提交6个月流水可提升批准率。适用于所有银行SME申请。',
      applicability: 'INDUSTRY_GENERAL',
      bank_specific: null,
      source_url:  'https://www.maybank2u.com.my/maybank2u/malaysia/en/business/financing/sme_digital_financing.page',
      source_type: 'BANK_OFFICIAL',
      verified_date: new Date('2025-01-01'),
      confidence:  'CONFIRMED',
    },

    // ─────────────────────────────────────────────────────────────────────────
    // I05: 数字SME贷款快批时效 vs 传统贷款
    // 来源: iMoney.my (Jan 2026)
    // 关键词①命中
    // ─────────────────────────────────────────────────────────────────────────
    {
      code:        'CH4-I05',
      category:    'PROCESS',
      title:       '数字SME贷款快批几小时；传统银行贷款数天至数周',
      content:     'iMoney.my (Jan 2026)："Some digital SME loans or bank fast-track products can be approved in a few hours, while traditional bank loans may take several days to weeks due to credit checks and document reviews." 银行通常审批：1-3年营运历史，稳定现金流，信用记录良好。iMoney另注：提交后银行代表5-7个工作日内联系。',
      applicability: 'INDUSTRY_GENERAL',
      bank_specific: null,
      source_url:  'https://www.imoney.my/business-loan',
      source_type: 'FINANCIAL_MEDIA',
      verified_date: new Date('2026-01-22'),
      confidence:  'LIKELY',
    },

    // ─────────────────────────────────────────────────────────────────────────
    // I06: OCBC BLR参考（各银行BLR不同）
    // 来源: OCBC官网（15 July 2025）
    // 关键词④命中（补充BLR参考表）
    // ─────────────────────────────────────────────────────────────────────────
    {
      code:        'CH4-I06',
      category:    'RATES_REFERENCE',
      title:       'OCBC BLR = 6.51% p.a.（15 July 2025起）',
      content:     'OCBC Malaysia官网："The current Base Lending Rate (BLR) effective from 15 July 2025 is 6.51% p.a." 各银行BLR不同（RHB 6.45%，HLB 6.64%，AmBank 6.45%，OCBC 6.51%，Affin BFR 6.56%）。BNM SBR统一为2.75%（14 Jul 2025起）。',
      applicability: 'INDUSTRY_GENERAL',
      bank_specific: 'OCBC',
      source_url:  'https://www.ocbc.com.my/business-banking/smes/loans/financing-to-smes',
      source_type: 'BANK_OFFICIAL',
      verified_date: new Date('2025-07-15'),
      confidence:  'CONFIRMED',
    },

    // ─────────────────────────────────────────────────────────────────────────
    // I07: 现金流信贷审批学术研究（马来西亚MSME）
    // 来源: arXiv 2510.16066（Oct-Dec 2025）
    // 关键词②命中
    // ─────────────────────────────────────────────────────────────────────────
    {
      code:        'CH4-I07',
      category:    'RESEARCH',
      title:       '马来西亚MSME银行流水数据现金流信贷审批模型（arXiv 2025）',
      content:     'arXiv论文 2510.16066 "Cash Flow Underwriting with Bank Transaction Data: Advancing MSME Financial Inclusion in Malaysia"（Oct 17, 2025，更新至Dec 23, 2025）。研究以银行流水数据做现金流信贷模型，支持马来西亚MSME金融包容性。验证了银行流水分析在SME贷款审批中的实际应用价值。',
      applicability: 'INDUSTRY_GENERAL',
      bank_specific: null,
      source_url:  'https://arxiv.org/abs/2510.16066',
      source_type: 'ACADEMIC',
      verified_date: new Date('2025-12-23'),
      confidence:  'CONFIRMED',
    },

  ]

  console.log('渠道4补做 — 行业通用数据写入')
  console.log('='.repeat(60))

  // 尝试写入 IndustryInsight 表；若表不存在则直接打印并存档
  let tableExists = false
  try {
    // @ts-ignore — 表可能未在schema中
    await (prisma as any).industryInsight.count()
    tableExists = true
  } catch {
    tableExists = false
  }

  if (tableExists) {
    for (const insight of insights) {
      // @ts-ignore
      await (prisma as any).industryInsight.upsert({
        where:  { code: insight.code },
        update: insight,
        create: insight,
      })
      console.log(`  ✅ ${insight.code}: ${insight.title}`)
    }
  } else {
    console.log('  ℹ️  IndustryInsight表未在schema中，以文字档案形式存档于本脚本注释')
    console.log('     可在需要时添加该表到 Prisma schema 后重新执行')
    console.log('')
    for (const insight of insights) {
      console.log(`  📌 ${insight.code} [${insight.category}] — ${insight.confidence}`)
      console.log(`     ${insight.title}`)
      console.log(`     来源: ${insight.source_url}`)
      console.log(`     适用: ${insight.applicability}${insight.bank_specific ? ' | 特别关联: ' + insight.bank_specific : ''}`)
      console.log('')
    }
  }

  console.log('='.repeat(60))
  console.log('渠道4补做完成。7条行业通用数据：')
  console.log('I01 DSCR ≥ 1.2x目标 (johorloan.com 2025) ✅')
  console.log('I02 CCRIS审查过去12个月 (Alliance Bank官方FAQ) ✅')
  console.log('I03 BNM禁止flat rate/Rule of 78 (2025-09-30) ✅')
  console.log('I04 6个月流水提升批准率 (Maybank官方) ✅')
  console.log('I05 数字SME快批几小时 vs 传统数天至数周 (iMoney Jan 2026) ✅')
  console.log('I06 OCBC BLR=6.51% + 各银行BLR汇总 (OCBC官网 Jul 2025) ✅')
  console.log('I07 现金流信贷审批学术研究 (arXiv Oct-Dec 2025) ✅')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
