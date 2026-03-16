import { useState, useEffect } from 'react'
import { UserPlus, X, Users, Loader } from 'lucide-react'
import { sharesAPI, authAPI } from '../api/api'
import { useAuth } from '../context/AuthContext'
import Button from './Button'
import toast from 'react-hot-toast'

export default function SharePanel({ docId }) {
  const { user: currentUser } = useAuth()

  const [allUsers, setAllUsers]     = useState([])
  const [shares, setShares]         = useState([])
  const [selected, setSelected]     = useState('')
  const [loadingShare, setLoadingShare] = useState(false)
  const [loadingInit, setLoadingInit]   = useState(true)

  // Load all users + existing shares on mount
  useEffect(() => {
    const init = async () => {
      try {
        const [usersRes, sharesRes] = await Promise.all([
          authAPI.users(),
          sharesAPI.list(docId),
        ])
        setAllUsers(usersRes.data)
        setShares(sharesRes.data)
      } catch {
        toast.error('Failed to load share settings')
      } finally {
        setLoadingInit(false)
      }
    }
    init()
  }, [docId])

  // Users that haven't been shared with yet (excluding self)
  const available = allUsers.filter(u =>
    u.id !== currentUser.id &&
    !shares.find(s => s.shared_with_id === u.id)
  )

  const handleShare = async () => {
    if (!selected) return
    setLoadingShare(true)
    try {
      const { data } = await sharesAPI.share(docId, selected)
      setShares(prev => [...prev, data])
      setSelected('')
      toast.success(`Shared with ${selected}`)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to share')
    } finally {
      setLoadingShare(false)
    }
  }

  const handleRevoke = async (username) => {
    try {
      await sharesAPI.revoke(docId, username)
      setShares(prev => prev.filter(s => s.shared_with_username !== username))
      toast.success(`Access revoked for ${username}`)
    } catch {
      toast.error('Failed to revoke access')
    }
  }

  if (loadingInit) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-8)' }}>
        <Loader size={18} color="var(--color-text-hint)" className="spin" />
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>

      {/* Share with user */}
      <div>
        <label style={{
          display: 'block',
          fontSize: '13px',
          fontWeight: 500,
          color: 'var(--color-text-secondary)',
          marginBottom: 'var(--space-2)',
        }}>
          Share with
        </label>

        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <select
            value={selected}
            onChange={e => setSelected(e.target.value)}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-bg)',
              fontSize: '14px',
              color: selected ? 'var(--color-text-primary)' : 'var(--color-text-hint)',
              fontFamily: 'var(--font-sans)',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="">
              {available.length === 0 ? 'No users available' : 'Select a user…'}
            </option>
            {available.map(u => (
              <option key={u.id} value={u.username}>
                {u.display_name} ({u.username})
              </option>
            ))}
          </select>

          <Button
            onClick={handleShare}
            disabled={!selected || loadingShare}
            size="md"
          >
            <UserPlus size={14} />
            {loadingShare ? 'Sharing…' : 'Share'}
          </Button>
        </div>
      </div>

      {/* Current shares list */}
      <div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
          marginBottom: 'var(--space-3)',
        }}>
          <Users size={14} color="var(--color-text-secondary)" />
          <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-secondary)' }}>
            People with access
          </span>
        </div>

        {shares.length === 0 ? (
          <p style={{
            fontSize: '13px',
            color: 'var(--color-text-hint)',
            padding: 'var(--space-4)',
            textAlign: 'center',
            backgroundColor: 'var(--color-bg)',
            borderRadius: 'var(--radius-md)',
            border: '1px dashed var(--color-border)',
          }}>
            Not shared with anyone yet
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {shares.map(share => (
              <div
                key={share.shared_with_id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: 'var(--space-2) var(--space-3)',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--color-bg)',
                  border: '1px solid var(--color-border)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  {/* Avatar */}
                  <div style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: 'var(--color-shared-light)',
                    color: 'var(--color-shared-text)',
                    fontSize: '11px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textTransform: 'uppercase',
                  }}>
                    {share.shared_with_username.charAt(0)}
                  </div>
                  <span style={{ fontSize: '13px', color: 'var(--color-text-primary)', fontWeight: 500 }}>
                    {share.shared_with_username}
                  </span>
                </div>

                {/* Revoke button */}
                <button
                  onClick={() => handleRevoke(share.shared_with_username)}
                  title="Revoke access"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '24px',
                    height: '24px',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--color-text-hint)',
                    transition: 'all var(--transition)',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.backgroundColor = 'var(--color-danger-light)'
                    e.currentTarget.style.color = 'var(--color-danger)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                    e.currentTarget.style.color = 'var(--color-text-hint)'
                  }}
                >
                  <X size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}