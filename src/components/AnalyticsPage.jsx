import StatCard from './StatCard'
import { formatFocusDuration } from '../utils/focus'
import {
  getAnalyticsStats,
  getPriorityBarWidth,
} from '../utils/analytics'

function AnalyticsPage({ tasks, focusSessions }) {
  const stats = getAnalyticsStats(tasks, focusSessions)
  const priorityTotal =
    stats.priorities.high + stats.priorities.medium + stats.priorities.low

  return (
    <main className="main analytics-page">
      <header className="main-header">
        <h1>Analytics</h1>
        <p className="subtitle">
          Real productivity insights from your tasks and focus sessions.
        </p>
      </header>

      <section className="summary-grid">
        <StatCard label="Total Tasks" value={stats.totalTasks} />
        <StatCard label="Completed Tasks" value={stats.completedTasks} />
        <StatCard label="Open Tasks" value={stats.openTasks} />
        <StatCard
          label="Overdue Tasks"
          value={stats.overdueTasks}
          tone={stats.overdueTasks > 0 ? 'overdue' : ''}
        />
      </section>

      <section className="summary-grid analytics-secondary-grid">
        <StatCard label="Completion Rate" value={`${stats.completionRate}%`} />
        <StatCard label="Tasks Completed Today" value={stats.completedToday} />
        <StatCard label="Focus Sessions" value={stats.focusSessions} />
        <StatCard
          label="Total Focus Time"
          value={formatFocusDuration(stats.totalFocusMinutes)}
        />
      </section>

      <div className="analytics-layout">
        <section className="analytics-panel">
          <h2>Priority Breakdown</h2>
          <div className="priority-breakdown">
            <div className="priority-row">
              <div className="priority-row-meta">
                <span className="priority priority-high">High</span>
                <span className="priority-count">{stats.priorities.high}</span>
              </div>
              <div className="priority-bar-track">
                <div
                  className="priority-bar-fill high"
                  style={{
                    width: getPriorityBarWidth(
                      stats.priorities.high,
                      priorityTotal,
                    ),
                  }}
                />
              </div>
            </div>
            <div className="priority-row">
              <div className="priority-row-meta">
                <span className="priority priority-medium">Medium</span>
                <span className="priority-count">{stats.priorities.medium}</span>
              </div>
              <div className="priority-bar-track">
                <div
                  className="priority-bar-fill medium"
                  style={{
                    width: getPriorityBarWidth(
                      stats.priorities.medium,
                      priorityTotal,
                    ),
                  }}
                />
              </div>
            </div>
            <div className="priority-row">
              <div className="priority-row-meta">
                <span className="priority priority-low">Low</span>
                <span className="priority-count">{stats.priorities.low}</span>
              </div>
              <div className="priority-bar-track">
                <div
                  className="priority-bar-fill low"
                  style={{
                    width: getPriorityBarWidth(
                      stats.priorities.low,
                      priorityTotal,
                    ),
                  }}
                />
              </div>
            </div>
          </div>
        </section>

        <section className="analytics-panel">
          <h2>Focus Overview</h2>
          <div className="focus-overview-stats">
            <div>
              <p className="mini-stat-label">Average Focus Session</p>
              <p className="focus-stat-value">
                {formatFocusDuration(stats.averageFocusMinutes)}
              </p>
            </div>
            <div>
              <p className="mini-stat-label">Total Focus Time</p>
              <p className="focus-stat-value">
                {formatFocusDuration(stats.totalFocusMinutes)}
              </p>
            </div>
            <div>
              <p className="mini-stat-label">Sessions Logged</p>
              <p className="focus-stat-value">{stats.focusSessions}</p>
            </div>
          </div>
        </section>
      </div>

      <section className="analytics-panel analytics-summary-panel">
        <h2>Recent Productivity Summary</h2>
        <ul className="productivity-summary">
          {stats.summaryLines.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </section>
    </main>
  )
}

export default AnalyticsPage
