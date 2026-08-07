import { useMemo } from 'react'
import { CalendarDays, FolderPlus, Plus } from 'lucide-react'
import { useFocusFlow } from '../../context/FocusFlowContext'
import StatCard from '../ui/StatCard'
import EmptyState from '../ui/EmptyState'
import PageHeader from '../ui/PageHeader'
import ProjectBadge from '../ui/ProjectBadge'
import TaskCard from '../tasks/TaskCard'
import { getTaskCounts } from '../../utils/tasks'
import { getTodayLocalDate } from '../../utils/dates'
import { expandTasksForDate } from '../../utils/virtualTasks'
import {
  getActiveProjects,
  getProjectById,
  getProjectProgress,
} from '../../utils/projects'

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function Dashboard() {
  const {
    tasks,
    projects,
    toggleTaskCompleted: onToggleCompleted,
    openEditTask: onEdit,
    deleteTask: onDelete,
    openProjectTasks: onOpenProject,
    navigateTo: onNavigate,
    openCreateTask: onAddTask,
    openCreateProject: onAddProject,
  } = useFocusFlow()

  const counts = useMemo(() => getTaskCounts(tasks), [tasks])
  const today = getTodayLocalDate()
  const todayTasks = useMemo(
    () => expandTasksForDate(tasks, today),
    [tasks, today],
  )
  const activeProjects = useMemo(
    () => getActiveProjects(projects),
    [projects],
  )
  const todayCounts = useMemo(() => {
    const completed = todayTasks.filter((task) => task.completed).length
    const open = todayTasks.length - completed
    const overdue = todayTasks.filter(
      (task) => !task.completed && task.dueDate && task.dueDate < today,
    ).length
    return { completed, open, overdue, total: todayTasks.length }
  }, [todayTasks, today])

  return (
    <main className="main">
      <PageHeader
        title={getGreeting()}
        subtitle={
          todayCounts.open > 0
            ? `${todayCounts.open} task${todayCounts.open === 1 ? '' : 's'} planned for today.`
            : 'Plan a few tasks for today to get momentum.'
        }
        actions={
          <button type="button" className="page-add-btn" onClick={onAddTask}>
            <Plus size={16} strokeWidth={1.75} aria-hidden="true" />
            Add Task
          </button>
        }
      />

      <section className="summary-stack">
        <div className="section-heading">
          <h2>Today&apos;s Metrics</h2>
        </div>
        <section className="summary-grid">
          <StatCard label="Today's Planned" value={todayCounts.total} />
          <StatCard label="Today's Completed" value={todayCounts.completed} />
          <StatCard label="Today's Remaining" value={todayCounts.open} />
          <StatCard
            label="Today's Overdue"
            value={todayCounts.overdue}
            tone={todayCounts.overdue > 0 ? 'overdue' : ''}
          />
        </section>

        <div className="section-heading">
          <h2>Overall Metrics</h2>
        </div>
        <section className="summary-grid">
          <StatCard label="Completed" value={counts.completed} />
          <StatCard label="Open" value={counts.open} />
          <StatCard
            label="Overdue"
            value={counts.overdue}
            tone={counts.overdue > 0 ? 'overdue' : ''}
          />
          <StatCard label="All Tasks" value={counts.total} />
        </section>
      </section>

      <section className="dashboard-projects">
        <div className="section-heading">
          <h2>Projects</h2>
          <button
            type="button"
            className="page-secondary-btn"
            onClick={onAddProject}
          >
            <FolderPlus size={16} strokeWidth={1.75} aria-hidden="true" />
            New Project
          </button>
        </div>
        {activeProjects.length === 0 ? (
          <EmptyState
            title="No projects yet"
            text="Group related work into projects so progress is easier to track."
          >
            <button
              type="button"
              className="page-add-btn"
              onClick={onAddProject}
            >
              <FolderPlus size={16} strokeWidth={1.75} aria-hidden="true" />
              New Project
            </button>
          </EmptyState>
        ) : (
          <div className="dashboard-project-grid">
            {activeProjects.map((project) => {
              const progress = getProjectProgress(tasks, project.id)
              return (
                <button
                  key={project.id}
                  type="button"
                  className="dashboard-project-card"
                  onClick={() => onOpenProject(project.id)}
                >
                  <div className="dashboard-project-top">
                    <ProjectBadge project={project} />
                    <span className="dashboard-project-percent">
                      {progress.percent}%
                    </span>
                  </div>
                  <div className="project-progress-track">
                    <div
                      className="project-progress-fill"
                      style={{
                        width: `${progress.percent}%`,
                        background: project.color,
                      }}
                    />
                  </div>
                  <div className="dashboard-project-meta">
                    <span>
                      {progress.completed}/{progress.total} done
                    </span>
                    <span>
                      {progress.total} task{progress.total === 1 ? '' : 's'}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </section>

      <section className="tasks-section">
        <div className="section-heading">
          <h2>Today&apos;s plan</h2>
          {todayTasks.length > 0 && (
            <span className="section-heading-meta">
              {todayCounts.open} open · {todayCounts.total} total
            </span>
          )}
        </div>
        <div className="task-list">
          {todayTasks.length === 0 ? (
            <EmptyState
              title="Nothing planned for today"
              text="Drag tasks onto today in Planner, or add a task planned for today."
            >
              <button
                type="button"
                className="page-add-btn"
                onClick={onAddTask}
              >
                <Plus size={16} strokeWidth={1.75} aria-hidden="true" />
                Add Task
              </button>
              <button
                type="button"
                className="page-secondary-btn"
                onClick={() => onNavigate('planner')}
              >
                <CalendarDays size={16} strokeWidth={1.75} aria-hidden="true" />
                Open Planner
              </button>
            </EmptyState>
          ) : (
            todayTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                project={getProjectById(projects, task.projectId)}
                onToggleCompleted={onToggleCompleted}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))
          )}
        </div>
      </section>
    </main>
  )
}

export default Dashboard
