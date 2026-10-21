import React, { useState } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { formatCurrency } from '../../utils/formatters';

const CustomDonutTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="rounded-xl bg-[#080d19]/95 border border-cyan-500/30 p-3 shadow-2xl backdrop-blur-md">
        <div className="text-xs text-slate-400">{data.name}</div>
        <div className="text-sm font-semibold text-white mt-0.5">{formatCurrency(data.value)}</div>
        <div className="text-xs font-mono text-cyan-400 mt-0.5">{data.percentage}% of portfolio</div>
      </div>
    );
  }
  return null;
};

export const AssetAllocationChart = ({ data = [], height = 240 }) => {
  const [activeIndex, setActiveIndex] = useState(null);

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6 w-full">
      <div style={{ width: '100%', maxWidth: '240px', height }} className="relative shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip content={<CustomDonutTooltip />} />
            <Pie
              data={data}
              innerRadius={55}
              outerRadius={85}
              paddingAngle={4}
              dataKey="value"
              onMouseEnter={(_, index) => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color}
                  stroke={activeIndex === index ? '#ffffff' : 'rgba(0,0,0,0.4)'}
                  strokeWidth={activeIndex === index ? 2 : 1}
                  className="transition-all duration-200 cursor-pointer"
                  opacity={activeIndex === null || activeIndex === index ? 1 : 0.6}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[11px] uppercase tracking-wider text-slate-400 font-mono">Assets</span>
          <span className="text-sm font-bold text-white font-mono">{data.length} Holdings</span>
        </div>
      </div>

      {/* Legend list */}
      <div className="flex-1 w-full space-y-2.5">
        {data.map((item, idx) => (
          <div
            key={item.name}
            onMouseEnter={() => setActiveIndex(idx)}
            onMouseLeave={() => setActiveIndex(null)}
            className={`flex items-center justify-between text-xs p-2 rounded-lg transition-colors cursor-pointer ${
              activeIndex === idx ? 'bg-white/[0.08]' : 'hover:bg-white/[0.03]'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-slate-200 truncate">{item.name}</span>
            </div>
            <div className="flex items-center gap-3 shrink-0 font-mono">
              <span className="text-white font-medium">{formatCurrency(item.value)}</span>
              <span className="text-slate-400 w-12 text-right">{item.percentage}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AssetAllocationChart;
