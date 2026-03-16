export default function Button({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  fullWidth = false,
  type = 'button',
  style: extraStyle = {},
}) {
  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    fontFamily: 'var(--font-sans)',
    fontWeight: 500,
    borderRadius: 'var(--radius-md)',
    transition: 'all var(--transition)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    width: fullWidth ? '100%' : 'auto',
    border: 'none',
    whiteSpace: 'nowrap',
  }

  const sizes = {
    sm: { fontSize: '13px', padding: '6px 12px', height: '32px' },
    md: { fontSize: '14px', padding: '8px 16px', height: '38px' },
    lg: { fontSize: '15px', padding: '10px 20px', height: '44px' },
  }

  const variants = {
    primary: {
      backgroundColor: 'var(--color-accent)',
      color: '#fff',
    },
    secondary: {
      backgroundColor: 'var(--color-bg)',
      color: 'var(--color-text-primary)',
      border: '1px solid var(--color-border)',
    },
    ghost: {
      backgroundColor: 'transparent',
      color: 'var(--color-text-secondary)',
    },
    danger: {
      backgroundColor: 'var(--color-danger-light)',
      color: 'var(--color-danger)',
    },
  }

  const hoverStyles = {
    primary:   { backgroundColor: 'var(--color-accent-hover)' },
    secondary: { backgroundColor: 'var(--color-border)', borderColor: 'var(--color-border-hover)' },
    ghost:     { backgroundColor: 'var(--color-bg)' },
    danger:    { backgroundColor: '#FCA5A5', color: 'var(--color-danger)' },
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{ ...base, ...sizes[size], ...variants[variant], ...extraStyle }}
      onMouseEnter={e => {
        if (!disabled) Object.assign(e.currentTarget.style, hoverStyles[variant])
      }}
      onMouseLeave={e => {
        if (!disabled) Object.assign(e.currentTarget.style, variants[variant])
      }}
    >
      {children}
    </button>
  )
}