"""Top-level /api router aliases aligning with Phase 9 endpoint specifications."""

from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.config import settings
from app.core.state import runtime_state
from app.exchange.client import exchange_client
from app.exchange.manager import get_client_for_account
from app.services.market_data import market_data_service
from app.services.trading_loop import trading_loop
from app.models.signal import Signal
from app.models.order import Order
from app.models.position import Position
from app.models.event import SystemEvent
from app.strategies.loader import load_all_strategies
from app.strategies.registry import StrategyRegistry

router = APIRouter(prefix="/api", tags=["API Endpoints"])


@router.get("/system/status")
async def get_system_status(db: Session = Depends(get_db)):
    """System operational readiness, connection status, and mode."""
    client, account = get_client_for_account(db)
    public_ok = await client.ping_public_connectivity()

    return {
        "app_name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": "testnet",
        "exchange_connected": public_ok,
        "trading_enabled": runtime_state.strategy_active,
        "emergency_stop": runtime_state.emergency_stop,
        "active_account_label": account.label if account else "Default / Sandbox",
        "active_account_key": account.api_key_masked if account else None,
        "daily_loss": runtime_state.daily_realized_pnl,
    }


@router.get("/market/ticker")
async def get_market_ticker(
    symbol: str = Query(default=settings.DEFAULT_INSTRUMENT),
    db: Session = Depends(get_db),
):
    """Retrieves current 24-hr ticker and mark price for the instrument."""
    client, _ = get_client_for_account(db)
    ticker = await client.get_ticker(symbol)
    return ticker


@router.get("/market/candles")
async def get_market_candles(
    symbol: str = Query(default=settings.DEFAULT_INSTRUMENT),
    resolution: str = Query(default=settings.DEFAULT_TIMEFRAME),
    limit: int = Query(default=50, ge=10, le=200),
):
    """Retrieves validated historical OHLCV candles."""
    is_valid, df, msg = await market_data_service.fetch_and_validate_candles(
        symbol=symbol,
        resolution=resolution,
        limit=limit,
    )
    return {
        "symbol": symbol,
        "resolution": resolution,
        "valid": is_valid,
        "message": msg,
        "candles": df.to_dict(orient="records") if not df.empty else [],
    }


@router.get("/strategy/status")
def get_strategy_status():
    """Strategy configuration and execution status."""
    return {
        "strategy": "EMA Crossover (9 / 21)",
        "instrument": settings.DEFAULT_INSTRUMENT,
        "timeframe": settings.DEFAULT_TIMEFRAME,
        "fast_ema_period": settings.FAST_EMA_PERIOD,
        "slow_ema_period": settings.SLOW_EMA_PERIOD,
        "trading_enabled": runtime_state.strategy_active,
        "emergency_stop": runtime_state.emergency_stop,
    }


@router.post("/strategy/evaluate")
async def manual_evaluate():
    """Manually evaluates a strategy cycle and updates indicators."""
    await trading_loop.execute_cycle()
    return {"success": True, "message": "Strategy cycle executed successfully."}


@router.get("/signals")
def get_signals_alias(limit: int = Query(default=20), db: Session = Depends(get_db)):
    return db.query(Signal).order_by(Signal.id.desc()).limit(limit).all()


@router.get("/orders")
def get_orders_alias(limit: int = Query(default=20), db: Session = Depends(get_db)):
    return db.query(Order).order_by(Order.id.desc()).limit(limit).all()


@router.get("/positions")
def get_positions_alias(db: Session = Depends(get_db)):
    return db.query(Position).all()


@router.get("/account/balance")
async def get_balance_alias(db: Session = Depends(get_db)):
    client, _ = get_client_for_account(db)
    balances = await client.get_wallet_balances()
    return {
        "balances": [b.model_dump() for b in balances],
        "total_balance": sum(b.balance for b in balances),
        "available_balance": sum(b.available_balance for b in balances),
    }


@router.post("/trading/enable")
def enable_trading():
    """Explicitly enables automated strategy order execution."""
    if runtime_state.emergency_stop:
        return {"success": False, "message": "Cannot enable trading: Emergency Stop is ACTIVE."}
    trading_loop.start()
    return {"success": True, "trading_enabled": True, "message": "Automated trading enabled."}


@router.post("/trading/disable")
def disable_trading():
    """Disables automated order execution."""
    trading_loop.stop()
    return {"success": True, "trading_enabled": False, "message": "Automated trading disabled."}


@router.post("/trading/kill-switch", status_code=status.HTTP_202_ACCEPTED)
def activate_kill_switch(db: Session = Depends(get_db)):
    """Triggers instant emergency kill switch halting all executions."""
    runtime_state.trigger_emergency_stop("Operator kill switch activated")
    trading_loop.stop()
    event = SystemEvent(
        category="EMERGENCY",
        severity="CRITICAL",
        message="Kill switch triggered: all automated trading disabled immediately.",
    )
    db.add(event)
    db.commit()
    return {"success": True, "emergency_stop": True, "message": "Kill switch activated. All trading halted."}


@router.get("/strategies")
def list_strategies_alias():
    """Alias: list all registered strategies (mirrors /api/v1/strategies)."""
    load_all_strategies()
    return StrategyRegistry.list_strategies()
