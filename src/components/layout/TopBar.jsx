import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Menu,
  Search,
  Bell,
  CheckCheck,
  Shield,
  User,
  Sliders,
  LogOut,
  ChevronDown,
  Sparkles,
  Zap,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTrading } from '../../context/TradingContext';
import { useNotifications } from '../../context/NotificationContext';
import { DemoModePill } from '../common/DemoBadge';

export const TopBar = ({ setIsMobileOpen }) => {
  const { user, logout } = useAuth();
  const { instruments, selectedSymbol, setSelectedSymbol } = useTrading();
  const { notifications, markAllAsRead, dismissNotification } = useNotifications();

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const navigate = useNavigate();
  const notifRef = useRef(null);
  const profileRef = useRef(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filteredInstruments = instruments.filter(
    (i) =>
      i.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-30 h-16 w-full bg-[#080c16]/80 backdrop-blur-xl border-b border-white/[0.07] px-4 lg:px-8 flex items-center justify-between gap-4">
      {/* Left: Mobile Toggle & Quick Search */}
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <button
          onClick={() => setIsMobileOpen((prev) => !prev)}
          className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Search input with drop results */}
        <div className="relative w-full">
          <div className="relative flex items-center">
            <Search className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search markets, AI strategies, symbols (e.g. BTC, NVDA)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchOpen(true)}
              className="w-full pl-9 pr-4 py-1.5 rounded-xl bg-slate-900/80 border border-white/[0.08] text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all font-sans"
            />
          </div>

          {/* Quick Search Dropdown */}
          {searchOpen && searchQuery && (
            <div className="absolute top-full left-0 right-0 mt-2 rounded-xl bg-[#0b101d] border border-cyan-500/30 shadow-2xl p-2 z-50">
              <div className="text-[10px] font-mono uppercase text-slate-500 px-2 py-1">Matching Instruments</div>
              {filteredInstruments.length > 0 ? (
                filteredInstruments.map((inst) => (
                  <button
                    key={inst.symbol}
                    onClick={() => {
                      setSelectedSymbol(inst.symbol);
                      setSearchQuery('');
                      setSearchOpen(false);
                      navigate('/terminal');
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-left hover:bg-white/[0.06] transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-white">{inst.symbol}</span>
                      <span className="text-[11px] text-slate-400">{inst.name}</span>
                    </div>
                    <span className="text-xs font-mono font-semibold text-cyan-400">
                      ${inst.price.toLocaleString()}
                    </span>
                  </button>
                ))
              ) : (
                <div className="text-xs text-slate-400 p-2 text-center">No instruments found</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right: Market status, Demo Mode indicator, Notifications, Profile */}
      <div className="flex items-center gap-3">
        {/* Market Status pill */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/40 border border-emerald-500/25 text-emerald-300 text-xs font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]" />
          <span>MARKETS ACTIVE</span>
        </div>

        {/* Demo Mode Badge */}
        <DemoModePill />

        {/* Notification Bell Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-cyan-500 text-slate-950 font-mono text-[10px] font-bold flex items-center justify-center shadow-lg shadow-cyan-500/40">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Drawer */}
          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-[#0c1120] border border-white/[0.08] shadow-2xl shadow-black/80 z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-[#090d18]">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-white">System Events</span>
                  {unreadCount > 0 && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 font-mono">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <button
                  onClick={markAllAsRead}
                  className="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Mark all read</span>
                </button>
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-white/[0.03]">
                {notifications.length > 0 ? (
                  notifications.map((item) => (
                    <div
                      key={item.id}
                      className={`p-3.5 hover:bg-white/[0.02] transition-colors ${
                        !item.read ? 'bg-cyan-500/[0.04]' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-semibold text-xs text-white">{item.title}</div>
                        <span className="text-[10px] text-slate-500 shrink-0 font-mono">{item.time}</span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">{item.message}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-slate-500 text-center py-6">No notifications</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile Avatar & Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-white/[0.06] transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-emerald-400 flex items-center justify-center text-xs font-bold text-slate-950 font-mono">
              {user?.name ? user.name.charAt(0) : 'A'}
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-[#0c1120] border border-white/[0.08] shadow-2xl shadow-black/80 z-50 p-2">
              <div className="px-3 py-2 border-b border-white/[0.06]">
                <div className="font-semibold text-xs text-white truncate">{user?.name || 'Quant Trader'}</div>
                <div className="text-[11px] text-slate-400 truncate">{user?.email}</div>
                <div className="mt-1">
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    SIMULATED PRO
                  </span>
                </div>
              </div>

              <div className="py-1">
                <Link
                  to="/settings"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-white/[0.05] transition-colors"
                >
                  <Sliders className="w-3.5 h-3.5 text-slate-400" />
                  <span>Terminal Settings</span>
                </Link>
                <Link
                  to="/"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-white/[0.05] transition-colors"
                >
                  <Zap className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Landing Page</span>
                </Link>
              </div>

              <div className="pt-1 border-t border-white/[0.06]">
                <button
                  onClick={() => {
                    setProfileOpen(false);
                    logout();
                    navigate('/login');
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-rose-400 hover:bg-rose-500/10 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopBar;
