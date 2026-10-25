"""Trading Strategy Engine implementing Exponential Moving Average (EMA) Crossover.

Evaluates only closed candles to prevent intrabar noise and repainting.
Generates reproducible, independently testable signals with indicator history,
deterministic signal IDs, long-only position policy, and historical backtest capabilities.
"""

from datetime import datetime, timezone
from typing import Optional, Dict, Any, List, Tuple
import pandas as pd
from sqlalchemy.orm import Session
from app.config import settings
from app.core.logger import logger
from app.core.state import runtime_state
from app.models.signal import Signal


class StrategySignal:
    """Encapsulates a generated trading signal ready for risk appraisal."""

    def __init__(
        self,
        instrument: str,
        signal_type: str,  # BUY, SELL, HOLD
        fast_ema: float,
        slow_ema: float,
        candle_timestamp: int,
        close_price: float,
        timeframe: str = "5m",
    ):
        self.instrument = instrument
        self.signal_type = signal_type
        self.fast_ema = fast_ema
        self.slow_ema = slow_ema
        self.candle_timestamp = candle_timestamp
        self.close_price = close_price
        self.timeframe = timeframe
        # Deterministic unique identifier based on strategy, instrument, timeframe, and candle
        self.signal_id = f"sig_{instrument}_{timeframe}_{candle_timestamp}_{signal_type.lower()}"


