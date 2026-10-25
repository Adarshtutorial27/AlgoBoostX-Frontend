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
