"""Market data inspection endpoints."""

from fastapi import APIRouter, Query
from app.config import settings
from app.core.state import runtime_state
from app.services.market_data import market_data_service
from app.services.strategy_engine import strategy_engine

router = APIRouter(prefix="/api/v1/market", tags=["Market Data"])


@router.get("")
async def get_market(
    symbol: str = Query(default=settings.DEFAULT_INSTRUMENT),
    timeframe: str = Query(default=settings.DEFAULT_TIMEFRAME),
    limit: int = Query(default=50, ge=10, le=200),
):
    """Returns historical candles, latest price, and calculated EMA indicators."""
    is_valid, df, msg = await market_data_service.fetch_and_validate_candles(
        symbol=symbol,
        resolution=timeframe,
        limit=limit,
    )

    if not is_valid or df.empty:
        return {
            "symbol": symbol,
            "timeframe": timeframe,
            "valid": False,
            "error": msg,
            "latest_price": runtime_state.latest_market_price,
            "candles": [],
        }

    # Calculate indicators
    df_indicators = strategy_engine.compute_indicators(df)

    latest = df_indicators.iloc[-1]
    return {
        "symbol": symbol,
        "timeframe": timeframe,
        "valid": True,
        "status": msg,
        "latest_price": float(latest["close"]),
        "latest_fast_ema": round(float(latest.get("fast_ema", 0.0)), 2),
        "latest_slow_ema": round(float(latest.get("slow_ema", 0.0)), 2),
        "candle_timestamp": int(latest["time"]),
        "candles_count": len(df_indicators),
        "candles": df_indicators.to_dict(orient="records"),
    }