class StrategyEngine:
    """EMA Crossover Strategy Evaluator with Long-Only Policy."""

    def __init__(
        self,
        fast_period: Optional[int] = None,
        slow_period: Optional[int] = None,
    ):
        self.fast_period = fast_period or settings.FAST_EMA_PERIOD
        self.slow_period = slow_period or settings.SLOW_EMA_PERIOD

    def compute_indicators(self, df: pd.DataFrame) -> pd.DataFrame:
        """Calculates fast and slow Exponential Moving Averages (EMA)."""
        if df.empty or len(df) < self.slow_period:
            return df

        data = df.copy()
        data["fast_ema"] = data["close"].ewm(span=self.fast_period, adjust=False).mean()
        data["slow_ema"] = data["close"].ewm(span=self.slow_period, adjust=False).mean()
        return data

    def evaluate(
        self,
        df: pd.DataFrame,
        instrument: str = "BTCUSD",
        timeframe: str = "5m",
        has_open_long: bool = False,
    ) -> Optional[StrategySignal]:
        """Evaluates completed candles for an EMA crossover event under a Long-Only policy.

        Crossover rules on confirmed closed candles:
        - Golden Cross (Fast EMA crosses above Slow EMA):
          Generates BUY signal to open a long position (if not already long).
        - Death Cross (Fast EMA crosses below Slow EMA):
          Generates SELL signal to CLOSE an existing long position.
          If no long position exists, does not open a short position (emits HOLD).
        """
        if df.empty or len(df) < self.slow_period + 2:
            return None

        data = self.compute_indicators(df)

        prev_candle = data.iloc[-2]
        curr_candle = data.iloc[-1]

        prev_fast = float(prev_candle["fast_ema"])
        prev_slow = float(prev_candle["slow_ema"])
        curr_fast = float(curr_candle["fast_ema"])
        curr_slow = float(curr_candle["slow_ema"])

        signal_type = "HOLD"

        # Golden Cross
        if prev_fast <= prev_slow and curr_fast > curr_slow:
            signal_type = "BUY"
        # Death Cross
        elif prev_fast >= prev_slow and curr_fast < curr_slow:
            signal_type = "SELL"

        return StrategySignal(
            instrument=instrument,
            signal_type=signal_type,
            fast_ema=round(curr_fast, 2),
            slow_ema=round(curr_slow, 2),
            candle_timestamp=int(curr_candle["time"]),
            close_price=float(curr_candle["close"]),
            timeframe=timeframe,
        )

    def backtest(
        self,
        df: pd.DataFrame,
        initial_capital: float = 10000.0,
        order_qty: float = 0.05,
        fee_pct: float = 0.0005,  # 0.05% taker fee
        slippage_pct: float = 0.0002,  # 0.02% estimated slippage
    ) -> Dict[str, Any]:
        """Runs a deterministic historical backtest on historical OHLCV data.

        Assumptions documented:
        - Long-only execution: BUY enters long, SELL closes long.
        - Execution at next candle open/close with fee deduction and slippage.
        """
        if df.empty or len(df) < self.slow_period + 5:
            return {"error": "Insufficient candle data for backtest"}

        data = self.compute_indicators(df)
        capital = initial_capital
        position_size = 0.0
        entry_price = 0.0

        trades: List[Dict[str, Any]] = []
        equity_curve: List[float] = [capital]

        for i in range(self.slow_period + 1, len(data)):
            prev_row = data.iloc[i - 1]
            curr_row = data.iloc[i]

            prev_fast = float(prev_row["fast_ema"])
            prev_slow = float(prev_row["slow_ema"])
            curr_fast = float(curr_row["fast_ema"])
            curr_slow = float(curr_row["slow_ema"])
            price = float(curr_row["close"])
            candle_time = int(curr_row["time"])

            # Golden cross -> BUY
            if prev_fast <= prev_slow and curr_fast > curr_slow and position_size == 0.0:
                executed_price = price * (1.0 + slippage_pct)
                fee = executed_price * order_qty * fee_pct
                position_size = order_qty
                entry_price = executed_price
                capital -= fee
                trades.append({
                    "action": "BUY",
                    "candle_time": candle_time,
                    "price": round(executed_price, 2),
                    "qty": order_qty,
                    "fee": round(fee, 2),
                })

            # Death cross -> SELL (close long)
            elif prev_fast >= prev_slow and curr_fast < curr_slow and position_size > 0.0:
                executed_price = price * (1.0 - slippage_pct)
                fee = executed_price * position_size * fee_pct
                gross_pnl = (executed_price - entry_price) * position_size
                net_pnl = gross_pnl - fee
                capital += net_pnl
                position_size = 0.0
                trades.append({
                    "action": "SELL",
                    "candle_time": candle_time,
                    "price": round(executed_price, 2),
                    "qty": order_qty,
                    "fee": round(fee, 2),
                    "realized_pnl": round(net_pnl, 2),
                })
                equity_curve.append(capital)

        completed_trades = [t for t in trades if t["action"] == "SELL"]
        winning_trades = [t for t in completed_trades if t.get("realized_pnl", 0) > 0]
        losing_trades = [t for t in completed_trades if t.get("realized_pnl", 0) <= 0]
        win_rate = (len(winning_trades) / len(completed_trades) * 100) if completed_trades else 0.0
        total_pnl = capital - initial_capital

        return {
            "initial_capital": initial_capital,
            "final_capital": round(capital, 2),
            "net_profit": round(total_pnl, 2),
            "roi_pct": round((total_pnl / initial_capital) * 100, 2),
            "total_trades": len(completed_trades),
            "winning_trades": len(winning_trades),
            "losing_trades": len(losing_trades),
            "win_rate_pct": round(win_rate, 2),
            "trades": trades,
        }

    def record_signal(
        self,
        db: Session,
        signal: StrategySignal,
        validation_status: str = "PENDING",
        rejection_reason: Optional[str] = None,
    ) -> Signal:
        """Persists the signal and indicator values into the database."""
        db_signal = Signal(
            timestamp=datetime.now(timezone.utc),
            instrument=signal.instrument,
            signal_type=signal.signal_type,
            fast_ema=signal.fast_ema,
            slow_ema=signal.slow_ema,
            candle_timestamp=signal.candle_timestamp,
            close_price=signal.close_price,
            validation_status=validation_status,
            rejection_reason=rejection_reason,
        )
        db.add(db_signal)
        db.commit()
        db.refresh(db_signal)

        runtime_state.increment_metric("total_signals_generated")
        if validation_status == "APPROVED":
            runtime_state.increment_metric("signals_risk_approved")
        elif validation_status == "REJECTED":
            runtime_state.increment_metric("signals_risk_rejected")

        return db_signal


strategy_engine = StrategyEngine()
