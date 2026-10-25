"""Portfolio summary and asset exposure endpoint."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.exchange.manager import get_client_for_account
from app.models.position import Position
from app.models.trade import Trade
from app.core.state import runtime_state

router = APIRouter(prefix="/api/v1/portfolio", tags=["Portfolio"])


@router.get("/summary")
async def get_portfolio_summary(db: Session = Depends(get_db)):
    """Comprehensive portfolio summary including NAV, exposure, open positions, and PnL."""
    client, _ = get_client_for_account(db)
    balances = await client.get_wallet_balances()

    total_balance = sum(b.balance for b in balances)
    total_available = sum(b.available_balance for b in balances)

    positions = db.query(Position).all()
    open_positions = [p for p in positions if abs(p.size) > 0]
    total_exposure = sum(abs(p.size * p.mark_price) for p in open_positions)
    unrealized_pnl = sum(p.unrealized_pnl for p in open_positions)
    realized_pnl = sum(p.realized_pnl for p in positions)

    recent_trades = db.query(Trade).order_by(Trade.id.desc()).limit(10).all()

    nav = total_balance + unrealized_pnl

    return {
        "net_asset_value": round(nav, 2),
        "total_balance_usd": round(total_balance, 2),
        "available_balance_usd": round(total_available, 2),
        "total_exposure_usd": round(total_exposure, 2),
        "unrealized_pnl": round(unrealized_pnl, 2),
        "realized_pnl": round(realized_pnl, 2),
        "daily_realized_pnl": round(runtime_state.daily_realized_pnl, 2),
        "open_positions_count": len(open_positions),
        "open_positions": [p.to_dict() for p in open_positions],
        "recent_trades_count": len(recent_trades),
        "recent_trades": [t.to_dict() for t in recent_trades],
    }
