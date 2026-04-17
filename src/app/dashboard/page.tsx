import Link from 'next/link'
import { getDashboardData } from '@/server/dashboard/getDashboardData'

const STATUS_ZH: Record<string, string> = {
  INTAKE:'接案中', ANALYSIS:'分析中', ADVISOR_REVIEW:'顾问审核',
  STRUCTURE_READY:'方案已定', SUBMISSION:'提交中', PENDING_BANK:'等待银行',
  APPROVED:'已批准', REJECTED:'被拒绝', DISBURSED:'已放款', CLOSED:'已结案',
}
const STATUS_BADGE: Record<string, string> = {
  INTAKE:'badge-todo', ANALYSIS:'badge-todo', ADVISOR_REVIEW:'badge-conflict',
  STRUCTURE_READY:'badge-confirmed', SUBMISSION:'badge-confirmed', PENDING_BANK:'badge-conflict',
  APPROVED:'badge-confirmed', REJECTED:'badge-missing', DISBURSED:'badge-confirmed', CLOSED:'badge-missing',
}
const SCORE_BADGE: Record<string, string> = {
  HIGH:'badge-confirmed', MEDIUM:'badge-todo', LOW:'badge-conflict', INELIGIBLE:'badge-missing',
}
const SCORE_ZH: Record<string, string> = {
  HIGH:'高匹配', MEDIUM:'中匹配', LOW:'低匹配', INELIGIBLE:'不符合',
}

function pctColor(pct: number) {
  if (pct >= 80) return 'var(--color-credit)'
  if (pct >= 50) return 'var(--color-status-pending)'
  return 'var(--color-status-alert)'
}

