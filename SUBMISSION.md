# Submission

**Candidate:** Pavan B (pavanbasavaraj25@gmail.com)  
**Assignment:** Nao Medical — AI-Native Full Stack Developer  
**Product:** Nao Docs — Collaborative Document Editor

---

## What Is Included

### Backend (`/Backend`)
| File | Description |
|------|-------------|
| `main.py` | FastAPI app entry point, CORS, startup/shutdown |
| `config.py` | Environment settings via pydantic-settings |
| `database.py` | Async MongoDB connection (Motor) |
| `auth.py` | JWT creation, decoding, `get_current_user` dependency |
| `models.py` | All Pydantic request/response models |
| `seeder.py` | Seeds 3 mock users (Alice, Bob, Charlie) on startup |
| `routes/auth.py` | `POST /auth/login`, `GET /auth/me`, `GET /auth/users` |
| `routes/documents.py` | Full document CRUD + rename + save content |
| `routes/shares.py` | Share, list shares, revoke access |
| `routes/upload.py` | `.txt` / `.md` file → new document |
| `test_main.py` | 18 pytest tests |
| `requirements.txt` | Python dependencies |
| `.env.example` | Environment variable template |
| `API_DOCS.md` | Full backend API reference |

### Frontend (`/frontend/src`)
| File | Description |
|------|-------------|
| `api/api.js` | Axios client with token injection and 401 handling |
| `context/AuthContext.js` | Global auth state (login, logout, session restore) |
| `styles/global.css` | Design tokens, reset, Tiptap content styles |
| `App.js` | Routes and ProtectedRoute guard |
| `components/Navbar.js` | Top navigation with logo and user menu |
| `components/Badge.js` | Owned / Shared with me pill |
| `components/Button.js` | Primary / secondary / ghost / danger variants |
| `components/Modal.js` | Accessible modal with ESC + backdrop close |
| `components/EmptyState.js` | Empty list placeholder |
| `components/DocumentCard.js` | Card with 3-dot menu, badge, timestamp |
| `components/SharePanel.js` | Share, list, revoke access UI |
| `components/EditorToolbar.js` | Tiptap formatting toolbar |
| `pages/LoginPage.js` | User picker login screen |
| `pages/DashboardPage.js` | Document list with tabs, create, upload |
| `pages/EditorPage.js` | Full editor with auto-save, share, rename |

### Documentation
| File | Description |
|------|-------------|
| `README.md` | Local setup and run instructions |
| `ARCHITECTURE.md` | Technical decisions and tradeoffs |
| `AI_WORKFLOW.md` | AI tools used and how output was verified |
| `SUBMISSION.md` | This file |
| `Backend/API_DOCS.md` | Complete API reference with all endpoints |

---

## Demo Accounts

| Username | Display Name  |
|----------|---------------|
| `alice`  | Alice Johnson |
| `bob`    | Bob Smith     |
| `charlie`| Charlie Lee   |

No passwords required — select from dropdown on login screen.

---

## What Is Working

- Login with mock JWT auth (Alice, Bob, Charlie)
- Create, rename, delete documents
- Rich-text editing (bold, italic, underline, strikethrough, H1–H3, bullet lists, numbered lists, blockquote, horizontal rule)
- Auto-save on typing (1.5s debounce) + Ctrl+S manual save
- Inline title rename in editor
- Upload `.txt` and `.md` files → converted to editable documents
- Share documents with other users by username
- Shared users can view and edit content
- Owner can revoke access
- Dashboard tabs: All / Owned / Shared with live counts
- Documents and shares persist across page refresh
- Access control enforced server-side (not just hidden in UI)
- 18 automated backend tests

---

## What Is Incomplete / Known Limitations

- No real-time collaboration — changes by shared users require manual refresh
- `.md` files imported as plain paragraphs (no Markdown parsing into headings/code blocks)
- No document version history
- No export to PDF or Markdown
- Frontend has no automated tests (focused test effort on backend business logic)

---

## What I Would Build Next (2–4 More Hours)

1. Real-time presence indicators using WebSockets
2. Document version history — snapshot content on each save, allow restore
3. Markdown-aware import — parse `.md` headings, bold, lists into proper Tiptap nodes
4. Export to plain text or Markdown
5. Role-based sharing (view-only vs edit access)