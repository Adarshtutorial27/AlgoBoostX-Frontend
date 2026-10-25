"""Trade ORM model."""

from datetime import datetime, timezone
import uuid
from sqlalchemy import Column, Integer, String, Float, DateTime
from app.database import Base


class Trade(Base):
    __tablename__ = "trades"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    trade_id = Column(String(64), unique=True, index=True, default=lambda: f"trd_{uuid.uuid4().hex[:12]}")
    order_id = Column(String(64), nullable=False, index=True)
    instrument = Column(String(32), nullable=False, index=True)
    side = Column(String(16), nullable=False)  # buy, sell
    fill_price = Column(Float, nullable=False)
    fill_quantity = Column(Float, nullable=False)
    fees = Column(Float, default=0.0)
    realized_pnl = Column(Float, default=0.0)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)

    def to_dict(self):
        return {
            "id": self.id,
            "trade_id": self.trade_id,
            "order_id": self.order_id,
            "instrument": self.instrument,
            "side": self.side,
            "fill_price": self.fill_price,
            "fill_quantity": self.fill_quantity,
            "fees": self.fees,
            "realized_pnl": self.realized_pnl,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
        }
