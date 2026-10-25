import pandas as pd
import pytest
from app.services.monthly_trend_research import (
    normalize_symbol, calculate_indicators, run_trend_backtest
)


def candles(n=60):
    ts = pd.date_range("2026-08-01", periods=n, freq="D", tz="UTC")
    close = [100 + i * 0.8 for i in range(n)]
    return pd.DataFrame({
        "timestamp": ts, "open": close, "high": [x+2 for x in close],
        "low": [x-2 for x in close], "close": close,
        "volume": [1000+i for i in range(n)]
    })


def test_symbol_validation():
    assert normalize_symbol("BTCUSD") == "BTCUSDT"
    with pytest.raises(ValueError):
        normalize_symbol("DOGEUSD")


def test_indicators_are_calculated():
    out = calculate_indicators(candles())
    assert out["sma_7"].notna().any()
    assert out["sma_30"].notna().any()
    assert 0 <= out["rsi_14"].dropna().iloc[-1] <= 100
    assert out["atr_14"].dropna().iloc[-1] > 0


def test_monthly_backtest_returns_metrics():
    result = run_trend_backtest(candles())
    assert result["candles"] == 30
    assert "strategy_return_pct" in result["backtest"]
    assert "max_strategy_drawdown_pct" in result["backtest"]


def test_short_history_rejected():
    with pytest.raises(ValueError):
        calculate_indicators(candles(20))


def test_fee_validation():
    with pytest.raises(ValueError):
        run_trend_backtest(candles(), fee_bps=999)
