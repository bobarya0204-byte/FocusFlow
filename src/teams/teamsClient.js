/**
 * Microsoft Teams host detection and SDK bootstrap.
 *
 * Safe for browser mode:
 * - Does not block first paint (callers should not await before render).
 * - Outside Teams, app.initialize() rejects after the SDK timeout → browser host.
 * - When VITE_TEAMS_ENABLED=false, SDK is never loaded into the hot path.
 */

import { appEnv } from '../config/env'

export const HOST_KINDS = {
  BROWSER: 'browser',
  TEAMS: 'teams',
  UNKNOWN: 'unknown',
}

const defaultResult = Object.freeze({
  host: HOST_KINDS.BROWSER,
  isTeams: false,
  initialized: false,
  context: null,
  error: null,
})

let cachedResult = null
let initPromise = null

function toHostName(context) {
  return context?.app?.host?.name || null
}

/**
 * Initialize Teams JS SDK and detect whether we are inside a Teams (or M365) host.
 * Idempotent — concurrent callers share one promise.
 */
export async function initializeTeamsHost() {
  if (cachedResult) {
    return cachedResult
  }
  if (initPromise) {
    return initPromise
  }

  initPromise = (async () => {
    if (!appEnv.teamsEnabled) {
      cachedResult = {
        ...defaultResult,
        error: null,
      }
      return cachedResult
    }

    try {
      // Dynamic import keeps browser bundles able to tree-shake if disabled later,
      // and avoids hard failure if the package is missing in a stripped build.
      const teamsJs = await import('@microsoft/teams-js')
      const { app } = teamsJs

      await app.initialize()
      const context = await app.getContext()
      const hostName = toHostName(context)
      const normalizedHost = String(hostName || '').toLowerCase()
      // Successful initialize means a supported M365 host (Teams / Outlook / Office).
      // Personal App Phase 1 treats any initialized host as Teams-ready runtime.
      const isTeamsHost =
        normalizedHost === '' ||
        normalizedHost === 'teams' ||
        normalizedHost.includes('teams')

      // Notify the host that the SPA shell loaded.
      try {
        app.notifyAppLoaded()
      } catch {
        // ignore — not all hosts require this
      }

      cachedResult = {
        host: HOST_KINDS.TEAMS,
        isTeams: true,
        isTeamsNamedHost: isTeamsHost,
        initialized: true,
        context,
        hostName,
        error: null,
        app,
      }
      return cachedResult
    } catch (error) {
      cachedResult = {
        ...defaultResult,
        error: error instanceof Error ? error.message : String(error),
      }
      return cachedResult
    }
  })()

  return initPromise
}

/** Tell Teams the app finished loading successfully (call after React mount). */
export async function notifyTeamsAppReady() {
  const result = cachedResult || (await initializeTeamsHost())
  if (!result.isTeams || !result.app) {
    return false
  }
  try {
    result.app.notifySuccess()
    return true
  } catch {
    return false
  }
}

export function getTeamsHostSnapshot() {
  return cachedResult || { ...defaultResult, host: HOST_KINDS.UNKNOWN }
}

/** Test helper — do not use in product UI. */
export function __resetTeamsHostForTests() {
  cachedResult = null
  initPromise = null
}
