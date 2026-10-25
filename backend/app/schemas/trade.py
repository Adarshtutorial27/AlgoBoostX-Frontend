"""Pydantic schemas for Trades."""

from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class TradeBase(BaseModel):
    order_id: str
    instrument: str
    side: str
    fill_price: float
    fill_quantity: float
    fees: float = 0.0
    realized_pnl: float = 0.0


class TradeCreate(TradeBase):
    pass


class TradeResponse(TradeBase):
    id: int
    trade_id: str
    timestamp: datetime
    model_config = ConfigDict(from_attributes=True)
