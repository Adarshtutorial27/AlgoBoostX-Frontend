# AlgoBoostX — Strategy Inventory & Technical Catalogue

**Date:** October 2026  
**Auditor:** Quantitative Trading Systems Engineer  
**Workspace:** `c:\ALGO FRONTEND`

---

## 1. Executive Summary & Catalogue Summary

The workspace was scanned recursively to discover all prepared algorithmic strategies. Strategies were categorized into the four target timeframes:
1. **Day / 1D**: 6 genuine implementations found (6 of 6 target slots populated).
2. **1 Month**: 6 genuine implementations found (6 of 6 target slots populated).
3. **3 Months**: 1 genuine implementation found (1 of 6 target slots populated; 5 transparently marked missing).
4. **1 Year**: 5 genuine implementations found (5 of 6 target slots populated; 1 transparently marked missing).

**Total Genuine Strategies Found:** **18**  
**Total Target Slots:** **24**  
*In strict accordance with project rules, zero fake entries, simulated ROI numbers, or placeholder strategies have been generated to artificially fill empty slots.*

---

## 2. Category 1: Day / 1D Strategies (6 Genuine Implementations)

*Source Archive:* `c:\ALGO FRONTEND\1 day.zip` (`TradingStrategyBacktester/src/App.jsx`)  
*Evaluation Window:* Daily (1-day bars / 24-hour cycle)  
*Holding Horizon:* Exactly 1 following daily session (Intraday / 1-day hold)  
*Instruments:* BTC/USDT, ETH/USDT, SOL/USDT, Perpetual Futures  

### Strategy 1.1: EMA Trend (Day)
- **File Path:** `1 day.zip -> TradingStrategyBacktester/src/App.jsx`
- **Indicators:** 9-period Exponential Moving Average (Fast EMA), 21-period Exponential Moving Average (Slow EMA).
- **Entry Condition (BUY / OPEN_LONG):** `EMA(9, bar_i) > EMA(21, bar_i)` on completed daily candle `i`.
- **Exit Condition (SELL / CLOSE_LONG):** Close at next session close `i + 1` or when `EMA(9) <= EMA(21)`.
- **Parameters:** `fast_period: 9`, `slow_period: 21`, `alpha: 2 / (period + 1)`.
- **Runtime Compatibility:** Python adapter required for backend engine; logic easily maps to standard pandas/numpy.

### Strategy 1.2: RSI Oversold (Day)
- **File Path:** `1 day.zip -> TradingStrategyBacktester/src/App.jsx`
- **Indicators:** 14-period Relative Strength Index (RSI).
- **Entry Condition (BUY / OPEN_LONG):** `RSI(14, bar_i) < 30.0` (oversold bounce condition).
- **Exit Condition (SELL / CLOSE_LONG):** Close at end of following daily session `i + 1` or when `RSI >= 50.0`.
- **Parameters:** `rsi_period: 14`, `oversold_threshold: 30`.
- **Runtime Compatibility:** Standard RSI calculation; direct mapping to `pandas_ta` or native numpy calculations.

### Strategy 1.3: Bollinger Dip (Day)
- **File Path:** `1 day.zip -> TradingStrategyBacktester/src/App.jsx`
- **Indicators:** 20-period Simple Moving Average (mid), 20-period Standard Deviation (sd), Lower Band (`mid - 2 * sd`).
- **Entry Condition (BUY / OPEN_LONG):** Daily close price `p[i] < mid - 2 * sd` (penetration of 2-sigma lower band).
- **Exit Condition (SELL / CLOSE_LONG):** Close at end of following daily session `i + 1` or upon reclaim of `mid`.
- **Parameters:** `period: 20`, `num_std: 2.0`.
- **Runtime Compatibility:** Standard Bollinger Bands formulation; adapter ready.

### Strategy 1.4: 20-Period Breakout (Day)
- **File Path:** `1 day.zip -> TradingStrategyBacktester/src/App.jsx`
- **Indicators:** Rolling 20-bar highest high `max(p[i-20:i])`.
- **Entry Condition (BUY / OPEN_LONG):** Daily close `p[i] > max(p[i-20:i])` (Donchian-style upper channel breakout).
- **Exit Condition (SELL / CLOSE_LONG):** Close at end of following session `i + 1` or when price closes below 10-bar low.
- **Parameters:** `breakout_lookback: 20`.
- **Runtime Compatibility:** Compatible with backend breakout logic.

