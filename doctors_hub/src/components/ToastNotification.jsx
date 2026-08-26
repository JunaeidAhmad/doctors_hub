import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export default function ToastNotification({ message, type = 'success', onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4500);
    return () => clearTimeout(timer);
  }, [onClose]);

  if (!message) return null;

  const isError = type === 'error';
  const Icon = isError ? AlertCircle : CheckCircle2;
  const borderColor = isError ? 'border-rose-500/50' : 'border-emerald-500/50';
  const iconBgColor = isError ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-slate-950';
  const titleColor = isError ? 'text-rose-400' : 'text-emerald-400';
  const titleText = isError ? 'Error' : 'DoctorHub System Notification';

  return (
    <div className={`max-w-md w-full bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border ${borderColor} flex items-start gap-3 animate-slideUp pointer-events-auto`}>
      <div className={`p-1 rounded-full ${iconBgColor} shrink-0`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1">
        <div className={`font-extrabold text-xs uppercase tracking-wider ${titleColor}`}>
          {titleText}
        </div>
        <p className="text-xs text-slate-200 mt-1 leading-relaxed">
          {message}
        </p>
      </div>
      <button
        onClick={onClose}
        className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
