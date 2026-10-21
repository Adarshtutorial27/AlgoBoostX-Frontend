import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Star,
  TrendingUp,
  TrendingDown,
  Filter,
  Terminal,
  ExternalLink,
  SlidersHorizontal,
} from 'lucide-react';
import { useTrading } from '../context/TradingContext';
import { formatCurrency, formatCompactNumber } from '../utils/formatters';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import { DemoBadge } from '../components/common/DemoBadge';
import MiniSparkline from '../components/charts/MiniSparkline';
import InteractiveCandlestick from '../components/charts/InteractiveCandlestick';

export const MarketsPage = () => {
  const { instruments, watchlist, toggleWatchlist, setSelectedSymbol, selectedSymbol } = useTrading();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [activeDetailSymbol, setActiveDetailSymbol] = useState(selectedSymbol || 'BTC/USDT');

  const categories = ['ALL', 'Crypto', 'Equities', 'Indices', 'Forex'];

  const filtered = instruments.filter((inst) => {
    const matchesSearch =
      inst.symbol.toLowerCase().includes(search.toLowerCase()) ||
      inst.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'ALL' || inst.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const detailInstrument = instruments.find((i) => i.symbol === activeDetailSymbol) || instruments[0];

  const handleTradeInstrument = (symbol) => {
    setSelectedSymbol(symbol);
    navigate('/terminal');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#090e1c] border border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-heading font-extrabold text-white tracking-wide">
              Market Intelligence & Instruments
            </h1>
            <DemoBadge size="sm" />
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Simulated live asset universe across Crypto, Equities, Indices, and FX.
          </p>
        </div>

        {/* Category filter tabs */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900/90 border border-white/[0.06] overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                categoryFilter === cat
                  ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Left Table, Right Detail Panel */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column: Search & Instruments Table */}
        <div className="xl:col-span-2 space-y-4">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by instrument name or symbol..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0B101E] border border-white/[0.08] text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
            />
          </div>

          <Card noPadding>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/[0.06] text-slate-400 font-mono text-[11px] bg-white/[0.01]">
                    <th className="py-3 px-4 w-10">★</th>
                    <th className="py-3 px-4">Instrument</th>
                    <th className="py-3 px-4">Price</th>
                    <th className="py-3 px-4">24h Change</th>
                    <th className="py-3 px-4 hidden sm:table-cell">24h Volume</th>
                    <th className="py-3 px-4 hidden md:table-cell">Trend (24h)</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.03]">
                  {filtered.length > 0 ? (
                    filtered.map((inst) => {
                      const isFavorite = watchlist.includes(inst.symbol);
                      const isPos = inst.change24h >= 0;
                      const isSelected = activeDetailSymbol === inst.symbol;

                      return (
                        <tr
                          key={inst.symbol}
                          onClick={() => setActiveDetailSymbol(inst.symbol)}
                          className={`hover:bg-white/[0.03] transition-colors cursor-pointer ${
                            isSelected ? 'bg-cyan-500/[0.07]' : ''
                          }`}
                        >
                          {/* Star */}
                          <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => toggleWatchlist(inst.symbol)}
                              className={`p-1 rounded transition-transform hover:scale-110 ${
                                isFavorite ? 'text-amber-400' : 'text-slate-600 hover:text-slate-400'
                              }`}
                            >
                              <Star className={`w-4 h-4 ${isFavorite ? 'fill-amber-400' : ''}`} />
                            </button>
                          </td>

                          {/* Instrument */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-white">{inst.symbol}</span>
                              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                                {inst.category}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5">{inst.name}</div>
                          </td>

                          {/* Price */}
                          <td className="py-3.5 px-4 font-mono font-semibold text-white">
                            {formatCurrency(inst.price, inst.precision)}
                          </td>

                          {/* 24h Change */}
                          <td className="py-3.5 px-4 font-mono">
                            <span
                              className={`inline-flex items-center gap-1 font-semibold ${
                                isPos ? 'text-emerald-400' : 'text-rose-400'
                              }`}
                            >
                              {isPos ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                              <span>{isPos ? '+' : ''}{inst.change24h.toFixed(2)}%</span>
                            </span>
                          </td>

                          {/* 24h Volume */}
                          <td className="py-3.5 px-4 font-mono text-slate-300 hidden sm:table-cell">
                            ${formatCompactNumber(inst.volume24h)}
                          </td>

                          {/* Sparkline */}
                          <td className="py-3.5 px-4 hidden md:table-cell">
                            <MiniSparkline data={inst.sparkline} isPositive={isPos} width={80} height={22} />
                          </td>

                          {/* Action */}
                          <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="outline"
                              size="xs"
                              onClick={() => handleTradeInstrument(inst.symbol)}
                              rightIcon={<Terminal className="w-3 h-3 text-cyan-400" />}
                            >
                              Trade
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="7" className="py-8 text-center text-slate-500">
                        No instruments match your search criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Right Column: Selected Instrument Detail Card */}
        <div className="xl:col-span-1 space-y-4">
          <Card
            title={`${detailInstrument.symbol} Market Detail`}
            subtitle={detailInstrument.name}
            headerBadge={<DemoBadge size="xs" />}
            headerAction={
              <Button
                variant="primary"
                size="xs"
                onClick={() => handleTradeInstrument(detailInstrument.symbol)}
                rightIcon={<Terminal className="w-3.5 h-3.5" />}
              >
                Open in Terminal
              </Button>
            }
          >
            <div className="space-y-5">
              {/* Price and 24h stat headline */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-white/[0.05] flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-slate-400 font-mono">Current Spot Price</div>
                  <div className="text-2xl font-bold font-mono text-white mt-0.5">
                    {formatCurrency(detailInstrument.price, detailInstrument.precision)}
                  </div>
                </div>
                <div
                  className={`text-right font-mono font-bold text-sm ${
                    detailInstrument.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {detailInstrument.change24h >= 0 ? '+' : ''}{detailInstrument.change24h.toFixed(2)}%
                  <div className="text-[10px] text-slate-500 font-normal">24h Net Move</div>
                </div>
              </div>

              {/* 24h Stats Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                  <div className="text-[10px] text-slate-500 uppercase">24h High</div>
                  <div className="text-sm font-semibold text-emerald-400 mt-0.5">
                    {formatCurrency(detailInstrument.high24h, detailInstrument.precision)}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                  <div className="text-[10px] text-slate-500 uppercase">24h Low</div>
                  <div className="text-sm font-semibold text-rose-400 mt-0.5">
                    {formatCurrency(detailInstrument.low24h, detailInstrument.precision)}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                  <div className="text-[10px] text-slate-500 uppercase">24h Volume</div>
                  <div className="text-sm font-semibold text-slate-200 mt-0.5">
                    ${formatCompactNumber(detailInstrument.volume24h)}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                  <div className="text-[10px] text-slate-500 uppercase">Min Order Qty</div>
                  <div className="text-sm font-semibold text-cyan-400 mt-0.5">
                    {detailInstrument.minQty} {detailInstrument.baseAsset}
                  </div>
                </div>
              </div>

              {/* Mini Interactive Preview Chart */}
              <div className="pt-2">
                <div className="text-[11px] font-mono text-slate-400 mb-2">Price Action (15m Preview)</div>
                <MiniSparkline
                  data={detailInstrument.sparkline}
                  isPositive={detailInstrument.change24h >= 0}
                  width={320}
                  height={80}
                />
              </div>

              {/* Watchlist toggle action */}
              <div className="pt-2">
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full"
                  leftIcon={
                    <Star
                      className={`w-4 h-4 ${
                        watchlist.includes(detailInstrument.symbol) ? 'fill-amber-400 text-amber-400' : ''
                      }`}
                    />
                  }
                  onClick={() => toggleWatchlist(detailInstrument.symbol)}
                >
                  {watchlist.includes(detailInstrument.symbol)
                    ? 'Remove from Active Watchlist'
                    : 'Add to Active Watchlist'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MarketsPage;
