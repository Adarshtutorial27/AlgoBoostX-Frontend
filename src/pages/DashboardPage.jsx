import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet,
  Briefcase,
  TrendingUp,
  Target,
  Calendar,
  RefreshCw,
  Eye,
  EyeOff,
  Link2,
  ChevronRight,
  PlusCircle,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  ShieldCheck,
  Lock,
  ExternalLink,
  Users,
  Cpu,
  Compass,
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
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatPercent } from '../utils/formatters';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import BrokerConnectModal from '../components/common/BrokerConnectModal';
import { api } from '../services/api';

export const DashboardPage = () => {
  const {
    user,
  } = useAuth();

  const [activeStrategiesList, setActiveStrategiesList] = useState([]);

  useEffect(() => {
    let isMounted = true;
    api.strategies.list().then((res) => {
      if (isMounted && Array.isArray(res)) {
        setActiveStrategiesList(res);
      }
    }).catch(() => {});
    return () => { isMounted = false; };
  }, []);

  const {
    isBrokerConnected,
    connectedAccounts,
    activeAccountStatus,
    selectedAccountId,
    setSelectedAccountId,
    realPortfolio,
    realPositions,
    realTrades,
    realPerformance,
    isSyncing,
    lastSyncTime,
    refreshRealData,
    showBalance,
    toggleShowBalance,
  } = useTrading();

  const navigate = useNavigate();

  // Timeframe and View Mode filters (Mirror Pip inspired)
  const [perfTimeframe, setPerfTimeframe] = useState('ALL');
  const [viewMode, setViewMode] = useState('pnl'); // 'pnl', 'daily', 'per_day'
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [customRange, setCustomRange] = useState({ start: '', end: '' });

  // Broker connection modal
  const [brokerModalOpen, setBrokerModalOpen] = useState(false);

  // Timeframe pill options
  const timeframes = ['1D', '1W', '1M', '3M', '6M', 'YTD', '1Y', 'ALL'];

  // Current active account determination
  const activeAccount = useMemo(() => {
    if (selectedAccountId === 'all') return null;
    return connectedAccounts.find((a) => a.account_id === selectedAccountId) || null;
  }, [connectedAccounts, selectedAccountId]);

  // Determine if a real broker/account is active
  const hasRealAccount = isBrokerConnected || connectedAccounts.length > 0 || (activeAccountStatus && activeAccountStatus.has_active_account);

  // Compute filtered trades and performance metrics based on timeframe
  const { filteredTrades, periodMetrics, chartData } = useMemo(() => {
    if (!realTrades || realTrades.length === 0) {
      // Empty baseline points for clean aesthetic
      const now = new Date();
      const points = [
        { time: 'Start', pnl: 0, dailyPnl: 0 },
        { time: 'Now', pnl: 0, dailyPnl: 0 },
      ];
      return {
        filteredTrades: [],
        periodMetrics: {
          totalTrades: 0,
          winningTrades: 0,
          losingTrades: 0,
          winRate: null,
          realizedPnl: 0,
          fees: 0,
          netPnl: 0,
        },
        chartData: points,
      };
    }

    const now = new Date();
    let cutoff = new Date(0); // Epoch default for 'ALL'

    if (customRange.start && customRange.end) {
      cutoff = new Date(customRange.start);
    } else {
      switch (perfTimeframe) {
        case '1D':
          cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '1W':
          cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '1M':
          cutoff = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
          break;
        case '3M':
          cutoff = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
          break;
        case '6M':
          cutoff = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
          break;
        case 'YTD':
          cutoff = new Date(now.getFullYear(), 0, 1);
          break;
        case '1Y':
          cutoff = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
          break;
        case 'ALL':
        default:
          cutoff = new Date(0);
          break;
      }
    }

    // Filter trades in range
    const inRange = realTrades.filter((t) => {
      const tDate = new Date(t.timestamp);
      return tDate >= cutoff && (!customRange.end || tDate <= new Date(customRange.end));
    });

    // Compute period stats
    let totalWin = 0;
    let totalLoss = 0;
    let totalRealized = 0;
    let totalFees = 0;

    // Build timeline points sorted chronologically
    const sorted = [...inRange].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    let runningPnl = 0;
    const dailyMap = {};

    sorted.forEach((t) => {
      const pnl = Number(t.realized_pnl) || 0;
      const fee = Number(t.fees) || 0;
      totalRealized += pnl;
      totalFees += fee;

      if (pnl > 0) totalWin += 1;
      else if (pnl < 0) totalLoss += 1;

      const dateKey = t.timestamp.split('T')[0];
      dailyMap[dateKey] = (dailyMap[dateKey] || 0) + pnl;
    });

    const timeline = [];
    let cumulative = 0;

    // Anchor initial zero
    if (sorted.length > 0) {
      timeline.push({
        time: 'Start',
        date: sorted[0].timestamp.split('T')[0],
        pnl: 0,
        dailyPnl: 0,
        tradesCount: 0,
      });
    }

    sorted.forEach((t) => {
      const pnl = Number(t.realized_pnl) || 0;
      cumulative += pnl;
      const d = new Date(t.timestamp);
      const label = `${d.toLocaleString('default', { month: 'short' })} '${d.getFullYear().toString().slice(2)}`;

      timeline.push({
        time: label,
        date: t.timestamp.split('T')[0],
        pnl: Number(cumulative.toFixed(2)),
        dailyPnl: Number(pnl.toFixed(2)),
        tradeId: t.trade_id,
        instrument: t.instrument,
      });
    });

    const totalCount = inRange.length;
    const winRate = totalCount > 0 ? (totalWin / totalCount) * 100 : null;

    return {
      filteredTrades: inRange,
      periodMetrics: {
        totalTrades: totalCount,
        winningTrades: totalWin,
        losingTrades: totalLoss,
        winRate: winRate !== null ? Number(winRate.toFixed(1)) : null,
        realizedPnl: Number(totalRealized.toFixed(2)),
        fees: Number(totalFees.toFixed(2)),
        netPnl: Number((totalRealized - totalFees).toFixed(2)),
      },
      chartData: timeline.length > 0 ? timeline : [{ time: 'No Data', pnl: 0, dailyPnl: 0 }],
    };
  }, [realTrades, perfTimeframe, customRange]);

  // Derived Summary Metric Card Values
  const balanceDisplay = useMemo(() => {
    if (!hasRealAccount) return '--';
    if (!showBalance) return '••••••••';
    if (realPortfolio && realPortfolio.total_balance_usd !== undefined) {
      return formatCurrency(realPortfolio.total_balance_usd);
    }
    return '--';
  }, [hasRealAccount, showBalance, realPortfolio]);

  const openPositionsDisplay = useMemo(() => {
    if (!hasRealAccount) return '--';
    const count = realPositions ? realPositions.length : (realPortfolio?.open_positions_count || 0);
    return `${count} Active`;
  }, [hasRealAccount, realPositions, realPortfolio]);

  const pnlDisplay = useMemo(() => {
    if (!hasRealAccount) return '--';
    // Use actual period realized PnL or overall realized P&L
    const val = periodMetrics.totalTrades > 0 ? periodMetrics.realizedPnl : (realPortfolio?.realized_pnl || 0);
    return `${val >= 0 ? '+' : ''}${formatCurrency(val)}`;
  }, [hasRealAccount, periodMetrics, realPortfolio]);

  const winRateDisplay = useMemo(() => {
    if (!hasRealAccount) return '--';
    if (periodMetrics.winRate !== null) {
      return `${periodMetrics.winRate}%`;
    }
    if (realPerformance && realPerformance.win_rate_pct !== undefined && realPerformance.total_trades > 0) {
      return `${realPerformance.win_rate_pct}%`;
    }
    return '--';
  }, [hasRealAccount, periodMetrics, realPerformance]);

  return (
    <div className="space-y-6">
      {/* 1. TOP SECTION: GREETING & FILTERS (MIRROR PIP REFERENCE) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* User Greeting */}
        <div>
          <h1 className="text-3xl font-heading font-black text-white tracking-tight">
            Hello, {user?.name ? user.name.split(' ')[0] : (user?.username || 'Trader')}
          </h1>
          <div className="flex items-center gap-2.5 mt-1 text-xs text-slate-400 font-mono">
            <span
              className={`w-2 h-2 rounded-full ${
                hasRealAccount ? 'bg-[#00FF66] shadow-[0_0_8px_#00FF66]' : 'bg-slate-500'
              }`}
            />
            <span className="text-slate-300 font-semibold">
              {hasRealAccount
                ? (activeAccount ? activeAccount.label : 'All Connected Accounts')
                : 'No Broker Account Linked'}
            </span>
            <span>•</span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-slate-300">
              {hasRealAccount ? 'DELTA TESTNET' : 'SANDBOX / UNLINKED'}
            </span>
          </div>
        </div>

        {/* Filter Controls on Right */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Account Selector Dropdown */}
          <div className="relative">
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="px-3.5 py-1.5 rounded-xl bg-[#090d16] border border-white/[0.08] text-xs font-mono text-slate-300 focus:outline-none focus:border-[#00FF66]/50 transition-all cursor-pointer"
            >
              <option value="all">
                All Accounts ({connectedAccounts.length})
              </option>
              {connectedAccounts.map((acc) => (
                <option key={acc.account_id} value={acc.account_id}>
                  {acc.label} ({acc.api_key_masked})
                </option>
              ))}
            </select>
          </div>

          {/* Date Picker Button */}
          <div className="relative">
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-mono transition-all flex items-center gap-2 ${
                customRange.start
                  ? 'bg-[#00FF66]/10 text-[#00FF66] border-[#00FF66]/40'
                  : 'bg-[#090d16] text-slate-300 border-white/[0.08] hover:border-white/[0.2]'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>
                {customRange.start ? `${customRange.start} → ${customRange.end}` : 'Select Dates'}
              </span>
            </button>

            {/* Custom Date Range Popover */}
            <AnimatePresence>
              {showDatePicker && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  className="absolute right-0 mt-2 p-4 rounded-2xl bg-[#090d16] border border-white/[0.1] shadow-2xl z-30 w-72 space-y-3"
                >
                  <div className="text-xs font-semibold text-white">Custom Historical Range</div>
                  <div className="space-y-2 text-xs font-mono">
                    <div>
                      <label className="text-[10px] text-slate-400">Start Date</label>
                      <input
                        type="date"
                        value={customRange.start}
                        onChange={(e) => setCustomRange((p) => ({ ...p, start: e.target.value }))}
                        className="w-full mt-1 px-2.5 py-1.5 rounded-lg bg-black/40 border border-white/[0.08] text-white focus:outline-none focus:border-[#00FF66]/50"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400">End Date</label>
                      <input
                        type="date"
                        value={customRange.end}
                        onChange={(e) => setCustomRange((p) => ({ ...p, end: e.target.value }))}
                        className="w-full mt-1 px-2.5 py-1.5 rounded-lg bg-black/40 border border-white/[0.08] text-white focus:outline-none focus:border-[#00FF66]/50"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
                    <button
                      onClick={() => {
                        setCustomRange({ start: '', end: '' });
                        setShowDatePicker(false);
                      }}
                      className="text-[11px] text-slate-400 hover:text-white"
                    >
                      Reset
                    </button>
                    <button
                      onClick={() => setShowDatePicker(false)}
                      className="px-3 py-1 rounded-lg bg-[#00FF66] text-black font-semibold text-xs"
                    >
                      Apply
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Timeframe Pills: 1D, 1W, 1M, 1Y, ALL */}
          <div className="flex items-center p-1 rounded-xl bg-[#090d16] border border-white/[0.08]">
            {timeframes.map((tf) => (
              <button
                key={tf}
                onClick={() => {
                  setPerfTimeframe(tf);
                  setCustomRange({ start: '', end: '' });
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-all ${
                  perfTimeframe === tf && !customRange.start
                    ? 'bg-white/[0.12] text-white border border-white/[0.2] font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Refresh / Sync Action */}
          <button
            onClick={refreshRealData}
            disabled={isSyncing}
            title={lastSyncTime ? `Last synced: ${lastSyncTime}` : 'Sync with live backend'}
            className="p-2 rounded-xl bg-[#090d16] border border-white/[0.08] hover:border-[#00FF66]/40 text-slate-400 hover:text-[#00FF66] transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-[#00FF66]' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. SUMMARY CARDS: 4 IN A ROW (MIRROR PIP EXACT LAYOUT) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Estimated Balance */}
        <div className="p-5 rounded-2xl bg-[#090d16] border border-white/[0.08] hover:border-white/[0.16] transition-all shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate-400">Estimated Balance</span>
              <div className="flex items-center gap-2">
                {hasRealAccount && (
                  <button
                    type="button"
                    onClick={toggleShowBalance}
                    className="text-slate-400 hover:text-white transition-colors p-1"
                    title={showBalance ? 'Hide balance' : 'Show balance'}
                  >
                    {showBalance ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                )}
                <div className="p-2 rounded-xl bg-white/[0.03] text-cyan-400">
                  <Wallet className="w-4 h-4" />
                </div>
              </div>
            </div>

            <div className="text-2xl font-bold font-mono text-white tracking-tight">
              {balanceDisplay}
            </div>

            <div className="mt-2 text-xs flex items-center gap-1.5">
              {hasRealAccount ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#00FF66]" />
                  <span className="text-slate-400 font-mono text-[11px]">
                    {activeAccount ? activeAccount.label : 'Active Delta Testnet Balance'}
                  </span>
                </>
              ) : (
                <button
                  onClick={() => setBrokerModalOpen(true)}
                  className="text-slate-400 hover:text-white flex items-center gap-1 text-[11px]"
                >
                  <PlusCircle className="w-3 h-3 text-[#00FF66]" />
                  <span>Connect broker to view balance</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Card 2: Open Position */}
        <div className="p-5 rounded-2xl bg-[#090d16] border border-white/[0.08] hover:border-white/[0.16] transition-all shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate-400">Open Position</span>
              <div className="p-2 rounded-xl bg-white/[0.03] text-[#00FF66]">
                <Briefcase className="w-4 h-4" />
              </div>
            </div>

            <div className="text-2xl font-bold font-mono text-white tracking-tight">
              {openPositionsDisplay}
            </div>

            <div className="mt-2 text-xs flex items-center gap-1.5">
              {hasRealAccount ? (
                <span className="text-slate-400 font-mono text-[11px]">
                  {realPortfolio?.unrealized_pnl !== undefined
                    ? `${realPortfolio.unrealized_pnl >= 0 ? '+' : ''}$${realPortfolio.unrealized_pnl.toFixed(2)} unrealized P&L`
                    : 'Reconciled with Delta Exchange'}
                </span>
              ) : (
                <button
                  onClick={() => setBrokerModalOpen(true)}
                  className="text-slate-400 hover:text-white flex items-center gap-1 text-[11px]"
                >
                  <span>Connect broker to view positions</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Card 3: P&L */}
        <div className="p-5 rounded-2xl bg-[#090d16] border border-white/[0.08] hover:border-white/[0.16] transition-all shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate-400">P&L</span>
              <div className="p-2 rounded-xl bg-white/[0.03] text-emerald-400">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>

            <div className={`text-2xl font-bold font-mono tracking-tight ${hasRealAccount ? 'text-[#00FF66]' : 'text-white'}`}>
              {pnlDisplay}
            </div>

            <div className="mt-2 text-xs flex items-center gap-1.5">
              {hasRealAccount ? (
                <span className="text-slate-400 font-mono text-[11px]">
                  {periodMetrics.totalTrades > 0
                    ? `Period Net: +$${periodMetrics.netPnl.toFixed(2)}`
                    : `Today: $${realPortfolio?.daily_realized_pnl || '0.00'}`}
                </span>
              ) : (
                <button
                  onClick={() => setBrokerModalOpen(true)}
                  className="text-slate-400 hover:text-white flex items-center gap-1 text-[11px]"
                >
                  <span>Connect broker to view P&L</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Card 4: Win Rate */}
        <div className="p-5 rounded-2xl bg-[#090d16] border border-white/[0.08] hover:border-white/[0.16] transition-all shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate-400">Win Rate</span>
              <div className="p-2 rounded-xl bg-white/[0.03] text-amber-400">
                <Target className="w-4 h-4" />
              </div>
            </div>

            <div className="text-2xl font-bold font-mono text-white tracking-tight">
              {winRateDisplay}
            </div>

            <div className="mt-2 text-xs text-slate-400 font-mono text-[11px]">
              {hasRealAccount && periodMetrics.totalTrades > 0 ? (
                <span>
                  All Closed Trades ({periodMetrics.winningTrades}W / {periodMetrics.losingTrades}L)
                </span>
              ) : (
                <span>All Closed Trades</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. PORTFOLIO PERFORMANCE & MIRROR LEADERS (MIRROR PIP REFERENCE LAYOUT) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Portfolio Performance Chart (col-span-2) */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-[#090d16] border border-white/[0.08] flex flex-col justify-between shadow-2xl">
          <div>
            {/* Header with Title & View Switcher Pills */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-slate-400" />
                <h3 className="font-heading font-bold text-white text-base">
                  Portfolio Performance
                </h3>
              </div>

              {/* View Mode Switcher Pills: P&L, Daily, Per Day */}
              <div className="flex items-center p-1 rounded-xl bg-black/40 border border-white/[0.06] text-xs font-mono">
                <button
                  onClick={() => setViewMode('pnl')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    viewMode === 'pnl'
                      ? 'bg-[#00FF66] text-black font-bold shadow-md shadow-[#00FF66]/20'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  P&L
                </button>
                <button
                  onClick={() => setViewMode('daily')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    viewMode === 'daily'
                      ? 'bg-[#00FF66] text-black font-bold shadow-md shadow-[#00FF66]/20'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Daily
                </button>
                <button
                  onClick={() => setViewMode('per_day')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    viewMode === 'per_day'
                      ? 'bg-[#00FF66] text-black font-bold shadow-md shadow-[#00FF66]/20'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Per Day
                </button>
              </div>
            </div>

            {/* Performance Chart */}
            <div className="h-64 w-full">
              {chartData.length > 0 && periodMetrics.totalTrades > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  {viewMode === 'pnl' ? (
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="pnlGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#00FF66" stopOpacity={0.35} />
                          <stop offset="100%" stopColor="#00FF66" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" vertical={false} />
                      <XAxis dataKey="time" stroke="#475569" fontSize={10} fontVariant="mono" />
                      <YAxis
                        stroke="#475569"
                        fontSize={10}
                        fontVariant="mono"
                        tickFormatter={(val) => `$${val}`}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="rounded-xl bg-[#080d19]/95 border border-[#00FF66]/30 p-2.5 shadow-2xl backdrop-blur-md text-xs font-mono">
                                <div className="text-slate-400 mb-1">{payload[0].payload.date || payload[0].payload.time}</div>
                                <div className="text-[#00FF66] font-semibold">
                                  Cumulative P&L: +{formatCurrency(payload[0].value)}
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="pnl"
                        stroke="#00FF66"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#pnlGrad)"
                      />
                    </AreaChart>
                  ) : (
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" vertical={false} />
                      <XAxis dataKey="time" stroke="#475569" fontSize={10} fontVariant="mono" />
                      <YAxis stroke="#475569" fontSize={10} fontVariant="mono" tickFormatter={(val) => `$${val}`} />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="rounded-xl bg-[#080d19]/95 border border-white/[0.1] p-2.5 shadow-2xl backdrop-blur-md text-xs font-mono">
                                <div className="text-slate-400 mb-1">{payload[0].payload.date || payload[0].payload.time}</div>
                                <div className="text-white font-semibold">
                                  Daily Delta: +{formatCurrency(payload[0].value)}
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="dailyPnl" fill="#00FF66" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              ) : (
                /* Honest Empty State matching reference image */
                <div className="h-full w-full flex flex-col items-center justify-center border border-dashed border-white/[0.08] rounded-2xl p-6 text-center">
                  <div className="p-3 rounded-2xl bg-white/[0.02] text-slate-500 mb-3">
                    <TrendingUp className="w-6 h-6 text-slate-600" />
                  </div>
                  <div className="text-sm font-semibold text-slate-300">
                    No closed trades recorded in this period
                  </div>
                  <p className="text-xs text-slate-500 max-w-sm mt-1">
                    Connect an account or execute orders to view institutional performance trajectories.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 mt-4 border-t border-white/[0.04] text-[11px] text-slate-500 font-mono">
            <span>Historical Net Realized Trajectory</span>
            <span>Delta Exchange Testnet Feed</span>
          </div>
        </div>

        {/* Right: Strategy Engine & Models Panel */}
        <div className="p-6 rounded-3xl bg-[#090d16] border border-white/[0.08] flex flex-col justify-between shadow-2xl">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-[#00FF66]" />
                <h3 className="font-heading font-bold text-white text-base">
                  Strategy Engine
                </h3>
              </div>
              <button
                onClick={() => navigate('/mirror-leaders')}
                className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-mono transition-colors"
              >
                <span>Strategy Hub</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-[#00FF66]/10 border border-[#00FF66]/20 text-[11px] text-slate-300 leading-relaxed">
                <span className="font-semibold text-white">Paper Engine Active:</span> {activeStrategiesList.length} genuine algorithmic models registered across Day, 1M, 3M, and 1Y timeframes.
              </div>

              <div className="space-y-2 pt-1">
                {activeStrategiesList.slice(0, 3).map((strat) => (
                  <div
                    key={strat.strategy_id}
                    className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center font-bold text-xs font-mono">
                        <Cpu className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-white truncate max-w-[130px]">
                          {strat.strategy_name}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {strat.category} • {strat.timeframe}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                          strat.enabled
                            ? 'bg-[#00FF66]/20 text-[#00FF66]'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {strat.enabled ? 'RUNNING' : 'STANDBY'}
                      </span>
                      <div className="text-[10px] text-slate-500 mt-0.5">Paper Mode</div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => navigate('/mirror-leaders')}
                className="w-full mt-3 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-medium text-white transition-all text-center flex items-center justify-center gap-1.5"
              >
                <span>Browse Strategy Hub (18 Models)</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-[#00FF66]" />
              </button>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 font-mono pt-4 border-t border-white/[0.04] flex items-center justify-between">
            <span>Execution: Paper Trading</span>
            <span className="text-[#00FF66]">Risk Engine Active</span>
          </div>
        </div>
      </div>

      {/* 4. ACTIVE OPEN POSITIONS TABLE */}
      <Card
        title="Open Market Positions"
        subtitle={
          hasRealAccount
            ? `Reconciled with ${activeAccount ? activeAccount.label : 'connected exchange accounts'}`
            : 'No broker connected to query positions'
        }
        headerAction={
          <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-slate-300">
            {realPositions.length} Open
          </span>
        }
      >
        {realPositions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-white/[0.06] text-slate-400 text-[11px]">
                  <th className="pb-3 font-medium">Instrument</th>
                  <th className="pb-3 font-medium">Size</th>
                  <th className="pb-3 font-medium">Entry Price</th>
                  <th className="pb-3 font-medium">Mark Price</th>
                  <th className="pb-3 font-medium">Unrealized P&L</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {realPositions.map((pos, idx) => (
                  <tr key={pos.id || idx} className="hover:bg-white/[0.02]">
                    <td className="py-3 font-bold text-white">{pos.symbol || pos.instrument || 'BTCUSD'}</td>
                    <td className="py-3 text-slate-300">{pos.size}</td>
                    <td className="py-3 text-slate-300">${pos.entry_price || pos.entryPrice}</td>
                    <td className="py-3 text-slate-300">${pos.mark_price || pos.currentPrice}</td>
                    <td className={`py-3 font-bold ${(pos.unrealized_pnl || 0) >= 0 ? 'text-[#00FF66]' : 'text-rose-400'}`}>
                      {(pos.unrealized_pnl || 0) >= 0 ? '+' : ''}${pos.unrealized_pnl || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-slate-400 text-xs font-mono">
            {hasRealAccount ? 'No open positions on active accounts.' : 'Connect a broker to view active positions.'}
          </div>
        )}
      </Card>

      {/* 5. CONNECTED BROKER ACCOUNTS & RECENT TRADES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Connected Broker Accounts Panel */}
        <Card
          title="Connected Accounts"
          subtitle="Direct Market Access (DMA) and multi-broker connections"
          headerAction={
            <Button
              variant="secondary"
              size="xs"
              onClick={() => setBrokerModalOpen(true)}
              leftIcon={<PlusCircle className="w-3.5 h-3.5 text-[#00FF66]" />}
            >
              Add Account
            </Button>
          }
        >
          <div className="space-y-3">
            {connectedAccounts.length > 0 ? (
              connectedAccounts.map((acc) => (
                <div
                  key={acc.account_id}
                  className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.08] flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#00FF66]/10 text-[#00FF66] border border-[#00FF66]/30 flex items-center justify-center font-bold text-xs font-mono">
                      DE
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-2">
                        <span>{acc.label}</span>
                        {acc.is_active && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#00FF66]/20 text-[#00FF66]">
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        Key: {acc.api_key_masked} • {acc.environment.toUpperCase()}
                      </div>
                    </div>
                  </div>

                  <span className="text-[11px] font-mono text-[#00FF66] flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Validated</span>
                  </span>
                </div>
              ))
            ) : (
              <div className="p-6 rounded-2xl bg-white/[0.01] border border-dashed border-white/[0.08] text-center space-y-2">
                <Link2 className="w-6 h-6 text-slate-500 mx-auto" />
                <div className="text-xs font-semibold text-slate-300">No Broker Accounts Connected</div>
                <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                  Link Delta Exchange Testnet API credentials to stream live account balances and positions.
                </p>
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => setBrokerModalOpen(true)}
                  className="mt-2"
                >
                  Connect Delta Testnet
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* Recent Closed Trades Audit */}
        <Card
          title="Recent Executed Trades"
          subtitle="Realized trade records persisted in SQLite database"
          headerAction={
            <button
              onClick={() => navigate('/history')}
              className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-mono transition-colors"
            >
              <span>Full History</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          }
        >
          {realTrades.length > 0 ? (
            <div className="divide-y divide-white/[0.04]">
              {realTrades.slice(0, 5).map((trd) => {
                const isBuy = trd.side?.toLowerCase() === 'buy';
                const pnl = Number(trd.realized_pnl) || 0;

                return (
                  <div key={trd.id || trd.trade_id} className="py-2.5 flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                          isBuy ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                        }`}
                      >
                        {isBuy ? 'B' : 'S'}
                      </div>
                      <div>
                        <div className="font-bold text-white">{trd.instrument}</div>
                        <div className="text-[10px] text-slate-500">{trd.timestamp ? trd.timestamp.replace('T', ' ').slice(0, 16) : ''}</div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className={`font-bold ${pnl >= 0 ? 'text-[#00FF66]' : 'text-rose-400'}`}>
                        {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}
                      </div>
                      <div className="text-[10px] text-slate-500">Fee: ${Number(trd.fees || 0).toFixed(2)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center text-slate-400 text-xs font-mono">
              No executed trades recorded in database yet.
            </div>
          )}
        </Card>
      </div>

      {/* Broker Modal */}
      {brokerModalOpen && (
        <BrokerConnectModal
          isOpen={brokerModalOpen}
          onClose={() => setBrokerModalOpen(false)}
        />
      )}
    </div>
  );
};

export default DashboardPage;
