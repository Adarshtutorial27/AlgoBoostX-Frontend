"""System Events and audit trail endpoints."""

from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.event import SystemEvent
from app.schemas.event import SystemEventResponse

router = APIRouter(prefix="/api/v1/events", tags=["System Events"])


@router.get("", response_model=List[SystemEventResponse])
def get_events(
    category: Optional[str] = Query(default=None),
    severity: Optional[str] = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    """Retrieves operational system audit logs and critical events."""
    query = db.query(SystemEvent)
    if category:
        query = query.filter(SystemEvent.category == category.upper())
    if severity:
        query = query.filter(SystemEvent.severity == severity.upper())

    events = query.order_by(SystemEvent.id.desc()).limit(limit).all()
    return events
