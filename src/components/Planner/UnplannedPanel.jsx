import { ChevronLeft, ChevronRight, Inbox } from 'lucide-react'
import PlannerTaskCard from './PlannerTaskCard'
import { resolveProject } from '../../utils/planner'

function UnplannedPanel({
  tasks,
  projectMap,
  isCollapsed,
  isDropTarget,
  onToggleCollapse,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onToggleCompleted,
  onEdit,
}) {
  return (
    <aside
      className={`unplanned-panel${isCollapsed ? ' collapsed' : ''}${
        isDropTarget ? ' drop-target' : ''
      }`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <header className="unplanned-header">
        {!isCollapsed && (
          <div>
            <h2>Inbox</h2>
            <p>
              {tasks.length === 0
                ? 'Nothing waiting'
                : `${tasks.length} to schedule`}
            </p>
          </div>
        )}
        <button
          type="button"
          className="unplanned-collapse-btn"
          onClick={onToggleCollapse}
          aria-label={
            isCollapsed
              ? 'Expand unplanned tasks'
              : 'Collapse unplanned tasks'
          }
        >
          {isCollapsed ? (
            <ChevronLeft size={16} strokeWidth={1.75} />
          ) : (
            <ChevronRight size={16} strokeWidth={1.75} />
          )}
        </button>
      </header>

      {isCollapsed ? (
        <div className="unplanned-collapsed-content">
          <Inbox size={18} strokeWidth={1.75} aria-hidden="true" />
          <span>{tasks.length}</span>
        </div>
      ) : (
        <div className="unplanned-task-list">
          {tasks.length === 0 ? (
            <div className="unplanned-empty">
              <Inbox size={20} strokeWidth={1.5} aria-hidden="true" />
              <p>Inbox is clear</p>
              <span>Drop a planned task here to move it back.</span>
            </div>
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
      )}
    </aside>
  )
}

export default UnplannedPanel
