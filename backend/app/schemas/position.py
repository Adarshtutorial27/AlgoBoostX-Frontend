"""Pydantic schemas for Positions."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class PositionBase(BaseModel):
    instrument: str
    size: float
    entry_price: float
    mark_price: float
    unrealized_pnl: float
    realized_pnl: float
    liquidation_price: Optional[float] = None


class PositionResponse(PositionBase):
    id: int
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)
