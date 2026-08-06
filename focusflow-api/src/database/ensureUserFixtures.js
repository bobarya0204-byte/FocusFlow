import {
  getSystemProjectStorageId,
  getWorkspaceIdForOwner,
} from '../utils/workspace.js'

/**
 * Ensures user, workspace, and system project rows exist for an authenticated caller.
 *
 * @param {import('better-sqlite3').Database} db
 * @param {{
 *   oid: string,
 *   tenantId?: string|null,
 *   email?: string|null,
 *   displayName?: string|null,
 * }} authUser
 */
export function ensureUserFixtures(db, authUser) {
  const ownerId = authUser.oid
  const workspaceId = getWorkspaceIdForOwner(ownerId)
  const systemProjectId = getSystemProjectStorageId(workspaceId)
  const displayName = authUser.displayName || 'FocusFlow User'
  const email = authUser.email || null
  const tenantId = authUser.tenantId || null

  db.transaction(() => {
    db.prepare(
      `INSERT INTO Users (Id, EntraObjectId, DisplayName, Email, TenantId)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(Id) DO UPDATE SET
         EntraObjectId = excluded.EntraObjectId,
         DisplayName = excluded.DisplayName,
         Email = COALESCE(excluded.Email, Users.Email),
         TenantId = COALESCE(excluded.TenantId, Users.TenantId),
         UpdatedAt = datetime('now')`,
    ).run(ownerId, ownerId, displayName, email, tenantId)

    db.prepare(
      `INSERT OR IGNORE INTO Workspace (Id, Name, TenantId, OwnerUserId)
       VALUES (?, ?, ?, ?)`,
    ).run(workspaceId, 'My Workspace', tenantId, ownerId)

    db.prepare(
      `INSERT OR IGNORE INTO Projects (
         Id, WorkspaceId, Name, Description, Color, Icon, IsSystem
       ) VALUES (?, ?, ?, ?, ?, ?, 1)`,
    ).run(
      systemProjectId,
      workspaceId,
      'Uncategorized',
      'Tasks without a specific project',
      '#8b93a7',
      '📁',
    )
  })()
}
