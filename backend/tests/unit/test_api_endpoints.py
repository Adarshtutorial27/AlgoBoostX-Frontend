"""Unit tests for all FastAPI endpoints using TestClient."""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import init_db

client = TestClient(app)


def setup_module():
    init_db()


def test_health_endpoint():
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] in ("healthy", "degraded")
    assert "app_name" in data


def test_exchange_status_endpoint():
    res = client.get("/api/v1/exchange/status")
    assert res.status_code == 200
    data = res.json()
    assert "exchange" in data
    assert data["connected"] is True


def test_account_endpoint():
    res = client.get("/api/v1/account")
    assert res.status_code == 200
    data = res.json()
    assert "total_balance_usd" in data
    assert "balances" in data


def test_market_endpoint():
    res = client.get("/api/v1/market?limit=25")
    assert res.status_code == 200
    data = res.json()
    assert "latest_price" in data
    assert "candles" in data


def test_strategy_lifecycle_endpoints():
    # 1. Check status
    res = client.get("/api/v1/strategy/status")
    assert res.status_code == 200

    # 2. Start strategy
    start_res = client.post("/api/v1/strategy/start")
    assert start_res.status_code == 200
    assert start_res.json()["active"] is True

    # 3. Stop strategy
    stop_res = client.post("/api/v1/strategy/stop")
    assert stop_res.status_code == 200
    assert stop_res.json()["active"] is False


def test_risk_status_endpoint():
    res = client.get("/api/v1/risk/status")
    assert res.status_code == 200
    data = res.json()
    assert "limits" in data
    assert "live_metrics" in data


def test_emergency_stop_and_reset_endpoints():
    # 1. Trigger Emergency Stop
    stop_res = client.post("/api/v1/emergency-stop", json={"reason": "Automated API test"})
    assert stop_res.status_code == 202
    assert stop_res.json()["emergency_stop"] is True

    # 2. Verify strategy cannot start while emergency stop is active
    start_res = client.post("/api/v1/strategy/start")
    assert start_res.json()["success"] is False

    # 3. Reset Emergency Stop
    reset_res = client.post("/api/v1/emergency-reset")
    assert reset_res.status_code == 200
    assert reset_res.json()["emergency_stop"] is False


def test_queries_endpoints():
    # Signals
    assert client.get("/api/v1/signals").status_code == 200
    # Orders
    assert client.get("/api/v1/orders").status_code == 200
    # Positions
    assert client.get("/api/v1/positions").status_code == 200
    # Trades
    assert client.get("/api/v1/trades").status_code == 200
    # Performance
    assert client.get("/api/v1/trades/performance").status_code == 200
    # Events
    assert client.get("/api/v1/events").status_code == 200
