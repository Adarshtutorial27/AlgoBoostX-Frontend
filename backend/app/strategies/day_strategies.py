"""Genuine Day / 1D algorithmic strategies from TradingStrategyBacktester.

Every strategy operates on completed daily candles with single-session holding horizons.
Signals: BUY / OPEN_LONG, SELL / CLOSE_LONG, HOLD.
"""

from typing import Dict, Any, Optional
import numpy as np
import pandas as pd
from app.strategies.base import BaseStrategy, StrategySignalResult
from app.strategies.registry import strategy_registry


@strategy_registry.register
class EMATrendDayStrategy(BaseStrategy):
    STRATEGY_ID = "ema_trend_day"
    STRATEGY_NAME = "EMA Trend (Day)"
    STRATEGY_VERSION = "1.0.0"
    DESCRIPTION = "9-period EMA above 21-period EMA trend regime on completed daily candles."
    CATEGORY = "Day"
    TIMEFRAME = "1D"
    EVALUATION_WINDOW = "Daily"
    HOLDING_HORIZON = "1 Session (24h)"
    SUPPORTED_INSTRUMENTS = ["BTCUSD", "ETHUSD", "SOLUSD"]

    def validate_config(self, config: Dict[str, Any]) -> None:
        self.fast_period = int(config.get("fast_period", 9))
        self.slow_period = int(config.get("slow_period", 21))
        if self.fast_period >= self.slow_period:
            raise ValueError("Fast EMA period must be less than slow EMA period")

    def compute_indicators(self, df: pd.DataFrame) -> pd.DataFrame:
        df = df.copy()
        df["fast_ema"] = df["close"].ewm(span=self.fast_period, adjust=False).mean()
        df["slow_ema"] = df["close"].ewm(span=self.slow_period, adjust=False).mean()
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
        prev = df.iloc[-2]

        is_bullish = curr["fast_ema"] > curr["slow_ema"]
        was_bullish = prev["fast_ema"] > prev["slow_ema"]

        if is_bullish and not has_open_long:
            return StrategySignalResult(
                strategy_id=self.STRATEGY_ID,
                strategy_version=self.STRATEGY_VERSION,
                instrument=instrument,
                timeframe=timeframe,
                candle_timestamp=int(curr["time"]),
                signal_type="BUY",
                reason=f"Fast EMA ({curr['fast_ema']:.2f}) > Slow EMA ({curr['slow_ema']:.2f})",
                close_price=float(curr["close"]),
                indicators={"fast_ema": float(curr["fast_ema"]), "slow_ema": float(curr["slow_ema"])},
            )
        elif not is_bullish and has_open_long:
            return StrategySignalResult(
                strategy_id=self.STRATEGY_ID,
                strategy_version=self.STRATEGY_VERSION,
                instrument=instrument,
                timeframe=timeframe,
                candle_timestamp=int(curr["time"]),
                signal_type="SELL",
                reason=f"Fast EMA ({curr['fast_ema']:.2f}) dropped below Slow EMA ({curr['slow_ema']:.2f})",
                close_price=float(curr["close"]),
                indicators={"fast_ema": float(curr["fast_ema"]), "slow_ema": float(curr["slow_ema"])},
            )
        return StrategySignalResult(
            strategy_id=self.STRATEGY_ID,
            strategy_version=self.STRATEGY_VERSION,
            instrument=instrument,
            timeframe=timeframe,
            candle_timestamp=int(curr["time"]),
            signal_type="HOLD",
            reason="No actionable trend crossover signal",
            close_price=float(curr["close"]),
        )


