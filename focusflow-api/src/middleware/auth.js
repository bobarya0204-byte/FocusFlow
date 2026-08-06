import { getAzureAuthConfig } from '../config/azureAuth.js'
import { ensureUserFixtures } from '../database/ensureUserFixtures.js'
import { HttpError } from '../utils/httpError.js'
import {
  extractTokenScopes,
  tokenHasRequiredScope,
  verifyAccessToken,
} from '../utils/entraTokenVerifier.js'

/**
 * Validates Microsoft Entra access tokens and attaches auth context to the request.
 *
 * @param {import('better-sqlite3').Database} db
 */
export function createRequireEntraAuth(db) {
  return async function requireEntraAuth(req, _res, next) {
    try {
      const authHeader = req.headers.authorization
      if (!authHeader?.startsWith('Bearer ')) {
        throw new HttpError(401, 'Missing access token')
      }

      const token = authHeader.slice('Bearer '.length).trim()
      if (!token) {
        throw new HttpError(401, 'Missing access token')
      }

      const payload = await verifyAccessToken(token)

      if (typeof payload.oid !== 'string' || payload.oid.length === 0) {
        throw new HttpError(401, 'Token missing object id claim')
      }

      const scopes = extractTokenScopes(payload)
      const { requiredScope } = getAzureAuthConfig()

      if (!tokenHasRequiredScope(scopes, requiredScope)) {
        throw new HttpError(403, 'Insufficient scope for this resource')
      }

      req.auth = {
        oid: payload.oid,
        tenantId: typeof payload.tid === 'string' ? payload.tid : null,
        email:
          (typeof payload.preferred_username === 'string' &&
            payload.preferred_username) ||
          (typeof payload.upn === 'string' && payload.upn) ||
          (typeof payload.email === 'string' && payload.email) ||
          null,
        displayName: typeof payload.name === 'string' ? payload.name : null,
        scopes,
      }

      ensureUserFixtures(db, req.auth)
      next()
    } catch (error) {
      if (error instanceof HttpError) {
        next(error)
        return
      }

      next(new HttpError(401, 'Invalid access token'))
    }
  }
}

/** @deprecated Use createRequireEntraAuth */
export function authMiddleware(_req, _res, next) {
  next()
}
