import { useRef } from 'react'
import { X } from 'lucide-react'
import PlannerTaskCard from './PlannerTaskCard'
import IconButton from '../ui/IconButton'
import { useEscapeKey } from '../../hooks/useEscapeKey'
import { useFocusTrap } from '../../hooks/useFocusTrap'
import { fromLocalDateKey, resolveProject } from '../../utils/planner'

function DayTasksDrawer({
  dateKey,
  tasks,
  projectMap,
  onClose,
  onDragStart,
  onToggleCompleted,
  onEdit,
}) {
  const drawerRef = useRef(null)
  const isOpen = Boolean(dateKey)

  useEscapeKey(isOpen, onClose)
  useFocusTrap(isOpen, drawerRef)

  if (!dateKey) {
    return null
  }

  const date = fromLocalDateKey(dateKey)

  return (
    <div className="planner-drawer-overlay" onClick={onClose}>
      <aside
        ref={drawerRef}
        className="planner-day-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Tasks for selected day"
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
      >
        <header>
          <div>
            <h2>
              {date.toLocaleDateString(undefined, {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </h2>
            <p>
              {tasks.length} planned task{tasks.length === 1 ? '' : 's'}
            </p>
          </div>
          <IconButton label="Close day tasks" onClick={onClose} data-autofocus>
            <X size={16} strokeWidth={1.75} />
          </IconButton>
        </header>
        <div className="planner-drawer-tasks">
          {tasks.map((task) => (
            <PlannerTaskCard
              key={task.id}
              task={task}
              project={resolveProject(projectMap, task.projectId)}
              onDragStart={onDragStart}
              onToggleCompleted={onToggleCompleted}
              onEdit={onEdit}
            />
          ))}
        </div>
      </aside>
    </div>
  )
}

export default DayTasksDrawer
