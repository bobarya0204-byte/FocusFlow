import { memo } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import IconButton from '../ui/IconButton'
import ProjectBadge from '../ui/ProjectBadge'
import { formatDueDate, isTaskOverdue } from '../../utils/tasks'
import { formatRecurrenceLabel } from '../../utils/recurrence'

function TaskCard({
  task,
  project,
  showProject = true,
  onToggleCompleted,
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
        <button
          type="button"
          className="task-title-btn"
          onClick={() => onEdit(task)}
        >
          <span className="task-title">{task.title}</span>
        </button>
        <div className="task-secondary">
          {task.dueDate && (
            <p className={`task-due${overdue ? ' overdue' : ''}`}>
              {overdue ? 'Overdue' : 'Due'} {formatDueDate(task.dueDate)}
            </p>
          )}
          {task.recurrence && (
            <span className="task-recurrence-chip">
              {formatRecurrenceLabel(task.recurrence)}
            </span>
          )}
          {showProject && project && (
            <ProjectBadge
              project={project}
              className="task-project-chip"
              soft
            />
          )}
        </div>
      </div>
      <div className="task-meta">
        <span className={`priority priority-${task.priority.toLowerCase()}`}>
          {task.priority}
        </span>
        <div className="task-actions">
          <IconButton
            label={`Edit ${task.title}`}
            title="Edit"
            onClick={() => onEdit(task)}
          >
            <Pencil size={14} strokeWidth={1.75} />
          </IconButton>
          <IconButton
            label={`Delete ${task.title}`}
            title="Delete"
            className="danger"
            onClick={() => onDelete(task.id)}
          >
            <Trash2 size={14} strokeWidth={1.75} />
          </IconButton>
        </div>
      </div>
    </article>
  )
}

export default memo(TaskCard)
