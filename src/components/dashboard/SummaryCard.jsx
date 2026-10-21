import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, HelpCircle } from 'lucide-react';
import { DemoBadge } from '../common/DemoBadge';

export const SummaryCard = ({
  title,
  value,
  change = null,
  changeLabel = 'vs yesterday',
  isPositive = true,
  icon: Icon = null,
  tooltip = null,
  delay = 0,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className="relative p-5 rounded-2xl bg-[#0B101E]/80 backdrop-blur-xl border border-white/[0.07] hover:border-cyan-500/30 transition-all shadow-lg hover:shadow-cyan-950/20 group"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-slate-400 group-hover:text-slate-300 transition-colors">
            {title}
          </span>
          {tooltip && (
            <span title={tooltip} className="cursor-help text-slate-500 hover:text-slate-400">
              <HelpCircle className="w-3 h-3" />
            </span>
          )}
        </div>

        {Icon && (
          <div className="p-2 rounded-xl bg-white/[0.03] border border-white/[0.05] text-slate-300 group-hover:text-cyan-400 group-hover:border-cyan-500/30 transition-colors">
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <div className="text-2xl font-bold font-mono tracking-tight text-white group-hover:text-cyan-200 transition-colors">
          {value}
        </div>
        <DemoBadge size="xs" />
      </div>

      {change !== null && (
        <div className="flex items-center gap-2 mt-3 text-xs font-mono">
          <span
            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-semibold ${
              isPositive
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                : 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
            }`}
          >
            {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {change}
          </span>
          <span className="text-slate-500 font-sans">{changeLabel}</span>
        </div>
      )}
    </motion.div>
  );
};

export default SummaryCard;
