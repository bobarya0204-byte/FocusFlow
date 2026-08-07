import { DEFAULT_WORKSPACE_ID } from '../../utils/projects.js'

/**
 * @param {Record<string, unknown>} project
 */
export function apiProjectToClient(project) {
  return {
    id: project.id,
    name: project.name,
    description: project.description ?? '',
    color: project.color ?? '#8b93a7',
    icon: project.icon ?? '📁',
    workspaceId: project.workspaceId ?? DEFAULT_WORKSPACE_ID,
    archived: Boolean(project.archived),
    deleted: Boolean(project.deleted),
    deletedAt: project.deletedAt ?? null,
    createdAt: project.createdAt ?? null,
    updatedAt: project.updatedAt ?? null,
  }
}

/**
 * @param {Record<string, unknown>} project
 */
export function clientProjectToApiPayload(project) {
  return {
    name: project.name,
    description: project.description ?? '',
    color: project.color ?? '#8b93a7',
    icon: project.icon ?? '📁',
    archived: Boolean(project.archived),
    deleted: Boolean(project.deleted),
    deletedAt: project.deletedAt ?? null,
  }
}

const SYNC_FIELDS = [
  'name',
  'description',
  'color',
  'icon',
  'workspaceId',
  'archived',
  'deleted',
  'deletedAt',
]

/**
 * @param {Record<string, unknown>[]} left
 * @param {Record<string, unknown>[]} right
 */
export function projectsSnapshotEqual(left, right) {
  if (!Array.isArray(left) || !Array.isArray(right)) {
    return false
  }
  if (left.length !== right.length) {
    return false
  }

  for (let index = 0; index < left.length; index += 1) {
    const a = left[index]
    const b = right[index]
    if (String(a.id) !== String(b.id)) {
      return false
    }
    for (const field of SYNC_FIELDS) {
      if (a[field] !== b[field]) {
        return false
      }
    }
  }

  return true
}

function projectChanged(previous, next) {
  return !projectsSnapshotEqual([previous], [next])
}

/**
 * @param {Record<string, unknown>[]} prev
 * @param {Record<string, unknown>[]} next
 */
export function diffProjectSnapshots(prev, next) {
  const prevById = new Map(prev.map((project) => [String(project.id), project]))
  const nextById = new Map(next.map((project) => [String(project.id), project]))

  /** @type {Record<string, unknown>[]} */
  const toCreate = []
  /** @type {Record<string, unknown>[]} */
  const toUpdate = []
  /** @type {Record<string, unknown>[]} */
  const toArchive = []

  for (const project of next) {
    const id = String(project.id)
    const previous = prevById.get(id)

    if (!previous) {
      if (!project.deleted) {
        toCreate.push(project)
      }
      continue
    }

    if (project.deleted && !previous.deleted) {
      toUpdate.push(project)
      continue
    }

    if (!project.deleted && previous.deleted) {
      toUpdate.push(project)
      continue
    }

    if (!project.deleted && project.archived && !previous.archived) {
      toArchive.push(project)
      continue
    }

    if (!project.deleted && projectChanged(previous, project)) {
      toUpdate.push(project)
    }
  }

  for (const previous of prev) {
    const id = String(previous.id)
    if (!nextById.has(id) && !previous.deleted) {
      toUpdate.push({ ...previous, deleted: true, deletedAt: new Date().toISOString() })
    }
  }

  return { toCreate, toUpdate, toArchive }
}
