import React from 'react';
import { UserCheck, X, Phone, ChevronRight, Shield, Building2, RefreshCw, CheckCircle2 } from 'lucide-react';

export default function AssignRoleModal({
  isOpen,
  onClose,
  onSubmit,
  assignLoading,
  userQuery,
  setUserQuery,
  selectedUser,
  setSelectedUser,
  userSuggestions,
  setUserSuggestions,
  selectedRoleId,
  setSelectedRoleId,
  roles,
  selectedRoleObj,
  selectedFacilityId,
  setSelectedFacilityId,
  allFacilities
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex justify-between items-center bg-slate-800/40">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Assign Role to User</h3>
              <p className="text-xs text-slate-400">Delegate administrative or facility capabilities.</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={onSubmit} className="p-6 space-y-4 text-xs">
          
          {/* Step 1: User Lookup */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-teal-400" />
              <span>Target User Phone Number *</span>
            </label>
            
            <div className="relative">
              <input
                type="text"
                required
                placeholder="Search user phone (e.g. 017xxxxxxxx) or name..."
                value={selectedUser ? `${selectedUser.first_name || 'User'} (+880 ${selectedUser.phone_number})` : userQuery}
                onChange={e => {
                  setSelectedUser(null);
                  setUserQuery(e.target.value);
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-mono placeholder-slate-500 focus:outline-none focus:border-teal-500"
              />
              {selectedUser && (
                <button
                  type="button"
                  onClick={() => { setSelectedUser(null); setUserQuery(''); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Suggestions Dropdown */}
            {userSuggestions.length > 0 && !selectedUser && (
              <div className="mt-1 bg-slate-950 border border-slate-800 rounded-xl max-h-36 overflow-y-auto divide-y divide-slate-800/60 shadow-lg">
                {userSuggestions.map(u => (
                  <div
                    key={u.id}
                    onClick={() => {
                      setSelectedUser(u);
                      setUserSuggestions([]);
                    }}
                    className="px-3.5 py-2 hover:bg-slate-800/60 cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <div className="font-semibold text-slate-200">
                        {u.first_name ? `${u.first_name} ${u.last_name || ''}` : 'Registered User'}
                      </div>
                      <div className="font-mono text-[11px] text-teal-400">{u.phone_number}</div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                  </div>
                ))}
              </div>
            )}
            <p className="text-[11px] text-slate-500 mt-1">
              Type a registered phone number to assign.
            </p>
          </div>

          {/* Step 2: Role Selection */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-teal-400" />
              <span>Select Role to Assign *</span>
            </label>
            <select
              required
              value={selectedRoleId}
              onChange={e => setSelectedRoleId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-teal-500 cursor-pointer font-medium"
            >
              <option value="" disabled>Select a role...</option>
              {roles.map(r => (
                <option key={r.id} value={r.id}>
                  {r.name} — [{r.scope_type.toUpperCase()} SCOPE] {r.is_system ? '(System)' : '(Custom)'}
                </option>
              ))}
            </select>
            {selectedRoleObj && (
              <div className="mt-1 text-[11px] text-slate-400">
                Scope: <span className="font-bold uppercase text-slate-300">{selectedRoleObj.scope_type}</span>
                {selectedRoleObj.description && ` — ${selectedRoleObj.description}`}
              </div>
            )}
          </div>

          {/* Step 3: Dynamic Facility Selector (for Facility-Scoped Roles) */}
          {selectedRoleObj?.scope_type === 'facility' && (
            <div className="p-3.5 bg-slate-950/70 border border-emerald-500/30 rounded-2xl space-y-2">
              <label className="block text-slate-200 font-semibold flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Target Facility Location *</span>
              </label>
              <select
                required
                value={selectedFacilityId}
                onChange={e => setSelectedFacilityId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="">Select target Hospital / Diagnostic Center...</option>
                {allFacilities.map(f => (
                  <option key={f.id} value={f.id}>
                    {f.name} {f.branch ? `(${f.branch})` : ''} [{f.type.replace('_', ' ').toUpperCase()}]
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-slate-400">
                This role is scoped specifically to this location.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-800 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={assignLoading}
              className="px-5 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-xl font-bold transition flex items-center gap-2 shadow-lg shadow-teal-500/20 disabled:opacity-50 cursor-pointer"
            >
              {assignLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              <span>Confirm Assignment</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
