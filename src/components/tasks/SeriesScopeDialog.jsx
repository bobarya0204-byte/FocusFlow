import { useRef, useState } from 'react'
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock'
import { useEscapeKey } from '../../hooks/useEscapeKey'
import { useFocusTrap } from '../../hooks/useFocusTrap'
import { SERIES_SCOPES } from '../../utils/recurrenceSeries'

const DELETE_OPTIONS = [
  {
    id: SERIES_SCOPES.OCCURRENCE,
    label: 'This occurrence only',
    description: 'Remove this instance and keep the rest of the series.',
  },
  {
    id: SERIES_SCOPES.FUTURE,
    label: 'This and future occurrences',
    description: 'Remove this instance and all upcoming open occurrences.',
  },
  {
    id: SERIES_SCOPES.SERIES,
    label: 'Entire series',
    description: 'Remove every occurrence in this recurring series.',
  },
]

function SeriesScopeDialog({
  title = 'Delete recurring task',
  message = 'Choose how much of this recurring series to remove.',
  options = DELETE_OPTIONS,
  confirmLabel = 'Delete',
  confirmVariant = 'danger',
  stacked = false,
  onConfirm,
  onCancel,
}) {
  const [scope, setScope] = useState(options[0]?.id ?? SERIES_SCOPES.OCCURRENCE)
  const overlayRef = useRef(null)

  useBodyScrollLock(true)
  useEscapeKey(true, onCancel)
  useFocusTrap(true, overlayRef)

  return (
    <div
      ref={overlayRef}
      className={`modal-overlay${stacked ? ' modal-overlay-stacked' : ''}`}
      tabIndex={-1}
      onClick={onCancel}
    >
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="series-scope-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="series-scope-title">{title}</h2>
        <p className="modal-message">{message}</p>

        <div className="series-scope-options" role="radiogroup" aria-label="Series scope">
          {options.map(({ id, label, description }) => (
            <label key={id} className={`series-scope-option${scope === id ? ' active' : ''}`}>
              <input
                type="radio"
                name="series-scope"
                value={id}
                checked={scope === id}
                onChange={() => setScope(id)}
              />
              <span className="series-scope-copy">
                <span className="series-scope-label">{label}</span>
                <span className="series-scope-description">{description}</span>
              </span>
            </label>
          ))}
        </div>

        <div className="modal-actions">
          <button type="button" className="modal-btn modal-btn-cancel" onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className={`modal-btn modal-btn-create${confirmVariant === 'danger' ? ' danger' : ''}`}
            onClick={() => onConfirm(scope)}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export { DELETE_OPTIONS }

export default SeriesScopeDialog
