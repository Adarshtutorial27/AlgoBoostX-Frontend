import React, { createContext, useContext, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';
import { DEMO_NOTIFICATIONS } from '../data/demoData';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const [notifications, setNotifications] = useState(DEMO_NOTIFICATIONS);

  const addToast = useCallback(({ title, message, type = 'info', duration = 4000 }) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    const newToast = { id, title, message, type };

    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const dismissNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        toasts,
        addToast,
        removeToast,
        notifications,
        markAllAsRead,
        dismissNotification,
      }}
    >
      {children}

      {/* Floating Toasts Viewport */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => {
            let icon = <Info className="w-5 h-5 text-cyan-400 shrink-0" />;
            let borderColor = 'border-cyan-500/30';
            let bgGlow = 'rgba(6, 182, 212, 0.08)';

            if (toast.type === 'success') {
              icon = <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />;
              borderColor = 'border-emerald-500/30';
              bgGlow = 'rgba(16, 185, 129, 0.08)';
            } else if (toast.type === 'warning') {
              icon = <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />;
              borderColor = 'border-amber-500/30';
              bgGlow = 'rgba(245, 158, 11, 0.08)';
            } else if (toast.type === 'error') {
              icon = <XCircle className="w-5 h-5 text-rose-400 shrink-0" />;
              borderColor = 'border-rose-500/30';
              bgGlow = 'rgba(244, 63, 94, 0.08)';
            }

            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 15, scale: 0.95 }}
                transition={{ duration: 0.25 }}
                className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl bg-[#0d1322]/95 backdrop-blur-xl border ${borderColor} shadow-2xl shadow-black/60 text-slate-100`}
                style={{ backgroundColor: bgGlow }}
              >
                {icon}
                <div className="flex-1 min-w-0">
                  {toast.title && (
                    <div className="font-semibold text-sm tracking-wide text-white">
                      {toast.title}
                    </div>
                  )}
                  <div className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                    {toast.message}
                  </div>
                </div>
                <button
                  onClick={() => removeToast(toast.id)}
                  className="text-slate-400 hover:text-white transition-colors p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
