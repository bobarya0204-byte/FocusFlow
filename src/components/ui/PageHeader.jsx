function PageHeader({ title, subtitle, actions = null, className = '' }) {
  return (
    <header className={`page-header${className ? ` ${className}` : ''}`}>
      <div className="page-header-text">
        <h1>{title}</h1>
        {subtitle ? <p className="subtitle">{subtitle}</p> : null}
      </div>
      {actions ? <div className="page-header-actions">{actions}</div> : null}
    </header>
  )
}

export default PageHeader
