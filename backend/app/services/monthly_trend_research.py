"""Read-only 30-day crypto market research and trend-following backtest."""
from __future__ import annotations
from datetime import datetime, timezone
from typing import Any
import httpx
import numpy as np
import pandas as pd

BINANCE_KLINES_URL = "https://api.binance.com/api/v3/klines"
SYMBOLS = {"BTCUSD": "BTCUSDT", "BTCUSDT": "BTCUSDT", "ETHUSD": "ETHUSDT", "ETHUSDT": "ETHUSDT"}


def normalize_symbol(symbol: str) -> str:
    try:
        return SYMBOLS[symbol.upper()]
    except (AttributeError, KeyError):
        raise ValueError("Unsupported symbol. Use BTCUSD, BTCUSDT, ETHUSD, or ETHUSDT.")


async def fetch_monthly_candles(symbol: str, client: httpx.AsyncClient | None = None) -> pd.DataFrame:
    """Fetch 60 daily candles: 30-day report window plus warm-up history."""
    exchange_symbol = normalize_symbol(symbol)
    own_client = client is None
    if own_client:
        client = httpx.AsyncClient(timeout=httpx.Timeout(12.0, connect=5.0))
    try:
        response = await client.get(
            BINANCE_KLINES_URL,
            params={"symbol": exchange_symbol, "interval": "1d", "limit": 60},
        )
        response.raise_for_status()
        raw = response.json()
    finally:
        if own_client:
            await client.aclose()
    if not isinstance(raw, list) or not raw:
        raise ValueError("Market data provider returned no candles")
    columns = ["open_time", "open", "high", "low", "close", "volume",
               "close_time", "quote_volume", "trades", "taker_base", "taker_quote", "ignore"]
    df = pd.DataFrame(raw, columns=columns)
    for col in ["open", "high", "low", "close", "volume"]:
        df[col] = pd.to_numeric(df[col], errors="coerce")
    df["timestamp"] = pd.to_datetime(pd.to_numeric(df["open_time"]), unit="ms", utc=True)
    df["close_time"] = pd.to_datetime(pd.to_numeric(df["close_time"]), unit="ms", utc=True)
    df = df.dropna(subset=["timestamp", "open", "high", "low", "close", "volume"])
    df = df[(df[["open", "high", "low", "close"]] > 0).all(axis=1) & (df["volume"] >= 0)]
    df = df[(df["high"] >= df[["open", "close", "low"]].max(axis=1)) &
            (df["low"] <= df[["open", "close", "high"]].min(axis=1))]
    now = pd.Timestamp.now(tz="UTC")
    # Binance's current daily candle is incomplete; exclude it.
    df = df[df["close_time"] < now].sort_values("timestamp").drop_duplicates("timestamp")
    if len(df) < 30:
        raise ValueError(f"Need 30 complete daily candles; provider returned {len(df)}")
    return df.tail(60).reset_index(drop=True)


def calculate_indicators(df: pd.DataFrame) -> pd.DataFrame:
    required = {"timestamp", "open", "high", "low", "close", "volume"}
    if not required.issubset(df.columns):
        raise ValueError(f"Missing candle columns: {sorted(required - set(df.columns))}")
    if len(df) < 30:
        raise ValueError("At least 30 complete daily candles are required")
    out = df.copy().sort_values("timestamp").reset_index(drop=True)
    close, high, low = out["close"], out["high"], out["low"]
    out["daily_return_pct"] = close.pct_change() * 100
    out["sma_7"] = close.rolling(7, min_periods=7).mean()
    out["sma_30"] = close.rolling(30, min_periods=30).mean()
    delta = close.diff()
    gain = delta.clip(lower=0).ewm(alpha=1/14, adjust=False, min_periods=14).mean()
    loss = (-delta.clip(upper=0)).ewm(alpha=1/14, adjust=False, min_periods=14).mean()
    rs = gain / loss.replace(0, np.nan)
    out["rsi_14"] = (100 - 100 / (1 + rs)).where(loss != 0, 100.0)
    prev_close = close.shift(1)
    tr = pd.concat([(high-low), (high-prev_close).abs(), (low-prev_close).abs()], axis=1).max(axis=1)
    out["atr_14"] = tr.ewm(alpha=1/14, adjust=False, min_periods=14).mean()
    out["volatility_14_pct"] = out["daily_return_pct"].rolling(14).std()
    running_peak = close.cummax()
    out["drawdown_pct"] = (close / running_peak - 1) * 100
    out["volume_sma_7"] = out["volume"].rolling(7).mean()
    return out


