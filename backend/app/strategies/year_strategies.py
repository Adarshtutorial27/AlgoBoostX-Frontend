"""Genuine 1-Year Horizon Algorithmic Trading Strategies.

Origin: stratergire of 1 year / TradingStrategyBacktester
Preserving exact entry/exit mathematical formulas, indicators, and parameters.
Signals: BUY / OPEN_LONG, SELL / CLOSE_LONG, HOLD.
"""
from typing import Dict, Any, Optional
import numpy as np
import pandas as pd
from app.strategies.base import BaseStrategy, StrategySignalResult
from app.strategies.registry import strategy_registry


@strategy_registry.register
class MovingAverage1YStrategy(BaseStrategy):
    STRATEGY_ID = "moving_average_1y"
    STRATEGY_NAME = "Moving Average Golden Cross (1Y)"
    STRATEGY_VERSION = "1.0.0"
    DESCRIPTION = "1-Year macro trend strategy tracking 20-day vs 50-day SMA cross regime to capture major directional trends."
    CATEGORY = "1 Year"
    TIMEFRAME = "1d"
    EVALUATION_WINDOW = "1 Year"
    HOLDING_HORIZON = "1-3 Months"
    SUPPORTED_INSTRUMENTS = ["BTCUSD", "ETHUSD", "SOLUSD"]

    def validate_config(self, config: Dict[str, Any]) -> None:
        self.fast_period = int(config.get("fast_period", 20))
        self.slow_period = int(config.get("slow_period", 50))
        if self.fast_period >= self.slow_period:
            raise ValueError("Fast period must be less than slow period")

    def compute_indicators(self, df: pd.DataFrame) -> pd.DataFrame:
        df = df.copy()
        df["fast_sma"] = df["close"].rolling(window=self.fast_period, min_periods=self.fast_period).mean()
        df["slow_sma"] = df["close"].rolling(window=self.slow_period, min_periods=self.slow_period).mean()
        return df

    def generate_signal(
        self,
        df: pd.DataFrame,
        instrument: str,
        timeframe: str,
        has_open_long: bool = False,
    ) -> Optional[StrategySignalResult]:
        if len(df) < self.slow_period + 2:
            return None
        df = self.compute_indicators(df)
        curr = df.iloc[-1]
        close = float(curr["close"])
        fast = float(curr["fast_sma"]) if pd.notna(curr["fast_sma"]) else close
        slow = float(curr["slow_sma"]) if pd.notna(curr["slow_sma"]) else close
        time_val = int(curr["time"]) if "time" in curr else int(pd.Timestamp.now().timestamp())

        is_bullish = fast > slow

        if is_bullish and not has_open_long:
            return StrategySignalResult(
                strategy_id=self.STRATEGY_ID,
                strategy_version=self.STRATEGY_VERSION,
                instrument=instrument,
                timeframe=timeframe,
                candle_timestamp=time_val,
                signal_type="BUY",
                reason=f"Fast SMA ({fast:.2f}) crossed above Slow SMA ({slow:.2f})",
                close_price=close,
                indicators={"fast_sma": fast, "slow_sma": slow}
            )
        elif not is_bullish and has_open_long:
            return StrategySignalResult(
                strategy_id=self.STRATEGY_ID,
                strategy_version=self.STRATEGY_VERSION,
                instrument=instrument,
                timeframe=timeframe,
                candle_timestamp=time_val,
                signal_type="SELL",
                reason=f"Fast SMA ({fast:.2f}) dropped below Slow SMA ({slow:.2f})",
                close_price=close,
                indicators={"fast_sma": fast, "slow_sma": slow}
            )
        return None


