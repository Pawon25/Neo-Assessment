# DocEditor — Backend API Documentation

## Overview

The DocEditor backend is a RESTful API built with **FastAPI** and **MongoDB**.  
It handles document management, rich-text persistence, file uploads, and a simple sharing model.

**Base URL (local):** `http://127.0.0.1:8000`  
**Interactive docs:** `http://127.0.0.1:8000/docs`

---

## Tech Stack

| Layer        | Technology                        |
|--------------|-----------------------------------|
| Framework    | FastAPI 0.111                     |
| Runtime      | Python 3.12                       |
| Database     | MongoDB (via Motor async driver)  |
| Auth         | JWT (python-jose, HS256)          |
| Validation   | Pydantic v2                       |
| File upload  | python-multipart                  |
| Server       | Uvicorn                           |

---

## Project Structure

```
backend/
├── main.py           # App entry point, CORS, startup/shutdown lifecycle
├── config.py         # Environment settings via pydantic-settings
├── database.py       # MongoDB async connection (Motor)
├── auth.py           # JWT creation, decoding, get_current_user dependency
├── models.py         # All Pydantic request/response models
├── seeder.py         # Seeds 3 mock users on startup
├── requirements.txt
├── .env.example
├── test_main.py      # 18 pytest tests
└── routes/
    ├── auth.py       # Login + user listing
    ├── documents.py  # Document CRUD
    ├── shares.py     # Share / revoke access
    └── upload.py     # File upload → document
```

---

## Environment Variables

Copy `.env.example` to `.env` before running.

| Variable             | Default                              | Description                        |
|----------------------|--------------------------------------|------------------------------------|
| `MONGODB_URL`        | `mongodb://localhost:27017`          | MongoDB connection string          |
| `DB_NAME`            | `doceditor`                          | Database name                      |
| `JWT_SECRET`         | `supersecretkey_change_in_production`| Secret key for signing JWTs        |
| `JWT_ALGORITHM`      | `HS256`                              | JWT signing algorithm              |
| `JWT_EXPIRE_MINUTES` | `10080`                              | Token lifetime (default: 7 days)   |

---

## Running Locally

```bash
cd Backend
python -m venv venv

# Windows
venv\Scripts\activate

# Mac / Linux
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
uvicorn main:app --reload --port 8000
```

On startup you will see:
```
[seeder] Inserted 3 seed user(s).
[app] DocEditor API is ready.
INFO: Uvicorn running on http://127.0.0.1:8000
```

---

## Authentication

The API uses **mock JWT authentication** — no passwords required.  
Three users are seeded automatically on startup: `alice`, `bob`, `charlie`.

**Flow:**
1. `POST /auth/login` with a username → receive a JWT
2. Include the token in all subsequent requests:
   ```
   Authorization: Bearer <token>
   ```

---

## API Reference

### Meta

#### `GET /health`
Health check. No auth required.

**Response:**
```json
{"status": "ok", "service": "doceditor-api"}
```

---

### Auth — `/auth`

#### `POST /auth/login`
Returns a JWT for the given username.

**Request body:**
```json
{"username": "alice"}
```

**Response:**
```json
{
  "access_token": "<jwt>",
  "token_type": "bearer",
  "user": {
    "id": "...",
    "username": "alice",
    "email": "alice@example.com",
    "display_name": "Alice Johnson"
  }
}
```

**Errors:**
- `404` — username not found (valid options: `alice`, `bob`, `charlie`)

---

#### `GET /auth/me`
Returns the currently authenticated user.  
**Requires auth.**

**Response:** `UserPublic` object

---

#### `GET /auth/users`
Returns all seeded users. Used by the frontend share dropdown.  
**No auth required.**

**Response:**
```json
[
  {"id": "...", "username": "alice", "email": "alice@example.com", "display_name": "Alice Johnson"},
  {"id": "...", "username": "bob",   "email": "bob@example.com",   "display_name": "Bob Smith"},
  {"id": "...", "username": "charlie","email": "charlie@example.com","display_name": "Charlie Lee"}
]
```

---

### Documents — `/documents`

All document routes require auth.

#### `POST /documents`
Creates a new empty document owned by the current user.

**Request body:**
```json
{"title": "My Document"}
```

**Response:** `DocumentResponse` (201)

```json
{
  "id": "664f...",
  "title": "My Document",
  "content": null,
  "owner_id": "664e...",
  "owner_name": "Alice Johnson",
  "access": "owned",
  "created_at": "2024-05-23T10:00:00",
  "updated_at": "2024-05-23T10:00:00"
}
```

---

#### `GET /documents`
Returns all documents the current user can access (owned + shared).  
Sorted by `updated_at` descending.

**Response:** Array of `DocumentResponse`

- `access: "owned"` — user created this document
- `access: "shared"` — another user shared this document with them

