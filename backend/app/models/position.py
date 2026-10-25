"""Position ORM model."""

from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, DateTime
from app.database import Base


class Position(Base):
    __tablename__ = "positions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    instrument = Column(String(32), unique=True, nullable=False, index=True)
    size = Column(Float, default=0.0, nullable=False)  # positive for long, negative for short, 0 for flat
    entry_price = Column(Float, default=0.0)
    mark_price = Column(Float, default=0.0)
    unrealized_pnl = Column(Float, default=0.0)
    realized_pnl = Column(Float, default=0.0)
    liquidation_price = Column(Float, nullable=True)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            "id": self.id,
            "instrument": self.instrument,
            "size": self.size,
            "entry_price": self.entry_price,
            "mark_price": self.mark_price,
            "unrealized_pnl": self.unrealized_pnl,
            "realized_pnl": self.realized_pnl,
            "liquidation_price": self.liquidation_price,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