@strategy_registry.register
class Momentum1YStrategy(BaseStrategy):
    STRATEGY_ID = "momentum_1y"
    STRATEGY_NAME = "Macro Momentum (1Y)"
    STRATEGY_VERSION = "1.0.0"
    DESCRIPTION = "1-Year momentum model assessing 126-bar price change to stay aligned with dominant macro cycles."
    CATEGORY = "1 Year"
    TIMEFRAME = "1d"
    EVALUATION_WINDOW = "1 Year"
    HOLDING_HORIZON = "3-6 Months"
    SUPPORTED_INSTRUMENTS = ["BTCUSD", "ETHUSD", "SOLUSD"]

    def validate_config(self, config: Dict[str, Any]) -> None:
        self.lookback = int(config.get("lookback", 126))

    def compute_indicators(self, df: pd.DataFrame) -> pd.DataFrame:
        df = df.copy()
        effective_lb = min(len(df) - 1, self.lookback) if len(df) > 1 else 1
        df["past_close"] = df["close"].shift(effective_lb)
        df["mom_pct"] = ((df["close"] - df["past_close"]) / df["past_close"]) * 100
        return df

    def generate_signal(
        self,
        df: pd.DataFrame,
        instrument: str,
        timeframe: str,
        has_open_long: bool = False,
    ) -> Optional[StrategySignalResult]:
        if len(df) < 10:
            return None
        df = self.compute_indicators(df)
        curr = df.iloc[-1]
        close = float(curr["close"])
        past_close = float(curr["past_close"]) if pd.notna(curr["past_close"]) else close
        mom_pct = float(curr["mom_pct"]) if pd.notna(curr["mom_pct"]) else 0.0
        time_val = int(curr["time"]) if "time" in curr else int(pd.Timestamp.now().timestamp())

        is_bullish = close > past_close

        if is_bullish and not has_open_long:
            return StrategySignalResult(
                strategy_id=self.STRATEGY_ID,
                strategy_version=self.STRATEGY_VERSION,
                instrument=instrument,
                timeframe=timeframe,
                candle_timestamp=time_val,
                signal_type="BUY",
                reason=f"Macro momentum positive (+{mom_pct:.2f}%) vs lookback close ({past_close:.2f})",
                close_price=close,
                indicators={"past_close": past_close, "mom_pct": mom_pct}
            )
        elif not is_bullish and has_open_long:
            return StrategySignalResult(
                strategy_id=self.STRATEGY_ID,
                strategy_version=self.STRATEGY_VERSION,
                instrument=instrument,
                timeframe=timeframe,
                candle_timestamp=time_val,
                signal_type="SELL",
                reason=f"Macro momentum turned negative ({mom_pct:.2f}%)",
                close_price=close,
                indicators={"past_close": past_close, "mom_pct": mom_pct}
            )
        return None


