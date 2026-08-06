import jwt from 'jsonwebtoken'
import jwksClient from 'jwks-rsa'
import { getAzureAuthConfig } from '../config/azureAuth.js'

/** @type {import('jwks-rsa').JwksClient|null} */
let jwks = null

function getJwksClient() {
  if (!jwks) {
    const { tenantId } = getAzureAuthConfig()
    jwks = jwksClient({
      jwksUri: `https://login.microsoftonline.com/${tenantId}/discovery/v2.0/keys`,
      cache: true,
      cacheMaxAge: 600_000,
      rateLimit: true,
      jwksRequestsPerMinute: 10,
    })
  }
  return jwks
}

/**
 * @param {string} kid
 * @returns {Promise<string>}
 */
function getSigningKey(kid) {
  return new Promise((resolve, reject) => {
    getJwksClient().getSigningKey(kid, (error, key) => {
      if (error) {
        reject(error)
        return
      }
      resolve(key.getPublicKey())
    })
  })
}

/**
 * @param {string} token
 * @returns {Promise<import('jsonwebtoken').JwtPayload>}
 */
export async function verifyAccessToken(token) {
  const decoded = jwt.decode(token, { complete: true })
  if (!decoded || typeof decoded === 'string' || !decoded.header?.kid) {
    throw new Error('Invalid token header')
  }

  const signingKey = await getSigningKey(decoded.header.kid)
  const config = getAzureAuthConfig()

  return jwt.verify(token, signingKey, {
    audience: config.audiences,
    issuer: config.issuers,
    algorithms: ['RS256'],
  })
}

/**
 * @param {string[]} scopes
 * @param {string} requiredScope
 */
export function tokenHasRequiredScope(scopes, requiredScope) {
  if (!requiredScope) {
    return true
  }
  return scopes.includes(requiredScope)
}

/**
 * @param {import('jsonwebtoken').JwtPayload} payload
 * @returns {string[]}
 */
export function extractTokenScopes(payload) {
  if (typeof payload.scp === 'string' && payload.scp.length > 0) {
    return payload.scp.split(' ')
  }

  if (Array.isArray(payload.roles)) {
    return payload.roles
  }

  return []
}
