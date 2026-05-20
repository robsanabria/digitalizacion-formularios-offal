import React, { createContext, useContext, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast debe usarse dentro de ToastProvider');
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = {
    success: (msg, dur) => addToast(msg, 'success', dur),
    error: (msg, dur) => addToast(msg, 'error', dur),
    warning: (msg, dur) => addToast(msg, 'warning', dur),
    info: (msg, dur) => addToast(msg, 'info', dur),
  };

  const iconMap = {
    success: <CheckCircle className="text-emerald-400 shrink-0" size={18} />,
    error: <XCircle className="text-rose-400 shrink-0" size={18} />,
    warning: <AlertCircle className="text-amber-400 shrink-0" size={18} />,
    info: <Info className="text-sky-400 shrink-0" size={18} />,
  };

  const bgMap = {
    success: 'bg-slate-900/95 border-emerald-500/30 text-emerald-50 shadow-[0_4px_20px_rgba(16,185,129,0.15)]',
    error: 'bg-slate-900/95 border-rose-500/30 text-rose-50 shadow-[0_4px_20px_rgba(244,63,94,0.15)]',
    warning: 'bg-slate-900/95 border-amber-500/30 text-amber-50 shadow-[0_4px_20px_rgba(245,158,11,0.15)]',
    info: 'bg-slate-900/95 border-sky-500/30 text-sky-50 shadow-[0_4px_20px_rgba(14,165,233,0.15)]',
  };

  const accentBarMap = {
    success: 'bg-emerald-500',
    error: 'bg-rose-500',
    warning: 'bg-amber-500',
    info: 'bg-sky-500',
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 w-full max-w-sm pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: -20, scale: 0.95, x: 20 }}
              animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.9, x: 50, transition: { duration: 0.15 } }}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border backdrop-blur-md relative overflow-hidden ${bgMap[t.type]}`}
            >
              {/* Left border accent line */}
              <div className={`absolute left-0 top-0 bottom-0 w-1 ${accentBarMap[t.type]}`} />
              
              <div className="pl-1.5 flex items-start gap-3 w-full">
                {iconMap[t.type]}
                <div className="flex-1 text-xs font-semibold leading-relaxed break-words pr-2">
                  {t.message}
                </div>
                <button
                  onClick={() => removeToast(t.id)}
                  className="text-slate-400 hover:text-white transition-colors p-0.5 rounded-full hover:bg-white/10 shrink-0"
                >
                  <X size={14} />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};
