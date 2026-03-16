from fastapi import APIRouter, HTTPException, status
from database import get_db
from models import LoginRequest, TokenResponse, UserPublic
from auth import create_access_token
from seeder import get_all_users

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest):
    """
    Mock login — just provide a username from the seeded list.
    No password required. Returns a JWT for use in subsequent requests.
    """
    db = get_db()
    user = await db.users.find_one({"username": body.username.lower().strip()})

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User '{body.username}' not found. Try: alice, bob, or charlie.",
        )

    user_id = str(user["_id"])
    token = create_access_token(user_id=user_id, username=user["username"])

    return TokenResponse(
        access_token=token,
        user=UserPublic(
            id=user_id,
            username=user["username"],
            email=user["email"],
            display_name=user["display_name"],
        ),
    )


@router.get("/me", response_model=UserPublic)
async def me(current_user: UserPublic = __import__("fastapi").Depends(
    __import__("auth", fromlist=["get_current_user"]).get_current_user
)):
    """Returns the currently authenticated user."""
    return current_user


@router.get("/users", response_model=list[UserPublic])
async def list_users():
    """
    Returns all seeded users.
    Used by the frontend to populate the share-with dropdown.
    No auth required — these are mock accounts, not sensitive data.
    """
    users = await get_all_users()
    return [UserPublic(**u) for u in users]