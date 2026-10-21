import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { NotificationProvider } from './context/NotificationContext';
import { AuthProvider } from './context/AuthContext';
import { TradingProvider } from './context/TradingContext';

import DashboardLayout from './components/layout/DashboardLayout';
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import MarketsPage from './pages/MarketsPage';
import StrategyLabPage from './pages/StrategyLabPage';
import BacktestingPage from './pages/BacktestingPage';
import TradingTerminalPage from './pages/TradingTerminalPage';
import PortfolioPage from './pages/PortfolioPage';
import TradeHistoryPage from './pages/TradeHistoryPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import SettingsPage from './pages/SettingsPage';

export function App() {
  return (
    <BrowserRouter>
      <NotificationProvider>
        <AuthProvider>
          <TradingProvider>
            <Routes>
              {/* Public Landing Page */}
              <Route path="/" element={<LandingPage />} />

              {/* Authentication */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />

              {/* Main Animated Trading Application Layout */}
              <Route element={<DashboardLayout />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/markets" element={<MarketsPage />} />
                <Route path="/strategy-lab" element={<StrategyLabPage />} />
                <Route path="/backtesting" element={<BacktestingPage />} />
                <Route path="/terminal" element={<TradingTerminalPage />} />
                <Route path="/portfolio" element={<PortfolioPage />} />
                <Route path="/history" element={<TradeHistoryPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Route>

              {/* Catch-all redirect to Landing */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </TradingProvider>
        </AuthProvider>
      </NotificationProvider>
    </BrowserRouter>
  );
}

export default App;
