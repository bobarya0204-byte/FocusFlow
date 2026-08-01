function IconButton({
  label,
  onClick,
  children,
  className = '',
  title,
  expanded,
  type = 'button',
  disabled = false,
  ...rest
}) {
  return (
    <button
      type={type}
      className={`icon-btn${className ? ` ${className}` : ''}`}
      onClick={onClick}
      aria-label={label}
      title={title || label}
      aria-expanded={expanded}
      disabled={disabled}
      {...rest}
    >
      {children}
    </button>
  )
}

export default IconButton
