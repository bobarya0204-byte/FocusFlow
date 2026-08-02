import { createContext, useContext } from 'react'

/** @type {import('react').Context<import('./authTypes').AuthContextValue|null>} */
export const AuthContext = createContext(null)

/**
 * @typedef {Object} AuthContextValue
 * @property {FocusFlowUser} user
 * @property {string} authenticationMode
 * @property {string} plannedAuthenticationMode
 * @property {boolean} isAuthenticated
 * @property {boolean} isLoading
 * @property {boolean} isEntraConfigured
 * @property {boolean} isMsalReady
 * @property {boolean} entraConfigValid
 * @property {import('@azure/msal-browser').AccountInfo[]} msalAccounts
 */

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

/**
 * Optional hook for tests or components outside AuthProvider.
 */
export function useAuthOptional() {
  return useContext(AuthContext)
}
