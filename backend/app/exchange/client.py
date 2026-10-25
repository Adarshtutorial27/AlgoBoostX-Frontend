"""Delta Exchange Testnet API Client.

Implements official REST API endpoints for Delta Exchange Testnet, including
HMAC-SHA256 authenticated requests, product validation, ticker/candle streaming,
wallet balance and position checks, order submission, and order status polling.
"""

import asyncio
import json
import random
import time
from typing import Dict, Any, List, Optional, Tuple, Union
import httpx
from app.config import settings
from app.core.logger import logger
from app.core.exceptions import ExchangeConnectionError, AuthenticationError
from app.core.security import decrypt_secret
from app.exchange.auth import build_auth_headers, format_compact_payload
from app.exchange.models import (
    Candle,
    ProductInfo,
    ExchangeOrderPayload,
    ExchangeOrderResult,
    ExchangePosition,
    WalletBalance,
)


class DeltaExchangeClient:
    """Client for Delta Exchange Testnet."""

    def __init__(
        self,
        api_key: Optional[str] = None,
        api_secret: Optional[str] = None,
        base_url: Optional[str] = None,
        use_live: Optional[bool] = None,
    ):
        self.api_key = api_key if api_key is not None else settings.DELTA_API_KEY
        self.api_secret = api_secret if api_secret is not None else settings.DELTA_API_SECRET
        self.base_url = (base_url or settings.DELTA_BASE_URL).rstrip("/")
        self.use_live = use_live if use_live is not None else settings.USE_LIVE_TESTNET
        self.timeout = httpx.Timeout(10.0, connect=5.0)

        # Simulation fallback state (explicitly labeled for offline demos)
        self._sim_price = 65000.0
        self._sim_balance = 10000.0
        self._sim_orders: Dict[str, Dict[str, Any]] = {}
        self._sim_positions: Dict[str, Dict[str, Any]] = {
            settings.DEFAULT_INSTRUMENT: {
                "product_symbol": settings.DEFAULT_INSTRUMENT,
                "size": 0.0,
                "entry_price": 0.0,
                "mark_price": 65000.0,
                "unrealized_pnl": 0.0,
                "realized_pnl": 0.0,
            }
        }

    @classmethod
    def from_account_connection(cls, account) -> "DeltaExchangeClient":
        """Instantiates client using credentials from a decrypted AccountConnection."""
        api_key = decrypt_secret(account.api_key_encrypted)
        api_secret = decrypt_secret(account.api_secret_encrypted)
        return cls(
            api_key=api_key,
            api_secret=api_secret,
            base_url=account.base_url,
            use_live=True,  # Account connections explicitly use the configured live testnet
        )

    async def _send_request(
        self,
        method: str,
        path: str,
        params: Optional[Dict[str, Any]] = None,
        json_data: Optional[Dict[str, Any]] = None,
        auth_required: bool = True,
    ) -> Dict[str, Any]:
        """Executes an authenticated HTTP request against Delta Exchange."""
        url = f"{self.base_url}{path}"
        query_str = ""
        if params:
            import urllib.parse
            query_str = urllib.parse.urlencode(params)

        payload_str = format_compact_payload(json_data) if json_data else ""

        headers = {}
        if auth_required:
            if not self.api_key or not self.api_secret:
                raise AuthenticationError("Delta Exchange API key or secret is not configured.")
            headers = build_auth_headers(
                api_key=self.api_key,
                api_secret=self.api_secret,
                method=method,
                path=path,
                query_string=query_str,
                payload=payload_str,
            )

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.request(
                    method=method,
                    url=url,
                    params=params,
                    content=payload_str if payload_str else None,
                    headers=headers,
                )
            except httpx.RequestError as exc:
                logger.error(f"Network error communicating with Delta Exchange ({url}): {exc}")
                raise ExchangeConnectionError(f"Connection failure: {str(exc)}")

            if response.status_code == 401:
                logger.error("Authentication rejected by Delta Exchange (HTTP 401)")
                raise AuthenticationError("Invalid, unauthorized, or expired Delta Exchange API credentials")
            elif response.status_code == 429:
                logger.warning("Delta Exchange rate limit reached (HTTP 429)")
                raise ExchangeConnectionError("Delta Exchange rate limit reached. Backing off.")
            elif response.status_code >= 500:
                logger.error(f"Delta Exchange server error: {response.status_code}")
                raise ExchangeConnectionError(f"Server error {response.status_code} from exchange")

            try:
                data = response.json()
            except Exception as e:
                raise ExchangeConnectionError(f"Invalid JSON returned from exchange: {e}")

            # Check Delta API error payload format
            if isinstance(data, dict) and not data.get("success", True) and "error" in data:
                err_msg = data.get("error", {}).get("message", "Exchange returned error")
                err_code = data.get("error", {}).get("code", "")
                if "auth" in err_msg.lower() or "signature" in err_msg.lower() or err_code == "AUTHENTICATION_FAILED":
                    raise AuthenticationError(f"Delta Exchange Authentication Error: {err_msg}")

            return data

    async def ping_public_connectivity(self) -> bool:
        """Verifies reachability of Delta Exchange public API."""
        try:
            res = await self._send_request("GET", "/v2/products", auth_required=False)
            return bool(res.get("success", False) or "result" in res)
        except Exception as e:
            logger.warning(f"Public API connectivity check failed: {e}")
            return False

    async def validate_credentials(self) -> Tuple[bool, str, Dict[str, Any]]:
        """Tests private authentication against Delta Exchange by querying wallet balances."""
        if not self.api_key or not self.api_secret:
            return False, "Missing API Key or API Secret", {}

        try:
            res = await self._send_request("GET", "/v2/wallet/balances", auth_required=True)
            result = res.get("result", [])
            return True, "Delta Exchange authentication successful", {"balances_count": len(result)}
        except AuthenticationError as e:
            return False, f"Authentication failed: {str(e)}", {}
        except ExchangeConnectionError as e:
            return False, f"Exchange connection failed: {str(e)}", {}
        except Exception as e:
            return False, f"Unexpected validation error: {str(e)}", {}

    async def ping_connectivity(self) -> bool:
        """Checks overall connectivity (public and private if configured)."""
        if not self.use_live:
            return True
        return await self.ping_public_connectivity()

    async def get_products(self) -> List[ProductInfo]:
        """Retrieves list of active traded products on the exchange."""
        if not self.use_live:
            return [
                ProductInfo(
                    id=1,
                    symbol="BTCUSD",
                    contract_type="perpetual_futures",
                    contract_value=1.0,
                    tick_size=0.5,
                )
            ]

        res = await self._send_request("GET", "/v2/products", auth_required=False)
        products = []
        for p in res.get("result", []):
            products.append(
                ProductInfo(
                    id=int(p.get("id", 0)),
                    symbol=p.get("symbol", ""),
                    contract_type=p.get("contract_type", ""),
                    contract_value=float(p.get("contract_value", 1.0)),
                    tick_size=float(p.get("tick_size", 0.5)),
                )
            )
        return products

    async def validate_instrument(self, symbol: str) -> Tuple[bool, Optional[ProductInfo]]:
        """Validates if configured symbol is supported on the exchange."""
        products = await self.get_products()
        for p in products:
            if p.symbol.upper() == symbol.upper():
                return True, p
        return False, None

    async def get_ticker(self, symbol: str) -> Dict[str, Any]:
        """Retrieves real-time 24hr ticker for an instrument from Delta Exchange."""
        try:
            res = await self._send_request("GET", f"/v2/tickers/{symbol}", auth_required=False)
            result = res.get("result", {})
            if result:
                return result
        except Exception as e:
            logger.warning(f"Error fetching ticker for {symbol} from Delta: {e}")

        return {
            "symbol": symbol,
            "mark_price": self._sim_price,
            "close": self._sim_price,
            "volume": 0.0,
            "error": "Exchange ticker fetch unavailable",
        }

    async def get_wallet_balances(self) -> List[WalletBalance]:
        """Retrieves authoritative user wallet balances."""
        if not self.use_live:
            return [
                WalletBalance(
                    asset="USDT",
                    balance=self._sim_balance,
                    available_balance=self._sim_balance,
                )
            ]

        res = await self._send_request("GET", "/v2/wallet/balances", auth_required=True)
        balances = []
        for item in res.get("result", []):
            balances.append(
                WalletBalance(
                    asset=item.get("asset_symbol", "USDT"),
                    balance=float(item.get("balance", 0.0)),
                    available_balance=float(item.get("available_balance", 0.0)),
                )
            )
        return balances

    async def get_candles(
        self,
        symbol: str = "BTCUSD",
        resolution: str = "5m",
        limit: int = 100,
    ) -> List[Candle]:
        """Retrieves real historical OHLCV candles from Delta Exchange."""
        end_time = int(time.time())
        step_seconds = 60
        if resolution == "5m":
            step_seconds = 300
        elif resolution == "15m":
            step_seconds = 900
        elif resolution == "1h":
            step_seconds = 3600
        elif resolution == "4h":
            step_seconds = 14400
        elif resolution in ["1d", "1D"]:
            step_seconds = 86400

        start_time = end_time - (limit * step_seconds)

        params = {
            "symbol": symbol,
            "resolution": resolution,
            "start": start_time,
            "end": end_time,
        }

        try:
            res = await self._send_request("GET", "/v2/history/candles", params=params, auth_required=False)
            candles: List[Candle] = []
            raw_candles = res.get("result", [])
            for c in raw_candles:
                if isinstance(c, dict):
                    candles.append(
                        Candle(
                            time=int(c.get("time", 0)),
                            open=float(c.get("open", 0.0)),
                            high=float(c.get("high", 0.0)),
                            low=float(c.get("low", 0.0)),
                            close=float(c.get("close", 0.0)),
                            volume=float(c.get("volume", 0.0)),
                        )
                    )
                elif isinstance(c, list) and len(c) >= 6:
                    candles.append(
                        Candle(
                            time=int(c[0]),
                            open=float(c[1]),
                            high=float(c[2]),
                            low=float(c[3]),
                            close=float(c[4]),
                            volume=float(c[5]),
                        )
                    )
            if candles:
                candles.sort(key=lambda x: x.time)
                self._sim_price = candles[-1].close
                return candles
        except Exception as e:
            logger.warning(f"Failed to fetch live Delta candles for {symbol}: {e}")

        return []

    async def place_order(self, payload: ExchangeOrderPayload) -> ExchangeOrderResult:
        """Submits an order to Delta Exchange."""
        if not self.use_live:
            order_id = f"sim_{int(time.time() * 1000)}"
            fill_price = self._sim_price
            actual_fill = fill_price + random.uniform(-0.5, 0.5)

            self._sim_orders[order_id] = {
                "order_id": order_id,
                "client_order_id": payload.client_order_id,
                "symbol": payload.product_symbol,
                "side": payload.side,
                "size": payload.size,
                "fill_price": actual_fill,
                "status": "filled",
            }

            pos = self._sim_positions.get(payload.product_symbol, {
                "product_symbol": payload.product_symbol,
                "size": 0.0,
                "entry_price": 0.0,
                "mark_price": actual_fill,
                "unrealized_pnl": 0.0,
                "realized_pnl": 0.0,
            })

            curr_size = pos["size"]
            new_size = curr_size + payload.size if payload.side.lower() == "buy" else curr_size - payload.size
            pos["size"] = round(new_size, 4)
            pos["entry_price"] = actual_fill
            pos["mark_price"] = actual_fill
            self._sim_positions[payload.product_symbol] = pos

            return ExchangeOrderResult(
                success=True,
                order_id=order_id,
                client_order_id=payload.client_order_id,
                status="filled",
                fill_price=round(actual_fill, 2),
                size=payload.size,
                side=payload.side,
            )

        # Live Order Submission
        body = {
            "product_symbol": payload.product_symbol,
            "size": payload.size,
            "side": payload.side.lower(),
            "order_type": payload.order_type,
        }
        if payload.client_order_id:
            body["client_order_id"] = payload.client_order_id
        if payload.limit_price:
            body["limit_price"] = str(payload.limit_price)

        res = await self._send_request("POST", "/v2/orders", json_data=body, auth_required=True)
        result = res.get("result", {})
        status = result.get("state", "open")
        order_id = str(result.get("id", ""))
        avg_price = float(result.get("avg_fill_price", 0.0) or 0.0)

        return ExchangeOrderResult(
            success=bool(order_id),
            order_id=order_id,
            client_order_id=payload.client_order_id,
            status=status,
            fill_price=avg_price if avg_price > 0 else None,
            size=payload.size,
            side=payload.side,
            error_message=res.get("error", {}).get("message"),
        )

    async def get_order_status(self, order_id: str) -> Optional[ExchangeOrderResult]:
        """Polls status of a specific order for reconciliation."""
        if not self.use_live:
            sim = self._sim_orders.get(order_id)
            if not sim:
                return None
            return ExchangeOrderResult(
                success=True,
                order_id=order_id,
                client_order_id=sim.get("client_order_id"),
                status=sim.get("status", "filled"),
                fill_price=sim.get("fill_price"),
                size=sim.get("size", 0.0),
                side=sim.get("side", ""),
            )

        res = await self._send_request("GET", f"/v2/orders/{order_id}", auth_required=True)
        result = res.get("result", {})
        if not result:
            return None

        status = result.get("state", "open")
        avg_price = float(result.get("avg_fill_price", 0.0) or 0.0)
        return ExchangeOrderResult(
            success=True,
            order_id=str(result.get("id")),
            client_order_id=result.get("client_order_id"),
            status=status,
            fill_price=avg_price if avg_price > 0 else None,
            size=float(result.get("size", 0.0)),
            side=result.get("side", ""),
        )

    async def cancel_order(self, order_id: str) -> Dict[str, Any]:
        """Cancels an open order."""
        if not self.use_live:
            if order_id in self._sim_orders:
                self._sim_orders[order_id]["status"] = "cancelled"
            return {"success": True, "order_id": order_id, "status": "cancelled"}

        res = await self._send_request("DELETE", f"/v2/orders/{order_id}", auth_required=True)
        return res

    async def get_open_orders(self) -> List[Dict[str, Any]]:
        """Retrieves active open orders."""
        if not self.use_live:
            return [o for o in self._sim_orders.values() if o.get("status") in ("open", "pending")]

        res = await self._send_request("GET", "/v2/orders", params={"state": "open"}, auth_required=True)
        return res.get("result", [])

    async def get_positions(self) -> List[ExchangePosition]:
        """Retrieves authoritative positions from exchange."""
        if not self.use_live:
            res = []
            for k, pos in self._sim_positions.items():
                res.append(
                    ExchangePosition(
                        product_symbol=pos["product_symbol"],
                        size=pos["size"],
                        entry_price=pos["entry_price"],
                        mark_price=pos["mark_price"],
                        unrealized_pnl=pos["unrealized_pnl"],
                        realized_pnl=pos["realized_pnl"],
                    )
                )
            return res

        res = await self._send_request("GET", "/v2/positions", auth_required=True)
        positions = []
        for p in res.get("result", []):
            positions.append(
                ExchangePosition(
                    product_symbol=p.get("product_symbol", ""),
                    size=float(p.get("size", 0.0)),
                    entry_price=float(p.get("entry_price", 0.0)),
                    mark_price=float(p.get("mark_price", 0.0)),
                    unrealized_pnl=float(p.get("unrealized_pnl", 0.0)),
                    realized_pnl=float(p.get("realized_pnl", 0.0)),
                    liquidation_price=float(p.get("liquidation_price")) if p.get("liquidation_price") else None,
                )
            )
        return positions


# Default global client (uses environment credentials if provided)
exchange_client = DeltaExchangeClient()
