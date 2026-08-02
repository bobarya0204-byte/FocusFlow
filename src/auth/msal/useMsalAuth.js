import { useCallback, useMemo } from 'react'
import { useIsAuthenticated, useMsal } from '@azure/msal-react'
import { DEFAULT_LOGIN_SCOPES } from './msalConfig.js'

/** Static helpers when MSAL is not configured. */
export const MSAL_DISABLED_HELPERS = {
  enabled: false,
  isAuthenticated: false,
  accounts: [],
  inProgress: 'none',
  loginRedirect: async () => {},
  loginPopup: async () => {},
  logoutRedirect: async () => {},
  acquireTokenSilent: async () => null,
}

/**
 * MSAL React helpers for future login UI.
 * Requires FocusFlowMsalProvider when Azure auth is configured.
 *
 * @returns {MsalAuthHelpers}
 */
export function useMsalAuth() {
  const { instance, accounts, inProgress } = useMsal()
  const isAuthenticated = useIsAuthenticated()

  const loginRedirect = useCallback(
    async (scopes = DEFAULT_LOGIN_SCOPES) => {
      await instance.loginRedirect({
        scopes,
      })
    },
    [instance],
  )

  const loginPopup = useCallback(
    async (scopes = DEFAULT_LOGIN_SCOPES) => {
      await instance.loginPopup({
        scopes,
      })
    },
    [instance],
  )

  const logoutRedirect = useCallback(async () => {
    await instance.logoutRedirect()
  }, [instance])

  const acquireTokenSilent = useCallback(
    async (scopes = DEFAULT_LOGIN_SCOPES) => {
      const account = accounts[0]
      if (!account) {
        return null
      }

      try {
        const result = await instance.acquireTokenSilent({
          account,
          scopes,
        })
        return result.accessToken
      } catch {
        return null
      }
    },
    [accounts, instance],
  )

  return useMemo(
    () => ({
      enabled: true,
      isAuthenticated,
      accounts,
      inProgress,
      loginRedirect,
      loginPopup,
      logoutRedirect,
      acquireTokenSilent,
    }),
    [
      accounts,
      acquireTokenSilent,
      inProgress,
      isAuthenticated,
      loginPopup,
      loginRedirect,
      logoutRedirect,
    ],
  )
}

/**
 * @typedef {Object} MsalAuthHelpers
 * @property {boolean} enabled
 * @property {boolean} isAuthenticated
 * @property {import('@azure/msal-browser').AccountInfo[]} accounts
 * @property {string} inProgress
 * @property {(scopes?: string[]) => Promise<void>} loginRedirect
 * @property {(scopes?: string[]) => Promise<void>} loginPopup
 * @property {() => Promise<void>} logoutRedirect
 * @property {(scopes?: string[]) => Promise<string|null>} acquireTokenSilent
 */
