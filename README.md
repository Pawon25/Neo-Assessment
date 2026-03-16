# Nao Docs — Collaborative Document Editor

A lightweight collaborative document editor built for the Nao Medical Full Stack Developer assignment.

## Resource         ## Link
Walkthrough Video    https://www.loom.com/share/3f227f894f0247f0bbde4059854dfca8
Google Drive         https://drive.google.com/drive/folders/15ghsrYIJyI9btJV7OIDg7Lhtsk3MaoSI?usp=sharing

## Tech Stack

| Layer      | Technology                              |
|------------|-----------------------------------------|
| Frontend   | React (CRA), React Router v6, Tiptap v2 |
| Backend    | FastAPI (Python 3.12)                   |
| Database   | MongoDB (Motor async driver)            |
| Auth       | JWT (mock — no passwords)               |
| Styling    | CSS variables + inline styles           |

---

## Prerequisites

- Python 3.10+
- Node.js 18+
- MongoDB running locally on port `27017`

**Start MongoDB:**
```bash
# Mac
brew services start mongodb-community

# Ubuntu/WSL
sudo systemctl start mongod

# Windows — start MongoDB from Services or run mongod.exe
```

---

## Backend Setup

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

You should see:
```
[seeder] Inserted 3 seed user(s).
[app] DocEditor API is ready.
INFO: Uvicorn running on http://127.0.0.1:8000
```

Interactive API docs: `http://127.0.0.1:8000/docs`

---

## Frontend Setup

```bash
cd frontend
npm install --legacy-peer-deps
npm start
```

App runs at `http://localhost:3000`

---

## Demo Accounts

No passwords required. Pick any of these on the login screen:

| Username  | Display Name   |
|-----------|----------------|
| `alice`   | Alice Johnson  |
| `bob`     | Bob Smith      |
| `charlie` | Charlie Lee    |

---

## Features

### Document editing
- Create, rename, and delete documents
- Rich-text editor (bold, italic, underline, strikethrough, headings, bullet/numbered lists, blockquote, horizontal rule)
- Auto-save every 1.5s after typing stops
- Manual save with Ctrl+S
- Inline title editing directly in the editor header

### File upload
- Upload `.txt` or `.md` files — converted to editable documents
- Max file size: 1 MB
- Filename becomes document title (e.g. `my_notes.txt` → "My Notes")

### Sharing
- Share any document with another user by username
- Shared users can view and edit content
- Only owners can rename, delete, and manage shares
- Dashboard shows "Owned" and "Shared with me" tabs with counts

### Persistence
- All documents and shares persisted in MongoDB
- Content survives page refresh
- Tiptap JSON format preserves rich-text formatting

---

## Running Tests

```bash
cd Backend
pytest test_main.py -v
```

Requires MongoDB running locally. Tests use an isolated `doceditor_test` database that is dropped after every test.

**18 tests** covering auth, document CRUD, access control, sharing, and file upload.

---

## Project Structure

```
Neo-Assessment/
├── Backend/
│   ├── main.py
│   ├── config.py
│   ├── database.py
│   ├── auth.py
│   ├── models.py
│   ├── seeder.py
│   ├── test_main.py
│   ├── requirements.txt
│   ├── .env.example
│   └── routes/
│       ├── auth.py
│       ├── documents.py
│       ├── shares.py
│       └── upload.py
└── frontend/
    └── src/
        ├── api/api.js
        ├── context/AuthContext.js
        ├── styles/global.css
        ├── components/
        │   ├── Navbar.js
        │   ├── Badge.js
        │   ├── Button.js
        │   ├── Modal.js
        │   ├── EmptyState.js
        │   ├── DocumentCard.js
        │   ├── SharePanel.js
        │   └── EditorToolbar.js
        ├── pages/
        │   ├── LoginPage.js
        │   ├── DashboardPage.js
        │   └── EditorPage.js
        ├── App.js
        └── index.js
```

---

## Supported File Types for Upload

| Type       | Extension |
|------------|-----------|
| Plain text | `.txt`    |
| Markdown   | `.md`     |

PDF, DOCX and other formats are not supported in this version.

---

## Known Limitations

- No real-time collaboration (changes by shared users require manual refresh to appear for the owner)
- No rich Markdown rendering for `.md` uploads — content is imported as plain paragraphs
- Single-tenant mock auth — not production-ready
