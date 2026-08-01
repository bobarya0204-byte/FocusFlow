import { readJson } from './storage'

export const ACTIVE_PAGE_KEY = 'focusflow-active-page'
export const SIDEBAR_COLLAPSED_KEY = 'focusflow-sidebar-collapsed'
export const PROJECT_FILTER_KEY = 'focusflow-project-filter'

export const DEFAULT_PAGE = 'dashboard'

export const VALID_PAGES = [
  'dashboard',
  'tasks',
  'planner',
  'focus',
  'analytics',
  'inbox',
  'deleted',
]

export function normalizeActivePage(value) {
  return VALID_PAGES.includes(value) ? value : DEFAULT_PAGE
}

export function getInitialActivePage() {
  return normalizeActivePage(readJson(ACTIVE_PAGE_KEY, DEFAULT_PAGE))
}

export function getInitialSidebarCollapsed() {
  return Boolean(readJson(SIDEBAR_COLLAPSED_KEY, false))
}

export function normalizeProjectFilter(value) {
  if (value == null || value === '') {
    return 'all'
  }
  return String(value)
}

export function getInitialProjectFilter() {
  return normalizeProjectFilter(readJson(PROJECT_FILTER_KEY, 'all'))
}
