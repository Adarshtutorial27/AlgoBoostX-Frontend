import React from 'react';
import { Sparkles, ShieldAlert } from 'lucide-react';

export const DemoBadge = ({ size = 'sm', showIcon = true, variant = 'cyan' }) => {
  const sizeClasses = {
    xs: 'text-[10px] px-1.5 py-0.5',
    sm: 'text-xs px-2 py-0.5 font-medium',
    md: 'text-xs px-2.5 py-1 font-semibold tracking-wider',
  }[size] || 'text-xs px-2 py-0.5';

  const variantStyles = {
    cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  }[variant] || 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';

  return (
    <span
      title="Simulated environment for safety. Real market backend integration ready."
      className={`inline-flex items-center gap-1 rounded-md border uppercase tracking-wider font-mono select-none ${variantStyles} ${sizeClasses}`}
    >
      {showIcon && (variant === 'amber' ? <ShieldAlert className="w-3 h-3" /> : <Sparkles className="w-3 h-3 animate-pulse" />)}
      <span>DEMO DATA</span>
    </span>
  );
};

export const DemoModePill = () => {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 text-xs font-mono">
      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
      <span className="font-semibold tracking-wider">SIMULATED TERMINAL</span>
      <span className="text-[10px] px-1.5 py-0.2 bg-cyan-500/20 text-cyan-200 rounded font-sans">SAFE MODE</span>
    </div>
  );
};
