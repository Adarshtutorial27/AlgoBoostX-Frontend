"""BacktestRun ORM model for storing historical backtest results and performance metrics."""

from datetime import datetime, timezone
import uuid
from sqlalchemy import Column, Integer, String, Float, DateTime, Text
from app.database import Base


class BacktestRun(Base):
    __tablename__ = "backtest_runs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    backtest_id = Column(String(64), unique=True, index=True, default=lambda: f"bk_{uuid.uuid4().hex[:12]}")
    strategy_id = Column(String(64), index=True, nullable=False)
    user_id = Column(String(64), index=True, default="default_user", nullable=False)
    instrument = Column(String(32), default="BTCUSD", nullable=False)
    timeframe = Column(String(16), default="5m", nullable=False)
    initial_capital = Column(Float, default=10000.0, nullable=False)
    final_capital = Column(Float, nullable=False)
    net_profit = Column(Float, nullable=False)
    net_profit_pct = Column(Float, nullable=False)
    max_drawdown = Column(Float, default=0.0)
    max_drawdown_pct = Column(Float, default=0.0)
    total_trades = Column(Integer, default=0)
    winning_trades = Column(Integer, default=0)
    losing_trades = Column(Integer, default=0)
    win_rate_pct = Column(Float, default=0.0)
    profit_factor = Column(Float, default=0.0)
    config_json = Column(Text, nullable=True)
    metrics_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)

    def to_dict(self):
        return {
            "id": self.id,
            "backtest_id": self.backtest_id,
            "strategy_id": self.strategy_id,
            "user_id": self.user_id,
            "instrument": self.instrument,
            "timeframe": self.timeframe,
            "initial_capital": self.initial_capital,
            "final_capital": self.final_capital,
            "net_profit": self.net_profit,
            "net_profit_pct": self.net_profit_pct,
            "max_drawdown": self.max_drawdown,
            "max_drawdown_pct": self.max_drawdown_pct,
            "total_trades": self.total_trades,
            "winning_trades": self.winning_trades,
            "losing_trades": self.losing_trades,
            "win_rate_pct": self.win_rate_pct,
            "profit_factor": self.profit_factor,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