### Strategy 1.5: MACD Trend (Day)
- **File Path:** `1 day.zip -> TradingStrategyBacktester/src/App.jsx`
- **Indicators:** MACD Line (`EMA(12) - EMA(26)`), Signal Line (9-period average of MACD).
- **Entry Condition (BUY / OPEN_LONG):** `MACD Line > Signal Line` (bullish momentum expansion).
- **Exit Condition (SELL / CLOSE_LONG):** Close at end of following daily session `i + 1` or when `MACD Line <= Signal Line`.
- **Parameters:** `fast_ema: 12`, `slow_ema: 26`, `signal_period: 9`.
- **Runtime Compatibility:** Standard MACD; direct adapter implementation.

### Strategy 1.6: One-Day Reversal (Day)
- **File Path:** `1 day.zip -> TradingStrategyBacktester/src/App.jsx`
- **Indicators:** 1-day rate-of-change `p[i] / p[i-1] - 1`.
- **Entry Condition (BUY / OPEN_LONG):** `(p[i] / p[i-1] - 1) <= -0.015` (daily decline >= -1.5%).
- **Exit Condition (SELL / CLOSE_LONG):** Close at end of following daily session `i + 1`.
- **Parameters:** `drop_threshold_pct: -1.5% (-0.015)`.
- **Runtime Compatibility:** Simple, robust mean-reversion single-bar signal.

---

## 3. Category 2: 1 Month Strategies (6 Genuine Implementations)

*Source Archive:* `c:\ALGO FRONTEND\1 month stratergies.zip` & `1 month .zip` (`scratch/tokeniq/backend/app/strategies/`)  
*Evaluation Window:* 1 Month (30-day historical window)  
*Holding Horizon:* Swing (hours to several days)  
*Candle Timeframe:* 1-Hour (`1h`) or 15-Minute (`15m`)  
*Supported Instruments:* BTC/USDT, ETH/USDT, SOL/USDT  

### Strategy 2.1: Trend Following (1M)
- **File Path:** `1 month stratergies.zip -> scratch/tokeniq/backend/app/strategies/trend_following.py`
- **Indicators:** 9 EMA, 21 EMA on 1-hour candles.
- **Entry Condition (BUY):** Fast EMA crosses above Slow EMA (`fast_ema > slow_ema` and prior `fast_ema <= slow_ema`).
- **Exit Condition (SELL):** Fast EMA crosses below Slow EMA (`fast_ema < slow_ema`).
- **Parameters:** `fast_period: 9`, `slow_period: 21`, `timeframe: 1h`.
- **Runtime Compatibility:** Native Python strategy class subclassing `BaseStrategy`.

### Strategy 2.2: Liquidity Sweep (1M)
- **File Path:** `1 month stratergies.zip -> scratch/tokeniq/backend/app/strategies/liquidity_sweep.py`
- **Indicators:** 20-period swing high and swing low.
- **Entry Condition (BUY):** Candle low pierces below the 20-period swing low (`low < swing_low`), but candle close finishes back above the swing level (`close > swing_low`), indicating liquidity absorption/sweep.
- **Exit Condition (SELL):** Candle high pierces above 20-period swing high or trailing stop triggered.
- **Parameters:** `lookback: 20`, `confirmation_bars: 1`.
- **Runtime Compatibility:** Native Python strategy class ready for registry integration.

### Strategy 2.3: Breakout & Retest (1M)
- **File Path:** `1 month stratergies.zip -> scratch/tokeniq/backend/app/strategies/breakout_retest.py`
- **Indicators:** 24-period resistance level and subsequent retest tolerance band (0.5%).
- **Entry Condition (BUY):** Price broke above resistance level within last 3 bars and current bar low tests within 0.5% of broken level with bullish close.
- **Exit Condition (SELL):** Close below breakout retest support or take-profit target reached.
- **Parameters:** `resistance_lookback: 24`, `retest_tolerance_pct: 0.5%`.
- **Runtime Compatibility:** Native Python strategy class ready for registry integration.