@strategy_registry.register
class RSIOversoldDayStrategy(BaseStrategy):
    STRATEGY_ID = "rsi_oversold_day"
    STRATEGY_NAME = "RSI Oversold (Day)"
    STRATEGY_VERSION = "1.0.0"
    DESCRIPTION = "14-period RSI below 30 bounce entry on completed daily candles."
    CATEGORY = "Day"
    TIMEFRAME = "1D"
    EVALUATION_WINDOW = "Daily"
    HOLDING_HORIZON = "1 Session (24h)"
    SUPPORTED_INSTRUMENTS = ["BTCUSD", "ETHUSD", "SOLUSD"]

    def validate_config(self, config: Dict[str, Any]) -> None:
        self.period = int(config.get("period", 14))
        self.oversold = float(config.get("oversold", 30.0))

    def compute_indicators(self, df: pd.DataFrame) -> pd.DataFrame:
        df = df.copy()
        delta = df["close"].diff()
        gain = delta.clip(lower=0)
        loss = -delta.clip(upper=0)
        avg_gain = gain.rolling(window=self.period, min_periods=self.period).mean()
        avg_loss = loss.rolling(window=self.period, min_periods=self.period).mean()
        rs = avg_gain / avg_loss.replace(0, np.nan)
        df["rsi"] = 100 - (100 / (1 + rs))
        df["rsi"] = df["rsi"].fillna(50)
        return df

    def generate_signal(
        self,
        df: pd.DataFrame,
        instrument: str,
        timeframe: str,
        has_open_long: bool = False,
    ) -> Optional[StrategySignalResult]:
        if len(df) < self.period + 2:
            return None
        df = self.compute_indicators(df)
        curr = df.iloc[-1]
        rsi_val = float(curr["rsi"])

        if rsi_val < self.oversold and not has_open_long:
            return StrategySignalResult(
                strategy_id=self.STRATEGY_ID,
                strategy_version=self.STRATEGY_VERSION,
                instrument=instrument,
                timeframe=timeframe,
                candle_timestamp=int(curr["time"]),
                signal_type="BUY",
                reason=f"RSI({rsi_val:.1f}) is oversold below {self.oversold}",
                close_price=float(curr["close"]),
                indicators={"rsi": rsi_val},
            )
        elif has_open_long and rsi_val >= 50.0:
            return StrategySignalResult(
                strategy_id=self.STRATEGY_ID,
                strategy_version=self.STRATEGY_VERSION,
                instrument=instrument,
                timeframe=timeframe,
                candle_timestamp=int(curr["time"]),
                signal_type="SELL",
                reason=f"RSI({rsi_val:.1f}) recovered to neutral mean (>50)",
                close_price=float(curr["close"]),
                indicators={"rsi": rsi_val},
            )
        return StrategySignalResult(
            strategy_id=self.STRATEGY_ID,
            strategy_version=self.STRATEGY_VERSION,
            instrument=instrument,
            timeframe=timeframe,
            candle_timestamp=int(curr["time"]),
            signal_type="HOLD",
            reason="RSI within normal range",
            close_price=float(curr["close"]),
            indicators={"rsi": rsi_val},
        )


@strategy_registry.register
class BollingerDipDayStrategy(BaseStrategy):
    STRATEGY_ID = "bollinger_dip_day"
    STRATEGY_NAME = "Bollinger Dip (Day)"
    STRATEGY_VERSION = "1.0.0"
    DESCRIPTION = "Close below 20-period 2-sigma lower band daily dip entry."
    CATEGORY = "Day"
    TIMEFRAME = "1D"
    EVALUATION_WINDOW = "Daily"
    HOLDING_HORIZON = "1 Session (24h)"
    SUPPORTED_INSTRUMENTS = ["BTCUSD", "ETHUSD", "SOLUSD"]

    def validate_config(self, config: Dict[str, Any]) -> None:
        self.period = int(config.get("period", 20))
        self.num_std = float(config.get("num_std", 2.0))

    def compute_indicators(self, df: pd.DataFrame) -> pd.DataFrame:
        df = df.copy()
        df["bb_mid"] = df["close"].rolling(self.period).mean()
        df["bb_std"] = df["close"].rolling(self.period).std()
        df["bb_lower"] = df["bb_mid"] - self.num_std * df["bb_std"]
        df["bb_upper"] = df["bb_mid"] + self.num_std * df["bb_std"]
        return df

    def generate_signal(
        self,
        df: pd.DataFrame,
        instrument: str,
        timeframe: str,
        has_open_long: bool = False,
    ) -> Optional[StrategySignalResult]:
        if len(df) < self.period + 2:
            return None
        df = self.compute_indicators(df)
        curr = df.iloc[-1]
        close = float(curr["close"])
        lower = float(curr["bb_lower"])
        mid = float(curr["bb_mid"])

        if close < lower and not has_open_long:
            return StrategySignalResult(
                strategy_id=self.STRATEGY_ID,
                strategy_version=self.STRATEGY_VERSION,
                instrument=instrument,
                timeframe=timeframe,
                candle_timestamp=int(curr["time"]),
                signal_type="BUY",
                reason=f"Close ({close:.2f}) dipped below lower band ({lower:.2f})",
                close_price=close,
                indicators={"bb_lower": lower, "bb_mid": mid},
            )
        elif has_open_long and close >= mid:
            return StrategySignalResult(
                strategy_id=self.STRATEGY_ID,
                strategy_version=self.STRATEGY_VERSION,
                instrument=instrument,
                timeframe=timeframe,
                candle_timestamp=int(curr["time"]),
                signal_type="SELL",
                reason=f"Close ({close:.2f}) reverted back above mid-band ({mid:.2f})",
                close_price=close,
                indicators={"bb_lower": lower, "bb_mid": mid},
            )
        return StrategySignalResult(
            strategy_id=self.STRATEGY_ID,
            strategy_version=self.STRATEGY_VERSION,
            instrument=instrument,
            timeframe=timeframe,
            candle_timestamp=int(curr["time"]),
            signal_type="HOLD",
            reason="Inside Bollinger channel",
            close_price=close,
        )


