import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  DEMO_INSTRUMENTS,
  DEMO_PORTFOLIO_SUMMARY,
  DEMO_OPEN_POSITIONS,
  DEMO_STRATEGIES,
  DEMO_TRADE_HISTORY,
  IS_DEMO_DATA,
} from '../data/demoData';
import { useNotifications } from './NotificationContext';

const TradingContext = createContext(null);

export const TradingProvider = ({ children }) => {
  const { addToast } = useNotifications();

  const [instruments, setInstruments] = useState(DEMO_INSTRUMENTS);
  const [selectedSymbol, setSelectedSymbol] = useState('BTC/USDT');
  const [watchlist, setWatchlist] = useState(['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'NVDA']);
  const [portfolio, setPortfolio] = useState(DEMO_PORTFOLIO_SUMMARY);
  const [positions, setPositions] = useState(DEMO_OPEN_POSITIONS);
  const [strategies, setStrategies] = useState(DEMO_STRATEGIES);
  const [trades, setTrades] = useState(DEMO_TRADE_HISTORY);
  const [openOrders, setOpenOrders] = useState([
    {
      id: 'ORD-9910',
      timestamp: '2026-10-21 16:30:00',
      symbol: 'BTC/USDT',
      side: 'BUY',
      type: 'LIMIT',
      price: 93500.00,
      quantity: '0.15 BTC',
      status: 'OPEN',
      filled: '0.00%',
    },
    {
      id: 'ORD-9911',
      timestamp: '2026-10-21 15:45:00',
      symbol: 'SOL/USDT',
      side: 'SELL',
      type: 'LIMIT',
      price: 225.00,
      quantity: '25 SOL',
      status: 'OPEN',
      filled: '0.00%',
    },
  ]);

  const [isDemoMode] = useState(true);

  // Selected instrument accessor
  const selectedInstrument = useMemo(() => {
    return instruments.find((i) => i.symbol === selectedSymbol) || instruments[0];
  }, [instruments, selectedSymbol]);

  // Subtle realistic market micro-fluctuations for demo dynamism
  useEffect(() => {
    const interval = setInterval(() => {
      setInstruments((prev) =>
        prev.map((inst) => {
          // Subtle delta between -0.15% and +0.15%
          const pct = (Math.random() - 0.49) * 0.002;
          const newPrice = Math.max(0.01, Number((inst.price * (1 + pct)).toFixed(inst.precision)));
          const priceDiff = newPrice - inst.price;
          const newChange24h = Number((inst.change24h + (priceDiff / inst.price) * 10).toFixed(2));

          return {
            ...inst,
            price: newPrice,
            change24h: newChange24h,
          };
        })
      );
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  // Watchlist toggle
  const toggleWatchlist = useCallback((symbol) => {
    setWatchlist((prev) => {
      const exists = prev.includes(symbol);
      const updated = exists ? prev.filter((s) => s !== symbol) : [...prev, symbol];
      addToast({
        title: exists ? 'Removed from Watchlist' : 'Added to Watchlist',
        message: `${symbol} ${exists ? 'is no longer in' : 'added to'} your active watchlist.`,
        type: 'info',
        duration: 2500,
      });
      return updated;
    });
  }, [addToast]);

  // Execute Simulated Order
  const executeSimulatedOrder = useCallback((orderData) => {
    const orderId = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
    const tradeId = `TRD-${Math.floor(10000 + Math.random() * 90000)}`;
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    if (orderData.type === 'MARKET') {
      // Immediate execution
      const newTrade = {
        id: tradeId,
        timestamp: now,
        instrument: orderData.symbol,
        side: orderData.side,
        quantity: `${orderData.quantity} ${orderData.symbol.split('/')[0]}`,
        entryPrice: orderData.price,
        exitPrice: orderData.price,
        pnl: 0.00,
        pnlPercent: 0.00,
        fee: Number((orderData.price * orderData.quantity * 0.0004).toFixed(2)),
        status: 'COMPLETED',
        strategy: 'Manual Terminal Execution',
      };

      setTrades((prev) => [newTrade, ...prev]);

      // Add to open positions
      const newPos = {
        id: `POS-${Math.floor(1000 + Math.random() * 9000)}`,
        symbol: orderData.symbol,
        side: orderData.side,
        size: `${orderData.quantity} ${orderData.symbol.split('/')[0]}`,
        entryPrice: orderData.price,
        currentPrice: orderData.price,
        pnl: 0,
        pnlPercent: 0,
        margin: orderData.price * orderData.quantity,
        strategy: 'Manual Execution',
        openedAt: now,
      };
      setPositions((prev) => [newPos, ...prev]);

      addToast({
        title: `Simulated Order Filled: ${orderData.side} ${orderData.symbol}`,
        message: `Filled ${orderData.quantity} at $${orderData.price.toLocaleString()} (DEMO MODE - No real funds touched).`,
        type: 'success',
      });

      return { success: true, orderId, tradeId };
    } else {
      // Limit order placed into open orders
      const limitOrder = {
        id: orderId,
        timestamp: now,
        symbol: orderData.symbol,
        side: orderData.side,
        type: 'LIMIT',
        price: orderData.price,
        quantity: `${orderData.quantity} ${orderData.symbol.split('/')[0]}`,
        status: 'OPEN',
        filled: '0.00%',
      };
      setOpenOrders((prev) => [limitOrder, ...prev]);

      addToast({
        title: `Simulated Limit Order Placed`,
        message: `${orderData.side} ${orderData.quantity} ${orderData.symbol} at $${orderData.price.toLocaleString()} placed on order book.`,
        type: 'info',
      });

      return { success: true, orderId };
    }
  }, [addToast]);

  // Cancel Open Order
  const cancelOrder = useCallback((orderId) => {
    setOpenOrders((prev) => prev.filter((o) => o.id !== orderId));
    addToast({
      title: 'Order Cancelled',
      message: `Simulated order ${orderId} was cancelled.`,
      type: 'warning',
    });
  }, [addToast]);

  // Close Position
  const closePosition = useCallback((positionId) => {
    const pos = positions.find((p) => p.id === positionId);
    if (!pos) return;

    setPositions((prev) => prev.filter((p) => p.id !== positionId));

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const closeTrade = {
      id: `TRD-${Math.floor(10000 + Math.random() * 90000)}`,
      timestamp: now,
      instrument: pos.symbol,
      side: pos.side === 'LONG' ? 'SELL' : 'BUY',
      quantity: pos.size,
      entryPrice: pos.entryPrice,
      exitPrice: pos.currentPrice,
      pnl: pos.pnl,
      pnlPercent: pos.pnlPercent,
      fee: 1.5,
      status: pos.pnl >= 0 ? 'COMPLETED' : 'STOP_LOSS',
      strategy: pos.strategy,
    };
    setTrades((prev) => [closeTrade, ...prev]);

    // Update realized PnL
    setPortfolio((prev) => ({
      ...prev,
      realizedPnl: prev.realizedPnl + pos.pnl,
      totalBalance: prev.totalBalance + pos.pnl,
    }));

    addToast({
      title: `Position Closed: ${pos.symbol}`,
      message: `Realized P&L: ${pos.pnl >= 0 ? '+' : ''}$${pos.pnl.toFixed(2)} (${pos.pnlPercent.toFixed(2)}%)`,
      type: pos.pnl >= 0 ? 'success' : 'warning',
    });
  }, [positions, addToast]);

  // Toggle Strategy Status
  const toggleStrategy = useCallback((id) => {
    setStrategies((prev) =>
      prev.map((strat) => {
        if (strat.id === id) {
          const nextStatus = strat.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
          addToast({
            title: `Strategy ${nextStatus === 'ACTIVE' ? 'Activated' : 'Paused'}`,
            message: `${strat.name} is now ${nextStatus.toLowerCase()}.`,
            type: nextStatus === 'ACTIVE' ? 'success' : 'info',
          });
          return { ...strat, status: nextStatus };
        }
        return strat;
      })
    );
  }, [addToast]);

  // Add Strategy
  const addStrategy = useCallback((newStrat) => {
    const created = {
      id: `strat-${Date.now()}`,
      status: 'ACTIVE',
      winRate: 67.5,
      monthlyReturn: 12.8,
      sharpeRatio: 2.15,
      maxDrawdown: 5.4,
      totalTrades: 0,
      pnl: 0,
      lastSignal: { action: 'INITIALIZING', price: 0, time: 'Just now' },
      ...newStrat,
    };
    setStrategies((prev) => [created, ...prev]);
    addToast({
      title: 'Strategy Deployed to Lab',
      message: `${newStrat.name} was successfully configured and saved.`,
      type: 'success',
    });
    return created;
  }, [addToast]);

  return (
    <TradingContext.Provider
      value={{
        instruments,
        selectedSymbol,
        setSelectedSymbol,
        selectedInstrument,
        watchlist,
        toggleWatchlist,
        portfolio,
        positions,
        closePosition,
        strategies,
        toggleStrategy,
        addStrategy,
        trades,
        openOrders,
        executeSimulatedOrder,
        cancelOrder,
        isDemoMode,
        isDemoData: IS_DEMO_DATA,
      }}
    >
      {children}
    </TradingContext.Provider>
  );
};

export const useTrading = () => {
  const context = useContext(TradingContext);
  if (!context) {
    throw new Error('useTrading must be used within a TradingProvider');
  }
  return context;
};
