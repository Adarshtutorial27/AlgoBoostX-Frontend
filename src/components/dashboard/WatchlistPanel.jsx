import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, ChevronRight, TrendingUp, TrendingDown } from 'lucide-react';
import { useTrading } from '../../context/TradingContext';
import { formatCurrency } from '../../utils/formatters';
import MiniSparkline from '../charts/MiniSparkline';
import Card from '../common/Card';
import { DemoBadge } from '../common/DemoBadge';

export const WatchlistPanel = () => {
  const { instruments, watchlist, toggleWatchlist, setSelectedSymbol } = useTrading();
  const navigate = useNavigate();

  const watchlistItems = instruments.filter((i) => watchlist.includes(i.symbol));

  const handleSelect = (symbol) => {
    setSelectedSymbol(symbol);
    navigate('/terminal');
  };

  return (
    <Card
      title="Active Watchlist"
      subtitle="Tracked simulated market feeds"
      headerBadge={<DemoBadge size="xs" />}
      headerAction={
        <button
          onClick={() => navigate('/markets')}
          className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium transition-colors"
        >
          <span>All Markets</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      }
      noPadding
    >
      <div className="divide-y divide-white/[0.04]">
        {watchlistItems.length > 0 ? (
          watchlistItems.map((item) => {
            const isPos = item.change24h >= 0;
            return (
              <div
                key={item.symbol}
                className="flex items-center justify-between px-5 py-3 hover:bg-white/[0.03] transition-colors group cursor-pointer"
                onClick={() => handleSelect(item.symbol)}
              >
                {/* Left: Star & Symbol */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleWatchlist(item.symbol);
                    }}
                    className="text-amber-400 hover:scale-110 transition-transform p-1"
                    title="Remove from watchlist"
                  >
                    <Star className="w-4 h-4 fill-amber-400" />
                  </button>
                  <div>
                    <div className="font-semibold text-xs text-white group-hover:text-cyan-300 transition-colors">
                      {item.symbol}
                    </div>
                    <div className="text-[11px] text-slate-400">{item.name}</div>
                  </div>
                </div>

                {/* Middle: Sparkline */}
                <div className="hidden sm:block">
                  <MiniSparkline data={item.sparkline} isPositive={isPos} width={80} height={24} />
                </div>

                {/* Right: Price & Change */}
                <div className="text-right font-mono">
                  <div className="text-xs font-semibold text-white">
                    {formatCurrency(item.price, item.precision)}
                  </div>
                  <div
                    className={`text-[11px] font-semibold flex items-center justify-end gap-0.5 ${
                      isPos ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {isPos ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    <span>{isPos ? '+' : ''}{item.change24h.toFixed(2)}%</span>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-6 text-center text-xs text-slate-400">
            No instruments in your watchlist. Star symbols in the Markets tab!
          </div>
        )}
      </div>
    </Card>
  );
};

export default WatchlistPanel;
