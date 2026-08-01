import { memo } from 'react'

function StatCard({ label, value, tone = '' }) {
  return (
    <article className="summary-card">
      <p className="summary-label">{label}</p>
      <p className={`summary-value${tone ? ` ${tone}` : ''}`}>{value}</p>
    </article>
  )
}

export default memo(StatCard)
