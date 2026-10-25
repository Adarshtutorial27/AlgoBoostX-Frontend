"""Exchange specific data models and types."""

from typing import List, Optional
from pydantic import BaseModel


class Candle(BaseModel):
    time: int  # unix timestamp in seconds
    open: float
    high: float
    low: float
    close: float
    volume: float


class ProductInfo(BaseModel):
    id: int
    symbol: str
    contract_type: str
    contract_value: float
    tick_size: float


class ExchangeOrderPayload(BaseModel):
    product_id: Optional[int] = None
    product_symbol: Optional[str] = "BTCUSD"
    size: float
    side: str  # buy or sell
    order_type: str = "market_order"  # market_order or limit_order
    limit_price: Optional[float] = None
    client_order_id: Optional[str] = None


class ExchangeOrderResult(BaseModel):
    success: bool
    order_id: Optional[str] = None
    client_order_id: Optional[str] = None
    status: str  # open, filled, rejected, cancelled
    fill_price: Optional[float] = None
    size: float = 0.0
    side: str = ""
    error_message: Optional[str] = None


class ExchangePosition(BaseModel):
    product_symbol: str
    size: float
    entry_price: float
    mark_price: float
    unrealized_pnl: float
    realized_pnl: float = 0.0
    liquidation_price: Optional[float] = None


class WalletBalance(BaseModel):
    asset: str
    balance: float
    available_balance: float
