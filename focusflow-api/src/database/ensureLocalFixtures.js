import {
  DEFAULT_WORKSPACE_ID,
  LOCAL_TENANT_ID,
  LOCAL_USER_ID,
  UNCATEGORIZED_PROJECT_ID,
} from '../constants/auth.js'

/**
 * Ensures FK targets exist for local development CRUD.
 * Inserts no task sample data — only user, workspace, and system project.
 *
 * @param {import('better-sqlite3').Database} db
 */
export function ensureLocalFixtures(db) {
  db.transaction(() => {
    db.prepare(
      `INSERT OR IGNORE INTO Users (Id, DisplayName, Email, TenantId)
       VALUES (?, ?, ?, ?)`,
    ).run(
      LOCAL_USER_ID,
      'Local User',
      'local@focusflow.local',
      LOCAL_TENANT_ID,
    )

    db.prepare(
      `INSERT OR IGNORE INTO Workspace (Id, Name, TenantId, OwnerUserId)
       VALUES (?, ?, ?, ?)`,
    ).run(
      DEFAULT_WORKSPACE_ID,
      'Default Workspace',
      LOCAL_TENANT_ID,
      LOCAL_USER_ID,
    )

    db.prepare(
      `INSERT OR IGNORE INTO Projects (
         Id, WorkspaceId, Name, Description, Color, Icon, IsSystem
       ) VALUES (?, ?, ?, ?, ?, ?, 1)`,
    ).run(
      UNCATEGORIZED_PROJECT_ID,
      DEFAULT_WORKSPACE_ID,
      'Uncategorized',
      'Tasks without a specific project',
      '#8b93a7',
      '📁',
    )
  })()
}
