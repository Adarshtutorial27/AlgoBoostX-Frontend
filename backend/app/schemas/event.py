"""Pydantic schemas for System Events."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class SystemEventBase(BaseModel):
    category: str
    severity: str = "INFO"
    message: str
    order_id: Optional[str] = None
    signal_id: Optional[int] = None
    details: Optional[str] = None


class SystemEventCreate(SystemEventBase):
    pass


class SystemEventResponse(SystemEventBase):
    id: int
    timestamp: datetime
    model_config = ConfigDict(from_attributes=True)
