import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  className = '',
  leftIcon = null,
  rightIcon = null,
  onClick,
  type = 'button',
  ...props
}) => {
  const baseClasses =
    'relative inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 select-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#06080F] focus:ring-cyan-500';

  const sizeClasses = {
    xs: 'text-xs px-2.5 py-1.5 gap-1.5 rounded-lg',
    sm: 'text-xs px-3.5 py-2 gap-1.5 rounded-lg',
    md: 'text-sm px-4 py-2.5 gap-2 rounded-xl',
    lg: 'text-base px-6 py-3.5 gap-2.5 rounded-xl font-semibold',
  }[size] || 'text-sm px-4 py-2.5 gap-2';

  const variantClasses = {
    primary:
      'bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-semibold shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30 hover:glow-cyan border border-cyan-400/30',
    secondary:
      'bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700/60 hover:border-slate-600 shadow-md',
    ai:
      'bg-gradient-to-r from-indigo-500 via-cyan-500 to-emerald-500 hover:opacity-95 text-slate-950 font-semibold shadow-lg shadow-indigo-500/20 border border-cyan-400/40',
    success:
      'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/25 border border-emerald-500/40 font-semibold',
    danger:
      'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/25 border border-rose-500/40 font-semibold',
    outline:
      'bg-transparent hover:bg-white/[0.04] text-slate-200 border border-slate-700 hover:border-cyan-500/60 hover:text-cyan-400',
    ghost:
      'bg-transparent hover:bg-white/[0.06] text-slate-400 hover:text-white',
  }[variant] || 'bg-slate-800 text-white';

  return (
    <motion.button
      type={type}
      whileHover={{ scale: disabled || isLoading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || isLoading ? 1 : 0.98 }}
      className={`${baseClasses} ${sizeClasses} ${variantClasses} ${className}`}
      disabled={disabled || isLoading}
      onClick={onClick}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin text-current" />
          <span>Processing...</span>
        </>
      ) : (
        <>
          {leftIcon && <span className="shrink-0">{leftIcon}</span>}
          <span>{children}</span>
          {rightIcon && <span className="shrink-0">{rightIcon}</span>}
        </>
      )}
    </motion.button>
  );
};

export default Button;