@strategy_registry.register
class MeanReversion1YStrategy(BaseStrategy):
    STRATEGY_ID = "mean_reversion_1y"
    STRATEGY_NAME = "Mean Reversion Z-Score (1Y)"
    STRATEGY_VERSION = "1.0.0"
    DESCRIPTION = "1-Year statistical mean reversion entering when 20-day standardized Z-score drops below -2.0 and closing at mean."
    CATEGORY = "1 Year"
    TIMEFRAME = "1d"
    EVALUATION_WINDOW = "1 Year"
    HOLDING_HORIZON = "1-4 Weeks"
    SUPPORTED_INSTRUMENTS = ["BTCUSD", "ETHUSD", "SOLUSD"]

    def validate_config(self, config: Dict[str, Any]) -> None:
        self.window = int(config.get("window", 20))
        self.entry_threshold = float(config.get("entry_threshold", -2.0))

    def compute_indicators(self, df: pd.DataFrame) -> pd.DataFrame:
        df = df.copy()
        df["mean"] = df["close"].rolling(window=self.window, min_periods=self.window).mean()
        df["std"] = df["close"].rolling(window=self.window, min_periods=self.window).std()
        df["z_score"] = (df["close"] - df["mean"]) / df["std"].replace(0, 1.0)
        return df

    def generate_signal(
        self,
        df: pd.DataFrame,
        instrument: str,
        timeframe: str,
        has_open_long: bool = False,
    ) -> Optional[StrategySignalResult]:
        if len(df) < self.window + 1:
            return None
        df = self.compute_indicators(df)
        curr = df.iloc[-1]
        close = float(curr["close"])
        z_score = float(curr["z_score"]) if pd.notna(curr["z_score"]) else 0.0
        mean_p = float(curr["mean"]) if pd.notna(curr["mean"]) else close
        time_val = int(curr["time"]) if "time" in curr else int(pd.Timestamp.now().timestamp())

        if z_score < self.entry_threshold and not has_open_long:
            return StrategySignalResult(
                strategy_id=self.STRATEGY_ID,
                strategy_version=self.STRATEGY_VERSION,
                instrument=instrument,
                timeframe=timeframe,
                candle_timestamp=time_val,
                signal_type="BUY",
                reason=f"Statistical oversold Z-score ({z_score:.2f} < {self.entry_threshold})",
                close_price=close,
                indicators={"z_score": z_score, "mean": mean_p}
            )
        elif z_score >= 0.0 and has_open_long:
            return StrategySignalResult(
                strategy_id=self.STRATEGY_ID,
                strategy_version=self.STRATEGY_VERSION,
                instrument=instrument,
                timeframe=timeframe,
                candle_timestamp=time_val,
                signal_type="SELL",
                reason=f"Mean reversion achieved: Z-score reverted to {z_score:.2f} >= 0.0",
                close_price=close,
                indicators={"z_score": z_score, "mean": mean_p}
            )
        return None


@strategy_registry.register
class RangeBreakout1YStrategy(BaseStrategy):
    STRATEGY_ID = "range_breakout_1y"
    STRATEGY_NAME = "Donchian Range Breakout (1Y)"
    STRATEGY_VERSION = "1.0.0"
    DESCRIPTION = "1-Year trend breakout entering when price exceeds 20-day high with trailing stop set at 10-day low."
    CATEGORY = "1 Year"
    TIMEFRAME = "1d"
    EVALUATION_WINDOW = "1 Year"
    HOLDING_HORIZON = "2-8 Weeks"
    SUPPORTED_INSTRUMENTS = ["BTCUSD", "ETHUSD", "SOLUSD"]

    def validate_config(self, config: Dict[str, Any]) -> None:
        self.entry_window = int(config.get("entry_window", 20))
        self.exit_window = int(config.get("exit_window", 10))

    def compute_indicators(self, df: pd.DataFrame) -> pd.DataFrame:
        df = df.copy()
        df["high_20"] = df["close"].shift(1).rolling(window=self.entry_window, min_periods=self.entry_window).max()
        df["low_10"] = df["close"].shift(1).rolling(window=self.exit_window, min_periods=self.exit_window).min()
        return df

    def generate_signal(
        self,
        df: pd.DataFrame,
        instrument: str,
        timeframe: str,
        has_open_long: bool = False,
    ) -> Optional[StrategySignalResult]:
        if len(df) < self.entry_window + 2:
            return None
        df = self.compute_indicators(df)
        curr = df.iloc[-1]
        close = float(curr["close"])
        high_20 = float(curr["high_20"]) if pd.notna(curr["high_20"]) else close
        low_10 = float(curr["low_10"]) if pd.notna(curr["low_10"]) else close
        time_val = int(curr["time"]) if "time" in curr else int(pd.Timestamp.now().timestamp())

        if close > high_20 and not has_open_long:
            return StrategySignalResult(
                strategy_id=self.STRATEGY_ID,
                strategy_version=self.STRATEGY_VERSION,
                instrument=instrument,
                timeframe=timeframe,
                candle_timestamp=time_val,
                signal_type="BUY",
                reason=f"20-day high breakout: close ({close:.2f}) > 20d High ({high_20:.2f})",
                close_price=close,
                indicators={"high_20": high_20, "low_10": low_10}
            )
        elif close < low_10 and has_open_long:
            return StrategySignalResult(
                strategy_id=self.STRATEGY_ID,
                strategy_version=self.STRATEGY_VERSION,
                instrument=instrument,
                timeframe=timeframe,
                candle_timestamp=time_val,
                signal_type="SELL",
                reason=f"Trailing exit hit: close ({close:.2f}) < 10d Low ({low_10:.2f})",
                close_price=close,
                indicators={"high_20": high_20, "low_10": low_10}
            )
        return None


