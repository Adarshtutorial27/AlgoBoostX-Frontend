import React from 'react';
import { motion } from 'framer-motion';

export const Tabs = ({
  tabs,
  activeTab,
  onChange,
  size = 'md',
  variant = 'pills',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'text-xs px-3 py-1.5',
    md: 'text-sm px-4 py-2',
    lg: 'text-base px-5 py-2.5',
  }[size] || 'text-sm px-4 py-2';

  if (variant === 'underline') {
    return (
      <div className={`flex items-center gap-6 border-b border-white/[0.08] ${className}`}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`relative pb-3 font-medium transition-colors text-sm flex items-center gap-2 ${
                isActive ? 'text-cyan-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.icon && <span>{tab.icon}</span>}
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-300">
                  {tab.badge}
                </span>
              )}
              {isActive && (
                <motion.div
                  layoutId="activeUnderlineTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-400 to-emerald-400"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center p-1 rounded-xl bg-slate-900/90 border border-white/[0.07] ${className}`}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`relative rounded-lg font-medium transition-colors flex items-center gap-2 ${sizeClasses} ${
              isActive ? 'text-slate-950 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="activePillTab"
                className="absolute inset-0 rounded-lg bg-gradient-to-r from-cyan-400 to-emerald-400 shadow-md shadow-cyan-500/20"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              {tab.icon && <span>{tab.icon}</span>}
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive ? 'bg-slate-900/40 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default Tabs;
