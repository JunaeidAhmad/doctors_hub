import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, X, Info } from 'lucide-react';

export default function Toast({ 
  message, 
  type = 'success', 
  onClose, 
  duration = 4000 
}) {
  useEffect(() => {
    if (!message || !onClose) return;
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  const isSuccess = type === 'success';
  const isError = type === 'error';

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-slideInRight max-w-md">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-2xl backdrop-blur-md ${
        isSuccess 
          ? 'bg-slate-900/95 border-emerald-500/40 text-emerald-300 shadow-emerald-500/10' 
          : isError
          ? 'bg-slate-900/95 border-rose-500/40 text-rose-300 shadow-rose-500/10'
          : 'bg-slate-900/95 border-teal-500/40 text-teal-300 shadow-teal-500/10'
      }`}>
        {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
        {isError && <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />}
        {!isSuccess && !isError && <Info className="w-5 h-5 text-teal-400 shrink-0" />}
        
        <p className="text-xs font-semibold text-slate-100 pr-2 leading-snug">{message}</p>

        <button 
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-white rounded-lg transition shrink-0 ml-auto"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
