import { useEffect, useRef } from 'react'
import PlannerTaskCard from './PlannerTaskCard'
import { isToday, resolveProject, toLocalDateKey } from '../../utils/planner'

const INTERACTIVE_SELECTOR =
  'button, input, label, a, textarea, select, [contenteditable="true"]'

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
  const suppressClickRef = useRef(false)

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

  function handleColumnClick(event) {
    if (suppressClickRef.current) {
      return
    }

    if (event.target.closest(INTERACTIVE_SELECTOR)) {
      return
    }

    onSelect(date)
  }

  const label = date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

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
      aria-label={`${label}${isSelected ? ', selected' : ''}`}
      onClick={handleColumnClick}
      onDragOver={(event) => onDragOver(event, dateKey)}
      onDragLeave={onDragLeave}
      onDrop={(event) => onDrop(event, dateKey)}
    >
      <header className="planner-day-header">
        <span>
          {date.toLocaleDateString(undefined, { weekday: 'short' })}
        </span>
        <strong>
          {date.toLocaleDateString(undefined, {
            day: 'numeric',
            month: 'short',
          })}
        </strong>
      </header>
      <div className="planner-day-tasks">
        {tasks.length === 0 ? (
          <p className="planner-day-empty">Drop tasks here</p>
        ) : (
          tasks.map((task) => (
            <PlannerTaskCard
              key={task.id}
              task={task}
              project={resolveProject(projectMap, task.projectId)}
              onDragStart={handleTaskDragStart}
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
