from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import connect_db, close_db
from seeder import seed_users
from routes.auth import router as auth_router
from routes.documents import router as documents_router
from routes.shares import router as shares_router
from routes.upload import router as upload_router

app = FastAPI(
    title="DocEditor API",
    description="Lightweight collaborative document editor — Nao Medical assignment",
    version="1.0.0",
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Lifecycle ─────────────────────────────────────────────────────────────────

@app.on_event("startup")
async def on_startup():
    await connect_db()
    await seed_users()
    print("[app] DocEditor API is ready.")


@app.on_event("shutdown")
async def on_shutdown():
    await close_db()
    print("[app] DocEditor API shut down.")


# ── Routers ───────────────────────────────────────────────────────────────────

app.include_router(auth_router)
app.include_router(documents_router)
app.include_router(shares_router)
app.include_router(upload_router)


# ── Health check ──────────────────────────────────────────────────────────────

@app.get("/health", tags=["meta"])
async def health():
    return {"status": "ok", "service": "doceditor-api"}