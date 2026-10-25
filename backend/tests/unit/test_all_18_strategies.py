"""Comprehensive Verification Suite for all 18 Registered Strategies.

Validates that every single strategy in the catalogue:
1. Is successfully discovered and loaded by StrategyRegistry
2. Belongs to one of the 4 defined categories (Day, 1 Month, 3 Months, 1 Year)
3. Computes mathematical indicators without errors on standard OHLCV candles
4. Generates valid typed signals (BUY, SELL, HOLD) adhering to StrategySignalResult
"""

import pytest
import pandas as pd
import numpy as np

from app.strategies.loader import load_all_strategies
from app.strategies.registry import strategy_registry
from app.strategies.base import StrategySignalResult


@pytest.fixture(scope="module")
def sample_candles_df():
    """Generates 250 realistic OHLCV daily/hourly candles for testing."""
    np.random.seed(42)
    n = 250
    timestamps = [1700000000 + i * 3600 for i in range(n)]
    
    # Simulate random walk price
    returns = np.random.normal(0.0005, 0.02, n)
    price = 60000.0 * np.cumprod(1 + returns)
    
    highs = price * (1 + np.abs(np.random.normal(0, 0.005, n)))
    lows = price * (1 - np.abs(np.random.normal(0, 0.005, n)))
    opens = price * (1 + np.random.normal(0, 0.002, n))
    volumes = np.random.uniform(10, 500, n)
    
    df = pd.DataFrame({
        "time": timestamps,
        "open": opens,
        "high": highs,
        "low": lows,
        "close": price,
        "volume": volumes,
    })
    return df


def test_registry_contains_18_genuine_strategies():
    load_all_strategies()
    strategies = strategy_registry.list_strategies()
    assert len(strategies) >= 18, f"Expected at least 18 strategies, found {len(strategies)}"
    
    categories = {s.get("category") for s in strategies}
    assert "Day" in categories
    assert "1 Month" in categories
    assert "3 Months" in categories
    assert "1 Year" in categories


def test_day_strategies_evaluation(sample_candles_df):
    load_all_strategies()
    day_strategy_ids = [
        "ema_trend_day",
        "rsi_oversold_day",
        "bollinger_dip_day",
        "breakout_20_day",
        "macd_trend_day",
        "one_day_reversal_day",
    ]
    for sid in day_strategy_ids:
        inst = strategy_registry.get_instance(sid)
        assert inst is not None, f"Strategy {sid} instance not found"
        assert inst.CATEGORY == "Day"
        
        # Test compute_indicators
        df_ind = inst.compute_indicators(sample_candles_df)
        assert isinstance(df_ind, pd.DataFrame)
        assert not df_ind.empty
        
        # Test signal generation
        sig = inst.generate_signal(sample_candles_df, "BTCUSD", "1D", has_open_long=False)
        if sig is not None:
            assert isinstance(sig, StrategySignalResult)
            assert sig.signal_type in ("BUY", "SELL", "HOLD")
            assert sig.strategy_id == sid


def test_month_strategies_evaluation(sample_candles_df):
    load_all_strategies()
    month_strategy_ids = [
        "trend_following",
        "liquidity_sweep",
        "breakout_retest",
        "mean_reversion",
        "momentum",
        "volume_confirmed_vwap",
    ]
    for sid in month_strategy_ids:
        inst = strategy_registry.get_instance(sid)
        assert inst is not None, f"Strategy {sid} instance not found"
        
        df_ind = inst.compute_indicators(sample_candles_df)
        assert isinstance(df_ind, pd.DataFrame)
        
        sig = inst.generate_signal(sample_candles_df, "BTCUSD", "1h", has_open_long=False)
        if sig is not None:
            assert isinstance(sig, StrategySignalResult)
            assert sig.signal_type in ("BUY", "SELL", "HOLD")


def test_three_month_supertrend_evaluation(sample_candles_df):
    load_all_strategies()
    inst = strategy_registry.get_instance("supertrend_ema_3m")
    assert inst is not None
    assert inst.CATEGORY == "3 Months"
    
    df_ind = inst.compute_indicators(sample_candles_df)
    assert "supertrend" in df_ind.columns
    assert "direction" in df_ind.columns
    assert "ema_200" in df_ind.columns
    
    sig = inst.generate_signal(sample_candles_df, "BTCUSD", "4h", has_open_long=False)
    if sig is not None:
        assert isinstance(sig, StrategySignalResult)
        assert sig.strategy_id == "supertrend_ema_3m"


def test_year_strategies_evaluation(sample_candles_df):
    load_all_strategies()
    year_strategy_ids = [
        "moving_average_1y",
        "momentum_1y",
        "mean_reversion_1y",
        "range_breakout_1y",
        "volatility_targeted_trend_1y",
    ]
    for sid in year_strategy_ids:
        inst = strategy_registry.get_instance(sid)
        assert inst is not None
        assert inst.CATEGORY == "1 Year"
        
        df_ind = inst.compute_indicators(sample_candles_df)
        assert isinstance(df_ind, pd.DataFrame)
        
        sig = inst.generate_signal(sample_candles_df, "BTCUSD", "1d", has_open_long=False)
        if sig is not None:
            assert isinstance(sig, StrategySignalResult)
            assert sig.strategy_id == sid
