import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  TrendingUp,
  Cpu,
  History,
  Terminal,
  PieChart,
  Settings,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  LogOut,
  ExternalLink,
  Zap,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { DemoBadge } from '../common/DemoBadge';

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { path: '/markets', label: 'Markets', icon: TrendingUp },
  { path: '/strategy-lab', label: 'AI Strategy Lab', icon: Cpu, badge: 'AI' },
  { path: '/backtesting', label: 'Backtesting', icon: History },
  { path: '/terminal', label: 'Trading Terminal', icon: Terminal, badge: 'LIVE' },
  { path: '/portfolio', label: 'Portfolio', icon: PieChart },
  { path: '/history', label: 'Trade History', icon: History },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export const Sidebar = ({ isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen }) => {
  const { user, logout, backendStatus } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen z-40 flex flex-col justify-between bg-[#080c16]/95 backdrop-blur-2xl border-r border-white/[0.07] transition-all duration-300 ${
          isCollapsed ? 'w-20' : 'w-64'
        } ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-white/[0.06]">
          <NavLink to="/" className="flex items-center gap-3 group">
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-emerald-400 p-[1.5px] shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition-all">
              <div className="w-full h-full bg-[#070a12] rounded-[10px] flex items-center justify-center">
                <Zap className="w-5 h-5 text-cyan-400 group-hover:text-emerald-400 transition-colors" />
              </div>
            </div>
            {!isCollapsed && (
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-heading font-extrabold text-base tracking-tight text-white">
                    Algo <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">boostX</span>
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono tracking-wider">AI QUANT PLATFORM</span>
              </div>
            )}
          </NavLink>

          {/* Collapse Button (Desktop) */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex items-center justify-center w-7 h-7 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileOpen(false)}
                className={({ isActive }) =>
                  `relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 group ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500/15 to-emerald-500/10 text-cyan-300 border border-cyan-500/30 font-semibold'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.04]'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={`w-5 h-5 shrink-0 transition-colors ${
                        isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-200'
                      }`}
                    />
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                    {!isCollapsed && item.badge && (
                      <span
                        className={`ml-auto text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${
                          item.badge === 'AI'
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                    {/* Active highlight glow dot */}
                    {isActive && (
                      <motion.div
                        layoutId="sidebarActiveDot"
                        className="absolute left-0 top-2 bottom-2 w-1 rounded-r bg-gradient-to-b from-cyan-400 to-emerald-400 shadow-[0_0_8px_#06b6d4]"
                      />
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Bottom Status & User Profile */}
        <div className="p-3 border-t border-white/[0.06] space-y-3">
          {/* Backend Status indicator */}
          {!isCollapsed && (
            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-white/[0.04] text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-[11px] font-mono">Backend Engine:</span>
                <span
                  className={`flex items-center gap-1.5 font-mono text-[10px] font-semibold ${
                    backendStatus.connected ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      backendStatus.connected
                        ? 'bg-emerald-400 shadow-[0_0_6px_#10b981]'
                        : 'bg-amber-400 animate-pulse'
                    }`}
                  />
                  {backendStatus.connected ? 'CONNECTED' : 'SIMULATED / READY'}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1 truncate font-mono">
                {backendStatus.url || 'VITE_API_BASE_URL'}
              </p>
            </div>
          )}

          {/* User Mini Profile */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] border border-white/[0.04]">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                {user?.name ? user.name.charAt(0) : 'T'}
              </div>
              {!isCollapsed && (
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-white truncate">{user?.name || 'Trader'}</div>
                  <div className="text-[10px] text-slate-400 truncate">{user?.tier || 'Pro Trader'}</div>
                </div>
              )}
            </div>

            {!isCollapsed && (
              <button
                onClick={handleLogout}
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
