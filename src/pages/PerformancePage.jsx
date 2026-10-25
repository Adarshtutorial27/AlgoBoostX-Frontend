import React, { useState } from 'react';
import {
  TrendingUp,
  BarChart3,
  Calendar,
  DollarSign,
  Download,
  Filter,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import { DemoBadge } from '../components/common/DemoBadge';
import { DEMO_PERFORMANCE_BY_TIMEFRAME } from '../data/demoData';
import { formatCurrency, formatPercent } from '../utils/formatters';

const CustomPerformanceTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl bg-[#080d19]/95 border border-[#00FF66]/30 p-3 shadow-2xl backdrop-blur-md">
        <div className="text-xs font-mono text-slate-400 mb-1">{label}</div>
        <div className="text-sm font-semibold text-[#00FF66] flex items-center justify-between gap-4">
          <span>Net P&L:</span>
          <span>+{formatCurrency(payload[0].value)}</span>
        </div>
        {payload[1] && (
          <div className="text-xs text-slate-400 flex items-center justify-between gap-4 mt-1">
            <span>Portfolio Value:</span>
            <span>{formatCurrency(payload[1].value)}</span>
          </div>
        )}
      </div>
    );
  }
  return null;
};

export const PerformancePage = () => {
  const [timeframe, setTimeframe] = useState('1M'); // 1D | 1W | 1M | 1Y | ALL
  const timeframes = ['1D', '1W', '1M', '1Y', 'ALL'];

  const chartData = DEMO_PERFORMANCE_BY_TIMEFRAME[timeframe] || DEMO_PERFORMANCE_BY_TIMEFRAME['1M'];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-[#080c14] border border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-heading font-extrabold text-white tracking-tight">
              Trading Performance Analytics
            </h1>
            <DemoBadge size="sm" />
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Real-time equity growth, realized profit & loss trajectories, and alpha benchmarking.
          </p>
        </div>

        {/* Timeframe Buttons */}
        <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-white/[0.08]">
          {timeframes.map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all ${
                timeframe === tf
                  ? 'bg-[#00FF66] text-black shadow-md shadow-[#00FF66]/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Main Performance Chart Card */}
      <Card
        title="Profit and Loss Visualization"
        subtitle={`Historical returns over ${timeframe} timeframe`}
        headerBadge={<DemoBadge size="xs" />}
        headerAction={
          <span className="text-xs font-mono text-[#00FF66] font-semibold flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+28.4% Net Return</span>
          </span>
        }
      >
        <div className="h-80 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="limePerfGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00FF66" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#00FF66" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" vertical={false} />
              <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
              <YAxis
                stroke="#64748b"
                fontSize={11}
                tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomPerformanceTooltip />} />
              <Area
                type="monotone"
                dataKey="pnl"
                stroke="#00FF66"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#limePerfGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Supporting 4 Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#090d16] border border-white/[0.08]">
          <span className="text-[10px] font-mono uppercase text-slate-500">Gross Realized Profit</span>
          <div className="text-2xl font-bold font-mono text-[#00FF66] mt-1">+$42,180.00</div>
          <div className="text-xs font-mono text-slate-400 mt-1">From 248 executed trades</div>
        </div>

        <div className="p-5 rounded-2xl bg-[#090d16] border border-white/[0.08]">
          <span className="text-[10px] font-mono uppercase text-slate-500">Gross Loss / Drawdown</span>
          <div className="text-2xl font-bold font-mono text-rose-400 mt-1">-$9,250.00</div>
          <div className="text-xs font-mono text-slate-400 mt-1">Managed by trailing stops</div>
        </div>

        <div className="p-5 rounded-2xl bg-[#090d16] border border-white/[0.08]">
          <span className="text-[10px] font-mono uppercase text-slate-500">Profit Factor</span>
          <div className="text-2xl font-bold font-mono text-white mt-1">2.48</div>
          <div className="text-xs font-mono text-[#00FF66] mt-1">Target benchmark: &gt;1.80</div>
        </div>

        <div className="p-5 rounded-2xl bg-[#090d16] border border-white/[0.08]">
          <span className="text-[10px] font-mono uppercase text-slate-500">Average Win Rate</span>
          <div className="text-2xl font-bold font-mono text-cyan-300 mt-1">68.4%</div>
          <div className="text-xs font-mono text-slate-400 mt-1">Sample period: 9.7 Months</div>
        </div>
      </div>
    </div>
  );
};

export default PerformancePage;
