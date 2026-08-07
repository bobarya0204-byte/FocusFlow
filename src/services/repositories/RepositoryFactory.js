import { appEnv } from '../../config/env.js'
import { assertIDataRepository } from './IDataRepository.js'
import { ApiRepository } from './ApiRepository.js'
import { LocalStorageRepository } from './LocalStorageRepository.js'

/**
 * @typedef {Object} RepositoryFactoryOptions
 * @property {import('../../auth/authTypes.js').FocusFlowUser} [user]
 * @property {string} [authenticationMode]
 * @property {'api'|'local'} [repositoryMode]
 */

export const REPOSITORY_MODES = {
  API: 'api',
  LOCAL: 'local',
}

const localStorageRepository = new LocalStorageRepository()
const apiRepository = new ApiRepository()

/**
 * Resolve the active data repository for the current identity context.
 * Default: ApiRepository (tasks via REST API, other keys via localStorage).
 *
 * @param {RepositoryFactoryOptions} [options]
 * @returns {import('./IDataRepository.js').IDataRepository}
 */
export function createRepository(options = {}) {
  void options.user
  void options.authenticationMode

  const mode = options.repositoryMode ?? appEnv.repositoryMode ?? REPOSITORY_MODES.API

  if (mode === REPOSITORY_MODES.LOCAL) {
    return localStorageRepository
  }

  return apiRepository
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
