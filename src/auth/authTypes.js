/** Unified identity model for FocusFlow enterprise auth. */

export const AUTHENTICATION_MODES = {
  LOCAL: 'LOCAL',
  BROWSER_MSAL: 'BROWSER_MSAL',
  TEAMS_SSO: 'TEAMS_SSO',
}

export const LOCAL_USER_ID = 'local-user'
export const LOCAL_TENANT_ID = 'local-tenant'

/**
 * @typedef {Object} FocusFlowUser
 * @property {string} id
 * @property {string} displayName
 * @property {string|null} email
 * @property {string|null} tenantId
 * @property {string} authenticationMode
 * @property {boolean} isAuthenticated
 */

/** @returns {FocusFlowUser} */
export function createLocalUser(
  authenticationMode = AUTHENTICATION_MODES.LOCAL,
) {
  return {
    id: LOCAL_USER_ID,
    displayName: 'Local User',
    email: 'local@focusflow.local',
    tenantId: LOCAL_TENANT_ID,
    authenticationMode,
    isAuthenticated: authenticationMode === AUTHENTICATION_MODES.LOCAL,
  }
}
