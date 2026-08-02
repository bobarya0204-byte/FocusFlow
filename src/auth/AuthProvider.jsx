import { useEffect, useMemo, useState } from 'react'
import { isAzureAuthConfigured } from '../config/env.js'
import {
  logEntraConfigInDev,
  validateAzureConfig,
} from '../config/azureConfigValidation.js'
import { useTeamsOptional } from '../teams/TeamsContext.jsx'
import { AuthContext } from './AuthContext.jsx'
import {
  AUTHENTICATION_MODES,
  createLocalUser,
} from './authTypes.js'
import { initializeMsalSilently } from './msal/msalConfig.js'
import {
  isTeamsSsoMode,
  resolveAuthenticationMode,
  resolvePlannedAuthenticationMode,
} from './resolveAuthMode.js'
import {
  acquireTeamsSsoToken,
  initializeTeamsSso,
} from './teams/teamsAuthDelegate.js'

const INITIAL_AUTH_STATE = {
  user: createLocalUser(),
  authenticationMode: AUTHENTICATION_MODES.LOCAL,
  plannedAuthenticationMode: AUTHENTICATION_MODES.LOCAL,
  isAuthenticated: true,
  isLoading: true,
  isEntraConfigured: false,
  isMsalReady: false,
  msalAccounts: [],
  entraConfigValid: true,
}

/**
 * Identity provider for FocusFlow.
 * Step 3A: validates Entra configuration and initializes MSAL silently.
 * Active mode remains LOCAL until live auth is explicitly enabled.
 */
export function AuthProvider({ children }) {
  const teams = useTeamsOptional()
  const isTeams = Boolean(teams?.isTeams)
  const [authState, setAuthState] = useState(INITIAL_AUTH_STATE)

  useEffect(() => {
    if (teams?.isDetecting) {
      return undefined
    }

    let cancelled = false

    async function initializeIdentity() {
      const authenticationMode = resolveAuthenticationMode({ isTeams })
      const plannedAuthenticationMode = resolvePlannedAuthenticationMode({
        isTeams,
      })
      const isEntraConfigured = isAzureAuthConfigured()
      const validation = validateAzureConfig()
      let msalAccounts = []
      let isMsalReady = false
      let msalInitialized = false

      try {
        if (isEntraConfigured && validation.isValid) {
          const msalResult = await initializeMsalSilently()
          msalAccounts = msalResult.accounts
          isMsalReady = Boolean(msalResult.instance)
          msalInitialized = isMsalReady
        }

        if (
          isEntraConfigured &&
          isTeamsSsoMode(plannedAuthenticationMode)
        ) {
          await initializeTeamsSso()
          await acquireTeamsSsoToken()
        }
      } catch (error) {
        console.error('FocusFlow auth initialization failed:', error)
      }

      logEntraConfigInDev(validation, {
        authenticationMode,
        plannedMode: plannedAuthenticationMode,
        msalInitialized,
      })

      if (cancelled) {
        return
      }

      setAuthState({
        user: createLocalUser(authenticationMode),
        authenticationMode,
        plannedAuthenticationMode,
        isAuthenticated: authenticationMode === AUTHENTICATION_MODES.LOCAL,
        isLoading: false,
        isEntraConfigured,
        isMsalReady,
        msalAccounts,
        entraConfigValid: validation.isValid,
      })
    }

    initializeIdentity()

    return () => {
      cancelled = true
    }
  }, [isTeams, teams?.isDetecting])

  const value = useMemo(() => authState, [authState])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
