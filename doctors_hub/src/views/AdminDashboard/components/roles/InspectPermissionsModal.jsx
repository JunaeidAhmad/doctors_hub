import React from 'react';
import { Shield, X, RefreshCw } from 'lucide-react';

export default function InspectPermissionsModal({
  inspectUser,
  inspectPerms,
  inspectLoading,
  onClose
}) {
  if (!inspectUser) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white border border-[#d1d5dc] rounded-sm max-w-2xl w-full shadow-elevated overflow-hidden max-h-[85vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-[#d1d5dc] flex justify-between items-center bg-[#faf9fa] shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xs bg-[#e7ebff] text-[#094cb2]">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-serif font-bold text-[#1b1c1d]">Effective Permissions Matrix</h3>
              <p className="text-[11px] text-slate-500 font-body">
                Capabilities for {inspectUser.first_name || 'User'} ({inspectUser.phone_number})
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-sm hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-3 text-xs font-body">
          {inspectLoading ? (
            <div className="py-12 text-center text-slate-400 flex flex-col items-center">
              <RefreshCw className="w-5 h-5 animate-spin text-[#094cb2] mb-2" />
              <span>Loading effective user permissions...</span>
            </div>
          ) : inspectPerms && Object.keys(inspectPerms).length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {Object.entries(inspectPerms).map(([permKey, scopes]) => (
                <div key={permKey} className="bg-[#faf9fa] border border-[#e3e5ea] p-2.5 rounded-xs flex items-center justify-between">
                  <div className="font-mono text-slate-800 text-[11px] font-semibold">{permKey}</div>
                  <div className="flex gap-1">
                    {scopes.map(s => (
                      <span 
                        key={s} 
                        className={`px-1.5 py-0.5 rounded-xs text-[9px] font-label font-bold uppercase ${
                          s === 'global' ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-slate-400">
              No individual granular permissions mapped.
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-[#d1d5dc] flex justify-end bg-[#faf9fa] shrink-0">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 border border-[#d1d5dc] bg-white hover:bg-[#f7f6f7] text-slate-700 rounded-sm font-label font-semibold text-xs transition cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
