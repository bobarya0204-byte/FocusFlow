import {
  DEFAULT_WORKSPACE_ID,
  LOCAL_USER_ID,
  UNCATEGORIZED_PROJECT_ID,
} from '../constants/auth.js'

/**
 * Resolve the workspace id used for project FK storage.
 * @param {string} ownerId
 */
export function getWorkspaceIdForOwner(ownerId) {
  if (ownerId === LOCAL_USER_ID) {
    return DEFAULT_WORKSPACE_ID
  }
  return ownerId
}

/**
 * Internal storage id for a workspace system (uncategorized) project.
 * @param {string} workspaceId
 */
export function getSystemProjectStorageId(workspaceId) {
  return `${UNCATEGORIZED_PROJECT_ID}@${workspaceId}`
}

/**
 * Resolve API-facing project id to the value stored in SQLite.
 * @param {string} workspaceId
 * @param {string} projectId
 */
export function resolveProjectIdForStorage(workspaceId, projectId) {
  if (projectId !== UNCATEGORIZED_PROJECT_ID) {
    return projectId
  }

  if (workspaceId === DEFAULT_WORKSPACE_ID) {
    return UNCATEGORIZED_PROJECT_ID
  }

  return getSystemProjectStorageId(workspaceId)
}

/**
 * Map stored project id to the public API id expected by the frontend.
 * @param {string} storedProjectId
 * @param {string} [ownerId]
 */
export function toApiProjectId(storedProjectId, ownerId) {
  if (storedProjectId === UNCATEGORIZED_PROJECT_ID) {
    return UNCATEGORIZED_PROJECT_ID
  }

  if (ownerId) {
    const workspaceId = getWorkspaceIdForOwner(ownerId)
    if (storedProjectId === getSystemProjectStorageId(workspaceId)) {
      return UNCATEGORIZED_PROJECT_ID
    }
  }

  if (storedProjectId.startsWith(`${UNCATEGORIZED_PROJECT_ID}@`)) {
    return UNCATEGORIZED_PROJECT_ID
  }

  return storedProjectId
}

/**
 * @param {import('better-sqlite3').Statement} row
 */
export function mapRowToApiProject(row) {
  if (!row) {
    return null
  }

  return {
    id: row.IsSystem
      ? UNCATEGORIZED_PROJECT_ID
      : toApiProjectId(row.Id, row.WorkspaceId),
    workspaceId: row.WorkspaceId,
    name: row.Name,
    description: row.Description,
    color: row.Color,
    icon: row.Icon,
    isSystem: Boolean(row.IsSystem),
    archived: Boolean(row.Archived),
    deleted: Boolean(row.Deleted),
    deletedAt: row.DeletedAt,
    createdAt: row.CreatedAt,
    updatedAt: row.UpdatedAt,
  }
}
