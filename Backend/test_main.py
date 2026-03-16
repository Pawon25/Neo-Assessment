"""
Tests for DocEditor API.

Run with:
    cd backend
    pytest test_main.py -v

Requires a running MongoDB instance (uses a separate test DB to avoid polluting dev data).
"""

import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from motor.motor_asyncio import AsyncIOMotorClient

from main import app
from database import get_db
import database as db_module


TEST_DB_NAME = "doceditor_test"


# ── Fixtures ──────────────────────────────────────────────────────────────────

@pytest_asyncio.fixture(autouse=True)
async def use_test_db(monkeypatch):
    """
    Redirects all DB calls to a clean test database.
    Drops it after each test to ensure isolation.
    """
    test_client = AsyncIOMotorClient("mongodb://localhost:27017")
    db_module.client = test_client

    monkeypatch.setattr("database.get_db", lambda: test_client[TEST_DB_NAME])
    monkeypatch.setattr("routes.auth.get_db", lambda: test_client[TEST_DB_NAME])
    monkeypatch.setattr("routes.documents.get_db", lambda: test_client[TEST_DB_NAME])
    monkeypatch.setattr("routes.shares.get_db", lambda: test_client[TEST_DB_NAME])
    monkeypatch.setattr("routes.upload.get_db", lambda: test_client[TEST_DB_NAME])
    monkeypatch.setattr("auth.get_db", lambda: test_client[TEST_DB_NAME])
    monkeypatch.setattr("seeder.get_db", lambda: test_client[TEST_DB_NAME])

    # Seed users into test DB
    from seeder import seed_users
    await seed_users()

    yield

    # Teardown — drop test DB
    await test_client.drop_database(TEST_DB_NAME)
    test_client.close()


@pytest_asyncio.fixture
async def client():
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac


@pytest_asyncio.fixture
async def alice_token(client):
    resp = await client.post("/auth/login", json={"username": "alice"})
    return resp.json()["access_token"]


@pytest_asyncio.fixture
async def bob_token(client):
    resp = await client.post("/auth/login", json={"username": "bob"})
    return resp.json()["access_token"]


def auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


# ── Auth tests ────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_login_valid_user(client):
    resp = await client.post("/auth/login", json={"username": "alice"})
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["user"]["username"] == "alice"


@pytest.mark.asyncio
async def test_login_invalid_user(client):
    resp = await client.post("/auth/login", json={"username": "nobody"})
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_me_returns_current_user(client, alice_token):
    resp = await client.get("/auth/me", headers=auth(alice_token))
    assert resp.status_code == 200
    assert resp.json()["username"] == "alice"


@pytest.mark.asyncio
async def test_me_rejects_bad_token(client):
    resp = await client.get("/auth/me", headers=auth("bad.token.here"))
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_list_users_returns_all_seeded(client):
    resp = await client.get("/auth/users")
    assert resp.status_code == 200
    usernames = [u["username"] for u in resp.json()]
    assert "alice" in usernames
    assert "bob" in usernames
    assert "charlie" in usernames


