import React from 'react';
import { X } from 'lucide-react';

export default function Drawer({ isOpen, onClose, title, children, footer }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex justify-end">
      <div className="bg-white border-l border-[#d1d5dc] w-full max-w-md h-full shadow-elevated flex flex-col animate-slideInRight">
        <div className="flex items-center justify-between border-b border-[#e3e5ea] p-4 sm:p-5 bg-[#f7f6f7] shrink-0">
          <h3 className="font-headline font-serif text-base sm:text-lg font-bold text-slate-900">{title}</h3>
          <button 
            type="button"
            onClick={onClose} 
            className="p-1 rounded-sm text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto admin-scrollbar flex-1 text-xs text-slate-800">
          {children}
        </div>

        {footer && (
          <div className="p-4 sm:p-5 border-t border-[#e3e5ea] bg-[#f7f6f7] shrink-0 flex justify-end gap-2.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

