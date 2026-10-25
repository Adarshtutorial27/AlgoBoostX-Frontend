import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  DEMO_INSTRUMENTS,
  DEMO_PORTFOLIO_SUMMARY,
  DEMO_OPEN_POSITIONS,
  DEMO_STRATEGIES,
  DEMO_TRADE_HISTORY,
  DEMO_BROKERS,
  DEMO_MIRROR_LEADERS,
  DEMO_AI_STRATEGIES_CATALOG,
  IS_DEMO_DATA,
} from '../data/demoData';
import { useNotifications } from './NotificationContext';
import { api } from '../services/api';

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
  const [brokers, setBrokers] = useState(DEMO_BROKERS);
  const [mirrorLeaders, setMirrorLeaders] = useState(DEMO_MIRROR_LEADERS);
  const [aiStrategiesCatalog, setAiStrategiesCatalog] = useState(DEMO_AI_STRATEGIES_CATALOG);

  // Real backend account & portfolio states
  const [connectedAccounts, setConnectedAccounts] = useState([]);
  const [activeAccountStatus, setActiveAccountStatus] = useState(null);
  const [selectedAccountId, setSelectedAccountId] = useState('all');
  const [realPortfolio, setRealPortfolio] = useState(null);
  const [realPositions, setRealPositions] = useState([]);
  const [realTrades, setRealTrades] = useState([]);
  const [realPerformance, setRealPerformance] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);

  // Broker connection and balance toggle
  const [isBrokerConnected, setIsBrokerConnected] = useState(false);
  const [connectedBrokers, setConnectedBrokers] = useState([]);
  const [showBalance, setShowBalance] = useState(true);

  // Active broker connection modal state
  const [activeBrokerModal, setActiveBrokerModal] = useState(null);

  // Fetch real data from backend
  const refreshRealData = useCallback(async () => {
    setIsSyncing(true);
    try {
      const [accsRes, statusRes, summaryRes, posRes, tradesRes, perfRes] = await Promise.allSettled([
        api.accounts.list(),
        api.accounts.getStatus(),
        api.portfolio.getSummary(),
        api.portfolio.getPositions(),
        api.portfolio.getTrades(50),
        api.portfolio.getPerformance(),
      ]);

      let hasAccounts = false;
      if (accsRes.status === 'fulfilled' && Array.isArray(accsRes.value)) {
        setConnectedAccounts(accsRes.value);
        if (accsRes.value.length > 0) {
          hasAccounts = true;
          setConnectedBrokers(accsRes.value.map((a) => a.account_id || 'delta'));
        }
      }

      if (statusRes.status === 'fulfilled' && statusRes.value && !statusRes.value.isDisconnected) {
        setActiveAccountStatus(statusRes.value);
        if (statusRes.value.has_active_account) {
          hasAccounts = true;
        }
      }

      setIsBrokerConnected(hasAccounts);

      if (summaryRes.status === 'fulfilled' && summaryRes.value && !summaryRes.value.isDisconnected) {
        setRealPortfolio(summaryRes.value);
      }
      if (posRes.status === 'fulfilled' && Array.isArray(posRes.value)) {
        setRealPositions(posRes.value);
      }
      if (tradesRes.status === 'fulfilled' && Array.isArray(tradesRes.value)) {
        setRealTrades(tradesRes.value);
      }
      if (perfRes.status === 'fulfilled' && perfRes.value && !perfRes.value.isDisconnected) {
        setRealPerformance(perfRes.value);
      }

      setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err) {
      console.error('Failed to sync backend account data:', err);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // Initial mount sync
  useEffect(() => {
    refreshRealData();
  }, [refreshRealData]);

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

  const toggleShowBalance = useCallback(() => {
    setShowBalance((prev) => !prev);
  }, []);

  const connectBroker = useCallback(async (brokerId, { apiKey, secretKey, label }) => {
    if (brokerId === 'delta') {
      try {
        const res = await api.accounts.connect({
          apiKey,
          secretKey,
          label: label || 'Delta Exchange Testnet',
        });
        if (res && res.account_id) {
          addToast({
            title: 'Delta Exchange Testnet Linked',
            message: `Account connected successfully (${res.api_key_masked}).`,
            type: 'success',
          });
          await refreshRealData();
          return { success: true, account: res };
        }
      } catch (err) {
        addToast({
          title: 'Account Connected in Sandbox Mode',
          message: err.message || 'Credentials saved for sandbox simulation.',
          type: 'info',
        });
      }
    }

    setConnectedBrokers((prev) => Array.from(new Set([...prev, brokerId])));
    setIsBrokerConnected(true);
    const broker = DEMO_BROKERS.find((b) => b.id === brokerId);
    addToast({
      title: `${broker?.name || brokerId} Connected`,
      message: 'Account linked in demo sandbox mode.',
      type: 'success',
    });
    return { success: true };
  }, [addToast, refreshRealData]);

  const disconnectBroker = useCallback(async (brokerId, accountId = null) => {
    if (accountId) {
      try {
        await api.accounts.disconnect(accountId);
        await refreshRealData();
      } catch (err) {
        console.error('Error disconnecting account:', err);
      }
    }
    setConnectedBrokers((prev) => {
      const next = prev.filter((id) => id !== brokerId);
      if (next.length === 0 && (!connectedAccounts || connectedAccounts.length <= 1)) {
        setIsBrokerConnected(false);
      }
      return next;
    });
    const broker = DEMO_BROKERS.find((b) => b.id === brokerId);
    addToast({
      title: `${broker?.name || brokerId} Disconnected`,
      message: 'Account connection unlinked.',
      type: 'info',
    });
  }, [addToast, connectedAccounts, refreshRealData]);

  const togglePaperTrading = useCallback((strategyId) => {
    setAiStrategiesCatalog((prev) =>
      prev.map((strat) => {
        if (strat.id === strategyId) {
          const next = !strat.isPaperTrading;
          addToast({
            title: `${strat.name} Mode Changed`,
            message: next ? 'Switched to Paper Trading (Demo)' : 'Ready for Live Backend Execution',
            type: next ? 'info' : 'warning',
          });
          return { ...strat, isPaperTrading: next };
        }
        return strat;
      })
    );
  }, [addToast]);

  const updateStrategyCatalog = useCallback((strategyId, updates) => {
    setAiStrategiesCatalog((prev) =>
      prev.map((strat) => (strat.id === strategyId ? { ...strat, ...updates } : strat))
    );
    addToast({
      title: 'Strategy Configuration Updated',
      message: 'Parameters successfully saved in memory.',
      type: 'success',
    });
  }, [addToast]);

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
        // Upgraded features
        isBrokerConnected,
        setIsBrokerConnected,
        connectedBrokers,
        showBalance,
        toggleShowBalance,
        connectBroker,
        disconnectBroker,
        activeBrokerModal,
        setActiveBrokerModal,
        brokers,
        // Real Backend Integrations & Account-Aware State
        connectedAccounts,
        activeAccountStatus,
        selectedAccountId,
        setSelectedAccountId,
        realPortfolio,
        realPositions,
        realTrades,
        realPerformance,
        isSyncing,
        lastSyncTime,
        refreshRealData,
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
