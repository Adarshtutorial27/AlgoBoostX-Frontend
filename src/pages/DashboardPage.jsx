import React from 'react';
import { motion } from 'framer-motion';
import {
  Wallet,
  TrendingUp,
  Cpu,
  Layers,
  Award,
  ShieldAlert,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';
import { useTrading } from '../context/TradingContext';
import { formatCurrency, formatPercent } from '../utils/formatters';
import SummaryCard from '../components/dashboard/SummaryCard';
import WatchlistPanel from '../components/dashboard/WatchlistPanel';
import RecentTradesPanel from '../components/dashboard/RecentTradesPanel';
import ActiveStrategiesPanel from '../components/dashboard/ActiveStrategiesPanel';
import RiskMonitoringPanel from '../components/dashboard/RiskMonitoringPanel';
import InteractiveCandlestick from '../components/charts/InteractiveCandlestick';
import PerformanceAreaChart from '../components/charts/PerformanceAreaChart';
import Card from '../components/common/Card';
import { DemoBadge } from '../components/common/DemoBadge';
import { DEMO_PORTFOLIO_PERFORMANCE_HISTORY } from '../data/demoData';

export const DashboardPage = () => {
  const { portfolio, selectedInstrument, selectedSymbol } = useTrading();

  return (
    <div className="space-y-6">
      {/* Top Banner Notice */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-slate-900/60 to-emerald-950/40 border border-cyan-500/20 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-white tracking-wide">
                ALGO BOOSTX QUANTITATIVE OVERVIEW
              </h1>
              <DemoBadge size="xs" />
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Simulated institutional algorithms running on simulated exchange feeds. Ready for backend API integration.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-300 shrink-0">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>ALGO ENGINE: v2.4 ONLINE</span>
        </div>
      </div>

      {/* 6 Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <SummaryCard
          title="Portfolio Balance"
          value={formatCurrency(portfolio.totalBalance)}
          change={`+${portfolio.todayPnlPercent}%`}
          changeLabel="24h"
          isPositive={true}
          icon={Wallet}
          delay={0.05}
        />
        <SummaryCard
          title="Today's P&L"
          value={`+${formatCurrency(portfolio.todayPnl)}`}
          change="+3.32%"
          changeLabel="vs open"
          isPositive={true}
          icon={TrendingUp}
          delay={0.1}
        />
        <SummaryCard
          title="Active Strategies"
          value={`${portfolio.activeStrategiesCount} Bots`}
          change="All Normal"
          changeLabel="health"
          isPositive={true}
          icon={Cpu}
          delay={0.15}
        />
        <SummaryCard
          title="Open Positions"
          value={`${portfolio.openPositionsCount} Active`}
          change={`+$8.94k`}
          changeLabel="unrealized"
          isPositive={true}
          icon={Layers}
          delay={0.2}
        />
        <SummaryCard
          title="Win Rate"
          value={`${portfolio.winRate}%`}
          change="248 Trades"
          changeLabel="total sample"
          isPositive={true}
          icon={Award}
          delay={0.25}
        />
        <SummaryCard
          title="Max Drawdown"
          value={`${portfolio.maxDrawdown}%`}
          change="Buffer 4.8%"
          changeLabel="to stop"
          isPositive={true}
          icon={ShieldAlert}
          delay={0.3}
        />
      </div>

      {/* Main Row: Candlestick Chart & Watchlist */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <InteractiveCandlestick
            symbol={selectedSymbol}
            currentPrice={selectedInstrument.price}
            change24h={selectedInstrument.change24h}
            height={380}
          />
        </div>
        <div className="xl:col-span-1">
          <WatchlistPanel />
        </div>
      </div>

      {/* Second Row: Performance Curve & Risk Monitor */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <Card
            title="Portfolio Equity Curve vs Benchmark"
            subtitle="Simulated historical performance against S&P 500 baseline"
            headerBadge={<DemoBadge size="xs" />}
          >
            <PerformanceAreaChart data={DEMO_PORTFOLIO_PERFORMANCE_HISTORY} height={260} />
          </Card>
        </div>

        <div className="xl:col-span-1">
          <RiskMonitoringPanel />
        </div>
      </div>

      {/* Third Row: Active AI Strategies & Recent Trades */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ActiveStrategiesPanel />
        <RecentTradesPanel />
      </div>
    </div>
  );
};

export default DashboardPage;
