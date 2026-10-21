import React from 'react';

export const Badge = ({
  children,
  variant = 'slate',
  size = 'sm',
  dot = false,
  className = '',
}) => {
  const variantStyles = {
    green: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
    red: 'bg-rose-500/10 text-rose-400 border-rose-500/25',
    cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/25',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/25',
    indigo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/25',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/25',
    slate: 'bg-slate-800/60 text-slate-300 border-slate-700/50',
  }[variant] || 'bg-slate-800 text-slate-300 border-slate-700';

  const dotColors = {
    green: 'bg-emerald-400 shadow-[0_0_8px_#34d399]',
    red: 'bg-rose-400 shadow-[0_0_8px_#f87171]',
    cyan: 'bg-cyan-400 shadow-[0_0_8px_#22d3ee]',
    amber: 'bg-amber-400 shadow-[0_0_8px_#fbbf24]',
    indigo: 'bg-indigo-400 shadow-[0_0_8px_#818cf8]',
    purple: 'bg-purple-400 shadow-[0_0_8px_#c084fc]',
    slate: 'bg-slate-400',
  }[variant] || 'bg-slate-400';

  const sizeClasses = {
    xs: 'text-[10px] px-1.5 py-0.5 font-medium',
    sm: 'text-xs px-2.5 py-0.5 font-medium',
    md: 'text-xs px-3 py-1 font-semibold tracking-wide',
  }[size] || 'text-xs px-2.5 py-0.5';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${variantStyles} ${sizeClasses} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColors}`} />}
      <span>{children}</span>
    </span>
  );
};

export default Badge;
