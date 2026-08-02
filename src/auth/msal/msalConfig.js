import { LogLevel, PublicClientApplication } from '@azure/msal-browser'
import { appEnv, getAzureAuthority, isAzureAuthConfigured } from '../../config/env.js'

/** @type {import('@azure/msal-browser').Configuration} */
export function createMsalConfiguration() {
  const redirectUri =
    appEnv.azureRedirectUri ||
    (typeof window !== 'undefined' ? window.location.origin : '')

  const postLogoutRedirectUri =
    appEnv.azurePostLogoutRedirectUri ||
    (typeof window !== 'undefined' ? window.location.origin : redirectUri)

  return {
    auth: {
      clientId: appEnv.azureClientId,
      authority: getAzureAuthority(),
      redirectUri,
      postLogoutRedirectUri,
      navigateToLoginRequestUrl: false,
    },
    cache: {
      cacheLocation: 'sessionStorage',
      storeAuthStateInCookie: false,
    },
    system: {
      loggerOptions: {
        logLevel: appEnv.isDev ? LogLevel.Warning : LogLevel.Error,
        loggerCallback(level, message, containsPii) {
          if (containsPii) {
            return
          }
          if (level === LogLevel.Error) {
            console.error(message)
          }
        },
      },
    },
  }
}

/** Default OIDC scopes for future interactive sign-in (not requested in Step 2). */
export const DEFAULT_LOGIN_SCOPES = ['openid', 'profile', 'User.Read']

export function isMsalEnabled() {
  return isAzureAuthConfigured()
}

/** @type {import('@azure/msal-browser').IPublicClientApplication|null} */
let msalInstance = null

/**
 * Lazily create the MSAL PublicClientApplication.
 * Returns null when Azure auth is not configured.
 */
export function getMsalInstance() {
  if (!isMsalEnabled()) {
    return null
  }

  if (!msalInstance) {
    msalInstance = new PublicClientApplication(createMsalConfiguration())
  }

  return msalInstance
}

/**
 * Initialize MSAL and handle any redirect response without prompting login.
 * Safe to call when MSAL is disabled (no-op).
 */
export async function initializeMsalSilently() {
  const instance = getMsalInstance()
  if (!instance) {
    return { instance: null, accounts: [] }
  }

  await instance.initialize()
  await instance.handleRedirectPromise()
  return {
    instance,
    accounts: instance.getAllAccounts(),
  }
}
