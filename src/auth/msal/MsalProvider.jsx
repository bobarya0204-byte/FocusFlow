import { MsalProvider } from '@azure/msal-react'
import { getMsalInstance, isMsalEnabled } from './msalConfig.js'

/**
 * Wraps the React tree with @azure/msal-react when Entra configuration is present.
 * When disabled, children render unchanged (LOCAL mode).
 */
export function FocusFlowMsalProvider({ children }) {
  if (!isMsalEnabled()) {
    return children
  }

  const instance = getMsalInstance()
  if (!instance) {
    return children
  }

  return <MsalProvider instance={instance}>{children}</MsalProvider>
}
