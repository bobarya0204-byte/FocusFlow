import {
  buildCreateFocusSessionPayload,
  buildUpdateFocusSessionPayload,
  mapRowToFocusSession,
} from '../utils/focusSessionMapper.js'

const SESSION_COLUMNS = `
  Id,
  OwnerId,
  TaskId,
  Mode,
  Status,
  DurationMinutes,
  DurationSeconds,
  TaskTitle,
  CompletedAt,
  CreatedAt
`

export class FocusSessionRepository {
  /**
   * @param {import('better-sqlite3').Database} db
   */
  constructor(db) {
    this.db = db

    this.selectAllStmt = db.prepare(`
      SELECT ${SESSION_COLUMNS}
      FROM FocusSessions
      WHERE OwnerId = ?
      ORDER BY CompletedAt DESC
    `)

    this.selectByIdStmt = db.prepare(`
      SELECT ${SESSION_COLUMNS}
      FROM FocusSessions
      WHERE Id = ? AND OwnerId = ?
    `)

    this.insertStmt = db.prepare(`
      INSERT INTO FocusSessions (
        Id,
        OwnerId,
        TaskId,
        Mode,
        Status,
        DurationMinutes,
        DurationSeconds,
        TaskTitle,
        CompletedAt,
        CreatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    this.updateStmt = db.prepare(`
      UPDATE FocusSessions
      SET
        TaskId = ?,
        Mode = ?,
        Status = ?,
        DurationMinutes = ?,
        DurationSeconds = ?,
        TaskTitle = ?,
        CompletedAt = ?
      WHERE Id = ? AND OwnerId = ?
    `)

    this.deleteStmt = db.prepare(`
      DELETE FROM FocusSessions
      WHERE Id = ? AND OwnerId = ?
    `)
  }

  /**
   * @param {string} ownerId
   * @returns {Record<string, unknown>[]}
   */
  getAllSessions(ownerId) {
    return this.selectAllStmt.all(ownerId).map(mapRowToFocusSession)
  }

  /**
   * @param {string} sessionId
   * @param {string} [ownerId]
   * @returns {Record<string, unknown>|null}
   */
  getSessionById(sessionId, ownerId) {
    return mapRowToFocusSession(this.selectByIdStmt.get(sessionId, ownerId))
  }

  /**
   * @param {Record<string, unknown>} sessionInput
   * @returns {Record<string, unknown>}
   */
  createSession(sessionInput) {
    const ownerId =
      typeof sessionInput.ownerId === 'string' ? sessionInput.ownerId : null
    if (!ownerId) {
      throw new Error('Session ownerId is required')
    }
    const built = buildCreateFocusSessionPayload(sessionInput, ownerId)

    if (built.error) {
      throw new Error(built.error)
    }

    const session = built.session

    this.insertStmt.run(
      session.id,
      session.ownerId,
      session.taskId,
      session.mode,
      session.status,
      session.durationMinutes,
      session.durationSeconds,
      session.taskTitle,
      session.completedAt,
      session.createdAt,
    )

    return this.getSessionById(session.id, session.ownerId)
  }

  /**
   * @param {string} sessionId
   * @param {Record<string, unknown>} updates
   * @param {string} [ownerId]
   * @returns {Record<string, unknown>|null}
   */
  updateSession(sessionId, updates, ownerId) {
    const existing = this.getSessionById(sessionId, ownerId)
    if (!existing) {
      return null
    }

    const built = buildUpdateFocusSessionPayload(existing, updates)
    const session = built.session

    const result = this.updateStmt.run(
      session.taskId,
      session.mode,
      session.status,
      session.durationMinutes,
      session.durationSeconds,
      session.taskTitle,
      session.completedAt,
      sessionId,
      ownerId,
    )

    if (result.changes === 0) {
      return null
    }

    return this.getSessionById(sessionId, ownerId)
  }

  /**
   * @param {string} sessionId
   * @param {string} [ownerId]
   * @returns {boolean}
   */
  deleteSession(sessionId, ownerId) {
    const result = this.deleteStmt.run(sessionId, ownerId)
    return result.changes > 0
  }
}