### Strategy 2.4: Mean Reversion (1M)
- **File Path:** `1 month stratergies.zip -> scratch/tokeniq/backend/app/strategies/mean_reversion.py`
- **Indicators:** 20-period Bollinger Bands (2.0 standard deviations) + rolling mean.
- **Entry Condition (BUY):** Prior bar dipped below Lower Band, current bar closes back inside the band (`close > lower_band`).
- **Exit Condition (SELL):** Price touches or exceeds the 20-period SMA mid-band.
- **Parameters:** `period: 20`, `std_multiplier: 2.0`.
- **Runtime Compatibility:** Native Python strategy class ready for registry integration.

### Strategy 2.5: Momentum (1M)
- **File Path:** `1 month stratergies.zip -> scratch/tokeniq/backend/app/strategies/momentum.py`
- **Indicators:** 10-period Rate of Change (ROC), 50-period EMA trend filter.
- **Entry Condition (BUY):** `ROC(10) > 0` accelerating upwards while price is above `EMA(50)`.
- **Exit Condition (SELL):** `ROC(10) < 0` or price drops below `EMA(50)`.
- **Parameters:** `roc_period: 10`, `trend_filter_ema: 50`.
- **Runtime Compatibility:** Native Python strategy class ready for registry integration.

### Strategy 2.6: Volume Confirmed VWAP (1M)
- **File Path:** `1 month stratergies.zip -> scratch/tokeniq/backend/app/strategies/volume_confirmed_vwap.py`
- **Indicators:** Volume Weighted Average Price (VWAP), 20-period Volume Moving Average.
- **Entry Condition (BUY):** Price crosses above VWAP with bar volume exceeding 1.5x of the 20-period volume MA.
- **Exit Condition (SELL):** Price crosses below VWAP or trailing stop hit.
- **Parameters:** `volume_multiplier: 1.5`, `volume_ma_period: 20`.
- **Runtime Compatibility:** Native Python strategy class ready for registry integration.

---

## 4. Category 3: 3 Months Strategies (1 Genuine Implementation, 5 Missing)

*Source Archive:* `c:\ALGO FRONTEND\algoboostx_3month_strategy.zip` (`algoboostx_strategy/strategy.py`)  
*Evaluation Window:* 3 Months (90 days)  
*Holding Horizon:* Swing to Multi-Day  
*Candle Timeframe:* 4-Hour (`4h`)  
*Supported Instruments:* BTC/USDT, ETH/USDT  

### Strategy 3.1: SuperTrend EMA 200 (3M)
- **File Path:** `algoboostx_3month_strategy.zip -> algoboostx_strategy/strategy.py`
- **Indicators:** Average True Range (ATR 10, multiplier 3.0) SuperTrend + 200-period EMA baseline filter.
- **Entry Condition (BUY / OPEN_LONG):** Close above EMA(200) AND SuperTrend flips to bullish (+1 direction).
- **Exit Condition (SELL / CLOSE_LONG):** SuperTrend flips to bearish (-1 direction) or Stop Loss (`entry - 1.5 * ATR`) or Take Profit (`entry + 2.0 * R:R`) is triggered.
- **Parameters:** `atr_period: 10`, `multiplier: 3.0`, `ema_period: 200`, `risk_fraction: 0.005`, `stop_atr: 1.5`, `reward_risk: 2.0`.
- **Runtime Compatibility:** Implemented as a standalone class with `indicators()` and `backtest()`. Direct adapter created for `BaseStrategy`.

### Missing Slots in Category 3:
- **Slot 3.2**: Missing (unpopulated)
- **Slot 3.3**: Missing (unpopulated)
- **Slot 3.4**: Missing (unpopulated)
- **Slot 3.5**: Missing (unpopulated)
- **Slot 3.6**: Missing (unpopulated)
*Action:* Displayed transparently in the Strategy Hub as `[Missing Implementation - Unpopulated]` without generating fake performance.

---

