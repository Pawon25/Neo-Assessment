# Architecture Note

## Overview

Nao Docs is a lightweight collaborative document editor with a React frontend, FastAPI backend, and MongoDB database. Built within a 4–6 hour timebox with deliberate scope cuts.

---

## Stack Decisions

### FastAPI over Spring Boot
FastAPI was chosen over Spring Boot for three reasons: Python's async ecosystem fits MongoDB's Motor driver naturally, the auto-generated OpenAPI docs (`/docs`) give reviewers an instant interactive API explorer, and the development loop is significantly faster within the assignment timebox. For an AI-native company like Nao Medical, a Python backend also integrates more naturally with future AI/ML features.

### MongoDB over SQL
Documents store rich-text content as Tiptap JSON — a nested, variable-structure object. MongoDB stores this natively without schema migrations or JSON serialisation overhead. The `documents` and `shares` collections have a simple, flat relationship that does not benefit from relational joins at this scope.

### Tiptap over Quill / Draft.js
Tiptap v2 is built on ProseMirror and has the best React integration of any open-source rich-text editor. It stores content as portable JSON (not HTML), which is safe to persist, diff, and eventually version. The `StarterKit` extension ships bold, italic, headings, lists, and history in a single import.

### Mock JWT Auth over Firebase/Supabase
Three seeded users with no passwords keeps the reviewer experience frictionless — pick a user, get a token, start testing. A real auth system would add 1–2 hours of scope without demonstrating anything new about document editing or sharing logic. The JWT implementation is production-shaped (signed tokens, expiry, Bearer scheme, `get_current_user` dependency injection) — swapping in real passwords or OAuth would be a small delta.

---

## What I Prioritised

1. **Editor quality** — The Tiptap integration, auto-save debounce, Ctrl+S, and inline title editing make the editing experience feel polished rather than demo-grade.

2. **Access control correctness** — Every backend route distinguishes owner vs shared user. Shared users can edit content but cannot rename, delete, or manage shares. This is enforced server-side, not just hidden in the UI.

3. **API design** — Clean separation of concerns across four route files. Consistent error codes (401, 403, 404, 415). Typed Pydantic models for every request and response.

4. **Reviewer experience** — `/docs` Swagger UI, seeded accounts, friendly error messages ("Is the backend running?"), and a health check endpoint make the project easy to evaluate quickly.

---

## What I Deprioritised

- **Real-time collaboration** — WebSocket/CRDT sync is a significant engineering surface. Noted as a known limitation.
- **Markdown rendering** — `.md` files are imported as plain paragraphs, not rendered with headings/code blocks. A `marked` or `remark` parser would handle this but adds scope.
- **Pagination** — The document list fetches all documents in one request. Acceptable at demo scale.
- **Refresh tokens** — Tokens expire after 7 days. A refresh flow would be needed for production.
- **Tests for frontend** — Given the timebox, tests were focused on the backend where business logic lives.

---

## Data Model

```
users
  _id, username, email, display_name, created_at

documents
  _id, title, content (Tiptap JSON), owner_id, created_at, updated_at

shares
  _id, document_id, owner_id, shared_with_id, shared_with_username, created_at
```

The `shares` collection stores `shared_with_username` as a denormalised field so share list lookups don't require a join back to `users`.

---

## Auto-save Strategy

Content changes trigger a debounced save (1.5s delay). Each keystroke resets the timer — so a continuous typing session triggers one save, not hundreds. A `SaveStatus` component shows "Saving…" → "Saved ✓" → fades out. Ctrl+S triggers an immediate save bypassing the debounce.

---

## Frontend Architecture

State is kept local to each page component — no Redux or Zustand. `AuthContext` is the only global state (user + token). This keeps the component tree shallow and easy to follow for a reviewer. The `api.js` module centralises all HTTP calls with a single Axios instance that auto-attaches the Bearer token and redirects to `/login` on 401.

---

## If I Had 2 More Hours

1. Real-time presence indicators (who else is viewing the document)
2. Document version history (store content snapshots on each save)
3. Markdown-aware import (parse headings, bold, lists from `.md` files into proper Tiptap nodes)
4. Export to plain text or Markdown