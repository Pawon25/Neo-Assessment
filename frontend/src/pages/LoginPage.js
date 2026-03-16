import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, ChevronDown } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { authAPI } from '../api/api'
import Button from '../components/Button'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const { user, login }   = useAuth()
  const navigate          = useNavigate()
  const [users, setUsers] = useState([])
  const [selected, setSelected] = useState('')
  const [loading, setLoading]   = useState(false)

  // Already logged in → go to dashboard
  useEffect(() => {
    if (user) navigate('/dashboard', { replace: true })
  }, [user, navigate])

  // Fetch seeded users for the dropdown
  useEffect(() => {
    authAPI.users()
      .then(res => setUsers(res.data))
      .catch(() => toast.error('Could not load users. Is the backend running?'))
  }, [])

  const handleLogin = async () => {
    if (!selected) return
    setLoading(true)
    try {
      await login(selected)
      navigate('/dashboard', { replace: true })
    } catch {
      toast.error('Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--color-bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--space-6)',
    }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>

        {/* Logo */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          marginBottom: 'var(--space-10)',
          gap: 'var(--space-3)',
        }}>
          <div style={{
            width: '52px',
            height: '52px',
            backgroundColor: 'var(--color-accent)',
            borderRadius: 'var(--radius-xl)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(13,115,119,0.25)',
          }}>
            <FileText size={26} color="#fff" strokeWidth={1.75} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <h1 style={{
              fontSize: '22px',
              fontWeight: 700,
              color: 'var(--color-text-primary)',
              letterSpacing: '-0.5px',
            }}>
              Nao Docs
            </h1>
            <p style={{
              fontSize: '14px',
              color: 'var(--color-text-secondary)',
              marginTop: '4px',
            }}>
              Collaborative document editing
            </p>
          </div>
        </div>

        {/* Card */}
        <div style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-8)',
          boxShadow: 'var(--shadow-sm)',
        }}>
          <h2 style={{
            fontSize: '16px',
            fontWeight: 600,
            color: 'var(--color-text-primary)',
            marginBottom: 'var(--space-1)',
          }}>
            Sign in
          </h2>
          <p style={{
            fontSize: '13px',
            color: 'var(--color-text-secondary)',
            marginBottom: 'var(--space-6)',
          }}>
            Select a demo account to continue
          </p>

          {/* User select */}
          <div style={{ marginBottom: 'var(--space-4)' }}>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: 500,
              color: 'var(--color-text-secondary)',
              marginBottom: 'var(--space-2)',
            }}>
              Account
            </label>

            <div style={{ position: 'relative' }}>
              <select
                value={selected}
                onChange={e => setSelected(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 36px 10px 14px',
                  borderRadius: 'var(--radius-md)',
                  border: `1px solid ${selected ? 'var(--color-accent)' : 'var(--color-border)'}`,
                  backgroundColor: 'var(--color-bg)',
                  fontSize: '14px',
                  color: selected ? 'var(--color-text-primary)' : 'var(--color-text-hint)',
                  fontFamily: 'var(--font-sans)',
                  outline: 'none',
                  appearance: 'none',
                  cursor: 'pointer',
                  transition: 'border-color var(--transition)',
                  boxShadow: selected ? '0 0 0 3px rgba(13,115,119,0.1)' : 'none',
                }}
              >
                <option value="">Choose a user…</option>
                {users.map(u => (
                  <option key={u.id} value={u.username}>
                    {u.display_name} — {u.username}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={15}
                color="var(--color-text-hint)"
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
              />
            </div>
          </div>

          {/* Login button */}
          <Button
            onClick={handleLogin}
            disabled={!selected || loading}
            fullWidth
            size="lg"
          >
            {loading ? 'Signing in…' : 'Continue'}
          </Button>

          {/* Demo note */}
          <p style={{
            fontSize: '12px',
            color: 'var(--color-text-hint)',
            textAlign: 'center',
            marginTop: 'var(--space-4)',
            lineHeight: 1.6,
          }}>
            This is a demo environment. No password required.
            <br />
            Try sharing docs between Alice, Bob and Charlie.
          </p>
        </div>

        {/* Footer */}
        <p style={{
          textAlign: 'center',
          fontSize: '12px',
          color: 'var(--color-text-hint)',
          marginTop: 'var(--space-6)',
        }}>
          Nao Medical · DocEditor Assignment
        </p>
      </div>
    </div>
  )
}