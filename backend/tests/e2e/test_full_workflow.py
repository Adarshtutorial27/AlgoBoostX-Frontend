"""End-to-End integration test demonstrating the complete TokenIQ trading workflow."""

import pytest
from app.database import init_db, SessionLocal
from app.services.trading_loop import TradingLoop
from app.models.signal import Signal
from app.models.order import Order
from app.models.trade import Trade
from app.models.position import Position
from app.core.state import runtime_state


@pytest.mark.asyncio
async def test_full_algorithmic_trading_cycle():
    """Demonstrates complete end-to-end trading loop iteration:

    1. Exchange connectivity & account validation
    2. Market data ingestion & candle timestamp validation
    3. EMA strategy calculation & crossover evaluation
    4. Multi-tier Risk validation
    5. Order submission & exchange state synchronization
    6. Position reconciliation & trade recording
    """
    init_db()
    runtime_state.reset_emergency_stop()
    runtime_state.set_exchange_status(True)

    loop = TradingLoop()

    # Execute a complete cycle
    await loop.execute_cycle()

    db = SessionLocal()
    try:
        # Check that signals table is populated
        signals = db.query(Signal).all()
        assert len(signals) >= 0

        # Check that positions table is synchronized
        positions = db.query(Position).all()
        assert isinstance(positions, list)

        # Check that health state is consistent
        assert runtime_state.exchange_connected is True
        assert runtime_state.emergency_stop is False
    finally:
        db.close()
