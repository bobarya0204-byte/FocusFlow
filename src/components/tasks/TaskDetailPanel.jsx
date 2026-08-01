import { useEffect, useMemo, useRef, useState } from 'react'
import { X } from 'lucide-react'
import IconButton from '../ui/IconButton'
import { useEscapeKey } from '../../hooks/useEscapeKey'
import { useFocusTrap } from '../../hooks/useFocusTrap'
import {
  TASK_STATUSES,
  normalizeEstimatedMinutes,
  normalizePriority,
  normalizeTaskStatus,
} from '../../utils/tasks'
import {
  RECURRENCE_FREQUENCIES,
  formatRecurrenceLabel,
  normalizeRecurrence,
} from '../../utils/recurrence'
import { formatDueDate } from '../../utils/tasks'

function formatTimestamp(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function TaskDetailPanel({
  task,
  projects,
  onClose,
  onSave,
  onDelete,
}) {
  const panelRef = useRef(null)
  const titleRef = useRef(null)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [notes, setNotes] = useState('')
  const [priority, setPriority] = useState('Medium')
  const [status, setStatus] = useState('Open')
  const [projectId, setProjectId] = useState('')
  const [plannedDate, setPlannedDate] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [estimatedMinutes, setEstimatedMinutes] = useState('')
  const [recurrenceFrequency, setRecurrenceFrequency] = useState('none')
  const [recurrenceInterval, setRecurrenceInterval] = useState(1)

  useEscapeKey(Boolean(task), onClose)
  useFocusTrap(Boolean(task), panelRef)

  useEffect(() => {
    if (!task) return
    setTitle(task.title || '')
    setDescription(task.description || '')
    setNotes(task.notes || '')
    setPriority(normalizePriority(task.priority))
    setStatus(normalizeTaskStatus(task.status, task.completed))
    setProjectId(task.projectId || '')
    setPlannedDate(task.plannedDate || '')
    setDueDate(task.dueDate || '')
    setEstimatedMinutes(
      task.estimatedMinutes != null ? String(task.estimatedMinutes) : '',
    )
    const recurrence = normalizeRecurrence(task.recurrence)
    setRecurrenceFrequency(recurrence?.frequency || 'none')
    setRecurrenceInterval(recurrence?.interval || 1)
  }, [task])

  useEffect(() => {
    if (task) {
      titleRef.current?.focus()
    }
  }, [task?.id])

  const activeProjects = useMemo(
    () => projects.filter((project) => !project.archived),
    [projects],
  )

  const currentProject = projects.find((project) => project.id === projectId)
  const selectableProjects =
    currentProject && currentProject.archived
      ? [...activeProjects, currentProject]
      : activeProjects

  if (!task) {
    return null
  }

  function handleSave(event) {
    event.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) return

    const nextStatus = normalizeTaskStatus(status, status === 'Completed')
    onSave({
      id: task.id,
      title: trimmed,
      description: description.trim(),
      notes: notes.trim(),
      priority,
      status: nextStatus,
      projectId,
      plannedDate: plannedDate || null,
      dueDate: dueDate || null,
      estimatedMinutes: normalizeEstimatedMinutes(estimatedMinutes),
      recurrence:
        recurrenceFrequency === 'none'
          ? null
          : {
              frequency: recurrenceFrequency,
              interval: Math.max(1, Number(recurrenceInterval) || 1),
            },
    })
  }

  return (
    <div className="ff-drawer-overlay planner-drawer-overlay" onClick={onClose}>
      <aside
        ref={panelRef}
        className="ff-side-panel task-detail-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-detail-title"
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="task-detail-header">
          <div>
            <p className="task-detail-eyebrow">Task detail</p>
            <h2 id="task-detail-title">Workspace</h2>
          </div>
          <IconButton label="Close task detail" onClick={onClose}>
            <X size={16} strokeWidth={1.75} />
          </IconButton>
        </header>

        <form className="task-detail-form" onSubmit={handleSave}>
          <label className="modal-field">
            <span className="modal-label">Title</span>
            <input
              ref={titleRef}
              className="modal-input"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
              data-autofocus
            />
          </label>

          <label className="modal-field">
            <span className="modal-label">Description</span>
            <textarea
              className="modal-input modal-textarea"
              rows={3}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="What is this task about?"
            />
          </label>

          <label className="modal-field">
            <span className="modal-label">Notes</span>
            <textarea
              className="modal-input modal-textarea"
              rows={3}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Scratchpad, links, reminders…"
            />
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
              <span className="modal-label">Status</span>
              <select
                className="modal-select"
                value={status}
                onChange={(event) => setStatus(event.target.value)}
              >
                {TASK_STATUSES.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </div>

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
              <span className="modal-label">Planned date</span>
              <input
                type="date"
                className="modal-input"
                value={plannedDate}
                onChange={(event) => setPlannedDate(event.target.value)}
              />
            </label>
            <label className="modal-field">
              <span className="modal-label">Due date</span>
              <input
                type="date"
                className="modal-input"
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
              />
            </label>
          </div>

          <label className="modal-field">
            <span className="modal-label">Estimated duration (minutes)</span>
            <input
              type="number"
              min="0"
              step="5"
              className="modal-input"
              value={estimatedMinutes}
              onChange={(event) => setEstimatedMinutes(event.target.value)}
              placeholder="e.g. 25"
            />
          </label>

          <div className="modal-field-row">
            <label className="modal-field">
              <span className="modal-label">Repeat</span>
              <select
                className="modal-select"
                value={recurrenceFrequency}
                onChange={(event) => setRecurrenceFrequency(event.target.value)}
              >
                {RECURRENCE_FREQUENCIES.map((frequency) => (
                  <option key={frequency} value={frequency}>
                    {frequency === 'none'
                      ? 'Does not repeat'
                      : frequency === 'custom'
                        ? 'Custom (every N days)'
                        : frequency.charAt(0).toUpperCase() + frequency.slice(1)}
                  </option>
                ))}
              </select>
            </label>
            {recurrenceFrequency !== 'none' && (
              <label className="modal-field">
                <span className="modal-label">Every</span>
                <input
                  type="number"
                  min="1"
                  className="modal-input"
                  value={recurrenceInterval}
                  onChange={(event) => setRecurrenceInterval(event.target.value)}
                />
              </label>
            )}
          </div>

          {recurrenceFrequency !== 'none' && (
            <p className="modal-hint">
              {formatRecurrenceLabel({
                frequency: recurrenceFrequency,
                interval: Number(recurrenceInterval) || 1,
              })}
              . Completing this task creates the next occurrence without erasing
              history.
            </p>
          )}

          <div className="task-detail-meta">
            <div>
              <span className="modal-label">Created</span>
              <p>{formatTimestamp(task.createdAt)}</p>
            </div>
            <div>
              <span className="modal-label">Completed</span>
              <p>
                {task.completedAt
                  ? formatTimestamp(task.completedAt)
                  : task.dueDate
                    ? `Due ${formatDueDate(task.dueDate)}`
                    : '—'}
              </p>
            </div>
          </div>

          <section className="task-detail-future" aria-label="Coming soon">
            <h3>Coming later</h3>
            <ul>
              <li>Attachments</li>
              <li>Comments</li>
              <li>AI Suggestions</li>
              <li>Activity History</li>
            </ul>
          </section>

          <div className="modal-actions task-detail-actions">
            <button
              type="button"
              className="modal-btn modal-btn-cancel"
              onClick={() => onDelete?.(task.id)}
            >
              Delete
            </button>
            <button type="button" className="modal-btn modal-btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="modal-btn modal-btn-create">
              Save changes
            </button>
          </div>
        </form>
      </aside>
    </div>
  )
}

export default TaskDetailPanel
