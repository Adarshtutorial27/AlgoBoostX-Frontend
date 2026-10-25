"""Health and exchange connectivity endpoints."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.config import settings
from app.core.state import runtime_state
from app.database import get_db
from app.exchange.client import exchange_client

router = APIRouter(tags=["Health & Status"])


@router.get("/health")
def get_health(db: Session = Depends(get_db)):
    """Application health probe reporting DB and exchange connectivity."""
    db_healthy = False
    try:
        db.execute(text("SELECT 1"))
        db_healthy = True
    except Exception:
        db_healthy = False

    return {
        "status": "healthy" if db_healthy else "degraded",
        "app_name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.APP_ENV,
        "mode": "Live Testnet" if settings.USE_LIVE_TESTNET else "Simulation / Testnet Sandbox",
        "database_connected": db_healthy,
        "exchange_connected": runtime_state.exchange_connected,
        "emergency_stop": runtime_state.emergency_stop,
    }


@router.get("/api/v1/exchange/status")
async def get_exchange_status():
    """Delta Exchange Testnet reachability, last-ping timestamp, and mode."""
    connected = await exchange_client.ping_connectivity()
    runtime_state.set_exchange_status(connected)

    return {
        "exchange": "Delta Exchange Testnet",
        "base_url": settings.DELTA_BASE_URL,
        "mode": "LIVE_TESTNET" if settings.USE_LIVE_TESTNET else "SIMULATED_TESTNET",
        "connected": connected,
        "last_ping": runtime_state.last_exchange_ping,
        "error": runtime_state.exchange_error,
    }


@router.get("/api/v1/exchange/products")
async def get_exchange_products():
    """Lists available products and perpetual futures on Delta Exchange Testnet."""
    products = await exchange_client.get_products()
    return {
        "count": len(products),
        "products": [p.model_dump() for p in products],
    }
