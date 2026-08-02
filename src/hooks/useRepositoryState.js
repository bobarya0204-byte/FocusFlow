import { useEffect, useState } from 'react'

/**
 * Persist React state through an IDataRepository whenever it changes.
 * Mirrors useLocalStorageState semantics with repository indirection.
 *
 * @param {import('../services/repositories/IDataRepository.js').IDataRepository} repository
 * @param {string} key
 * @param {unknown|(() => unknown)} getInitial
 */
export function useRepositoryState(repository, key, getInitial) {
  const [state, setState] = useState(() => repository.read(key, getInitial))

  useEffect(() => {
    repository.write(key, state)
  }, [repository, key, state])

  return [state, setState]
}
