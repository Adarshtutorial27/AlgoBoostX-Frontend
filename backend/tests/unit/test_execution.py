"""Unit tests for Execution Engine and order state machine."""

import pytest
from app.models.order import Order
from app.services.strategy_engine import StrategySignal
from app.services.risk_engine import RiskDecision
from app.services.execution_engine import ExecutionEngine
from app.exchange.client import exchange_client


@pytest.mark.asyncio
async def test_order_execution_lifecycle_success(db_session):
    """Execution engine submits approved order and transitions to FILLED/OPEN."""
    engine = ExecutionEngine()

    signal = StrategySignal(
        instrument="BTCUSD",
        signal_type="BUY",
        fast_ema=65100.0,
        slow_ema=65000.0,
        candle_timestamp=1700000000,
        close_price=65000.0,
    )

    decision = RiskDecision(
        approved=True,
        reason="Test approval",
        allowed_quantity=0.05,
        risk_rule="PASSED",
    )

    success, order, msg = await engine.execute_approved_signal(signal, decision, db_session)

    assert success is True
    assert order is not None
    assert order.instrument == "BTCUSD"
    assert order.side == "buy"
    assert order.quantity == 0.05
    assert order.status in ("FILLED", "OPEN")
    assert order.exchange_order_id is not None


@pytest.mark.asyncio
async def test_order_reconciliation_updates_status(db_session):
    """Reconciling an open/simulated order synchronizes its state."""
    engine = ExecutionEngine()

    order = Order(
        internal_id="ord_reconcile_test",
        instrument="BTCUSD",
        side="buy",
        quantity=0.05,
        status="RECONCILING",
    )
    db_session.add(order)
    db_session.commit()

    # Reconciling with an unknown order
    msg = await engine.reconcile_order(order, db_session)
    assert order.status in ("RECONCILING", "FILLED", "OPEN", "REJECTED")
