function Toast({ toast, onUndo, onDismiss }) {
  if (!toast) {
    return null
  }

  const tone = toast.type || 'info'
  const isAssertive = tone === 'error' || tone === 'warning'

  return (
    <div
      className={`app-toast app-toast-${tone}`}
      role="status"
      aria-live={isAssertive ? 'assertive' : 'polite'}
    >
      <p className="app-toast-message">{toast.message}</p>
      <div className="app-toast-actions">
        {typeof toast.onUndo === 'function' && (
          <button
            type="button"
            className="app-toast-undo"
            onClick={onUndo}
          >
            Undo
          </button>
        )}
        <button
          type="button"
          className="app-toast-dismiss"
          onClick={onDismiss}
          aria-label="Dismiss notification"
        >
          ×
        </button>
      </div>
    </div>
  )
}

export default Toast
