import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { FolderKanban, ListTodo, Search } from 'lucide-react'
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { useEscapeKey } from '../../hooks/useEscapeKey'
import { useFocusTrap } from '../../hooks/useFocusTrap'
import {
  flattenSearchResults,
  normalizeSearchQuery,
  searchUniversal,
} from '../../utils/universalSearch'
import HighlightText from './HighlightText'

function UniversalSearch({
  isOpen,
  onClose,
  tasks,
  projects,
  onSelectTask,
  onSelectProject,
}) {
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef(null)
  const overlayRef = useRef(null)
  const listRef = useRef(null)

  const debouncedQuery = useDebouncedValue(query, 200)

  const groups = useMemo(
    () =>
      searchUniversal({
        tasks,
        projects,
        query: debouncedQuery,
      }),
    [tasks, projects, debouncedQuery],
  )

  const flatResults = useMemo(() => flattenSearchResults(groups), [groups])
  const hasQuery = normalizeSearchQuery(debouncedQuery).length > 0

  useBodyScrollLock(isOpen)
  useEscapeKey(isOpen, onClose)
  useFocusTrap(isOpen, overlayRef)

  useEffect(() => {
    if (!isOpen) {
      return
    }
    setQuery('')
    setActiveIndex(0)
    const frame = window.requestAnimationFrame(() => {
      inputRef.current?.focus()
    })
    return () => window.cancelAnimationFrame(frame)
  }, [isOpen])

  useEffect(() => {
    setActiveIndex(0)
  }, [debouncedQuery])

  useEffect(() => {
    if (!isOpen || flatResults.length === 0) {
      return
    }
    const active = listRef.current?.querySelector(
      `[data-result-index="${activeIndex}"]`,
    )
    active?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex, flatResults.length, isOpen])

  const activateResult = useCallback(
    (result) => {
      if (!result) {
        return
      }
      if (result.type === 'task') {
        onSelectTask(result.task)
      } else {
        onSelectProject(result.project)
      }
      onClose()
    },
    [onClose, onSelectProject, onSelectTask],
  )

  function handleKeyDown(event) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      if (flatResults.length === 0) {
        return
      }
      setActiveIndex((current) => (current + 1) % flatResults.length)
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      if (flatResults.length === 0) {
        return
      }
      setActiveIndex(
        (current) => (current - 1 + flatResults.length) % flatResults.length,
      )
      return
    }

    if (event.key === 'Enter') {
      event.preventDefault()
      activateResult(flatResults[activeIndex])
    }
  }

  if (!isOpen) {
    return null
  }

  let resultIndex = -1

  return (
    <div
      ref={overlayRef}
      className="modal-overlay modal-overlay-stacked universal-search-overlay"
      tabIndex={-1}
      onClick={onClose}
      onKeyDown={handleKeyDown}
    >
      <div
        className="universal-search"
        role="dialog"
        aria-modal="true"
        aria-label="Search FocusFlow"
        onClick={(event) => event.stopPropagation()}
      >
        <label className="universal-search-input-wrap">
          <Search size={18} strokeWidth={1.75} aria-hidden="true" />
          <input
            ref={inputRef}
            type="search"
            className="universal-search-input"
            placeholder="Search tasks and projects…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-controls="universal-search-results"
            aria-activedescendant={
              flatResults.length > 0
                ? `universal-search-result-${activeIndex}`
                : undefined
            }
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
          />
          <kbd className="universal-search-kbd" aria-hidden="true">
            Esc
          </kbd>
        </label>

        <div
          id="universal-search-results"
          ref={listRef}
          className="universal-search-results"
          role="listbox"
          aria-label="Search results"
        >
          {!hasQuery && (
            <p className="universal-search-hint">
              Search task titles, descriptions, notes, and project names.
            </p>
          )}

          {hasQuery && flatResults.length === 0 && (
            <p className="universal-search-empty">No results for “{query.trim()}”</p>
          )}

          {groups.tasks.length > 0 && (
            <section className="universal-search-group" aria-label="Tasks">
              <h3 className="universal-search-group-label">Tasks</h3>
              <ul className="universal-search-list">
                {groups.tasks.map((result) => {
                  resultIndex += 1
                  const index = resultIndex
                  const label =
                    result.matchField === 'title'
                      ? result.task.title
                      : result.matchField === 'description'
                        ? result.task.description
                        : result.task.notes
                  return (
                    <li key={String(result.task.id)}>
                      <button
                        type="button"
                        id={`universal-search-result-${index}`}
                        data-result-index={index}
                        className={`universal-search-item${
                          activeIndex === index ? ' active' : ''
                        }`}
                        role="option"
                        aria-selected={activeIndex === index}
                        onMouseEnter={() => setActiveIndex(index)}
                        onClick={() => activateResult(result)}
                      >
                        <span className="universal-search-item-icon" aria-hidden="true">
                          <ListTodo size={16} strokeWidth={1.75} />
                        </span>
                        <span className="universal-search-item-copy">
                          <span className="universal-search-item-title">
                            <HighlightText
                              text={result.task.title}
                              query={debouncedQuery}
                            />
                          </span>
                          {result.matchField !== 'title' && label ? (
                            <span className="universal-search-item-meta">
                              <HighlightText text={label} query={debouncedQuery} />
                            </span>
                          ) : result.project?.name ? (
                            <span className="universal-search-item-meta">
                              {result.project.icon} {result.project.name}
                            </span>
                          ) : null}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </section>
          )}

          {groups.projects.length > 0 && (
            <section className="universal-search-group" aria-label="Projects">
              <h3 className="universal-search-group-label">Projects</h3>
              <ul className="universal-search-list">
                {groups.projects.map((result) => {
                  resultIndex += 1
                  const index = resultIndex
                  const label =
                    result.matchField === 'name'
                      ? result.project.name
                      : result.project.description
                  return (
                    <li key={String(result.project.id)}>
                      <button
                        type="button"
                        id={`universal-search-result-${index}`}
                        data-result-index={index}
                        className={`universal-search-item${
                          activeIndex === index ? ' active' : ''
                        }`}
                        role="option"
                        aria-selected={activeIndex === index}
                        onMouseEnter={() => setActiveIndex(index)}
                        onClick={() => activateResult(result)}
                      >
                        <span className="universal-search-item-icon" aria-hidden="true">
                          <FolderKanban size={16} strokeWidth={1.75} />
                        </span>
                        <span className="universal-search-item-copy">
                          <span className="universal-search-item-title">
                            {result.matchField === 'name' ? (
                              <HighlightText
                                text={result.project.name}
                                query={debouncedQuery}
                              />
                            ) : (
                              <>
                                {result.project.icon} {result.project.name}
                              </>
                            )}
                          </span>
                          {result.matchField === 'description' && label ? (
                            <span className="universal-search-item-meta">
                              <HighlightText text={label} query={debouncedQuery} />
                            </span>
                          ) : null}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </section>
          )}
        </div>

        <footer className="universal-search-footer" aria-hidden="true">
          <span>
            <kbd>↑</kbd> <kbd>↓</kbd> navigate
          </span>
          <span>
            <kbd>Enter</kbd> open
          </span>
          <span>
            <kbd>Esc</kbd> close
          </span>
        </footer>
      </div>
    </div>
  )
}

export default UniversalSearch
