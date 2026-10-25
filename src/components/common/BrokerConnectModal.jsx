import React, { useState } from 'react';
import {
  ShieldAlert,
  Key,
  Lock,
  Eye,
  EyeOff,
  Copy,
  Check,
  ClipboardPaste,
  Server,
  AlertCircle,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import Modal from './Modal';
import Button from './Button';
import Badge from './Badge';
import { useTrading } from '../../context/TradingContext';
import { useNotifications } from '../../context/NotificationContext';
import { DEMO_BROKERS } from '../../data/demoData';

export const BrokerConnectModal = ({ isOpen, onClose, defaultBrokerId = null }) => {
  const { connectBroker, connectedBrokers } = useTrading();
  const { addToast } = useNotifications();

  const [selectedBrokerId, setSelectedBrokerId] = useState(defaultBrokerId || 'delta');
  const [apiKey, setApiKey] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Keep selectedBrokerId in sync if defaultBrokerId changes
  React.useEffect(() => {
    if (defaultBrokerId) {
      setSelectedBrokerId(defaultBrokerId);
    }
  }, [defaultBrokerId]);

  const activeBroker = DEMO_BROKERS.find((b) => b.id === selectedBrokerId) || DEMO_BROKERS[0];
  const isAlreadyConnected = connectedBrokers.includes(selectedBrokerId);

  const handlePasteKey = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setApiKey(text.trim());
    } catch {
      // Clipboard permissions unavailable
    }
  };

  const handlePasteSecret = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setSecretKey(text.trim());
    } catch {
      // Clipboard permissions unavailable
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!apiKey.trim()) {
      setError('Please provide a valid API key.');
      return;
    }
    if (!secretKey.trim() || secretKey.length < 8) {
      setError('Please provide your secret key (minimum 8 characters).');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      connectBroker(selectedBrokerId, { apiKey: apiKey.trim() });
      // Reset form fields immediately for security
      setApiKey('');
      setSecretKey('');
      onClose();
    }, 900);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Connect Trading Account"
      subtitle={`Configure Direct Market Access (DMA) for ${activeBroker.name}`}
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Security Alert Header */}
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-2.5 text-xs text-amber-300">
          <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-semibold text-white">Security Notice:</span> API credentials are used exclusively for simulated/live order routing. Secrets are never saved to browser storage or logged to console.
          </div>
        </div>

        {/* Broker Selector */}
        <div>
          <label className="block text-xs font-mono text-slate-300 mb-1.5">Select Trading Broker</label>
          <select
            value={selectedBrokerId}
            onChange={(e) => setSelectedBrokerId(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#090e18] border border-white/[0.08] text-sm text-white focus:outline-none focus:border-[#00FF66]/50 font-sans"
          >
            {DEMO_BROKERS.map((b) => (
              <option key={b.id} value={b.id} disabled={!b.isAvailable}>
                {b.name} {!b.isAvailable ? '— (Coming Soon)' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* API Key Field with Paste */}
        <div>
          <div className="flex items-center justify-between text-xs font-mono text-slate-300 mb-1.5">
            <span>API Key</span>
            <button
              type="button"
              onClick={handlePasteKey}
              className="text-[11px] text-[#00FF66] hover:underline flex items-center gap-1"
            >
              <ClipboardPaste className="w-3 h-3" />
              <span>Paste</span>
            </button>
          </div>
          <div className="relative">
            <Key className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="e.g. delta_api_live_8910aa27"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#090e18] border border-white/[0.08] text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-[#00FF66]/50"
              required
            />
          </div>
        </div>

        {/* Secret Key Field with Show/Hide & Paste */}
        <div>
          <div className="flex items-center justify-between text-xs font-mono text-slate-300 mb-1.5">
            <span>API Secret Key</span>
            <button
              type="button"
              onClick={handlePasteSecret}
              className="text-[11px] text-[#00FF66] hover:underline flex items-center gap-1"
            >
              <ClipboardPaste className="w-3 h-3" />
              <span>Paste</span>
            </button>
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type={showSecret ? 'text' : 'password'}
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
              placeholder="••••••••••••••••••••••••"
              className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#090e18] border border-white/[0.08] text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-[#00FF66]/50"
              required
            />
            <button
              type="button"
              onClick={() => setShowSecret(!showSecret)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Configurable IP Whitelisting Info Field */}
        <div className="p-3 rounded-xl bg-slate-900/60 border border-white/[0.06] text-xs space-y-1">
          <div className="flex items-center justify-between font-mono text-slate-400">
            <span className="flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-cyan-400" />
              <span>IP Whitelisting Requirement:</span>
            </span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-mono">
              DYNAMIC
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
            Static third-party IP is not hardcoded. Server IP is provided dynamically by your backend environment upon production handshake.
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Back
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            isLoading={isLoading}
            disabled={!activeBroker.isAvailable}
          >
            {isAlreadyConnected ? 'Update Connection' : 'Connect Account'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default BrokerConnectModal;
