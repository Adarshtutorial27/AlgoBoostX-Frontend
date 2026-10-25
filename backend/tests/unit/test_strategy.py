"""Unit tests for Strategy Engine and EMA Crossover calculations."""

import pandas as pd
import pytest
from app.services.strategy_engine import StrategyEngine, StrategySignal


def create_candle_df(prices, start_time=1700000000, step=300):
    """Utility to generate a DataFrame of OHLCV candles from a list of close prices."""
    records = []
    for i, p in enumerate(prices):
        records.append({
            "time": start_time + (i * step),
            "open": p - 5.0,
            "high": p + 10.0,
            "low": p - 10.0,
            "close": float(p),
            "volume": 10.0,
        })
    return pd.DataFrame(records)


def test_ema_crossover_buy_signal():
    """Validates that a Golden Cross (fast EMA crossing above slow EMA) generates BUY signal."""
    engine = StrategyEngine(fast_period=3, slow_period=6)

    # Downtrend followed by upward reversal where crossover occurs at the final candle
    prices = [100.0, 95.0, 90.0, 85.0, 80.0, 75.0, 70.0, 85.0, 105.0]
    df = create_candle_df(prices)

    signal = engine.evaluate(df, instrument="BTCUSD")
    assert signal is not None
    assert isinstance(signal, StrategySignal)
    assert signal.signal_type == "BUY"
    assert signal.fast_ema > signal.slow_ema
    assert signal.instrument == "BTCUSD"


def test_ema_crossover_sell_signal():
    """Validates that a Death Cross (fast EMA crossing below slow EMA) generates SELL signal."""
    engine = StrategyEngine(fast_period=3, slow_period=6)

    # Uptrend followed by downward drop where crossover occurs at the final candle
    prices = [70.0, 75.0, 80.0, 85.0, 90.0, 95.0, 100.0, 90.0, 75.0]
    df = create_candle_df(prices)

    signal = engine.evaluate(df, instrument="BTCUSD")
    assert signal is not None
    assert signal.signal_type == "SELL"
    assert signal.fast_ema < signal.slow_ema


def test_ema_no_crossover_hold():
    """Validates that consistent trend without crossover generates HOLD signal."""
    engine = StrategyEngine(fast_period=3, slow_period=6)

    # Steady upward trend with no cross
    prices = [100.0, 105.0, 110.0, 115.0, 120.0, 125.0, 130.0, 135.0, 140.0]
    df = create_candle_df(prices)

    signal = engine.evaluate(df, instrument="BTCUSD")
    assert signal is not None
    assert signal.signal_type == "HOLD"


def test_insufficient_candles_returns_none():
    """Validates that evaluate returns None if candles count is below minimum required window."""
    engine = StrategyEngine(fast_period=9, slow_period=21)
    df = create_candle_df([100.0, 102.0, 104.0])  # only 3 candles

    signal = engine.evaluate(df, instrument="BTCUSD")
    assert signal is None
