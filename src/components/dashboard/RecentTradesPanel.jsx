import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, ArrowDownRight, ChevronRight } from 'lucide-react';
import { useTrading } from '../../context/TradingContext';
import { formatCurrency } from '../../utils/formatters';
import Card from '../common/Card';
import Badge from '../common/Badge';
import { DemoBadge } from '../common/DemoBadge';

export const RecentTradesPanel = () => {
  const { trades } = useTrading();
  const navigate = useNavigate();

  const recentList = trades.slice(0, 5);

  return (
    <Card
      title="Recent Trades"
      subtitle="Execution stream from algorithms & manual orders"
      headerBadge={<DemoBadge size="xs" />}
      headerAction={
        <button
          onClick={() => navigate('/history')}
          className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium transition-colors"
        >
          <span>Full Log</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      }
      noPadding
    >
      <div className="divide-y divide-white/[0.04]">
        {recentList.map((trd) => {
          const isBuy = trd.side === 'BUY';
          const isProfit = trd.pnl >= 0;

          return (
            <div
              key={trd.id}
              className="flex items-center justify-between px-5 py-3 hover:bg-white/[0.02] transition-colors"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    isBuy ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}
                >
                  {isBuy ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-white">{trd.instrument}</span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${
                        isBuy ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                      }`}
                    >
                      {trd.side}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{trd.strategy}</div>
                </div>
              </div>

              <div className="text-right font-mono">
                <div className="text-xs font-semibold text-white">
                  {formatCurrency(trd.exitPrice || trd.entryPrice)}
                </div>
                <div
                  className={`text-[11px] font-semibold ${
                    isProfit ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {isProfit ? '+' : ''}{formatCurrency(trd.pnl)} ({trd.pnlPercent.toFixed(2)}%)
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default RecentTradesPanel;
