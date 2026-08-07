import { AUTHENTICATION_MODES } from './authTypes.js'
import { isAzureAuthConfigured } from '../config/env.js'

/**
 * Active authentication mode for the current host.
 *
 * @param {{ isTeams?: boolean }} [options]
 * @returns {string}
 */
export function resolveAuthenticationMode({ isTeams = false } = {}) {
  return resolvePlannedAuthenticationMode({ isTeams })
}

/**
 * Resolve authentication mode from Entra configuration and host context.
 *
 * @param {{ isTeams?: boolean }} [options]
 * @returns {string}
 */
export function resolvePlannedAuthenticationMode({ isTeams = false } = {}) {
  if (!isAzureAuthConfigured()) {
    return AUTHENTICATION_MODES.LOCAL
  }

  if (isTeams) {
    return AUTHENTICATION_MODES.TEAMS_SSO
  }

  return AUTHENTICATION_MODES.BROWSER_MSAL
}

/**
 * Whether the resolved mode delegates to Microsoft Teams SSO.
 * @param {string} authenticationMode
 */
export function isTeamsSsoMode(authenticationMode) {
  return authenticationMode === AUTHENTICATION_MODES.TEAMS_SSO
}

/**
 * Whether the resolved mode uses browser MSAL.
 * @param {string} authenticationMode
 */
export function isBrowserMsalMode(authenticationMode) {
  return authenticationMode === AUTHENTICATION_MODES.BROWSER_MSAL
}
