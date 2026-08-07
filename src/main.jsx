import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/themes.css'
import './index.css'
import App from './App.jsx'
import { applyThemeToDocument, getInitialTheme } from './utils/theme.js'
import { AuthGate, AuthProvider, FocusFlowMsalProvider } from './auth/index.js'
import AppBootstrap from './components/branding/AppBootstrap.jsx'
import { FocusFlowProvider } from './context/FocusFlowContext.jsx'
import { ApiTokenBridge } from './services/api/ApiTokenBridge.jsx'
import { TeamsProvider } from './teams/TeamsContext.jsx'

applyThemeToDocument(getInitialTheme())

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <FocusFlowMsalProvider>
      <TeamsProvider>
        <AuthProvider>
          <ApiTokenBridge />
          <AuthGate>
            <FocusFlowProvider>
              <AppBootstrap>
                <App />
              </AppBootstrap>
            </FocusFlowProvider>
          </AuthGate>
        </AuthProvider>
      </TeamsProvider>
    </FocusFlowMsalProvider>
  </StrictMode>,
)