@strategy_registry.register
class Breakout20DayStrategy(BaseStrategy):
    STRATEGY_ID = "breakout_20_day"
    STRATEGY_NAME = "20-Period Breakout (Day)"
    STRATEGY_VERSION = "1.0.0"
    DESCRIPTION = "Close above 20-bar daily channel high momentum breakout."
    CATEGORY = "Day"
    TIMEFRAME = "1D"
    EVALUATION_WINDOW = "Daily"
    HOLDING_HORIZON = "1 Session (24h)"
    SUPPORTED_INSTRUMENTS = ["BTCUSD", "ETHUSD", "SOLUSD"]

    def validate_config(self, config: Dict[str, Any]) -> None:
        self.lookback = int(config.get("lookback", 20))

    def compute_indicators(self, df: pd.DataFrame) -> pd.DataFrame:
        df = df.copy()
        df["high_20"] = df["close"].shift(1).rolling(self.lookback).max()
        df["low_10"] = df["close"].shift(1).rolling(10).min()
        return df

    def generate_signal(
        self,
        df: pd.DataFrame,
        instrument: str,
        timeframe: str,
        has_open_long: bool = False,
    ) -> Optional[StrategySignalResult]:
        if len(df) < self.lookback + 2:
            return None
        df = self.compute_indicators(df)
        curr = df.iloc[-1]
        close = float(curr["close"])
        high_20 = float(curr["high_20"])
        low_10 = float(curr["low_10"])

        if close > high_20 and not has_open_long:
            return StrategySignalResult(
                strategy_id=self.STRATEGY_ID,
                strategy_version=self.STRATEGY_VERSION,
                instrument=instrument,
                timeframe=timeframe,
                candle_timestamp=int(curr["time"]),
                signal_type="BUY",
                reason=f"Close ({close:.2f}) broke above 20-bar high ({high_20:.2f})",
                close_price=close,
                indicators={"high_20": high_20},
            )
        elif has_open_long and close < low_10:
            return StrategySignalResult(
                strategy_id=self.STRATEGY_ID,
                strategy_version=self.STRATEGY_VERSION,
                instrument=instrument,
                timeframe=timeframe,
                candle_timestamp=int(curr["time"]),
                signal_type="SELL",
                reason=f"Close ({close:.2f}) dropped below 10-bar exit low ({low_10:.2f})",
                close_price=close,
                indicators={"low_10": low_10},
            )
        return StrategySignalResult(
            strategy_id=self.STRATEGY_ID,
            strategy_version=self.STRATEGY_VERSION,
            instrument=instrument,
            timeframe=timeframe,
            candle_timestamp=int(curr["time"]),
            signal_type="HOLD",
            reason="Within 20-period price bounds",
            close_price=close,
        )


