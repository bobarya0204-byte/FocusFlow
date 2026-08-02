import { AUTHENTICATION_MODES } from './authTypes.js'
import {
  isAzureAuthConfigured,
  isLiveEntraAuthEnabled,
} from '../config/env.js'

/**
 * Active authentication mode for the running application.
 * Step 3A: LOCAL remains active until VITE_AZURE_AUTH_ENABLED=true.
 *
 * @param {{ isTeams?: boolean }} [options]
 * @returns {string}
 */
export function resolveAuthenticationMode({ isTeams = false } = {}) {
  if (!isLiveEntraAuthEnabled()) {
    return AUTHENTICATION_MODES.LOCAL
  }

  return resolvePlannedAuthenticationMode({ isTeams })
}

/**
 * Target mode once live Entra authentication is enabled.
 * Used for validation logging and future Step 3B activation.
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
 * Whether the resolved mode delegates to Microsoft Teams SSO (future step).
 * @param {string} authenticationMode
 */
export function isTeamsSsoMode(authenticationMode) {
  return authenticationMode === AUTHENTICATION_MODES.TEAMS_SSO
}

/**
 * Whether the resolved mode uses browser MSAL (future interactive login).
 * @param {string} authenticationMode
 */
export function isBrowserMsalMode(authenticationMode) {
  return authenticationMode === AUTHENTICATION_MODES.BROWSER_MSAL
}
