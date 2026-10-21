import React, { useState } from 'react';
import { ShieldAlert, AlertTriangle, CheckCircle, Flame, Lock } from 'lucide-react';
import Card from '../common/Card';
import Badge from '../common/Badge';
import Button from '../common/Button';
import Modal from '../common/Modal';
import { DemoBadge } from '../common/DemoBadge';
import { useNotifications } from '../../context/NotificationContext';

export const RiskMonitoringPanel = () => {
  const { addToast } = useNotifications();
  const [modalOpen, setModalOpen] = useState(false);

  const handleTriggerCircuitBreaker = () => {
    setModalOpen(false);
    addToast({
      title: 'Risk Circuit Breaker Triggered',
      message: 'All automated strategy execution paused. Trailing stops tightened across positions.',
      type: 'warning',
    });
  };

  return (
    <>
      <Card
        title="Risk & Capital Protection"
        subtitle="Automated circuit breakers & margin surveillance"
        headerBadge={<DemoBadge size="xs" />}
        headerAction={
          <Badge variant="green" size="xs" dot>
            HEALTHY
          </Badge>
        }
      >
        <div className="space-y-4">
          {/* Risk Level Bar */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5 font-mono">
              <span className="text-slate-400">Portfolio Volatility Exposure</span>
              <span className="text-cyan-400 font-bold">28 / 100 (Optimal)</span>
            </div>
            <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden p-0.5 border border-white/[0.05]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-cyan-400 to-amber-400 transition-all duration-500"
                style={{ width: '28%' }}
              />
            </div>
          </div>

          {/* Grid of 4 risk parameters */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3 rounded-xl bg-slate-900/60 border border-white/[0.05]">
              <div className="text-[10px] text-slate-500 uppercase font-mono">Margin Usage</div>
              <div className="text-sm font-bold text-white font-mono mt-0.5">67.1%</div>
              <div className="text-[10px] text-emerald-400 mt-0.5">Safe (&lt;80%)</div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-white/[0.05]">
              <div className="text-[10px] text-slate-500 uppercase font-mono">Max Drawdown Limit</div>
              <div className="text-sm font-bold text-white font-mono mt-0.5">7.2% / 12.0%</div>
              <div className="text-[10px] text-cyan-400 mt-0.5">4.8% Buffer</div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-white/[0.05]">
              <div className="text-[10px] text-slate-500 uppercase font-mono">Value at Risk (95% 1D)</div>
              <div className="text-sm font-bold text-white font-mono mt-0.5">$2,840.00</div>
              <div className="text-[10px] text-slate-400 mt-0.5">2.2% of Capital</div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-white/[0.05]">
              <div className="text-[10px] text-slate-500 uppercase font-mono">Slippage Guard</div>
              <div className="text-sm font-bold text-emerald-400 font-mono mt-0.5">ENABLED</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Max 0.08% limit</div>
            </div>
          </div>

          {/* Emergency Circuit Breaker Trigger Button */}
          <div className="pt-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full border-rose-500/30 hover:bg-rose-500/10 text-rose-300 hover:text-rose-200"
              leftIcon={<Flame className="w-4 h-4 text-rose-400" />}
              onClick={() => setModalOpen(true)}
            >
              Simulate Risk Circuit Breaker
            </Button>
          </div>
        </div>
      </Card>

      {/* Confirmation Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Simulate Risk Circuit Breaker"
        subtitle="Emergency Safety Protocol for Demo Environment"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={handleTriggerCircuitBreaker}>
              Confirm Circuit Breaker
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-xs text-slate-300">
          <p>
            Triggering the circuit breaker simulates an emergency shutdown protocol:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-slate-400">
            <li>All 4 active AI trading strategies will be immediately paused.</li>
            <li>All unfulfilled open limit orders will be cancelled.</li>
            <li>Trailing stop-loss protections will be clamped to current market prices.</li>
          </ul>
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>This is a simulated safety demonstration. No real trading capital is affected.</span>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default RiskMonitoringPanel;
