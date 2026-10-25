"""SystemEvent ORM model."""

from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, Text
from app.database import Base


class SystemEvent(Base):
    __tablename__ = "system_events"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    category = Column(
        String(32),
        nullable=False,
        index=True
    )  # CONNECTIVITY, MARKET_DATA, STRATEGY, RISK, EXECUTION, RECONCILIATION, EMERGENCY, SYSTEM
    severity = Column(String(16), default="INFO", index=True)  # INFO, WARNING, ERROR, CRITICAL
    message = Column(Text, nullable=False)
    order_id = Column(String(64), nullable=True, index=True)
    signal_id = Column(Integer, nullable=True, index=True)
    details = Column(Text, nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "category": self.category,
            "severity": self.severity,
            "message": self.message,
            "order_id": self.order_id,
            "signal_id": self.signal_id,
            "details": self.details,
        }