## 5. Category 4: 1 Year Strategies (5 Genuine Implementations, 1 Missing)

*Source Archive:* `c:\ALGO FRONTEND\1 year stratergies.zip` & `stratergire of 1 year\TradingStrategyBacktester\src\App.jsx`  
*Evaluation Window:* 1 Year (252–365 daily sessions)  
*Holding Horizon:* Multi-week Position Trading  
*Candle Timeframe:* Daily (`1D`)  
*Supported Instruments:* BTC/USDT, ETH/USDT, Crypto Baskets  

### Strategy 4.1: Moving Average (1Y)
- **File Path:** `stratergire of 1 year/TradingStrategyBacktester/src/App.jsx`
- **Indicators:** 20-day Simple Moving Average (Fast), 50-day Simple Moving Average (Slow).
- **Entry Condition (BUY / OPEN_LONG):** `SMA(20, i) > SMA(50, i)` (Golden Cross long regime).
- **Exit Condition (SELL / CLOSE_LONG):** `SMA(20, i) <= SMA(50, i)`.
- **Parameters:** `fast_period: 20`, `slow_period: 50`.
- **Runtime Compatibility:** Standard position trend-following model.

### Strategy 4.2: Momentum (1Y)
- **File Path:** `stratergire of 1 year/TradingStrategyBacktester/src/App.jsx`
- **Indicators:** 126-day (approx 6-month) price momentum lookback.
- **Entry Condition (BUY / OPEN_LONG):** `p[i] > p[i - 126]` (positive 6-month intermediate-term momentum).
- **Exit Condition (SELL / CLOSE_LONG):** `p[i] <= p[i - 126]`.
- **Parameters:** `lookback: 126`.
- **Runtime Compatibility:** Standard intermediate momentum model.

### Strategy 4.3: Mean Reversion (1Y)
- **File Path:** `stratergire of 1 year/TradingStrategyBacktester/src/App.jsx`
- **Indicators:** 20-day rolling mean, 20-day standard deviation, Z-Score `(p[i] - mean) / sd`.
- **Entry Condition (BUY / OPEN_LONG):** `z_score < -2.0` (statistical oversold condition).
- **Exit Condition (SELL / CLOSE_LONG):** Reversion to mean `z_score >= 0.0`.
- **Parameters:** `lookback: 20`, `entry_z: -2.0`, `exit_z: 0.0`.
- **Runtime Compatibility:** Clean statistical mean reversion logic.

### Strategy 4.4: Range Breakout (1Y)
- **File Path:** `stratergire of 1 year/TradingStrategyBacktester/src/App.jsx`
- **Indicators:** 20-day high `max(p[i-20:i])`, 10-day low `min(p[i-10:i])`.
- **Entry Condition (BUY / OPEN_LONG):** `p[i] > high_20` (breakout above 20-day channel high).
- **Exit Condition (SELL / CLOSE_LONG):** `p[i] < low_10` (breakdown below 10-day channel low).
- **Parameters:** `entry_lookback: 20`, `exit_lookback: 10`.
- **Runtime Compatibility:** Donchian channel trend-following model.

### Strategy 4.5: Volatility-Targeted Trend (1Y)
- **File Path:** `stratergire of 1 year/TradingStrategyBacktester/src/App.jsx`
- **Indicators:** 20/50 SMA trend filter + 20-day annualized return volatility `vol = std(returns) * sqrt(252)`.
- **Entry Condition (BUY / OPEN_LONG):** `SMA(20) > SMA(50)`.
- **Position Sizing:** `exposure = min(1.0, 0.10 / vol)` (Targets constant 10% annualized volatility).
- **Exit Condition (SELL / CLOSE_LONG):** `SMA(20) <= SMA(50)`.
- **Parameters:** `fast_ma: 20`, `slow_ma: 50`, `target_vol: 0.10`, `annualization_factor: 252`.
- **Runtime Compatibility:** Sophisticated institutional volatility parity sizing model.

### Missing Slot in Category 4:
- **Slot 4.6**: Missing (unpopulated)
*Action:* Displayed transparently in the Strategy Hub as `[Missing Implementation - Unpopulated]`.
