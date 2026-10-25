# TokenIQ — Architecture Specification

## 1. System Overview

TokenIQ is an autonomous algorithmic trading system designed for the Delta Exchange Testnet Hackathon. The system implements a deterministic, multi-layered pipeline:

```
[Market Data Stream]
         │
         ▼
[Market Data Service] ──► (Validates Timestamps & Deduplicates Candles)
         │
         ▼
[Strategy Engine]     ──► (Calculates Fast/Slow EMA & Evaluates Crossover)
         │
         ▼ (Signal: BUY / SELL / HOLD)
[Risk Engine]         ──► (8 Pre-Execution Risk Checks & Limits Enforcement)
         │
         ▼ (Approved: True, Allowed Quantity)
[Execution Engine]    ──► (State Machine: PENDING_SUBMIT ➔ FILLED / RECONCILING)
         │
         ▼ (Exchange Confirmation)
[Position Manager]    ──► (Authoritative Sync with Exchange & PnL Realization)
         │
         ▼
[Monitoring & UI]     ──► (FastAPI REST APIs, System Events, Real-time Dashboard)
```

---

## 2. Component Specifications

### 2.1 Exchange Adapter (`app/exchange/`)
- **HMAC-SHA256 Signing:** Generates valid authentication headers for Delta Exchange REST API (`api-key`, `timestamp`, `signature`).
- **Sanitized Logging:** Filters out API keys, secrets, and authorization payloads from console and log outputs.
- **Dual-Mode Engine:** Supports live Delta Exchange Testnet endpoints (`https://cdn-ind.testnet.delta.exchange`) as well as a full local simulation engine for automated offline testing and evaluation.

### 2.2 Market Data Service (`app/services/market_data.py`)
- Ingests historical OHLCV candles.
- Validates timestamp monotonicity and rejects out-of-order candles.
- Detects stale market data using `MAX_DATA_AGE_SECONDS`.
- Deduplicates signals using candle close timestamps so the same candle is never processed twice.

### 2.3 Strategy Engine (`app/services/strategy_engine.py`)
- Implements an Exponential Moving Average (EMA) crossover strategy (default: Fast EMA 9, Slow EMA 21).
- Evaluates signals exclusively on **closed candles** to eliminate intrabar repainting and noise.
- Generates `BUY` (Golden Cross), `SELL` (Death Cross), or `HOLD`.
- Records indicator values, timestamps, and close prices into the `signals` database table.

### 2.4 Risk Management Engine (`app/services/risk_engine.py`)
Deterministic 8-tier safety validation before order placement:
1. **Emergency Stop Switch:** Checks global thread-safe emergency flag.
2. **Exchange Connectivity Check:** Halts trading if exchange health is degraded.
3. **Market Freshness Check:** Blocks orders if candle data is stale.
4. **Actionable Signal Filter:** Disregards neutral / HOLD signals.
5. **Daily Realized Loss Threshold:** Halts execution if realized losses breach `DAILY_LOSS_LIMIT`.
6. **Maximum Open Orders:** Prevents queueing more than `MAX_OPEN_ORDERS`.
7. **Duplicate Position Guard:** Rejects orders in the direction of an already open position.
8. **Maximum Exposure Limit:** Ensures `current_size + proposed_order <= MAX_POSITION_EXPOSURE`.
9. **Account Margin & Balance Validation:** Verifies available wallet balance.

### 2.5 Execution Engine (`app/services/execution_engine.py`)
- Transforms approved signals into exchange-compliant order requests.
- Enforces lifecycle state machine:
  `PENDING_SUBMIT` ➔ `SUBMITTED` ➔ `OPEN` ➔ `PARTIALLY_FILLED` ➔ `FILLED` / `REJECTED` / `CANCELLED`
- **Ambiguous Response Handling:** If an API call times out or returns HTTP 5xx, the order is marked `RECONCILING` and the engine queries the exchange before any retry, avoiding double execution.

### 2.6 Position Manager (`app/services/position_manager.py`)
- Exchange-authoritative position reconciliation.
- Computes realized P&L when closing or reversing positions.
- Computes unrealized P&L from mark prices.
- Automated Stop-Loss (`STOP_LOSS_PCT`, default: -2.0%) and Take-Profit (`TAKE_PROFIT_PCT`, default: +4.0%) monitoring.

### 2.7 Storage & Persistence Layer (`app/database.py` & `app/models/`)
- Relational SQLite database using SQLAlchemy ORM.
- Persists:
  - `signals`: Full history of generated signals with indicator values and risk decisions.
  - `orders`: Order lifecycle records with exchange IDs and execution statuses.
  - `trades`: Executed trade fills, fee records, and realized P&L.
  - `positions`: Live authoritative positions snapshot.
  - `system_events`: Audit trail for connectivity events, risk rejections, and emergency stops.

---

## 3. Threat Model & Failure Mitigation

| Failure Scenario | Mitigation Strategy |
|---|---|
| **Exchange API Timeout** | Order transitions to `RECONCILING`. Blind resubmission is blocked until the order is reconciled with exchange records. |
| **Network Disconnection** | Trading loop detects ping failure, sets `exchange_connected = False`, and blocks new order placement until revalidated. |
| **Market Data Stale / Frozen** | `MAX_DATA_AGE_SECONDS` check blocks signal generation and logs a `STALE_DATA` risk rejection event. |
| **Runaway Loss Event** | Real-time tracking of `daily_realized_pnl` halts new order placement when breaching `DAILY_LOSS_LIMIT`. |
| **Operator Intervention** | Dedicated `POST /api/v1/emergency-stop` endpoint stops the trading loop and locks the risk engine. |
