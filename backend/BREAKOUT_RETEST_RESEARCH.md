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
