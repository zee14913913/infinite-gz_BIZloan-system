import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { ACTIVE_CASE_STATUSES } from '@/lib/constants'

const STATUS_BADGE: Record<string, string> = {
  INTAKE:          'badge-todo',
  ANALYSIS:        'badge-todo',
  ADVISOR_REVIEW:  'badge-conflict',
  STRUCTURE_READY: 'badge-confirmed',
  SUBMISSION:      'badge-confirmed',
  PENDING_BANK:    'badge-conflict',
  APPROVED:        'badge-confirmed',
  REJECTED:        'badge-missing',
  DISBURSED:       'badge-confirmed',
  CLOSED:          'badge-missing',
}

const STATUS_ZH: Record<string, string> = {
  INTAKE:          '接案中',
  ANALYSIS:        '分析中',
  ADVISOR_REVIEW:  '顾问审核',
  STRUCTURE_READY: '方案已定',
  SUBMISSION:      '提交中',
  PENDING_BANK:    '等待银行',
  APPROVED:        '已批准',
  REJECTED:        '被拒绝',
  DISBURSED:       '已放款',
  CLOSED:          '已结案',
}

const PURPOSE_ZH: Record<string, string> = {
  WORKING_CAPITAL:    '营运资金',
  PROPERTY_PURCHASE:  '物业购置',
  EQUIPMENT_MACHINERY:'设备/机械',
  BUSINESS_EXPANSION: '业务扩张',
  DEBT_REFINANCING:   '债务重组',
  TRADE_FINANCING:    '贸易融资',
  PROJECT_FINANCING:  '项目融资',
  OTHER:              '其他',
}

export default async function CasesPage() {
  const cases = await prisma.case.findMany({
    where: { status: { in: ACTIVE_CASE_STATUSES } },
    include: {
      client: { select: { company_name: true } },
    },
    orderBy: { updated_at: 'desc' },
    take: 100,
  })

  const now = new Date()

  return (
    <div className="page-content">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h2 style={{ margin: 0 }}>案件管理</h2>
          <p style={{ color: 'var(--color-text-muted)', margin: '4px 0 0', fontSize: 14 }}>
            共 {cases.length} 个活跃案件
          </p>
        </div>
        <Link href="/cases/new" className="btn btn-primary" style={{ fontSize: 13, minHeight: 40, padding: '10px 22px' }}>
          + 新建案件
        </Link>
      </div>

      {/* Table */}
      <div className="table-scroll-wrap">
        <table>
          <thead>
            <tr>
              <th>案件编号</th>
              <th>客户名称</th>
              <th>贷款用途</th>
              <th>申请额（RM）</th>
              <th>状态</th>
              <th>跟进日期</th>
              <th>最后更新</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {cases.length === 0 && (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: 32 }}>
                  暂无活跃案件
                </td>
              </tr>
            )}
            {cases.map(c => {
              const followUpPast = c.follow_up_date && c.follow_up_date < now
              return (
                <tr key={c.id}>
                  <td>
                    <span style={{ fontFamily: 'var(--font-playfair)', fontWeight: 600, fontSize: 13 }}>
                      {c.case_reference}
                    </span>
                  </td>
                  <td style={{ fontWeight: 500 }}>{c.client.company_name}</td>
                  <td>
                    <span className="status-badge badge-todo" style={{ fontSize: 11 }}>
                      {PURPOSE_ZH[c.purpose] ?? c.purpose}
                    </span>
                  </td>
                  <td className="amount-neutral">
                    RM {c.requested_amount.toLocaleString()}
                  </td>
                  <td>
                    <span className={`status-badge ${STATUS_BADGE[c.status] ?? 'badge-missing'}`}>
                      {STATUS_ZH[c.status] ?? c.status}
                    </span>
                  </td>
                  <td style={{ color: followUpPast ? 'var(--color-status-alert)' : undefined, fontWeight: followUpPast ? 600 : undefined }}>
                    {c.follow_up_date
                      ? c.follow_up_date.toLocaleDateString('zh-MY')
                      : <span style={{ color: 'var(--color-text-muted)' }}>—</span>}
                  </td>
                  <td style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>
                    {c.updated_at.toLocaleDateString('zh-MY')}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <Link href={`/cases/${c.id}`} className="btn-table-action">查看</Link>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
