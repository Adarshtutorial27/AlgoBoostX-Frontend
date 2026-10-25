"""Volume-confirmed VWAP strategy."""
from typing import Dict, Any
from app.strategies.base import BaseStrategy, StrategySignalResult
from app.strategies.registry import StrategyRegistry

@StrategyRegistry.register
class VolumeConfirmedVWAPStrategy(BaseStrategy):
    STRATEGY_ID="volume_confirmed_vwap"; STRATEGY_NAME="Volume-Confirmed VWAP"; STRATEGY_VERSION="1.0.0"
    DESCRIPTION="Signals on VWAP reclaim/loss only when volume exceeds its rolling average."
    def validate_config(self,config:Dict[str,Any])->None:
        n=int(config.get("volume_period",20)); m=float(config.get("volume_multiplier",1.2))
        if not 2<=n<=200 or not 0.5<=m<=5: raise ValueError("volume_period must be 2–200 and volume_multiplier 0.5–5")
    def compute_indicators(self,df):
        d=df.copy(); n=int(self._config.get("volume_period",20))
        typical=(d.high+d.low+d.close)/3
        vol=d.volume.clip(lower=0)
        d["vwap"]=(typical*vol).rolling(n).sum()/vol.rolling(n).sum().replace(0,float("nan"))
        d["volume_avg"]=vol.rolling(n).mean()
        return d
    def generate_signal(self,df,instrument,timeframe="5m",has_open_long=False):
        n=int(self._config.get("volume_period",20))
        if df.empty or len(df)<n+2 or "volume" not in df.columns:return None
        d=self.compute_indicators(df); p,c=d.iloc[-2],d.iloc[-1]
        vol_ok=float(c.volume)>=float(c.volume_avg)*float(self._config.get("volume_multiplier",1.2))
        buy=float(p.close)<=float(p.vwap) and float(c.close)>float(c.vwap) and vol_ok
        sell=float(p.close)>=float(p.vwap) and float(c.close)<float(c.vwap) and vol_ok
        typ="BUY" if buy and not has_open_long else "SELL" if sell and has_open_long else "HOLD"
        return StrategySignalResult(self.STRATEGY_ID,self.STRATEGY_VERSION,instrument,timeframe,int(c["time"]),typ,
          "VWAP reclaimed with above-average volume" if typ=="BUY" else "VWAP lost with above-average volume" if typ=="SELL" else "No volume-confirmed VWAP crossover",
          float(c.close),{"vwap":float(c.vwap),"volume":float(c.volume),"volume_average":float(c.volume_avg)})
