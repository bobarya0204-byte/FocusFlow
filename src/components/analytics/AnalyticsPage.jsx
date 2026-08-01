import { useMemo } from 'react'
import { useFocusFlow } from '../../context/FocusFlowContext'
import StatCard from '../ui/StatCard'
import PageHeader from '../ui/PageHeader'
import ProjectBadge from '../ui/ProjectBadge'
import { formatFocusDuration } from '../../utils/focus'
import {
  getAnalyticsStats,
  getPriorityBarWidth,
} from '../../utils/analytics'
import { buildProductivityInsights } from '../../utils/insights'
import { getProjectAnalytics } from '../../utils/projects'

function AnalyticsPage() {
  const { tasks, focusSessions, projects } = useFocusFlow()

  const stats = useMemo(
    () => getAnalyticsStats(tasks, focusSessions),
    [tasks, focusSessions],
  )
  const projectStats = useMemo(
    () => getProjectAnalytics(projects, tasks),
    [projects, tasks],
  )
  const insights = useMemo(
    () => buildProductivityInsights(tasks, focusSessions, projects),
    [tasks, focusSessions, projects],
  )
  const priorityTotal =
    stats.priorities.high + stats.priorities.medium + stats.priorities.low

  return (
    <main className="main">
      <PageHeader
        title="Analytics"
        subtitle="How your tasks, projects, and focus time are trending."
      />

      <div className="summary-stack">
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

        <section className="summary-grid">
          <StatCard
            label="Completion Rate"
            value={`${stats.completionRate}%`}
          />
          <StatCard
            label="Tasks Completed Today"
            value={stats.completedToday}
          />
          <StatCard label="Active Projects" value={projectStats.activeCount} />
          <StatCard
            label="Archived Projects"
            value={projectStats.archivedCount}
          />
        </section>

        <section className="summary-grid">
          <StatCard
            label="Completed Sessions"
            value={stats.completedFocusSessions}
          />
          <StatCard
            label="Interrupted Sessions"
            value={stats.interruptedFocusSessions}
          />
          <StatCard
            label="Total Focus Time"
            value={formatFocusDuration(stats.totalFocusMinutes)}
          />
          <StatCard
            label="Average Focus Session"
            value={formatFocusDuration(stats.averageFocusMinutes)}
          />
        </section>
      </div>

      <div className="analytics-layout">
        <section className="analytics-panel">
          <div className="section-heading">
            <h2>Priority Breakdown</h2>
          </div>
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
          <div className="section-heading">
            <h2>Tasks per Project</h2>
          </div>
          <div className="project-analytics-list">
            {projectStats.tasksPerProject.length === 0 ? (
              <p className="project-empty">No projects yet.</p>
            ) : (
              projectStats.tasksPerProject.map(({ project, total, percent }) => (
                <div key={project.id} className="project-analytics-row">
                  <div className="project-analytics-meta">
                    <ProjectBadge project={project} />
                    <span>
                      {total} tasks · {percent}%
                    </span>
                  </div>
                  <div className="project-progress-track">
                    <div
                      className="project-progress-fill"
                      style={{
                        width: `${percent}%`,
                        background: project.color,
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <section className="analytics-panel insights-panel">
        <div className="section-heading">
          <h2>Smart Productivity Insights</h2>
        </div>
        <div className="insights-grid">
          {insights.cards.map((card) => (
            <article
              key={card.id}
              className={`insight-card${card.placeholder ? ' placeholder' : ''}`}
            >
              <p className="summary-label">{card.title}</p>
              <p className="insight-value">{card.value}</p>
              <p className="insight-detail">{card.detail}</p>
            </article>
          ))}
        </div>
        <div className="completion-trend">
          <p className="summary-label">7-day completion trend</p>
          <div className="completion-trend-bars" aria-hidden="true">
            {insights.completionTrend.map((point) => {
              const max = Math.max(
                1,
                ...insights.completionTrend.map((item) => item.completed),
              )
              const height = Math.max(
                8,
                Math.round((point.completed / max) * 64),
              )
              return (
                <div key={point.date} className="completion-trend-col">
                  <div
                    className="completion-trend-bar"
                    style={{ height: `${height}px` }}
                    title={`${point.date}: ${point.completed}`}
                  />
                  <span>{point.date.slice(8)}</span>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="analytics-panel analytics-summary-panel">
        <div className="section-heading">
          <h2>Recent Productivity Summary</h2>
        </div>
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
