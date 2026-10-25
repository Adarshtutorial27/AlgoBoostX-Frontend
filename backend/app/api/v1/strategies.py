"""Strategy management API endpoints for Algo Boost X.

Provides full CRUD and operational control over the strategy plugin registry:
list, get, enable, disable, update config, backtest, and signal history.
"""
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session

from app.database import get_db
from app.strategies.loader import load_all_strategies
from app.strategies.registry import StrategyRegistry
from app.models.signal import Signal
import pandas as pd

router = APIRouter(prefix="/api/v1/strategies", tags=["Strategy Management"])


class BacktestRequest(BaseModel):
    candles: List[Dict[str, Any]]
    initial_capital: float = 10000.0
    fee_pct: float = 0.0005


class ConfigUpdateRequest(BaseModel):
    model_config = ConfigDict(extra="allow")


@router.get("", response_model=List[Dict[str, Any]])
def list_strategies():
    """List all registered strategies with their metadata and status."""
    load_all_strategies()
    return StrategyRegistry.list_strategies()


@router.get("/{strategy_id}", response_model=Dict[str, Any])
def get_strategy(strategy_id: str):
    """Get configuration and status for a specific strategy."""
    load_all_strategies()
    try:
        inst = StrategyRegistry.get_instance(strategy_id)
        return inst.get_metadata()
    except KeyError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Strategy '{strategy_id}' not found",
        )


@router.post("/{strategy_id}/enable")
@router.post("/{strategy_id}/start")
def enable_strategy(strategy_id: str):
    """Enable / start a registered strategy."""
    load_all_strategies()
    try:
        StrategyRegistry.enable_strategy(strategy_id)
        inst = StrategyRegistry.get_instance(strategy_id)
        return {"strategy_id": strategy_id, "enabled": inst.is_enabled, "message": f"Strategy '{strategy_id}' started/enabled."}
    except KeyError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Strategy '{strategy_id}' not found",
        )


@router.post("/{strategy_id}/disable")
@router.post("/{strategy_id}/stop")
def disable_strategy(strategy_id: str):
    """Disable / stop a registered strategy."""
    load_all_strategies()
    try:
        StrategyRegistry.disable_strategy(strategy_id)
        return {"strategy_id": strategy_id, "enabled": False, "message": f"Strategy '{strategy_id}' stopped/disabled."}
    except KeyError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Strategy '{strategy_id}' not found",
        )


@router.put("/{strategy_id}/config")
def update_strategy_config(strategy_id: str, config: Dict[str, Any]):
    """Update and validate strategy configuration parameters."""
    load_all_strategies()
    try:
        # Validate by instantiating with new config (raises ValueError if invalid)
        inst = StrategyRegistry.get_instance(strategy_id, config=config)
        return {
            "strategy_id": strategy_id,
            "config": inst.get_metadata()["config"],
            "message": "Configuration updated successfully.",
        }
    except KeyError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Strategy '{strategy_id}' not found",
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e),
        )


@router.post("/{strategy_id}/backtest")
def run_backtest(strategy_id: str, req: BacktestRequest):
    """Run a historical backtest for the given strategy using provided candles."""
    load_all_strategies()
    try:
        inst = StrategyRegistry.get_instance(strategy_id)
    except KeyError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Strategy '{strategy_id}' not found",
        )

    if not req.candles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No candle data provided for backtest",
        )

    try:
        df = pd.DataFrame(req.candles)
        for col in ["time", "open", "high", "low", "close", "volume"]:
            if col not in df.columns:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Candle data missing required column: '{col}'",
                )
        df = df.sort_values("time").reset_index(drop=True)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid candle data: {e}")

    # Run simple long-only backtest using the strategy's generate_signal
    capital = req.initial_capital
    position_open = False
    entry_price = 0.0
    entry_qty = 0.0
    trades = []
    equity_curve = [capital]

    for i in range(2, len(df)):
        chunk = df.iloc[: i + 1]
        signal = inst.generate_signal(chunk, "BACKTEST", "5m", has_open_long=position_open)
        if signal is None:
            continue

        price = float(df.iloc[i]["close"])

        if signal.signal_type == "BUY" and not position_open:
            fee = price * req.fee_pct
            cost = price + fee
            qty = (capital * 0.95) / cost  # use 95% of capital
            capital -= cost * qty
            entry_price = price
            entry_qty = qty
            position_open = True
            trades.append({"action": "BUY", "price": round(price, 4), "qty": round(qty, 6), "fee": round(fee * qty, 4)})

        elif signal.signal_type == "SELL" and position_open:
            fee = price * req.fee_pct
            gross = (price - entry_price) * entry_qty
            net = gross - fee * entry_qty
            capital += entry_price * entry_qty + net
            position_open = False
            trades.append({
                "action": "SELL",
                "price": round(price, 4),
                "qty": round(entry_qty, 6),
                "realized_pnl": round(net, 4),
            })
            equity_curve.append(capital)

    completed = [t for t in trades if t["action"] == "SELL"]
    wins = [t for t in completed if t.get("realized_pnl", 0) > 0]
    total_pnl = capital - req.initial_capital

    return {
        "strategy_id": strategy_id,
        "initial_capital": req.initial_capital,
        "final_capital": round(capital, 4),
        "net_profit": round(total_pnl, 4),
        "roi_pct": round((total_pnl / req.initial_capital) * 100, 4),
        "total_trades": len(completed),
        "winning_trades": len(wins),
        "losing_trades": len(completed) - len(wins),
        "win_rate_pct": round(len(wins) / len(completed) * 100, 2) if completed else 0.0,
        "trades": trades,
    }


@router.get("/{strategy_id}/signals")
def get_strategy_signals(
    strategy_id: str,
    limit: int = 20,
    db: Session = Depends(get_db),
):
    """Get recent signals generated by this strategy from the database."""
    signals = (
        db.query(Signal)
        .filter(Signal.strategy_id == strategy_id)
        .order_by(Signal.id.desc())
        .limit(limit)
        .all()
    )
    return [s.to_dict() for s in signals]
