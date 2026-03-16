# Evaluator Quickstart Guide

Hi! This note will get you from zero to a running app in under 5 minutes.  
The app has two parts — a Python backend and a React frontend. Both need to run simultaneously.

---

## What You Need Installed

| Tool | Version | Check |
|------|---------|-------|
| Python | 3.10+ | `python --version` |
| Node.js | 18+ | `node --version` |
| MongoDB | Any recent | Running on port 27017 |

> **No MongoDB installed?** The easiest option is [MongoDB Atlas free tier](https://www.mongodb.com/cloud/atlas/register) — create a free cluster, copy the connection string, and paste it into `Backend/.env` as `MONGODB_URL=<your-string>`.

---

## Step 1 — Start MongoDB

```bash
# Mac (Homebrew)
brew services start mongodb-community

# Ubuntu / WSL
sudo systemctl start mongod

# Windows
# Open Services → find "MongoDB" → Start
# OR run: net start MongoDB
```

---

## Step 2 — Start the Backend

Open a terminal and run:

```bash
cd Backend

# Create and activate virtual environment
python -m venv venv

# Windows
venv\Scripts\activate

# Mac / Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env        # Mac/Linux
copy .env.example .env      # Windows

# Start the server
uvicorn main:app --reload --port 8000
```

**You should see:**
```
[seeder] Inserted 3 seed user(s).
[app] DocEditor API is ready.
INFO: Uvicorn running on http://127.0.0.1:8000
```

> If you see `[seeder] Seed users already exist` on a second run — that is expected and fine.

**Verify it works:** Open `http://127.0.0.1:8000/health` in your browser.  
You should see: `{"status":"ok","service":"doceditor-api"}`

**Full interactive API docs:** `http://127.0.0.1:8000/docs`

---

## Step 3 — Start the Frontend

Open a **second terminal** (keep the backend running) and run:

```bash
cd frontend

npm install --legacy-peer-deps

npm start
```

**You should see:**
```
Compiled successfully!
Local: http://localhost:3000
```

Your browser should open automatically at `http://localhost:3000`.

---

## Step 4 — Log In and Test

The app has **3 pre-seeded demo accounts** — no passwords needed:

| Username  | Name           |
|-----------|----------------|
| `alice`   | Alice Johnson  |
| `bob`     | Bob Smith      |
| `charlie` | Charlie Lee    |

**Recommended test flow:**

1. Select **Alice** from the dropdown → click Continue
2. Click **New document** → type something in the editor
3. Watch the **"Saved ✓"** indicator appear automatically after 1.5s
4. Click the **pencil icon** next to the title to rename the document
5. Click **Import file** → upload any `.txt` or `.md` file from your computer
6. Open a document → click **Share** → share with **bob**
7. Log out → log in as **Bob** → click the **Shared** tab → you should see Alice's document

---

## Troubleshooting

**Backend won't start — `ModuleNotFoundError`**
- Make sure your virtual environment is activated (`venv\Scripts\activate` on Windows)
- Make sure you are inside the `Backend` folder when running uvicorn

**Frontend won't start — `Module not found`**
- Run `npm install --legacy-peer-deps` again
- Make sure you are inside the `frontend` folder

**Documents not loading — 401 Unauthorized**
- The backend is not running or MongoDB is not connected
- Check that `http://127.0.0.1:8000/health` returns a response

**MongoDB connection error**
- Make sure MongoDB is running (Step 1)
- Or use Atlas: update `MONGODB_URL` in `Backend/.env` with your Atlas connection string

**Port already in use**
```bash
# Run backend on a different port
uvicorn main:app --reload --port 8001

# Then update frontend/src/api/api.js line 4:
# baseURL: 'http://127.0.0.1:8001'
```

---

## Running the Tests

```bash
cd Backend
pytest test_main.py -v
```

Requires MongoDB running. Tests use an isolated `doceditor_test` database that is automatically created and dropped — safe to run at any time.

---

## Summary

| Service  | URL                          |
|----------|------------------------------|
| Frontend | http://localhost:3000        |
| Backend  | http://127.0.0.1:8000        |
| API Docs | http://127.0.0.1:8000/docs   |
| Health   | http://127.0.0.1:8000/health |

If anything is unclear or broken, please reach out before marking the submission.  
Thank you for your time reviewing this project.