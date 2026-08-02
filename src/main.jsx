import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthGate, AuthProvider, FocusFlowMsalProvider } from './auth/index.js'
import AppBootstrap from './components/branding/AppBootstrap.jsx'
import { FocusFlowProvider } from './context/FocusFlowContext.jsx'
import { TeamsProvider } from './teams/TeamsContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <FocusFlowMsalProvider>
      <TeamsProvider>
        <AuthProvider>
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
