import React, { useState, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { formatCurrency, formatCompactNumber } from '../../utils/formatters';
import { DemoBadge } from '../common/DemoBadge';
import { Eye, TrendingUp, Maximize2 } from 'lucide-react';

// Generates consistent deterministic candlestick data around current price
const generateCandles = (basePrice, timeframe = '15m', count = 48) => {
  const candles = [];
  let current = basePrice * 0.94;
  const now = Date.now();
  const stepMs = {
    '1m': 60 * 1000,
    '5m': 5 * 60 * 1000,
    '15m': 15 * 60 * 1000,
    '1h': 60 * 60 * 1000,
    '4h': 4 * 60 * 60 * 1000,
    '1D': 24 * 60 * 60 * 1000,
  }[timeframe] || 15 * 60 * 1000;

  for (let i = count - 1; i >= 0; i--) {
    const timestamp = new Date(now - i * stepMs);
    const volatility = basePrice * 0.008;
    const change = (Math.sin(i * 0.4) * 0.5 + (Math.random() - 0.47)) * volatility;
    const open = current;
    const close = Math.max(1, open + change);
    const high = Math.max(open, close) + Math.random() * volatility * 0.6;
    const low = Math.min(open, close) - Math.random() * volatility * 0.6;
    const volume = Math.floor(Math.random() * 850000 + 150000);

    current = close;
    candles.push({
      time: timestamp,
      open,
      high,
      low,
      close,
      volume,
      isBullish: close >= open,
    });
  }
  // Ensure last close matches current basePrice
  if (candles.length > 0) {
    const diff = basePrice - candles[candles.length - 1].close;
    candles.forEach((c) => {
      c.open += diff * 0.7;
      c.close += diff;
      c.high += diff;
      c.low += diff;
    });
  }
  return candles;
};

export const InteractiveCandlestick = ({
  symbol = 'BTC/USDT',
  currentPrice = 94250.80,
  change24h = 3.42,
  height = 420,
}) => {
  const [timeframe, setTimeframe] = useState('15m');
  const [showMA20, setShowMA20] = useState(true);
  const [showMA50, setShowMA50] = useState(false);
  const [showVolume, setShowVolume] = useState(true);
  const [hoverIndex, setHoverIndex] = useState(null);

  const containerRef = useRef(null);

  const candles = useMemo(() => {
    return generateCandles(currentPrice, timeframe, 42);
  }, [currentPrice, timeframe]);

  // Compute Moving Averages
  const ma20 = useMemo(() => {
    return candles.map((_, idx, arr) => {
      if (idx < 19) return null;
      const slice = arr.slice(idx - 19, idx + 1);
      const avg = slice.reduce((acc, c) => acc + c.close, 0) / 20;
      return avg;
    });
  }, [candles]);

  const ma50 = useMemo(() => {
    return candles.map((_, idx, arr) => {
      if (idx < 29) return null;
      const slice = arr.slice(idx - 29, idx + 1);
      const avg = slice.reduce((acc, c) => acc + c.close, 0) / slice.length;
      return avg;
    });
  }, [candles]);

  // Min and Max prices for scaling
  const minPrice = useMemo(() => Math.min(...candles.map((c) => c.low)) * 0.998, [candles]);
  const maxPrice = useMemo(() => Math.max(...candles.map((c) => c.high)) * 1.002, [candles]);
  const maxVolume = useMemo(() => Math.max(...candles.map((c) => c.volume)), [candles]);
  const priceRange = maxPrice - minPrice || 1;

  // Active candle for HUD (either hovered or the latest)
  const activeCandle = hoverIndex !== null && candles[hoverIndex] ? candles[hoverIndex] : candles[candles.length - 1];

  const chartWidth = 800; // SVG viewBox coordinate width
  const chartHeight = height;
  const candlePadding = 8;
  const candleWidth = (chartWidth - 80) / candles.length;
  const priceAreaHeight = showVolume ? chartHeight * 0.76 : chartHeight - 40;
  const volumeAreaHeight = chartHeight * 0.20;

  const getY = (price) => {
    return priceAreaHeight - ((price - minPrice) / priceRange) * (priceAreaHeight - 30) - 15;
  };

  // Build MA polyline points
  const ma20Points = ma20
    .map((val, idx) => {
      if (val === null) return null;
      const x = idx * candleWidth + candleWidth / 2 + 10;
      const y = getY(val);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .filter(Boolean)
    .join(' ');

  const ma50Points = ma50
    .map((val, idx) => {
      if (val === null) return null;
      const x = idx * candleWidth + candleWidth / 2 + 10;
      const y = getY(val);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .filter(Boolean)
    .join(' ');

  const timeframes = ['1m', '5m', '15m', '1h', '4h', '1D'];

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const svgX = (mouseX / rect.width) * chartWidth;
    const idx = Math.floor((svgX - 10) / candleWidth);
    if (idx >= 0 && idx < candles.length) {
      setHoverIndex(idx);
    }
  };

  const handleMouseLeave = () => {
    setHoverIndex(null);
  };

  return (
    <div className="relative w-full rounded-2xl bg-[#080d19]/90 border border-white/[0.08] p-4 flex flex-col gap-3 shadow-2xl overflow-hidden">
      {/* Top Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/[0.06]">
        {/* Symbol and price quick info */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="font-heading font-bold text-base text-white tracking-wide">{symbol}</span>
            <span className="text-sm font-mono font-bold text-slate-100">{formatCurrency(currentPrice)}</span>
            <span
              className={`text-xs font-mono font-semibold px-2 py-0.5 rounded ${
                change24h >= 0 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'
              }`}
            >
              {change24h >= 0 ? '+' : ''}{change24h.toFixed(2)}%
            </span>
          </div>
          <DemoBadge size="xs" />
        </div>

        {/* Timeframe switchers */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-900/90 border border-white/[0.06]">
          {timeframes.map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-2.5 py-1 text-xs font-mono rounded transition-colors ${
                timeframe === tf
                  ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>

        {/* Indicators and visual options */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowMA20(!showMA20)}
            className={`px-2 py-1 text-[11px] font-mono rounded border transition-colors ${
              showMA20
                ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                : 'text-slate-500 border-transparent hover:text-slate-300'
            }`}
          >
            MA 20
          </button>
          <button
            onClick={() => setShowMA50(!showMA50)}
            className={`px-2 py-1 text-[11px] font-mono rounded border transition-colors ${
              showMA50
                ? 'bg-purple-500/15 text-purple-300 border-purple-500/40'
                : 'text-slate-500 border-transparent hover:text-slate-300'
            }`}
          >
            MA 50
          </button>
          <button
            onClick={() => setShowVolume(!showVolume)}
            className={`px-2 py-1 text-[11px] font-mono rounded border transition-colors ${
              showVolume
                ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40'
                : 'text-slate-500 border-transparent hover:text-slate-300'
            }`}
          >
            VOL
          </button>
        </div>
      </div>

      {/* Candle HUD (Open, High, Low, Close, Volume) */}
      {activeCandle && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-mono text-slate-400 bg-slate-950/40 px-3 py-1.5 rounded-lg border border-white/[0.04]">
          <span className="text-slate-200">
            {activeCandle.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          <span>
            O: <span className="text-white font-semibold">{formatCurrency(activeCandle.open)}</span>
          </span>
          <span>
            H: <span className="text-emerald-400 font-semibold">{formatCurrency(activeCandle.high)}</span>
          </span>
          <span>
            L: <span className="text-rose-400 font-semibold">{formatCurrency(activeCandle.low)}</span>
          </span>
          <span>
            C: <span className={activeCandle.isBullish ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
              {formatCurrency(activeCandle.close)}
            </span>
          </span>
          {showVolume && (
            <span>
              Vol: <span className="text-cyan-300 font-semibold">{formatCompactNumber(activeCandle.volume)}</span>
            </span>
          )}
        </div>
      )}

      {/* Interactive SVG Chart Canvas */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative w-full cursor-crosshair select-none"
        style={{ height }}
      >
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          preserveAspectRatio="none"
          className="w-full h-full overflow-visible"
        >
          {/* Background horizontal grid lines */}
          {[0.15, 0.35, 0.55, 0.75].map((pct, idx) => {
            const y = chartHeight * pct;
            const priceLevel = maxPrice - pct * priceRange;
            return (
              <g key={idx}>
                <line
                  x1="0"
                  y1={y}
                  x2={chartWidth - 65}
                  y2={y}
                  stroke="rgba(255, 255, 255, 0.05)"
                  strokeDasharray="4 4"
                />
                <text
                  x={chartWidth - 60}
                  y={y + 4}
                  fill="#64748b"
                  fontSize="10"
                  fontFamily="monospace"
                >
                  {priceLevel.toFixed(1)}
                </text>
              </g>
            );
          })}

          {/* Volume divider */}
          {showVolume && (
            <line
              x1="0"
              y1={chartHeight - volumeAreaHeight}
              x2={chartWidth - 65}
              y2={chartHeight - volumeAreaHeight}
              stroke="rgba(255, 255, 255, 0.08)"
            />
          )}

          {/* Volume Bars */}
          {showVolume &&
            candles.map((candle, idx) => {
              const x = idx * candleWidth + 10;
              const barHeight = (candle.volume / maxVolume) * (volumeAreaHeight - 10);
              const y = chartHeight - barHeight;
              const fill = candle.isBullish ? 'rgba(16, 185, 129, 0.35)' : 'rgba(244, 63, 94, 0.35)';

              return (
                <rect
                  key={`vol-${idx}`}
                  x={x + 2}
                  y={y}
                  width={Math.max(1, candleWidth - 4)}
                  height={barHeight}
                  fill={fill}
                  rx="1"
                />
              );
            })}

          {/* Candlesticks */}
          {candles.map((candle, idx) => {
            const x = idx * candleWidth + 10;
            const centerX = x + candleWidth / 2;
            const yHigh = getY(candle.high);
            const yLow = getY(candle.low);
            const yOpen = getY(candle.open);
            const yClose = getY(candle.close);

            const isBull = candle.isBullish;
            const candleColor = isBull ? '#10b981' : '#f43f5e';
            const topBody = Math.min(yOpen, yClose);
            const bodyHeight = Math.max(2, Math.abs(yClose - yOpen));

            return (
              <g key={`candle-${idx}`} className="transition-opacity duration-150">
                {/* Wick */}
                <line
                  x1={centerX}
                  y1={yHigh}
                  x2={centerX}
                  y2={yLow}
                  stroke={candleColor}
                  strokeWidth="1.25"
                />
                {/* Body */}
                <rect
                  x={x + 2}
                  y={topBody}
                  width={Math.max(2, candleWidth - 4)}
                  height={bodyHeight}
                  fill={candleColor}
                  stroke={candleColor}
                  strokeWidth="0.5"
                  rx="1.5"
                />
              </g>
            );
          })}

          {/* MA 20 Line */}
          {showMA20 && ma20Points && (
            <polyline
              fill="none"
              stroke="#f59e0b"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={ma20Points}
            />
          )}

          {/* MA 50 Line */}
          {showMA50 && ma50Points && (
            <polyline
              fill="none"
              stroke="#a855f7"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={ma50Points}
            />
          )}

          {/* Crosshair Cursor */}
          {hoverIndex !== null && (
            <g>
              <line
                x1={hoverIndex * candleWidth + candleWidth / 2 + 10}
                y1="0"
                x2={hoverIndex * candleWidth + candleWidth / 2 + 10}
                y2={chartHeight}
                stroke="rgba(0, 242, 254, 0.4)"
                strokeDasharray="3 3"
              />
              <line
                x1="0"
                y1={getY(activeCandle.close)}
                x2={chartWidth - 65}
                y2={getY(activeCandle.close)}
                stroke="rgba(0, 242, 254, 0.4)"
                strokeDasharray="3 3"
              />
              {/* Price badge on axis */}
              <rect
                x={chartWidth - 65}
                y={getY(activeCandle.close) - 9}
                width="64"
                height="18"
                fill="#06b6d4"
                rx="3"
              />
              <text
                x={chartWidth - 33}
                y={getY(activeCandle.close) + 3}
                fill="#04121d"
                fontSize="9"
                fontWeight="bold"
                fontFamily="monospace"
                textAnchor="middle"
              >
                {activeCandle.close.toFixed(1)}
              </text>
            </g>
          )}
        </svg>
      </div>
    </div>
  );
};

export default InteractiveCandlestick;
