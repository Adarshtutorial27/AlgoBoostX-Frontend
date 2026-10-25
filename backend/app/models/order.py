"""Order ORM model."""

from datetime import datetime, timezone
import uuid
from sqlalchemy import Column, Integer, String, Float, DateTime
from app.database import Base


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    internal_id = Column(String(64), unique=True, index=True, default=lambda: f"ord_{uuid.uuid4().hex[:12]}")
    exchange_order_id = Column(String(64), nullable=True, index=True)
    instrument = Column(String(32), nullable=False, index=True)
    side = Column(String(16), nullable=False)  # buy, sell
    quantity = Column(Float, nullable=False)
    order_type = Column(String(16), default="market")  # market, limit
    price = Column(Float, nullable=True)
    status = Column(
        String(32),
        default="PENDING_SUBMIT",
        index=True
    )  # PENDING_SUBMIT, SUBMITTED, OPEN, PARTIALLY_FILLED, FILLED, REJECTED, CANCELLED, RECONCILING
    error_reason = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            "id": self.id,
            "internal_id": self.internal_id,
            "exchange_order_id": self.exchange_order_id,
            "instrument": self.instrument,
            "side": self.side,
            "quantity": self.quantity,
            "order_type": self.order_type,
            "price": self.price,
            "status": self.status,
            "error_reason": self.error_reason,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
