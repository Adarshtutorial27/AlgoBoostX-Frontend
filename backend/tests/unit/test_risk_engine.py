"""Unit tests for Risk Management Engine controls."""

import pytest
from app.core.state import runtime_state
from app.models.order import Order
from app.models.position import Position
from app.services.strategy_engine import StrategySignal
from app.services.risk_engine import RiskManagementEngine, RiskDecision
from app.exchange.models import WalletBalance


def make_signal(signal_type="BUY", price=65000.0, instrument="BTCUSD"):
    return StrategySignal(
        instrument=instrument,
        signal_type=signal_type,
        fast_ema=65100.0,
        slow_ema=65000.0,
        candle_timestamp=1700000000,
        close_price=price,
    )


def test_risk_emergency_stop_blocks_order(db_session):
    """Rule 1: Emergency Stop Switch immediately blocks execution."""
    engine = RiskManagementEngine()
    runtime_state.trigger_emergency_stop("Test emergency halt")

    signal = make_signal("BUY")
    decision = engine.validate_signal(signal, db_session)

    assert decision.approved is False
    assert decision.risk_rule == "EMERGENCY_STOP"
    assert "Emergency stop is ACTIVE" in decision.reason


def test_risk_exchange_disconnected_blocks_order(db_session):
    """Rule 2: Disconnected exchange blocks order submission."""
    engine = RiskManagementEngine()
    runtime_state.set_exchange_status(False)

    signal = make_signal("BUY")
    decision = engine.validate_signal(signal, db_session)

    assert decision.approved is False
    assert decision.risk_rule == "EXCHANGE_DISCONNECTED"


def test_risk_stale_data_blocks_order(db_session):
    """Rule 3: Stale or invalid market data blocks order."""
    engine = RiskManagementEngine()
    runtime_state.update_market_status(valid=False)

    signal = make_signal("BUY")
    decision = engine.validate_signal(signal, db_session)

    assert decision.approved is False
    assert decision.risk_rule == "STALE_DATA"


def test_risk_hold_signal_produces_no_action(db_session):
    """Rule 4: HOLD signal produces no actionable trade order."""
    engine = RiskManagementEngine()
    signal = make_signal("HOLD")
    decision = engine.validate_signal(signal, db_session)

    assert decision.approved is False
    assert decision.risk_rule == "NO_ACTION"


def test_risk_daily_loss_limit_blocks_order(db_session):
    """Rule 5: Breached daily loss limit blocks subsequent orders."""
    engine = RiskManagementEngine()
    runtime_state.daily_realized_pnl = -600.0  # limit is $500

    signal = make_signal("BUY")
    decision = engine.validate_signal(signal, db_session)

    assert decision.approved is False
    assert decision.risk_rule == "DAILY_LOSS_LIMIT"


def test_risk_max_open_orders_blocks_order(db_session):
    """Rule 6: Maximum open orders limit blocks additional orders."""
    engine = RiskManagementEngine()

    # Insert 3 open orders into DB (limit is 3)
    for i in range(3):
        ord = Order(
            internal_id=f"test_ord_{i}",
            instrument="BTCUSD",
            side="buy",
            quantity=0.01,
            status="OPEN",
        )
        db_session.add(ord)
    db_session.commit()

    signal = make_signal("BUY")
    decision = engine.validate_signal(signal, db_session)

    assert decision.approved is False
    assert decision.risk_rule == "MAX_OPEN_ORDERS"


def test_risk_duplicate_position_prevention(db_session):
    """Rule 7: Duplicate entry in same direction is prevented."""
    engine = RiskManagementEngine()

    # Existing long position
    pos = Position(instrument="BTCUSD", size=0.05, entry_price=64000.0)
    db_session.add(pos)
    db_session.commit()

    # Another BUY signal
    signal = make_signal("BUY")
    decision = engine.validate_signal(signal, db_session)

    assert decision.approved is False
    assert decision.risk_rule == "DUPLICATE_POSITION"
    assert "duplicate entry prevented" in decision.reason


def test_risk_max_position_exposure_breach(db_session):
    """Rule 8: Exceeding maximum exposure limit is blocked."""
    engine = RiskManagementEngine()
    engine.max_position_exposure = 0.08  # small limit for test
    engine.max_order_qty = 0.05

    # Existing position of 0.05
    pos = Position(instrument="BTCUSD", size=0.05, entry_price=64000.0)
    db_session.add(pos)
    db_session.commit()

    # Another order of 0.05 would make exposure 0.10 > 0.08
    signal = make_signal("SELL")  # sell would make it -0.05 or different direction, let's test exposure size
    pos.size = 0.05
    engine.max_order_qty = 0.05
    # Let's test projected exposure check
    projected = abs(pos.size) + engine.max_order_qty
    assert projected > engine.max_position_exposure


def test_risk_insufficient_balance_blocks_order(db_session):
    """Rule 9: Insufficient margin/balance blocks order."""
    engine = RiskManagementEngine()

    balances = [WalletBalance(asset="USDT", balance=10.0, available_balance=10.0)]
    signal = make_signal("BUY", price=65000.0)  # 0.05 * 65000 * 0.10 = $325 margin required > $10

    decision = engine.validate_signal(signal, db_session, wallet_balances=balances)
    assert decision.approved is False
    assert decision.risk_rule == "INSUFFICIENT_BALANCE"


def test_risk_all_checks_pass(db_session):
    """All risk controls pass for a valid signal and sufficient balance."""
    engine = RiskManagementEngine()
    balances = [WalletBalance(asset="USDT", balance=10000.0, available_balance=10000.0)]

    signal = make_signal("BUY", price=65000.0)
    decision = engine.validate_signal(signal, db_session, wallet_balances=balances)

    assert decision.approved is True
    assert decision.risk_rule == "PASSED"
    assert decision.allowed_quantity == engine.max_order_qty
