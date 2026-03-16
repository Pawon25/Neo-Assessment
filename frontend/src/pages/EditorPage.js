import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Placeholder from '@tiptap/extension-placeholder'
import {
  ArrowLeft, Share2, Save, Loader,
  CheckCheck, Pencil, X
} from 'lucide-react'
import { docsAPI } from '../api/api'
import Navbar from '../components/Navbar'
import EditorToolbar from '../components/EditorToolbar'
import SharePanel from '../components/SharePanel'
import Button from '../components/Button'
import Modal from '../components/Modal'
import Badge from '../components/Badge'
import toast from 'react-hot-toast'

// Save status indicator
function SaveStatus({ status }) {
  const config = {
    idle:    { icon: null,                                            label: '',           color: 'transparent' },
    saving:  { icon: <Loader size={13} className="spin" />,          label: 'Saving…',    color: 'var(--color-text-hint)' },
    saved:   { icon: <CheckCheck size={13} />,                       label: 'Saved',      color: 'var(--color-success)' },
    error:   { icon: <X size={13} />,                                label: 'Save failed',color: 'var(--color-danger)' },
  }
  const c = config[status]
  if (status === 'idle') return null
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', color: c.color }}>
      {c.icon}
      {c.label}
    </div>
  )
}

export default function EditorPage() {
  const { id }       = useParams()
  const navigate     = useNavigate()
  const [doc, setDoc]               = useState(null)
  const [loading, setLoading]       = useState(true)
  const [saveStatus, setSaveStatus] = useState('idle')
  const [shareOpen, setShareOpen]   = useState(false)

  // Rename inline
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleValue, setTitleValue]     = useState('')
  const titleInputRef = useRef()

  // Auto-save timer
  const saveTimer = useRef(null)

  // ── Load document ──────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchDoc = async () => {
      try {
        const { data } = await docsAPI.get(id)
        setDoc(data)
        setTitleValue(data.title)
      } catch (err) {
        if (err.response?.status === 403) {
          toast.error('You do not have access to this document')
          navigate('/dashboard')
        } else {
          toast.error('Failed to load document')
          navigate('/dashboard')
        }
      } finally {
        setLoading(false)
      }
    }
    fetchDoc()
  }, [id, navigate])

  // ── Tiptap editor ──────────────────────────────────────────────────────────
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Placeholder.configure({
        placeholder: 'Start writing…',
      }),
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'tiptap-content',
      },
    },
    onUpdate: ({ editor }) => {
      // Debounced auto-save on every change
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => {
        handleSave(editor.getJSON())
      }, 1500)
    },
  })

  // Set initial content once doc is loaded
  useEffect(() => {
    if (editor && doc?.content) {
      editor.commands.setContent(doc.content)
    }
  }, [editor, doc])

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
  }, [])

  // ── Save content ───────────────────────────────────────────────────────────
  const handleSave = useCallback(async (content) => {
    setSaveStatus('saving')
    try {
      await docsAPI.saveContent(id, content)
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2000)
    } catch {
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 3000)
    }
  }, [id])

  // Manual save with Ctrl+S
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        if (editor) handleSave(editor.getJSON())
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [editor, handleSave])

  // ── Rename title ───────────────────────────────────────────────────────────
  const startEditTitle = () => {
    setEditingTitle(true)
    setTimeout(() => titleInputRef.current?.focus(), 50)
  }

  const commitRename = async () => {
    const trimmed = titleValue.trim()
    if (!trimmed || trimmed === doc.title) {
      setEditingTitle(false)
      setTitleValue(doc.title)
      return
    }
    try {
      const { data } = await docsAPI.rename(id, trimmed)
      setDoc(data)
      setTitleValue(data.title)
      setEditingTitle(false)
      toast.success('Renamed')
    } catch {
      toast.error('Failed to rename')
      setTitleValue(doc.title)
    } finally {
      setEditingTitle(false)
    }
  }

  const handleTitleKeyDown = (e) => {
    if (e.key === 'Enter')  commitRename()
    if (e.key === 'Escape') {
      setEditingTitle(false)
      setTitleValue(doc.title)
    }
  }

  const isOwner = doc?.access === 'owned'

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-bg)' }}>
        <Navbar />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 56px)' }}>
          <Loader size={24} color="var(--color-text-hint)" className="spin" />
        </div>
      </div>
    )
  }

  // ── Main render ────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-bg)', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      {/* Editor header */}
      <div style={{
        backgroundColor: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        padding: '0 var(--space-6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '52px',
        gap: 'var(--space-4)',
        position: 'sticky',
        top: '56px',
        zIndex: 41,
      }}>
        {/* Left — back + title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', minWidth: 0, flex: 1 }}>
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '30px', height: '30px', borderRadius: 'var(--radius-md)',
              color: 'var(--color-text-secondary)', flexShrink: 0, transition: 'all var(--transition)',
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-bg)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <ArrowLeft size={16} />
          </button>

          {/* Editable title — owner only */}
          {isOwner && editingTitle ? (
            <input
              ref={titleInputRef}
              value={titleValue}
              onChange={e => setTitleValue(e.target.value)}
              onBlur={commitRename}
              onKeyDown={handleTitleKeyDown}
              style={{
                fontSize: '15px', fontWeight: 600,
                color: 'var(--color-text-primary)',
                border: 'none',
                borderBottom: '2px solid var(--color-accent)',
                outline: 'none', background: 'transparent',
                fontFamily: 'var(--font-sans)',
                minWidth: '120px',
                width: `${Math.max(titleValue.length * 9, 120)}px`,
                maxWidth: '400px',
                padding: '2px 0',
              }}
            />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', minWidth: 0 }}>
              <h2 style={{
                fontSize: '15px', fontWeight: 600,
                color: 'var(--color-text-primary)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {doc?.title}
              </h2>
              <Badge type={doc?.access} />
              {isOwner && (
                <button
                  onClick={startEditTitle}
                  title="Rename document"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: '24px', height: '24px', borderRadius: 'var(--radius-sm)',
                    color: 'var(--color-text-hint)', transition: 'all var(--transition)',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.backgroundColor = 'var(--color-bg)'
                    e.currentTarget.style.color = 'var(--color-text-secondary)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                    e.currentTarget.style.color = 'var(--color-text-hint)'
                  }}
                >
                  <Pencil size={12} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Right — save status + share */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexShrink: 0 }}>
          <SaveStatus status={saveStatus} />

          {isOwner && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShareOpen(true)}
            >
              <Share2 size={13} />
              Share
            </Button>
          )}

          <Button
            size="sm"
            onClick={() => editor && handleSave(editor.getJSON())}
            disabled={saveStatus === 'saving'}
          >
            <Save size={13} />
            Save
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <EditorToolbar editor={editor} />

      {/* Editor body */}
      <div style={{
        flex: 1,
        maxWidth: '760px',
        width: '100%',
        margin: '0 auto',
        padding: 'var(--space-12) var(--space-6)',
      }}>
        <EditorContent editor={editor} />
      </div>

      {/* Share modal */}
      {shareOpen && (
        <Modal title="Share document" onClose={() => setShareOpen(false)}>
          <SharePanel docId={id} />
        </Modal>
      )}
    </div>
  )
}