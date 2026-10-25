"""Risk Management Engine for TokenIQ.

Performs deterministic multi-tier pre-execution validation using Decimal precision.
Enforces limits on order sizes, exposure, duplicate positions, open orders, daily drawdowns,
and validates available account balances and emergency stop switches.
"""

from datetime import datetime, timezone
from decimal import Decimal, ROUND_HALF_UP
from typing import Optional, List
from sqlalchemy.orm import Session
from app.config import settings
from app.core.logger import logger
from app.core.state import runtime_state
from app.models.order import Order
from app.models.position import Position
from app.models.trade import Trade
from app.models.event import SystemEvent
from app.services.strategy_engine import StrategySignal
from app.exchange.models import WalletBalance


class RiskDecision:
    """Represents the outcome of risk validation for a proposed trading signal."""

    def __init__(
        self,
        approved: bool,
        reason: str,
        allowed_quantity: float = 0.0,
        risk_rule: str = "",
    ):
        self.approved = approved
        self.reason = reason
        self.allowed_quantity = allowed_quantity
        self.risk_rule = risk_rule

    def __repr__(self):
        status = "APPROVED" if self.approved else "REJECTED"
        return f"<RiskDecision: {status} (qty={self.allowed_quantity}) - {self.reason}>"


class RiskManagementEngine:
    """Enforces configurable risk controls prior to order execution using Decimal arithmetic."""

    def __init__(self):
        self.max_order_qty = float(settings.MAX_ORDER_QTY)
        self.max_position_exposure = float(settings.MAX_POSITION_EXPOSURE)
        self.max_open_orders = settings.MAX_OPEN_ORDERS
        self.daily_loss_limit = float(settings.DAILY_LOSS_LIMIT)

    def compute_persistent_daily_loss(self, db: Session) -> Decimal:
        """Computes daily realized loss since UTC midnight from persistent database Trade records,
        combined with in-memory state for total safety across restarts.
        """
        start_of_day_utc = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        today_trades = db.query(Trade).filter(Trade.timestamp >= start_of_day_utc).all()

        db_realized = Decimal("0.0")
        for t in today_trades:
            db_realized += Decimal(str(t.realized_pnl))

        runtime_dec = Decimal(str(runtime_state.daily_realized_pnl))
        # Use the more conservative (lower) loss number
        effective_loss = min(db_realized, runtime_dec)
        runtime_state.daily_realized_pnl = float(effective_loss)
        return effective_loss

    def validate_signal(
        self,
        signal: StrategySignal,
        db: Session,
        wallet_balances: Optional[List[WalletBalance]] = None,
    ) -> RiskDecision:
        """Evaluates all risk checks sequentially using Decimal precision.

        Returns RiskDecision. If any check fails, the signal is rejected locally
        and the rejection event is permanently logged.
        """
        # Rule 1: Emergency Stop Switch
        if runtime_state.emergency_stop:
            return self._reject(
                db,
                rule="EMERGENCY_STOP",
                reason=f"Emergency stop is ACTIVE ({runtime_state.emergency_stop_reason})",
                signal=signal,
            )

        # Rule 2: Exchange Connectivity Check
        if not runtime_state.exchange_connected:
            return self._reject(
                db,
                rule="EXCHANGE_DISCONNECTED",
                reason="Exchange connectivity is not healthy or degraded",
                signal=signal,
            )

        # Rule 3: Market Data Freshness Check
        if not runtime_state.market_data_valid:
            return self._reject(
                db,
                rule="STALE_DATA",
                reason="Market data is stale or invalid; execution halted",
                signal=signal,
            )

        # Rule 4: Actionable Signal Check
        if signal.signal_type not in ("BUY", "SELL"):
            return RiskDecision(
                approved=False,
                reason="Signal is HOLD or neutral; no execution required",
                risk_rule="NO_ACTION",
            )

        # Rule 5: Daily Loss Limit Check (Persistent across restarts)
        daily_pnl = self.compute_persistent_daily_loss(db)
        if daily_pnl <= -Decimal(str(self.daily_loss_limit)):
            return self._reject(
                db,
                rule="DAILY_LOSS_LIMIT",
                reason=f"Daily realized loss threshold reached (-${abs(daily_pnl):.2f} <= -${self.daily_loss_limit:.2f})",
                signal=signal,
            )

        # Rule 6: Maximum Open Orders Threshold
        open_orders_count = db.query(Order).filter(
            Order.status.in_(["PENDING_SUBMIT", "SUBMITTED", "OPEN", "PARTIALLY_FILLED", "RECONCILING"])
        ).count()

        if open_orders_count >= self.max_open_orders:
            return self._reject(
                db,
                rule="MAX_OPEN_ORDERS",
                reason=f"Open orders count ({open_orders_count}) reached maximum limit ({self.max_open_orders})",
                signal=signal,
            )

        # Position and Long-Only Policy Check
        existing_pos = db.query(Position).filter(Position.instrument == signal.instrument).first()
        current_pos_size = Decimal(str(existing_pos.size)) if existing_pos else Decimal("0.0")

        # Long-Only Rule: BUY opens long; cannot open if already long
        if signal.signal_type == "BUY":
            if current_pos_size > Decimal("0.0"):
                return self._reject(
                    db,
                    rule="DUPLICATE_POSITION",
                    reason=f"Long position already open for {signal.instrument} (size: {current_pos_size}); duplicate entry prevented",
                    signal=signal,
                )

        # Long-Only Rule: SELL only closes an open long; cannot short if flat
        elif signal.signal_type == "SELL":
            if current_pos_size <= Decimal("0.0"):
                return self._reject(
                    db,
                    rule="LONG_ONLY_POLICY",
                    reason=f"Long-only policy: SELL signal cannot open short when no long position exists (size: {current_pos_size})",
                    signal=signal,
                )

        # Sizing and Exposure
        proposed_qty_dec = Decimal(str(self.max_order_qty))
        if signal.signal_type == "SELL" and current_pos_size > Decimal("0.0"):
            # When closing long, order qty matches position size (or max allowed)
            proposed_qty_dec = min(current_pos_size, proposed_qty_dec)

        # Rule 8: Maximum Total Position Exposure Threshold
        projected_exposure = abs(current_pos_size) + (proposed_qty_dec if signal.signal_type == "BUY" else Decimal("0.0"))
        max_exp_dec = Decimal(str(self.max_position_exposure))
        if projected_exposure > max_exp_dec:
            return self._reject(
                db,
                rule="MAX_POSITION_EXPOSURE",
                reason=f"Projected exposure ({projected_exposure:.4f}) breaches max allowed exposure ({max_exp_dec:.4f})",
                signal=signal,
            )

        # Rule 9: Account Margin / Available Balance Check
        if wallet_balances:
            usdt_bal = next((b for b in wallet_balances if b.asset.upper() in ("USDT", "USD")), None)
            if usdt_bal:
                avail_dec = Decimal(str(usdt_bal.available_balance))
                price_dec = Decimal(str(signal.close_price))
                margin_req = proposed_qty_dec * price_dec * Decimal("0.10")  # 10% margin requirement
                if avail_dec < margin_req:
                    return self._reject(
                        db,
                        rule="INSUFFICIENT_BALANCE",
                        reason=f"Available balance (${avail_dec:.2f}) < required margin (${margin_req:.2f})",
                        signal=signal,
                    )

        # All checks passed!
        logger.info(
            f"Risk check PASSED for {signal.instrument} {signal.signal_type}. "
            f"Approved qty: {float(proposed_qty_dec)}"
        )
        return RiskDecision(
            approved=True,
            reason="All risk controls passed successfully",
            allowed_quantity=float(proposed_qty_dec),
            risk_rule="PASSED",
        )

    def _reject(
        self,
        db: Session,
        rule: str,
        reason: str,
        signal: StrategySignal,
    ) -> RiskDecision:
        """Helper to log rejection event and return rejected decision."""
        logger.warning(f"Risk REJECTION [{rule}]: {reason}")

        event = SystemEvent(
            category="RISK",
            severity="WARNING",
            message=f"Order rejected by risk engine: {reason}",
            details=f"Rule: {rule}, Instrument: {signal.instrument}, Signal: {signal.signal_type}",
        )
        db.add(event)
        try:
            db.commit()
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to persist risk rejection event: {e}")

        return RiskDecision(
            approved=False,
            reason=reason,
            allowed_quantity=0.0,
            risk_rule=rule,
        )


risk_engine = RiskManagementEngine()
