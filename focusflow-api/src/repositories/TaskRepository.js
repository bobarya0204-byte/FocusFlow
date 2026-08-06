import { UNCATEGORIZED_PROJECT_ID } from '../constants/auth.js'
import {
  buildCreateTaskPayload,
  buildUpdateTaskPayload,
  mapRowToTaskRow,
} from '../utils/taskMapper.js'
import { serializeRecurrence, serializeRecurrenceState } from '../utils/recurrence.js'
import {
  getWorkspaceIdForOwner,
  resolveProjectIdForStorage,
} from '../utils/workspace.js'

const TASK_COLUMNS = `
  Id,
  OwnerId,
  ProjectId,
  Title,
  Description,
  Notes,
  Priority,
  Status,
  DueDate,
  PlannedDate,
  EstimatedMinutes,
  CompletedAt,
  SeriesId,
  OccurrenceDate,
  RecurrenceJson,
  RecurrenceStateJson,
  Deleted,
  DeletedAt,
  CreatedAt,
  UpdatedAt
`

export class TaskRepository {
  /**
   * @param {import('better-sqlite3').Database} db
   */
  constructor(db) {
    this.db = db

    this.selectAllStmt = db.prepare(`
      SELECT ${TASK_COLUMNS}
      FROM Tasks
      WHERE OwnerId = ? AND Deleted = 0
      ORDER BY CreatedAt DESC
    `)

    this.selectByIdStmt = db.prepare(`
      SELECT ${TASK_COLUMNS}
      FROM Tasks
      WHERE Id = ? AND OwnerId = ? AND Deleted = 0
    `)

    this.insertStmt = db.prepare(`
      INSERT INTO Tasks (
        Id,
        OwnerId,
        ProjectId,
        Title,
        Description,
        Notes,
        Priority,
        Status,
        DueDate,
        PlannedDate,
        EstimatedMinutes,
        CompletedAt,
        SeriesId,
        OccurrenceDate,
        RecurrenceJson,
        RecurrenceStateJson,
        Deleted,
        DeletedAt,
        CreatedAt,
        UpdatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    this.updateStmt = db.prepare(`
      UPDATE Tasks
      SET
        ProjectId = ?,
        Title = ?,
        Description = ?,
        Notes = ?,
        Priority = ?,
        Status = ?,
        DueDate = ?,
        PlannedDate = ?,
        EstimatedMinutes = ?,
        CompletedAt = ?,
        SeriesId = ?,
        OccurrenceDate = ?,
        RecurrenceJson = ?,
        RecurrenceStateJson = ?,
        UpdatedAt = ?
      WHERE Id = ? AND OwnerId = ? AND Deleted = 0
    `)

    this.softDeleteStmt = db.prepare(`
      UPDATE Tasks
      SET
        Deleted = 1,
        DeletedAt = ?,
        UpdatedAt = ?
      WHERE Id = ? AND OwnerId = ? AND Deleted = 0
    `)
  }

  /**
   * @param {string} ownerId
   * @returns {Record<string, unknown>[]}
   */
  getAllTasks(ownerId) {
    return this.selectAllStmt
      .all(ownerId)
      .map((row) => mapRowToTaskRow(row, ownerId))
  }

  /**
   * @param {string} taskId
   * @param {string} ownerId
   * @returns {Record<string, unknown>|null}
   */
  getTaskById(taskId, ownerId) {
    return mapRowToTaskRow(this.selectByIdStmt.get(taskId, ownerId), ownerId)
  }

  /**
   * @param {Record<string, unknown>} taskInput
   * @returns {Record<string, unknown>}
   */
  createTask(taskInput) {
    const ownerId =
      typeof taskInput.ownerId === 'string' ? taskInput.ownerId : null
    if (!ownerId) {
      throw new Error('Task ownerId is required')
    }

    const workspaceId = getWorkspaceIdForOwner(ownerId)
    const built = buildCreateTaskPayload(taskInput, ownerId)

    if (built.error) {
      throw new Error(built.error)
    }

    const task = built.task
    const projectId = resolveProjectIdForStorage(
      workspaceId,
      task.projectId || UNCATEGORIZED_PROJECT_ID,
    )

    this.insertStmt.run(
      task.id,
      task.ownerId,
      projectId,
      task.title,
      task.description,
      task.notes,
      task.priority,
      task.status,
      task.dueDate,
      task.plannedDate,
      task.estimatedMinutes,
      task.completedAt,
      task.seriesId,
      task.occurrenceDate,
      serializeRecurrence(task.recurrence),
      serializeRecurrenceState(task.recurrenceState),
      0,
      null,
      task.createdAt,
      task.updatedAt,
    )

    return this.getTaskById(task.id, task.ownerId)
  }

  /**
   * @param {string} taskId
   * @param {Record<string, unknown>} updates
   * @param {string} ownerId
   * @returns {Record<string, unknown>|null}
   */
  updateTask(taskId, updates, ownerId) {
    const existing = this.getTaskById(taskId, ownerId)
    if (!existing) {
      return null
    }

    const built = buildUpdateTaskPayload(existing, updates)
    if (built.error) {
      throw new Error(built.error)
    }

    const task = built.task
    const workspaceId = getWorkspaceIdForOwner(ownerId)
    const projectId = resolveProjectIdForStorage(workspaceId, task.projectId)

    const result = this.updateStmt.run(
      projectId,
      task.title,
      task.description,
      task.notes,
      task.priority,
      task.status,
      task.dueDate,
      task.plannedDate,
      task.estimatedMinutes,
      task.completedAt,
      task.seriesId,
      task.occurrenceDate,
      serializeRecurrence(task.recurrence),
      serializeRecurrenceState(task.recurrenceState),
      task.updatedAt,
      taskId,
      ownerId,
    )

    if (result.changes === 0) {
      return null
    }

    const saved = this.getTaskById(taskId, ownerId)
    if (!saved) {
      return null
    }

    // Echo recurrence fields from the write payload so the PUT response always
    // matches what was persisted (guards mapper/read edge cases).
    if ('recurrence' in updates) {
      saved.recurrence = task.recurrence
    }
    if ('recurrenceState' in updates) {
      saved.recurrenceState = task.recurrenceState
    }

    return saved
  }

  /**
   * @param {string} taskId
   * @param {string} ownerId
   * @returns {boolean}
   */
  softDeleteTask(taskId, ownerId) {
    const now = new Date().toISOString()
    const result = this.softDeleteStmt.run(now, now, taskId, ownerId)
    return result.changes > 0
  }
}
