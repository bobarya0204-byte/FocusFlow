import { useMemo, useState } from 'react'
import { Sparkles, Check, Pencil, X } from 'lucide-react'
import { useFocusFlow } from '../../context/FocusFlowContext'
import PageHeader from '../ui/PageHeader'
import EmptyState from '../ui/EmptyState'
import { extractActionItems } from '../../utils/aiInbox'
import { normalizePriority } from '../../utils/tasks'

function AiInboxPage() {
  const { projects, createTasksFromSuggestions } = useFocusFlow()
  const [rawText, setRawText] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [provider, setProvider] = useState('')
  const [editingId, setEditingId] = useState(null)

  const activeProjects = useMemo(
    () => projects.filter((project) => !project.archived),
    [projects],
  )

  function handleExtract() {
    const result = extractActionItems(rawText, { projects: activeProjects })
    setProvider(result.provider)
    setSuggestions(result.suggestions)
    setEditingId(null)
  }

  function updateSuggestion(id, patch) {
    setSuggestions((current) =>
      current.map((item) =>
        item.id === id ? { ...item, ...patch } : item,
      ),
    )
  }

  function rejectSuggestion(id) {
    setSuggestions((current) => current.filter((item) => item.id !== id))
    if (editingId === id) {
      setEditingId(null)
    }
  }

  function approveSuggestion(id) {
    const target = suggestions.find((item) => item.id === id)
    if (!target) return
    createTasksFromSuggestions([target])
    rejectSuggestion(id)
  }

  function approveAll() {
    if (suggestions.length === 0) return
    createTasksFromSuggestions(suggestions)
    setSuggestions([])
    setEditingId(null)
  }

  return (
    <main className="main">
      <PageHeader
        title="AI Inbox"
        subtitle="Paste notes, emails, or chat logs. Review suggested tasks before they enter FocusFlow."
      />

      <section className="ai-inbox-layout">
        <article className="ai-inbox-input-card">
          <label className="modal-field">
            <span className="modal-label">Source text</span>
            <textarea
              className="modal-input modal-textarea ai-inbox-textarea"
              rows={12}
              value={rawText}
              onChange={(event) => setRawText(event.target.value)}
              placeholder={`Paste anything, for example:\n\n- Follow up with design on the launch checklist tomorrow\n- Urgent: send invoice to finance ASAP\n- Weekly review every Friday\n- Drink water`}
            />
          </label>
          <div className="ai-inbox-actions">
            <button
              type="button"
              className="page-add-btn"
              onClick={handleExtract}
              disabled={!rawText.trim()}
            >
              <Sparkles size={16} strokeWidth={1.75} aria-hidden="true" />
              Extract tasks
            </button>
            {provider && (
              <span className="section-heading-meta">
                Provider: {provider}
              </span>
            )}
          </div>
        </article>

        <article className="ai-inbox-review-card">
          <div className="section-heading">
            <h2>Review suggestions</h2>
            {suggestions.length > 0 && (
              <button
                type="button"
                className="page-secondary-btn"
                onClick={approveAll}
              >
                Approve all
              </button>
            )}
          </div>

          {suggestions.length === 0 ? (
            <EmptyState
              title="No suggestions yet"
              text="Extract action items from the text on the left. Only approved items become real tasks."
            />
          ) : (
            <ul className="ai-suggestion-list">
              {suggestions.map((suggestion) => {
                const isEditing = editingId === suggestion.id
                return (
                  <li key={suggestion.id} className="ai-suggestion-item">
                    {isEditing ? (
                      <div className="ai-suggestion-edit">
                        <input
                          className="modal-input"
                          value={suggestion.title}
                          onChange={(event) =>
                            updateSuggestion(suggestion.id, {
                              title: event.target.value,
                            })
                          }
                        />
                        <div className="modal-field-row">
                          <select
                            className="modal-select"
                            value={suggestion.priority}
                            onChange={(event) =>
                              updateSuggestion(suggestion.id, {
                                priority: normalizePriority(event.target.value),
                              })
                            }
                          >
                            <option value="High">High</option>
                            <option value="Medium">Medium</option>
                            <option value="Low">Low</option>
                          </select>
                          <input
                            type="date"
                            className="modal-input"
                            value={suggestion.dueDate || ''}
                            onChange={(event) =>
                              updateSuggestion(suggestion.id, {
                                dueDate: event.target.value || null,
                              })
                            }
                          />
                          <select
                            className="modal-select"
                            value={suggestion.projectId}
                            onChange={(event) =>
                              updateSuggestion(suggestion.id, {
                                projectId: event.target.value,
                              })
                            }
                          >
                            {activeProjects.map((project) => (
                              <option key={project.id} value={project.id}>
                                {project.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="ai-suggestion-buttons">
                          <button
                            type="button"
                            className="page-secondary-btn"
                            onClick={() => setEditingId(null)}
                          >
                            Done
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="ai-suggestion-main">
                          <p className="ai-suggestion-title">{suggestion.title}</p>
                          <p className="ai-suggestion-meta">
                            {suggestion.priority}
                            {suggestion.dueDate ? ` · Due ${suggestion.dueDate}` : ''}
                            {' · '}
                            {activeProjects.find(
                              (project) => project.id === suggestion.projectId,
                            )?.name || 'Uncategorized'}
                          </p>
                          <p className="ai-suggestion-source">{suggestion.sourceText}</p>
                        </div>
                        <div className="ai-suggestion-buttons">
                          <button
                            type="button"
                            className="icon-btn"
                            aria-label="Approve suggestion"
                            title="Approve"
                            onClick={() => approveSuggestion(suggestion.id)}
                          >
                            <Check size={15} strokeWidth={1.75} />
                          </button>
                          <button
                            type="button"
                            className="icon-btn"
                            aria-label="Edit suggestion"
                            title="Edit"
                            onClick={() => setEditingId(suggestion.id)}
                          >
                            <Pencil size={15} strokeWidth={1.75} />
                          </button>
                          <button
                            type="button"
                            className="icon-btn danger"
                            aria-label="Reject suggestion"
                            title="Reject"
                            onClick={() => rejectSuggestion(suggestion.id)}
                          >
                            <X size={15} strokeWidth={1.75} />
                          </button>
                        </div>
                      </>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </article>
      </section>
    </main>
  )
}

export default AiInboxPage
