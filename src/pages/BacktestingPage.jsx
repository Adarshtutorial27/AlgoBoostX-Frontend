import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  History,
  Play,
  RotateCcw,
  TrendingUp,
  BarChart3,
  Calendar,
  DollarSign,
  ShieldAlert,
  Percent,
  CheckCircle2,
  Sparkles,
  Layers,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { useTrading } from '../context/TradingContext';
import { formatCurrency, formatPercent } from '../utils/formatters';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import { DemoBadge } from '../components/common/DemoBadge';
import { DEMO_BACKTEST_RESULTS } from '../data/demoData';

export const BacktestingPage = () => {
  const { strategies, instruments } = useTrading();

  // Inputs
  const [selectedStrategy, setSelectedStrategy] = useState(strategies[0]?.name || 'Neural Momentum Alpha');
  const [selectedInstrument, setSelectedInstrument] = useState('BTC/USDT');
  const [dateRange, setDateRange] = useState('YTD');
  const [initialCapital, setInitialCapital] = useState(50000);
  const [tradingFeePct, setTradingFeePct] = useState(0.04);

  // Execution states
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [hasRun, setHasRun] = useState(true);

  const results = DEMO_BACKTEST_RESULTS;

  const handleStartBacktest = () => {
    setIsRunning(true);
    setProgress(0);
    setHasRun(false);

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsRunning(false);
          setHasRun(true);
          return 100;
        }
        return prev + 15;
      });
    }, 180);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#090e1c] border border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-heading font-extrabold text-white tracking-wide">
              Quantitative Backtesting Engine
            </h1>
            <DemoBadge size="sm" />
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Simulate historical alpha against tick-level order book data with fee and slippage models.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            size="md"
            onClick={handleStartBacktest}
            isLoading={isRunning}
            leftIcon={<Play className="w-4 h-4 fill-slate-950" />}
          >
            Run Historical Backtest
          </Button>
        </div>
      </div>

      {/* Inputs Configuration Form */}
      <Card
        title="Simulation Parameters"
        subtitle="Configure historical sample window & capital parameters"
        headerBadge={<DemoBadge size="xs" />}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-xs font-mono text-slate-300 mb-1.5">Strategy</label>
            <select
              value={selectedStrategy}
              onChange={(e) => setSelectedStrategy(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/[0.08] text-xs text-white focus:outline-none focus:border-cyan-500/50"
            >
              {strategies.map((s) => (
                <option key={s.id} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-300 mb-1.5">Instrument</label>
            <select
              value={selectedInstrument}
              onChange={(e) => setSelectedInstrument(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/[0.08] text-xs text-white focus:outline-none focus:border-cyan-500/50"
            >
              {instruments.map((i) => (
                <option key={i.symbol} value={i.symbol}>
                  {i.symbol} ({i.name})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-300 mb-1.5">Date Range</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/[0.08] text-xs text-white focus:outline-none focus:border-cyan-500/50"
            >
              <option value="1M">Past 30 Days (High Granularity)</option>
              <option value="6M">Past 6 Months</option>
              <option value="YTD">Year to Date (Jan 2026 – Present)</option>
              <option value="1Y">1 Year Comprehensive</option>
              <option value="3Y">3 Year Multi-Regime</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-300 mb-1.5">Initial Capital ($)</label>
            <input
              type="number"
              step="5000"
              value={initialCapital}
              onChange={(e) => setInitialCapital(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/[0.08] text-xs font-mono text-white focus:outline-none focus:border-cyan-500/50"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-300 mb-1.5">Maker/Taker Fee (%)</label>
            <input
              type="number"
              step="0.01"
              value={tradingFeePct}
              onChange={(e) => setTradingFeePct(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/[0.08] text-xs font-mono text-white focus:outline-none focus:border-cyan-500/50"
            />
          </div>
        </div>

        {/* Running progress bar */}
        {isRunning && (
          <div className="mt-4 pt-4 border-t border-white/[0.06] space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-cyan-400">Processing Historical Ticks...</span>
              <span className="text-white font-bold">{progress}%</span>
            </div>
            <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </Card>

      {/* Results View */}
      {hasRun && (
        <div className="space-y-6">
          {/* Key Metric Summary Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="p-4 rounded-xl bg-slate-900/70 border border-white/[0.06]">
              <div className="text-[10px] text-slate-500 uppercase font-mono">Net Profit</div>
              <div className="text-xl font-bold text-emerald-400 font-mono mt-0.5">
                +${results.summary.netProfit.toLocaleString()}
              </div>
              <div className="text-[10px] text-emerald-400 font-mono">+{results.summary.totalReturn}% Return</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/70 border border-white/[0.06]">
              <div className="text-[10px] text-slate-500 uppercase font-mono">Win Rate</div>
              <div className="text-xl font-bold text-cyan-400 font-mono mt-0.5">
                {results.summary.winRate}%
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                {results.summary.winningTrades}W / {results.summary.losingTrades}L
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/70 border border-white/[0.06]">
              <div className="text-[10px] text-slate-500 uppercase font-mono">Profit Factor</div>
              <div className="text-xl font-bold text-white font-mono mt-0.5">
                {results.summary.profitFactor}
              </div>
              <div className="text-[10px] text-emerald-400 font-mono">Excellent (&gt;2.0)</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/70 border border-white/[0.06]">
              <div className="text-[10px] text-slate-500 uppercase font-mono">Max Drawdown</div>
              <div className="text-xl font-bold text-rose-400 font-mono mt-0.5">
                {results.summary.maxDrawdown}%
              </div>
              <div className="text-[10px] text-slate-400 font-mono">Within 10% tolerance</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/70 border border-white/[0.06]">
              <div className="text-[10px] text-slate-500 uppercase font-mono">Sharpe Ratio</div>
              <div className="text-xl font-bold text-amber-400 font-mono mt-0.5">
                {results.summary.sharpeRatio}
              </div>
              <div className="text-[10px] text-slate-400 font-mono">Risk-adjusted return</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/70 border border-white/[0.06]">
              <div className="text-[10px] text-slate-500 uppercase font-mono">Total Trades</div>
              <div className="text-xl font-bold text-slate-200 font-mono mt-0.5">
                {results.summary.totalTrades}
              </div>
              <div className="text-[10px] text-slate-400 font-mono">Avg: $480.20 / win</div>
            </div>
          </div>

          {/* Charts Row: Equity Curve & Drawdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card
              title="Simulated Equity Curve"
              subtitle="Capital accumulation across 342 historical trade executions"
              headerBadge={<DemoBadge size="xs" />}
            >
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={results.equityCurve} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="backtestEquity" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="trade" stroke="#64748b" fontSize={11} tickFormatter={(t) => `#${t}`} />
                    <YAxis
                      stroke="#64748b"
                      fontSize={11}
                      domain={['dataMin - 5000', 'dataMax + 5000']}
                      tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      formatter={(val) => [formatCurrency(val), 'Capital']}
                      labelFormatter={(label) => `Trade #${label}`}
                      contentStyle={{ backgroundColor: '#090e1c', borderColor: 'rgba(6,182,212,0.3)', borderRadius: '12px' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="equity"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#backtestEquity)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card
              title="Underwater Drawdown (%)"
              subtitle="Capital depth below peak equity across timeline"
              headerBadge={<DemoBadge size="xs" />}
            >
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={results.equityCurve} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                    <defs>
                      <linearGradient id="drawdownGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="trade" stroke="#64748b" fontSize={11} tickFormatter={(t) => `#${t}`} />
                    <YAxis stroke="#64748b" fontSize={11} domain={[0, 10]} tickFormatter={(v) => `-${v}%`} />
                    <Tooltip
                      formatter={(val) => [`-${val}%`, 'Drawdown']}
                      contentStyle={{ backgroundColor: '#090e1c', borderColor: 'rgba(244,63,94,0.3)', borderRadius: '12px' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="drawdown"
                      stroke="#f43f5e"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#drawdownGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* Monthly Performance & Trade Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card
              title="Monthly Performance Breakdown (%)"
              subtitle="Individual month return distribution"
              headerBadge={<DemoBadge size="xs" />}
            >
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={results.monthlyReturns} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} tickFormatter={(v) => `${v}%`} />
                    <Tooltip
                      formatter={(val) => [`${val > 0 ? '+' : ''}${val}%`, 'Return']}
                      contentStyle={{ backgroundColor: '#090e1c', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    />
                    <Bar
                      dataKey="return"
                      radius={[4, 4, 0, 0]}
                      fill="#06b6d4"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card
              title="Trade P&L Return Distribution"
              subtitle="Trade count across profitability buckets"
              headerBadge={<DemoBadge size="xs" />}
            >
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={results.tradeDistribution} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="range" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} />
                    <Tooltip
                      formatter={(val) => [`${val} Trades`, 'Volume']}
                      contentStyle={{ backgroundColor: '#090e1c', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]} fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* Disclaimer & Backend Note */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-white/[0.05] text-xs text-slate-400 leading-relaxed font-sans">
            <span className="font-semibold text-slate-300">Important Disclaimer:</span> Historical simulations are provided for educational and algorithmic modeling purposes. Past simulated performance does not guarantee future live returns. All metrics reflect simulated backtest logs with deterministic parameters.
          </div>
        </div>
      )}
    </div>
  );
};

export default BacktestingPage;
