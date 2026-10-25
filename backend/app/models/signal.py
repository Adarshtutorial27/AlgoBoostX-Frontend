"""Signal ORM model."""

from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, DateTime
from app.database import Base


class Signal(Base):
    __tablename__ = "signals"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    instrument = Column(String(32), nullable=False, index=True)
    signal_type = Column(String(16), nullable=False)  # BUY, SELL, HOLD
    fast_ema = Column(Float, nullable=False)
    slow_ema = Column(Float, nullable=False)
    candle_timestamp = Column(Integer, nullable=False, index=True)
    close_price = Column(Float, nullable=False)
    validation_status = Column(String(32), default="PENDING")  # APPROVED, REJECTED, PENDING
    rejection_reason = Column(String(255), nullable=True)
    # Strategy plugin fields (nullable for backward compatibility)
    strategy_id = Column(String(64), nullable=True, default="ema_crossover")
    strategy_version = Column(String(16), nullable=True, default="1.0.0")
    signal_reason = Column(String(255), nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "instrument": self.instrument,
            "signal_type": self.signal_type,
            "fast_ema": self.fast_ema,
            "slow_ema": self.slow_ema,
            "candle_timestamp": self.candle_timestamp,
            "close_price": self.close_price,
            "validation_status": self.validation_status,
            "rejection_reason": self.rejection_reason,
            "strategy_id": self.strategy_id,
            "strategy_version": self.strategy_version,
            "signal_reason": self.signal_reason,
        }
