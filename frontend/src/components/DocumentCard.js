import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, MoreVertical, Pencil, Trash2, Clock } from 'lucide-react'
import Badge from './Badge'

function formatDate(dateStr) {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now - date
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)

  if (mins < 1)   return 'Just now'
  if (mins < 60)  return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7)   return `${days}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function DocumentCard({ doc, onRename, onDelete }) {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef()

  // Close menu on outside click
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleMenuClick = (e) => {
    e.stopPropagation()
    setMenuOpen(prev => !prev)
  }

  const handleRename = (e) => {
    e.stopPropagation()
    setMenuOpen(false)
    onRename(doc)
  }

  const handleDelete = (e) => {
    e.stopPropagation()
    setMenuOpen(false)
    onDelete(doc)
  }

  return (
    <div
      onClick={() => navigate(`/editor/${doc.id}`)}
      style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-5)',
        cursor: 'pointer',
        transition: 'all var(--transition)',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-3)',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'var(--color-border-hover)'
        e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
        e.currentTarget.style.transform = 'translateY(-1px)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--color-border)'
        e.currentTarget.style.boxShadow = 'none'
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      {/* Top row — icon + menu */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        {/* File icon */}
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'var(--color-accent-light)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <FileText size={18} color="var(--color-accent)" strokeWidth={1.5} />
        </div>

        {/* 3-dot menu — only for owner */}
        {doc.access === 'owned' && (
          <div ref={menuRef} style={{ position: 'relative' }}>
            <button
              onClick={handleMenuClick}
              style={{
                width: '28px',
                height: '28px',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-text-hint)',
                transition: 'all var(--transition)',
                backgroundColor: menuOpen ? 'var(--color-bg)' : 'transparent',
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-bg)'}
              onMouseLeave={e => {
                if (!menuOpen) e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              <MoreVertical size={15} />
            </button>

            {/* Dropdown */}
            {menuOpen && (
              <div style={{
                position: 'absolute',
                top: '32px',
                right: 0,
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-md)',
                minWidth: '160px',
                zIndex: 10,
                overflow: 'hidden',
                padding: 'var(--space-1)',
              }}>
                <button
                  onClick={handleRename}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-2)',
                    padding: 'var(--space-2) var(--space-3)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '13px',
                    color: 'var(--color-text-primary)',
                    transition: 'background var(--transition)',
                    textAlign: 'left',
                  }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-bg)'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <Pencil size={13} color="var(--color-text-secondary)" />
                  Rename
                </button>

                <div style={{ height: '1px', backgroundColor: 'var(--color-border)', margin: 'var(--space-1) 0' }} />

                <button
                  onClick={handleDelete}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-2)',
                    padding: 'var(--space-2) var(--space-3)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '13px',
                    color: 'var(--color-danger)',
                    transition: 'background var(--transition)',
                    textAlign: 'left',
                  }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-danger-light)'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <Trash2 size={13} />
                  Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Title */}
      <div>
        <h3 style={{
          fontSize: '14px',
          fontWeight: 600,
          color: 'var(--color-text-primary)',
          marginBottom: 'var(--space-1)',
          lineHeight: 1.4,
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
        }}>
          {doc.title}
        </h3>

        {doc.access === 'shared' && (
          <p style={{ fontSize: '12px', color: 'var(--color-text-hint)' }}>
            by {doc.owner_name}
          </p>
        )}
      </div>

      {/* Footer — badge + time */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 'auto',
      }}>
        <Badge type={doc.access} />

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          color: 'var(--color-text-hint)',
          fontSize: '12px',
        }}>
          <Clock size={11} />
          {formatDate(doc.updated_at)}
        </div>
      </div>
    </div>
  )
}