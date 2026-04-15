import 'dotenv/config'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import { PrismaClient, InstitutionType } from '../src/generated/prisma/client'
import bcrypt from 'bcryptjs'

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? 'file:./prisma/dev.db',
})
const prisma = new PrismaClient({ adapter })

// ── Bank seed data ────────────────────────────────────────────────────────────
// Values sourced from Corporate-Loan_Assessment.md Appendix A
// type field uses InstitutionType enum (exact values from spec)

const BANKS_SEED = [
  { code: 'MBB',      name_en: 'Maybank',                                name_zh: '马来亚银行',       name_bm: 'Maybank',                      type: InstitutionType.COMMERCIAL_BANK,  is_shariah_compliant: false, official_website: 'https://www.maybank2u.com.my',    sme_portal_url: 'https://business.maybank2u.com.my', cgc_partner: true,  sjpp_partner: true,  bnm_fund_partner: true,  personal_dsr_low_threshold: 40,   personal_dsr_high_threshold: 70,   personal_income_cutoff: 3500,  personal_min_ctos: 620, personal_approval_rate_pct: 52 },
  { code: 'CIMB',     name_en: 'CIMB Bank',                              name_zh: '联昌国际银行',     name_bm: 'CIMB Bank',                    type: InstitutionType.COMMERCIAL_BANK,  is_shariah_compliant: false, official_website: 'https://www.cimb.com.my',         sme_portal_url: 'https://www.cimb.com.my/sme',       cgc_partner: true,  sjpp_partner: true,  bnm_fund_partner: true,  personal_dsr_low_threshold: 65,   personal_dsr_high_threshold: 75,   personal_income_cutoff: 3000,  personal_min_ctos: 615, personal_approval_rate_pct: 51 },
  { code: 'PBB',      name_en: 'Public Bank',                            name_zh: '大众银行',         name_bm: 'Public Bank',                  type: InstitutionType.COMMERCIAL_BANK,  is_shariah_compliant: false, official_website: 'https://www.pbebank.com',          sme_portal_url: null,                                cgc_partner: true,  sjpp_partner: false, bnm_fund_partner: true,  personal_dsr_low_threshold: 55,   personal_dsr_high_threshold: 60,   personal_income_cutoff: 3000,  personal_min_ctos: 620, personal_approval_rate_pct: 57 },
  { code: 'HLB',      name_en: 'Hong Leong Bank',                        name_zh: '丰隆银行',         name_bm: 'Hong Leong Bank',              type: InstitutionType.COMMERCIAL_BANK,  is_shariah_compliant: false, official_website: 'https://www.hlb.com.my',           sme_portal_url: 'https://www.hlb.com.my/sme',        cgc_partner: true,  sjpp_partner: true,  bnm_fund_partner: true,  personal_dsr_low_threshold: 60,   personal_dsr_high_threshold: 80,   personal_income_cutoff: 3000,  personal_min_ctos: 610, personal_approval_rate_pct: 54 },
  { code: 'RHB',      name_en: 'RHB Bank',                               name_zh: 'RHB银行',          name_bm: 'RHB Bank',                     type: InstitutionType.COMMERCIAL_BANK,  is_shariah_compliant: false, official_website: 'https://www.rhbbank.com.my',       sme_portal_url: 'https://www.rhbbank.com.my/sme',    cgc_partner: true,  sjpp_partner: true,  bnm_fund_partner: true,  personal_dsr_low_threshold: 55,   personal_dsr_high_threshold: 60,   personal_income_cutoff: 2205,  personal_min_ctos: 600, personal_approval_rate_pct: 60 },
  { code: 'AMB',      name_en: 'AmBank',                                 name_zh: '安联银行',         name_bm: 'AmBank',                       type: InstitutionType.COMMERCIAL_BANK,  is_shariah_compliant: false, official_website: 'https://www.ambankgroup.com',      sme_portal_url: null,                                cgc_partner: true,  sjpp_partner: false, bnm_fund_partner: true,  personal_dsr_low_threshold: 60,   personal_dsr_high_threshold: 65,   personal_income_cutoff: 10000, personal_min_ctos: 605, personal_approval_rate_pct: 58 },
  { code: 'AFFIN',    name_en: 'Affin Bank',                             name_zh: '艾芬银行',         name_bm: 'Affin Bank',                   type: InstitutionType.COMMERCIAL_BANK,  is_shariah_compliant: false, official_website: 'https://www.affinbank.com.my',     sme_portal_url: null,                                cgc_partner: true,  sjpp_partner: true,  bnm_fund_partner: false, personal_dsr_low_threshold: 60,   personal_dsr_high_threshold: 80,   personal_income_cutoff: 5000,  personal_min_ctos: 600, personal_approval_rate_pct: 65 },
  { code: 'ABB',      name_en: 'Alliance Bank',                          name_zh: '联盟银行',         name_bm: 'Alliance Bank',                type: InstitutionType.COMMERCIAL_BANK,  is_shariah_compliant: false, official_website: 'https://www.alliancebank.com.my',  sme_portal_url: null,                                cgc_partner: true,  sjpp_partner: false, bnm_fund_partner: true,  personal_dsr_low_threshold: 65,   personal_dsr_high_threshold: 68,   personal_income_cutoff: null,  personal_min_ctos: 600, personal_approval_rate_pct: 62 },
  { code: 'OCBC',     name_en: 'OCBC Bank',                              name_zh: '华侨银行',         name_bm: 'OCBC Bank',                    type: InstitutionType.COMMERCIAL_BANK,  is_shariah_compliant: false, official_website: 'https://www.ocbc.com.my',          sme_portal_url: null,                                cgc_partner: false, sjpp_partner: false, bnm_fund_partner: false, personal_dsr_low_threshold: 55,   personal_dsr_high_threshold: 60,   personal_income_cutoff: 5000,  personal_min_ctos: 640, personal_approval_rate_pct: 40 },
  { code: 'UOB',      name_en: 'UOB Bank',                               name_zh: '大华银行',         name_bm: 'UOB Bank',                     type: InstitutionType.COMMERCIAL_BANK,  is_shariah_compliant: false, official_website: 'https://www.uob.com.my',           sme_portal_url: null,                                cgc_partner: true,  sjpp_partner: false, bnm_fund_partner: false, personal_dsr_low_threshold: 55,   personal_dsr_high_threshold: 60,   personal_income_cutoff: 3000,  personal_min_ctos: 630, personal_approval_rate_pct: 48 },
  { code: 'HSBC',     name_en: 'HSBC Malaysia',                          name_zh: '汇丰银行马来西亚', name_bm: 'HSBC Malaysia',                type: InstitutionType.COMMERCIAL_BANK,  is_shariah_compliant: false, official_website: 'https://www.hsbc.com.my',          sme_portal_url: null,                                cgc_partner: false, sjpp_partner: false, bnm_fund_partner: false, personal_dsr_low_threshold: 60,   personal_dsr_high_threshold: 70,   personal_income_cutoff: 3000,  personal_min_ctos: 680, personal_approval_rate_pct: 28 },
  { code: 'SCB',      name_en: 'Standard Chartered',                     name_zh: '渣打银行',         name_bm: 'Standard Chartered',           type: InstitutionType.COMMERCIAL_BANK,  is_shariah_compliant: false, official_website: 'https://www.sc.com/my',            sme_portal_url: null,                                cgc_partner: false, sjpp_partner: false, bnm_fund_partner: false, personal_dsr_low_threshold: 60,   personal_dsr_high_threshold: 65,   personal_income_cutoff: 3000,  personal_min_ctos: 680, personal_approval_rate_pct: 32 },
  { code: 'BSN',      name_en: 'Bank Simpanan Nasional',                 name_zh: '国家储蓄银行',     name_bm: 'Bank Simpanan Nasional',       type: InstitutionType.COMMERCIAL_BANK,  is_shariah_compliant: false, official_website: 'https://www.bsn.com.my',           sme_portal_url: null,                                cgc_partner: true,  sjpp_partner: false, bnm_fund_partner: true,  personal_dsr_low_threshold: 60,   personal_dsr_high_threshold: 75,   personal_income_cutoff: 3000,  personal_min_ctos: 580, personal_approval_rate_pct: 75 },
  { code: 'BIMB',     name_en: 'Bank Islam',                             name_zh: '伊斯兰银行',       name_bm: 'Bank Islam',                   type: InstitutionType.ISLAMIC_BANK,     is_shariah_compliant: true,  official_website: 'https://www.bankislam.com',        sme_portal_url: null,                                cgc_partner: true,  sjpp_partner: true,  bnm_fund_partner: true,  personal_dsr_low_threshold: 60,   personal_dsr_high_threshold: 70,   personal_income_cutoff: 3000,  personal_min_ctos: 600, personal_approval_rate_pct: 55 },
  { code: 'SMEBANK',  name_en: 'SME Bank',                               name_zh: 'SME银行',          name_bm: 'SME Bank',                     type: InstitutionType.DFI,              is_shariah_compliant: false, official_website: 'https://www.smebank.com.my',       sme_portal_url: null,                                cgc_partner: false, sjpp_partner: true,  bnm_fund_partner: true,  personal_dsr_low_threshold: null, personal_dsr_high_threshold: null, personal_income_cutoff: null,  personal_min_ctos: null, personal_approval_rate_pct: null },
  { code: 'MBSB',     name_en: 'MBSB Bank',                              name_zh: 'MBSB银行',         name_bm: 'MBSB Bank',                    type: InstitutionType.DFI,              is_shariah_compliant: true,  official_website: 'https://www.mbsb.com.my',          sme_portal_url: null,                                cgc_partner: true,  sjpp_partner: false, bnm_fund_partner: true,  personal_dsr_low_threshold: 60,   personal_dsr_high_threshold: 70,   personal_income_cutoff: 3000,  personal_min_ctos: 600, personal_approval_rate_pct: 68 },
  { code: 'AGROBANK', name_en: 'Agrobank',                               name_zh: '农业银行',         name_bm: 'Agrobank',                     type: InstitutionType.DFI,              is_shariah_compliant: false, official_website: 'https://www.agrobank.com.my',      sme_portal_url: null,                                cgc_partner: false, sjpp_partner: false, bnm_fund_partner: true,  personal_dsr_low_threshold: null, personal_dsr_high_threshold: null, personal_income_cutoff: null,  personal_min_ctos: null, personal_approval_rate_pct: null },
  { code: 'EXIM',     name_en: 'EXIM Bank Malaysia',                     name_zh: 'EXIM银行',         name_bm: 'Bank Exim Malaysia',           type: InstitutionType.DFI,              is_shariah_compliant: false, official_website: 'https://www.exim.com.my',          sme_portal_url: null,                                cgc_partner: false, sjpp_partner: false, bnm_fund_partner: false, personal_dsr_low_threshold: null, personal_dsr_high_threshold: null, personal_income_cutoff: null,  personal_min_ctos: null, personal_approval_rate_pct: null },
  { code: 'CGC',      name_en: 'Credit Guarantee Corporation',           name_zh: '信用担保机构',     name_bm: 'Perbadanan Jaminan Kredit',    type: InstitutionType.GUARANTEE_AGENCY, is_shariah_compliant: false, official_website: 'https://www.cgc.com.my',           sme_portal_url: null,                                cgc_partner: false, sjpp_partner: false, bnm_fund_partner: false, personal_dsr_low_threshold: null, personal_dsr_high_threshold: null, personal_income_cutoff: null,  personal_min_ctos: null, personal_approval_rate_pct: null },
  { code: 'SJPP',     name_en: 'Syarikat Jaminan Pembiayaan Perniagaan', name_zh: 'SJPP担保机构',     name_bm: 'Syarikat Jaminan Pembiayaan',  type: InstitutionType.GUARANTEE_AGENCY, is_shariah_compliant: false, official_website: 'https://www.sjpp.com.my',          sme_portal_url: null,                                cgc_partner: false, sjpp_partner: false, bnm_fund_partner: false, personal_dsr_low_threshold: null, personal_dsr_high_threshold: null, personal_income_cutoff: null,  personal_min_ctos: null, personal_approval_rate_pct: null },
]

