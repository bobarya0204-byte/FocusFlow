import { appEnv, getAzureAuthority, isAzureAuthConfigured } from './env.js'

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const AUTHORITY_PATTERN =
  /^https:\/\/login\.microsoftonline\.com\/[0-9a-f-]{36}$/i

function isValidHttpUrl(value) {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function normalizeOrigin(value) {
  try {
    return new URL(value).origin
  } catch {
    return value.replace(/\/+$/, '')
  }
}

/**
 * Validate Microsoft Entra environment configuration.
 * @param {{ currentOrigin?: string }} [options]
 */
export function validateAzureConfig(options = {}) {
  const currentOrigin =
    options.currentOrigin ??
    (typeof window !== 'undefined' ? window.location.origin : '')

  const errors = []
  const warnings = []
  const authority = getAzureAuthority()

  if (!appEnv.azureClientId) {
    errors.push('VITE_AZURE_CLIENT_ID is missing.')
  } else if (!UUID_PATTERN.test(appEnv.azureClientId)) {
    errors.push('VITE_AZURE_CLIENT_ID is not a valid GUID.')
  }

  if (!appEnv.azureTenantId) {
    errors.push('VITE_AZURE_TENANT_ID is missing.')
  } else if (!UUID_PATTERN.test(appEnv.azureTenantId)) {
    errors.push('VITE_AZURE_TENANT_ID is not a valid GUID.')
  }

  if (!authority) {
    errors.push(
      'Authority is missing. Set VITE_AZURE_AUTHORITY or VITE_AZURE_TENANT_ID.',
    )
  } else if (!AUTHORITY_PATTERN.test(authority)) {
    warnings.push(
      `Authority "${authority}" does not match the expected single-tenant format (https://login.microsoftonline.com/{tenantId}).`,
    )
  } else if (
    appEnv.azureTenantId &&
    !authority.toLowerCase().endsWith(appEnv.azureTenantId.toLowerCase())
  ) {
    errors.push(
      'VITE_AZURE_AUTHORITY tenant segment does not match VITE_AZURE_TENANT_ID.',
    )
  }

  if (!appEnv.azureRedirectUri) {
    warnings.push(
      'VITE_AZURE_REDIRECT_URI is not set — MSAL will fall back to window.location.origin.',
    )
  } else if (!isValidHttpUrl(appEnv.azureRedirectUri)) {
    errors.push('VITE_AZURE_REDIRECT_URI is not a valid URL.')
  } else if (
    currentOrigin &&
    normalizeOrigin(appEnv.azureRedirectUri) !== normalizeOrigin(currentOrigin)
  ) {
    warnings.push(
      `VITE_AZURE_REDIRECT_URI (${appEnv.azureRedirectUri}) does not match the current origin (${currentOrigin}). Ensure this URI is registered as an SPA redirect URI in Entra.`,
    )
  }

  if (!appEnv.azurePostLogoutRedirectUri) {
    warnings.push(
      'VITE_AZURE_POST_LOGOUT_REDIRECT_URI is not set — MSAL will fall back to the redirect URI or origin.',
    )
  } else if (!isValidHttpUrl(appEnv.azurePostLogoutRedirectUri)) {
    errors.push('VITE_AZURE_POST_LOGOUT_REDIRECT_URI is not a valid URL.')
  }

  return {
    isConfigured: isAzureAuthConfigured(),
    isValid: errors.length === 0,
    errors,
    warnings,
    summary: {
      clientId: appEnv.azureClientId,
      tenantId: appEnv.azureTenantId,
      authority,
      redirectUri:
        appEnv.azureRedirectUri ||
        currentOrigin ||
        '(runtime origin fallback)',
      postLogoutRedirectUri:
        appEnv.azurePostLogoutRedirectUri ||
        appEnv.azureRedirectUri ||
        currentOrigin ||
        '(runtime origin fallback)',
      currentOrigin: currentOrigin || null,
    },
  }
}

/**
 * Development-only structured logging for Entra configuration validation.
 * @param {ReturnType<typeof validateAzureConfig>} validation
 * @param {{ authenticationMode: string, plannedMode: string, msalInitialized: boolean }} runtime
 */
export function logEntraConfigInDev(validation, runtime) {
  if (!appEnv.isDev) {
    return
  }

  if (!validation.isConfigured) {
    console.info('[FocusFlow Auth] Entra configuration not detected — LOCAL mode.')
    return
  }

  console.group('[FocusFlow Auth] Entra configuration')
  console.info('Entra configuration detected')
  console.table(validation.summary)

  if (validation.errors.length > 0) {
    console.error('Configuration errors:', validation.errors)
  }

  if (validation.warnings.length > 0) {
    console.warn('Configuration warnings:', validation.warnings)
  }

  if (runtime.msalInitialized) {
    console.info('MSAL initialized successfully')
  } else {
    console.warn('MSAL was not initialized')
  }

  console.info('Current authentication mode:', runtime.authenticationMode)
  console.info('Planned authentication mode (when enabled):', runtime.plannedMode)
  console.groupEnd()
}
