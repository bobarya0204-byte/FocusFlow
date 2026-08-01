import PlannerTaskCard from './PlannerTaskCard'
import {
  getPriorityDots,
  isSameMonth,
  isToday,
  resolveProject,
  toLocalDateKey,
} from '../../utils/planner'

const MAX_VISIBLE_TASKS = 2

function DayCell({
  date,
  monthDate,
  tasks,
  projectMap,
  selectedDate,
  dropTarget,
  onSelectDate,
  onShowAll,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onToggleCompleted,
  onEdit,
}) {
  const dateKey = toLocalDateKey(date)
  const remainingCount = Math.max(0, tasks.length - MAX_VISIBLE_TASKS)
  const priorityDots = getPriorityDots(tasks)

  return (
    <div
      className={[
        'planner-month-day',
        !isSameMonth(date, monthDate) ? 'outside' : '',
        isToday(date) ? 'today' : '',
        selectedDate === dateKey ? 'selected' : '',
        dropTarget === dateKey ? 'drop-target' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      onDragOver={(event) => onDragOver(event, dateKey)}
      onDragLeave={onDragLeave}
      onDrop={(event) => onDrop(event, dateKey)}
    >
      <button
        type="button"
        className="planner-month-date-button"
        onClick={() => onSelectDate(date)}
      >
        <span className="planner-month-date">{date.getDate()}</span>
        <span className="planner-priority-dots" aria-hidden="true">
          {priorityDots.map((priority) => (
            <i key={priority} className={priority.toLowerCase()} />
          ))}
        </span>
        {tasks.length > 0 && (
          <span className="planner-task-count">{tasks.length}</span>
        )}
      </button>

      <div className="planner-month-task-previews">
        {tasks.slice(0, MAX_VISIBLE_TASKS).map((task) => (
          <PlannerTaskCard
            key={task.id}
            task={task}
            project={resolveProject(projectMap, task.projectId)}
            compact
            onDragStart={onDragStart}
            onToggleCompleted={onToggleCompleted}
            onEdit={onEdit}
          />
        ))}
        {remainingCount > 0 && (
          <button
            type="button"
            className="planner-more-btn"
            onClick={() => onShowAll(date)}
          >
            +{remainingCount} more
          </button>
        )}
      </div>
    </div>
  )
}

export default DayCell
