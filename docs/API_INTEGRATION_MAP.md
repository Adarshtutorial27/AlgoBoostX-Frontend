# API Integration Map & Architecture Analysis
**Project:** AlgoBoostX (Algo boostX) Trading Platform  
**Target Environment:** Delta Exchange Testnet (Simulation / Testnet Sandbox)  
**Date:** October 2026  

---

## 1. Executive Summary & Architecture Overview

AlgoBoostX is composed of two primary sub-systems:
1. **Frontend (`/src`):** A modern React 19 + Vite + Tailwind CSS algorithmic trading interface featuring dark-mode institutional UI, interactive charting (Recharts & Lightweight Charts), demo fallbacks, authentication state machine, and trading simulation.
2. **Backend (`/tokeniq/backend`):** A production-structured FastAPI + SQLAlchemy application designed for Delta Exchange Testnet. It features automated strategy execution loops (EMA Crossover), risk guardrails, PBKDF2 user authentication, multi-account encrypted credential management, and SQLite persistence.

```
+---------------------------------------------------------------------------------------+
|                                ALGOBOOSTX ARCHITECTURE                                |
+---------------------------------------------------------------------------------------+
|                                                                                       |
|   FRONTEND (React 19 + Vite @ :5173)                                                  |
|   +-------------------------------------------------------------------------------+   |
|   | Pages: Dashboard, Strategy Lab, Terminal, Accounts, Markets, Backtesting, etc.|   |
|   | Contexts: AuthContext, TradingContext, NotificationContext                    |   |
|   | API Service: src/services/api.js (Centralized fetch client with demo fallback)|   |
|   +-------------------------------------------------------------------------------+   |
|                                       |                                               |
|                                       | REST (HTTP / JSON)                            |
|                                       v                                               |
|   BACKEND (FastAPI @ :8000)                                                           |
|   +-------------------------------------------------------------------------------+   |
|   | Routers:                                                                      |   |
|   |   - /api/v1/auth (PBKDF2 session auth & tokens)                               |   |
|   |   - /api/v1/accounts (Delta Testnet API key validation & AES encryption)      |   |
|   |   - /api/v1/portfolio & /api/v1/positions (NAV, mark prices & exposure)       |   |
|   |   - /api/v1/market & /api/market/* (Delta candles & live ticker)              |   |
|   |   - /api/v1/strategies (Registry lifecycle, config update & backtest)         |   |
|   |   - /api/v1/orders & /api/v1/trades (Reconciled history & analytics)          |   |
|   |   - /api/v1/risk & emergency (Hard limits, daily drawdown, kill switch)       |   |
|   | Services: trading_loop, risk_manager, position_manager, market_data_service   |   |
|   | Persistence: SQLAlchemy ORM -> tokeniq.db (SQLite / PostgreSQL ready)         |   |
|   +-------------------------------------------------------------------------------+   |
+---------------------------------------------------------------------------------------+
```

---

## 2. Frontend Architecture Inspection

