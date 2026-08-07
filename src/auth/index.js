export { AuthProvider } from './AuthProvider.jsx'
export { AuthGate } from './AuthGate.jsx'
export { useAuth, useAuthOptional } from './AuthContext.jsx'
export {
  AUTHENTICATION_MODES,
  LOCAL_USER_ID,
  LOCAL_TENANT_ID,
  createLocalUser,
} from './authTypes.js'
export { resolveAuthenticationMode, resolvePlannedAuthenticationMode } from './resolveAuthMode.js'
export { FocusFlowMsalProvider } from './msal/MsalProvider.jsx'
export {
  createMsalConfiguration,
  DEFAULT_LOGIN_SCOPES,
  getMsalInstance,
  initializeMsalSilently,
  isMsalEnabled,
} from './msal/msalConfig.js'
export { createUserFromMsalAccount } from './msal/mapMsalAccountToUser.js'
export { authenticateBrowserMsal } from './msal/browserMsalAuth.js'
export { useMsalAuth, MSAL_DISABLED_HELPERS } from './msal/useMsalAuth.js'
