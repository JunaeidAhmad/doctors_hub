import React from 'react';
import { Plus } from 'lucide-react';

export default function EmptyState({ 
  icon: Icon, 
  title = 'No records found', 
  description = 'There is currently no data to display.', 
  actionLabel, 
  onAction,
  className = ''
}) {
  return (
    <div className={`py-12 px-4 flex flex-col items-center justify-center text-center animate-fadeIn ${className}`}>
      {Icon && (
        <div className="w-14 h-14 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-400 mb-4 shadow-inner">
          <Icon className="w-7 h-7" />
        </div>
      )}
      <h4 className="text-base font-bold text-white mb-1">{title}</h4>
      <p className="text-xs text-slate-400 max-w-sm mb-5 leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-teal-600/20 active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{actionLabel}</span>
        </button>
      )}
    </div>
  );
}
