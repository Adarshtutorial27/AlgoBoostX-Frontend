"""Unit tests for P&L calculations and Stop-Loss / Take-Profit exit triggers."""

import pytest
from app.models.order import Order
from app.models.position import Position
from app.services.position_manager import PositionManager


def test_realized_pnl_closing_long_with_profit(db_session):
    """Closing a long position at a higher price yields positive realized P&L."""
    pm = PositionManager()

    # Initial long position: 0.1 BTC bought at $60,000
    pos = Position(instrument="BTCUSD", size=0.1, entry_price=60000.0)
    db_session.add(pos)
    db_session.commit()

    # Sell order at $65,000 (gain = $5,000 * 0.1 = $500 minus fees)
    order = Order(
        internal_id="ord_sell_close",
        instrument="BTCUSD",
        side="sell",
        quantity=0.1,
        status="FILLED",
    )
    db_session.add(order)
    db_session.commit()

    trade = pm.record_fill_as_trade(
        db=db_session,
        order=order,
        fill_price=65000.0,
        fill_qty=0.1,
    )

    expected_gross = (65000.0 - 60000.0) * 0.1  # 500.0
    expected_fees = 65000.0 * 0.1 * 0.0005  # 3.25
    expected_net = round(expected_gross - expected_fees, 2)

    assert trade.realized_pnl == expected_net
    assert trade.realized_pnl > 0


def test_realized_pnl_closing_long_with_loss(db_session):
    """Closing a long position at a lower price yields negative realized P&L."""
    pm = PositionManager()

    pos = Position(instrument="BTCUSD", size=0.1, entry_price=60000.0)
    db_session.add(pos)
    db_session.commit()

    order = Order(
        internal_id="ord_sell_loss",
        instrument="BTCUSD",
        side="sell",
        quantity=0.1,
        status="FILLED",
    )
    db_session.add(order)
    db_session.commit()

    trade = pm.record_fill_as_trade(
        db=db_session,
        order=order,
        fill_price=58000.0,
        fill_qty=0.1,
    )

    assert trade.realized_pnl < 0


def test_stop_loss_trigger_long():
    """PositionManager triggers SELL exit when long position drops beyond stop-loss pct."""
    pm = PositionManager()
    pos = Position(instrument="BTCUSD", size=0.1, entry_price=60000.0)

    # 3% drop below entry (stop loss configured at 2%)
    current_price = 60000.0 * 0.97  # $58,200
    exit_check = pm.check_stop_loss_or_take_profit(pos, current_price)

    assert exit_check is not None
    side, reason = exit_check
    assert side == "SELL"
    assert "Stop-loss breached" in reason


def test_take_profit_trigger_long():
    """PositionManager triggers SELL exit when long position gains beyond take-profit pct."""
    pm = PositionManager()
    pos = Position(instrument="BTCUSD", size=0.1, entry_price=60000.0)

    # 5% gain above entry (take profit configured at 4%)
    current_price = 60000.0 * 1.05  # $63,000
    exit_check = pm.check_stop_loss_or_take_profit(pos, current_price)

    assert exit_check is not None
    side, reason = exit_check
    assert side == "SELL"
    assert "Take-profit hit" in reason
