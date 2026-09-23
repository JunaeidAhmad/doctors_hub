import React, { useState, useEffect, useMemo } from 'react';
import { 
  UserPlus, X, Phone, Shield, Building2, RefreshCw, 
  CheckCircle2, Lock, Eye, EyeOff, User, AlertCircle 
} from 'lucide-react';
import api, { ensureArray } from '../../../../services/api';
import { useAdminContext } from '../../context/AdminContext';

export default function CreateUserModal({
  isOpen,
  onClose,
  onUserCreated,
  roles: propRoles = [],
  allFacilities: propFacilities = [],
  initialPhone = ''
}) {
  const { isSuperAdmin, showToast, hospitals, diagnosticCenters } = useAdminContext();
  const [internalRoles, setInternalRoles] = useState([]);

  useEffect(() => {
    if (isOpen && (!propRoles || propRoles.length === 0)) {
      api.getRoles()
        .then(res => setInternalRoles(ensureArray(res)))
        .catch(console.error);
    }
  }, [isOpen, propRoles]);

  const roles = propRoles && propRoles.length > 0 ? propRoles : internalRoles;

  const allFacilities = useMemo(() => {
    if (propFacilities && propFacilities.length > 0) return propFacilities;
    const hosps = ensureArray(hospitals).map(h => ({
      id: h.id || h.location_details?.id,
      name: h.name,
      branch: h.branch,
      type: 'hospital'
    }));
    const diags = ensureArray(diagnosticCenters).map(d => ({
      id: d.id || d.location_details?.id,
      name: d.name,
      branch: d.branch,
      type: 'diagnostic_center'
    }));
    return [...hosps, ...diags].filter(f => f.id);
  }, [propFacilities, hospitals, diagnosticCenters]);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [roleId, setRoleId] = useState('');
  const [facilityId, setFacilityId] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isVerified, setIsVerified] = useState(true);
  const [isStaff, setIsStaff] = useState(false);
  const [isSuperuser, setIsSuperuser] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      setFirstName('');
      setLastName('');
      setPhoneNumber(initialPhone || '');
      setPassword('');
      setShowPassword(false);
      setRoleId('');
      setFacilityId('');
      setIsActive(true);
      setIsVerified(true);
      setIsStaff(false);
      setIsSuperuser(false);
      setErrorMessage('');
    }
  }, [isOpen, initialPhone]);

  const selectedRoleObj = useMemo(() => {
    return roles.find(r => String(r.id) === String(roleId));
  }, [roles, roleId]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanPhone = phoneNumber.trim();
    if (!cleanPhone) {
      setErrorMessage('Phone number is required.');
      return;
    }

    if (!password || password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (selectedRoleObj?.scope_type === 'facility' && !facilityId) {
      setErrorMessage('Please select a target facility for facility-scoped role.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        phone_number: cleanPhone,
        password: password,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        is_active: isActive,
        is_verified: isVerified,
      };

      if (roleId) {
        payload.role_id = roleId;
        if (selectedRoleObj?.scope_type === 'facility') {
          payload.facility_id = facilityId;
        }
      }

      if (isSuperAdmin) {
        payload.is_staff = isStaff;
        payload.is_superuser = isSuperuser;
      }

      const createdUser = await api.createUser(payload);
      if (showToast) {
        showToast('User created successfully!', 'success');
      }
      if (onUserCreated) {
        onUserCreated(createdUser);
      }
      onClose();
    } catch (err) {
      console.error('Failed to create user:', err);
      let msg = err.message || 'Failed to create user.';
      if (err.data && typeof err.data === 'object') {
        const errors = Object.entries(err.data)
          .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(', ') : val}`)
          .join(' | ');
        if (errors) msg = errors;
      }
      setErrorMessage(msg);
      if (showToast) {
        showToast(msg, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white border border-[#d1d5dc] rounded-sm max-w-lg w-full shadow-elevated overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-[#d1d5dc] flex justify-between items-center bg-[#faf9fa] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-xs bg-[#e7ebff] text-[#094cb2]">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-serif font-bold text-[#1b1c1d]">Create Platform User</h3>
              <p className="text-[11px] text-slate-500 font-body">Register user credentials & assign initial role scope.</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-sm hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs font-body overflow-y-auto flex-1">
          
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-sm flex items-start gap-2.5 text-rose-800">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <div className="text-xs leading-relaxed break-words">{errorMessage}</div>
            </div>
          )}

          {/* Name Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-label font-semibold mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#094cb2]" />
                <span>First Name</span>
              </label>
              <input
                type="text"
                placeholder="e.g. John"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                className="w-full bg-white border border-[#d1d5dc] rounded-sm px-3 py-2 text-[#1b1c1d] placeholder-slate-400 focus:outline-none focus:border-[#094cb2]"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-label font-semibold mb-1">
                <span>Last Name</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Doe"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                className="w-full bg-white border border-[#d1d5dc] rounded-sm px-3 py-2 text-[#1b1c1d] placeholder-slate-400 focus:outline-none focus:border-[#094cb2]"
              />
            </div>
          </div>

          {/* Phone Number Field */}
          <div>
            <label className="block text-slate-700 font-label font-semibold mb-1 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-[#094cb2]" />
              <span>Phone Number *</span>
            </label>
            <input
              type="tel"
              required
              placeholder="017xxxxxxxx or +88017xxxxxxxx"
              value={phoneNumber}
              onChange={e => setPhoneNumber(e.target.value)}
              className="w-full bg-white border border-[#d1d5dc] rounded-sm px-3 py-2 text-[#1b1c1d] font-mono placeholder-slate-400 focus:outline-none focus:border-[#094cb2]"
            />
            <p className="text-[11px] text-slate-500 mt-1 font-body">
              Must be a valid Bangladesh mobile number (e.g. 01712345678).
            </p>
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-slate-700 font-label font-semibold mb-1 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-[#094cb2]" />
              <span>Password *</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                placeholder="Minimum 6 characters"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-white border border-[#d1d5dc] rounded-sm px-3 py-2 pr-10 text-[#1b1c1d] font-mono placeholder-slate-400 focus:outline-none focus:border-[#094cb2]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Initial Role Selection */}
          <div className="pt-2 border-t border-[#d1d5dc]">
            <label className="block text-slate-700 font-label font-semibold mb-1 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-[#094cb2]" />
              <span>Initial Role (Optional)</span>
            </label>
            <select
              value={roleId}
              onChange={e => {
                setRoleId(e.target.value);
                setFacilityId('');
              }}
              className="w-full bg-white border border-[#d1d5dc] rounded-sm px-3 py-2 text-[#1b1c1d] focus:outline-none focus:border-[#094cb2] cursor-pointer"
            >
              <option value="">No Role Assigned (Standard User)</option>
              {roles.map(r => (
                <option key={r.id} value={r.id}>
                  {r.name} — [{r.scope_type.toUpperCase()} SCOPE] {r.is_system ? '(System)' : '(Custom)'}
                </option>
              ))}
            </select>
            {selectedRoleObj && (
              <div className="mt-1 text-[11px] text-slate-500 font-body">
                Scope: <span className="font-semibold uppercase text-slate-700">{selectedRoleObj.scope_type}</span>
                {selectedRoleObj.description && ` — ${selectedRoleObj.description}`}
              </div>
            )}
          </div>

          {/* Conditional Facility Selector */}
          {selectedRoleObj?.scope_type === 'facility' && (
            <div className="p-3 bg-[#faf9fa] border border-[#094cb2]/20 rounded-sm space-y-2">
              <label className="block text-slate-800 font-label font-semibold flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-[#094cb2]" />
                <span>Target Facility Location *</span>
              </label>
              <select
                required
                value={facilityId}
                onChange={e => setFacilityId(e.target.value)}
                className="w-full bg-white border border-[#d1d5dc] rounded-sm px-3 py-2 text-[#1b1c1d] focus:outline-none focus:border-[#094cb2] cursor-pointer"
              >
                <option value="">Select target Hospital / Diagnostic Center...</option>
                {allFacilities.map(f => (
                  <option key={f.id} value={f.id}>
                    {f.name} {f.branch ? `(${f.branch})` : ''} [{f.type.replace('_', ' ').toUpperCase()}]
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-slate-500 font-body">
                This user's role permissions will be bound to this specific location.
              </p>
            </div>
          )}

          {/* Account Status Checkboxes */}
          <div className="pt-2 border-t border-[#d1d5dc] space-y-2">
            <span className="block text-slate-500 font-label font-semibold uppercase tracking-wider text-[10px]">
              Account Flags & Status
            </span>
            <div className="grid grid-cols-2 gap-2.5">
              <label className="flex items-center gap-2 text-slate-700 font-body cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={e => setIsActive(e.target.checked)}
                  className="rounded-xs border-[#d1d5dc] text-[#094cb2] focus:ring-[#094cb2]"
                />
                <span>Active Account</span>
              </label>

              <label className="flex items-center gap-2 text-slate-700 font-body cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isVerified}
                  onChange={e => setIsVerified(e.target.checked)}
                  className="rounded-xs border-[#d1d5dc] text-[#094cb2] focus:ring-[#094cb2]"
                />
                <span>Phone Verified</span>
              </label>

              {isSuperAdmin && (
                <>
                  <label className="flex items-center gap-2 text-slate-700 font-body cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isStaff}
                      onChange={e => setIsStaff(e.target.checked)}
                      className="rounded-xs border-[#d1d5dc] text-[#094cb2] focus:ring-[#094cb2]"
                    />
                    <span>Staff (Django Admin)</span>
                  </label>

                  <label className="flex items-center gap-2 text-amber-800 font-body cursor-pointer select-none font-semibold">
                    <input
                      type="checkbox"
                      checked={isSuperuser}
                      onChange={e => setIsSuperuser(e.target.checked)}
                      className="rounded-xs border-[#d1d5dc] text-amber-600 focus:ring-amber-500"
                    />
                    <span>Superuser Status</span>
                  </label>
                </>
              )}
            </div>
          </div>

          {/* Modal Action Buttons */}
          <div className="pt-3 border-t border-[#d1d5dc] flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 border border-[#d1d5dc] bg-white hover:bg-[#f7f6f7] text-slate-700 rounded-sm font-label font-semibold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-1.5 bg-[#094cb2] hover:bg-[#083e91] text-white rounded-sm font-label font-semibold transition flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              <span>Create User</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
