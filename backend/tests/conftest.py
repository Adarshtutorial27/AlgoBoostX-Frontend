"""Pytest fixtures and configuration for TokenIQ test suite."""

import os
import sys
from pathlib import Path
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add backend directory to sys.path
BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

from app.database import Base
from app.core.state import runtime_state


@pytest.fixture(scope="session")
def test_db_engine():
    """In-memory SQLite database engine for testing."""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
    )
    Base.metadata.create_all(bind=engine)
    return engine


@pytest.fixture(scope="function")
def db_session(test_db_engine):
    """Provides a transactional database session per test function, rolling back after."""
    connection = test_db_engine.connect()
    transaction = connection.begin()
    SessionTest = sessionmaker(bind=connection)
    session = SessionTest()

    # Reset runtime state before each test
    runtime_state.reset_emergency_stop()
    runtime_state.set_exchange_status(True)
    runtime_state.update_market_status(True, price=65000.0, candle_ts=1700000000)
    runtime_state.daily_realized_pnl = 0.0

    yield session

    session.close()
    transaction.rollback()
    connection.close()
