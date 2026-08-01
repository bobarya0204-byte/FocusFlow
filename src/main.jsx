import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { FocusFlowProvider } from './context/FocusFlowContext.jsx'
import { TeamsProvider } from './teams/TeamsContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <TeamsProvider>
      <FocusFlowProvider>
        <App />
      </FocusFlowProvider>
    </TeamsProvider>
  </StrictMode>,
)
