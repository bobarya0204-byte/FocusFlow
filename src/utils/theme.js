import { readJson } from './storage.js'

export const THEME_KEY = 'focusflow-theme'

export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
}

export const DEFAULT_THEME = THEMES.LIGHT

/**
 * @param {unknown} value
 * @returns {'light'|'dark'}
 */
export function normalizeTheme(value) {
  return value === THEMES.DARK ? THEMES.DARK : THEMES.LIGHT
}

export function getInitialTheme() {
  return normalizeTheme(readJson(THEME_KEY, DEFAULT_THEME))
}

/**
 * @param {'light'|'dark'} theme
 */
export function applyThemeToDocument(theme) {
  if (typeof document === 'undefined') {
    return
  }
  document.documentElement.setAttribute('data-theme', normalizeTheme(theme))
}
