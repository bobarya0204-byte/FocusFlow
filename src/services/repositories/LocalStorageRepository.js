import { readJson, writeJson } from '../../utils/storage.js'

/**
 * Local persistence via existing storage helpers.
 * Preserves all storage keys and error semantics.
 *
 * @implements {import('./IDataRepository.js').IDataRepository}
 */
export class LocalStorageRepository {
  /**
   * @param {string} key
   * @param {unknown|(() => unknown)} fallback
   */
  read(key, fallback) {
    return readJson(key, fallback)
  }

  /**
   * @param {string} key
   * @param {unknown} value
   * @returns {import('./IDataRepository.js').RepositoryWriteResult}
   */
  write(key, value) {
    return writeJson(key, value)
  }
}
