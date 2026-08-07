import { useEffect, useRef } from 'react'
import PlannerTaskCard from './PlannerTaskCard'
import {
  getPriorityDots,
  isSameMonth,
  isToday,
  resolveProject,
  toLocalDateKey,
} from '../../utils/planner'

const MAX_VISIBLE_TASKS = 2

const INTERACTIVE_SELECTOR =
  'button, input, label, a, textarea, select, [contenteditable="true"]'

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
  const suppressClickRef = useRef(false)
  const isSelected = selectedDate === dateKey

  useEffect(() => {
    function clearSuppressedClick() {
      window.setTimeout(() => {
        suppressClickRef.current = false
      }, 0)
    }

    document.addEventListener('dragend', clearSuppressedClick)
    return () => {
      document.removeEventListener('dragend', clearSuppressedClick)
    }
  }, [])

  function handleTaskDragStart(event, taskId) {
    suppressClickRef.current = true
    onDragStart(event, taskId)
  }

  function handleCellClick(event) {
    if (suppressClickRef.current) {
      return
    }

    if (event.target.closest(INTERACTIVE_SELECTOR)) {
      return
    }

    onSelectDate(date)
  }

  const label = date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div
      className={[
        'planner-month-day',
        !isSameMonth(date, monthDate) ? 'outside' : '',
        isToday(date) ? 'today' : '',
        isSelected ? 'selected' : '',
        dropTarget === dateKey ? 'drop-target' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-label={`${label}${isSelected ? ', selected' : ''}`}
      onClick={handleCellClick}
      onDragOver={(event) => onDragOver(event, dateKey)}
      onDragLeave={onDragLeave}
      onDrop={(event) => onDrop(event, dateKey)}
    >
      <header className="planner-month-date-button">
        <span className="planner-month-date">{date.getDate()}</span>
        <span className="planner-priority-dots" aria-hidden="true">
          {priorityDots.map((priority) => (
            <i key={priority} className={priority.toLowerCase()} />
          ))}
        </span>
        {tasks.length > 0 && (
          <span className="planner-task-count">{tasks.length}</span>
        )}
      </header>

      <div className="planner-month-task-previews">
        {tasks.slice(0, MAX_VISIBLE_TASKS).map((task) => (
          <PlannerTaskCard
            key={task.id}
            task={task}
            project={resolveProject(projectMap, task.projectId)}
            compact
            onDragStart={handleTaskDragStart}
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
