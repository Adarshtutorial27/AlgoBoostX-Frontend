import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Cpu,
  Sparkles,
  Sliders,
  History,
  Play,
  Pause,
  Layers,
  ArrowRight,
  TrendingUp,
  ShieldAlert,
  ToggleLeft,
  ToggleRight,
  SlidersHorizontal,
} from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';
import { DemoBadge } from '../components/common/DemoBadge';
import { useTrading } from '../context/TradingContext';
import { useNotifications } from '../context/NotificationContext';
import { formatCurrency, formatPercent } from '../utils/formatters';

export const AiStrategiesPage = () => {
  const {
    aiStrategiesCatalog,
    togglePaperTrading,
    updateStrategyCatalog,
    instruments,
  } = useTrading();
  const { addToast } = useNotifications();
  const navigate = useNavigate();

  // Config modal state
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState(null);

  // Modal form fields
  const [tradingPair, setTradingPair] = useState('BTC/USDT');
  const [timeframe, setTimeframe] = useState('15m');
  const [positionSize, setPositionSize] = useState(15);
  const [stopLoss, setStopLoss] = useState(2.0);
  const [takeProfit, setTakeProfit] = useState(5.0);
  const [riskPerTrade, setRiskPerTrade] = useState(1.5);

  const handleOpenConfig = (strat) => {
    setSelectedStrategy(strat);
    setTradingPair(strat.tradingPair || 'BTC/USDT');
    setTimeframe(strat.timeframe || '15m');
    setPositionSize(strat.positionSize || 15);
    setStopLoss(strat.stopLoss || 2.0);
    setTakeProfit(strat.takeProfit || 5.0);
    setRiskPerTrade(strat.riskPerTrade || 1.5);
    setConfigModalOpen(true);
  };

  const handleSaveConfig = (e) => {
    e.preventDefault();
    if (!selectedStrategy) return;

    updateStrategyCatalog(selectedStrategy.id, {
      tradingPair,
      timeframe,
      positionSize,
      stopLoss,
      takeProfit,
      riskPerTrade,
    });
    setConfigModalOpen(false);
  };

  const handleBacktest = (strat) => {
    navigate('/backtesting');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-[#080c14] border border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-heading font-extrabold text-white tracking-tight">
              Algo boostX AI Strategies
            </h1>
            <DemoBadge size="sm" />
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Deploy autonomous algorithmic models, tweak risk boundaries, and configure paper trading.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/strategy-lab')}
            leftIcon={<Cpu className="w-4 h-4 text-[#00FF66]" />}
          >
            Custom Architecture Lab
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/backtesting')}
            rightIcon={<History className="w-4 h-4" />}
          >
            Run Backtests
          </Button>
        </div>
      </div>

      {/* Grid of 5 Strategy Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {aiStrategiesCatalog.map((strat) => {
          const isActive = strat.status === 'Active';

          return (
            <motion.div
              key={strat.id}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="rounded-3xl bg-[#090d16] border border-white/[0.08] hover:border-[#00FF66]/30 p-6 flex flex-col justify-between transition-all duration-200 shadow-xl group"
            >
              <div>
                {/* Header: Category, Status, Risk */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 px-2.5 py-1 rounded-md bg-white/[0.04]">
                    {strat.category}
                  </span>

                  <div className="flex items-center gap-2">
                    <Badge variant={strat.riskVariant || 'amber'} size="xs">
                      {strat.riskLabel}
                    </Badge>
                    <Badge variant={isActive ? 'green' : 'slate'} size="xs" dot>
                      {strat.status}
                    </Badge>
                  </div>
                </div>

                {/* Strategy Title & Explanation */}
                <h3 className="text-lg font-heading font-bold text-white group-hover:text-[#00FF66] transition-colors">
                  {strat.name}
                </h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  {strat.shortExplanation}
                </p>

                {/* Parameters Preview Grid */}
                <div className="grid grid-cols-2 gap-2.5 my-5 p-3 rounded-2xl bg-slate-900/60 border border-white/[0.05] text-xs font-mono">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase">Pair / TF</span>
                    <div className="text-white font-semibold mt-0.5">
                      {strat.tradingPair} • {strat.timeframe}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase">Win Rate</span>
                    <div className="text-[#00FF66] font-semibold mt-0.5">{strat.winRate}%</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase">Stop / Target</span>
                    <div className="text-slate-300 font-semibold mt-0.5">
                      -{strat.stopLoss}% / +{strat.takeProfit}%
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase">Max Risk/Trade</span>
                    <div className="text-cyan-300 font-semibold mt-0.5">{strat.riskPerTrade}%</div>
                  </div>
                </div>

                {/* Paper Trading Toggle */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] mb-4">
                  <div>
                    <div className="text-xs font-semibold text-white">Paper Trading Simulation</div>
                    <div className="text-[10px] text-slate-400">
                      {strat.isPaperTrading ? 'Zero risk demo execution' : 'Live backend DMA routing'}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => togglePaperTrading(strat.id)}
                    className="p-1 text-slate-300 hover:text-white transition-colors"
                  >
                    {strat.isPaperTrading ? (
                      <ToggleRight className="w-6 h-6 text-[#00FF66]" />
                    ) : (
                      <ToggleLeft className="w-6 h-6 text-slate-500" />
                    )}
                  </button>
                </div>
              </div>

              {/* Action Buttons: Configure & Backtest */}
              <div className="pt-4 border-t border-white/[0.06] flex items-center gap-3">
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleOpenConfig(strat)}
                  leftIcon={<Sliders className="w-3.5 h-3.5 text-[#00FF66]" />}
                >
                  Configure
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleBacktest(strat)}
                  leftIcon={<History className="w-3.5 h-3.5 text-cyan-400" />}
                >
                  Backtest
                </Button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Strategy Configuration Modal */}
      {configModalOpen && selectedStrategy && (
        <Modal
          isOpen={configModalOpen}
          onClose={() => setConfigModalOpen(false)}
          title={`Configure ${selectedStrategy.name}`}
          subtitle="Adjust execution parameters, stop-loss triggers, and risk per trade"
          maxWidth="max-w-lg"
        >
          <form onSubmit={handleSaveConfig} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1.5">Trading Pair</label>
                <select
                  value={tradingPair}
                  onChange={(e) => setTradingPair(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/[0.08] text-xs text-white focus:outline-none focus:border-[#00FF66]/50"
                >
                  {instruments.map((i) => (
                    <option key={i.symbol} value={i.symbol}>
                      {i.symbol}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1.5">Timeframe</label>
                <select
                  value={timeframe}
                  onChange={(e) => setTimeframe(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/[0.08] text-xs text-white focus:outline-none focus:border-[#00FF66]/50"
                >
                  <option value="1m">1m</option>
                  <option value="5m">5m</option>
                  <option value="15m">15m</option>
                  <option value="30m">30m</option>
                  <option value="1h">1h</option>
                  <option value="4h">4h</option>
                  <option value="1D">1D</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1.5">Position Size (% of Capital)</label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  max="100"
                  value={positionSize}
                  onChange={(e) => setPositionSize(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/[0.08] text-xs font-mono text-white focus:outline-none focus:border-[#00FF66]/50"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1.5">Max Risk Per Trade (%)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="10"
                  value={riskPerTrade}
                  onChange={(e) => setRiskPerTrade(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/[0.08] text-xs font-mono text-white focus:outline-none focus:border-[#00FF66]/50"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1.5">Stop Loss (%)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.5"
                  max="20"
                  value={stopLoss}
                  onChange={(e) => setStopLoss(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/[0.08] text-xs font-mono text-rose-400 focus:outline-none focus:border-rose-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1.5">Take Profit (%)</label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  max="50"
                  value={takeProfit}
                  onChange={(e) => setTakeProfit(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/[0.08] text-xs font-mono text-[#00FF66] focus:outline-none focus:border-[#00FF66]/50"
                />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-white/[0.05] text-xs font-mono text-slate-400">
              Expected Risk/Reward Ratio:{' '}
              <span className="text-[#00FF66] font-bold">{(takeProfit / (stopLoss || 1)).toFixed(2)} : 1</span>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
              <Button type="button" variant="ghost" size="sm" onClick={() => setConfigModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Save Parameters
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default AiStrategiesPage;
