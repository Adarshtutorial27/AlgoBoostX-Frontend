"""Strategy configuration and execution control endpoints."""

from fastapi import APIRouter
from app.config import settings
from app.core.state import runtime_state
from app.services.trading_loop import trading_loop

router = APIRouter(prefix="/api/v1/strategy", tags=["Strategy"])


@router.get("/status")
def get_strategy_status():
    """Returns current strategy configuration and execution status."""
    return {
        "strategy_name": "EMA Crossover Strategy",
        "instrument": settings.DEFAULT_INSTRUMENT,
        "timeframe": settings.DEFAULT_TIMEFRAME,
        "fast_ema_period": settings.FAST_EMA_PERIOD,
        "slow_ema_period": settings.SLOW_EMA_PERIOD,
        "active": runtime_state.strategy_active,
        "started_at": runtime_state.strategy_started_at,
        "emergency_stop_active": runtime_state.emergency_stop,
    }


@router.post("/start")
async def start_strategy():
    """Starts autonomous strategy evaluation and order execution loop."""
    if runtime_state.emergency_stop:
        return {
            "success": False,
            "message": "Cannot start strategy while Emergency Stop is ACTIVE. Reset emergency stop first.",
            "active": False,
        }

    trading_loop.start()
    return {
        "success": True,
        "message": "Autonomous strategy evaluation started",
        "active": True,
    }


@router.post("/stop")
async def stop_strategy():
    """Stops new strategy signal evaluation."""
    trading_loop.stop()
    return {
        "success": True,
        "message": "Strategy evaluation stopped",
        "active": False,
    }
