import React, { useState } from 'react';
import {
  Sliders,
  User,
  Shield,
  Bell,
  Server,
  Key,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import { DemoBadge } from '../components/common/DemoBadge';

export const SettingsPage = () => {
  const { user, backendStatus, checkBackendNow } = useAuth();
  const { addToast } = useNotifications();

  // Profile Form State
  const [name, setName] = useState(user?.name || 'Alex Rivera');
  const [email, setEmail] = useState(user?.email || 'quant.alex@algoboostx.ai');

  // Notifications State
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [orderFills, setOrderFills] = useState(true);
  const [circuitBreakerAlerts, setCircuitBreakerAlerts] = useState(true);

  // Security / 2FA State
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);

  // Exchange API Simulated Key State
  const [exchangeApiKey, setExchangeApiKey] = useState('binance_demo_key_9941a8');
  const [exchangeSecretMasked] = useState('••••••••••••••••••••••••••••••••');
  const [isTestingBackend, setIsTestingBackend] = useState(false);

  const handleSaveProfile = (e) => {
    e.preventDefault();
    addToast({
      title: 'Profile Updated',
      message: 'Your profile settings were successfully updated.',
      type: 'success',
    });
  };

  const handlePingBackend = async () => {
    setIsTestingBackend(true);
    const res = await checkBackendNow();
    setIsTestingBackend(false);
    if (res.connected) {
      addToast({
        title: 'Backend API Connected',
        message: `Successfully connected to ${res.url}`,
        type: 'success',
      });
    } else {
      addToast({
        title: 'Backend Offline / In Progress',
        message: `Could not reach ${res.url}. Operating in local demo simulation mode.`,
        type: 'warning',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#090e1c] border border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-heading font-extrabold text-white tracking-wide">
              Platform & Integration Settings
            </h1>
            <DemoBadge size="sm" />
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Manage your trader profile, backend endpoint connectivity, notifications, and simulated API keys.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Profile & Security */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Card */}
          <Card
            title="Quantitative Trader Profile"
            subtitle="Account credentials and display handle"
            headerBadge={<DemoBadge size="xs" />}
          >
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1.5">Display Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/[0.08] text-xs text-white focus:outline-none focus:border-cyan-500/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1.5">Registered Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/[0.08] text-xs text-white focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button type="submit" variant="primary" size="sm">
                  Save Changes
                </Button>
              </div>
            </form>
          </Card>

          {/* Backend Connection Diagnostics */}
          <Card
            title="Backend Integration Status"
            subtitle="API endpoint handshake surveillance"
            headerBadge={
              <Badge variant={backendStatus.connected ? 'green' : 'amber'} size="xs" dot>
                {backendStatus.connected ? 'BACKEND ONLINE' : 'SIMULATION MODE'}
              </Badge>
            }
          >
            <div className="space-y-4 text-xs font-mono">
              <div className="p-4 rounded-xl bg-slate-900/60 border border-white/[0.06] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Endpoint URL (VITE_API_BASE_URL):</span>
                  <span className="text-cyan-300 font-bold">{backendStatus.url || 'http://localhost:5000/api'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Status Response:</span>
                  <span
                    className={`font-bold ${
                      backendStatus.connected ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    {backendStatus.connected
                      ? 'HTTP 200 OK — Ready for Live Pipeline'
                      : 'OFFLINE / NOT YET DEPLOYED (Graceful Fallback)'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">WebSocket URL (VITE_WS_URL):</span>
                  <span className="text-slate-300">ws://localhost:5000/ws</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                  The frontend is designed to consume the centralized backend API service. When your backend partner launches the server on port 5000, test the ping here.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePingBackend}
                  isLoading={isTestingBackend}
                  leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                  className="shrink-0 ml-4"
                >
                  Ping Backend
                </Button>
              </div>
            </div>
          </Card>

          {/* Exchange API Keys (Simulated) */}
          <Card
            title="Exchange API Keys (Simulated Demo)"
            subtitle="Secure credential management for trade routing"
            headerBadge={<DemoBadge size="xs" />}
          >
            <div className="space-y-4 text-xs font-mono">
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-center gap-2 font-sans">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>
                  Never paste actual production API private secrets into frontend code. These fields are strictly for simulated demo verification.
                </span>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Exchange API Key (Public Read-Only)</label>
                <input
                  type="text"
                  value={exchangeApiKey}
                  onChange={(e) => setExchangeApiKey(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/[0.08] text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Exchange API Secret (Encrypted Mock)</label>
                <input
                  type="text"
                  disabled
                  value={exchangeSecretMasked}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/[0.05] text-xs text-slate-500 cursor-not-allowed"
                />
              </div>

              <div className="flex justify-end pt-1">
                <Button
                  variant="secondary"
                  size="xs"
                  onClick={() => addToast({ title: 'Keys Saved', message: 'Simulated API keys verified for demo exchange.', type: 'info' })}
                >
                  Verify Simulated Key
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Notification Preferences & Security */}
        <div className="lg:col-span-1 space-y-6">
          {/* Notification Preferences */}
          <Card
            title="Notification Triggers"
            subtitle="Real-time alert preferences"
            headerBadge={<DemoBadge size="xs" />}
          >
            <div className="space-y-4 text-xs">
              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-white/[0.04] cursor-pointer">
                <div>
                  <div className="font-semibold text-white">Order Fill Notifications</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Alert on simulated order fills</div>
                </div>
                <input
                  type="checkbox"
                  checked={orderFills}
                  onChange={(e) => setOrderFills(e.target.checked)}
                  className="w-4 h-4 rounded text-cyan-500 focus:ring-cyan-500"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-white/[0.04] cursor-pointer">
                <div>
                  <div className="font-semibold text-white">Circuit Breaker Alerts</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">High-priority risk notices</div>
                </div>
                <input
                  type="checkbox"
                  checked={circuitBreakerAlerts}
                  onChange={(e) => setCircuitBreakerAlerts(e.target.checked)}
                  className="w-4 h-4 rounded text-cyan-500 focus:ring-cyan-500"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-white/[0.04] cursor-pointer">
                <div>
                  <div className="font-semibold text-white">AI Strategy Signals</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Notify on algorithm buy/sell triggers</div>
                </div>
                <input
                  type="checkbox"
                  checked={emailAlerts}
                  onChange={(e) => setEmailAlerts(e.target.checked)}
                  className="w-4 h-4 rounded text-cyan-500 focus:ring-cyan-500"
                />
              </label>
            </div>
          </Card>

          {/* Security & 2FA */}
          <Card
            title="Security & 2-Factor Auth"
            subtitle="Account integrity settings"
            headerBadge={<DemoBadge size="xs" />}
          >
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-white/[0.04]">
                <div>
                  <div className="font-semibold text-white">Two-Factor Authentication</div>
                  <div className="text-[11px] text-emerald-400 mt-0.5">Enabled (Authenticator App)</div>
                </div>
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => {
                    setTwoFactorEnabled(!twoFactorEnabled);
                    addToast({
                      title: '2FA Updated',
                      message: twoFactorEnabled ? '2FA disabled (demo mode)' : '2FA enabled with authenticator',
                      type: 'info',
                    });
                  }}
                >
                  {twoFactorEnabled ? 'Configure' : 'Enable'}
                </Button>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] text-[11px] text-slate-400 font-mono">
                Active Session: Chrome 134 on Windows 11 (Demo Terminal Session)
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
