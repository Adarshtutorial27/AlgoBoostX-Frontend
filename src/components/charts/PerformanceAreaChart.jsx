import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { formatCurrency } from '../../utils/formatters';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl bg-[#080d19]/95 border border-cyan-500/30 p-3 shadow-2xl backdrop-blur-md">
        <div className="text-xs font-mono text-slate-400 mb-1">{label}</div>
        <div className="text-sm font-semibold text-emerald-400 flex items-center justify-between gap-4">
          <span>Algo Strategy:</span>
          <span>{formatCurrency(payload[0].value)}</span>
        </div>
        {payload[1] && (
          <div className="text-xs text-slate-400 flex items-center justify-between gap-4 mt-1">
            <span>Benchmark:</span>
            <span>{formatCurrency(payload[1].value)}</span>
          </div>
        )}
      </div>
    );
  }
  return null;
};

export const PerformanceAreaChart = ({
  data = [],
  height = 280,
  showBenchmark = true,
}) => {
  return (
    <div style={{ width: '100%', height }} className="select-none">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
          <defs>
            <linearGradient id="algoEquityGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="benchmarkGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#64748b" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#64748b" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" vertical={false} />
          <XAxis
            dataKey="date"
            stroke="#64748b"
            fontSize={11}
            tickLine={false}
            axisLine={{ stroke: 'rgba(255, 255, 255, 0.08)' }}
          />
          <YAxis
            stroke="#64748b"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            domain={['dataMin - 5000', 'dataMax + 5000']}
            tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
          />
          <Tooltip content={<CustomTooltip />} />
          {showBenchmark && (
            <Area
              type="monotone"
              dataKey="benchmark"
              stroke="#64748b"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              fillOpacity={1}
              fill="url(#benchmarkGrad)"
            />
          )}
          <Area
            type="monotone"
            dataKey="value"
            stroke="#10b981"
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#algoEquityGrad)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PerformanceAreaChart;
