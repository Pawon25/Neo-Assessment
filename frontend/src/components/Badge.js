export default function Badge({ type = 'owned' }) {
  const styles = {
    owned: {
      background: 'var(--color-accent-light)',
      color: 'var(--color-accent-text)',
    },
    shared: {
      background: 'var(--color-shared-light)',
      color: 'var(--color-shared-text)',
    },
  }

  const labels = {
    owned: 'Owned',
    shared: 'Shared with me',
  }

  return (
    <span style={{
      ...styles[type],
      fontSize: '11px',
      fontWeight: 600,
      padding: '2px 8px',
      borderRadius: 'var(--radius-full)',
      letterSpacing: '0.2px',
      textTransform: 'uppercase',
      whiteSpace: 'nowrap',
    }}>
      {labels[type]}
    </span>
  )
}