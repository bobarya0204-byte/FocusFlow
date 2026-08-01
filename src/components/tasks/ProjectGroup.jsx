import { ChevronDown, ChevronRight, MoreHorizontal, Plus } from 'lucide-react'
import TaskCard from './TaskCard'
import IconButton from '../ui/IconButton'
import ProjectBadge from '../ui/ProjectBadge'
import {
  UNCATEGORIZED_PROJECT_ID,
  getProjectProgress,
} from '../../utils/projects'

function ProjectGroup({
  project,
  tasks,
  allTasks,
  isCollapsed,
  onToggleCollapse,
  onAddTask,
  projectMenuOpenId,
  onToggleProjectMenu,
  onEditProject,
  onArchiveProject,
  onDeleteProject,
  onToggleCompleted,
  onEdit,
  onDelete,
  onArchivedBlocked,
  canManage = true,
}) {
  const progress = getProjectProgress(allTasks || tasks, project.id)
  const visibleCount = tasks.length
  const filtersHidingTasks =
    progress.total > 0 && visibleCount === 0 && !isCollapsed
  const isArchived = Boolean(project.archived)

  function guardOr(action) {
    if (isArchived) {
      onArchivedBlocked?.(project)
      return
    }
    action()
  }

  return (
    <section className="project-group">
      <header className="project-group-header">
        <button
          type="button"
          className="project-group-toggle"
          onClick={() => onToggleCollapse(project.id)}
          aria-expanded={!isCollapsed}
        >
          {isCollapsed ? (
            <ChevronRight size={16} strokeWidth={1.75} />
          ) : (
            <ChevronDown size={16} strokeWidth={1.75} />
          )}
          <ProjectBadge project={project} />
          <span className="project-meta">
            {progress.total} task{progress.total === 1 ? '' : 's'} ·{' '}
            {progress.percent}% done
            {isArchived ? ' · Archived' : ''}
          </span>
        </button>

        <div className="project-group-actions">
          <button
            type="button"
            className="project-add-task-btn"
            onClick={() => guardOr(() => onAddTask(project.id))}
          >
            <Plus size={14} strokeWidth={1.75} aria-hidden="true" />
            Add Task
          </button>

          {canManage && project.id !== UNCATEGORIZED_PROJECT_ID && (
            <div className="project-menu">
              <IconButton
                label={`More actions for ${project.name}`}
                expanded={projectMenuOpenId === project.id}
                onClick={() => onToggleProjectMenu(project.id)}
              >
                <MoreHorizontal size={16} strokeWidth={1.75} />
              </IconButton>
              {projectMenuOpenId === project.id && (
                <div className="task-menu-dropdown" role="menu">
                  <button
                    type="button"
                    className="task-menu-item"
                    onClick={() => onEditProject(project)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="task-menu-item"
                    onClick={() => onArchiveProject(project.id)}
                  >
                    {project.archived ? 'Restore' : 'Archive'}
                  </button>
                  <button
                    type="button"
                    className="task-menu-item danger"
                    onClick={() => onDeleteProject(project.id)}
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      <div className="project-progress-track">
        <div
          className="project-progress-fill"
          style={{
            width: `${progress.percent}%`,
            background: project.color,
          }}
        />
      </div>

      {!isCollapsed && (
        <div className="task-list project-task-list">
          {visibleCount === 0 ? (
            <div className="project-empty-state">
              <p className="project-empty">
                {filtersHidingTasks
                  ? 'No tasks match the current filters.'
                  : 'No tasks in this project yet.'}
              </p>
              {!filtersHidingTasks && (
                <button
                  type="button"
                  className="project-add-task-btn"
                  onClick={() => guardOr(() => onAddTask(project.id))}
                >
                  <Plus size={14} strokeWidth={1.75} aria-hidden="true" />
                  Add Task
                </button>
              )}
            </div>
          ) : (
            tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                project={project}
                showProject={false}
                onToggleCompleted={(taskId) =>
                  guardOr(() => onToggleCompleted(taskId))
                }
                onEdit={(item) => guardOr(() => onEdit(item))}
                onDelete={onDelete}
              />
            ))
          )}
        </div>
      )}
    </section>
  )
}

export default ProjectGroup
