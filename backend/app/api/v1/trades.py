"""Trades query and performance tracking endpoints."""

from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.trade import Trade
from app.schemas.trade import TradeResponse
from app.core.state import runtime_state

router = APIRouter(prefix="/api/v1/trades", tags=["Trades"])


@router.get("", response_model=List[TradeResponse])
def get_trades(
    limit: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    """Retrieves completed trade history."""
    trades = db.query(Trade).order_by(Trade.id.desc()).limit(limit).all()
    return trades


@router.get("/performance")
def get_performance(db: Session = Depends(get_db)):
    """Computes detailed performance analytics from completed trades."""
    trades = db.query(Trade).all()
    total_trades = len(trades)
    winning_trades = sum(1 for t in trades if t.realized_pnl > 0)
    losing_trades = sum(1 for t in trades if t.realized_pnl < 0)
    total_realized_pnl = sum(t.realized_pnl for t in trades)
    total_fees = sum(t.fees for t in trades)

    win_rate = (winning_trades / total_trades * 100) if total_trades > 0 else 0.0

    return {
        "total_trades": total_trades,
        "winning_trades": winning_trades,
        "losing_trades": losing_trades,
        "win_rate_pct": round(win_rate, 2),
        "total_realized_pnl": round(total_realized_pnl, 2),
        "total_fees_paid": round(total_fees, 2),
        "net_pnl": round(total_realized_pnl - total_fees, 2),
        "metrics": runtime_state.metrics,
    }