// ── User seed data ────────────────────────────────────────────────────────────
// Source: Corporate-Loan_Assessment.md Appendix B

const USERS_SEED = [
  { email: 'admin@infinitegz.my',   name: 'Super Admin',    role: 'SUPER_ADMIN',    password: 'Admin@2026!' },
  { email: 'senior@infinitegz.my',  name: 'Senior Advisor', role: 'SENIOR_ADVISOR', password: 'Senior@2026!' },
  { email: 'advisor@infinitegz.my', name: 'Advisor 1',      role: 'ADVISOR',        password: 'Advisor@2026!' },
]

async function seedBanks() {
  console.log('🏦 Seeding banks...')
  for (const bank of BANKS_SEED) {
    await prisma.bank.upsert({
      where:  { code: bank.code },
      update: bank,
      create: bank,
    })
    console.log(`  ✓ ${bank.code} — ${bank.name_zh} [${bank.type}]`)
  }
  console.log(`  → ${BANKS_SEED.length} banks seeded\n`)
}

async function seedUsers() {
  console.log('👤 Seeding users...')
  for (const u of USERS_SEED) {
    const hash = await bcrypt.hash(u.password, 12)
    await prisma.user.upsert({
      where:  { email: u.email },
      update: { name: u.name, role: u.role as any, password: hash },
      create: { email: u.email, name: u.name, role: u.role as any, password: hash },
    })
    console.log(`  ✓ ${u.email} [${u.role}]`)
  }
  console.log(`  → 3 users seeded\n`)
}

async function main() {
  await seedBanks()
  await seedUsers()
  console.log('✅ Seed complete.')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
