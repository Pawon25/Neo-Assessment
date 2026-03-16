from datetime import datetime
from database import get_db

SEED_USERS = [
    {
        "username": "alice",
        "email": "alice@example.com",
        "display_name": "Alice Johnson",
    },
    {
        "username": "bob",
        "email": "bob@example.com",
        "display_name": "Bob Smith",
    },
    {
        "username": "charlie",
        "email": "charlie@example.com",
        "display_name": "Charlie Lee",
    },
]


async def seed_users():
    """
    Inserts seed users if they don't already exist.
    Safe to run on every startup — skips existing usernames.
    """
    db = get_db()
    inserted = 0

    for user_data in SEED_USERS:
        existing = await db.users.find_one({"username": user_data["username"]})
        if not existing:
            await db.users.insert_one({
                **user_data,
                "created_at": datetime.utcnow(),
            })
            inserted += 1

    if inserted:
        print(f"[seeder] Inserted {inserted} seed user(s).")
    else:
        print("[seeder] Seed users already exist — skipping.")


async def get_all_users() -> list[dict]:
    """Returns all users from DB — used by /users endpoint."""
    db = get_db()
    users = []
    async for user in db.users.find({}, {"_id": 1, "username": 1, "email": 1, "display_name": 1}):
        users.append({
            "id": str(user["_id"]),
            "username": user["username"],
            "email": user["email"],
            "display_name": user["display_name"],
        })
    return users