### 2.1 Configuration & Environment Variables
- **File:** [`.env.example`](file:///C:/ALGO%20FRONTEND/.env.example)
  ```properties
  VITE_API_BASE_URL=http://localhost:5000/api
  VITE_WS_URL=ws://localhost:5000/ws
  ```
- **Active Behavior:** In [`src/services/api.js`](file:///C:/ALGO%20FRONTEND/src/services/api.js), base URLs default to `http://localhost:5000/api` if environment variables are not set. (Backend defaults to port `8000`).

### 2.2 Client-Side Routes
Defined in [`src/App.jsx`](file:///C:/ALGO%20FRONTEND/src/App.jsx):
- `/` — Public Landing Page
- `/login` & `/signup` — Authentication Page (Supports Tab toggle & Demo credentials)
- `/dashboard` — Institutional Metrics & Equity Curves
- `/strategies` — AI Strategies Catalog & Paper Trading Toggles
- `/strategy-lab` — Quantitative Strategy Builder
- `/terminal` — Trading Terminal (Manual & simulated orders)
- `/portfolio` — Asset Allocation & P&L Analysis
- `/accounts` — Broker & Exchange Accounts Connection (Delta Exchange, etc.)
- `/markets` — Market instruments overview
- `/mirror-leaders` — Quant Leaderboards & Copy Trading
- `/backtesting` — Historical Backtesting Studio
- `/history` — Completed Trade Log & Audit
- `/settings` — User preferences, API test connection, Webhook alerts

### 2.3 Authentication & Session Flow
- **Context:** [`src/context/AuthContext.jsx`](file:///C:/ALGO%20FRONTEND/src/context/AuthContext.jsx)
- **Mechanism:** Bearer token stored in `localStorage` under key `algoboostx_auth_token` and user object under `algoboostx_user`.
- **Hybrid Resilience:** Attempts backend API first; if backend is offline or returns error, seamlessly switches to simulated demo session with toast alerts.

---

## 3. Backend Architecture Inspection

### 3.1 Server & Database Setup
- **Framework:** FastAPI with lifespan management in [`tokeniq/backend/app/main.py`](file:///C:/ALGO%20FRONTEND/tokeniq/backend/app/main.py)
- **Host & Port:** Default `0.0.0.0:8000` via [`run.py`](file:///C:/ALGO%20FRONTEND/tokeniq/backend/run.py) and [`config.py`](file:///C:/ALGO%20FRONTEND/tokeniq/backend/app/config.py)
- **CORS:** Configured with wildcard `allow_origins=["*"]`, credentials allowed.
- **Database:** SQLAlchemy ORM with SQLite DB file [`tokeniq.db`](file:///C:/ALGO%20FRONTEND/tokeniq/backend/tokeniq.db) (configured in [`database.py`](file:///C:/ALGO%20FRONTEND/tokeniq/backend/app/database.py)). Supports clean connection to PostgreSQL/Supabase.
- **ORM Models:**
  - `User`: User authentication credentials, PBKDF2 hash, admin flags.
  - `AccountConnection`: Encrypted Delta Exchange Testnet API keys (`api_key_encrypted`, `api_secret_encrypted`, `api_key_masked`), active status.
  - `Signal`: Generated strategy signals (BUY/SELL/HOLD, price, reasoning).
  - `Order`: Order lifecycle (`PENDING_SUBMIT`, `OPEN`, `FILLED`, `CANCELLED`).
  - `Trade`: Completed executed fills with realized P&L and fees.
  - `Position`: Open positions with entry price, size, mark price, liquidation price, unrealized P&L.
  - `StrategyRun`: Strategy runtime tracking sessions.
  - `BacktestRun`: Backtest performance summary records.
  - `RiskSettings`: Persisted daily loss limits, maximum order sizes, slippage tolerance.
  - `SystemEvent`: Audit log of platform events, emergency halts, and connection tests.

### 3.2 Authentication & Security
- **Module:** [`tokeniq/backend/app/core/auth.py`](file:///C:/ALGO%20FRONTEND/tokeniq/backend/app/core/auth.py)
- **Hashing:** PBKDF2-HMAC-SHA256 with cryptographically random 16-byte salt (100,000 iterations).
- **Session Tokens:** 32-byte URL-safe cryptographic tokens stored with 24-hour expiration.
- **Development Fallback:** Pre-seeded default user (`admin` / `admin12345`).

---

## 4. Complete Frontend-to-Backend Endpoint Map

| Category | Frontend Method ([`api.js`](file:///C:/ALGO%20FRONTEND/src/services/api.js)) | Current Frontend URL | Backend Route | Backend Request Schema | Backend Response Schema |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **System & Health** | `api.health.check()` | `GET /health` | `GET /health`<br>or `GET /api/system/status` | None | `{ status, database_connected, exchange_connected, emergency_stop, version }` |
| **Auth** | `api.auth.login(credentials)` | `POST /auth/login` | `POST /api/v1/auth/login` | `UserLoginRequest`<br>`{ username: str, password: str }` | `TokenResponse`<br>`{ access_token: str, token_type: "bearer", user: UserResponse }` |
| **Auth** | `api.auth.signup(userData)` | `POST /auth/signup` | `POST /api/v1/auth/register` | `UserRegisterRequest`<br>`{ username: str, email: str, password: str }` | `TokenResponse`<br>`{ access_token: str, token_type: "bearer", user: UserResponse }` |
| **Auth** | `api.auth.me()` | `GET /auth/me` | `GET /api/v1/auth/me` | Headers: `Authorization: Bearer <token>` | `UserResponse`<br>`{ id, user_id, username, email, is_active, is_admin }` |
| **Auth** | `api.auth.logout()` | `(clears local token)` | `POST /api/v1/auth/logout` | Headers: `Authorization: Bearer <token>` | `{ success: bool, message: str }` |
| **Accounts / Broker** | `connectBroker(...)` in [`BrokerConnectModal`](file:///C:/ALGO%20FRONTEND/src/components/common/BrokerConnectModal.jsx) | Local state | `POST /api/v1/accounts/validate`<br>`POST /api/v1/accounts/connect` | `AccountConnectRequest`<br>`{ user_id, label, environment: "testnet", base_url, api_key, api_secret }` | `AccountResponse`<br>`{ account_id, label, api_key_masked, is_active, is_validated }` |
| **Accounts / Broker** | List accounts | Local state | `GET /api/v1/accounts` | Query: `?user_id=default_user` | `List[AccountResponse]` |
| **Accounts / Broker** | Account Status | Local state | `GET /api/v1/accounts/status` | Query: `?user_id=default_user` | `AccountStatusResponse` |
| **Market Data** | `api.markets.getTicker(symbol)` | `GET /markets/ticker/:symbol` | `GET /api/market/ticker?symbol=...`<br>or `GET /api/v1/exchange/market-data` | Query: `?symbol=BTCUSD` | `{ symbol, mark_price, high_24h, low_24h, volume_24h, ... }` |
| **Market Data** | `api.markets.getCandles(...)` | `GET /markets/candles?symbol=...` | `GET /api/market/candles`<br>or `GET /api/v1/market` | Query: `?symbol=BTCUSD&resolution=5m&limit=50` | `{ symbol, valid, candles: [{ time, open, high, low, close, volume }] }` |
| **Market Data** | `api.markets.getInstruments()` | `GET /markets/instruments` | `GET /api/v1/exchange/products` | None | `{ count: int, products: [...] }` |
| **Portfolio** | `api.portfolio.getSummary()` | `GET /portfolio/summary` | `GET /api/v1/portfolio/summary` | None | `{ net_asset_value, total_balance_usd, available_balance_usd, open_positions_count, open_positions, ... }` |
| **Portfolio** | `api.portfolio.getPositions()` | `GET /portfolio/positions` | `GET /api/v1/positions`<br>or `GET /api/positions` | None | `List[PositionResponse]` |
| **Strategies** | `api.strategies.list()` | `GET /strategies` | `GET /api/strategies`<br>or `GET /api/v1/strategies` | None | `List[StrategyMetadata]` |
| **Strategies** | `api.strategies.getById(id)` | `GET /strategies/:id` | `GET /api/v1/strategies/{strategy_id}` | Path: `strategy_id` | Strategy metadata, status, parameters |
| **Strategies** | `api.strategies.toggleStatus(id)` | `PATCH /strategies/:id/status` | `POST /api/v1/strategies/{id}/start`<br>`POST /api/v1/strategies/{id}/stop` | None | `{ strategy_id, enabled, status, message }` |
| **Strategies** | `api.strategies.update(id, conf)` | `PUT /strategies/:id` | `PUT /api/v1/strategies/{id}/config` | JSON: `config: Dict[str, Any]` | `{ strategy_id, config, message }` |
| **Backtesting** | `api.backtesting.run(config)` | `POST /backtest/run` | `POST /api/v1/strategies/{id}/backtest` | `BacktestRequest`<br>`{ candles, initial_capital, fee_pct }` | `{ strategy_id, metrics: { total_trades, win_rate, return_pct, sharpe_ratio, max_drawdown } }` |
| **Orders** | `api.orders.list()` | `GET /orders` | `GET /api/orders`<br>or `GET /api/v1/orders` | Query: `?limit=20` | `List[OrderResponse]` |
| **Trades & History** | Fetch Trade Log | Local state | `GET /api/v1/trades` | Query: `?limit=50` | `List[TradeResponse]` |
| **Risk & Kill Switch**| Emergency controls in UI | Local state | `GET /api/v1/risk/status`<br>`POST /api/v1/risk/kill-switch`<br>`POST /api/v1/emergency-reset` | `KillSwitchRequest` | `{ success, emergency_stop, message }` |

---

## 5. Architectural Mismatches & Gap Analysis

### Mismatch 1: Base URL and Port Discrepancy
- **Observation:** Frontend `.env.example` points to `http://localhost:5000/api`. Backend runs by default on `http://localhost:8000`.
- **Impact:** Requests will fail with connection timeout if frontend is directed to port `5000`.
- **Safe Resolution:** Update frontend `.env` to `http://localhost:8000` (or `http://localhost:8000/api`) and align path structures.

### Mismatch 2: Route Prefixing (`/api` vs `/api/v1`)
- **Observation:** Frontend makes calls like `/auth/login` assuming the base URL is `/api` (`/api/auth/login`), but backend mounts core endpoints under `/api/v1/auth/login`.
- **Impact:** HTTP 404 Not Found on authentication and portfolio calls.
- **Safe Resolution:** Standardize frontend endpoint paths to `/api/v1/...` while maintaining existing `/api/...` convenience aliases on backend.

### Mismatch 3: Authentication Request & Response Schema Mismatch
- **Observation:**
  - Frontend login sends `{ email, password }` and expects `{ token, user }`.
  - Backend login expects `{ username, password }` and returns `{ access_token, token_type, user }`.
  - Frontend signup sends `{ name, email, password }` to `/auth/signup`; backend expects `{ username, email, password }` at `/api/v1/auth/register`.
- **Impact:** 422 Unprocessable Entity on login/signup.
- **Safe Resolution:** Normalize the request payload in [`src/services/api.js`](file:///C:/ALGO%20FRONTEND/src/services/api.js) so it sends `username` (using email or derived username) and accepts `access_token` as well as `token`.

### Mismatch 4: Strategy Lifecycle & Backtest Parameter Passing
- **Observation:**
  - Frontend `toggleStatus` sends `PATCH /strategies/:id/status` with `{ status: "ACTIVE" | "PAUSED" }`. Backend uses dedicated endpoints `POST /api/v1/strategies/{id}/start` and `POST /api/v1/strategies/{id}/stop`.
  - Frontend backtesting expects generic `/backtest/run`, while backend associates each backtest with a specific strategy plugin (`POST /api/v1/strategies/{strategy_id}/backtest`).
- **Safe Resolution:** Route strategy activation to the start/stop endpoints, and pass the selected `strategy_id` during backtesting.

### Mismatch 5: Real-time Streaming (WebSockets)
- **Observation:** Frontend [`api.js`](file:///C:/ALGO%20FRONTEND/src/services/api.js) has `createWebSocketConnection` that expects a local WebSocket server `ws://localhost:5000/ws`. The FastAPI backend connects directly to Delta Exchange's testnet WebSocket (`wss://socket-ind.testnet.deltaex.org`) for background candle ingestion, but does not currently expose a browser WebSocket server.
- **Safe Resolution:** Maintain the frontend's smooth client-side polling and micro-fluctuation fallback for price updates, preventing WebSocket connection errors from breaking the UI.

---

## 6. Safest Non-Destructive Integration Plan

> [!IMPORTANT]
> **Safety Guardrails:**
> 1. No changes to trading execution logic, risk engine, exchange orders, or secrets.
> 2. Live trading remains strictly disabled (`USE_LIVE_TESTNET=false` / Testnet simulation mode).
> 3. Zero breaking rewrites to frontend components or existing backend models.
> 4. All demo fallbacks are preserved so the UI functions seamlessly even if backend is offline.

### Proposed Implementation Phases:

#### Phase 1: Environment & Base Configuration Alignment
- Create `c:\ALGO FRONTEND\.env` with:
  ```properties
  VITE_API_BASE_URL=http://localhost:8000
  VITE_WS_URL=ws://localhost:8000/ws
  ```
- Ensure frontend reads `VITE_API_BASE_URL` properly without breaking fallback.

#### Phase 2: API Client Adapters in `src/services/api.js`
- Update `api.auth.login`: Map `{ email, password }` or `{ username, password }` to backend's `UserLoginRequest` (`/api/v1/auth/login`), and support response token mapping (`res.access_token || res.token`).
- Update `api.auth.signup`: Map `{ name, email, password }` to `/api/v1/auth/register` with `{ username: name, email, password }`.
- Update `api.health.check`: Call `/health` (backend root health check).
- Update `api.portfolio.getSummary`: Call `/api/v1/portfolio/summary`.
- Update `api.strategies`: Call `/api/v1/strategies`, map start/stop calls.
- Add `api.accounts`: Add wrappers for `/api/v1/accounts/validate` and `/api/v1/accounts/connect`.

#### Phase 3: Connect Account & Broker Modal Binding
- Wire [`BrokerConnectModal.jsx`](file:///C:/ALGO%20FRONTEND/src/components/common/BrokerConnectModal.jsx) to call `POST /api/v1/accounts/connect` when connecting Delta Exchange testnet keys, securely storing testnet credentials in the backend without exposing them to the browser.

#### Phase 4: Verification & End-to-End Validation
- Run backend and frontend concurrently.
- Test login, health probe in Settings tab, portfolio metrics synchronization, and strategy listing in the browser.

---

## 7. Approval Request
This concludes the architectural inspection and gap mapping. No code modifications or integrations have been performed.
Please review the findings and approve proceeding with the integration plan.
