import React from 'react';
import { motion } from 'framer-motion';

export const Card = ({
  children,
  className = '',
  title = null,
  subtitle = null,
  headerAction = null,
  headerBadge = null,
  glow = false,
  hoverEffect = false,
  noPadding = false,
  onClick = null,
  ...props
}) => {
  const Component = hoverEffect ? motion.div : 'div';
  const motionProps = hoverEffect
    ? {
        whileHover: { y: -2, transition: { duration: 0.2 } },
      }
    : {};

  return (
    <Component
      {...motionProps}
      onClick={onClick}
      className={`relative rounded-2xl bg-[#0B101E]/75 backdrop-blur-xl border border-white/[0.07] ${
        hoverEffect ? 'hover:border-cyan-500/30 hover:shadow-xl hover:shadow-cyan-950/20 transition-colors' : ''
      } ${glow ? 'shadow-lg shadow-cyan-950/30 border-cyan-500/20' : ''} ${className}`}
      {...props}
    >
      {(title || subtitle || headerAction || headerBadge) && (
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div>
              {title && <h3 className="font-semibold text-sm tracking-wide text-white">{title}</h3>}
              {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
            </div>
            {headerBadge && <div>{headerBadge}</div>}
          </div>
          {headerAction && <div className="flex items-center gap-2">{headerAction}</div>}
        </div>
      )}
      <div className={noPadding ? '' : 'p-5'}>{children}</div>
    </Component>
  );
};

export default Card;
