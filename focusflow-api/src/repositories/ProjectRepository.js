import { UNCATEGORIZED_PROJECT_ID } from '../constants/auth.js'
import {
  buildCreateProjectPayload,
  buildUpdateProjectPayload,
} from '../utils/projectMapper.js'
import {
  getWorkspaceIdForOwner,
  mapRowToApiProject,
  resolveProjectIdForStorage,
} from '../utils/workspace.js'

const PROJECT_COLUMNS = `
  Id,
  WorkspaceId,
  Name,
  Description,
  Color,
  Icon,
  IsSystem,
  Archived,
  Deleted,
  DeletedAt,
  CreatedAt,
  UpdatedAt
`

export class ProjectRepository {
  /**
   * @param {import('better-sqlite3').Database} db
   */
  constructor(db) {
    this.db = db

    this.selectAllStmt = db.prepare(`
      SELECT ${PROJECT_COLUMNS}
      FROM Projects
      WHERE WorkspaceId = ?
        AND Deleted = 0
      ORDER BY IsSystem DESC, CreatedAt ASC
    `)

    this.selectByIdStmt = db.prepare(`
      SELECT ${PROJECT_COLUMNS}
      FROM Projects
      WHERE Id = ? AND WorkspaceId = ? AND Deleted = 0
    `)

    this.selectSystemByWorkspaceStmt = db.prepare(`
      SELECT ${PROJECT_COLUMNS}
      FROM Projects
      WHERE WorkspaceId = ? AND IsSystem = 1 AND Deleted = 0
      LIMIT 1
    `)

    this.insertStmt = db.prepare(`
      INSERT INTO Projects (
        Id,
        WorkspaceId,
        Name,
        Description,
        Color,
        Icon,
        IsSystem,
        Archived,
        Deleted,
        DeletedAt,
        CreatedAt,
        UpdatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    this.updateStmt = db.prepare(`
      UPDATE Projects
      SET
        Name = ?,
        Description = ?,
        Color = ?,
        Icon = ?,
        Archived = ?,
        Deleted = ?,
        DeletedAt = ?,
        UpdatedAt = ?
      WHERE Id = ? AND WorkspaceId = ? AND IsSystem = 0
    `)

    this.archiveStmt = db.prepare(`
      UPDATE Projects
      SET
        Archived = 1,
        UpdatedAt = ?
      WHERE Id = ? AND WorkspaceId = ? AND IsSystem = 0 AND Deleted = 0
    `)
  }

  /**
   * @param {string} projectId
   * @param {string} workspaceId
   * @returns {Record<string, unknown>|null}
   */
  #findProject(projectId, workspaceId) {
    if (projectId === UNCATEGORIZED_PROJECT_ID) {
      return mapRowToApiProject(
        this.selectSystemByWorkspaceStmt.get(workspaceId),
      )
    }

    const storageId = resolveProjectIdForStorage(workspaceId, projectId)
    return mapRowToApiProject(
      this.selectByIdStmt.get(storageId, workspaceId),
    )
  }

  /**
   * @param {string} ownerId
   * @returns {Record<string, unknown>[]}
   */
  getAllProjects(ownerId) {
    const workspaceId = getWorkspaceIdForOwner(ownerId)
    return this.selectAllStmt.all(workspaceId).map(mapRowToApiProject)
  }

  /**
   * @param {string} projectId
   * @param {string} ownerId
   * @returns {Record<string, unknown>|null}
   */
  getProjectById(projectId, ownerId) {
    const workspaceId = getWorkspaceIdForOwner(ownerId)
    return this.#findProject(projectId, workspaceId)
  }

  /**
   * @param {Record<string, unknown>} projectInput
   * @param {string} ownerId
   * @returns {Record<string, unknown>}
   */
  createProject(projectInput, ownerId) {
    const workspaceId = getWorkspaceIdForOwner(ownerId)
    const built = buildCreateProjectPayload(projectInput, workspaceId)
    if (built.error) {
      throw new Error(built.error)
    }

    const project = built.project

    this.insertStmt.run(
      project.id,
      project.workspaceId,
      project.name,
      project.description,
      project.color,
      project.icon,
      0,
      project.archived ? 1 : 0,
      0,
      null,
      project.createdAt,
      project.updatedAt,
    )

    return this.getProjectById(project.id, ownerId)
  }

  /**
   * @param {string} projectId
   * @param {Record<string, unknown>} updates
   * @param {string} ownerId
   * @returns {Record<string, unknown>|null}
   */
  updateProject(projectId, updates, ownerId) {
    const workspaceId = getWorkspaceIdForOwner(ownerId)

    if (projectId === UNCATEGORIZED_PROJECT_ID) {
      return null
    }

    const existing = this.getProjectById(projectId, ownerId)
    if (!existing) {
      return null
    }

    const built = buildUpdateProjectPayload(existing, updates)
    if (built.error) {
      throw new Error(built.error)
    }

    const project = built.project
    const storageId = resolveProjectIdForStorage(workspaceId, projectId)

    const result = this.updateStmt.run(
      project.name,
      project.description,
      project.color,
      project.icon,
      project.archived ? 1 : 0,
      project.deleted ? 1 : 0,
      project.deletedAt,
      project.updatedAt,
      storageId,
      workspaceId,
    )

    if (result.changes === 0) {
      return null
    }

    return project.deleted
      ? mapRowToApiProject({
          ...project,
          Id: storageId,
          WorkspaceId: workspaceId,
          IsSystem: 0,
        })
      : this.getProjectById(projectId, ownerId)
  }

  /**
   * Archive a project (does not soft-delete).
   * @param {string} projectId
   * @param {string} ownerId
   * @returns {boolean}
   */
  archiveProject(projectId, ownerId) {
    const workspaceId = getWorkspaceIdForOwner(ownerId)

    if (projectId === UNCATEGORIZED_PROJECT_ID) {
      return false
    }

    const storageId = resolveProjectIdForStorage(workspaceId, projectId)
    const now = new Date().toISOString()
    const result = this.archiveStmt.run(now, storageId, workspaceId)
    return result.changes > 0
  }
}
