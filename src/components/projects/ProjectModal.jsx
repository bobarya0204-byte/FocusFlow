import { useEffect, useRef, useState } from 'react'
import { useEscapeKey } from '../../hooks/useEscapeKey'
import { useFocusTrap } from '../../hooks/useFocusTrap'
import { PROJECT_COLORS, PROJECT_ICONS } from '../../utils/projects'

function ProjectModal({ project = null, defaults = {}, onClose, onSave }) {
  const isEditing = Boolean(project)
  const nameRef = useRef(null)
  const dialogRef = useRef(null)

  const [name, setName] = useState(() => project?.name ?? '')
  const [description, setDescription] = useState(
    () => project?.description ?? '',
  )
  const [color, setColor] = useState(
    () => project?.color ?? defaults.color ?? PROJECT_COLORS[1],
  )
  const [icon, setIcon] = useState(
    () => project?.icon ?? defaults.icon ?? PROJECT_ICONS[1],
  )

  const canSubmit = Boolean(name.trim())

  useEscapeKey(true, onClose)
  useFocusTrap(true, dialogRef)

  useEffect(() => {
    nameRef.current?.focus()
  }, [])

  function handleSubmit(event) {
    event.preventDefault()
    const trimmedName = name.trim()
    if (!trimmedName) {
      return
    }

    onSave({
      id: project?.id ?? null,
      name: trimmedName,
      description: description.trim(),
      color,
      icon,
    })
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        ref={dialogRef}
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="project-modal-title"
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="project-modal-title">
          {isEditing ? 'Edit project' : 'New project'}
        </h2>

        <form onSubmit={handleSubmit}>
          <label className="modal-field">
            <span className="modal-label">Name</span>
            <input
              ref={nameRef}
              type="text"
              className="modal-input"
              placeholder="e.g. Product Launch"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              data-autofocus
            />
          </label>

          <label className="modal-field">
            <span className="modal-label">
              Description{' '}
              <span className="modal-optional">(optional)</span>
            </span>
            <textarea
              className="modal-input modal-textarea"
              placeholder="What is this project about?"
              rows={3}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </label>

          <div className="modal-field">
            <span className="modal-label">Icon</span>
            <div className="project-icon-picker">
              {PROJECT_ICONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={`project-icon-option${
                    icon === option ? ' active' : ''
                  }`}
                  onClick={() => setIcon(option)}
                  aria-label={`Use icon ${option}`}
                  aria-pressed={icon === option}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className="modal-field">
            <span className="modal-label">Color</span>
            <div className="project-color-picker">
              {PROJECT_COLORS.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={`project-color-option${
                    color === option ? ' active' : ''
                  }`}
                  style={{ background: option }}
                  onClick={() => setColor(option)}
                  aria-label={`Select color ${option}`}
                  aria-pressed={color === option}
                />
              ))}
            </div>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="modal-btn modal-btn-cancel"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="modal-btn modal-btn-create"
              disabled={!canSubmit}
            >
              {isEditing ? 'Save changes' : 'Create project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ProjectModal
