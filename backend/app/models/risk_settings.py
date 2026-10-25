"""RiskSettings ORM model for persisting operator risk limits across server restarts."""

from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime
from app.database import Base


class RiskSettings(Base):
    __tablename__ = "risk_settings"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(String(64), unique=True, index=True, default="default_user", nullable=False)
    max_order_qty = Column(Float, default=1.0, nullable=False)
    max_position_exposure = Column(Float, default=50000.0, nullable=False)
    max_open_orders = Column(Integer, default=3, nullable=False)
    daily_loss_limit = Column(Float, default=500.0, nullable=False)
    stop_loss_pct = Column(Float, default=0.02, nullable=False)
    take_profit_pct = Column(Float, default=0.04, nullable=False)
    max_slippage_pct = Column(Float, default=0.005, nullable=False)
    stale_data_timeout_seconds = Column(Integer, default=60, nullable=False)
    trading_loop_interval_seconds = Column(Integer, default=10, nullable=False)
    order_timeout_seconds = Column(Integer, default=30, nullable=False)
    emergency_stop = Column(Boolean, default=False, nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "max_order_qty": self.max_order_qty,
            "max_position_exposure": self.max_position_exposure,
            "max_open_orders": self.max_open_orders,
            "daily_loss_limit": self.daily_loss_limit,
            "stop_loss_pct": self.stop_loss_pct,
            "take_profit_pct": self.take_profit_pct,
            "max_slippage_pct": self.max_slippage_pct,
            "stale_data_timeout_seconds": self.stale_data_timeout_seconds,
            "trading_loop_interval_seconds": self.trading_loop_interval_seconds,
            "order_timeout_seconds": self.order_timeout_seconds,
            "emergency_stop": self.emergency_stop,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