def run_trend_backtest(df: pd.DataFrame, fee_bps: float = 10.0, slippage_bps: float = 5.0) -> dict[str, Any]:
    """Long-only SMA crossover. Signals formed at close and applied to next close return."""
    if not 0 <= fee_bps <= 500 or not 0 <= slippage_bps <= 500:
        raise ValueError("Fee and slippage must be between 0 and 500 basis points")
    full = calculate_indicators(df)
    # Build positions using warm-up history, then score only the latest 30 candles.
    fast, slow = full["sma_7"], full["sma_30"]
    desired_position = (fast > slow).astype(float).where(fast.notna() & slow.notna(), 0.0)
    full_position = desired_position.shift(1).fillna(0.0)
    full_asset_returns = full["close"].pct_change().fillna(0.0)
    full_turnover = full_position.diff().abs().fillna(full_position.abs())
    cost_rate = (fee_bps + slippage_bps) / 10000.0
    full_strategy_returns = full_position * full_asset_returns - full_turnover * cost_rate
    # Evaluation starts at the latest 30-candle window; include the preceding
    # position/return context, but reset equity at the window boundary.
    start = max(0, len(full) - 30)
    data = full.iloc[start:].reset_index(drop=True)
    position = full_position.iloc[start:].reset_index(drop=True)
    asset_returns = full_asset_returns.iloc[start:].reset_index(drop=True)
    turnover = full_turnover.iloc[start:].reset_index(drop=True)
    strategy_returns = full_strategy_returns.iloc[start:].reset_index(drop=True)
    # The first candle return belongs to a prior close; exclude it from scoring.
    if len(strategy_returns):
        strategy_returns.iloc[0] = 0.0
        asset_returns.iloc[0] = 0.0
    equity = (1 + strategy_returns).cumprod()
    benchmark = (1 + asset_returns).cumprod()
    peak = equity.cummax()
    dd = equity / peak - 1
    changes = position.diff().fillna(position.abs())
    trade_count = int((changes > 0).sum() + (changes < 0).sum())
    start_price, end_price = float(data["close"].iloc[0]), float(data["close"].iloc[-1])
    last = data.iloc[-1]
    if pd.isna(last["sma_7"]) or pd.isna(last["sma_30"]):
        signal, reason = "NEUTRAL", "Insufficient prior history for both moving averages."
    elif last["sma_7"] > last["sma_30"]:
        signal, reason = "BULLISH", "SMA-7 is above SMA-30; trend filter is positive."
    elif last["sma_7"] < last["sma_30"]:
        signal, reason = "BEARISH", "SMA-7 is below SMA-30; trend filter is negative."
    else:
        signal, reason = "NEUTRAL", "Moving averages are equal."
    def pct(value: float) -> float:
        return round(float(value) * 100, 4)
    def safe_float(value):
        return None if pd.isna(value) or not np.isfinite(value) else round(float(value), 6)
    return {
        "period_start_utc": data["timestamp"].iloc[0].isoformat(),
        "period_end_utc": data["timestamp"].iloc[-1].isoformat(),
        "candles": int(len(data)),
        "start_close": round(start_price, 8),
        "end_close": round(end_price, 8),
        "price_change_pct": round((end_price / start_price - 1) * 100, 4),
        "latest_sma_7": safe_float(last["sma_7"]),
        "latest_sma_30": safe_float(last["sma_30"]),
        "latest_rsi_14": safe_float(last["rsi_14"]),
        "latest_atr_14": safe_float(last["atr_14"]),
        "latest_volatility_14_pct": safe_float(last["volatility_14_pct"]),
        "maximum_price_drawdown_pct": round(float(data["drawdown_pct"].min()), 4),
        "signal": signal,
        "signal_reason": reason,
        "backtest": {
            "strategy": "SMA-7/SMA-30 long-only crossover",
            "strategy_return_pct": pct(equity.iloc[-1] - 1),
            "buy_and_hold_return_pct": pct(benchmark.iloc[-1] - 1),
            "max_strategy_drawdown_pct": pct(dd.min()),
            "trade_count": trade_count,
            "fee_bps_per_position_change": fee_bps,
            "slippage_bps_per_position_change": slippage_bps,
            "execution": "Signal at candle close; position applies to next candle return",
            "note": "Short sample; indicator warm-up limits trades. Historical results do not predict future returns."
        }
    }
