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
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex justify-between items-center bg-slate-800/40 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Effective Permissions Matrix</h3>
              <p className="text-xs text-slate-400">
                Capabilities for {inspectUser.first_name || 'User'} ({inspectUser.phone_number})
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          {inspectLoading ? (
            <div className="py-12 text-center text-slate-400 flex flex-col items-center">
              <RefreshCw className="w-6 h-6 animate-spin text-teal-400 mb-2" />
              <span>Loading effective user permissions...</span>
            </div>
          ) : inspectPerms && Object.keys(inspectPerms).length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.entries(inspectPerms).map(([permKey, scopes]) => (
                <div key={permKey} className="bg-slate-950/60 border border-slate-800 p-3 rounded-xl flex items-center justify-between">
                  <div className="font-mono text-slate-200 text-[11px] font-semibold">{permKey}</div>
                  <div className="flex gap-1">
                    {scopes.map(s => (
                      <span 
                        key={s} 
                        className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                          s === 'global' ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
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
        <div className="px-6 py-4 border-t border-slate-800 flex justify-end bg-slate-800/20 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold transition cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
