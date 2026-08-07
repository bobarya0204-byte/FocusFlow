/** @type {(() => Promise<string|null>)|null} */
let accessTokenProvider = null

/**
 * Register a function that returns the current Microsoft Entra access token.
 * @param {(() => Promise<string|null>)|null} provider
 */
export function setAccessTokenProvider(provider) {
  accessTokenProvider = provider
}

/**
 * @returns {Promise<string|null>}
 */
export async function getAccessToken() {
  if (!accessTokenProvider) {
    return null
  }
  return accessTokenProvider()
}
