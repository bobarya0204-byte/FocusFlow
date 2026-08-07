import { useEffect, useMemo, useRef, useState } from 'react'
import { X } from 'lucide-react'
import IconButton from '../ui/IconButton'
import SeriesScopeDialog from './SeriesScopeDialog'
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
  isMasterRecurringTask,
  normalizeRecurrence,
} from '../../utils/recurrence'
import {
  SERIES_SCOPES,
  isRecurringSeriesMember,
} from '../../utils/recurrenceSeries'
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

const EDIT_SCOPE_OPTIONS = [
  { id: SERIES_SCOPES.OCCURRENCE, label: 'This occurrence only' },
  { id: SERIES_SCOPES.FUTURE, label: 'This and future occurrences' },
  { id: SERIES_SCOPES.SERIES, label: 'Entire series' },
]

function TaskDetailPanel({
  task,
  tasks = [],
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
  const [recurrenceStartDate, setRecurrenceStartDate] = useState('')
  const [recurrenceEndDate, setRecurrenceEndDate] = useState('')
  const [seriesScope, setSeriesScope] = useState(SERIES_SCOPES.OCCURRENCE)
  const [showDeleteScope, setShowDeleteScope] = useState(false)

  useEscapeKey(Boolean(task) && !showDeleteScope, onClose)
  useFocusTrap(Boolean(task) && !showDeleteScope, panelRef)

  const masterTask = useMemo(() => {
    if (!task?.masterId) {
      return task
    }
    return tasks.find((item) => item.id === task.masterId) ?? task
  }, [task, tasks])

  useEffect(() => {
    if (!task) return
    setTitle(task.title || '')
    setDescription(task.description || '')
    setNotes(task.notes || '')
    setPriority(normalizePriority(task.priority))
    setStatus(normalizeTaskStatus(task.status, task.completed))
    setProjectId(task.projectId || '')
    setPlannedDate(task.plannedDate || task.occurrenceDate || '')
    setDueDate(task.dueDate || '')
    setEstimatedMinutes(
      task.estimatedMinutes != null ? String(task.estimatedMinutes) : '',
    )
    const recurrence = normalizeRecurrence(masterTask?.recurrence ?? task.recurrence)
    setRecurrenceFrequency(recurrence?.frequency || 'none')
    setRecurrenceInterval(recurrence?.interval || 1)
    setRecurrenceStartDate(recurrence?.startDate || task.occurrenceDate || '')
    setRecurrenceEndDate(recurrence?.endDate || '')
    setSeriesScope(
      task.isVirtualOccurrence
        ? SERIES_SCOPES.OCCURRENCE
        : SERIES_SCOPES.SERIES,
    )
  }, [task, masterTask])

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

  const showSeriesScope = useMemo(
    () =>
      task
        ? task.isVirtualOccurrence ||
          isMasterRecurringTask(masterTask ?? task) ||
          isRecurringSeriesMember(task, tasks)
        : false,
    [task, tasks, masterTask],
  )

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
              startDate: recurrenceStartDate || plannedDate || null,
              endDate: recurrenceEndDate || null,
            },
      seriesScope: showSeriesScope ? seriesScope : SERIES_SCOPES.OCCURRENCE,
    })
  }

  function handleDeleteConfirm(scope) {
    setShowDeleteScope(false)
    onDelete?.(task.id, { seriesScope: scope })
  }

  function handleDrawerOverlayClick() {
    if (showDeleteScope) {
      return
    }
    onClose()
  }

  return (
    <>
      {showDeleteScope && (
        <SeriesScopeDialog
          stacked
          onCancel={() => setShowDeleteScope(false)}
          onConfirm={handleDeleteConfirm}
        />
      )}

      <div
        className="ff-drawer-overlay planner-drawer-overlay"
        inert={showDeleteScope ? true : undefined}
        aria-hidden={showDeleteScope ? true : undefined}
        onClick={handleDrawerOverlayClick}
      >
        <aside
          ref={panelRef}
          className="ff-side-panel task-detail-panel"
          role="dialog"
          aria-modal={!showDeleteScope}
          aria-labelledby="task-detail-title"
          aria-hidden={showDeleteScope ? true : undefined}
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
            <div className="task-detail-body">
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
                          : frequency === 'weekdays'
                            ? 'Weekdays (Mon–Fri)'
                            : frequency.charAt(0).toUpperCase() + frequency.slice(1)}
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
                      onChange={(event) => setRecurrenceInterval(event.target.value)}
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
                      value={recurrenceStartDate}
                      onChange={(event) => setRecurrenceStartDate(event.target.value)}
                      required
                    />
                  </label>
                  <label className="modal-field">
                    <span className="modal-label">Series end</span>
                    <input
                      type="date"
                      className="modal-input"
                      value={recurrenceEndDate}
                      onChange={(event) => setRecurrenceEndDate(event.target.value)}
                    />
                  </label>
                </div>
                <p className="modal-hint">
                  {formatRecurrenceLabel({
                    frequency: recurrenceFrequency,
                    interval: Number(recurrenceInterval) || 1,
                  })}
                  . Occurrences render in the Planner between the start and end
                  dates. Completing one date does not complete the whole series.
                </p>
              </>
            )}

            {showSeriesScope && (
              <label className="modal-field">
                <span className="modal-label">Apply changes to</span>
                <select
                  className="modal-select"
                  value={seriesScope}
                  onChange={(event) => setSeriesScope(event.target.value)}
                >
                  {EDIT_SCOPE_OPTIONS.map(({ id, label }) => (
                    <option key={id} value={id}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
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
            </div>

            <div className="modal-actions task-detail-actions">
              <button
                type="button"
                className="modal-btn modal-btn-cancel"
                onClick={() =>
                  showSeriesScope ? setShowDeleteScope(true) : onDelete?.(task.id)
                }
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
    </>
  )
}

export default TaskDetailPanel
