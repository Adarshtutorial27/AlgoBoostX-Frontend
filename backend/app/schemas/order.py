"""Pydantic schemas for Orders."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


class OrderBase(BaseModel):
    instrument: str
    side: str = Field(..., description="buy or sell")
    quantity: float = Field(..., gt=0)
    order_type: str = "market"
    price: Optional[float] = None


class OrderCreate(OrderBase):
    pass


class OrderResponse(OrderBase):
    id: int
    internal_id: str
    exchange_order_id: Optional[str] = None
    status: str
    error_reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)
