"""Tests for strategy management API endpoints."""
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import init_db

client = TestClient(app)


def setup_module():
    init_db()


def test_list_strategies():
    res = client.get("/api/v1/strategies")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    assert len(data) >= 2
    ids = [s["strategy_id"] for s in data]
    assert "ema_crossover" in ids
    assert "rsi_mean_reversion" in ids


def test_list_strategies_alias():
    res = client.get("/api/strategies")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    ids = [s["strategy_id"] for s in data]
    assert "ema_crossover" in ids


def test_get_single_strategy():
    res = client.get("/api/v1/strategies/ema_crossover")
    assert res.status_code == 200
    data = res.json()
    assert data["strategy_id"] == "ema_crossover"
    assert "config" in data
    assert "description" in data


def test_get_unknown_strategy_404():
    res = client.get("/api/v1/strategies/nonexistent_strategy")
    assert res.status_code == 404


def test_enable_strategy():
    res = client.post("/api/v1/strategies/ema_crossover/enable")
    assert res.status_code == 200
    data = res.json()
    assert data.get("enabled") is True


def test_disable_strategy():
    res = client.post("/api/v1/strategies/ema_crossover/disable")
    assert res.status_code == 200
    data = res.json()
    assert data.get("enabled") is False


def test_update_strategy_config_valid():
    res = client.put("/api/v1/strategies/ema_crossover/config", json={
        "fast_period": 12, "slow_period": 26
    })
    assert res.status_code == 200
    data = res.json()
    assert data["config"]["fast_period"] == 12


def test_update_strategy_config_invalid():
    res = client.put("/api/v1/strategies/ema_crossover/config", json={
        "fast_period": 50, "slow_period": 10  # fast > slow — invalid
    })
    assert res.status_code in (422, 400)


def test_backtest_ema():
    candles = []
    prices = [100.0 + i * 0.5 for i in range(60)]
    for i, p in enumerate(prices):
        candles.append({
            "time": 1700000000 + i * 300,
            "open": p - 1.0,
            "high": p + 2.0,
            "low": p - 2.0,
            "close": p,
            "volume": 10.0,
        })

    res = client.post("/api/v1/strategies/ema_crossover/backtest", json={
        "candles": candles,
        "initial_capital": 10000.0,
        "fee_pct": 0.0005,
    })
    assert res.status_code == 200
    data = res.json()
    assert "net_profit" in data
    assert "total_trades" in data
    assert "win_rate_pct" in data


def test_rsi_strategy_config_update():
    res = client.put("/api/v1/strategies/rsi_mean_reversion/config", json={
        "rsi_period": 14,
        "oversold_threshold": 30,
        "overbought_threshold": 70,
    })
    assert res.status_code == 200


def test_strategy_signals_endpoint():
    res = client.get("/api/v1/strategies/ema_crossover/signals?limit=10")
    assert res.status_code == 200
    assert isinstance(res.json(), list)
