"""Liquidity sweep strategy using recent swing highs/lows."""
from typing import Dict, Any
from app.strategies.base import BaseStrategy, StrategySignalResult
from app.strategies.registry import StrategyRegistry

@StrategyRegistry.register
class LiquiditySweepStrategy(BaseStrategy):
    STRATEGY_ID="liquidity_sweep"; STRATEGY_NAME="Liquidity Sweep"; STRATEGY_VERSION="1.0.0"
    DESCRIPTION="Looks for a wick through a recent swing level followed by a close back inside."
    def validate_config(self, config: Dict[str, Any]) -> None:
        n=int(config.get("lookback",20))
        if not 3<=n<=200: raise ValueError("lookback must be 3–200")
    def compute_indicators(self,df):
        d=df.copy(); n=int(self._config.get("lookback",20))
        d["prior_high"]=d["high"].shift(1).rolling(n).max()
        d["prior_low"]=d["low"].shift(1).rolling(n).min()
        return d
    def generate_signal(self,df,instrument,timeframe="5m",has_open_long=False):
        n=int(self._config.get("lookback",20))
        if df.empty or len(df)<n+2:return None
        d=self.compute_indicators(df); c=d.iloc[-1]
        buy=float(c.low)<float(c.prior_low) and float(c.close)>float(c.prior_low)
        sell=float(c.high)>float(c.prior_high) and float(c.close)<float(c.prior_high)
        typ="BUY" if buy and not has_open_long else "SELL" if sell and has_open_long else "HOLD"
        return StrategySignalResult(self.STRATEGY_ID,self.STRATEGY_VERSION,instrument,timeframe,int(c["time"]),typ,
          "Downside liquidity sweep reclaimed" if typ=="BUY" else "Upside liquidity sweep rejected" if typ=="SELL" else "No confirmed liquidity sweep",
          float(c.close),{"swing_high":float(c.prior_high),"swing_low":float(c.prior_low)})
