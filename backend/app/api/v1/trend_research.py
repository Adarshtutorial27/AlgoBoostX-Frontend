"""Read-only monthly crypto research endpoints; never places exchange orders."""
from fastapi import APIRouter, HTTPException, Query
from app.services.monthly_trend_research import (
    fetch_monthly_candles, calculate_indicators, run_trend_backtest, normalize_symbol
)

router = APIRouter(prefix="/api/v1/research", tags=["Monthly Trend Research"])


@router.get("/monthly")
async def monthly_research(
    symbol: str = Query("BTCUSD", description="BTCUSD, BTCUSDT, ETHUSD, or ETHUSDT"),
    fee_bps: float = Query(10.0, ge=0, le=500),
    slippage_bps: float = Query(5.0, ge=0, le=500),
):
    """Research the latest 30 complete daily candles and backtest an SMA trend strategy."""
    try:
        exchange_symbol = normalize_symbol(symbol)
        df = await fetch_monthly_candles(exchange_symbol)
        indicators = calculate_indicators(df).tail(30).reset_index(drop=True)
        result = run_trend_backtest(df, fee_bps=fee_bps, slippage_bps=slippage_bps)
        candles = []
        for _, row in indicators.iterrows():
            candles.append({
                "timestamp": row["timestamp"].isoformat(),
                "open": float(row["open"]), "high": float(row["high"]),
                "low": float(row["low"]), "close": float(row["close"]),
                "volume": float(row["volume"]),
                "daily_return_pct": None if row["daily_return_pct"] != row["daily_return_pct"] else float(row["daily_return_pct"]),
                "sma_7": None if row["sma_7"] != row["sma_7"] else float(row["sma_7"]),
                "sma_30": None if row["sma_30"] != row["sma_30"] else float(row["sma_30"]),
                "rsi_14": None if row["rsi_14"] != row["rsi_14"] else float(row["rsi_14"]),
            })
        return {
            "symbol": exchange_symbol,
            "provider": "Binance public market-data API",
            "retrieved_at_utc": __import__("datetime").datetime.now(__import__("datetime").timezone.utc).isoformat(),
            "data_scope": "latest 30 complete daily candles",
            "result": result,
            "candles": candles,
            "disclaimer": "Research and paper-trading output only; not financial advice. No orders are placed."
        }
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Unable to retrieve or analyze market data: {type(exc).__name__}") from exc


@router.get("/monthly/health")
def monthly_research_health():
    return {"status": "available", "mode": "read-only research", "live_orders_enabled": False}
