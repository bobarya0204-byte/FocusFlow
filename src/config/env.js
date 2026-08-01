/**
 * Centralized environment configuration for FocusFlow.
 *
 * Vite only exposes variables prefixed with VITE_ to the client bundle.
 * Browser mode must keep working when these values are absent.
 */

function readEnv(key, fallback = '') {
  const value = import.meta.env?.[key]
  if (value == null || value === '') {
    return fallback
  }
  return String(value)
}

function readBoolean(key, fallback = false) {
  const raw = readEnv(key, '')
  if (raw === '') {
    return fallback
  }
  return raw === 'true' || raw === '1' || raw === 'yes'
}

export const appEnv = {
  /** development | production | staging (informational) */
  name: readEnv('VITE_APP_NAME', 'FocusFlow'),
  mode: readEnv('VITE_APP_ENV', import.meta.env.MODE || 'development'),
  isDev: Boolean(import.meta.env.DEV),
  isProd: Boolean(import.meta.env.PROD),

  /** Public URL base path for Azure / subpath hosting (must end handling via Vite `base`) */
  basePath: readEnv('VITE_BASE_PATH', '/'),

  /**
   * When false, Teams SDK init is skipped entirely (pure browser builds).
   * Default true: detect host at runtime without breaking browser use.
   */
  teamsEnabled: readBoolean('VITE_TEAMS_ENABLED', true),

  /** Reserved for future Microsoft Entra ID / Teams SSO (Phase 2+) */
  azureAdClientId: readEnv('VITE_AZURE_AD_CLIENT_ID', ''),
  azureAdTenantId: readEnv('VITE_AZURE_AD_TENANT_ID', ''),
  azureAdRedirectUri: readEnv('VITE_AZURE_AD_REDIRECT_URI', ''),

  /** Reserved for future API / sync backend */
  apiBaseUrl: readEnv('VITE_API_BASE_URL', ''),
}

export function isTeamsAuthConfigured() {
  return Boolean(appEnv.azureAdClientId && appEnv.azureAdTenantId)
}
