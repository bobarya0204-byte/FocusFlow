import { EllipsisVertical, Pencil, Trash2 } from 'lucide-react'
import { formatDueDate, isTaskOverdue } from '../utils/tasks'

function TaskCard({
  task,
  isMenuOpen,
  onToggleCompleted,
  onToggleMenu,
  onEdit,
  onDelete,
}) {
  const overdue = isTaskOverdue(task)

  return (
    <article
      className={`task-card${task.completed ? ' completed' : ''}${
        overdue ? ' overdue' : ''
      }`}
    >
      <label className="task-check">
        <input
          type="checkbox"
          checked={task.completed}
          onChange={() => onToggleCompleted(task.id)}
          aria-label={`Mark "${task.title}" as ${
            task.completed ? 'open' : 'completed'
          }`}
        />
      </label>
      <div className="task-content">
        <p className="task-title">{task.title}</p>
        {task.dueDate && (
          <p className={`task-due${overdue ? ' overdue' : ''}`}>
            Due {formatDueDate(task.dueDate)}
          </p>
        )}
      </div>
      <div className="task-meta">
        <span className={`priority priority-${task.priority.toLowerCase()}`}>
          {task.priority} Priority
        </span>
        <div className="task-menu">
          <button
            type="button"
            className="task-menu-btn"
            onClick={() => onToggleMenu(task.id)}
            aria-label={`Open menu for ${task.title}`}
            aria-expanded={isMenuOpen}
          >
            <EllipsisVertical size={16} strokeWidth={1.75} />
          </button>
          {isMenuOpen && (
            <div className="task-menu-dropdown" role="menu">
              <button
                type="button"
                className="task-menu-item"
                role="menuitem"
                onClick={() => onEdit(task)}
              >
                <Pencil size={14} strokeWidth={1.75} />
                Edit
              </button>
              <button
                type="button"
                className="task-menu-item danger"
                role="menuitem"
                onClick={() => onDelete(task.id)}
              >
                <Trash2 size={14} strokeWidth={1.75} />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  )
}

export default TaskCard
