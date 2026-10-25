# Algo Boost X — Algorithmic Trading System

**Algo Boost X** is an enterprise-grade algorithmic trading platform engineered for **Delta Exchange Testnet**. It features a dynamic strategy plugin architecture, multi-account isolation with symmetric AES encryption at rest, a centralized decimal-precision risk engine, and an interactive real-time dashboard.

---

## Key Features

- **Delta Exchange India Testnet Integration**: Conforms to official Delta Exchange HMAC-SHA256 private authentication specifications (`cdn-ind.testnet.deltaex.org` and `testnet-api.delta.exchange`).
- **Strategy Plugin Architecture**: Pluggable strategies with standard metadata, typed configurations, deterministic signal generation, and historical backtesting.
- **Two Complete Algorithmic Strategies**:
  - **EMA Trend Crossover (`ema_crossover`)**: 9/21-period Golden Cross / Death Cross with ATR volatility stop multiplier and long-only position enforcement.
  - **RSI Mean Reversion (`rsi_mean_reversion`)**: 14-period Wilder-smoothed RSI oversold recovery entry and overbought exit.
- **Centralized Risk Engine (9 Strict Rules)**:
  - Global emergency stop kill switch
  - Real-time exchange connectivity gate
  - Market data freshness & monotonic timestamp validation
  - Non-actionable signal filtering
  - Persistent daily realized loss limit calculated from database `Trade` records across restarts
  - Maximum open order threshold (default: 3)
  - Duplicate position prevention (Long-only policy)
  - Maximum position exposure limit (default: 0.20 BTC)
  - Margin & balance verification before dispatch
- **Execution & Reconciliation Engine**: Two-phase order submission (`PENDING_SUBMIT` -> `SUBMITTED` -> `OPEN`/`FILLED`) with reconciliation and recovery for ambiguous network states.
- **Multi-Account Security & Isolation**: Per-user account separation with Fernet AES-128-CBC key encryption at rest and key masking (`api_...XXXX`).
- **Interactive Live Dashboard**: Built with Tailwind CSS, Chart.js, real-time metrics, order lifecycle tracking, strategy management, and backtest runner.

---

## Quick Start

### 1. Prerequisites
- Python 3.12+
- Windows, macOS, or Linux

### 2. Installation
```bash
cd backend
python -m venv .venv
# Windows:
.\.venv\Scripts\activate
# Linux/macOS:
source .venv/bin/activate

pip install -r requirements.txt
```

