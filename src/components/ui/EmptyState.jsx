function EmptyState({ title, text, children, className = '' }) {
  return (
    <div className={`empty-state${className ? ` ${className}` : ''}`}>
      <p className="empty-state-title">{title}</p>
      {text ? <p className="empty-state-text">{text}</p> : null}
      {children ? <div className="empty-state-actions">{children}</div> : null}
    </div>
  )
}

export default EmptyState
