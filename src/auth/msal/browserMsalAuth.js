import { appEnv } from '../../config/env.js'
import { getMsalAuthScopes, getMsalInstance } from './msalConfig.js'
import { createUserFromMsalAccount } from './mapMsalAccountToUser.js'

/**
 * Authenticate via MSAL redirect flow.
 * - Reuses an existing cached account when present.
 * - Handles the post-redirect response when returning from Microsoft login.
 * - Starts loginRedirect() when no account exists.
 *
 * @returns {Promise<{
 *   redirecting: boolean
 *   instance: import('@azure/msal-browser').IPublicClientApplication|null
 *   accounts: import('@azure/msal-browser').AccountInfo[]
 *   user: import('../authTypes.js').FocusFlowUser|null
 * }>}
 */
export async function authenticateBrowserMsal() {
  const instance = getMsalInstance()
  if (!instance) {
    throw new Error('MSAL is not configured')
  }

  await instance.initialize()
  const redirectResult = await instance.handleRedirectPromise()
  const account =
    redirectResult?.account ?? instance.getAllAccounts()[0] ?? null

  if (account) {
    try {
      await instance.acquireTokenSilent({
        account,
        scopes: getMsalAuthScopes(),
      })
    } catch (error) {
      if (appEnv.isDev) {
        console.warn(
          '[FocusFlow Auth] acquireTokenSilent after login failed:',
          error,
        )
      }
    }

    return {
      redirecting: false,
      instance,
      accounts: instance.getAllAccounts(),
      user: createUserFromMsalAccount(account),
    }
  }

  try {
    await instance.loginRedirect({
      scopes: getMsalAuthScopes(),
    })
  } catch (error) {
    if (error?.errorCode === 'interaction_in_progress') {
      return {
        redirecting: true,
        instance,
        accounts: [],
        user: null,
      }
    }
    throw error
  }

  return {
    redirecting: true,
    instance,
    accounts: [],
    user: null,
  }
}
