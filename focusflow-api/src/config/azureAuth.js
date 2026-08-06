/**
 * Microsoft Entra ID settings for access-token validation.
 * Loaded from environment on first use.
 */

let cachedConfig = null

/**
 * @returns {{
 *   tenantId: string,
 *   clientId: string,
 *   audiences: string[],
 *   issuers: string[],
 *   requiredScope: string,
 * }}
 */
export function getAzureAuthConfig() {
  if (cachedConfig) {
    return cachedConfig
  }

  const tenantId = process.env.AZURE_TENANT_ID || ''
  const clientId = process.env.AZURE_CLIENT_ID || ''

  if (!tenantId || !clientId) {
    throw new Error(
      'AZURE_TENANT_ID and AZURE_CLIENT_ID must be set for Entra authentication',
    )
  }

  const apiAudience =
    process.env.AZURE_API_AUDIENCE || `api://${clientId}`

  cachedConfig = {
    tenantId,
    clientId,
    audiences: [clientId, apiAudience],
    issuers: [
      `https://login.microsoftonline.com/${tenantId}/v2.0`,
      `https://sts.windows.net/${tenantId}/`,
    ],
    requiredScope: process.env.AZURE_REQUIRED_SCOPE || 'access_as_user',
  }

  return cachedConfig
}

export function isAzureAuthConfigured() {
  return Boolean(process.env.AZURE_TENANT_ID && process.env.AZURE_CLIENT_ID)
}
