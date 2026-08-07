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

function readFirstEnv(keys, fallback = '') {
  for (const key of keys) {
    const value = readEnv(key, '')
    if (value !== '') {
      return value
    }
  }
  return fallback
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

  /** Microsoft Entra ID — primary variable names (Step 2+) */
  azureClientId: readFirstEnv([
    'VITE_AZURE_CLIENT_ID',
    'VITE_AZURE_AD_CLIENT_ID',
  ]),
  azureTenantId: readFirstEnv([
    'VITE_AZURE_TENANT_ID',
    'VITE_AZURE_AD_TENANT_ID',
  ]),
  azureAuthority: readEnv('VITE_AZURE_AUTHORITY', ''),
  azureRedirectUri: readFirstEnv([
    'VITE_AZURE_REDIRECT_URI',
    'VITE_AZURE_AD_REDIRECT_URI',
  ]),
  azurePostLogoutRedirectUri: readEnv(
    'VITE_AZURE_POST_LOGOUT_REDIRECT_URI',
    '',
  ),

  /** @deprecated Use azureClientId — kept for legacy env files */
  azureAdClientId: readFirstEnv([
    'VITE_AZURE_AD_CLIENT_ID',
    'VITE_AZURE_CLIENT_ID',
  ]),
  /** @deprecated Use azureTenantId */
  azureAdTenantId: readFirstEnv([
    'VITE_AZURE_AD_TENANT_ID',
    'VITE_AZURE_TENANT_ID',
  ]),
  /** @deprecated Use azureRedirectUri */
  azureAdRedirectUri: readFirstEnv([
    'VITE_AZURE_AD_REDIRECT_URI',
    'VITE_AZURE_REDIRECT_URI',
  ]),

  /** FocusFlow REST API base URL (includes /api suffix) */
  apiBaseUrl: readEnv('VITE_API_BASE_URL', 'http://localhost:3001/api'),

  /** Custom Entra API scope (defaults to api://{clientId}/access_as_user) */
  azureApiScope: readEnv('VITE_AZURE_API_SCOPE', ''),

  /** api | local — defaults to api (Sprint 4.4) */
  repositoryMode: readEnv('VITE_REPOSITORY_MODE', 'api'),
}

/**
 * Single-tenant authority URL for MSAL.
 * Uses VITE_AZURE_AUTHORITY when set, otherwise builds from tenant id.
 */
export function getAzureAuthority() {
  if (appEnv.azureAuthority) {
    return appEnv.azureAuthority
  }

  if (appEnv.azureTenantId) {
    return `https://login.microsoftonline.com/${appEnv.azureTenantId}`
  }

  return ''
}

/** True when minimum Entra registration values are present in the environment. */
export function isAzureAuthConfigured() {
  return Boolean(appEnv.azureClientId && getAzureAuthority())
}

/**
 * Scopes requested when acquiring an access token for the FocusFlow API.
 * @returns {string[]}
 */
export function getAzureApiScopes() {
  if (appEnv.azureApiScope) {
    return appEnv.azureApiScope.split(/[\s,]+/).filter(Boolean)
  }

  if (appEnv.azureClientId) {
    return [`api://${appEnv.azureClientId}/access_as_user`]
  }

  return []
}

/**
 * Whether interactive Entra authentication is enabled.
 * Step 3A: default false — LOCAL mode stays active while configuration is validated.
 */
export function isLiveEntraAuthEnabled() {
  return readBoolean('VITE_AZURE_AUTH_ENABLED', false)
}

/** @deprecated Use isAzureAuthConfigured */
export function isTeamsAuthConfigured() {
  return isAzureAuthConfigured()
}