@strategy_registry.register
class VolatilityTargetedTrend1YStrategy(BaseStrategy):
    STRATEGY_ID = "volatility_targeted_trend_1y"
    STRATEGY_NAME = "Volatility-Targeted Trend (1Y)"
    STRATEGY_VERSION = "1.0.0"
    DESCRIPTION = "1-Year trend strategy dynamically scaling position sizing to maintain a target 10% annualized volatility exposure."
    CATEGORY = "1 Year"
    TIMEFRAME = "1d"
    EVALUATION_WINDOW = "1 Year"
    HOLDING_HORIZON = "1-3 Months"
    SUPPORTED_INSTRUMENTS = ["BTCUSD", "ETHUSD", "SOLUSD"]

    def validate_config(self, config: Dict[str, Any]) -> None:
        self.fast_period = int(config.get("fast_period", 20))
        self.slow_period = int(config.get("slow_period", 50))
        self.target_vol = float(config.get("target_vol", 0.10))

    def compute_indicators(self, df: pd.DataFrame) -> pd.DataFrame:
        df = df.copy()
        df["fast_sma"] = df["close"].rolling(window=self.fast_period, min_periods=self.fast_period).mean()
        df["slow_sma"] = df["close"].rolling(window=self.slow_period, min_periods=self.slow_period).mean()
        returns = df["close"].pct_change()
        df["ann_vol"] = returns.rolling(window=self.fast_period, min_periods=5).std() * np.sqrt(252)
        return df

    def generate_signal(
        self,
        df: pd.DataFrame,
        instrument: str,
        timeframe: str,
        has_open_long: bool = False,
    ) -> Optional[StrategySignalResult]:
        if len(df) < self.slow_period + 2:
            return None
        df = self.compute_indicators(df)
        curr = df.iloc[-1]
        close = float(curr["close"])
        fast = float(curr["fast_sma"]) if pd.notna(curr["fast_sma"]) else close
        slow = float(curr["slow_sma"]) if pd.notna(curr["slow_sma"]) else close
        ann_vol = float(curr["ann_vol"]) if pd.notna(curr["ann_vol"]) and curr["ann_vol"] > 0 else 0.50
        vol_scalar = min(1.0, self.target_vol / ann_vol)
        time_val = int(curr["time"]) if "time" in curr else int(pd.Timestamp.now().timestamp())

        is_uptrend = fast > slow

        if is_uptrend and not has_open_long:
            return StrategySignalResult(
                strategy_id=self.STRATEGY_ID,
                strategy_version=self.STRATEGY_VERSION,
                instrument=instrument,
                timeframe=timeframe,
                candle_timestamp=time_val,
                signal_type="BUY",
                reason=f"Volatility-targeted uptrend (Fast SMA {fast:.2f} > Slow SMA {slow:.2f}, scalar: {vol_scalar*100:.1f}%)",
                close_price=close,
                indicators={"fast_sma": fast, "slow_sma": slow, "annualized_vol": ann_vol, "vol_scalar": vol_scalar}
            )
        elif not is_uptrend and has_open_long:
            return StrategySignalResult(
                strategy_id=self.STRATEGY_ID,
                strategy_version=self.STRATEGY_VERSION,
                instrument=instrument,
                timeframe=timeframe,
                candle_timestamp=time_val,
                signal_type="SELL",
                reason=f"Uptrend breakdown: Fast SMA {fast:.2f} <= Slow SMA {slow:.2f}",
                close_price=close,
                indicators={"fast_sma": fast, "slow_sma": slow, "annualized_vol": ann_vol}
            )
        return None
