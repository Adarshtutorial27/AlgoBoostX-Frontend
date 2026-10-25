"""Breakout-and-retest strategy."""
from typing import Dict, Any
from app.strategies.base import BaseStrategy, StrategySignalResult
from app.strategies.registry import StrategyRegistry

@StrategyRegistry.register
class BreakoutRetestStrategy(BaseStrategy):
    STRATEGY_ID="breakout_retest"; STRATEGY_NAME="Breakout and Retest"; STRATEGY_VERSION="1.0.0"
    DESCRIPTION="Detects a prior-range breakout followed by a retest and reclaim of the broken level."
    def validate_config(self,config:Dict[str,Any])->None:
        n=int(config.get("lookback",20))
        if not 3<=n<=200: raise ValueError("lookback must be 3–200")
    def compute_indicators(self,df):
        d=df.copy(); n=int(self._config.get("lookback",20))
        d["range_high"]=d.high.shift(2).rolling(n).max()
        d["range_low"]=d.low.shift(2).rolling(n).min()
        d["prior_close"]=d.close.shift(1)
        return d
    def generate_signal(self,df,instrument,timeframe="5m",has_open_long=False):
        n=int(self._config.get("lookback",20))
        if df.empty or len(df)<n+3:return None
        d=self.compute_indicators(df); p,c=d.iloc[-2],d.iloc[-1]
        level=float(c.range_high); lowlevel=float(c.range_low)
        buy=float(p.close)>level and float(c.low)<=level and float(c.close)>level
        sell=float(p.close)<lowlevel and float(c.high)>=lowlevel and float(c.close)<lowlevel
        typ="BUY" if buy and not has_open_long else "SELL" if sell and has_open_long else "HOLD"
        return StrategySignalResult(self.STRATEGY_ID,self.STRATEGY_VERSION,instrument,timeframe,int(c["time"]),typ,
          "Bullish breakout retest held" if typ=="BUY" else "Bearish breakdown retest rejected" if typ=="SELL" else "No confirmed retest",
          float(c.close),{"resistance":level,"support":lowlevel})
