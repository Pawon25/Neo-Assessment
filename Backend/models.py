from pydantic import BaseModel, Field
from typing import Optional, Any
from datetime import datetime


# ── Helpers ──────────────────────────────────────────────────────────────────

class PyObjectId(str):
    """Coerces MongoDB ObjectId to plain string for JSON serialisation."""

    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        from bson import ObjectId
        if not ObjectId.is_valid(str(v)):
            raise ValueError(f"Invalid ObjectId: {v}")
        return str(v)


# ── User ─────────────────────────────────────────────────────────────────────

class User(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    username: str
    email: str
    display_name: str

    class Config:
        populate_by_name = True


class UserPublic(BaseModel):
    """Safe subset returned to the frontend — no secrets."""
    id: str
    username: str
    email: str
    display_name: str


# ── Auth ─────────────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    username: str  # just pick from seeded list — no password needed


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserPublic


# ── Document ─────────────────────────────────────────────────────────────────

class DocumentCreate(BaseModel):
    title: str = "Untitled Document"


class DocumentRename(BaseModel):
    title: str


class DocumentUpdate(BaseModel):
    content: Any  # Tiptap JSON or plain text — stored as-is


class DocumentInDB(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    title: str
    content: Any = None          # Tiptap JSON
    owner_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        populate_by_name = True


class DocumentResponse(BaseModel):
    """What the API returns — includes owner info + access type."""
    id: str
    title: str
    content: Any = None
    owner_id: str
    owner_name: str = ""
    access: str = "owned"        # "owned" | "shared"
    created_at: datetime
    updated_at: datetime


# ── Sharing ───────────────────────────────────────────────────────────────────

class ShareRequest(BaseModel):
    username: str                # share by username — simpler UX than user_id


class ShareRecord(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    document_id: str
    owner_id: str
    shared_with_id: str
    shared_with_username: str
    created_at: datetime

    class Config:
        populate_by_name = True


class ShareResponse(BaseModel):
    document_id: str
    shared_with_username: str
    shared_with_id: str
    created_at: datetime