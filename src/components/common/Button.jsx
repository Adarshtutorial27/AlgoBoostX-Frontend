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
      'bg-gradient-to-r from-[#00FF66] to-[#00E676] hover:from-[#33ff85] hover:to-[#00cc55] text-slate-950 font-bold shadow-lg shadow-[#00FF66]/20 hover:shadow-[#00FF66]/35 border border-[#00FF66]/40',
    lime:
      'bg-[#00FF66] hover:bg-[#33ff85] text-slate-950 font-bold shadow-md shadow-[#00FF66]/25 border border-[#00FF66]/50',
    secondary:
      'bg-[#0c121c] hover:bg-[#141d2c] text-slate-200 border border-white/[0.08] hover:border-[#00FF66]/40 shadow-md',
    ai:
      'bg-gradient-to-r from-[#00FF66] via-cyan-400 to-indigo-500 hover:opacity-95 text-slate-950 font-bold shadow-lg shadow-[#00FF66]/20 border border-[#00FF66]/40',
    success:
      'bg-[#00FF66] hover:bg-[#33ff85] text-slate-950 shadow-lg shadow-[#00FF66]/25 border border-[#00FF66]/40 font-bold',
    danger:
      'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/25 border border-rose-500/40 font-semibold',
    outline:
      'bg-transparent hover:bg-white/[0.04] text-slate-200 border border-white/[0.12] hover:border-[#00FF66]/60 hover:text-[#00FF66]',
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
