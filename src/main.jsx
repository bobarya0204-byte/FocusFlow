import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import AppBootstrap from './components/branding/AppBootstrap.jsx'
import { FocusFlowProvider } from './context/FocusFlowContext.jsx'
import { TeamsProvider } from './teams/TeamsContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <TeamsProvider>
      <FocusFlowProvider>
        <AppBootstrap>
          <App />
        </AppBootstrap>
      </FocusFlowProvider>
    </TeamsProvider>
  </StrictMode>,
)
