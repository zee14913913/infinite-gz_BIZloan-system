import Link from 'next/link'
import { Suspense } from 'react'
import { prisma } from '@/lib/prisma'
import { CasesFilterBar } from '@/components/cases/CasesFilterBar'
import type { Urgency } from '@/generated/prisma/client'

const STATUS_BADGE: Record<string, string> = {
  INTAKE:'badge-todo', ANALYSIS:'badge-todo', ADVISOR_REVIEW:'badge-conflict',
  STRUCTURE_READY:'badge-confirmed', SUBMISSION:'badge-confirmed', PENDING_BANK:'badge-conflict',
  APPROVED:'badge-confirmed', REJECTED:'badge-missing', DISBURSED:'badge-confirmed', CLOSED:'badge-missing',
}
const STATUS_ZH: Record<string, string> = {
  INTAKE:'接案中', ANALYSIS:'分析中', ADVISOR_REVIEW:'顾问审核',
  STRUCTURE_READY:'方案已定', SUBMISSION:'提交中', PENDING_BANK:'等待银行',
  APPROVED:'已批准', REJECTED:'被拒绝', DISBURSED:'已放款', CLOSED:'已结案',
}
const PURPOSE_ZH: Record<string, string> = {
  WORKING_CAPITAL:'营运资金', PROPERTY_PURCHASE:'物业购置', EQUIPMENT_MACHINERY:'设备/机械',
  BUSINESS_EXPANSION:'业务扩张', DEBT_REFINANCING:'债务重组', TRADE_FINANCING:'贸易融资',
  PROJECT_FINANCING:'项目融资', OTHER:'其他',
}
const SCORE_BADGE: Record<string, string> = {
  HIGH:'badge-confirmed', MEDIUM:'badge-todo', LOW:'badge-conflict', INELIGIBLE:'badge-missing',
}
const SCORE_ZH: Record<string, string> = { HIGH:'高', MEDIUM:'中', LOW:'低', INELIGIBLE:'不符' }

type PageProps = { searchParams: Promise<Record<string, string>> }

export default async function CasesPage({ searchParams }: PageProps) {
  const sp      = await searchParams
  const status  = sp.status  || null
  const advisor = sp.advisor || null
  const urgency = sp.urgency || null
  const now     = new Date()
  const dueSoon = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  const [cases, advisors] = await Promise.all([
    prisma.case.findMany({
      where: {
        // Default: show only active (non-closed) cases. Advisor can explicitly select
        // CLOSED or REJECTED from the filter dropdown to override this default.
        ...(status
          ? { status }
          : { status: { notIn: ['CLOSED', 'REJECTED', 'DISBURSED'] } }
        ),
        ...(advisor && { advisor_id: advisor }),
        ...(urgency && { urgency: urgency as Urgency }),
      },
      include: {
        client: { select: { company_name: true } },
        matching_results: {
          select: { overall_score: true },
          orderBy: { calculated_at: 'desc' },
          take: 1,
        },
      },
      orderBy: { updated_at: 'desc' },
      take: 100,
    }),
    prisma.user.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
  ])

  return (
    <div className="page-content">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0 }}>案件管理</h2>
          <p style={{ color: 'var(--color-text-muted)', margin: '4px 0 0', fontSize: 14 }}>
            共 {cases.length} 个案件{status ? ` · 筛选：${STATUS_ZH[status] ?? status}` : ''}
          </p>
        </div>
        <Link href="/cases/new" className="btn btn-primary" style={{ fontSize: 13, minHeight: 40, padding: '10px 22px' }}>
          + 新建案件
        </Link>
      </div>

      <Suspense>
        <CasesFilterBar advisors={advisors} />
      </Suspense>

      <div className="table-scroll-wrap">
        <table>
          <thead>
            <tr>
              <th>案件编号</th><th>客户名称</th><th>用途</th><th>申请额（RM）</th>
              <th>状态</th><th>最佳匹配</th><th>跟进日期</th><th>最后更新</th><th>操作</th>
            </tr>
          </thead>
          <tbody>
            {cases.length === 0 && (
              <tr><td colSpan={9} style={{ textAlign:'center', color:'var(--color-text-muted)', padding: 32 }}>暂无案件</td></tr>
            )}
            {cases.map(c => {
              const followUp    = c.follow_up_date
              const isOverdue   = followUp && followUp < now
              const isDueSoon   = followUp && followUp >= now && followUp <= dueSoon
              const followUpStyle = isOverdue ? 'var(--color-status-alert)' : isDueSoon ? 'var(--color-status-pending)' : undefined
              const bestScore   = c.matching_results[0]?.overall_score ?? null
              return (
                <tr key={c.id}>
                  <td><span style={{ fontFamily:'var(--font-playfair)', fontWeight:600, fontSize:13 }}>{c.case_reference}</span></td>
                  <td style={{ fontWeight: 500 }}>{c.client.company_name}</td>
                  <td><span className="status-badge badge-todo" style={{ fontSize:11 }}>{PURPOSE_ZH[c.purpose] ?? c.purpose}</span></td>
                  <td className="amount-neutral">RM {c.requested_amount.toLocaleString()}</td>
                  <td><span className={`status-badge ${STATUS_BADGE[c.status] ?? 'badge-missing'}`}>{STATUS_ZH[c.status] ?? c.status}</span></td>
                  <td>
                    {bestScore
                      ? <span className={`status-badge ${SCORE_BADGE[bestScore] ?? 'badge-missing'}`} style={{ fontSize:11 }}>{SCORE_ZH[bestScore]}</span>
                      : <span style={{ color:'var(--color-text-muted)', fontSize:12 }}>未跑</span>}
                  </td>
                  <td style={{ color: followUpStyle, fontWeight: isOverdue ? 600 : undefined }}>
                    {followUp
                      ? <>{followUp.toLocaleDateString('zh-MY')}{isOverdue && ' ⚠'}</>
                      : <span style={{ color:'var(--color-text-muted)' }}>—</span>}
                  </td>
                  <td style={{ color:'var(--color-text-muted)', fontSize:13 }}>{c.updated_at.toLocaleDateString('zh-MY')}</td>
                  <td><Link href={`/cases/${c.id}`} className="btn-table-action">查看</Link></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
