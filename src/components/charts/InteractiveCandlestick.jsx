import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { formatCurrency, formatCompactNumber } from '../../utils/formatters';
import { api } from '../../services/api';
import { RefreshCw, Wifi, WifiOff, AlertTriangle, Layers } from 'lucide-react';

export const InteractiveCandlestick = ({
  symbol = 'BTCUSD',
  currentPrice: initialPrice = null,
  change24h: initialChange = null,
  height = 420,
}) => {
  const [timeframe, setTimeframe] = useState('1h');
  const [showMA20, setShowMA20] = useState(true);
  const [showMA50, setShowMA50] = useState(false);
  const [showVolume, setShowVolume] = useState(true);
  const [hoverIndex, setHoverIndex] = useState(null);

  // Real market data state
  const [candles, setCandles] = useState([]);
  const [ticker, setTicker] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [feedStatus, setFeedStatus] = useState('CONNECTING'); // 'LIVE_TESTNET' | 'STALE' | 'DISCONNECTED'
  const [lastUpdated, setLastUpdated] = useState(null);
  const [fetchError, setFetchError] = useState(null);

  const containerRef = useRef(null);

  // Normalize symbol for Delta Exchange (e.g. BTC/USDT -> BTCUSD, BTC -> BTCUSD)
  const normalizedSymbol = useMemo(() => {
    let s = (symbol || 'BTCUSD').replace('/', '').replace('-', '').toUpperCase();
    if (s.endsWith('USDT')) s = s.replace(/USDT$/, 'USD');
    if (!s.endsWith('USD')) s = `${s}USD`;
    return s;
  }, [symbol]);

  // Fetch real market data from Delta Exchange Testnet via backend
  const fetchMarketData = useCallback(async () => {
    try {
      setFetchError(null);
      const [candleRes, tickerRes] = await Promise.allSettled([
        api.markets.getCandles(normalizedSymbol, timeframe, 50),
        api.markets.getTicker(normalizedSymbol),
      ]);

      let rawCandles = [];
      if (candleRes.status === 'fulfilled' && candleRes.value) {
        if (candleRes.value.candles && Array.isArray(candleRes.value.candles)) {
          rawCandles = candleRes.value.candles;
        } else if (Array.isArray(candleRes.value)) {
          rawCandles = candleRes.value;
        }
      }

      if (rawCandles.length > 0) {
        const formatted = rawCandles.map((c) => {
          // Timestamp could be in seconds or milliseconds
          const ts = c.time > 10000000000 ? c.time : c.time * 1000;
          return {
            time: new Date(ts),
            open: Number(c.open),
            high: Number(c.high),
            low: Number(c.low),
            close: Number(c.close),
            volume: Number(c.volume || 0),
            isBullish: Number(c.close) >= Number(c.open),
          };
        });

        // Sort chronologically
        formatted.sort((a, b) => a.time.getTime() - b.time.getTime());
        setCandles(formatted);

        // Stale detection
        const latestTime = formatted[formatted.length - 1].time.getTime();
        const now = Date.now();
        const stepMs = {
          '1m': 60 * 1000,
          '5m': 5 * 60 * 1000,
          '15m': 15 * 60 * 1000,
          '1h': 60 * 60 * 1000,
          '4h': 4 * 60 * 60 * 1000,
          '1D': 24 * 60 * 60 * 1000,
          '1d': 24 * 60 * 60 * 1000,
        }[timeframe] || 60 * 60 * 1000;

        // If latest candle is within reasonable window, mark as LIVE TESTNET
        if (now - latestTime < stepMs * 4) {
          setFeedStatus('LIVE_TESTNET');
        } else {
          setFeedStatus('STALE');
        }
      } else {
        setFeedStatus('DISCONNECTED');
        setFetchError('No historical candles returned from Delta Exchange.');
      }

      if (tickerRes.status === 'fulfilled' && tickerRes.value && !tickerRes.value.isDisconnected) {
        setTicker(tickerRes.value);
      }

      setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err) {
      setFeedStatus('DISCONNECTED');
      setFetchError(err.message || 'Failed to connect to Delta Exchange feed.');
    } finally {
      setIsLoading(false);
    }
  }, [normalizedSymbol, timeframe]);

  // Initial and periodic polling
  useEffect(() => {
    setIsLoading(true);
    fetchMarketData();

    const interval = setInterval(() => {
      fetchMarketData();
    }, 10000);

    return () => clearInterval(interval);
  }, [fetchMarketData]);

  // Active price determination
  const livePrice = useMemo(() => {
    if (ticker && ticker.mark_price) return Number(ticker.mark_price);
    if (candles.length > 0) return candles[candles.length - 1].close;
    return initialPrice || 0;
  }, [ticker, candles, initialPrice]);

  const liveChange = useMemo(() => {
    if (ticker && ticker.price_change_percent_24h !== undefined) {
      return Number(ticker.price_change_percent_24h);
    }
    if (candles.length >= 2) {
      const first = candles[0].open;
      const last = candles[candles.length - 1].close;
      return Number((((last - first) / first) * 100).toFixed(2));
    }
    return initialChange || 0;
  }, [ticker, candles, initialChange]);

  // Compute Moving Averages
  const ma20 = useMemo(() => {
    return candles.map((_, idx, arr) => {
      if (idx < 19) return null;
      const slice = arr.slice(idx - 19, idx + 1);
      return slice.reduce((acc, c) => acc + c.close, 0) / 20;
    });
  }, [candles]);

  const ma50 = useMemo(() => {
    return candles.map((_, idx, arr) => {
      if (idx < 49) return null;
      const slice = arr.slice(idx - 49, idx + 1);
      return slice.reduce((acc, c) => acc + c.close, 0) / slice.length;
    });
  }, [candles]);

  // Scaling ranges
  const minPrice = useMemo(() => {
    if (!candles.length) return 0;
    return Math.min(...candles.map((c) => c.low)) * 0.998;
  }, [candles]);

  const maxPrice = useMemo(() => {
    if (!candles.length) return 1;
    return Math.max(...candles.map((c) => c.high)) * 1.002;
  }, [candles]);

  const maxVolume = useMemo(() => {
    if (!candles.length) return 1;
    return Math.max(...candles.map((c) => c.volume)) || 1;
  }, [candles]);

  const priceRange = maxPrice - minPrice || 1;

  // Active candle for HUD (hovered or latest)
  const activeCandle = hoverIndex !== null && candles[hoverIndex] ? candles[hoverIndex] : candles[candles.length - 1];

  const chartWidth = 800;
  const chartHeight = height;
  const candleWidth = candles.length > 0 ? (chartWidth - 80) / candles.length : 16;
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

  const timeframes = ['5m', '15m', '1h', '4h', '1D'];

  const handleMouseMove = (e) => {
    if (!containerRef.current || !candles.length) return;
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
            <span className="font-heading font-bold text-base text-white tracking-wide">{normalizedSymbol}</span>
            <span className="text-sm font-mono font-bold text-slate-100">
              {livePrice ? formatCurrency(livePrice) : '--'}
            </span>
            <span
              className={`text-xs font-mono font-semibold px-2 py-0.5 rounded ${
                liveChange >= 0 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'
              }`}
            >
              {liveChange >= 0 ? '+' : ''}{liveChange.toFixed(2)}%
            </span>
          </div>

          {/* Genuine Provider Connection Status Badge */}
          {feedStatus === 'LIVE_TESTNET' && (
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#00FF66]/15 text-[#00FF66] border border-[#00FF66]/30 flex items-center gap-1.5 shadow-[0_0_8px_rgba(0,255,102,0.2)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00FF66] animate-pulse" />
              DELTA TESTNET LIVE
            </span>
          )}
          {feedStatus === 'STALE' && (
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1.5">
              <AlertTriangle className="w-3 h-3" />
              STALE FEED
            </span>
          )}
          {feedStatus === 'DISCONNECTED' && (
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center gap-1.5">
              <WifiOff className="w-3 h-3" />
              FEED DISCONNECTED
            </span>
          )}
          {feedStatus === 'CONNECTING' && (
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 flex items-center gap-1.5 animate-pulse">
              CONNECTING...
            </span>
          )}
        </div>

        {/* Timeframe switchers */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-900/90 border border-white/[0.06]">
          {timeframes.map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-2.5 py-1 text-xs font-mono rounded transition-colors ${
                timeframe === tf
                  ? 'bg-[#00FF66]/20 text-[#00FF66] font-bold border border-[#00FF66]/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>

        {/* Indicators, refresh and visual options */}
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

          <button
            onClick={fetchMarketData}
            title={lastUpdated ? `Last updated: ${lastUpdated}` : 'Refresh candles'}
            className="p-1 rounded bg-white/[0.04] text-slate-400 hover:text-white border border-white/[0.06] transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#00FF66]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Candle HUD (Open, High, Low, Close, Volume) */}
      {activeCandle ? (
        <div className="flex flex-wrap items-center justify-between gap-y-1 text-xs font-mono text-slate-400 bg-slate-950/40 px-3 py-1.5 rounded-lg border border-white/[0.04]">
          <div className="flex flex-wrap items-center gap-x-4">
            <span className="text-slate-200">
              {activeCandle.time.toLocaleDateString([], { month: 'short', day: 'numeric' })}{' '}
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
              C:{' '}
              <span className={activeCandle.isBullish ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
                {formatCurrency(activeCandle.close)}
              </span>
            </span>
            {showVolume && (
              <span>
                Vol: <span className="text-cyan-300 font-semibold">{formatCompactNumber(activeCandle.volume)}</span>
              </span>
            )}
          </div>
          <span className="text-[10px] text-slate-500">Source: Delta Exchange Testnet</span>
        </div>
      ) : (
        <div className="h-7 bg-slate-950/20 rounded-lg animate-pulse" />
      )}

      {/* Interactive SVG Chart Canvas */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative w-full cursor-crosshair select-none"
        style={{ height }}
      >
        {isLoading && candles.length === 0 ? (
          <div className="w-full h-full flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-2 border-[#00FF66] border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-mono text-slate-400">Loading Delta Exchange OHLCV candles...</span>
          </div>
        ) : fetchError && candles.length === 0 ? (
          <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-center p-6 border border-dashed border-rose-500/20 rounded-xl">
            <WifiOff className="w-8 h-8 text-rose-400" />
            <span className="text-xs font-mono text-rose-300">{fetchError}</span>
            <button
              onClick={fetchMarketData}
              className="px-3 py-1.5 rounded-lg bg-white/[0.04] text-xs font-mono text-slate-300 border border-white/[0.08] hover:border-[#00FF66]/50"
            >
              Retry Connection
            </button>
          </div>
        ) : (
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
                const fill = candle.isBullish ? 'rgba(0, 255, 102, 0.35)' : 'rgba(244, 63, 94, 0.35)';

                return (
                  <rect
                    key={`vol-${idx}`}
                    x={x + 1}
                    y={y}
                    width={Math.max(1, candleWidth - 3)}
                    height={Math.max(1, barHeight)}
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
              const candleColor = isBull ? '#00FF66' : '#f43f5e';
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
                    x={x + 1.5}
                    y={topBody}
                    width={Math.max(2, candleWidth - 3)}
                    height={bodyHeight}
                    fill={candleColor}
                    stroke={candleColor}
                    strokeWidth="0.5"
                    rx="1"
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
            {hoverIndex !== null && activeCandle && (
              <g>
                <line
                  x1={hoverIndex * candleWidth + candleWidth / 2 + 10}
                  y1="0"
                  x2={hoverIndex * candleWidth + candleWidth / 2 + 10}
                  y2={chartHeight}
                  stroke="rgba(0, 255, 102, 0.4)"
                  strokeDasharray="3 3"
                />
                <line
                  x1="0"
                  y1={getY(activeCandle.close)}
                  x2={chartWidth - 65}
                  y2={getY(activeCandle.close)}
                  stroke="rgba(0, 255, 102, 0.4)"
                  strokeDasharray="3 3"
                />
                {/* Price badge on axis */}
                <rect
                  x={chartWidth - 65}
                  y={getY(activeCandle.close) - 9}
                  width="64"
                  height="18"
                  fill="#00FF66"
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
        )}
      </div>
    </div>
  );
};

export default InteractiveCandlestick;
