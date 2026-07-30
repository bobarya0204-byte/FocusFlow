import TaskCard from './TaskCard'
import { getTaskCounts } from '../utils/tasks'

function Dashboard({
  tasks,
  menuOpenTaskId,
  onToggleCompleted,
  onToggleMenu,
  onEdit,
  onDelete,
}) {
  const counts = getTaskCounts(tasks)

  return (
    <main className="main">
      <header className="main-header">
        <h1>Ssup Bro!</h1>
        <p className="subtitle">Here&apos;s what needs your attention today.</p>
      </header>

      <section className="summary-grid">
        <article className="summary-card">
          <p className="summary-label">Tasks Today</p>
          <p className="summary-value">{counts.total}</p>
        </article>
        <article className="summary-card">
          <p className="summary-label">Completed</p>
          <p className="summary-value">{counts.completed}</p>
        </article>
        <article className="summary-card">
          <p className="summary-label">Open</p>
          <p className="summary-value">{counts.open}</p>
        </article>
        <article className="summary-card">
          <p className="summary-label">Overdue</p>
          <p className="summary-value overdue">{counts.overdue}</p>
        </article>
      </section>

      <section className="tasks-section">
        <h2>Today&apos;s Tasks</h2>
        <div className="task-list">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              isMenuOpen={menuOpenTaskId === task.id}
              onToggleCompleted={onToggleCompleted}
              onToggleMenu={onToggleMenu}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      </section>
    </main>
  )
}

export default Dashboard
