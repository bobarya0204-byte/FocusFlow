import { useEffect, useRef, useState } from 'react'
import { useEscapeKey } from '../../hooks/useEscapeKey'
import { useFocusTrap } from '../../hooks/useFocusTrap'
import { UNCATEGORIZED_PROJECT_ID } from '../../utils/projects'
import { hasDuplicateTaskTitle, normalizePriority } from '../../utils/tasks'
import {
  RECURRENCE_FREQUENCIES,
  formatRecurrenceLabel,
} from '../../utils/recurrence'

function TaskModal({
  task = null,
  defaults = {},
  projects,
  tasks = [],
  onClose,
  onSave,
}) {
  const isEditing = Boolean(task)
  const titleRef = useRef(null)
  const dialogRef = useRef(null)

  const [title, setTitle] = useState(() => task?.title ?? '')
  const [priority, setPriority] = useState(() =>
    normalizePriority(task?.priority ?? 'Medium'),
  )
  const [dueDate, setDueDate] = useState(
    () => task?.dueDate ?? defaults.dueDate ?? '',
  )
  const [plannedDate, setPlannedDate] = useState(
    () => task?.plannedDate ?? defaults.plannedDate ?? '',
  )
  const [projectId, setProjectId] = useState(
    () =>
      task?.projectId ?? defaults.projectId ?? UNCATEGORIZED_PROJECT_ID,
  )
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false)
  const [recurrenceFrequency, setRecurrenceFrequency] = useState('none')
  const [recurrenceInterval, setRecurrenceInterval] = useState(1)
  const [recurrenceStartDate, setRecurrenceStartDate] = useState(
    () => task?.plannedDate ?? defaults.plannedDate ?? '',
  )
  const [recurrenceEndDate, setRecurrenceEndDate] = useState('')

  const activeProjects = projects.filter((project) => !project.archived)
  const currentProject = projects.find((project) => project.id === projectId)
  const selectableProjects =
    currentProject && currentProject.archived
      ? [...activeProjects, currentProject]
      : activeProjects
  const canSubmit = Boolean(title.trim() && selectableProjects.length > 0)

  useEscapeKey(true, () => {
    if (showDuplicateWarning) {
      setShowDuplicateWarning(false)
      return
    }
    onClose()
  })
  useFocusTrap(true, dialogRef, showDuplicateWarning ? 'duplicate' : 'form')

  useEffect(() => {
    if (!showDuplicateWarning) {
      titleRef.current?.focus()
    }
  }, [showDuplicateWarning])

  function commitSave() {
    const trimmedTitle = title.trim()
    if (!trimmedTitle) {
      return
    }

    onSave({
      id: task?.id ?? null,
      title: trimmedTitle,
      priority,
      dueDate: dueDate || null,
      plannedDate,
      projectId,
      recurrence:
        recurrenceFrequency === 'none'
          ? null
          : {
              frequency: recurrenceFrequency,
              interval: Math.max(1, Number(recurrenceInterval) || 1),
              startDate:
                recurrenceStartDate || plannedDate || dueDate || null,
              endDate: recurrenceEndDate || null,
            },
    })
  }

  function handleSubmit(event) {
    event.preventDefault()
    const trimmedTitle = title.trim()
    if (!trimmedTitle) {
      return
    }

    if (!isEditing && hasDuplicateTaskTitle(tasks, trimmedTitle)) {
      setShowDuplicateWarning(true)
      return
    }

    commitSave()
  }

  function handleOverlayClick() {
    if (showDuplicateWarning) {
      setShowDuplicateWarning(false)
      return
    }
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      {showDuplicateWarning ? (
        <div
          ref={dialogRef}
          className="modal"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="duplicate-warning-title"
          aria-describedby="duplicate-warning-text"
          tabIndex={-1}
          onClick={(event) => event.stopPropagation()}
        >
          <h2 id="duplicate-warning-title">Duplicate task</h2>
          <p id="duplicate-warning-text" className="modal-message">
            A task with this name already exists.
          </p>
          <div className="modal-actions">
            <button
              type="button"
              className="modal-btn modal-btn-cancel"
              onClick={() => setShowDuplicateWarning(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="modal-btn modal-btn-create"
              onClick={commitSave}
            >
              Create Anyway
            </button>
          </div>
        </div>
      ) : (
        <div
          ref={dialogRef}
          className="modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          tabIndex={-1}
          onClick={(event) => event.stopPropagation()}
        >
          <h2 id="modal-title">{isEditing ? 'Edit task' : 'New task'}</h2>

          <form onSubmit={handleSubmit}>
            <label className="modal-field">
              <span className="modal-label">Title</span>
              <input
                ref={titleRef}
                type="text"
                className="modal-input"
                placeholder="What needs to get done?"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                required
                data-autofocus
              />
            </label>

            <label className="modal-field">
              <span className="modal-label">Project</span>
              <select
                className="modal-select"
                value={projectId}
                onChange={(event) => setProjectId(event.target.value)}
              >
                {selectableProjects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.icon} {project.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="modal-field-row">
              <label className="modal-field">
                <span className="modal-label">Priority</span>
                <select
                  className="modal-select"
                  value={priority}
                  onChange={(event) => setPriority(event.target.value)}
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </label>

              <label className="modal-field">
                <span className="modal-label">
                  Due date{' '}
                  <span className="modal-optional">(optional)</span>
                </span>
                <input
                  type="date"
                  className="modal-input"
                  value={dueDate}
                  onChange={(event) => setDueDate(event.target.value)}
                />
              </label>
            </div>

            <label className="modal-field">
              <span className="modal-label">
                Plan for{' '}
                <span className="modal-optional">(optional)</span>
              </span>
              <input
                type="date"
                className="modal-input"
                value={plannedDate}
                onChange={(event) => setPlannedDate(event.target.value)}
              />
              <span className="modal-hint">
                When you want to work on it in the Planner. Due date is the
                deadline.
              </span>
            </label>

            {!isEditing && (
              <>
                <div className="modal-field-row">
                  <label className="modal-field">
                    <span className="modal-label">Repeat</span>
                    <select
                      className="modal-select"
                      value={recurrenceFrequency}
                      onChange={(event) =>
                        setRecurrenceFrequency(event.target.value)
                      }
                    >
                      {RECURRENCE_FREQUENCIES.map((frequency) => (
                        <option key={frequency} value={frequency}>
                          {frequency === 'none'
                            ? 'Does not repeat'
                            : frequency === 'custom'
                              ? 'Custom (every N days)'
                              : frequency === 'weekdays'
                                ? 'Weekdays (Mon–Fri)'
                                : frequency.charAt(0).toUpperCase() +
                                  frequency.slice(1)}
                        </option>
                      ))}
                    </select>
                  </label>
                  {recurrenceFrequency !== 'none' &&
                    recurrenceFrequency !== 'weekdays' && (
                      <label className="modal-field">
                        <span className="modal-label">Every</span>
                        <input
                          type="number"
                          min="1"
                          className="modal-input"
                          value={recurrenceInterval}
                          onChange={(event) =>
                            setRecurrenceInterval(event.target.value)
                          }
                        />
                      </label>
                    )}
                </div>
                {recurrenceFrequency !== 'none' && (
                  <>
                    <div className="modal-field-row">
                      <label className="modal-field">
                        <span className="modal-label">Series start</span>
                        <input
                          type="date"
                          className="modal-input"
                          value={recurrenceStartDate || plannedDate}
                          onChange={(event) =>
                            setRecurrenceStartDate(event.target.value)
                          }
                          required
                        />
                      </label>
                      <label className="modal-field">
                        <span className="modal-label">Series end</span>
                        <input
                          type="date"
                          className="modal-input"
                          value={recurrenceEndDate}
                          onChange={(event) =>
                            setRecurrenceEndDate(event.target.value)
                          }
                        />
                      </label>
                    </div>
                    <p className="modal-hint">
                      {formatRecurrenceLabel({
                        frequency: recurrenceFrequency,
                        interval: Number(recurrenceInterval) || 1,
                      })}
                      . The Planner expands this series across every matching
                      date in the range.
                    </p>
                  </>
                )}
              </>
            )}

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
                {isEditing ? 'Save changes' : 'Add task'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

export default TaskModal
