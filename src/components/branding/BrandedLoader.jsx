function BrandedLoader({ exiting = false }) {
  return (
    <div
      className={`branded-loader${exiting ? ' branded-loader-exiting' : ''}`}
      role="status"
      aria-live="polite"
      aria-label="Loading FocusFlow"
    >
      <div className="branded-loader-content">
        <p className="branded-loader-title">FocusFlow</p>
        <div className="branded-loader-indicator" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </div>
    </div>
  )
}

export default BrandedLoader
