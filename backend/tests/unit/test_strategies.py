"""Tests for strategy plugin architecture, EMA crossover, and RSI mean reversion."""
import pandas as pd
import pytest
from app.strategies.base import BaseStrategy, StrategySignalResult
from app.strategies.registry import StrategyRegistry
from app.strategies.ema_crossover import EMACrossoverStrategy
from app.strategies.rsi_mean_reversion import RSIMeanReversionStrategy
from app.strategies.loader import load_all_strategies


def make_price_df(prices, start_time=1700000000, step=300):
    records = []
    for i, p in enumerate(prices):
        records.append({
            "time": start_time + (i * step),
            "open": float(p) - 5,
            "high": float(p) + 10,
            "low": float(p) - 10,
            "close": float(p),
            "volume": 10.0,
        })
    return pd.DataFrame(records)


# --- Registry Tests ---

def test_strategy_registry_lists_both_strategies():
    strategies = load_all_strategies()
    ids = [s["strategy_id"] for s in strategies]
    assert "ema_crossover" in ids
    assert "rsi_mean_reversion" in ids


def test_strategy_registry_get_instance():
    inst = StrategyRegistry.get_instance("ema_crossover")
    assert isinstance(inst, EMACrossoverStrategy)
    assert inst.STRATEGY_ID == "ema_crossover"


def test_strategy_registry_unknown_raises():
    with pytest.raises(KeyError):
        StrategyRegistry.get_instance("nonexistent_strategy")


# --- EMA Crossover Tests ---

def test_ema_invalid_config_raises():
    with pytest.raises(ValueError):
        EMACrossoverStrategy(config={"fast_period": 30, "slow_period": 5})  # fast >= slow


def test_ema_buy_signal():
    strategy = EMACrossoverStrategy(config={"fast_period": 3, "slow_period": 6})
    prices = [100, 95, 90, 85, 80, 75, 70, 85, 105]
    df = make_price_df(prices)
    result = strategy.generate_signal(df, "BTCUSD", "5m", has_open_long=False)
    assert result is not None
    assert result.signal_type == "BUY"
    assert result.strategy_id == "ema_crossover"
    assert "fast_ema" in result.indicators
    assert "slow_ema" in result.indicators
    assert result.signal_id.startswith("sig_ema_crossover_BTCUSD")


def test_ema_sell_signal():
    strategy = EMACrossoverStrategy(config={"fast_period": 3, "slow_period": 6})
    prices = [70, 75, 80, 85, 90, 95, 100, 90, 75]
    df = make_price_df(prices)
    result = strategy.generate_signal(df, "BTCUSD", "5m", has_open_long=True)
    assert result is not None
    assert result.signal_type == "SELL"


def test_ema_no_buy_when_long_open():
    strategy = EMACrossoverStrategy(config={"fast_period": 3, "slow_period": 6})
    prices = [100, 95, 90, 85, 80, 75, 70, 85, 105]
    df = make_price_df(prices)
    result = strategy.generate_signal(df, "BTCUSD", "5m", has_open_long=True)
    assert result is not None
    assert result.signal_type == "HOLD"
    assert "long position already open" in result.reason


def test_ema_insufficient_history():
    strategy = EMACrossoverStrategy()
    df = make_price_df([100, 101, 102])
    result = strategy.generate_signal(df, "BTCUSD", "5m")
    assert result is None


def test_ema_hold_signal():
    strategy = EMACrossoverStrategy(config={"fast_period": 3, "slow_period": 6})
    prices = [100, 105, 110, 115, 120, 125, 130, 135, 140]
    df = make_price_df(prices)
    result = strategy.generate_signal(df, "BTCUSD", "5m")
    assert result is not None
    assert result.signal_type == "HOLD"


# --- RSI Mean Reversion Tests ---

def test_rsi_invalid_config_raises():
    with pytest.raises(ValueError):
        RSIMeanReversionStrategy(config={"oversold_threshold": 60, "overbought_threshold": 50})


def test_rsi_oversold_buy_signal():
    strategy = RSIMeanReversionStrategy(config={
        "rsi_period": 5,
        "oversold_threshold": 35,
        "overbought_threshold": 70,
        "recovery_candles": 1,
    })
    # Steep decline pushes RSI below 35, then next candle rises above 35
    prices = [100, 98, 95, 90, 80, 70, 60, 50, 40, 65]
    df = make_price_df(prices)
    result = strategy.generate_signal(df, "BTCUSD", "5m", has_open_long=False)
    assert result is not None
    assert result.signal_type == "BUY"
    assert "RSI recovered from oversold" in result.reason
    assert "rsi" in result.indicators


def test_rsi_no_entry_when_already_long():
    strategy = RSIMeanReversionStrategy(config={
        "rsi_period": 5,
        "oversold_threshold": 35,
        "overbought_threshold": 70,
    })
    prices = [100, 98, 95, 90, 80, 70, 60, 50, 40, 65]
    df = make_price_df(prices)
    result = strategy.generate_signal(df, "BTCUSD", "5m", has_open_long=True)
    assert result is not None
    assert result.signal_type == "HOLD"


def test_rsi_overbought_sell_signal():
    strategy = RSIMeanReversionStrategy(config={
        "rsi_period": 5,
        "oversold_threshold": 30,
        "overbought_threshold": 65,
    })
    # Sharp rally pushes RSI above 65
    prices = [50, 52, 55, 60, 70, 80, 90, 100, 110, 120]
    df = make_price_df(prices)
    result = strategy.generate_signal(df, "BTCUSD", "5m", has_open_long=True)
    assert result is not None
    assert result.signal_type == "SELL"
    assert "RSI overbought exit" in result.reason


def test_rsi_insufficient_history():
    strategy = RSIMeanReversionStrategy()
    df = make_price_df([100, 101, 102])
    result = strategy.generate_signal(df, "BTCUSD", "5m")
    assert result is None


def test_rsi_indicators_in_result():
    strategy = RSIMeanReversionStrategy(config={"rsi_period": 5})
    prices = list(range(100, 130))
    df = make_price_df(prices)
    df_with_indicators = strategy.compute_indicators(df)
    assert "rsi" in df_with_indicators.columns


def test_rsi_signal_has_correct_schema():
    strategy = RSIMeanReversionStrategy(config={"rsi_period": 5, "oversold_threshold": 40, "overbought_threshold": 60})
    prices = [100]*5 + [80, 75, 70, 65, 60] + [63, 68, 75, 80]
    df = make_price_df(prices)
    result = strategy.generate_signal(df, "ETHUSDT", "5m")
    if result is not None:
        assert isinstance(result, StrategySignalResult)
        assert result.strategy_id == "rsi_mean_reversion"
        assert "rsi" in result.indicators
        assert result.signal_id.startswith("sig_rsi_mean_reversion")
