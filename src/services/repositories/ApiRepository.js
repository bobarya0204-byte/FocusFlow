import {
  focusSessionsApi,
  projectsApi,
  tasksApi,
} from '../api/apiClient.js'
import {
  apiFocusSessionToClient,
  clientFocusSessionToApiPayload,
  diffFocusSessionSnapshots,
} from '../api/focusSessionMapper.js'
import {
  apiProjectToClient,
  clientProjectToApiPayload,
  diffProjectSnapshots,
} from '../api/projectMapper.js'
import {
  apiTaskToClient,
  clientTaskToApiPayload,
  diffTaskSnapshots,
} from '../api/taskMapper.js'
import { normalizeProjects } from '../../utils/projects.js'
import { REPOSITORY_KEYS } from './IDataRepository.js'
import { LocalStorageRepository } from './LocalStorageRepository.js'

/**
 * Hybrid repository: tasks, projects, and focus sessions via REST API;
 * planner/navigation preferences via localStorage.
 *
 * @implements {import('./IDataRepository.js').IDataRepository}
 */
export class ApiRepository {
  constructor() {
    this.localRepository = new LocalStorageRepository()
    /** @type {Record<string, unknown>[]} */
    this.taskSnapshot = []
    /** @type {Record<string, unknown>[]} */
    this.projectSnapshot = []
    /** @type {Record<string, unknown>[]} */
    this.focusSessionSnapshot = []
  }

  /**
   * @param {string} key
   * @param {unknown|(() => unknown)} fallback
   */
  read(key, fallback) {
    if (key === REPOSITORY_KEYS.TASKS) {
      return this.taskSnapshot
    }

    if (key === REPOSITORY_KEYS.PROJECTS) {
      return this.projectSnapshot
    }

    if (key === REPOSITORY_KEYS.FOCUS_SESSIONS) {
      return this.focusSessionSnapshot
    }

    return this.localRepository.read(key, fallback)
  }

  /**
   * @param {string} key
   * @param {unknown} value
   * @returns {import('./IDataRepository.js').RepositoryWriteResult}
   */
  write(key, value) {
    if (key === REPOSITORY_KEYS.TASKS) {
      this.taskSnapshot = Array.isArray(value) ? value : []
      return { ok: true }
    }

    if (key === REPOSITORY_KEYS.PROJECTS) {
      this.projectSnapshot = Array.isArray(value) ? value : []
      return { ok: true }
    }

    if (key === REPOSITORY_KEYS.FOCUS_SESSIONS) {
      this.focusSessionSnapshot = Array.isArray(value) ? value : []
      return { ok: true }
    }

    return this.localRepository.write(key, value)
  }

  async fetchTasks() {
    const tasks = await tasksApi.getAll()
    const mapped = Array.isArray(tasks)
      ? tasks.map((task) => apiTaskToClient(task))
      : []
    this.taskSnapshot = mapped
    return mapped
  }

  async fetchProjects() {
    const projects = await projectsApi.getAll()
    const mapped = normalizeProjects(
      Array.isArray(projects)
        ? projects.map((project) => apiProjectToClient(project))
        : [],
    )
    this.projectSnapshot = mapped
    return mapped
  }

  async fetchFocusSessions() {
    const sessions = await focusSessionsApi.getAll()
    const mapped = Array.isArray(sessions)
      ? sessions.map((session) => apiFocusSessionToClient(session))
      : []
    this.focusSessionSnapshot = mapped
    return mapped
  }

  /**
   * @param {Record<string, unknown>[]} previous
   * @param {Record<string, unknown>[]} next
   * @returns {Promise<Record<string, string>>}
   */
  async syncTasks(previous, next) {
    const { toCreate, toUpdate, toDelete } = diffTaskSnapshots(previous, next)
    /** @type {Record<string, string>} */
    const idMap = {}

    for (const task of toDelete) {
      await tasksApi.delete(String(task.id))
    }

    for (const task of toCreate) {
      const created = await tasksApi.create(clientTaskToApiPayload(task))
      idMap[String(task.id)] = String(created.id)
    }

    for (const task of toUpdate) {
      await tasksApi.update(String(task.id), clientTaskToApiPayload(task))
    }

    this.taskSnapshot = next
    return idMap
  }

  /**
   * @param {Record<string, unknown>[]} previous
   * @param {Record<string, unknown>[]} next
   * @returns {Promise<Record<string, string>>}
   */
  async syncProjects(previous, next) {
    const { toCreate, toUpdate, toArchive } = diffProjectSnapshots(
      previous,
      next,
    )
    /** @type {Record<string, string>} */
    const idMap = {}

    for (const project of toArchive) {
      await projectsApi.delete(String(project.id))
    }

    for (const project of toCreate) {
      const created = await projectsApi.create(
        clientProjectToApiPayload(project),
      )
      idMap[String(project.id)] = String(created.id)
    }

    for (const project of toUpdate) {
      await projectsApi.update(
        String(project.id),
        clientProjectToApiPayload(project),
      )
    }

    this.projectSnapshot = next
    return idMap
  }

  /**
   * @param {Record<string, unknown>[]} previous
   * @param {Record<string, unknown>[]} next
   * @returns {Promise<Record<string, string>>}
   */
  async syncFocusSessions(previous, next) {
    const { toCreate, toUpdate, toDelete } = diffFocusSessionSnapshots(
      previous,
      next,
    )
    /** @type {Record<string, string>} */
    const idMap = {}

    for (const session of toDelete) {
      await focusSessionsApi.delete(String(session.id))
    }

    for (const session of toCreate) {
      const created = await focusSessionsApi.create(
        clientFocusSessionToApiPayload(session),
      )
      idMap[String(session.id)] = String(created.id)
    }

    for (const session of toUpdate) {
      await focusSessionsApi.update(
        String(session.id),
        clientFocusSessionToApiPayload(session),
      )
    }

    this.focusSessionSnapshot = next
    return idMap
  }
}
