"""Risk management status and controls endpoint."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.config import settings
from app.core.state import runtime_state
from app.database import get_db
from app.models.order import Order
from app.models.position import Position

router = APIRouter(prefix="/api/v1/risk", tags=["Risk Management"])


@router.get("/status")
def get_risk_status(db: Session = Depends(get_db)):
    """Returns active risk management limits and real-time live exposure metrics."""
    open_orders_count = db.query(Order).filter(
        Order.status.in_(["PENDING_SUBMIT", "SUBMITTED", "OPEN", "PARTIALLY_FILLED", "RECONCILING"])
    ).count()

    positions = db.query(Position).all()
    current_exposure = sum(abs(p.size) for p in positions)

    return {
        "emergency_stop": runtime_state.emergency_stop,
        "emergency_stop_reason": runtime_state.emergency_stop_reason,
        "limits": {
            "max_order_qty": settings.MAX_ORDER_QTY,
            "max_position_exposure": settings.MAX_POSITION_EXPOSURE,
            "max_open_orders": settings.MAX_OPEN_ORDERS,
            "daily_loss_limit": settings.DAILY_LOSS_LIMIT,
            "stop_loss_pct": settings.STOP_LOSS_PCT,
            "take_profit_pct": settings.TAKE_PROFIT_PCT,
        },
        "live_metrics": {
            "current_exposure": round(current_exposure, 4),
            "open_orders_count": open_orders_count,
            "daily_realized_pnl": round(runtime_state.daily_realized_pnl, 2),
            "loss_limit_breached": runtime_state.daily_realized_pnl <= -settings.DAILY_LOSS_LIMIT,
            "signals_risk_approved": runtime_state.metrics.get("signals_risk_approved", 0),
            "signals_risk_rejected": runtime_state.metrics.get("signals_risk_rejected", 0),
        },
    }
