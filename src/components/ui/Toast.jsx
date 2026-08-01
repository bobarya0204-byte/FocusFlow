function ToastItem({ toast, onUndo, onDismiss }) {
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
            onClick={() => onUndo(toast.id)}
          >
            Undo
          </button>
        )}
        <button
          type="button"
          className="app-toast-dismiss"
          onClick={() => onDismiss(toast.id)}
          aria-label="Dismiss notification"
        >
          ×
        </button>
      </div>
    </div>
  )
}

function Toast({ toasts = [], toast = null, onUndo, onDismiss }) {
  const items = Array.isArray(toasts) && toasts.length > 0
    ? toasts
    : toast
      ? [toast]
      : []

  if (items.length === 0) {
    return null
  }

  return (
    <div className="app-toast-stack" aria-relevant="additions text">
      {items.map((item) => (
        <ToastItem
          key={item.id}
          toast={item}
          onUndo={onUndo}
          onDismiss={onDismiss}
        />
      ))}
    </div>
  )
}

export default Toast
