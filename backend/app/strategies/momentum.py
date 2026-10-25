"""Rate-of-change momentum strategy."""
from typing import Dict, Any
from app.strategies.base import BaseStrategy, StrategySignalResult
from app.strategies.registry import StrategyRegistry

@StrategyRegistry.register
class MomentumStrategy(BaseStrategy):
    STRATEGY_ID="momentum"; STRATEGY_NAME="Momentum"; STRATEGY_VERSION="1.0.0"
    DESCRIPTION="Uses rate of change and an EMA filter to identify directional momentum."
    def validate_config(self,config:Dict[str,Any])->None:
        n=int(config.get("roc_period",10))
        if not 2<=n<=100: raise ValueError("roc_period must be 2–100")
    def compute_indicators(self,df):
        d=df.copy(); n=int(self._config.get("roc_period",10))
        d["momentum_roc"]=(d.close/d.close.shift(n)-1)*100
        d["momentum_ema"]=d.close.ewm(span=int(self._config.get("ema_period",20)),adjust=False).mean()
        return d
    def generate_signal(self,df,instrument,timeframe="5m",has_open_long=False):
        n=int(self._config.get("roc_period",10))
        if df.empty or len(df)<n+3:return None
        d=self.compute_indicators(df); p,c=d.iloc[-2],d.iloc[-1]
        buy=float(p.momentum_roc)<=0<float(c.momentum_roc) and float(c.close)>float(c.momentum_ema)
        sell=float(c.momentum_roc)<0 or float(c.close)<float(c.momentum_ema)
        typ="BUY" if buy and not has_open_long else "SELL" if sell and has_open_long else "HOLD"
        return StrategySignalResult(self.STRATEGY_ID,self.STRATEGY_VERSION,instrument,timeframe,int(c["time"]),typ,
          "Positive momentum confirmed above EMA" if typ=="BUY" else "Momentum weakened or price fell below EMA" if typ=="SELL" else "No momentum trigger",
          float(c.close),{"roc_percent":float(c.momentum_roc),"ema":float(c.momentum_ema)})
