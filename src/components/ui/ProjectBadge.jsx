export function getProjectTintStyle(color, { soft = false } = {}) {
  return {
    color,
    background: soft ? `${color}18` : `${color}22`,
    borderColor: soft ? `${color}44` : `${color}55`,
  }
}

function ProjectBadge({ project, className = 'project-badge', soft = false }) {
  if (!project) {
    return null
  }

  return (
    <span className={className} style={getProjectTintStyle(project.color, { soft })}>
      <span aria-hidden="true">{project.icon}</span>
      {project.name}
    </span>
  )
}

export default ProjectBadge
