import { InteractionRequiredAuthError } from '@azure/msal-browser'
import { useEffect } from 'react'
import { useAuth } from '../../auth/AuthContext.jsx'
import { getMsalInstance } from '../../auth/msal/msalConfig.js'
import { appEnv, getAzureApiScopes, isAzureAuthConfigured } from '../../config/env.js'
import { setAccessTokenProvider } from './tokenProvider.js'

/**
 * Registers MSAL token acquisition for API requests.
 * Renders nothing — mount inside AuthProvider after MSAL sign-in completes.
 */
export function ApiTokenBridge() {
  const { isLoading, isMsalReady, isEntraConfigured } = useAuth()

  useEffect(() => {
    if (
      !isAzureAuthConfigured() ||
      isLoading ||
      (isEntraConfigured && !isMsalReady)
    ) {
      setAccessTokenProvider(null)
      return () => {
        setAccessTokenProvider(null)
      }
    }

    setAccessTokenProvider(async () => {
      const instance = getMsalInstance()
      if (!instance) {
        return null
      }

      await instance.initialize()

      const accounts = instance.getAllAccounts()
      if (accounts.length === 0) {
        if (appEnv.isDev) {
          console.warn('[FocusFlow API] No MSAL accounts available for API token')
        }
        return null
      }

      const scopes = getAzureApiScopes()
      if (scopes.length === 0) {
        if (appEnv.isDev) {
          console.warn('[FocusFlow API] No API scopes configured')
        }
        return null
      }

      const account = accounts[0]

      try {
        const result = await instance.acquireTokenSilent({ account, scopes })
        return result.accessToken
      } catch (error) {
        if (appEnv.isDev) {
          console.warn('[FocusFlow API] acquireTokenSilent failed:', error)
        }

        if (error instanceof InteractionRequiredAuthError) {
          try {
            await instance.acquireTokenRedirect({ account, scopes })
          } catch (redirectError) {
            console.error(
              '[FocusFlow API] acquireTokenRedirect failed:',
              redirectError,
            )
          }
          return null
        }

        console.error('[FocusFlow API] API token acquisition failed:', error)
        return null
      }
    })

    return () => {
      setAccessTokenProvider(null)
    }
  }, [isLoading, isMsalReady, isEntraConfigured])

  return null
}
