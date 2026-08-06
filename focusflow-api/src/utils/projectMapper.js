import { UNCATEGORIZED_PROJECT_ID } from '../constants/auth.js'

/**
 * @param {import('better-sqlite3').Statement} row
 * @returns {Record<string, unknown>|null}
 */
export function mapRowToProject(row) {
  if (!row) {
    return null
  }

  return {
    id: row.IsSystem ? UNCATEGORIZED_PROJECT_ID : row.Id,
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

/**
 * @param {unknown} name
 * @returns {string|null}
 */
export function validateProjectName(name) {
  if (typeof name !== 'string' || name.trim().length === 0) {
    return null
  }
  return name.trim()
}

/**
 * @param {Record<string, unknown>} input
 * @param {string} workspaceId
 */
export function buildCreateProjectPayload(input, workspaceId) {
  const name = validateProjectName(input.name)
  if (!name) {
    return { error: 'Project name is required' }
  }

  const now = new Date().toISOString()

  return {
    project: {
      id: crypto.randomUUID(),
      workspaceId,
      name,
      description:
        typeof input.description === 'string' ? input.description : '',
      color: typeof input.color === 'string' ? input.color : '#6b8afd',
      icon: typeof input.icon === 'string' ? input.icon : '📁',
      isSystem: false,
      archived: Boolean(input.archived),
      deleted: false,
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
    },
  }
}

/**
 * @param {Record<string, unknown>} existing
 * @param {Record<string, unknown>} updates
 */
export function buildUpdateProjectPayload(existing, updates) {
  if (existing.isSystem || existing.id === UNCATEGORIZED_PROJECT_ID) {
    return { error: 'System project cannot be modified' }
  }

  const next = { ...existing }

  if ('name' in updates) {
    const name = validateProjectName(updates.name)
    if (!name) {
      return { error: 'Project name is required' }
    }
    next.name = name
  }

  if ('description' in updates && typeof updates.description === 'string') {
    next.description = updates.description
  }

  if ('color' in updates && typeof updates.color === 'string') {
    next.color = updates.color
  }

  if ('icon' in updates && typeof updates.icon === 'string') {
    next.icon = updates.icon
  }

  if ('archived' in updates) {
    next.archived = Boolean(updates.archived)
  }

  if ('deleted' in updates) {
    next.deleted = Boolean(updates.deleted)
    if (next.deleted && !next.deletedAt) {
      next.deletedAt = new Date().toISOString()
    }
    if (!next.deleted) {
      next.deletedAt = null
    }
  }

  if ('deletedAt' in updates) {
    next.deletedAt =
      typeof updates.deletedAt === 'string' ? updates.deletedAt : null
  }

  next.updatedAt = new Date().toISOString()
  return { project: next }
}
