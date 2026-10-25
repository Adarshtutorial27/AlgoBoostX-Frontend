"""Positions query and tracking endpoints."""

from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.position import Position
from app.schemas.position import PositionResponse
from app.services.position_manager import position_manager

router = APIRouter(prefix="/api/v1/positions", tags=["Positions"])


@router.get("", response_model=List[PositionResponse])
async def get_positions(db: Session = Depends(get_db)):
    """Retrieves current open positions, entry prices, mark prices, and P&L."""
    # Synchronize with exchange on demand
    await position_manager.synchronize_positions(db)
    positions = db.query(Position).all()
    return positions
