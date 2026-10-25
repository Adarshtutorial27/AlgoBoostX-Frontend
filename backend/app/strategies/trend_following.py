"""EMA trend-following strategy."""
from typing import Optional, Dict, Any
import pandas as pd
from app.strategies.base import BaseStrategy, StrategySignalResult
from app.strategies.registry import StrategyRegistry

@StrategyRegistry.register
class TrendFollowingStrategy(BaseStrategy):
    STRATEGY_ID = "trend_following"
    STRATEGY_NAME = "Trend Following"
    STRATEGY_VERSION = "1.0.0"
    DESCRIPTION = "Trades aligned fast/slow EMA trends with a close-price confirmation."

    def validate_config(self, config: Dict[str, Any]) -> None:
        fast, slow = int(config.get("fast_period", 20)), int(config.get("slow_period", 50))
        if fast < 2 or slow <= fast: raise ValueError("Require 2 <= fast_period < slow_period")

    def compute_indicators(self, df):
        d=df.copy()
        d["trend_fast"]=d["close"].ewm(span=int(self._config.get("fast_period",20)),adjust=False).mean()
        d["trend_slow"]=d["close"].ewm(span=int(self._config.get("slow_period",50)),adjust=False).mean()
        return d

    def generate_signal(self, df, instrument, timeframe="5m", has_open_long=False):
        if df.empty or len(df)<max(3,int(self._config.get("slow_period",50))): return None
        d=self.compute_indicators(df); p,c=d.iloc[-2],d.iloc[-1]
        buy=p.trend_fast<=p.trend_slow and c.trend_fast>c.trend_slow and c.close>c.trend_slow
        sell=p.trend_fast>=p.trend_slow and c.trend_fast<c.trend_slow
        typ="BUY" if buy and not has_open_long else "SELL" if sell and has_open_long else "HOLD"
        return StrategySignalResult(self.STRATEGY_ID,self.STRATEGY_VERSION,instrument,timeframe,int(c["time"]),typ,
            "Bullish EMA trend crossover" if typ=="BUY" else "Bearish EMA trend crossover" if typ=="SELL" else "No confirmed trend change",
            float(c.close),{"fast_ema":round(float(c.trend_fast),6),"slow_ema":round(float(c.trend_slow),6)})
