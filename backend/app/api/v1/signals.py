"""Signals query endpoints."""

from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.signal import Signal
from app.schemas.signal import SignalResponse

router = APIRouter(prefix="/api/v1/signals", tags=["Signals"])


@router.get("", response_model=List[SignalResponse])
def get_signals(
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """Retrieves chronological history of generated trading signals."""
    signals = db.query(Signal).order_by(Signal.id.desc()).limit(limit).all()
    return signals
