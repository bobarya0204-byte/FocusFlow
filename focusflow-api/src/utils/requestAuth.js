import { HttpError } from './httpError.js'

/**
 * @param {import('express').Request} req
 * @returns {string}
 */
export function getAuthenticatedOwnerId(req) {
  const oid = req.auth?.oid
  if (typeof oid !== 'string' || oid.length === 0) {
    throw new HttpError(401, 'Authentication required')
  }
  return oid
}
