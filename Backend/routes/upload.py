from datetime import datetime

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from auth import get_current_user
from database import get_db
from models import DocumentResponse, UserPublic

router = APIRouter(prefix="/upload", tags=["upload"])

ALLOWED_TYPES = {"text/plain", "text/markdown"}
ALLOWED_EXTENSIONS = {".txt", ".md"}
MAX_FILE_SIZE = 1 * 1024 * 1024  # 1 MB


def get_extension(filename: str) -> str:
    lower = filename.lower()
    for ext in ALLOWED_EXTENSIONS:
        if lower.endswith(ext):
            return ext
    return ""


def text_to_tiptap(text: str) -> dict:
    """
    Converts plain text into a minimal Tiptap-compatible JSON document.
    Each non-empty line becomes a paragraph node.
    Empty lines become empty paragraph nodes (visual line breaks).
    """
    lines = text.splitlines()
    content_nodes = []

    for line in lines:
        stripped = line.strip()
        if stripped:
            content_nodes.append({
                "type": "paragraph",
                "content": [{"type": "text", "text": stripped}],
            })
        else:
            # Empty line → blank paragraph for spacing
            content_nodes.append({"type": "paragraph"})

    # Guard: at least one paragraph
    if not content_nodes:
        content_nodes.append({"type": "paragraph"})

    return {
        "type": "doc",
        "content": content_nodes,
    }


def derive_title(filename: str) -> str:
    """Strips extension and cleans up filename to use as document title."""
    name = filename
    for ext in ALLOWED_EXTENSIONS:
        if name.lower().endswith(ext):
            name = name[: -len(ext)]
            break
    # Replace underscores/hyphens with spaces, title-case it
    return name.replace("_", " ").replace("-", " ").strip() or "Uploaded Document"


@router.post("", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_file(
    file: UploadFile = File(...),
    current_user: UserPublic = Depends(get_current_user),
):
    """
    Accepts a .txt or .md file and creates a new editable document from it.

    Supported types : .txt, .md
    Max size        : 1 MB
    Encoding        : UTF-8 (falls back to latin-1)
    """
    # ── Validate file type ────────────────────────────────────────────────────
    ext = get_extension(file.filename or "")
    if not ext:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported file type. Only {', '.join(ALLOWED_EXTENSIONS)} files are accepted.",
        )

    # ── Read and size-check ───────────────────────────────────────────────────
    raw_bytes = await file.read()

    if len(raw_bytes) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File exceeds the 1 MB limit.",
        )

    # ── Decode ────────────────────────────────────────────────────────────────
    try:
        text = raw_bytes.decode("utf-8")
    except UnicodeDecodeError:
        try:
            text = raw_bytes.decode("latin-1")
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Could not decode file. Please ensure it is a UTF-8 text file.",
            )

    # ── Convert to Tiptap JSON ────────────────────────────────────────────────
    tiptap_content = text_to_tiptap(text)
    title = derive_title(file.filename or "Uploaded Document")

    # ── Persist ───────────────────────────────────────────────────────────────
    db = get_db()
    now = datetime.utcnow()

    result = await db.documents.insert_one({
        "title": title,
        "content": tiptap_content,
        "owner_id": current_user.id,
        "created_at": now,
        "updated_at": now,
    })

    doc = await db.documents.find_one({"_id": result.inserted_id})
    owner = await db.users.find_one({"_id": result.inserted_id.__class__(current_user.id)})
    owner_name = owner["display_name"] if owner else current_user.display_name

    return DocumentResponse(
        id=str(doc["_id"]),
        title=doc["title"],
        content=doc["content"],
        owner_id=doc["owner_id"],
        owner_name=owner_name,
        access="owned",
        created_at=doc["created_at"],
        updated_at=doc["updated_at"],
    )