import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { appEnv } from '../config/env'
import {
  AUTH_MODES,
  getAuthConfigSummary,
  getAuthMode,
  getCurrentUser,
} from './authAdapter'
import {
  HOST_KINDS,
  initializeTeamsHost,
  notifyTeamsAppReady,
} from './teamsClient'

const TeamsContext = createContext(null)

/**
 * Provides host detection (browser vs Teams) without changing product UI.
 * Renders children immediately — detection runs in the background.
 */
export function TeamsProvider({ children }) {
  const [hostState, setHostState] = useState({
    host: HOST_KINDS.UNKNOWN,
    isTeams: false,
    isDetecting: appEnv.teamsEnabled,
    initialized: false,
    context: null,
    hostName: null,
    error: null,
  })
  const [user, setUser] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function detect() {
      const result = await initializeTeamsHost()
      if (cancelled) {
        return
      }

      setHostState({
        host: result.host,
        isTeams: result.isTeams,
        isDetecting: false,
        initialized: result.initialized,
        context: result.context,
        hostName: result.hostName || null,
        error: result.error,
      })

      const nextUser = await getCurrentUser(result)
      if (!cancelled) {
        setUser(nextUser)
      }

      if (result.isTeams) {
        await notifyTeamsAppReady()
      }
    }

    detect()
    return () => {
      cancelled = true
    }
  }, [])

  const value = useMemo(() => {
    const authMode = getAuthMode({ isTeams: hostState.isTeams })
    return {
      ...hostState,
      isBrowser: !hostState.isTeams,
      authMode,
      authConfig: getAuthConfigSummary(),
      user,
      appEnv,
      /** Future SSO entrypoint — currently a no-op placeholder */
      async signIn() {
        if (authMode === AUTH_MODES.LOCAL) {
          return user
        }
        return null
      },
    }
  }, [hostState, user])

  return (
    <TeamsContext.Provider value={value}>{children}</TeamsContext.Provider>
  )
}

export function useTeams() {
  const context = useContext(TeamsContext)
  if (!context) {
    throw new Error('useTeams must be used within TeamsProvider')
  }
  return context
}

/**
 * Optional hook for code that may run outside TeamsProvider (tests / Storybook).
 */
export function useTeamsOptional() {
  return useContext(TeamsContext)
}
