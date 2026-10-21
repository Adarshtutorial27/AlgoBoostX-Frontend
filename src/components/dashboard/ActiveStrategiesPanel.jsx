import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Cpu, Play, Pause, ChevronRight, Activity } from 'lucide-react';
import { useTrading } from '../../context/TradingContext';
import Card from '../common/Card';
import Badge from '../common/Badge';
import { DemoBadge } from '../common/DemoBadge';

export const ActiveStrategiesPanel = () => {
  const { strategies, toggleStrategy } = useTrading();
  const navigate = useNavigate();

  return (
    <Card
      title="Autonomous AI Strategies"
      subtitle="Execution state & statistical performance"
      headerBadge={<DemoBadge size="xs" />}
      headerAction={
        <button
          onClick={() => navigate('/strategy-lab')}
          className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium transition-colors"
        >
          <span>Strategy Lab</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      }
      noPadding
    >
      <div className="divide-y divide-white/[0.04]">
        {strategies.map((strat) => {
          const isActive = strat.status === 'ACTIVE';

          return (
            <div
              key={strat.id}
              className="p-5 hover:bg-white/[0.02] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              {/* Left: Strategy Info */}
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 shrink-0 mt-0.5">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-sm text-white">{strat.name}</h4>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-white/[0.06]">
                      {strat.instrument} • {strat.timeframe}
                    </span>
                    <Badge variant={isActive ? 'green' : 'slate'} size="xs" dot>
                      {strat.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-1">{strat.description}</p>
                </div>
              </div>

              {/* Right: Metrics & Controls */}
              <div className="flex items-center justify-between sm:justify-end gap-5">
                <div className="flex items-center gap-4 text-xs font-mono">
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase">Win Rate</div>
                    <div className="font-semibold text-emerald-400">{strat.winRate}%</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase">30D Return</div>
                    <div className="font-semibold text-cyan-400">+{strat.monthlyReturn}%</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase">Drawdown</div>
                    <div className="font-semibold text-rose-400">{strat.maxDrawdown}%</div>
                  </div>
                </div>

                <button
                  onClick={() => toggleStrategy(strat.id)}
                  className={`p-2 rounded-xl border transition-all ${
                    isActive
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
                      : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                  }`}
                  title={isActive ? 'Pause Strategy' : 'Activate Strategy'}
                >
                  {isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-emerald-400" />}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default ActiveStrategiesPanel;
