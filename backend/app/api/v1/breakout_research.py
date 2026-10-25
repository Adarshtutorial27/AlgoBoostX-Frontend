"""Read-only monthly research for the breakout-and-retest strategy."""
from datetime import datetime, timezone
from typing import Any
import httpx
import pandas as pd
from fastapi import APIRouter, HTTPException, Query

router = APIRouter(prefix="/api/v1/research/breakout-retest", tags=["Breakout Retest Research"])
BINANCE_KLINES_URL = "https://api.binance.com/api/v3/klines"


async def fetch_daily_candles(symbol: str, limit: int = 45) -> list[dict[str, Any]]:
    """Fetch real Binance spot daily candles; never substitutes simulated data."""
    params = {"symbol": symbol, "interval": "1d", "limit": limit}
    async with httpx.AsyncClient(timeout=12.0) as client:
        response = await client.get(BINANCE_KLINES_URL, params=params)
        response.raise_for_status()
        raw = response.json()
    rows = []
    now_ms = int(datetime.now(timezone.utc).timestamp() * 1000)
    for candle in raw:
        if len(candle) < 8 or int(candle[6]) >= now_ms:
            continue  # Exclude currently forming daily candle.
        rows.append({
            "time": int(candle[0] // 1000),
            "open": float(candle[1]), "high": float(candle[2]),
            "low": float(candle[3]), "close": float(candle[4]),
            "volume": float(candle[5]), "close_time": int(candle[6] // 1000),
        })
    return rows


def analyze_monthly_candles(candles: list[dict[str, Any]], symbol: str) -> dict[str, Any]:
    if len(candles) < 25:
        raise ValueError(f"At least 25 complete daily candles required; received {len(candles)}")
    df = pd.DataFrame(candles).sort_values("time").drop_duplicates("time").reset_index(drop=True)
    if not {"open", "high", "low", "close", "volume", "time"}.issubset(df.columns):
        raise ValueError("OHLCV fields are missing")
    if (df[["open", "high", "low", "close", "volume"]] <= 0).any().any():
        raise ValueError("OHLCV values must be positive")
    if (df["high"] < df[["open", "close", "low"]].max(axis=1)).any() or (df["low"] > df[["open", "close", "high"]].min(axis=1)).any():
        raise ValueError("Invalid candle high/low range")

    # Analyze latest 30 completed candles. Extra rows warm up rolling levels.
    df["prior_high"] = df["high"].rolling(20).max().shift(1)
    df["prior_low"] = df["low"].rolling(20).min().shift(1)
    df["sma7"] = df["close"].rolling(7).mean()
    df["sma30"] = df["close"].rolling(30).mean()
    delta = df["close"].diff()
    gain = delta.clip(lower=0).ewm(alpha=1/14, adjust=False, min_periods=14).mean()
    loss = (-delta.clip(upper=0)).ewm(alpha=1/14, adjust=False, min_periods=14).mean()
    df["rsi14"] = 100 - 100 / (1 + gain / loss.replace(0, float("nan")))
    df["daily_return_pct"] = df["close"].pct_change() * 100
    df["drawdown_pct"] = (df["close"] / df["close"].cummax() - 1) * 100

    # Conservative signal count: breakout on previous candle, then retest
    # level and close on breakout side on the next completed candle.
    bullish = bearish = 0
    for i in range(21, len(df)):
        prev, cur = df.iloc[i-1], df.iloc[i]
        if pd.notna(prev["prior_high"]) and pd.notna(cur["prior_high"]):
            if prev["close"] > prev["prior_high"] and cur["low"] <= prev["prior_high"] * 1.003 and cur["close"] > prev["prior_high"]:
                bullish += 1
        if pd.notna(prev["prior_low"]) and pd.notna(cur["prior_low"]):
            if prev["close"] < prev["prior_low"] and cur["high"] >= prev["prior_low"] * 0.997 and cur["close"] < prev["prior_low"]:
                bearish += 1

    period = df.tail(30).copy()
    first_close, last_close = float(period.iloc[0]["close"]), float(period.iloc[-1]["close"])
    change_pct = (last_close / first_close - 1) * 100
    latest = period.iloc[-1]
    return {
        "symbol": symbol, "provider": "Binance Spot public API",
        "retrieved_at": datetime.now(timezone.utc).isoformat(),
        "period": {"completed_daily_candles": int(len(period)),
                   "start_utc": datetime.fromtimestamp(int(period.iloc[0]["time"]), timezone.utc).isoformat(),
                   "end_utc": datetime.fromtimestamp(int(period.iloc[-1]["time"]), timezone.utc).isoformat()},
        "summary": {
            "first_close": first_close, "last_close": last_close,
            "price_change_pct": round(change_pct, 4),
            "max_drawdown_pct": round(float(period["drawdown_pct"].min()), 4),
            "daily_volatility_pct": round(float(period["daily_return_pct"].std()), 4) if period["daily_return_pct"].notna().sum() > 1 else None,
            "sma7": round(float(latest["sma7"]), 8) if pd.notna(latest["sma7"]) else None,
            "sma30": round(float(latest["sma30"]), 8) if pd.notna(latest["sma30"]) else None,
            "rsi14": round(float(latest["rsi14"]), 4) if pd.notna(latest["rsi14"]) else None,
            "bullish_breakout_retests": bullish, "bearish_breakdown_retests": bearish,
            "trend": "bullish" if pd.notna(latest["sma7"]) and pd.notna(latest["sma30"]) and latest["sma7"] > latest["sma30"] else ("bearish" if pd.notna(latest["sma7"]) and pd.notna(latest["sma30"]) and latest["sma7"] < latest["sma30"] else "neutral"),
        },
        "candles": [
            {"time": int(r.time), "open": float(r.open), "high": float(r.high),
             "low": float(r.low), "close": float(r.close), "volume": float(r.volume),
             "daily_return_pct": round(float(r.daily_return_pct), 5) if pd.notna(r.daily_return_pct) else None}
            for r in period.itertuples()
        ],
        "notice": "Historical research only. Signals are not forecasts or guaranteed profitable recommendations; no orders are placed.",
    }


@router.get("/monthly")
async def monthly_research(symbol: str = Query(default="BTCUSDT", pattern="^(BTCUSDT|ETHUSDT)$")):
    try:
        candles = await fetch_daily_candles(symbol)
        return analyze_monthly_candles(candles, symbol)
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail=f"Market-data provider request failed: {type(exc).__name__}") from exc
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.get("/health")
def research_health():
    return {"status": "ok", "strategy": "breakout_retest", "mode": "read-only"}
