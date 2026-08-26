import React, { useState, useEffect, useMemo } from 'react';
import { 
  UserCheck, Plus, Trash2, Search, Filter, Shield, Globe, 
  Building2, RefreshCw, X, CheckCircle2, AlertCircle, Eye, 
  User, ShieldAlert, Sparkles, Phone, Lock, ChevronRight
} from 'lucide-react';
import api, { ensureArray } from '../../../services/api';
import { useAdminContext } from '../context/AdminContext';
import Can from '../../../components/Can';

export default function AssignRolesTab() {
  const { isSuperAdmin, hospitals, diagnosticCenters, showToast } = useAdminContext();
  
  // Data States
  const [assignments, setAssignments] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [scopeFilter, setScopeFilter] = useState('all'); // 'all' | 'global' | 'facility'
  const [roleFilter, setRoleFilter] = useState('all');

  // Assign Modal States
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);
  const [userQuery, setUserQuery] = useState('');
  const [userSuggestions, setUserSuggestions] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [selectedFacilityId, setSelectedFacilityId] = useState('');
  const [searchingUsers, setSearchingUsers] = useState(false);

  // Inspect Permissions Modal State
  const [inspectUser, setInspectUser] = useState(null);
  const [inspectPerms, setInspectPerms] = useState(null);
  const [inspectLoading, setInspectLoading] = useState(false);

  // Revoke Modal State
  const [revokingAssignment, setRevokingAssignment] = useState(null);
  const [revokeLoading, setRevokeLoading] = useState(false);

  // All combined facilities for selection
  const allFacilities = useMemo(() => {
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
  }, [hospitals, diagnosticCenters]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [assignmentsRes, rolesRes] = await Promise.all([
        api.getUserRoles(),
        api.getRoles()
      ]);
      setAssignments(ensureArray(assignmentsRes));
      setRoles(ensureArray(rolesRes));
    } catch (err) {
      console.error(err);
      if (showToast) showToast('Failed to load role assignments.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Search users with debounce
  useEffect(() => {
    if (!userQuery || userQuery.length < 2) {
      setUserSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearchingUsers(true);
      try {
        const res = await api.searchUsers(userQuery);
        setUserSuggestions(ensureArray(res));
      } catch (err) {
        console.error(err);
      } finally {
        setSearchingUsers(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [userQuery]);

  // Selected role object
  const selectedRoleObj = useMemo(() => {
    return roles.find(r => String(r.id) === String(selectedRoleId));
  }, [roles, selectedRoleId]);

  const handleOpenAssignModal = () => {
    setSelectedUser(null);
    setUserQuery('');
    setUserSuggestions([]);
    setSelectedRoleId(roles[0]?.id || '');
    setSelectedFacilityId('');
    setIsAssignModalOpen(true);
  };

  const handleCloseAssignModal = () => {
    setIsAssignModalOpen(false);
    setSelectedUser(null);
    setUserQuery('');
    setSelectedRoleId('');
    setSelectedFacilityId('');
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUser && !userQuery.trim()) {
      if (showToast) showToast('Please select or specify a user phone number.', 'error');
      return;
    }
    if (!selectedRoleId) {
      if (showToast) showToast('Please select a role.', 'error');
      return;
    }
    if (selectedRoleObj?.scope_type === 'facility' && !selectedFacilityId) {
      if (showToast) showToast('Please select a target facility for facility-scoped roles.', 'error');
      return;
    }

    setAssignLoading(true);
    try {
      const payload = {
        role: selectedRoleId,
        facility: selectedRoleObj?.scope_type === 'facility' ? selectedFacilityId : null
      };

      if (selectedUser?.id) {
        payload.user = selectedUser.id;
      } else {
        payload.phone_number = userQuery.trim();
      }

      await api.createUserRole(payload);
      if (showToast) showToast('Role assigned successfully!', 'success');
      handleCloseAssignModal();
      await loadData();
    } catch (err) {
      console.error(err);
      if (showToast) showToast(err.message || 'Failed to assign role.', 'error');
    } finally {
      setAssignLoading(false);
    }
  };

  const handleRevokeConfirm = async () => {
    if (!revokingAssignment) return;
    setRevokeLoading(true);
    try {
      await api.deleteUserRole(revokingAssignment.id);
      if (showToast) showToast('Role assignment revoked successfully.', 'success');
      setRevokingAssignment(null);
      await loadData();
    } catch (err) {
      console.error(err);
      if (showToast) showToast(err.message || 'Failed to revoke role.', 'error');
    } finally {
      setRevokeLoading(false);
    }
  };

  const handleInspectPermissions = async (user) => {
    if (!user) return;
    setInspectUser(user);
    setInspectLoading(true);
    try {
      const res = await api.getUserEffectivePermissions(user.id);
      setInspectPerms(res?.permissions || {});
    } catch (err) {
      console.error(err);
      if (showToast) showToast('Failed to load user permissions.', 'error');
    } finally {
      setInspectLoading(false);
    }
  };

  // Filtered Assignments
  const filteredAssignments = useMemo(() => {
    return assignments.filter(item => {
      const user = item.user_details || {};
      const role = item.role_details || {};
      const facility = item.facility_details || {};

      // Search matching
      const query = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || 
        user.phone_number?.toLowerCase().includes(query) ||
        user.first_name?.toLowerCase().includes(query) ||
        user.last_name?.toLowerCase().includes(query) ||
        role.name?.toLowerCase().includes(query) ||
        facility.name?.toLowerCase().includes(query);

      // Scope filter
      const matchesScope = scopeFilter === 'all' || role.scope_type === scopeFilter;

      // Role filter
      const matchesRole = roleFilter === 'all' || String(role.id) === String(roleFilter);

      return matchesSearch && matchesScope && matchesRole;
    });
  }, [assignments, searchTerm, scopeFilter, roleFilter]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = assignments.length;
    const globalCount = assignments.filter(a => a.role_details?.scope_type === 'global').length;
    const facilityCount = assignments.filter(a => a.role_details?.scope_type === 'facility').length;
    const uniqueUsers = new Set(assignments.map(a => a.user_details?.id || a.user)).size;
    return { total, globalCount, facilityCount, uniqueUsers };
  }, [assignments]);

  return (
    <div className="space-y-6">
      
      {/* 1. Header & Summary Statistics Cards */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400">
                <UserCheck className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                  User Role Assignments & IAM
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Manage user role delegations across global platform authorities and facility-scoped permissions.
                </p>
              </div>
            </div>
          </div>

          <Can requiredModule="users" requiredAction="create">
            <button
              onClick={handleOpenAssignModal}
              className="px-4 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-teal-500/20 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Assign Roles to User</span>
            </button>
          </Can>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-6 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3.5">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Assignments</div>
            <div className="text-2xl font-black text-white mt-1">{metrics.total}</div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3.5">
            <div className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1">
              <Globe className="w-3 h-3" />
              <span>Global Admins</span>
            </div>
            <div className="text-2xl font-black text-amber-300 mt-1">{metrics.globalCount}</div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3.5">
            <div className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
              <Building2 className="w-3 h-3" />
              <span>Facility Users</span>
            </div>
            <div className="text-2xl font-black text-emerald-300 mt-1">{metrics.facilityCount}</div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3.5">
            <div className="text-[11px] font-semibold text-cyan-400 uppercase tracking-wider flex items-center gap-1">
              <User className="w-3 h-3" />
              <span>Unique Users</span>
            </div>
            <div className="text-2xl font-black text-cyan-300 mt-1">{metrics.uniqueUsers}</div>
          </div>
        </div>
      </div>

      {/* 2. Search & Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by phone, name, role, facility..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 transition"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Scope Filter */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setScopeFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                scopeFilter === 'all' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Scopes
            </button>
            <button
              onClick={() => setScopeFilter('global')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1 transition ${
                scopeFilter === 'global' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Globe className="w-3 h-3" />
              <span>Global</span>
            </button>
            <button
              onClick={() => setScopeFilter('facility')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1 transition ${
                scopeFilter === 'facility' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Building2 className="w-3 h-3" />
              <span>Facility</span>
            </button>
            <button
              onClick={() => setScopeFilter('self')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1 transition ${
                scopeFilter === 'self' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <User className="w-3 h-3" />
              <span>Self</span>
            </button>
          </div>

          {/* Role Filter Dropdown */}
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-teal-500 cursor-pointer"
          >
            <option value="all">All Roles</option>
            {roles.map(r => (
              <option key={r.id} value={r.id}>{r.name} ({r.scope_type})</option>
            ))}
          </select>
        </div>

        {/* Refresh button */}
        <button
          onClick={loadData}
          disabled={loading}
          className="p-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-xl text-xs border border-slate-700 transition cursor-pointer disabled:opacity-50"
          title="Refresh assignments"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-teal-400' : ''}`} />
        </button>
      </div>

      {/* 3. Directory Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-xl overflow-hidden">
        {loading && assignments.length === 0 ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center">
            <RefreshCw className="w-6 h-6 animate-spin mb-3 text-teal-400" />
            <p className="text-sm font-medium">Loading user role assignments...</p>
          </div>
        ) : filteredAssignments.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <UserCheck className="w-8 h-8 mx-auto mb-2 text-slate-600" />
            <p className="text-sm font-bold text-slate-300">No role assignments found</p>
            <p className="text-xs text-slate-500 mt-1">
              {searchTerm || scopeFilter !== 'all' || roleFilter !== 'all' 
                ? 'Try adjusting your search query or filters.'
                : 'Click "Assign Roles to User" to add your first role assignment.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-800/50 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold text-[10px]">
                  <th className="px-5 py-4">User Account</th>
                  <th className="px-5 py-4">Assigned Role</th>
                  <th className="px-5 py-4">Scope & Location</th>
                  <th className="px-5 py-4 text-center">Permissions</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredAssignments.map(assignment => {
                  const user = assignment.user_details || {};
                  const role = assignment.role_details || {};
                  const facility = assignment.facility_details;
                  const isGlobal = role.scope_type === 'global';

                  return (
                    <tr key={assignment.id} className="hover:bg-slate-800/30 transition-colors">
                      
                      {/* User Column */}
                      <td className="px-5 py-4 align-middle">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-slate-800 to-slate-700 border border-slate-700 flex items-center justify-center font-bold text-teal-400 text-xs shrink-0">
                            {(user.first_name?.[0] || user.phone_number?.[0] || 'U').toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-200">
                              {user.first_name || user.last_name 
                                ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                                : 'Unnamed User'}
                            </div>
                            <div className="font-mono text-slate-400 text-[11px] mt-0.5">
                              {user.phone_number || assignment.user}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role Column */}
                      <td className="px-5 py-4 align-middle">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-200">{role.name || 'Custom Role'}</span>
                          {role.is_system ? (
                            <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                              SYSTEM
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-teal-500/10 text-teal-300 border border-teal-500/20">
                              CUSTOM
                            </span>
                          )}
                        </div>
                        {role.description && (
                          <div className="text-slate-500 text-[11px] mt-0.5 line-clamp-1">
                            {role.description}
                          </div>
                        )}
                      </td>

                      {/* Scope & Location Column */}
                      <td className="px-5 py-4 align-middle">
                        {isGlobal ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-300 border border-amber-500/25">
                            <Globe className="w-3 h-3 text-amber-400" />
                            <span>Global Platform</span>
                          </span>
                        ) : role.scope_type === 'self' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-purple-500/10 text-purple-300 border border-purple-500/25">
                            <User className="w-3 h-3 text-purple-400" />
                            <span>Self / Individual</span>
                          </span>
                        ) : (
                          <div className="inline-flex flex-col gap-0.5">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-300 border border-emerald-500/25 w-fit">
                              <Building2 className="w-3 h-3 text-emerald-400" />
                              <span>Facility Scoped</span>
                            </span>
                            {facility && (
                              <span className="text-slate-300 font-medium text-[11px] pl-1">
                                {facility.name} {facility.branch ? `(${facility.branch})` : ''}
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Permissions Inspect Button */}
                      <td className="px-5 py-4 align-middle text-center">
                        <button
                          onClick={() => handleInspectPermissions(user)}
                          className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition text-[11px] font-medium inline-flex items-center gap-1.5 cursor-pointer border border-slate-700/60"
                        >
                          <Eye className="w-3.5 h-3.5 text-teal-400" />
                          <span>View Matrix</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 align-middle text-right">
                        <Can requiredModule="users" requiredAction="delete">
                          <button
                            onClick={() => setRevokingAssignment(assignment)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 bg-slate-800 hover:bg-rose-950/40 border border-slate-700/80 hover:border-rose-500/40 rounded-lg transition cursor-pointer"
                            title="Revoke Role Assignment"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </Can>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL: ASSIGN ROLES TO USER */}
      {/* ========================================================================= */}
      {isAssignModalOpen && (
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
                onClick={handleCloseAssignModal}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleAssignSubmit} className="p-6 space-y-4 text-xs">
              
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
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
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
                  onClick={handleCloseAssignModal}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold transition"
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
      )}

      {/* ========================================================================= */}
      {/* MODAL: INSPECT EFFECTIVE PERMISSIONS */}
      {/* ========================================================================= */}
      {inspectUser && (
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
                onClick={() => { setInspectUser(null); setInspectPerms(null); }}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
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
                onClick={() => { setInspectUser(null); setInspectPerms(null); }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold transition"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CONFIRM REVOKE */}
      {/* ========================================================================= */}
      {revokingAssignment && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Revoke Role Assignment?</h3>
                <p className="text-xs text-slate-400">This will remove the user's granted permissions.</p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 text-xs space-y-1">
              <div className="text-slate-300">
                <span className="text-slate-500">User:</span> <strong className="text-white">{revokingAssignment.user_details?.phone_number || revokingAssignment.user}</strong>
              </div>
              <div className="text-slate-300">
                <span className="text-slate-500">Role:</span> <strong className="text-teal-300">{revokingAssignment.role_details?.name}</strong>
              </div>
              {revokingAssignment.facility_details && (
                <div className="text-slate-300">
                  <span className="text-slate-500">Facility:</span> <strong className="text-slate-200">{revokingAssignment.facility_details.name}</strong>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                onClick={() => setRevokingAssignment(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold transition text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleRevokeConfirm}
                disabled={revokeLoading}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold transition text-xs flex items-center gap-1.5 shadow-lg shadow-rose-600/30 disabled:opacity-50 cursor-pointer"
              >
                {revokeLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>Confirm Revoke</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
