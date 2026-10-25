"""Account summary and wallet balance endpoints."""

from fastapi import APIRouter
from app.exchange.client import exchange_client
from app.core.state import runtime_state

router = APIRouter(prefix="/api/v1/account", tags=["Account"])


@router.get("")
async def get_account():
    """Returns wallet balances, margin summary, and daily P&L metrics."""
    balances = await exchange_client.get_wallet_balances()

    total_balance = sum(b.balance for b in balances)
    total_available = sum(b.available_balance for b in balances)

    return {
        "balances": [b.model_dump() for b in balances],
        "total_balance_usd": round(total_balance, 2),
        "total_available_usd": round(total_available, 2),
        "daily_realized_pnl": round(runtime_state.daily_realized_pnl, 2),
    }
