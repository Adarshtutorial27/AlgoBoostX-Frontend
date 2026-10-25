"""Order Execution Engine for TokenIQ.

Converts risk-approved signals into valid exchange orders, manages the order lifecycle
state machine, and safely handles ambiguous responses (timeouts/5xx) with mandatory reconciliation.
"""

from datetime import datetime, timezone
from typing import Optional, Tuple
from sqlalchemy.orm import Session
from app.config import settings
from app.core.logger import logger
from app.core.state import runtime_state
from app.core.exceptions import OrderExecutionError, OrderReconciliationRequired
from app.exchange.client import exchange_client
from app.exchange.models import ExchangeOrderPayload, ExchangeOrderResult
from app.models.order import Order
from app.models.event import SystemEvent
from app.services.strategy_engine import StrategySignal
from app.services.risk_engine import RiskDecision


class ExecutionEngine:
    """Manages order submission, state tracking, and error handling."""

    async def execute_approved_signal(
        self,
        signal: StrategySignal,
        decision: RiskDecision,
        db: Session,
        client: Optional["DeltaExchangeClient"] = None,
    ) -> Tuple[bool, Optional[Order], str]:
        """Submits an approved order to Delta Exchange Testnet."""
        c = client or exchange_client
        if not decision.approved or decision.allowed_quantity <= 0:
            return False, None, "Decision is not approved for execution"

        # 1. Create local Order record with state PENDING_SUBMIT
        order = Order(
            instrument=signal.instrument,
            side=signal.signal_type.lower(),
            quantity=decision.allowed_quantity,
            order_type=settings.DEFAULT_ORDER_TYPE,
            price=signal.close_price,
            status="PENDING_SUBMIT",
        )
        db.add(order)
        db.commit()
        db.refresh(order)

        logger.info(
            f"Dispatching order {order.internal_id} for {order.instrument} "
            f"({order.side.upper()} {order.quantity})"
        )
        runtime_state.increment_metric("orders_submitted")

        # 2. Build Exchange Payload
        payload = ExchangeOrderPayload(
            product_symbol=order.instrument,
            size=order.quantity,
            side=order.side,
            order_type="market_order" if order.order_type == "market" else "limit_order",
            limit_price=order.price if order.order_type == "limit" else None,
            client_order_id=order.internal_id,
        )

        # 3. Transition to SUBMITTED
        order.status = "SUBMITTED"
        order.updated_at = datetime.now(timezone.utc)
        db.commit()

        # 4. Submit via Exchange Client with safe exception handling
        try:
            result: ExchangeOrderResult = await c.place_order(payload)
        except Exception as exc:
            # Ambiguous state: mark as RECONCILING, do NOT blindly retry
            logger.error(f"Order submission encountered error/timeout for {order.internal_id}: {exc}")
            order.status = "RECONCILING"
            order.error_reason = f"Network or API failure during submit: {str(exc)}"
            order.updated_at = datetime.now(timezone.utc)

            event = SystemEvent(
                category="EXECUTION",
                severity="ERROR",
                message=f"Order {order.internal_id} requires reconciliation due to timeout/error: {exc}",
                order_id=order.internal_id,
            )
            db.add(event)
            db.commit()
            return False, order, f"Submission error, order set to RECONCILING: {exc}"

        # 5. Process Exchange Response
        if not result.success:
            order.status = "REJECTED"
            order.error_reason = result.error_message or "Exchange rejected order"
            order.updated_at = datetime.now(timezone.utc)
            runtime_state.increment_metric("orders_rejected")

            event = SystemEvent(
                category="EXECUTION",
                severity="WARNING",
                message=f"Order {order.internal_id} rejected by exchange: {order.error_reason}",
                order_id=order.internal_id,
            )
            db.add(event)
            db.commit()
            return False, order, f"Exchange rejected: {order.error_reason}"

        # 6. Order successfully accepted or filled by exchange
        order.exchange_order_id = result.order_id
        if result.status.lower() in ("filled", "closed"):
            order.status = "FILLED"
            runtime_state.increment_metric("orders_filled")
        elif result.status.lower() in ("cancelled", "canceled"):
            order.status = "CANCELLED"
        else:
            order.status = "OPEN"

        order.updated_at = datetime.now(timezone.utc)
        db.commit()

        logger.info(
            f"Order {order.internal_id} exchange status updated to: {order.status} "
            f"(Exchange ID: {order.exchange_order_id})"
        )
        return True, order, "Order submitted successfully"

    async def reconcile_order(
        self,
        order: Order,
        db: Session,
        client: Optional["DeltaExchangeClient"] = None,
    ) -> str:
        """Polls exchange to reconcile an open or ambiguous (RECONCILING) order."""
        c = client or exchange_client
        if not order.exchange_order_id and not order.internal_id:
            return "No identifier to reconcile"

        search_id = order.exchange_order_id or order.internal_id
        try:
            status_result = await c.get_order_status(search_id)
        except Exception as e:
            logger.error(f"Reconciliation query failed for {order.internal_id}: {e}")
            return f"Reconciliation failed: {e}"

        if not status_result:
            logger.warning(f"Order {order.internal_id} not found on exchange during reconciliation")
            return "Order not found on exchange"

        # Synchronize status
        previous_status = order.status
        if status_result.status.lower() in ("filled", "closed"):
            order.status = "FILLED"
        elif status_result.status.lower() in ("cancelled", "canceled"):
            order.status = "CANCELLED"
        elif status_result.status.lower() in ("rejected",):
            order.status = "REJECTED"
        else:
            order.status = "OPEN"

        order.updated_at = datetime.now(timezone.utc)
        db.commit()

        logger.info(f"Reconciled order {order.internal_id}: {previous_status} -> {order.status}")
        return f"Reconciled from {previous_status} to {order.status}"


execution_engine = ExecutionEngine()
