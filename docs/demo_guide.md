# TokenIQ — Hackathon Demonstration Guide

This guide outlines the step-by-step walkthrough for hackathon evaluators and judges to verify all core functional requirements of the TokenIQ MVP.

---

## 1. Quick Launch (1 Command)

Open a terminal in `backend/` and run:

```bash
python run.py
```

The system will start up on `http://localhost:8000`:
- **Web Dashboard:** `http://localhost:8000/`
- **Swagger Interactive API:** `http://localhost:8000/docs`
- **Health Check Endpoint:** `http://localhost:8000/health`

---

## 2. Demonstration Scenarios

### Scenario A: End-to-End Automated Trading Workflow
1. Open the Dashboard at `http://localhost:8000/`.
2. Inspect the **System Overview** cards (Exchange Connected, Mark Price, EMA9, EMA21, Testnet Balance).
3. Click the green **Start Strategy** button.
4. Watch the trading loop execute cycles:
   - Historical candles are fetched and validated for timestamp freshness.
   - EMA 9 and EMA 21 indicators update dynamically on the chart.
   - When a crossover occurs, a `BUY` or `SELL` signal is generated.
   - The signal passes to the **Risk Management Engine**.
   - Upon approval, an order transitions from `PENDING_SUBMIT` ➔ `SUBMITTED` ➔ `FILLED`.
   - The position appears in the **Open Positions** tab with entry price and mark price.
   - On position close, realized P&L and fees are recorded in the **Trade History** tab.

### Scenario B: Risk Engine Rejection & Duplicate Prevention
1. When a `BUY` order is filled and a long position exists, the system evaluates the next candle.
2. If another `BUY` signal is generated, the Risk Engine intercepts it:
   - Check Rule: `DUPLICATE_POSITION`
   - Decision: **REJECTED**
   - Reason: `"Long position already open for BTCUSD; duplicate entry prevented"`
3. Click the **Strategy Signals** tab to observe the signal marked as `REJECTED` with the logged reason.
4. Check the **System Audit Events** tab to verify the permanent audit log.

### Scenario C: Emergency Stop Fail-Safe
1. Click the red **EMERGENCY STOP** button in the top navigation bar.
2. Confirm the prompt.
3. Observe the immediate changes:
   - A bright red emergency warning banner appears.
   - Strategy execution halts immediately.
   - Any proposed new orders are rejected with `"Emergency stop is ACTIVE"`.
   - The event is logged with severity `CRITICAL`.
4. Click **Reset Safety Switch** to return the system to operational readiness.

### Scenario D: Automated Test Suite Verification
Run the complete automated test suite (21 tests covering unit, risk, execution, PnL, and E2E):

```bash
pytest backend/tests -v
```

All 21 tests pass with 100% success rate.
