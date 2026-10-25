"""Centralized in-memory thread-safe runtime state manager.

Tracks dynamic system statuses such as emergency stop, exchange connectivity,
market data validity, strategy execution state, and daily P&L counters.
"""

from datetime import datetime, timezone
import threading
from typing import Dict, Any


class SystemState:
    """Thread-safe singleton tracking runtime flags and real-time operational status."""

    def __init__(self):
        self._lock = threading.RLock()
        self.emergency_stop: bool = False
        self.emergency_stop_reason: str = ""
        self.emergency_stop_time: str = ""

        self.exchange_connected: bool = False
        self.last_exchange_ping: str = ""
        self.exchange_error: str = ""

        self.market_data_valid: bool = False
        self.last_candle_timestamp: int = 0
        self.latest_market_price: float = 0.0

        self.strategy_active: bool = False
        self.strategy_started_at: str = ""

        self.last_reconciliation_time: str = ""
        self.daily_realized_pnl: float = 0.0

        # Performance counters
        self.metrics: Dict[str, Any] = {
            "total_signals_generated": 0,
            "signals_risk_approved": 0,
            "signals_risk_rejected": 0,
            "orders_submitted": 0,
            "orders_filled": 0,
            "orders_rejected": 0,
            "trades_completed": 0,
            "winning_trades": 0,
            "losing_trades": 0,
        }

    def trigger_emergency_stop(self, reason: str = "Operator manual emergency stop"):
        with self._lock:
            self.emergency_stop = True
            self.emergency_stop_reason = reason
            self.emergency_stop_time = datetime.now(timezone.utc).isoformat()
            self.strategy_active = False

    def reset_emergency_stop(self):
        with self._lock:
            self.emergency_stop = False
            self.emergency_stop_reason = ""
            self.emergency_stop_time = ""

    def set_exchange_status(self, connected: bool, error: str = ""):
        with self._lock:
            self.exchange_connected = connected
            self.last_exchange_ping = datetime.now(timezone.utc).isoformat()
            self.exchange_error = error

    def update_market_status(self, valid: bool, price: float = 0.0, candle_ts: int = 0):
        with self._lock:
            self.market_data_valid = valid
            if price > 0:
                self.latest_market_price = price
            if candle_ts > 0:
                self.last_candle_timestamp = candle_ts

    def increment_metric(self, key: str, amount: int = 1):
        with self._lock:
            if key in self.metrics:
                self.metrics[key] += amount

    def add_realized_pnl(self, amount: float):
        with self._lock:
            self.daily_realized_pnl += amount

    def get_snapshot(self) -> Dict[str, Any]:
        with self._lock:
            return {
                "emergency_stop": self.emergency_stop,
                "emergency_stop_reason": self.emergency_stop_reason,
                "emergency_stop_time": self.emergency_stop_time,
                "exchange_connected": self.exchange_connected,
                "last_exchange_ping": self.last_exchange_ping,
                "exchange_error": self.exchange_error,
                "market_data_valid": self.market_data_valid,
                "latest_market_price": self.latest_market_price,
                "last_candle_timestamp": self.last_candle_timestamp,
                "strategy_active": self.strategy_active,
                "strategy_started_at": self.strategy_started_at,
                "last_reconciliation_time": self.last_reconciliation_time,
                "daily_realized_pnl": self.daily_realized_pnl,
                "metrics": dict(self.metrics),
            }


runtime_state = SystemState()
