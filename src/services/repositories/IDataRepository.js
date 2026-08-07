import { FOCUS_SESSIONS_KEY } from '../../utils/focus.js'
import {
  ACTIVE_PAGE_KEY,
  PROJECT_FILTER_KEY,
  SIDEBAR_COLLAPSED_KEY,
} from '../../utils/navigation.js'
import { PROJECTS_STORAGE_KEY } from '../../utils/projects.js'
import { TASKS_STORAGE_KEY } from '../../utils/tasks.js'
import { THEME_KEY } from '../../utils/theme.js'

/**
 * Canonical persistence keys — unchanged from pre-repository storage.
 * @readonly
 */
export const REPOSITORY_KEYS = {
  TASKS: TASKS_STORAGE_KEY,
  PROJECTS: PROJECTS_STORAGE_KEY,
  FOCUS_SESSIONS: FOCUS_SESSIONS_KEY,
  ACTIVE_PAGE: ACTIVE_PAGE_KEY,
  SIDEBAR_COLLAPSED: SIDEBAR_COLLAPSED_KEY,
  PROJECT_FILTER: PROJECT_FILTER_KEY,
  THEME: THEME_KEY,
}

/**
 * @typedef {Object} RepositoryWriteResult
 * @property {boolean} ok
 * @property {string} [code]
 * @property {string} [message]
 */

/**
 * Data access abstraction for FocusFlow persistence.
 * Implementations: LocalStorageRepository (now), ApiRepository (future).
 *
 * @typedef {Object} IDataRepository
 * @property {(key: string, fallback: unknown|(() => unknown)) => unknown} read
 * @property {(key: string, value: unknown) => RepositoryWriteResult} write
 */

/** @param {unknown} candidate */
export function assertIDataRepository(candidate) {
  if (
    !candidate ||
    typeof candidate.read !== 'function' ||
    typeof candidate.write !== 'function'
  ) {
    throw new Error('Invalid IDataRepository implementation')
  }
}
