from datetime import datetime
from typing import Optional

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status

from auth import get_current_user
from database import get_db
from models import (
    DocumentCreate,
    DocumentRename,
    DocumentResponse,
    DocumentUpdate,
    UserPublic,
)

router = APIRouter(prefix="/documents", tags=["documents"])


# ── Helpers ───────────────────────────────────────────────────────────────────

def to_object_id(id_str: str) -> ObjectId:
    try:
        return ObjectId(id_str)
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid document ID")


async def enrich(doc: dict, current_user_id: str, db) -> DocumentResponse:
    """
    Adds owner_name and access type to a raw MongoDB document dict.
    access = 'owned' if the current user owns it, else 'shared'.
    """
    owner = await db.users.find_one({"_id": ObjectId(doc["owner_id"])})
    owner_name = owner["display_name"] if owner else "Unknown"
    access = "owned" if doc["owner_id"] == current_user_id else "shared"

    return DocumentResponse(
        id=str(doc["_id"]),
        title=doc["title"],
        content=doc.get("content"),
        owner_id=doc["owner_id"],
        owner_name=owner_name,
        access=access,
        created_at=doc["created_at"],
        updated_at=doc["updated_at"],
    )


async def assert_owner(doc: dict, current_user_id: str):
    """Raises 403 if the current user is not the document owner."""
    if doc["owner_id"] != current_user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the document owner can perform this action",
        )


async def assert_access(doc_id: str, current_user_id: str, db) -> dict:
    """
    Returns the document if the current user owns it OR has been granted access.
    Raises 404 / 403 otherwise.
    """
    doc = await db.documents.find_one({"_id": to_object_id(doc_id)})
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    # Owner always has access
    if doc["owner_id"] == current_user_id:
        return doc

    # Check shares collection
    share = await db.shares.find_one({
        "document_id": doc_id,
        "shared_with_id": current_user_id,
    })
    if not share:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this document",
        )

    return doc


# ── Routes ────────────────────────────────────────────────────────────────────

@router.post("", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def create_document(
    body: DocumentCreate,
    current_user: UserPublic = Depends(get_current_user),
):
    """Creates a new empty document owned by the current user."""
    db = get_db()
    now = datetime.utcnow()

    result = await db.documents.insert_one({
        "title": body.title.strip() or "Untitled Document",
        "content": None,
        "owner_id": current_user.id,
        "created_at": now,
        "updated_at": now,
    })

    doc = await db.documents.find_one({"_id": result.inserted_id})
    return await enrich(doc, current_user.id, db)


@router.get("", response_model=list[DocumentResponse])
async def list_documents(current_user: UserPublic = Depends(get_current_user)):
    """
    Returns all documents the current user can access:
    - Documents they own
    - Documents shared with them
    Sorted by updated_at descending (most recent first).
    """
    db = get_db()

    # Owned documents
    owned = []
    async for doc in db.documents.find({"owner_id": current_user.id}):
        owned.append(doc)

    # Shared document IDs
    shared_doc_ids = []
    async for share in db.shares.find({"shared_with_id": current_user.id}):
        shared_doc_ids.append(share["document_id"])

    # Fetch shared documents
    shared = []
    for doc_id in shared_doc_ids:
        doc = await db.documents.find_one({"_id": to_object_id(doc_id)})
        if doc:
            shared.append(doc)

    all_docs = owned + shared
    all_docs.sort(key=lambda d: d["updated_at"], reverse=True)

    return [await enrich(doc, current_user.id, db) for doc in all_docs]


@router.get("/:id", response_model=DocumentResponse)
async def get_document(
    id: str,
    current_user: UserPublic = Depends(get_current_user),
):
    """Returns a single document if the user has access."""
    db = get_db()
    doc = await assert_access(id, current_user.id, db)
    return await enrich(doc, current_user.id, db)


@router.patch("/{id}/rename", response_model=DocumentResponse)
async def rename_document(
    id: str,
    body: DocumentRename,
    current_user: UserPublic = Depends(get_current_user),
):
    """Renames a document. Owner only."""
    db = get_db()
    doc = await assert_access(id, current_user.id, db)
    await assert_owner(doc, current_user.id)

    new_title = body.title.strip() or "Untitled Document"
    await db.documents.update_one(
        {"_id": to_object_id(id)},
        {"$set": {"title": new_title, "updated_at": datetime.utcnow()}},
    )

    updated = await db.documents.find_one({"_id": to_object_id(id)})
    return await enrich(updated, current_user.id, db)


@router.put("/{id}/content", response_model=DocumentResponse)
async def save_content(
    id: str,
    body: DocumentUpdate,
    current_user: UserPublic = Depends(get_current_user),
):
    """
    Saves document content (Tiptap JSON).
    Both owner and shared users can save content.
    """
    db = get_db()
    await assert_access(id, current_user.id, db)

    await db.documents.update_one(
        {"_id": to_object_id(id)},
        {"$set": {"content": body.content, "updated_at": datetime.utcnow()}},
    )

    updated = await db.documents.find_one({"_id": to_object_id(id)})
    return await enrich(updated, current_user.id, db)


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(
    id: str,
    current_user: UserPublic = Depends(get_current_user),
):
    """Deletes a document and all its shares. Owner only."""
    db = get_db()
    doc = await assert_access(id, current_user.id, db)
    await assert_owner(doc, current_user.id)

    await db.documents.delete_one({"_id": to_object_id(id)})
    await db.shares.delete_many({"document_id": id})