---

#### `GET /documents/:{id}`
Returns a single document by ID.

**Errors:**
- `404` — document not found
- `403` — user has no access to this document

---

#### `PATCH /documents/{id}/rename`
Renames a document. **Owner only.**

**Request body:**
```json
{"title": "New Title"}
```

**Errors:**
- `403` — user is not the owner

---

#### `PUT /documents/{id}/content`
Saves document content as Tiptap JSON.  
Both owner and shared users can save.

**Request body:**
```json
{
  "content": {
    "type": "doc",
    "content": [
      {
        "type": "paragraph",
        "content": [{"type": "text", "text": "Hello world"}]
      }
    ]
  }
}
```

---

#### `DELETE /documents/{id}`
Deletes a document and all its share records. **Owner only.**

**Response:** `204 No Content`

---

### Sharing — `/documents/{id}/share`

#### `POST /documents/{id}/share`
Grants another user access to a document. **Owner only.**

**Request body:**
```json
{"username": "bob"}
```

**Response:** `ShareResponse` (201)

```json
{
  "document_id": "664f...",
  "shared_with_username": "bob",
  "shared_with_id": "664e...",
  "created_at": "2024-05-23T10:05:00"
}
```

**Errors:**
- `400` — cannot share with yourself
- `400` — duplicate share (idempotent — returns existing record instead)
- `403` — only the owner can share
- `404` — target username not found

---

#### `GET /documents/{id}/shares`
Lists all users the document has been shared with. **Owner only.**

**Response:** Array of `ShareResponse`

---

#### `DELETE /documents/{id}/share/{username}`
Revokes a user's access to a document. **Owner only.**

**Response:** `204 No Content`

**Errors:**
- `404` — no share found for that username on this document

---

### Upload — `/upload`

#### `POST /upload`
Uploads a `.txt` or `.md` file and creates a new editable document from it.  
**Requires auth.**

**Request:** `multipart/form-data` with a `file` field

**Supported types:** `.txt`, `.md`  
**Max size:** 1 MB  
**Encoding:** UTF-8 (falls back to latin-1)

**Behavior:**
- Filename becomes the document title (`my_notes.txt` → `"My Notes"`)
- Each line of the file becomes a paragraph node in Tiptap JSON
- Empty lines become blank paragraphs for visual spacing
- The new document is immediately editable

**Response:** `DocumentResponse` (201)

**Errors:**
- `415` — unsupported file type (only `.txt` and `.md` accepted)
- `413` — file exceeds 1 MB
- `422` — file could not be decoded as text

---

## Data Models

### DocumentResponse
```json
{
  "id": "string",
  "title": "string",
  "content": "Tiptap JSON | null",
  "owner_id": "string",
  "owner_name": "string",
  "access": "owned | shared",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### ShareResponse
```json
{
  "document_id": "string",
  "shared_with_username": "string",
  "shared_with_id": "string",
  "created_at": "datetime"
}
```

### UserPublic
```json
{
  "id": "string",
  "username": "string",
  "email": "string",
  "display_name": "string"
}
```

---

## MongoDB Collections

### `users`
```json
{
  "_id": "ObjectId",
  "username": "string",
  "email": "string",
  "display_name": "string",
  "created_at": "datetime"
}
```

### `documents`
```json
{
  "_id": "ObjectId",
  "title": "string",
  "content": "Tiptap JSON | null",
  "owner_id": "string (ref: users._id)",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### `shares`
```json
{
  "_id": "ObjectId",
  "document_id": "string (ref: documents._id)",
  "owner_id": "string (ref: users._id)",
  "shared_with_id": "string (ref: users._id)",
  "shared_with_username": "string",
  "created_at": "datetime"
}
```

---

## Access Control Summary

| Action              | Owner | Shared User | Unauthenticated |
|---------------------|-------|-------------|-----------------|
| Create document     | ✅    | ✅           | ❌              |
| View document       | ✅    | ✅           | ❌              |
| Edit content        | ✅    | ✅           | ❌              |
| Rename document     | ✅    | ❌           | ❌              |
| Delete document     | ✅    | ❌           | ❌              |
| Share document      | ✅    | ❌           | ❌              |
| View share list     | ✅    | ❌           | ❌              |
| Revoke share        | ✅    | ❌           | ❌              |
| Upload file         | ✅    | ✅           | ❌              |

---

## Running Tests

```bash
cd Backend
pytest test_main.py -v
```

**18 tests** covering:
- Auth (login, invalid user, token validation)
- Document CRUD (create, list, rename, save content, delete)
- Access control (non-owner blocked, shared user allowed)
- Sharing (grant, list, revoke, self-share blocked)
- Upload (txt, md, unsupported type, unauthenticated)

Each test runs against an isolated `doceditor_test` database that is dropped after every test.
