# AlgoBoostX — Master Implementation Roadmap

**Date:** October 2026  
**Project:** AlgoBoostX Full-Stack Algorithmic Trading Platform  
**Target:** Hackathon Submission & Deployment Readiness  

---

## 1. Phased Execution Roadmap

### PHASE 1: Complete Workspace & Strategy Audit ✅ COMPLETED
- Full workspace scan, discovery of all 5 archives and existing directories.
- Identified 18 genuine strategies across 4 target timeframes (6 Day, 6 Month, 1 Three-Month, 5 Year).
- Pinpointed exact cause of broken login, missing API routes, and simulated market chart.
- Produced `docs/PROJECT_AUDIT.md`, `docs/STRATEGY_INVENTORY.md`, and `docs/API_INTEGRATION_MAP.md`.

---

### PHASE 2: Fix Login, Registration & API Contracts
- Unify backend routing: Mount `auth_router`, `portfolio_router`, and `accounts_router` onto the main FastAPI instance.
- Ensure `User` model is imported into `init_db()` so SQLite database creates `users` table with password hash and active flag.
- Verify PBKDF2 hashing, bearer token generation, `/me` profile resolution, and `/logout` token revocation.
- Add frontend route guard to `DashboardLayout.jsx` and `App.jsx` to protect trading workspace.
- Centralize API client in `src/services/api.js` to eliminate 404/422 mismatches.

---

### PHASE 3: Real Delta Exchange Live Market Graph
- Implement actual Delta Exchange public REST endpoints:
  - `/api/v1/exchange/products` (returns list of active perpetual futures like `BTCUSD`, `ETHUSD`, `SOLUSD`).
  - `/api/market/candles?symbol=...&resolution=...&limit=...` (fetches real historical OHLCV candles from Delta Testnet).
  - `/api/market/ticker?symbol=...` (fetches real 24h ticker, mark price, and 24h volume).
- Upgrade `InteractiveCandlestick.jsx` and `TradingTerminalPage.jsx` to use real candles instead of `generateCandles()` random data.
- Add feed connection indicator badges: `LIVE TESTNET`, `PAPER TRADING`, `DISCONNECTED`, `STALE DATA`.

---

### PHASE 4: Backend Strategy Engine & Adapter Integration
- Integrate all genuine strategies into the backend `StrategyRegistry`:
  - Day Strategies: EMA Trend, RSI Oversold, Bollinger Dip, 20-Period Breakout, MACD Trend, One-Day Reversal.
  - 1 Month Strategies: Trend Following, Liquidity Sweep, Breakout Retest, Mean Reversion, Momentum, Volume Confirmed VWAP.
  - 3 Months Strategy: SuperTrend EMA 200.
  - 1 Year Strategies: Moving Average, Momentum, Mean Reversion, Range Breakout, Volatility-Targeted Trend.
- Create clean adapters so every strategy evaluates incoming candles and outputs typed signals:
  `OPEN_LONG`, `CLOSE_LONG`, `OPEN_SHORT`, `CLOSE_SHORT`, `HOLD`.
- Enforce strict parameter validation and state isolation.

---

### PHASE 5: Repair Mirror Leaders into Strategy Discovery Hub
- Transform `MirrorLeadersPage.jsx` into a high-performance **Strategy Hub**:
  - Four timeframe tabs: `Day / 1D`, `1 Month`, `3 Months`, `1 Year`.
  - Strategy cards showing name, description, signal timeframe, evaluation horizon, parameters, verified status, and Start/Stop toggle.
  - Transparent badges for genuine implementations and unpopulated slots (no fake data or invented followers).
  - Modal with detailed logic, indicator rules, backtest runner, and signal log.

---

### PHASE 6: Real Signal Engine & Safe Paper Trading
- Wire the evaluation pipeline:
  `REAL CANDLE DATA -> DATA VALIDATION -> INDICATOR ENGINE -> STRATEGY EVALUATION -> BUY/SELL/HOLD SIGNAL -> RISK VALIDATION -> PAPER FILL -> RECONCILED POSITION & PnL`.
- Risk Engine checks: max order size, max exposure, daily loss limit, duplicate order prevention.
- Simulated paper execution: realistic fill price with slippage and maker/taker fee accounting.
- Live trading remains strictly disabled by default (`USE_LIVE_TESTNET=false`).

---

### PHASE 7: Connected Account Dashboard & Timeframe Filters
- Wire `DashboardPage.jsx` directly to `api.portfolio.getSummary()`, `api.accounts.list()`, and `api.portfolio.getTrades()`.
- Implement functional date filters (`1D`, `1W`, `1M`, `3M`, `6M`, `YTD`, `1Y`, `ALL`) that slice actual trade records and compute true realized P&L and win rates.
- Remove hardcoded demo fallback cards when real account data is present.

---

### PHASE 8: Backtesting Studio & Automated Testing
- Integrate historical backtesting runner with the genuine strategies.
- Run backend pytest test suites (`test_auth.py`, `test_risk_engine.py`, `test_strategies.py`, `test_execution.py`).
- Run frontend `npm run build` and `npm run lint` to guarantee clean build.

---

### PHASE 9 & 10: Submission Repository & Clean Deployment Prep
- Prepare clean repository structure (`algoboostx-submission/` or verified workspace).
- Create production Dockerfile, `docker-compose.yml`, `.env.example`, and comprehensive `README.md`.
- Inspect git status, prepare clean commit, and review with user before publishing.