# ── Document tests ────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_create_document(client, alice_token):
    resp = await client.post(
        "/documents",
        json={"title": "My First Doc"},
        headers=auth(alice_token),
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["title"] == "My First Doc"
    assert data["access"] == "owned"
    assert data["owner_name"] == "Alice Johnson"


@pytest.mark.asyncio
async def test_list_documents_returns_owned(client, alice_token):
    await client.post("/documents", json={"title": "Doc A"}, headers=auth(alice_token))
    await client.post("/documents", json={"title": "Doc B"}, headers=auth(alice_token))

    resp = await client.get("/documents", headers=auth(alice_token))
    assert resp.status_code == 200
    titles = [d["title"] for d in resp.json()]
    assert "Doc A" in titles
    assert "Doc B" in titles


@pytest.mark.asyncio
async def test_rename_document(client, alice_token):
    create = await client.post(
        "/documents", json={"title": "Old Title"}, headers=auth(alice_token)
    )
    doc_id = create.json()["id"]

    resp = await client.patch(
        f"/documents/{doc_id}/rename",
        json={"title": "New Title"},
        headers=auth(alice_token),
    )
    assert resp.status_code == 200
    assert resp.json()["title"] == "New Title"


@pytest.mark.asyncio
async def test_save_and_retrieve_content(client, alice_token):
    create = await client.post(
        "/documents", json={"title": "Content Test"}, headers=auth(alice_token)
    )
    doc_id = create.json()["id"]

    tiptap_content = {
        "type": "doc",
        "content": [
            {"type": "paragraph", "content": [{"type": "text", "text": "Hello world"}]}
        ],
    }

    save = await client.put(
        f"/documents/{doc_id}/content",
        json={"content": tiptap_content},
        headers=auth(alice_token),
    )
    assert save.status_code == 200
    assert save.json()["content"]["content"][0]["content"][0]["text"] == "Hello world"


@pytest.mark.asyncio
async def test_delete_document(client, alice_token):
    create = await client.post(
        "/documents", json={"title": "To Delete"}, headers=auth(alice_token)
    )
    doc_id = create.json()["id"]

    delete = await client.delete(f"/documents/{doc_id}", headers=auth(alice_token))
    assert delete.status_code == 204

    get = await client.get(f"/documents/:{doc_id}", headers=auth(alice_token))
    assert get.status_code == 404


@pytest.mark.asyncio
async def test_non_owner_cannot_rename(client, alice_token, bob_token):
    create = await client.post(
        "/documents", json={"title": "Alice Doc"}, headers=auth(alice_token)
    )
    doc_id = create.json()["id"]

    resp = await client.patch(
        f"/documents/{doc_id}/rename",
        json={"title": "Bob Hijack"},
        headers=auth(bob_token),
    )
    assert resp.status_code == 403


# ── Sharing tests ─────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_share_document_with_bob(client, alice_token, bob_token):
    create = await client.post(
        "/documents", json={"title": "Shared Doc"}, headers=auth(alice_token)
    )
    doc_id = create.json()["id"]

    share = await client.post(
        f"/documents/{doc_id}/share",
        json={"username": "bob"},
        headers=auth(alice_token),
    )
    assert share.status_code == 201
    assert share.json()["shared_with_username"] == "bob"


@pytest.mark.asyncio
async def test_shared_user_can_access_document(client, alice_token, bob_token):
    create = await client.post(
        "/documents", json={"title": "Collab Doc"}, headers=auth(alice_token)
    )
    doc_id = create.json()["id"]

    await client.post(
        f"/documents/{doc_id}/share",
        json={"username": "bob"},
        headers=auth(alice_token),
    )

    # Bob can now list and see the doc
    resp = await client.get("/documents", headers=auth(bob_token))
    ids = [d["id"] for d in resp.json()]
    assert doc_id in ids

    # Bob's copy shows access = "shared"
    doc = next(d for d in resp.json() if d["id"] == doc_id)
    assert doc["access"] == "shared"


@pytest.mark.asyncio
async def test_unshared_user_cannot_access_document(client, alice_token, bob_token):
    create = await client.post(
        "/documents", json={"title": "Private Doc"}, headers=auth(alice_token)
    )
    doc_id = create.json()["id"]

    resp = await client.get(f"/documents/:{doc_id}", headers=auth(bob_token))
    assert resp.status_code == 403 or resp.status_code == 404


@pytest.mark.asyncio
async def test_cannot_share_with_yourself(client, alice_token):
    create = await client.post(
        "/documents", json={"title": "Solo Doc"}, headers=auth(alice_token)
    )
    doc_id = create.json()["id"]

    resp = await client.post(
        f"/documents/{doc_id}/share",
        json={"username": "alice"},
        headers=auth(alice_token),
    )
    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_revoke_share(client, alice_token, bob_token):
    create = await client.post(
        "/documents", json={"title": "Revoke Test"}, headers=auth(alice_token)
    )
    doc_id = create.json()["id"]

    await client.post(
        f"/documents/{doc_id}/share",
        json={"username": "bob"},
        headers=auth(alice_token),
    )

    revoke = await client.delete(
        f"/documents/{doc_id}/share/bob", headers=auth(alice_token)
    )
    assert revoke.status_code == 204


# ── Upload tests ──────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_upload_txt_creates_document(client, alice_token):
    file_content = b"Hello from a text file.\nThis is line two."
    resp = await client.post(
        "/upload",
        files={"file": ("my_notes.txt", file_content, "text/plain")},
        headers=auth(alice_token),
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["title"] == "My Notes"
    assert data["content"]["type"] == "doc"


@pytest.mark.asyncio
async def test_upload_md_creates_document(client, alice_token):
    file_content = b"# Heading\n\nSome markdown content here."
    resp = await client.post(
        "/upload",
        files={"file": ("project_brief.md", file_content, "text/markdown")},
        headers=auth(alice_token),
    )
    assert resp.status_code == 201
    assert resp.json()["title"] == "Project Brief"


@pytest.mark.asyncio
async def test_upload_rejects_unsupported_type(client, alice_token):
    resp = await client.post(
        "/upload",
        files={"file": ("doc.pdf", b"%PDF-1.4", "application/pdf")},
        headers=auth(alice_token),
    )
    assert resp.status_code == 415


@pytest.mark.asyncio
async def test_upload_requires_auth(client):
    resp = await client.post(
        "/upload",
        files={"file": ("test.txt", b"hello", "text/plain")},
    )
    assert resp.status_code == 403