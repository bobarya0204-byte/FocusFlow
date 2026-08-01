/**
 * Auth adapter seam for future Teams / Entra ID SSO.
 *
 * Phase 1: local-only identity (no network auth).
 * Later phases can swap implementation without changing product UI.
 */

import { appEnv, isTeamsAuthConfigured } from '../config/env'

export const AUTH_MODES = {
  LOCAL: 'local',
  TEAMS_SSO: 'teams-sso',
}

/**
 * Resolve which auth strategy the app should use.
 * Does not perform authentication — only selects the seam.
 */
export function getAuthMode({ isTeams = false } = {}) {
  if (isTeams && isTeamsAuthConfigured()) {
    return AUTH_MODES.TEAMS_SSO
  }
  return AUTH_MODES.LOCAL
}

/**
 * Placeholder identity for local / pre-auth builds.
 * Replace with Teams SSO token exchange in a later phase.
 */
export async function getCurrentUser(_host = null) {
  return {
    id: 'local-user',
    displayName: 'Local User',
    authMode: AUTH_MODES.LOCAL,
  }
}

/**
 * Reserved: obtain an access token for Graph / FocusFlow APIs.
 * Returns null until Teams SSO is implemented.
 */
export async function getAccessToken(_scopes = []) {
  if (!isTeamsAuthConfigured()) {
    return null
  }
  // Future: microsoftTeams.authentication.getAuthToken / MSAL
  return null
}

export function getAuthConfigSummary() {
  return {
    modeHint: isTeamsAuthConfigured() ? AUTH_MODES.TEAMS_SSO : AUTH_MODES.LOCAL,
    clientIdConfigured: Boolean(appEnv.azureAdClientId),
    tenantIdConfigured: Boolean(appEnv.azureAdTenantId),
    apiBaseUrl: appEnv.apiBaseUrl || null,
  }
}
