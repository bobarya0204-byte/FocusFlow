import { memo } from 'react'
import { GripVertical, Pencil } from 'lucide-react'
import IconButton from '../ui/IconButton'
import ProjectBadge from '../ui/ProjectBadge'

function PlannerTaskCard({
  task,
  project,
  compact = false,
  onDragStart,
  onToggleCompleted,
  onEdit,
}) {
  return (
    <article
      className={`planner-task-item${task.completed ? ' completed' : ''}${
        compact ? ' compact' : ''
      }`}
      draggable
      onDragStart={(event) => onDragStart(event, task.id)}
    >
      <GripVertical
        className="planner-drag-handle"
        size={14}
        strokeWidth={1.75}
        aria-hidden="true"
      />
      <label className="planner-task-check">
        <input
          type="checkbox"
          checked={task.completed}
          onChange={() => onToggleCompleted(task.id)}
          aria-label={`Mark "${task.title}" as ${
            task.completed ? 'open' : 'completed'
          }`}
        />
      </label>
      <div className="planner-task-content">
        <p className="planner-task-title">{task.title}</p>
        <div className="planner-task-meta">
          <span
            className={`priority priority-${task.priority.toLowerCase()} planner-priority`}
          >
            {task.priority}
          </span>
          {project && (
            <ProjectBadge
              project={project}
              className="planner-project-chip"
              soft
            />
          )}
        </div>
      </div>
      <IconButton
        label={`Edit ${task.title}`}
        className="planner-task-edit"
        onClick={() => onEdit(task)}
      >
        <Pencil size={13} strokeWidth={1.75} />
      </IconButton>
    </article>
  )
}

export default memo(PlannerTaskCard)
