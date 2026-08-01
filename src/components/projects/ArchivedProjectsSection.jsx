import { useState } from 'react'
import { Archive, ChevronDown, ChevronRight, RotateCcw, Trash2 } from 'lucide-react'
import ProjectBadge from '../ui/ProjectBadge'
import { getProjectProgress } from '../../utils/projects'

function ArchivedProjectsSection({
  projects,
  tasks,
  onRestore,
  onDelete,
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const count = projects.length

  if (count === 0) {
    return null
  }

  return (
    <section className="archived-projects">
      <button
        type="button"
        className="archived-projects-toggle"
        onClick={() => setIsExpanded((current) => !current)}
        aria-expanded={isExpanded}
      >
        <span className="archived-projects-toggle-main">
          {isExpanded ? (
            <ChevronDown size={16} strokeWidth={1.75} aria-hidden="true" />
          ) : (
            <ChevronRight size={16} strokeWidth={1.75} aria-hidden="true" />
          )}
          <Archive size={16} strokeWidth={1.75} aria-hidden="true" />
          <span className="archived-projects-title">Archived Projects</span>
          <span className="archived-projects-count">{count}</span>
        </span>
        <span className="archived-projects-hint">
          {isExpanded ? 'Hide' : 'Show'}
        </span>
      </button>

      {isExpanded && (
        <ul className="archived-projects-list">
          {projects.map((project) => {
            const progress = getProjectProgress(tasks, project.id)
            return (
              <li key={project.id} className="archived-project-row">
                <div className="archived-project-info">
                  <ProjectBadge project={project} />
                  <span className="project-meta">
                    {progress.total} task{progress.total === 1 ? '' : 's'} ·{' '}
                    {progress.percent}% done
                  </span>
                </div>
                <div className="archived-project-actions">
                  <button
                    type="button"
                    className="page-secondary-btn archived-project-btn"
                    onClick={() => onRestore(project.id)}
                  >
                    <RotateCcw size={14} strokeWidth={1.75} aria-hidden="true" />
                    Restore
                  </button>
                  <button
                    type="button"
                    className="page-secondary-btn archived-project-btn danger"
                    onClick={() => onDelete(project.id)}
                  >
                    <Trash2 size={14} strokeWidth={1.75} aria-hidden="true" />
                    Delete
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

export default ArchivedProjectsSection
