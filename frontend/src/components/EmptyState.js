import { FileText } from 'lucide-react'

export default function EmptyState({ title, description, action }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--space-16) var(--space-6)',
      textAlign: 'center',
      gap: 'var(--space-4)',
    }}>
      <div style={{
        width: '52px',
        height: '52px',
        borderRadius: 'var(--radius-xl)',
        backgroundColor: 'var(--color-accent-light)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 'var(--space-2)',
      }}>
        <FileText size={24} color="var(--color-accent)" strokeWidth={1.5} />
      </div>

      <div>
        <p style={{ fontWeight: 600, fontSize: '15px', color: 'var(--color-text-primary)', marginBottom: 'var(--space-1)' }}>
          {title}
        </p>
        <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', maxWidth: '280px' }}>
          {description}
        </p>
      </div>

      {action && (
        <div style={{ marginTop: 'var(--space-2)' }}>
          {action}
        </div>
      )}
    </div>
  )
}