@strategy_registry.register
class MACDTrendDayStrategy(BaseStrategy):
    STRATEGY_ID = "macd_trend_day"
    STRATEGY_NAME = "MACD Trend (Day)"
    STRATEGY_VERSION = "1.0.0"
    DESCRIPTION = "MACD line above 9-period signal average on completed daily candles."
    CATEGORY = "Day"
    TIMEFRAME = "1D"
    EVALUATION_WINDOW = "Daily"
    HOLDING_HORIZON = "1 Session (24h)"
    SUPPORTED_INSTRUMENTS = ["BTCUSD", "ETHUSD", "SOLUSD"]

    def validate_config(self, config: Dict[str, Any]) -> None:
        self.fast = int(config.get("fast", 12))
        self.slow = int(config.get("slow", 26))
        self.signal = int(config.get("signal", 9))

    def compute_indicators(self, df: pd.DataFrame) -> pd.DataFrame:
        df = df.copy()
        ema_fast = df["close"].ewm(span=self.fast, adjust=False).mean()
        ema_slow = df["close"].ewm(span=self.slow, adjust=False).mean()
        df["macd_line"] = ema_fast - ema_slow
        df["macd_signal"] = df["macd_line"].ewm(span=self.signal, adjust=False).mean()
        df["macd_hist"] = df["macd_line"] - df["macd_signal"]
        return df

    def generate_signal(
        self,
        df: pd.DataFrame,
        instrument: str,
        timeframe: str,
        has_open_long: bool = False,
    ) -> Optional[StrategySignalResult]:
        if len(df) < self.slow + self.signal + 2:
            return None
        df = self.compute_indicators(df)
        curr = df.iloc[-1]
        prev = df.iloc[-2]

        is_bullish = curr["macd_line"] > curr["macd_signal"]

        if is_bullish and not has_open_long:
            return StrategySignalResult(
                strategy_id=self.STRATEGY_ID,
                strategy_version=self.STRATEGY_VERSION,
                instrument=instrument,
                timeframe=timeframe,
                candle_timestamp=int(curr["time"]),
                signal_type="BUY",
                reason=f"MACD line ({curr['macd_line']:.2f}) > signal ({curr['macd_signal']:.2f})",
                close_price=float(curr["close"]),
                indicators={"macd": float(curr["macd_line"]), "signal": float(curr["macd_signal"])},
            )
        elif not is_bullish and has_open_long:
            return StrategySignalResult(
                strategy_id=self.STRATEGY_ID,
                strategy_version=self.STRATEGY_VERSION,
                instrument=instrument,
                timeframe=timeframe,
                candle_timestamp=int(curr["time"]),
                signal_type="SELL",
                reason=f"MACD line dropped below signal line",
                close_price=float(curr["close"]),
                indicators={"macd": float(curr["macd_line"]), "signal": float(curr["macd_signal"])},
            )
        return StrategySignalResult(
            strategy_id=self.STRATEGY_ID,
            strategy_version=self.STRATEGY_VERSION,
            instrument=instrument,
            timeframe=timeframe,
            candle_timestamp=int(curr["time"]),
            signal_type="HOLD",
            reason="MACD neutral",
            close_price=float(curr["close"]),
        )


@strategy_registry.register
class OneDayReversalStrategy(BaseStrategy):
    STRATEGY_ID = "one_day_reversal_day"
    STRATEGY_NAME = "One-Day Reversal (Day)"
    STRATEGY_VERSION = "1.0.0"
    DESCRIPTION = "Single-session oversold drop >= -1.5% mean reversion bounce."
    CATEGORY = "Day"
    TIMEFRAME = "1D"
    EVALUATION_WINDOW = "Daily"
    HOLDING_HORIZON = "1 Session (24h)"
    SUPPORTED_INSTRUMENTS = ["BTCUSD", "ETHUSD", "SOLUSD"]

    def validate_config(self, config: Dict[str, Any]) -> None:
        self.drop_threshold = float(config.get("drop_threshold", -0.015))

    def compute_indicators(self, df: pd.DataFrame) -> pd.DataFrame:
        df = df.copy()
        df["pct_change"] = df["close"].pct_change()
        return df

    def generate_signal(
        self,
        df: pd.DataFrame,
        instrument: str,
        timeframe: str,
        has_open_long: bool = False,
    ) -> Optional[StrategySignalResult]:
        if len(df) < 3:
            return None
        df = self.compute_indicators(df)
        curr = df.iloc[-1]
        chg = float(curr["pct_change"])

        if chg <= self.drop_threshold and not has_open_long:
            return StrategySignalResult(
                strategy_id=self.STRATEGY_ID,
                strategy_version=self.STRATEGY_VERSION,
                instrument=instrument,
                timeframe=timeframe,
                candle_timestamp=int(curr["time"]),
                signal_type="BUY",
                reason=f"1-day return ({chg * 100:.2f}%) <= threshold ({self.drop_threshold * 100:.1f}%)",
                close_price=float(curr["close"]),
                indicators={"pct_change": chg},
            )
        elif has_open_long and chg >= 0.01:
            return StrategySignalResult(
                strategy_id=self.STRATEGY_ID,
                strategy_version=self.STRATEGY_VERSION,
                instrument=instrument,
                timeframe=timeframe,
                candle_timestamp=int(curr["time"]),
                signal_type="SELL",
                reason=f"Reversal target captured (+{chg * 100:.2f}%)",
                close_price=float(curr["close"]),
                indicators={"pct_change": chg},
            )
        return StrategySignalResult(
            strategy_id=self.STRATEGY_ID,
            strategy_version=self.STRATEGY_VERSION,
            instrument=instrument,
            timeframe=timeframe,
            candle_timestamp=int(curr["time"]),
            signal_type="HOLD",
            reason="Daily price fluctuation normal",
            close_price=float(curr["close"]),
        )
