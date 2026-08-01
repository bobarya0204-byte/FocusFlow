import PlannerTaskCard from './PlannerTaskCard'
import { isToday, resolveProject, toLocalDateKey } from '../../utils/planner'

function DayColumn({
  date,
  tasks,
  projectMap,
  isSelected,
  isDropTarget,
  onSelect,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onToggleCompleted,
  onEdit,
}) {
  const dateKey = toLocalDateKey(date)

  return (
    <article
      className={[
        'planner-day-column',
        isToday(date) ? 'today' : '',
        isSelected ? 'selected' : '',
        isDropTarget ? 'drop-target' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      onDragOver={(event) => onDragOver(event, dateKey)}
      onDragLeave={onDragLeave}
      onDrop={(event) => onDrop(event, dateKey)}
    >
      <button
        type="button"
        className="planner-day-header"
        onClick={() => onSelect(date)}
      >
        <span>
          {date.toLocaleDateString(undefined, { weekday: 'short' })}
        </span>
        <strong>
          {date.toLocaleDateString(undefined, {
            day: 'numeric',
            month: 'short',
          })}
        </strong>
      </button>
      <div className="planner-day-tasks">
        {tasks.length === 0 ? (
          <p className="planner-day-empty">Drop tasks here</p>
        ) : (
          tasks.map((task) => (
            <PlannerTaskCard
              key={task.id}
              task={task}
              project={resolveProject(projectMap, task.projectId)}
              onDragStart={onDragStart}
              onToggleCompleted={onToggleCompleted}
              onEdit={onEdit}
            />
          ))
        )}
      </div>
    </article>
  )
}

export default DayColumn
