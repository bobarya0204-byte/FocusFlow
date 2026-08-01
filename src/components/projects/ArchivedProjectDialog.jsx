import { useRef } from 'react'
import { useEscapeKey } from '../../hooks/useEscapeKey'
import { useFocusTrap } from '../../hooks/useFocusTrap'

function ArchivedProjectDialog({ project, onRestore, onCancel }) {
  const dialogRef = useRef(null)

  useEscapeKey(Boolean(project), onCancel)
  useFocusTrap(Boolean(project), dialogRef)

  if (!project) {
    return null
  }

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div
        ref={dialogRef}
        className="modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="archived-guard-title"
        aria-describedby="archived-guard-text"
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="archived-guard-title">Project archived</h2>
        <p id="archived-guard-text" className="modal-message">
          This project is archived.
          <br />
          Restore it to continue working.
        </p>
        <div className="modal-actions">
          <button
            type="button"
            className="modal-btn modal-btn-cancel"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className="modal-btn modal-btn-create"
            onClick={onRestore}
            data-autofocus
          >
            Restore Project
          </button>
        </div>
      </div>
    </div>
  )
}

export default ArchivedProjectDialog
