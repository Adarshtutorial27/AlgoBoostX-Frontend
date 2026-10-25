"""Pydantic schemas for Trading Signals."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


class SignalBase(BaseModel):
    instrument: str
    signal_type: str = Field(..., description="BUY, SELL, or HOLD")
    fast_ema: float
    slow_ema: float
    candle_timestamp: int
    close_price: float
    validation_status: str = "PENDING"
    rejection_reason: Optional[str] = None


class SignalCreate(SignalBase):
    pass


class SignalResponse(SignalBase):
    id: int
    timestamp: datetime
    model_config = ConfigDict(from_attributes=True)
