"""Emergency Stop switches and fail-safe triggers."""

from fastapi import APIRouter, Depends, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.core.state import runtime_state
from app.core.logger import logger
from app.database import get_db
from app.models.event import SystemEvent
from app.services.trading_loop import trading_loop

router = APIRouter(prefix="/api/v1", tags=["Emergency Controls"])


class EmergencyStopRequest(BaseModel):
    reason: str = "Operator manual emergency stop trigger"


@router.post("/emergency-stop", status_code=status.HTTP_202_ACCEPTED)
def trigger_emergency_stop(
    req: EmergencyStopRequest = EmergencyStopRequest(),
    db: Session = Depends(get_db),
):
    """Immediately halts automated order execution and blocks all new orders.

    Fails safely without requiring the dashboard to be active.
    """
    logger.critical(f"EMERGENCY STOP TRIGGERED: {req.reason}")
    runtime_state.trigger_emergency_stop(req.reason)
    trading_loop.stop()

    event = SystemEvent(
        category="EMERGENCY",
        severity="CRITICAL",
        message=f"EMERGENCY STOP ACTIVATED: {req.reason}",
    )
    db.add(event)
    db.commit()

    return {
        "success": True,
        "emergency_stop": True,
        "message": f"Emergency stop activated. All order execution disabled.",
        "reason": req.reason,
        "timestamp": runtime_state.emergency_stop_time,
    }


@router.post("/emergency-reset")
def reset_emergency_stop(db: Session = Depends(get_db)):
    """Resets the emergency stop flag after operator inspection and resolution."""
    logger.info("Emergency stop switch reset by operator.")
    runtime_state.reset_emergency_stop()

    event = SystemEvent(
        category="EMERGENCY",
        severity="INFO",
        message="Emergency stop switch was reset by operator.",
    )
    db.add(event)
    db.commit()

    return {
        "success": True,
        "emergency_stop": False,
        "message": "Emergency stop reset. System ready for execution.",
    }
