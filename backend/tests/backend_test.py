"""Backend regression tests for Session 8 features: contact/waitlist endpoints, chat quota, monthly reset."""
import os
import time
import pytest
import requests
from pymongo import MongoClient

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://lead-ops-bot.preview.emergentagent.com").rstrip("/")
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "test_database")

# Load backend env if needed
try:
    from dotenv import load_dotenv
    load_dotenv("/app/backend/.env")
    MONGO_URL = os.environ.get("MONGO_URL", MONGO_URL)
    DB_NAME = os.environ.get("DB_NAME", DB_NAME)
except Exception:
    pass


@pytest.fixture(scope="session")
def db():
    c = MongoClient(MONGO_URL)
    return c[DB_NAME]


@pytest.fixture(scope="session")
def admin_token():
    r = requests.post(f"{BASE_URL}/api/auth/login", json={"email": "admin@acme.demo", "password": "admin123"})
    assert r.status_code == 200, r.text
    return r.json()["token"]


@pytest.fixture(scope="session")
def alice_token():
    r = requests.post(f"{BASE_URL}/api/auth/login", json={"email": "alice@acme.demo", "password": "agent123"})
    assert r.status_code == 200, r.text
    return r.json()["token"]


# --------- Public: Contact ---------
class TestContact:
    def test_contact_submit_and_persist(self, db):
        payload = {
            "name": "TEST_Contact",
            "email": f"test_contact_{int(time.time())}@example.com",
            "company": "TEST Co",
            "message": "This is a test message",
        }
        r = requests.post(f"{BASE_URL}/api/public/contact", json=payload)
        assert r.status_code == 200, r.text
        body = r.json()
        assert body.get("ok") is True

        # verify persistence
        doc = db.contact_submissions.find_one({"email": payload["email"]})
        assert doc is not None
        assert doc["name"] == payload["name"]
        assert doc["message"] == payload["message"]
        db.contact_submissions.delete_one({"email": payload["email"]})

    def test_contact_admin_list(self, admin_token):
        r = requests.get(f"{BASE_URL}/api/admin/contact", headers={"Authorization": f"Bearer {admin_token}"})
        assert r.status_code == 200
        assert isinstance(r.json(), list)


# --------- Public: Waitlist ---------
class TestWaitlist:
    def test_waitlist_upsert(self, db):
        email = f"test_wl_{int(time.time())}@example.com"
        r = requests.post(f"{BASE_URL}/api/public/waitlist", json={"email": email})
        assert r.status_code == 200
        assert r.json().get("ok") is True

        # second call - should still be 200 (upsert)
        r2 = requests.post(f"{BASE_URL}/api/public/waitlist", json={"email": email})
        assert r2.status_code == 200

        # verify only ONE record exists (upsert)
        count = db.waitlist.count_documents({"email": email})
        assert count == 1
        db.waitlist.delete_many({"email": email})

    def test_waitlist_admin_list(self, admin_token):
        r = requests.get(f"{BASE_URL}/api/admin/waitlist", headers={"Authorization": f"Bearer {admin_token}"})
        assert r.status_code == 200
        assert isinstance(r.json(), list)


# --------- Chat + monthly reset + quota ---------
class TestChatAndQuota:
    def test_chat_admin_basic(self, admin_token, db):
        r = requests.post(
            f"{BASE_URL}/api/chat",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"message": "what urgent tasks?"},
            timeout=60,
        )
        assert r.status_code == 200, r.text
        data = r.json()
        assert "answer" in data
        assert "tokens_in" in data and "tokens_out" in data
        assert isinstance(data["tokens_in"], int)

        # Verify token_reset_month field was set
        admin = db.users.find_one({"email": "admin@acme.demo"})
        assert admin is not None
        assert "token_reset_month" in admin
        # Format YYYY-MM
        assert len(admin["token_reset_month"]) == 7

    def test_chat_quota_429(self, db):
        """Set a user's token_used above their limit and verify 429."""
        # find alice
        alice = db.users.find_one({"email": "alice@acme.demo"})
        assert alice is not None
        orig_limit = alice.get("token_limit", 0)
        orig_used = alice.get("token_used", 0)

        # set alice's limit=100, used=200, and force reset_month so no reset happens
        from datetime import datetime, timezone
        key = f"{datetime.now(timezone.utc).year}-{datetime.now(timezone.utc).month:02d}"
        db.users.update_one(
            {"email": "alice@acme.demo"},
            {"$set": {"token_limit": 100, "token_used": 200, "token_reset_month": key}},
        )
        try:
            login = requests.post(f"{BASE_URL}/api/auth/login", json={"email": "alice@acme.demo", "password": "agent123"})
            assert login.status_code == 200
            tok = login.json()["token"]
            r = requests.post(
                f"{BASE_URL}/api/chat",
                headers={"Authorization": f"Bearer {tok}"},
                json={"message": "test quota"},
                timeout=30,
            )
            assert r.status_code == 429, f"Expected 429 got {r.status_code}: {r.text}"
        finally:
            db.users.update_one(
                {"email": "alice@acme.demo"},
                {"$set": {"token_limit": orig_limit, "token_used": orig_used}},
            )

    def test_monthly_reset(self, admin_token, db):
        """Set fake old reset_month, then invoke chat, then verify token_used reset."""
        admin = db.users.find_one({"email": "admin@acme.demo"})
        orig_used = admin.get("token_used", 0)
        orig_month = admin.get("token_reset_month", "")

        # Force fake old month
        db.users.update_one(
            {"email": "admin@acme.demo"},
            {"$set": {"token_reset_month": "2020-01", "token_used": 99999}},
        )
        try:
            r = requests.post(
                f"{BASE_URL}/api/chat",
                headers={"Authorization": f"Bearer {admin_token}"},
                json={"message": "monthly reset test"},
                timeout=60,
            )
            assert r.status_code == 200, r.text
            updated = db.users.find_one({"email": "admin@acme.demo"})
            # token_used should be reset (then increased by this call), but reset_month must be current
            from datetime import datetime, timezone
            expected = f"{datetime.now(timezone.utc).year}-{datetime.now(timezone.utc).month:02d}"
            assert updated["token_reset_month"] == expected
            # token_used should be small (only this call's cost, not 99999)
            assert updated["token_used"] < 5000
        finally:
            db.users.update_one(
                {"email": "admin@acme.demo"},
                {"$set": {"token_used": orig_used, "token_reset_month": orig_month or expected}},
            )
