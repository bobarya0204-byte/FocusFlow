import { useAuth } from './AuthContext.jsx'
import BrandedLoader from '../components/branding/BrandedLoader.jsx'

/**
 * Blocks application content until identity initialization completes.
 * Step 2: no login UI — only the existing branded loading screen.
 */
export function AuthGate({ children }) {
  const { isLoading } = useAuth()

  if (isLoading) {
    return <BrandedLoader />
  }

  return children
}
