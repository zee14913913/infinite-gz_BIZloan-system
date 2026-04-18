/**
 * Seeds the 11 new bank/institution records from the iMSME list.
 * Skips any that already exist (upsert on code).
 * Run via: npx tsx scripts/seed-new-banks.ts
 */

import { prisma } from '../src/lib/prisma'

const NEW_BANKS = [
  {
    code: 'BKRAKYAT',
    name_en: 'Bank Rakyat',
    name_zh: '人民银行',
    name_bm: 'Bank Rakyat',
    type: 'ISLAMIC_BANK',
    is_shariah_compliant: true,
    official_website: 'https://www.bankrakyat.com.my',
    cgc_partner: false,
    sjpp_partner: false,
    bnm_fund_partner: false,
  },
  {
    code: 'MUAMALAT',
    name_en: 'Bank Muamalat Malaysia Berhad',
    name_zh: '沐阿玛拉银行',
    name_bm: 'Bank Muamalat Malaysia Berhad',
    type: 'ISLAMIC_BANK',
    is_shariah_compliant: true,
    official_website: 'https://www.muamalat.com.my',
    cgc_partner: true,
    sjpp_partner: false,
    bnm_fund_partner: false,
  },
  {
    code: 'BOOST',
    name_en: 'Boost Bank',
    name_zh: 'Boost银行',
    name_bm: 'Boost Bank',
    type: 'COMMERCIAL_BANK',
    is_shariah_compliant: false,
    official_website: 'https://www.boostbank.my',
    cgc_partner: false,
    sjpp_partner: false,
    bnm_fund_partner: false,
  },
  {
    code: 'GXB',
    name_en: 'GXBank',
    name_zh: 'GX银行',
    name_bm: 'GXBank',
    type: 'COMMERCIAL_BANK',
    is_shariah_compliant: false,
    official_website: 'https://www.gxbank.my',
    cgc_partner: false,
    sjpp_partner: false,
    bnm_fund_partner: false,
  },
  {
    code: 'FS',
    name_en: 'Funding Societies',
    name_zh: 'Funding Societies',
    name_bm: 'Funding Societies',
    type: 'P2P_PLATFORM',
    is_shariah_compliant: false,
    official_website: 'https://fundingsocieties.com.my',
    cgc_partner: false,
    sjpp_partner: false,
    bnm_fund_partner: false,
  },
  {
    code: 'TEKUN',
    name_en: 'TEKUN Nasional',
    name_zh: 'TEKUN',
    name_bm: 'TEKUN Nasional',
    type: 'DFI',
    is_shariah_compliant: true,
    official_website: 'https://www.tekun.gov.my',
    cgc_partner: false,
    sjpp_partner: false,
    bnm_fund_partner: false,
  },
  {
    code: 'AIM',
    name_en: 'Amanah Ikhtiar Malaysia',
    name_zh: 'AIM',
    name_bm: 'Amanah Ikhtiar Malaysia',
    type: 'DFI',
    is_shariah_compliant: true,
    official_website: 'https://aim.gov.my',
    cgc_partner: false,
    sjpp_partner: false,
    bnm_fund_partner: false,
  },
  {
    code: 'PUNB',
    name_en: 'Perbadanan Usahawan Nasional Berhad',
    name_zh: 'PUNB',
    name_bm: 'PUNB',
    type: 'DFI',
    is_shariah_compliant: true,
    official_website: 'https://www.punb.com.my',
    cgc_partner: false,
    sjpp_partner: false,
    bnm_fund_partner: false,
  },
  {
    code: 'FAMA',
    name_en: 'FAMA',
    name_zh: 'FAMA',
    name_bm: 'Lembaga Pemasaran Pertanian Persekutuan',
    type: 'DFI',
    is_shariah_compliant: false,
    official_website: 'https://www.fama.gov.my',
    cgc_partner: false,
    sjpp_partner: false,
    bnm_fund_partner: false,
  },
  {
    code: 'KFH',
    name_en: 'Kuwait Finance House Malaysia Berhad',
    name_zh: '科威特金融之家',
    name_bm: 'Kuwait Finance House Malaysia',
    type: 'ISLAMIC_BANK',
    is_shariah_compliant: true,
    official_website: 'https://www.kfh.com.my/malaysia',
    cgc_partner: false,
    sjpp_partner: false,
    bnm_fund_partner: false,
  },
  {
    code: 'BNM',
    name_en: 'Bank Negara Malaysia',
    name_zh: '马来西亚国家银行',
    name_bm: 'Bank Negara Malaysia',
    type: 'BNM_FUND',
    is_shariah_compliant: false,
    official_website: 'https://bnm.gov.my/funds4sme',
    cgc_partner: false,
    sjpp_partner: false,
    bnm_fund_partner: false,
  },
] as const

async function main() {
  console.log('Seeding new banks...\n')

  for (const bank of NEW_BANKS) {
    const result = await prisma.bank.upsert({
      where:  { code: bank.code },
      update: {},   // skip update if already exists
      create: bank as Parameters<typeof prisma.bank.create>[0]['data'],
    })
    const existing = result.created_at.getTime() === result.updated_at.getTime()
      ? false : true
    console.log(`  ${result.code.padEnd(10)} ${result.name_en}`)
  }

  const total = await prisma.bank.count()
  console.log(`\nDone. Total banks in DB: ${total}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
