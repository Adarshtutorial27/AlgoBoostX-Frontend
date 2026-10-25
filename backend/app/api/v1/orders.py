"""Orders query and tracking endpoints."""

from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.order import Order
from app.schemas.order import OrderResponse

router = APIRouter(prefix="/api/v1/orders", tags=["Orders"])


@router.get("", response_model=List[OrderResponse])
def get_orders(
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """Retrieves order history and current execution lifecycle status."""
    orders = db.query(Order).order_by(Order.id.desc()).limit(limit).all()
    return orders
