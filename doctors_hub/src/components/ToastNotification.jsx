import React, { useEffect } from 'react';
import { CheckCircle2, X } from 'lucide-react';

export default function ToastNotification({ message, onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4500);
    return () => clearTimeout(timer);
  }, [onClose]);

  if (!message) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-emerald-500/50 flex items-start gap-3 animate-slideUp">
      <div className="p-1 rounded-full bg-emerald-500 text-slate-950 shrink-0">
        <CheckCircle2 className="w-5 h-5" />
      </div>
      <div className="flex-1">
        <div className="font-extrabold text-xs text-emerald-400 uppercase tracking-wider">
          DoctorHub System Notification
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
