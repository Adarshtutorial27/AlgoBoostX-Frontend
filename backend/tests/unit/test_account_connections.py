"""Unit and integration tests for Delta Exchange API Connection & Account Isolation."""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal, init_db
from app.models.account import AccountConnection
from app.core.security import encrypt_secret, decrypt_secret, mask_key
from app.exchange.client import DeltaExchangeClient
from app.exchange.manager import get_client_for_account, activate_account

client = TestClient(app)


def setup_module():
    init_db()


@pytest.fixture(autouse=True)
def cleanup_test_accounts():
    """Ensures test accounts are cleaned up before and after each test."""
    db = SessionLocal()
    try:
        db.query(AccountConnection).filter(
            AccountConnection.user_id.in_(["user_alice", "user_bob", "user_temp", "user_resolver"])
        ).delete()
        db.commit()
    finally:
        db.close()
    yield
    db = SessionLocal()
    try:
        db.query(AccountConnection).filter(
            AccountConnection.user_id.in_(["user_alice", "user_bob", "user_temp", "user_resolver"])
        ).delete()
        db.commit()
    finally:
        db.close()


def test_secret_encryption_and_masking():
    """Validates encryption at rest and key masking utilities."""
    plain_secret = "test_super_secret_delta_key_987654321"
    encrypted = encrypt_secret(plain_secret)
    assert encrypted != plain_secret
    assert len(encrypted) > 20

    decrypted = decrypt_secret(encrypted)
    assert decrypted == plain_secret

    masked = mask_key("delta_test_key_abcdef123456")
    assert masked == "delta_...3456"
    assert "abcdef" not in masked


def test_connect_account_and_isolation(db_session):
    """Validates connecting accounts with user isolation and encrypted persistence."""
    # Connect account for User A
    payload_a = {
        "label": "User A Testnet Account",
        "api_key": "user_a_key_123456789",
        "api_secret": "user_a_secret_987654321",
        "environment": "testnet",
        "base_url": "https://cdn-ind.testnet.deltaex.org",
        "user_id": "user_alice",
    }
    res_a = client.post("/api/v1/accounts/connect", json=payload_a)
    assert res_a.status_code == 201
    data_a = res_a.json()
    assert data_a["user_id"] == "user_alice"
    assert data_a["api_key_masked"] == "user_a...6789"
    assert "user_a_secret" not in str(data_a)  # secret never leaked

    # Connect account for User B
    payload_b = {
        "label": "User B Testnet Account",
        "api_key": "user_b_key_987654321",
        "api_secret": "user_b_secret_123456789",
        "environment": "testnet",
        "base_url": "https://cdn-ind.testnet.deltaex.org",
        "user_id": "user_bob",
    }
    res_b = client.post("/api/v1/accounts/connect", json=payload_b)
    assert res_b.status_code == 201
    data_b = res_b.json()
    assert data_b["user_id"] == "user_bob"

    # Verify User A only sees their own accounts
    list_a = client.get("/api/v1/accounts?user_id=user_alice").json()
    assert len(list_a) == 1
    assert list_a[0]["user_id"] == "user_alice"
    assert list_a[0]["label"] == "User A Testnet Account"

    # Verify User B only sees their own accounts
    list_b = client.get("/api/v1/accounts?user_id=user_bob").json()
    assert len(list_b) == 1
    assert list_b[0]["user_id"] == "user_bob"
    assert list_b[0]["label"] == "User B Testnet Account"


def test_mainnet_connection_prohibited():
    """Validates that connecting to Mainnet is strictly blocked by policy."""
    payload = {
        "label": "Accidental Mainnet Attempt",
        "api_key": "mainnet_key_12345",
        "api_secret": "mainnet_secret_54321",
        "environment": "mainnet",
        "base_url": "https://api.delta.exchange",
        "user_id": "user_test",
    }
    res = client.post("/api/v1/accounts/connect", json=payload)
    assert res.status_code == 400
    assert "Only Testnet environment" in res.json()["detail"]


def test_account_disconnect_and_removal(db_session):
    """Validates disconnecting an account removes stored secrets from the database."""
    payload = {
        "label": "Temporary Testnet Account",
        "api_key": "temp_key_999888777",
        "api_secret": "temp_secret_111222333",
        "environment": "testnet",
        "user_id": "user_temp",
    }
    res = client.post("/api/v1/accounts/connect", json=payload)
    acc_id = res.json()["account_id"]

    # Verify account exists
    check = client.get(f"/api/v1/accounts?user_id=user_temp").json()
    assert len(check) == 1

    # Disconnect
    del_res = client.delete(f"/api/v1/accounts/{acc_id}?user_id=user_temp")
    assert del_res.status_code == 200
    assert del_res.json()["success"] is True

    # Verify account is completely removed
    check_after = client.get(f"/api/v1/accounts?user_id=user_temp").json()
    assert len(check_after) == 0


def test_client_resolution_from_active_account(db_session):
    """Validates that get_client_for_account decrypts secrets and provides a configured client."""
    # Insert account into DB
    acc = AccountConnection(
        user_id="user_resolver",
        label="Resolver Test",
        environment="testnet",
        base_url="https://cdn-ind.testnet.deltaex.org",
        api_key_masked=mask_key("key_resolve_12345"),
        api_key_encrypted=encrypt_secret("key_resolve_12345"),
        api_secret_encrypted=encrypt_secret("sec_resolve_54321"),
        is_active=True,
        is_validated=True,
    )
    db_session.add(acc)
    db_session.commit()

    resolved_client, active_acc = get_client_for_account(db_session, user_id="user_resolver")
    assert resolved_client is not None
    assert resolved_client.api_key == "key_resolve_12345"
    assert resolved_client.api_secret == "sec_resolve_54321"
    assert resolved_client.base_url == "https://cdn-ind.testnet.deltaex.org"
    assert active_acc.account_id == acc.account_id
