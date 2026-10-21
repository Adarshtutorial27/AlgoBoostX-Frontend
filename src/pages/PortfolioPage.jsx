import React from 'react';
import {
  Wallet,
  TrendingUp,
  PieChart,
  Shield,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Download,
} from 'lucide-react';
import { useTrading } from '../context/TradingContext';
import { formatCurrency, formatPercent } from '../utils/formatters';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import { DemoBadge } from '../components/common/DemoBadge';
import AssetAllocationChart from '../components/charts/AssetAllocationChart';
import PerformanceAreaChart from '../components/charts/PerformanceAreaChart';
import {
  DEMO_ASSET_ALLOCATION,
  DEMO_PORTFOLIO_PERFORMANCE_HISTORY,
} from '../data/demoData';

export const PortfolioPage = () => {
  const { portfolio, positions, closePosition } = useTrading();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#090e1c] border border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-heading font-extrabold text-white tracking-wide">
              Portfolio & Capital Allocation
            </h1>
            <DemoBadge size="sm" />
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Realized and unrealized returns, asset distribution, and margin exposure surveillance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Download className="w-4 h-4" />}
            onClick={() => alert('Demo simulated export: portfolio_snapshot.json downloaded')}
          >
            Export Ledger
          </Button>
        </div>
      </div>

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#0B101E]/80 border border-white/[0.07] backdrop-blur-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-slate-400">Total Portfolio Value</span>
            <Wallet className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {formatCurrency(portfolio.totalBalance)}
          </div>
          <div className="text-xs font-mono text-emerald-400 mt-2 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+{portfolio.todayPnlPercent}% Today</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0B101E]/80 border border-white/[0.07] backdrop-blur-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-slate-400">Unrealized P&L</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            +{formatCurrency(portfolio.unrealizedPnl)}
          </div>
          <div className="text-xs font-mono text-slate-400 mt-2">
            +{portfolio.unrealizedPnlPercent}% on open margins
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0B101E]/80 border border-white/[0.07] backdrop-blur-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-slate-400">Realized Cumulative P&L</span>
            <DollarSign className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            +{formatCurrency(portfolio.realizedPnl)}
          </div>
          <div className="text-xs font-mono text-slate-400 mt-2">
            Profit Factor: {portfolio.profitFactor}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0B101E]/80 border border-white/[0.07] backdrop-blur-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-slate-400">Available Liquid Reserve</span>
            <Shield className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-cyan-300">
            {formatCurrency(portfolio.availableBalance)}
          </div>
          <div className="text-xs font-mono text-slate-400 mt-2">
            32.8% Uncommitted Cash
          </div>
        </div>
      </div>

      {/* Row: Asset Allocation Chart (Left) + Performance History (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5">
          <Card
            title="Asset Class & Token Allocation"
            subtitle="Current portfolio distribution breakdown"
            headerBadge={<DemoBadge size="xs" />}
          >
            <AssetAllocationChart data={DEMO_ASSET_ALLOCATION} height={240} />
          </Card>
        </div>

        <div className="lg:col-span-7">
          <Card
            title="Portfolio Performance History"
            subtitle="Cumulative net equity curve vs benchmark"
            headerBadge={<DemoBadge size="xs" />}
          >
            <PerformanceAreaChart data={DEMO_PORTFOLIO_PERFORMANCE_HISTORY} height={240} />
          </Card>
        </div>
      </div>

      {/* Open Positions Detailed Table */}
      <Card
        title={`Active Open Positions (${positions.length})`}
        subtitle="Current live exposure across running algorithms"
        headerBadge={<DemoBadge size="xs" />}
        noPadding
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/[0.06] text-slate-400 font-mono text-[11px] bg-white/[0.01]">
                <th className="py-3.5 px-4">Instrument</th>
                <th className="py-3.5 px-4">Side</th>
                <th className="py-3.5 px-4">Position Size</th>
                <th className="py-3.5 px-4">Entry Price</th>
                <th className="py-3.5 px-4">Mark Price</th>
                <th className="py-3.5 px-4">Allocated Margin</th>
                <th className="py-3.5 px-4">Unrealized PnL</th>
                <th className="py-3.5 px-4">Strategy</th>
                <th className="py-3.5 px-4 text-right">Close</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {positions.length > 0 ? (
                positions.map((pos) => {
                  const isPos = pos.pnl >= 0;
                  return (
                    <tr key={pos.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-white">{pos.symbol}</td>
                      <td className="py-3.5 px-4 font-mono">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                            pos.side === 'LONG'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-rose-500/20 text-rose-300'
                          }`}
                        >
                          {pos.side}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-300">{pos.size}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-300">
                        {formatCurrency(pos.entryPrice)}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-white">
                        {formatCurrency(pos.currentPrice)}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-400">
                        {formatCurrency(pos.margin)}
                      </td>
                      <td className="py-3.5 px-4 font-mono">
                        <span
                          className={`font-semibold ${
                            isPos ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {isPos ? '+' : ''}{formatCurrency(pos.pnl)} ({pos.pnlPercent.toFixed(2)}%)
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">{pos.strategy}</td>
                      <td className="py-3.5 px-4 text-right">
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => closePosition(pos.id)}
                        >
                          Close Position
                        </Button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="9" className="py-8 text-center text-slate-500">
                    No active open positions.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default PortfolioPage;
