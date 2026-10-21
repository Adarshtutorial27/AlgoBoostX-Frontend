import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Cpu,
  Sparkles,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Play,
  Save,
  HelpCircle,
  History,
  Activity,
  Layers,
} from 'lucide-react';
import { useTrading } from '../context/TradingContext';
import { useNotifications } from '../context/NotificationContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import { DemoBadge } from '../components/common/DemoBadge';

export const StrategyLabPage = () => {
  const { instruments, addStrategy } = useTrading();
  const { addToast } = useNotifications();
  const navigate = useNavigate();

  // Form State
  const [strategyName, setStrategyName] = useState('Neural Momentum Alpha v2.5');
  const [selectedInstrument, setSelectedInstrument] = useState('BTC/USDT');
  const [timeframe, setTimeframe] = useState('15m');
  const [indicators, setIndicators] = useState(['EMA 20/50', 'RSI 14', 'MACD', 'ATR Volatility']);
  const [entryCondition, setEntryCondition] = useState('RSI < 35 & EMA Cross Over with Volume Surge > 1.8x');
  const [exitCondition, setExitCondition] = useState('RSI > 70 or Trailing ATR Stop Triggered');
  const [stopLossPct, setStopLossPct] = useState(2.0);
  const [takeProfitPct, setTakeProfitPct] = useState(5.0);
  const [positionSizePct, setPositionSizePct] = useState(10);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const availableIndicators = [
    'EMA 20/50',
    'EMA 200 Trend Filter',
    'RSI 14',
    'MACD (12, 26, 9)',
    'Bollinger Bands (20, 2)',
    'ATR Volatility',
    'Volume Weighted Average Price (VWAP)',
    'SuperTrend',
    'Transformer Attention Wave',
  ];

  const handleToggleIndicator = (ind) => {
    if (indicators.includes(ind)) {
      setIndicators(indicators.filter((i) => i !== ind));
    } else {
      setIndicators([...indicators, ind]);
    }
  };

  const riskReward = (takeProfitPct / (stopLossPct || 1)).toFixed(2);

  const handleRunAiAnalysis = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      addToast({
        title: 'AI Rule Validation Completed',
        message: `Simulated validation scored rule clarity at 94/100 with optimal R:R ratio (${riskReward} : 1).`,
        type: 'success',
      });
    }, 1800);
  };

  const handleSaveStrategy = () => {
    const newStrat = {
      name: strategyName,
      description: `Automated trading model targeting ${selectedInstrument} on ${timeframe} timeframe with ${indicators.length} indicators.`,
      instrument: selectedInstrument,
      timeframe,
      indicators,
      riskLevel: stopLossPct <= 2.5 ? 'Moderate' : 'Aggressive',
    };
    addStrategy(newStrat);
    setIsSaved(true);
  };

  const handleRunBacktest = () => {
    navigate('/backtesting');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#090e1c] border border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-heading font-extrabold text-white tracking-wide">
              AI Strategy Lab & Architecture Studio
            </h1>
            <DemoBadge size="sm" />
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Configure algorithmic rules, mathematical indicators, and risk boundaries. (Simulated AI Engine)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRunAiAnalysis}
            isLoading={isAnalyzing}
            leftIcon={<Sparkles className="w-4 h-4 text-cyan-400" />}
          >
            Run Simulated AI Audit
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSaveStrategy}
            leftIcon={<Save className="w-4 h-4" />}
          >
            Save Strategy
          </Button>
        </div>
      </div>

      {/* Main Studio Grid: Left Studio Configuration, Right AI Panel */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column: Form & Indicator Configuration */}
        <div className="xl:col-span-2 space-y-6">
          <Card title="Strategy Parameters" subtitle="Define execution model properties" headerBadge={<DemoBadge size="xs" />}>
            <div className="space-y-4">
              {/* Strategy Name */}
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1.5">Strategy Name</label>
                <input
                  type="text"
                  value={strategyName}
                  onChange={(e) => setStrategyName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900/90 border border-white/[0.08] text-sm text-white focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              {/* Instrument & Timeframe Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1.5">Target Instrument</label>
                  <select
                    value={selectedInstrument}
                    onChange={(e) => setSelectedInstrument(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900/90 border border-white/[0.08] text-sm text-white focus:outline-none focus:border-cyan-500/50"
                  >
                    {instruments.map((i) => (
                      <option key={i.symbol} value={i.symbol}>
                        {i.symbol} ({i.name})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1.5">Execution Timeframe</label>
                  <select
                    value={timeframe}
                    onChange={(e) => setTimeframe(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900/90 border border-white/[0.08] text-sm text-white focus:outline-none focus:border-cyan-500/50"
                  >
                    <option value="1m">1 Minute (Ultra High Frequency)</option>
                    <option value="5m">5 Minutes (Scalping)</option>
                    <option value="15m">15 Minutes (Intraday Momentum)</option>
                    <option value="1h">1 Hour (Swing Trading)</option>
                    <option value="4h">4 Hours (Macro Trend)</option>
                    <option value="1D">1 Day (Position)</option>
                  </select>
                </div>
              </div>

              {/* Indicator Selector Chips */}
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-2">
                  Technical & Quantitative Indicators ({indicators.length} Selected)
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableIndicators.map((ind) => {
                    const isSelected = indicators.includes(ind);
                    return (
                      <button
                        key={ind}
                        type="button"
                        onClick={() => handleToggleIndicator(ind)}
                        className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                          isSelected
                            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-semibold'
                            : 'bg-white/[0.02] text-slate-400 border-white/[0.06] hover:text-white'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '}
                        {ind}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Entry & Exit Rules */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1.5">Entry Execution Rule</label>
                  <textarea
                    rows={3}
                    value={entryCondition}
                    onChange={(e) => setEntryCondition(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900/90 border border-white/[0.08] text-xs text-white font-mono focus:outline-none focus:border-cyan-500/50 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1.5">Exit Execution Rule</label>
                  <textarea
                    rows={3}
                    value={exitCondition}
                    onChange={(e) => setExitCondition(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900/90 border border-white/[0.08] text-xs text-white font-mono focus:outline-none focus:border-cyan-500/50 resize-none"
                  />
                </div>
              </div>

              {/* Risk Controls: Stop Loss, Take Profit, Sizing */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/[0.06]">
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">
                    Stop-Loss Limit (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.5"
                    max="10"
                    value={stopLossPct}
                    onChange={(e) => setStopLossPct(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-white/[0.08] text-sm font-mono font-bold text-rose-400"
                  />
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/[0.06]">
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">
                    Take-Profit Target (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="30"
                    value={takeProfitPct}
                    onChange={(e) => setTakeProfitPct(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-white/[0.08] text-sm font-mono font-bold text-emerald-400"
                  />
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/[0.06]">
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">
                    Position Allocation (%)
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    max="50"
                    value={positionSizePct}
                    onChange={(e) => setPositionSizePct(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-white/[0.08] text-sm font-mono font-bold text-cyan-400"
                  />
                </div>
              </div>

              {/* Bottom action trigger for backtest */}
              <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between">
                <div className="text-xs font-mono text-slate-400">
                  Calculated Risk/Reward Ratio: <span className="font-bold text-emerald-400">{riskReward} : 1</span>
                </div>
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleRunBacktest}
                  rightIcon={<History className="w-4 h-4" />}
                >
                  Run Strategy Backtest
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: AI Analysis & Validation Panel */}
        <div className="xl:col-span-1 space-y-6">
          <Card
            title="AI Strategy Copilot"
            subtitle="Rule validation & risk synthesis"
            headerBadge={<DemoBadge size="xs" />}
          >
            <div className="space-y-4">
              {/* Notice */}
              <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-300 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <span className="font-semibold">Simulated AI Verification:</span> Demonstrates real-time rule parsing and risk checks prior to backend deployment.
                </div>
              </div>

              {/* Analysis Progress / Status Card */}
              <div className="p-4 rounded-xl bg-slate-900/70 border border-white/[0.06] space-y-3">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">Model Convergence</span>
                  <span className="text-emerald-400 font-bold">96.8%</span>
                </div>
                <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full w-[96.8%]" />
                </div>
              </div>

              {/* Validation Checklist */}
              <div className="space-y-2.5">
                <div className="text-xs font-mono text-slate-400 uppercase tracking-wider">Rule Validation Summary</div>
                <div className="flex items-center gap-2.5 text-xs text-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Entry trigger logic is deterministic and free of lookahead bias.</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Risk/Reward ratio of {riskReward}:1 satisfies positive expectancy standard.</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Trailing ATR stop configured to prevent catastrophic flash drawdowns.</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-amber-300">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>High correlation with Bitcoin broad market swings on 15m timeframe.</span>
                </div>
              </div>

              {/* Current Configuration Summary */}
              <div className="pt-3 border-t border-white/[0.06] space-y-2 text-xs font-mono">
                <div className="text-slate-400 uppercase tracking-wider text-[10px]">Active Configuration</div>
                <div className="flex justify-between text-slate-300">
                  <span>Instrument:</span>
                  <span className="text-white font-bold">{selectedInstrument}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Timeframe:</span>
                  <span className="text-white font-bold">{timeframe}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Position Sizing:</span>
                  <span className="text-white font-bold">{positionSizePct}% of capital</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Backend State:</span>
                  <span className="text-amber-400 font-bold">READY FOR DEPLOYMENT</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StrategyLabPage;
