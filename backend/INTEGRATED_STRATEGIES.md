# Integrated TokenIQ Strategies

This build combines the Trend-Following and Breakout-and-Retest packages.

## Strategies
- `sma_trend_following`
- `breakout_retest`

## Research APIs
- `/api/v1/research/monthly?symbol=BTCUSD` (trend research)
- `/api/v1/research/monthly?symbol=ETHUSD`
- `/api/v1/research/breakout-retest/monthly?symbol=BTCUSDT`
- `/api/v1/research/breakout-retest/monthly?symbol=ETHUSDT`

## Cryptography
The integrated `app/core/crypto_algorithms.py` provides SHA-256, HMAC-SHA256, secure tokens, and AES-256-GCM.

The research endpoints are read-only and use public market data when called. No live orders are submitted by the research endpoints.