### 3. Running the Server
```bash
python run.py --port 8000
```
- **Dashboard UI**: [http://localhost:8000/](http://localhost:8000/)
- **Swagger Documentation**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Health Check**: [http://localhost:8000/health](http://localhost:8000/health)

### 4. Running the Test Suite
```bash
python -m pytest tests -v
```
*(All 73 unit and integration tests run offline without connecting to live exchange endpoints or submitting orders).*

---

## Configuration (`.env`)

| Variable | Default | Description |
|---|---|---|
| `APP_NAME` | `Algo Boost X` | Application identity |
| `APP_ENV` | `development` | Runtime environment |
| `DELTA_BASE_URL` | `https://cdn-ind.testnet.deltaex.org` | Delta Exchange Testnet REST endpoint |
| `DELTA_WS_URL` | `wss://socket-ind.testnet.deltaex.org` | Delta Exchange Testnet WebSocket |
| `USE_LIVE_TESTNET` | `false` | Enable live Testnet requests (`false` for sandbox) |
| `DEFAULT_INSTRUMENT` | `BTCUSD` | Primary trading pair |
| `DEFAULT_TIMEFRAME` | `5m` | Default candle resolution |
| `MAX_ORDER_QTY` | `0.05` | Maximum order size in BTC |
| `MAX_POSITION_EXPOSURE` | `0.20` | Maximum aggregate exposure in BTC |
| `MAX_OPEN_ORDERS` | `3` | Maximum simultaneous open orders |
| `DAILY_LOSS_LIMIT` | `500.0` | Maximum allowed daily loss in USD |
| `DATABASE_URL` | `sqlite:///./tokeniq.db` | Persistent database path |

---

## Strategy Plugin System

Algo Boost X uses an open plugin architecture. Every strategy inherits from `BaseStrategy` and registers automatically with `@StrategyRegistry.register`.

See the complete step-by-step guide in [docs/STRATEGY_GUIDE.md](docs/STRATEGY_GUIDE.md).

---

## Docker & Deployment

```bash
# Build Docker image
docker build -t algo-boost-x .

# Run container
docker run -p 8000:8000 --env-file .env algo-boost-x
```

See [render.yaml](render.yaml) for automated cloud deployments.
\n\n## Breakout-and-retest strategy\nSee `BREAKOUT_RETEST_RESEARCH.md` for strategy logic, cryptography utilities, monthly market research endpoints, and limitations.\n

---

# Breakout and Retest Strategy — TokenIQ

## What it does
The `breakout_retest` strategy looks for a candle closing above a prior rolling resistance level (bullish breakout) or below a prior rolling support level (bearish breakdown), followed by a later candle that revisits that original level and closes back on the breakout side. It emits BUY for a bullish retest when no long is open, SELL for a bearish retest when a long is open, and HOLD otherwise.

## Configuration
- `lookback`: prior candles used to define range (default 20; allowed 3–200)
- `retest_tolerance_pct`: allowed proximity around the level (default 0.003 = 0.3%; allowed 0.01%–5%)

## Monthly research API
- `GET /api/v1/research/breakout-retest/monthly?symbol=BTCUSDT`
- `GET /api/v1/research/breakout-retest/monthly?symbol=ETHUSDT`
- `GET /api/v1/research/breakout-retest/health`

The endpoint retrieves Binance Spot daily klines at request time, excludes the currently forming candle, and reports the latest 30 complete candles, price change, volatility, drawdown, SMA-7, SMA-30, RSI-14, and historical breakout/retest counts. Network access is required; no price series is hardcoded or fabricated.

## Cryptography utilities
`app/core/crypto_algorithms.py` provides SHA-256 fingerprints, HMAC-SHA256 generation/constant-time verification, secure random tokens, and AES-GCM authenticated encryption. AES keys must be 16, 24, or 32 bytes. Never reuse a nonce with the same AES-GCM key. Keep keys in environment-managed secrets and do not log keys or plaintext. SHA-256 is not a password hashing function.

## Safety and limitations
This is a research signal, not a prediction or guarantee. Breakouts can fail; candle-only data cannot establish actual exchange order-book liquidity. The monthly endpoint is read-only and does not submit orders. Backtest with fees, slippage, out-of-sample data, and position sizing before considering any deployment.


---

# TokenIQ: cryptography + trend-following research

## Added features
- `app/core/crypto_algorithms.py`: SHA-256 integrity digest, HMAC-SHA256 create/constant-time verify, AES-256-GCM authenticated encryption, secure token generation.
- `app/strategies/trend_following.py`: strategy plugin registered as `sma_trend_following` with SMA-7/SMA-30 crossover signals.
- `app/services/monthly_trend_research.py`: fetches public Binance daily OHLCV, validates candles, calculates SMA-7/SMA-30, RSI-14, ATR-14, volatility, drawdown and a cost-aware trend backtest.
- `app/api/v1/trend_research.py`: read-only monthly research endpoints.

## Run
From `backend/`:
```bash
python -m pip install -r requirements.txt
python -m pytest tests/unit/test_crypto_algorithms.py tests/unit/test_monthly_trend_research.py -q
uvicorn app.main:app --reload
```

Open `http://127.0.0.1:8000/docs`.

## API
- `GET /api/v1/research/monthly?symbol=BTCUSD`
- `GET /api/v1/research/monthly?symbol=ETHUSD`
- Optional `fee_bps` and `slippage_bps` query parameters (each 0–500).
- `GET /api/v1/research/monthly/health`

The endpoint uses Binance public market data at request time. It fetches up to 60 daily candles so the 30-day evaluation window can use earlier candles for moving-average warm-up; the response contains the latest 30 complete daily candles. Network availability, exchange data availability, and provider rate limits can affect requests. No market prices are fabricated or bundled as live data.

## Security
Never commit `.env` or exchange credentials. AES-GCM keys must be exactly 32 random bytes and must be managed outside source control. Never reuse a nonce with the same AES-GCM key. HMAC keys must be secret and sufficiently random. SHA-256 is not a password-hashing algorithm. Existing exchange authentication and Fernet vault logic are intentionally left unchanged.

## Research caveats
This endpoint is read-only and never submits orders. The trend strategy is long-only and illustrative. Fees and slippage are configurable assumptions; results are historical and do not imply future profitability. Use paper trading and inspect assumptions before considering any live execution.
