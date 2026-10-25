"""Bollinger-band mean reversion strategy."""
from typing import Dict, Any
import pandas as pd
from app.strategies.base import BaseStrategy, StrategySignalResult
from app.strategies.registry import StrategyRegistry

@StrategyRegistry.register
class MeanReversionStrategy(BaseStrategy):
    STRATEGY_ID="mean_reversion"; STRATEGY_NAME="Mean Reversion"; STRATEGY_VERSION="1.0.0"
    DESCRIPTION="Buys a lower-band reclaim and exits near the rolling mean or upper band."
    def validate_config(self,config:Dict[str,Any])->None:
        n=int(config.get("period",20)); k=float(config.get("stddev",2.0))
        if not 5<=n<=200 or not 0.5<=k<=4: raise ValueError("period must be 5–200 and stddev 0.5–4")
    def compute_indicators(self,df):
        d=df.copy(); n=int(self._config.get("period",20)); k=float(self._config.get("stddev",2.0))
        d["mr_mid"]=d.close.rolling(n).mean(); sd=d.close.rolling(n).std()
        d["mr_lower"]=d.mr_mid-k*sd; d["mr_upper"]=d.mr_mid+k*sd
        return d
    def generate_signal(self,df,instrument,timeframe="5m",has_open_long=False):
        n=int(self._config.get("period",20))
        if df.empty or len(df)<n+2:return None
        d=self.compute_indicators(df); p,c=d.iloc[-2],d.iloc[-1]
        buy=float(p.close)<=float(p.mr_lower) and float(c.close)>float(c.mr_lower)
        sell=float(c.close)>=float(c.mr_mid)
        typ="BUY" if buy and not has_open_long else "SELL" if sell and has_open_long else "HOLD"
        return StrategySignalResult(self.STRATEGY_ID,self.STRATEGY_VERSION,instrument,timeframe,int(c["time"]),typ,
          "Price reclaimed lower Bollinger band" if typ=="BUY" else "Mean reversion target reached" if typ=="SELL" else "No band-reclaim setup",
          float(c.close),{"band_mid":float(c.mr_mid),"band_lower":float(c.mr_lower),"band_upper":float(c.mr_upper)})