export default async function DashboardPage() {
  let data
  try {
    data = await getDashboardData()
  } catch (err) {
    return (
      <div className="page-content">
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <p style={{ fontFamily: 'var(--font-playfair)', fontSize: 18, color: 'var(--color-status-alert)', margin: '0 0 8px' }}>
            Dashboard data could not be loaded
          </p>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>
            {err instanceof Error ? err.message : 'Unknown error'}
          </p>
        </div>
      </div>
    )
  }

  const totalHigh = data.matchScoreDistribution.find(s => s.score === 'HIGH')?.count ?? 0

  return (
    <div className="page-content">
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ margin: 0 }}>仪表盘</h2>
        <p style={{ color: 'var(--color-text-muted)', margin: '4px 0 0', fontSize: 14 }}>BCIS 系统总览</p>
      </div>

      {/* Row 1: KPI stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: '总案件数', value: data.totalCases, sub: `${data.casesWithMatchRunCount} 个已跑匹配`, alert: false },
          { label: '待跟进案件', value: data.overdueFollowUpCount + data.dueSoonFollowUpCount,
            sub: `${data.overdueFollowUpCount} 已过期 · ${data.dueSoonFollowUpCount} 7天内`, alert: data.overdueFollowUpCount > 0 },
          { label: '活跃产品数', value: data.totalActiveProducts, sub: `${data.productsBelow50} 个不足50%`, alert: false },
          { label: '知识库待核实', value: data.staleProductCount, sub: '超90天未核实', alert: data.staleProductCount > 0 },
        ].map(card => (
          <div key={card.label} className="stat-card">
            <div className="stat-value" style={{ color: card.alert ? 'var(--color-status-alert)' : undefined }}>
              {card.value}
            </div>
            <div className="stat-label">{card.label}</div>
            {card.sub && <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4 }}>{card.sub}</div>}
          </div>
        ))}
      </div>

      {/* Row 2: Case pipeline + overdue */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        <div className="card" style={{ padding: 22 }}>
          <div className="section-label" style={{ marginBottom: 14 }}>案件状态分布</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {data.casesByStatus.map(s => {
              const pct = data.totalCases > 0 ? (s.count / data.totalCases) * 100 : 0
              return (
                <div key={s.status} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className={`status-badge ${STATUS_BADGE[s.status] ?? 'badge-missing'}`}
                    style={{ fontSize: 10, minWidth: 64, justifyContent: 'center' }}>
                    {STATUS_ZH[s.status] ?? s.status}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div className="progress-bar-wrap" style={{ height: 8 }}>
                      <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, fontVariantNumeric: 'tabular-nums',
                    minWidth: 24, textAlign: 'right', color: 'var(--color-text-secondary)' }}>{s.count}</span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="card" style={{ padding: 22 }}>
          <div className="section-label" style={{ marginBottom: 14 }}>过期跟进案件 ({data.overdueFollowUpCount})</div>
          {data.overdueFollowUpCases.length === 0 ? (
            <p style={{ color: 'var(--color-credit)', fontSize: 14 }}>✓ 暂无过期跟进案件</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {data.overdueFollowUpCases.map(c => (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '8px 12px', borderRadius: 'var(--radius-md)',
                  background: 'var(--color-status-alert-bg)', border: '1px solid var(--color-status-alert)' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{c.companyName}</div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{c.case_reference}</div>
                  </div>
                  <Link href={`/cases/${c.id}`} className="btn-table-action">查看</Link>
                </div>
              ))}
              {data.overdueFollowUpCount > 5 && (
                <Link href="/cases" style={{ fontSize: 12, color: 'var(--color-accent-gold)', textDecoration: 'none' }}>
                  查看全部 {data.overdueFollowUpCount} 个 →
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Row 3: Knowledge health + Match quality */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        <div className="card" style={{ padding: 22 }}>
          <div className="section-label" style={{ marginBottom: 14 }}>产品知识库健康度</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: 'Block A ≥ 80%', count: data.products80plus, color: 'var(--color-credit)' },
              { label: 'Block A 50–79%', count: data.products50to80, color: 'var(--color-status-pending)' },
              { label: 'Block A < 50%', count: data.productsBelow50, color: 'var(--color-status-alert)' },
            ].map(row => {
              const pct = data.totalActiveProducts > 0 ? (row.count / data.totalActiveProducts) * 100 : 0
              return (
                <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 12, color: row.color, fontWeight: 600, minWidth: 100 }}>{row.label}</span>
                  <div style={{ flex: 1 }}>
                    <div className="progress-bar-wrap">
                      <div className="progress-bar-fill" style={{ width: `${pct}%`, background: row.color }} />
                    </div>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, fontVariantNumeric: 'tabular-nums', minWidth: 24, textAlign: 'right' }}>
                    {row.count}
                  </span>
                </div>
              )
            })}
          </div>
          <div style={{ borderTop: '1px solid var(--color-border-light)', marginTop: 14, paddingTop: 12, display: 'flex', gap: 24 }}>
            {[
              { label: '证据记录', value: data.totalFieldEvidenceCount },
              { label: '规则决策', value: data.totalFieldDecisionCount },
              { label: '待核实', value: data.staleProductCount, alert: data.staleProductCount > 0 },
            ].map(item => (
              <div key={item.label}>
                <div className="section-label" style={{ marginBottom: 2 }}>{item.label}</div>
                <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-playfair)', fontVariantNumeric: 'tabular-nums',
                  color: (item as { alert?: boolean }).alert ? 'var(--color-status-alert)' : undefined }}>
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{ padding: 22 }}>
          <div className="section-label" style={{ marginBottom: 14 }}>匹配质量快照</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
            {data.matchScoreDistribution.map(s => {
              const pct = data.totalMatchingResults > 0 ? (s.count / data.totalMatchingResults) * 100 : 0
              return (
                <div key={s.score} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className={`status-badge ${SCORE_BADGE[s.score] ?? 'badge-missing'}`}
                    style={{ fontSize: 10, minWidth: 56, justifyContent: 'center' }}>
                    {SCORE_ZH[s.score]}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div className="progress-bar-wrap">
                      <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, fontVariantNumeric: 'tabular-nums', minWidth: 28, textAlign: 'right' }}>
                    {s.count}
                  </span>
                </div>
              )
            })}
          </div>
          <div style={{ borderTop: '1px solid var(--color-border-light)', paddingTop: 12, display: 'flex', gap: 24 }}>
            <div>
              <div className="section-label" style={{ marginBottom: 2 }}>已跑匹配案件</div>
              <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-playfair)', fontVariantNumeric: 'tabular-nums' }}>
                {data.casesWithMatchRunCount}
              </div>
            </div>
            <div>
              <div className="section-label" style={{ marginBottom: 2 }}>高匹配结果</div>
              <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-playfair)', fontVariantNumeric: 'tabular-nums', color: 'var(--color-credit)' }}>
                {totalHigh}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 4: Advisor productivity */}
      <div className="card" style={{ padding: 22, marginBottom: 24 }}>
        <div className="section-label" style={{ marginBottom: 14 }}>顾问工作量（Top 5）</div>
        {data.advisorSummaries.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>暂无案件数据</p>
        ) : (
          <div className="table-scroll-wrap">
            <table>
              <thead><tr><th>顾问</th><th style={{ textAlign:'right' }}>总案件数</th><th style={{ textAlign:'right' }}>进行中案件</th></tr></thead>
              <tbody>
                {data.advisorSummaries.map(a => (
                  <tr key={a.advisorId}>
                    <td style={{ fontWeight: 500 }}>{a.advisorName}</td>
                    <td style={{ textAlign:'right', fontVariantNumeric:'tabular-nums' }}>{a.totalCases}</td>
                    <td style={{ textAlign:'right' }}>
                      <span className="status-badge badge-todo" style={{ fontSize: 11 }}>{a.openCases}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Row 5: Recent activity */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="card" style={{ padding: 22 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 14 }}>
            <span className="section-label">最近更新案件</span>
            <Link href="/cases" style={{ fontSize: 12, color: 'var(--color-accent-gold)', textDecoration:'none' }}>查看全部 →</Link>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap: 6 }}>
            {data.recentCases.map(c => (
              <div key={c.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
                padding:'8px 0', borderBottom:'1px solid var(--color-border-light)' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{c.companyName}</div>
                  <div style={{ fontSize: 11, color:'var(--color-text-muted)' }}>{c.case_reference}</div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap: 8 }}>
                  <span className={`status-badge ${STATUS_BADGE[c.status] ?? 'badge-missing'}`} style={{ fontSize: 10 }}>
                    {STATUS_ZH[c.status] ?? c.status}
                  </span>
                  <Link href={`/cases/${c.id}`} className="btn-table-action" style={{ fontSize: 11, minHeight: 26, padding:'3px 10px' }}>查看</Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{ padding: 22 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 14 }}>
            <span className="section-label">最近更新产品</span>
            <Link href="/banks" style={{ fontSize: 12, color: 'var(--color-accent-gold)', textDecoration:'none' }}>查看全部 →</Link>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap: 6 }}>
            {data.recentProducts.map(p => (
              <div key={p.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
                padding:'8px 0', borderBottom:'1px solid var(--color-border-light)' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{p.bankCode}</div>
                  <div style={{ fontSize: 11, color:'var(--color-text-muted)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth: 220 }}>
                    {p.product_name_en}
                  </div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, fontVariantNumeric:'tabular-nums', color: pctColor(p.block_a_completion_pct) }}>
                    {Math.round(p.block_a_completion_pct)}%
                  </div>
                  <div style={{ fontSize: 10, color:'var(--color-text-muted)' }}>Block A</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
