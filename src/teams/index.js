/** Public Teams readiness surface for FocusFlow v0.7 Phase 1. */

export { TeamsProvider, useTeams, useTeamsOptional } from './TeamsContext'
export {
  HOST_KINDS,
  initializeTeamsHost,
  notifyTeamsAppReady,
  getTeamsHostSnapshot,
} from './teamsClient'
export {
  AUTH_MODES,
  getAuthMode,
  getAccessToken,
  getCurrentUser,
  getAuthConfigSummary,
} from './authAdapter'
