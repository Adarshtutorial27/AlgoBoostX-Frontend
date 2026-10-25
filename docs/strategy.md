# TokenIQ — Strategy Specification: EMA Crossover

## 1. Strategy Overview

The primary strategy for the TokenIQ MVP is the **Exponential Moving Average (EMA) Crossover**.

An Exponential Moving Average applies greater weighting to recent price data compared to a Simple Moving Average (SMA), reducing lag and responding faster to changing market trends.

The strategy combines:
1. **Fast EMA (default: 9 periods):** Captures short-term momentum and price direction.
2. **Slow EMA (default: 21 periods):** Establishes the baseline intermediate trend.

---

## 2. Mathematical Definition

The EMA at time step $t$ for close price $P_t$ and smoothing factor $\alpha$ is:

$$\alpha = \frac{2}{N + 1}$$

$$EMA_t = \alpha \cdot P_t + (1 - \alpha) \cdot EMA_{t-1}$$

Where:
- $N_{fast} = 9 \implies \alpha_{fast} = \frac{2}{10} = 0.20$
- $N_{slow} = 21 \implies \alpha_{slow} = \frac{2}{22} \approx 0.0909$

---

## 3. Signal Generation Rules

Signal evaluation is performed strictly on **closed candles** to eliminate intrabar instability:

| Signal Type | Condition | Description |
|---|---|---|
| **BUY (Golden Cross)** | $EMA_{fast, t-1} \le EMA_{slow, t-1}$ and $EMA_{fast, t} > EMA_{slow, t}$ | Fast EMA crosses above Slow EMA from below |
| **SELL (Death Cross)** | $EMA_{fast, t-1} \ge EMA_{slow, t-1}$ and $EMA_{fast, t} < EMA_{slow, t}$ | Fast EMA crosses below Slow EMA from above |
| **HOLD (Neutral)** | Otherwise | No qualifying crossover occurred |

---

## 4. Signal Deduplication & Anti-Whipsaw Guards

- **Timestamp Guard:** The system caches the timestamp of the last evaluated candle. Even if the trading loop polls multiple times within the same 5-minute candle interval, the strategy engine emits a signal **only once per newly closed candle**.
- **Duplicate Position Guard:** The Risk Engine blocks a `BUY` signal if a long position is already open for the target instrument, avoiding over-leveraging during prolonged trends.
- **Stop-Loss / Take-Profit Integration:** Active positions are continuously monitored for exit triggers (-2.0% stop-loss, +4.0% take-profit).
