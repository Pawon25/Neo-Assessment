import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Upload, Loader, AlertTriangle } from 'lucide-react'
import { docsAPI, uploadAPI } from '../api/api'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import DocumentCard from '../components/DocumentCard'
import EmptyState from '../components/EmptyState'
import Modal from '../components/Modal'
import Button from '../components/Button'
import toast from 'react-hot-toast'

const TABS = ['All', 'Owned', 'Shared']

export default function DashboardPage() {
  const { user }   = useAuth()
  const navigate   = useNavigate()
  const fileRef    = useRef()

  const [docs, setDocs]           = useState([])
  const [loading, setLoading]     = useState(true)
  const [activeTab, setActiveTab] = useState('All')
  const [creating, setCreating]   = useState(false)
  const [uploading, setUploading] = useState(false)

  // Rename modal
  const [renameDoc, setRenameDoc]     = useState(null)
  const [renameTitle, setRenameTitle] = useState('')
  const [renaming, setRenaming]       = useState(false)

  // Delete modal
  const [deleteDoc, setDeleteDoc] = useState(null)
  const [deleting, setDeleting]   = useState(false)

  // ── Load docs ──────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchDocs()
  }, [])

  const fetchDocs = async () => {
    try {
      const { data } = await docsAPI.list()
      setDocs(data)
    } catch {
      toast.error('Failed to load documents')
    } finally {
      setLoading(false)
    }
  }

  // ── Filter by tab ──────────────────────────────────────────────────────────
  const filtered = docs.filter(d => {
    if (activeTab === 'Owned')  return d.access === 'owned'
    if (activeTab === 'Shared') return d.access === 'shared'
    return true
  })

  // ── Create new doc ─────────────────────────────────────────────────────────
  const handleCreate = async () => {
    setCreating(true)
    try {
      const { data } = await docsAPI.create('Untitled Document')
      navigate(`/editor/${data.id}`)
    } catch {
      toast.error('Failed to create document')
      setCreating(false)
    }
  }

  // ── Upload file ────────────────────────────────────────────────────────────
  const handleFileChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    fileRef.current.value = ''

    const ext = file.name.split('.').pop().toLowerCase()
    if (!['txt', 'md'].includes(ext)) {
      toast.error('Only .txt and .md files are supported')
      return
    }

    setUploading(true)
    try {
      const { data } = await uploadAPI.upload(file)
      toast.success(`"${data.title}" imported successfully`)
      navigate(`/editor/${data.id}`)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  // ── Rename ─────────────────────────────────────────────────────────────────
  const openRename = (doc) => {
    setRenameDoc(doc)
    setRenameTitle(doc.title)
  }

  const handleRename = async () => {
    if (!renameTitle.trim()) return
    setRenaming(true)
    try {
      const { data } = await docsAPI.rename(renameDoc.id, renameTitle.trim())
      setDocs(prev => prev.map(d => d.id === data.id ? data : d))
      setRenameDoc(null)
      toast.success('Document renamed')
    } catch {
      toast.error('Failed to rename document')
    } finally {
      setRenaming(false)
    }
  }

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    setDeleting(true)
    try {
      await docsAPI.delete(deleteDoc.id)
      setDocs(prev => prev.filter(d => d.id !== deleteDoc.id))
      setDeleteDoc(null)
      toast.success('Document deleted')
    } catch {
      toast.error('Failed to delete document')
    } finally {
      setDeleting(false)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-bg)' }}>
      <Navbar />

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: 'var(--space-8) var(--space-6)' }}>

        {/* Page header */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: 'var(--space-8)',
          flexWrap: 'wrap',
          gap: 'var(--space-4)',
        }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.4px', color: 'var(--color-text-primary)' }}>
              My Documents
            </h1>
            <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
              Welcome back, {user?.display_name?.split(' ')[0]}
            </p>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
            {/* Hidden file input */}
            <input
              ref={fileRef}
              type="file"
              accept=".txt,.md"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />

            <Button
              variant="secondary"
              onClick={() => fileRef.current.click()}
              disabled={uploading}
            >
              {uploading
                ? <><Loader size={14} className="spin" /> Importing…</>
                : <><Upload size={14} /> Import file</>
              }
            </Button>

            <Button onClick={handleCreate} disabled={creating}>
              {creating
                ? <><Loader size={14} className="spin" /> Creating…</>
                : <><Plus size={14} /> New document</>
              }
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: 'var(--space-1)',
          marginBottom: 'var(--space-6)',
          borderBottom: '1px solid var(--color-border)',
          paddingBottom: '0',
        }}>
          {TABS.map(tab => {
            const count = tab === 'All'
              ? docs.length
              : docs.filter(d => d.access === tab.toLowerCase()).length

            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: 'var(--space-2) var(--space-4)',
                  fontSize: '14px',
                  fontWeight: activeTab === tab ? 600 : 400,
                  color: activeTab === tab ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                  borderBottom: activeTab === tab ? '2px solid var(--color-accent)' : '2px solid transparent',
                  marginBottom: '-1px',
                  transition: 'all var(--transition)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  cursor: 'pointer',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderBottom: activeTab === tab ? '2px solid var(--color-accent)' : '2px solid transparent',
                }}
              >
                {tab}
                <span style={{
                  fontSize: '11px',
                  fontWeight: 500,
                  padding: '1px 6px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: activeTab === tab ? 'var(--color-accent-light)' : 'var(--color-border)',
                  color: activeTab === tab ? 'var(--color-accent)' : 'var(--color-text-hint)',
                }}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Doc grid / states */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-16)' }}>
            <Loader size={24} color="var(--color-text-hint)" className="spin" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title={activeTab === 'Shared' ? 'No shared documents' : 'No documents yet'}
            description={
              activeTab === 'Shared'
                ? 'When someone shares a document with you, it will appear here.'
                : 'Create your first document or import a .txt / .md file to get started.'
            }
            action={
              activeTab !== 'Shared' && (
                <Button onClick={handleCreate} disabled={creating}>
                  <Plus size={14} /> New document
                </Button>
              )
            }
          />
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: 'var(--space-4)',
          }}>
            {filtered.map(doc => (
              <DocumentCard
                key={doc.id}
                doc={doc}
                onRename={openRename}
                onDelete={setDeleteDoc}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Rename modal ──────────────────────────────────────────────────── */}
      {renameDoc && (
        <Modal title="Rename document" onClose={() => setRenameDoc(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <input
              autoFocus
              value={renameTitle}
              onChange={e => setRenameTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleRename()}
              placeholder="Document title"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                fontSize: '14px',
                color: 'var(--color-text-primary)',
                backgroundColor: 'var(--color-bg)',
                outline: 'none',
                fontFamily: 'var(--font-sans)',
                transition: 'border-color var(--transition)',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--color-accent)'}
              onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
              <Button variant="secondary" onClick={() => setRenameDoc(null)}>
                Cancel
              </Button>
              <Button
                onClick={handleRename}
                disabled={!renameTitle.trim() || renaming}
              >
                {renaming ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Delete confirm modal ──────────────────────────────────────────── */}
      {deleteDoc && (
        <Modal title="Delete document" onClose={() => setDeleteDoc(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
            <div style={{
              display: 'flex',
              gap: 'var(--space-3)',
              padding: 'var(--space-4)',
              backgroundColor: 'var(--color-danger-light)',
              borderRadius: 'var(--radius-md)',
            }}>
              <AlertTriangle size={18} color="var(--color-danger)" style={{ flexShrink: 0, marginTop: '1px' }} />
              <p style={{ fontSize: '14px', color: 'var(--color-danger-text)', lineHeight: 1.6 }}>
                <strong>"{deleteDoc.title}"</strong> will be permanently deleted.
                This action cannot be undone.
              </p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
              <Button variant="secondary" onClick={() => setDeleteDoc(null)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Deleting…' : 'Delete'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}