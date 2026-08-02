import { AUTHENTICATION_MODES } from '../../auth/authTypes.js'
import { assertIDataRepository } from './IDataRepository.js'
import { LocalStorageRepository } from './LocalStorageRepository.js'

/**
 * @typedef {Object} RepositoryFactoryOptions
 * @property {import('../../auth/authTypes.js').FocusFlowUser} [user]
 * @property {string} [authenticationMode]
 */

const localStorageRepository = new LocalStorageRepository()

/**
 * Resolve the active data repository for the current identity context.
 * Step 1: always LocalStorageRepository regardless of mode.
 *
 * @param {RepositoryFactoryOptions} [options]
 * @returns {import('./IDataRepository.js').IDataRepository}
 */
export function createRepository(options = {}) {
  const { authenticationMode = AUTHENTICATION_MODES.LOCAL } = options
  void options.user

  switch (authenticationMode) {
    case AUTHENTICATION_MODES.LOCAL:
    case AUTHENTICATION_MODES.BROWSER_MSAL:
    case AUTHENTICATION_MODES.TEAMS_SSO:
    default:
      return localStorageRepository
  }
}

/**
 * @param {RepositoryFactoryOptions} [options]
 * @returns {import('./IDataRepository.js').IDataRepository}
 */
export function getRepository(options = {}) {
  const repository = createRepository(options)
  assertIDataRepository(repository)
  return repository
}
