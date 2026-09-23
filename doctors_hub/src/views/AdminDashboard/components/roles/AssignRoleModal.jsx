import React from 'react';
import { UserCheck, UserPlus, X, Phone, ChevronRight, Shield, Building2, RefreshCw, CheckCircle2 } from 'lucide-react';

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
  allFacilities,
  onCreateNewUser
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white border border-[#d1d5dc] rounded-sm max-w-lg w-full shadow-elevated overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-[#d1d5dc] flex justify-between items-center bg-[#faf9fa]">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xs bg-[#e7ebff] text-[#094cb2]">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-serif font-bold text-[#1b1c1d]">Assign Role to User</h3>
              <p className="text-[11px] text-slate-500 font-body">Delegate administrative or facility access capabilities.</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-sm hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={onSubmit} className="p-5 space-y-4 text-xs font-body">
          
          {/* Step 1: User Lookup */}
          <div>
            <label className="block text-slate-700 font-label font-semibold mb-1 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-[#094cb2]" />
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
                className="w-full bg-white border border-[#d1d5dc] rounded-sm px-3 py-2 text-[#1b1c1d] placeholder-slate-400 focus:outline-none focus:border-[#094cb2]"
              />
              {selectedUser && (
                <button
                  type="button"
                  onClick={() => { setSelectedUser(null); setUserQuery(''); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Suggestions Dropdown */}
            {userSuggestions.length > 0 && !selectedUser && (
              <div className="mt-1 bg-white border border-[#d1d5dc] rounded-sm max-h-36 overflow-y-auto divide-y divide-[#e3e5ea] shadow-card">
                {userSuggestions.map(u => (
                  <div
                    key={u.id}
                    onClick={() => {
                      setSelectedUser(u);
                      setUserSuggestions([]);
                    }}
                    className="px-3 py-2 hover:bg-[#faf9fa] cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <div className="font-semibold text-slate-800">
                        {u.first_name ? `${u.first_name} ${u.last_name || ''}` : 'Registered User'}
                      </div>
                      <div className="font-mono text-[11px] text-[#094cb2]">{u.phone_number}</div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                ))}
              </div>
            )}

            {/* If not found, shortcut to create user */}
            {userQuery.length >= 4 && userSuggestions.length === 0 && !selectedUser && (
              <div className="mt-2 p-2.5 bg-[#faf9fa] border border-[#d1d5dc] rounded-sm flex items-center justify-between">
                <span className="text-slate-600 text-[11px]">User not found with this number?</span>
                <button
                  type="button"
                  onClick={() => onCreateNewUser(userQuery)}
                  className="text-[#094cb2] font-label font-semibold text-[11px] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <UserPlus className="w-3 h-3" />
                  <span>Create User Now</span>
                </button>
              </div>
            )}
          </div>

          {/* Step 2: Role Selection */}
          <div>
            <label className="block text-slate-700 font-label font-semibold mb-1 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-[#094cb2]" />
              <span>Assign Role *</span>
            </label>
            <select
              value={selectedRoleId}
              onChange={e => setSelectedRoleId(e.target.value)}
              className="w-full bg-white border border-[#d1d5dc] rounded-sm px-3 py-2 text-[#1b1c1d] focus:outline-none focus:border-[#094cb2]"
            >
              <option value="">-- Choose a Role --</option>
              {roles.map(r => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.scope_type === 'global' ? 'Global Platform' : r.scope_type === 'facility' ? 'Facility-Scoped' : 'Self'})
                </option>
              ))}
            </select>
            {selectedRoleObj && (
              <p className="text-[11px] text-slate-500 mt-1 italic">
                {selectedRoleObj.description || `Scope: ${selectedRoleObj.scope_type}`}
              </p>
            )}
          </div>

          {/* Step 3: Facility Selection (Conditional) */}
          {selectedRoleObj?.scope_type === 'facility' && (
            <div className="p-3 bg-[#faf9fa] border border-[#094cb2]/20 rounded-sm space-y-2">
              <label className="block text-slate-800 font-label font-semibold flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-[#094cb2]" />
                <span>Target Facility (Hospital / Diagnostic Branch) *</span>
              </label>
              <select
                required
                value={selectedFacilityId}
                onChange={e => setSelectedFacilityId(e.target.value)}
                className="w-full bg-white border border-[#d1d5dc] rounded-sm px-3 py-2 text-[#1b1c1d] focus:outline-none focus:border-[#094cb2]"
              >
                <option value="">-- Select Target Facility --</option>
                {allFacilities.map(f => (
                  <option key={f.id} value={f.id}>
                    {f.name} {f.branch ? `(${f.branch})` : ''} - {f.type === 'hospital' ? 'Hospital' : 'Diagnostic Lab'}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Actions */}
          <div className="pt-3 border-t border-[#d1d5dc] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 border border-[#d1d5dc] bg-white hover:bg-[#f7f6f7] text-slate-700 font-label font-semibold rounded-sm transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={assignLoading}
              className="px-4 py-1.5 bg-[#094cb2] hover:bg-[#083e91] text-white font-label font-semibold rounded-sm shadow-sm flex items-center gap-1.5 disabled:opacity-50 transition cursor-pointer"
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
