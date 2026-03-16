import {
  Bold, Italic, Underline, Strikethrough,
  Heading1, Heading2, Heading3,
  List, ListOrdered, Quote,
  Undo, Redo,
  Minus,
} from 'lucide-react'

function ToolbarDivider() {
  return (
    <div style={{
      width: '1px',
      height: '20px',
      backgroundColor: 'var(--color-border)',
      margin: '0 var(--space-1)',
      flexShrink: 0,
    }} />
  )
}

function ToolbarButton({ onClick, active, disabled, title, children }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '30px',
        height: '30px',
        borderRadius: 'var(--radius-sm)',
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        backgroundColor: active ? 'var(--color-accent-light)' : 'transparent',
        color: active
          ? 'var(--color-accent)'
          : disabled
          ? 'var(--color-text-hint)'
          : 'var(--color-text-secondary)',
        transition: 'all var(--transition)',
        flexShrink: 0,
      }}
      onMouseEnter={e => {
        if (!disabled && !active) {
          e.currentTarget.style.backgroundColor = 'var(--color-bg)'
          e.currentTarget.style.color = 'var(--color-text-primary)'
        }
      }}
      onMouseLeave={e => {
        if (!disabled && !active) {
          e.currentTarget.style.backgroundColor = 'transparent'
          e.currentTarget.style.color = 'var(--color-text-secondary)'
        }
      }}
    >
      {children}
    </button>
  )
}

export default function EditorToolbar({ editor }) {
  if (!editor) return null

  const groups = [
    // History
    [
      {
        icon: <Undo size={15} />,
        title: 'Undo (Ctrl+Z)',
        action: () => editor.chain().focus().undo().run(),
        active: false,
        disabled: !editor.can().undo(),
      },
      {
        icon: <Redo size={15} />,
        title: 'Redo (Ctrl+Shift+Z)',
        action: () => editor.chain().focus().redo().run(),
        active: false,
        disabled: !editor.can().redo(),
      },
    ],
    // Headings
    [
      {
        icon: <Heading1 size={15} />,
        title: 'Heading 1',
        action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
        active: editor.isActive('heading', { level: 1 }),
      },
      {
        icon: <Heading2 size={15} />,
        title: 'Heading 2',
        action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
        active: editor.isActive('heading', { level: 2 }),
      },
      {
        icon: <Heading3 size={15} />,
        title: 'Heading 3',
        action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
        active: editor.isActive('heading', { level: 3 }),
      },
    ],
    // Inline formatting
    [
      {
        icon: <Bold size={15} />,
        title: 'Bold (Ctrl+B)',
        action: () => editor.chain().focus().toggleBold().run(),
        active: editor.isActive('bold'),
      },
      {
        icon: <Italic size={15} />,
        title: 'Italic (Ctrl+I)',
        action: () => editor.chain().focus().toggleItalic().run(),
        active: editor.isActive('italic'),
      },
      {
        icon: <Underline size={15} />,
        title: 'Underline (Ctrl+U)',
        action: () => editor.chain().focus().toggleUnderline().run(),
        active: editor.isActive('underline'),
      },
      {
        icon: <Strikethrough size={15} />,
        title: 'Strikethrough',
        action: () => editor.chain().focus().toggleStrike().run(),
        active: editor.isActive('strike'),
      },
    ],
    // Lists + quote
    [
      {
        icon: <List size={15} />,
        title: 'Bullet list',
        action: () => editor.chain().focus().toggleBulletList().run(),
        active: editor.isActive('bulletList'),
      },
      {
        icon: <ListOrdered size={15} />,
        title: 'Numbered list',
        action: () => editor.chain().focus().toggleOrderedList().run(),
        active: editor.isActive('orderedList'),
      },
      {
        icon: <Quote size={15} />,
        title: 'Blockquote',
        action: () => editor.chain().focus().toggleBlockquote().run(),
        active: editor.isActive('blockquote'),
      },
    ],
    // Extras
    [
      {
        icon: <Minus size={15} />,
        title: 'Horizontal rule',
        action: () => editor.chain().focus().setHorizontalRule().run(),
        active: false,
      },
    ],
  ]

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 'var(--space-1)',
      padding: 'var(--space-2) var(--space-3)',
      backgroundColor: 'var(--color-surface)',
      borderBottom: '1px solid var(--color-border)',
      position: 'sticky',
      top: '56px',   // below Navbar
      zIndex: 40,
    }}>
      {groups.map((group, gi) => (
        <div key={gi} style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
          {group.map((btn, bi) => (
            <ToolbarButton
              key={bi}
              onClick={btn.action}
              active={btn.active}
              disabled={btn.disabled || false}
              title={btn.title}
            >
              {btn.icon}
            </ToolbarButton>
          ))}
          {gi < groups.length - 1 && <ToolbarDivider />}
        </div>
      ))}
    </div>
  )
}