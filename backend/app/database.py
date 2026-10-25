"""Database initialization and session management using SQLAlchemy."""

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from app.config import settings

# Engine configuration
engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {},
    echo=False,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """FastAPI dependency for obtaining a database session per request."""
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Creates all database tables defined in the ORM models."""
    from app.models import (
        signal,
        order,
        trade,
        position,
        event,
        account,
        user,
        strategy_run,
        backtest_run,
        risk_settings,
    )  # noqa
    Base.metadata.create_all(bind=engine)

    # Safe migration: add new strategy columns to signals table if they don't exist
    import sqlalchemy as sa
    with engine.connect() as conn:
        for column_ddl in [
            "ALTER TABLE signals ADD COLUMN strategy_id VARCHAR(64)",
            "ALTER TABLE signals ADD COLUMN strategy_version VARCHAR(16)",
            "ALTER TABLE signals ADD COLUMN signal_reason VARCHAR(255)",
        ]:
            try:
                conn.execute(sa.text(column_ddl))
                conn.commit()
            except Exception:
                pass  # Column already exists — safe to ignore
