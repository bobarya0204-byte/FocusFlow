import { AUTHENTICATION_MODES } from '../authTypes.js'

/**
 * Map an MSAL account to the FocusFlow identity model.
 * @param {import('@azure/msal-browser').AccountInfo} account
 * @returns {import('../authTypes.js').FocusFlowUser}
 */
export function createUserFromMsalAccount(account) {
  return {
    id: account.localAccountId || account.homeAccountId,
    displayName: account.name || account.username || 'Microsoft User',
    email: account.username || null,
    tenantId: account.tenantId || null,
    authenticationMode: AUTHENTICATION_MODES.BROWSER_MSAL,
    isAuthenticated: true,
  }
}
