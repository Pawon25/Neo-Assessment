from datetime import datetime

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status

from auth import get_current_user
from database import get_db
from models import ShareRequest, ShareResponse, UserPublic

router = APIRouter(prefix="/documents", tags=["sharing"])


# ── Routes ────────────────────────────────────────────────────────────────────

@router.post("/{id}/share", response_model=ShareResponse, status_code=status.HTTP_201_CREATED)
async def share_document(
    id: str,
    body: ShareRequest,
    current_user: UserPublic = Depends(get_current_user),
):
    """
    Grants another user access to a document.
    - Only the owner can share.
    - Cannot share with yourself.
    - Duplicate shares are silently ignored (idempotent).
    """
    db = get_db()

    # Verify document exists and current user owns it
    try:
        doc = await db.documents.find_one({"_id": ObjectId(id)})
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid document ID")

    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    if doc["owner_id"] != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the document owner can share it",
        )

    # Resolve target user by username
    target_user = await db.users.find_one({"username": body.username.lower().strip()})
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User '{body.username}' not found",
        )

    target_id = str(target_user["_id"])

    # Cannot share with yourself
    if target_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot share a document with yourself",
        )

    # Idempotent — skip if already shared
    existing = await db.shares.find_one({
        "document_id": id,
        "shared_with_id": target_id,
    })
    if existing:
        return ShareResponse(
            document_id=id,
            shared_with_username=target_user["username"],
            shared_with_id=target_id,
            created_at=existing["created_at"],
        )

    # Insert share record
    now = datetime.utcnow()
    await db.shares.insert_one({
        "document_id": id,
        "owner_id": current_user.id,
        "shared_with_id": target_id,
        "shared_with_username": target_user["username"],
        "created_at": now,
    })

    return ShareResponse(
        document_id=id,
        shared_with_username=target_user["username"],
        shared_with_id=target_id,
        created_at=now,
    )


@router.get("/{id}/shares", response_model=list[ShareResponse])
async def list_shares(
    id: str,
    current_user: UserPublic = Depends(get_current_user),
):
    """
    Returns all users a document has been shared with.
    Only the owner can see this list.
    """
    db = get_db()

    try:
        doc = await db.documents.find_one({"_id": ObjectId(id)})
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid document ID")

    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    if doc["owner_id"] != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the document owner can view share settings",
        )

    shares = []
    async for share in db.shares.find({"document_id": id}):
        shares.append(ShareResponse(
            document_id=id,
            shared_with_username=share["shared_with_username"],
            shared_with_id=share["shared_with_id"],
            created_at=share["created_at"],
        ))

    return shares


@router.delete("/{id}/share/{username}", status_code=status.HTTP_204_NO_CONTENT)
async def revoke_share(
    id: str,
    username: str,
    current_user: UserPublic = Depends(get_current_user),
):
    """
    Revokes a user's access to a document.
    Only the owner can revoke access.
    """
    db = get_db()

    try:
        doc = await db.documents.find_one({"_id": ObjectId(id)})
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid document ID")

    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    if doc["owner_id"] != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the document owner can revoke access",
        )

    result = await db.shares.delete_one({
        "document_id": id,
        "shared_with_username": username.lower().strip(),
    })

    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No share found for user '{username}' on this document",
        )