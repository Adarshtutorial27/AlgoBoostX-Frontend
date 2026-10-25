"""StrategyRun ORM model for tracking live and simulated execution sessions."""

from datetime import datetime, timezone
import uuid
from sqlalchemy import Column, Integer, String, DateTime, Text
from app.database import Base


class StrategyRun(Base):
    __tablename__ = "strategy_runs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    run_id = Column(String(64), unique=True, index=True, default=lambda: f"run_{uuid.uuid4().hex[:12]}")
    strategy_id = Column(String(64), index=True, nullable=False)
    user_id = Column(String(64), index=True, default="default_user", nullable=False)
    status = Column(String(32), default="ACTIVE", index=True)  # ACTIVE, STOPPED, ERROR
    instrument = Column(String(32), default="BTCUSD", nullable=False)
    timeframe = Column(String(16), default="5m", nullable=False)
    config_snapshot = Column(Text, nullable=True)
    started_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    stopped_at = Column(DateTime, nullable=True)
    total_signals = Column(Integer, default=0)
    total_orders = Column(Integer, default=0)

    def to_dict(self):
        return {
            "id": self.id,
            "run_id": self.run_id,
            "strategy_id": self.strategy_id,
            "user_id": self.user_id,
            "status": self.status,
            "instrument": self.instrument,
            "timeframe": self.timeframe,
            "config_snapshot": self.config_snapshot,
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "stopped_at": self.stopped_at.isoformat() if self.stopped_at else None,
            "total_signals": self.total_signals,
            "total_orders": self.total_orders,
        }
