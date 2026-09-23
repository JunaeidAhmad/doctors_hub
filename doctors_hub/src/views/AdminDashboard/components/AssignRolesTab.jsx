import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  UserCheck, UserPlus, Plus, Trash2, Search, Globe, 
  Building2, RefreshCw, Eye, User, X, ShieldCheck
} from 'lucide-react';
import api, { ensureArray } from '../../../services/api';
import { useAdminContext } from '../context/AdminContext';
import Can from '../../../components/Can';
import AssignRoleModal from './roles/AssignRoleModal';
import CreateUserModal from './roles/CreateUserModal';
import InspectPermissionsModal from './roles/InspectPermissionsModal';
import RevokeAssignmentModal from './roles/RevokeAssignmentModal';

export default function AssignRolesTab() {
  const { hospitals, diagnosticCenters, showToast, refreshTrigger } = useAdminContext();
  
  // Data States
  const [assignments, setAssignments] = useState([]);
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [scopeFilter, setScopeFilter] = useState('all'); // 'all' | 'assigned' | 'unassigned' | 'global' | 'facility' | 'self'
  const [roleFilter, setRoleFilter] = useState('all');

  // Assign Modal States
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);
  const [userQuery, setUserQuery] = useState('');
  const [userSuggestions, setUserSuggestions] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [selectedFacilityId, setSelectedFacilityId] = useState('');

  // Create User Modal States
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);
  const [initialCreatePhone, setInitialCreatePhone] = useState('');

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

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [assignmentsRes, rolesRes, usersRes] = await Promise.all([
        api.getUserRoles(),
        api.getRoles(),
        api.getUsers()
      ]);
      setAssignments(ensureArray(assignmentsRes));
      setRoles(ensureArray(rolesRes));
      setUsers(ensureArray(usersRes));
    } catch (err) {
      console.error(err);
      if (showToast) showToast('Failed to load role assignments.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData();
  }, [loadData, refreshTrigger]);

  // Search users with debounce
  useEffect(() => {
    if (!userQuery || userQuery.length < 2) {
      setUserSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await api.searchUsers(userQuery);
        setUserSuggestions(ensureArray(res));
      } catch (err) {
        console.error(err);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [userQuery]);

  // Selected role object
  const selectedRoleObj = useMemo(() => {
    return roles.find(r => String(r.id) === String(selectedRoleId));
  }, [roles, selectedRoleId]);

  const handleOpenAssignModal = (preselectedUser = null) => {
    if (preselectedUser) {
      setSelectedUser(preselectedUser);
      setUserQuery(preselectedUser.phone_number || '');
    } else {
      setSelectedUser(null);
      setUserQuery('');
    }
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

  // Combined Directory Items: Explicit Role Allocations + Unassigned Platform Users
  const combinedItems = useMemo(() => {
    const assignedUserIds = new Set(
      assignments.map(a => String(a.user_details?.id || a.user)).filter(Boolean)
    );

    const items = [];

    // 1. Explicit role allocations
    assignments.forEach(assignment => {
      items.push({
        id: `assignment-${assignment.id}`,
        type: 'assignment',
        assignmentId: assignment.id,
        user: assignment.user_details || {},
        role: assignment.role_details || {},
        facility: assignment.facility_details || null,
        isAssigned: true,
        scopeType: assignment.role_details?.scope_type || 'unassigned',
        rawAssignment: assignment
      });
    });

    // 2. Users without explicit role allocations (e.g. newly created/registered users)
    users.forEach(u => {
      if (!assignedUserIds.has(String(u.id))) {
        items.push({
          id: `unassigned-${u.id}`,
          type: 'unassigned_user',
          assignmentId: null,
          user: u,
          role: null,
          facility: null,
          isAssigned: false,
          scopeType: 'unassigned',
          rawAssignment: null
        });
      }
    });

    return items;
  }, [assignments, users]);

  // Filtered Directory Items
  const filteredItems = useMemo(() => {
    return combinedItems.filter(item => {
      const user = item.user || {};
      const role = item.role || {};
      const facility = item.facility || {};

      // Search matching
      const query = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || 
        user.phone_number?.toLowerCase().includes(query) ||
        user.first_name?.toLowerCase().includes(query) ||
        user.last_name?.toLowerCase().includes(query) ||
        (item.isAssigned && role.name?.toLowerCase().includes(query)) ||
        (item.isAssigned && facility.name?.toLowerCase().includes(query));

      // Scope filter: 'all' | 'assigned' | 'unassigned' | 'global' | 'facility' | 'self'
      let matchesScope = true;
      if (scopeFilter === 'assigned') {
        matchesScope = item.isAssigned;
      } else if (scopeFilter === 'unassigned') {
        matchesScope = !item.isAssigned;
      } else if (scopeFilter === 'global') {
        matchesScope = item.scopeType === 'global';
      } else if (scopeFilter === 'facility') {
        matchesScope = item.scopeType === 'facility';
      } else if (scopeFilter === 'self') {
        matchesScope = item.scopeType === 'self';
      }

      // Role filter
      const matchesRole = roleFilter === 'all' || 
        (item.isAssigned && String(role.id) === String(roleFilter));

      return matchesSearch && matchesScope && matchesRole;
    });
  }, [combinedItems, searchTerm, scopeFilter, roleFilter]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const totalAssignments = assignments.length;
    const globalCount = assignments.filter(a => a.role_details?.scope_type === 'global').length;
    const facilityCount = assignments.filter(a => a.role_details?.scope_type === 'facility').length;
    const totalUsers = users.length;
    const unassignedCount = combinedItems.filter(i => !i.isAssigned).length;
    return { totalAssignments, globalCount, facilityCount, totalUsers, unassignedCount };
  }, [assignments, users, combinedItems]);

  return (
    <div className="space-y-6">
      
      {/* 1. Header & Summary Statistics Cards */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-[#d1d5dc]">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-label font-bold tracking-widest text-[#094cb2] uppercase bg-[#e7ebff] px-2 py-0.5 rounded-xs">
              Access Governance & IAM
            </span>
            <span className="text-[10px] text-slate-400 font-label">• Delegated Permissions</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-[#1b1c1d] tracking-tight">
            Role Allocations & Personnel Directory
          </h1>
          <p className="text-xs text-slate-500 font-body mt-1 max-w-2xl">
            Manage granular role delegations across global platform authorities and facility-scoped operational teams.
          </p>
        </div>

        <Can requiredModule="users" requiredAction="create">
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => {
                setInitialCreatePhone('');
                setIsCreateUserModalOpen(true);
              }}
              className="px-3.5 py-2 border border-[#d1d5dc] bg-white hover:bg-[#f7f6f7] text-slate-700 font-label text-xs font-semibold rounded-sm flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5 text-[#094cb2]" />
              <span>Create New User</span>
            </button>

            <button
              onClick={handleOpenAssignModal}
              className="px-4 py-2 bg-[#094cb2] hover:bg-[#083e91] text-white font-label text-xs font-semibold rounded-sm flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Assign Role to User</span>
            </button>
          </div>
        </Can>
      </div>

      {/* Telemetry Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white border border-[#d1d5dc] rounded-sm p-3.5 shadow-card">
          <div className="text-[11px] font-label font-semibold text-[#094cb2] uppercase tracking-wider flex items-center gap-1">
            <User className="w-3 h-3 text-[#094cb2]" />
            <span>Total Personnel</span>
          </div>
          <div className="text-2xl font-serif font-bold text-[#1b1c1d] mt-1">{metrics.totalUsers}</div>
        </div>

        <div className="bg-white border border-[#d1d5dc] rounded-sm p-3.5 shadow-card">
          <div className="text-[11px] font-label font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-slate-600" />
            <span>Role Allocations</span>
          </div>
          <div className="text-2xl font-serif font-bold text-[#1b1c1d] mt-1">{metrics.totalAssignments}</div>
        </div>

        <div className="bg-white border border-[#d1d5dc] rounded-sm p-3.5 shadow-card">
          <div className="text-[11px] font-label font-semibold text-amber-700 uppercase tracking-wider flex items-center gap-1">
            <Globe className="w-3 h-3 text-amber-600" />
            <span>Global Admins</span>
          </div>
          <div className="text-2xl font-serif font-bold text-amber-800 mt-1">{metrics.globalCount}</div>
        </div>

        <div className="bg-white border border-[#d1d5dc] rounded-sm p-3.5 shadow-card">
          <div className="text-[11px] font-label font-semibold text-slate-600 uppercase tracking-wider flex items-center gap-1">
            <UserCheck className="w-3 h-3 text-slate-500" />
            <span>Unassigned Accounts</span>
          </div>
          <div className="text-2xl font-serif font-bold text-slate-700 mt-1">{metrics.unassignedCount}</div>
        </div>
      </div>

      {/* 2. Search & Filter Bar */}
      <div className="bg-white border border-[#d1d5dc] rounded-sm p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-card">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by phone, name, role, facility..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-[#faf9fa] border border-[#d1d5dc] rounded-sm pl-8 pr-8 py-1.5 text-xs text-[#1b1c1d] placeholder-slate-400 focus:outline-none focus:border-[#094cb2] font-body"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Scope Filter */}
          <div className="flex items-center gap-1 bg-[#faf9fa] p-1 rounded-sm border border-[#d1d5dc] text-xs overflow-x-auto">
            <button
              onClick={() => setScopeFilter('all')}
              className={`px-2.5 py-1 rounded-xs font-label text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                scopeFilter === 'all' ? 'bg-[#094cb2] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({combinedItems.length})
            </button>
            <button
              onClick={() => setScopeFilter('assigned')}
              className={`px-2.5 py-1 rounded-xs font-label text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                scopeFilter === 'assigned' ? 'bg-[#094cb2] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Assigned ({assignments.length})
            </button>
            <button
              onClick={() => setScopeFilter('unassigned')}
              className={`px-2.5 py-1 rounded-xs font-label text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                scopeFilter === 'unassigned' ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Unassigned ({metrics.unassignedCount})
            </button>
            <button
              onClick={() => setScopeFilter('global')}
              className={`px-2.5 py-1 rounded-xs font-label text-xs font-semibold flex items-center gap-1 whitespace-nowrap transition cursor-pointer ${
                scopeFilter === 'global' ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Globe className="w-3 h-3 text-amber-600" />
              <span>Global</span>
            </button>
            <button
              onClick={() => setScopeFilter('facility')}
              className={`px-2.5 py-1 rounded-xs font-label text-xs font-semibold flex items-center gap-1 whitespace-nowrap transition cursor-pointer ${
                scopeFilter === 'facility' ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-3 h-3 text-emerald-600" />
              <span>Facility</span>
            </button>
          </div>

          {/* Role Filter Dropdown */}
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="bg-white border border-[#d1d5dc] rounded-sm px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-[#094cb2] font-body cursor-pointer"
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
          className="p-1.5 border border-[#d1d5dc] bg-white hover:bg-[#f7f6f7] text-slate-700 rounded-sm text-xs transition cursor-pointer disabled:opacity-50"
          title="Refresh directory"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#094cb2]' : 'text-slate-500'}`} />
        </button>
      </div>

      {/* 3. Directory Table */}
      <div className="bg-white border border-[#d1d5dc] rounded-sm shadow-card overflow-hidden">
        {loading && combinedItems.length === 0 ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center">
            <RefreshCw className="w-6 h-6 animate-spin mb-3 text-[#094cb2]" />
            <p className="font-serif text-sm text-slate-700">Loading personnel and roles directory...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <UserCheck className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="font-serif text-sm text-slate-700">No personnel records found</p>
            <p className="text-xs text-slate-400 mt-1">
              {searchTerm || scopeFilter !== 'all' || roleFilter !== 'all' 
                ? 'Try adjusting your search query or filters.'
                : 'Click "Assign Role to User" or "Create New User" to add your first user.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-body">
              <thead className="bg-[#f7f6f7] border-b border-[#d1d5dc] text-slate-500 font-label text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 w-[28%] font-semibold">User Account</th>
                  <th className="py-3 px-4 w-[24%] font-semibold">Assigned Role</th>
                  <th className="py-3 px-4 w-[26%] font-semibold">Scope & Location</th>
                  <th className="py-3 px-4 w-[12%] text-center font-semibold">Permissions</th>
                  <th className="py-3 px-4 w-[10%] text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e3e5ea] text-slate-700">
                {filteredItems.map(item => {
                  const user = item.user || {};
                  const role = item.role || {};
                  const facility = item.facility;
                  const isGlobal = role?.scope_type === 'global';

                  return (
                    <tr key={item.id} className="hover:bg-[#e7ebff]/25 transition-colors">
                      
                      {/* User Column */}
                      <td className="py-3 px-4 align-middle">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-7 h-7 rounded-sm flex items-center justify-center font-serif font-bold text-xs shrink-0 ${
                            item.isAssigned ? 'bg-[#e7ebff] text-[#094cb2]' : 'bg-slate-100 text-slate-600 border border-[#d1d5dc]'
                          }`}>
                            {(user.first_name?.[0] || user.phone_number?.[0] || 'U').toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-serif font-bold text-sm text-[#1b1c1d]">
                                {user.first_name || user.last_name 
                                  ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                                  : 'Unnamed User'}
                              </span>
                              {!item.isAssigned && (
                                <span className="text-[9px] font-label font-bold px-1.5 py-0.2 rounded-xs bg-amber-50 text-amber-700 border border-amber-200">
                                  No Role
                                </span>
                              )}
                            </div>
                            <div className="font-mono text-slate-500 text-[11px]">
                              {user.phone_number || (typeof item.rawAssignment?.user === 'string' ? item.rawAssignment.user : '')}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role Column */}
                      <td className="py-3 px-4 align-middle">
                        {item.isAssigned ? (
                          <>
                            <div className="flex items-center gap-1.5">
                              <span className="font-label font-semibold text-slate-900">{role.name || 'Custom Role'}</span>
                              {role.is_system ? (
                                <span className="px-1.5 py-0.5 rounded-xs text-[9px] font-label font-bold bg-slate-100 text-slate-600 border border-[#d1d5dc]">
                                  SYSTEM
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.5 rounded-xs text-[9px] font-label font-bold bg-[#e7ebff] text-[#094cb2] border border-[#094cb2]/20">
                                  CUSTOM
                                </span>
                              )}
                            </div>
                            {role.description && (
                              <div className="text-slate-400 text-[11px] mt-0.5 line-clamp-1">
                                {role.description}
                              </div>
                            )}
                          </>
                        ) : (
                          <div>
                            <span className="text-slate-600 font-medium text-xs font-body">Standard Platform User</span>
                            <div className="text-slate-400 text-[11px]">No elevated administrative permissions assigned</div>
                          </div>
                        )}
                      </td>

                      {/* Scope & Location Column */}
                      <td className="py-3 px-4 align-middle">
                        {item.isAssigned ? (
                          isGlobal ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xs text-[10px] font-label font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200">
                              <Globe className="w-3 h-3 text-amber-600" />
                              <span>Global Platform</span>
                            </span>
                          ) : role.scope_type === 'self' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xs text-[10px] font-label font-bold uppercase tracking-wider bg-purple-50 text-purple-800 border border-purple-200">
                              <User className="w-3 h-3 text-purple-600" />
                              <span>Self / Individual</span>
                            </span>
                          ) : (
                            <div className="inline-flex flex-col gap-0.5">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xs text-[10px] font-label font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200 w-fit">
                                <Building2 className="w-3 h-3 text-emerald-600" />
                                <span>Facility Scoped</span>
                              </span>
                              {facility && (
                                <span className="text-slate-700 font-medium text-[11px] pl-0.5">
                                  {facility.name} {facility.branch ? `(${facility.branch})` : ''}
                                </span>
                              )}
                            </div>
                          )
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xs text-[10px] font-label font-medium bg-[#faf9fa] text-slate-500 border border-[#d1d5dc]">
                            <span>Default Account</span>
                          </span>
                        )}
                      </td>

                      {/* Permissions Inspect Button */}
                      <td className="py-3 px-4 align-middle text-center">
                        <button
                          onClick={() => handleInspectPermissions(user)}
                          className="px-2 py-1 bg-white hover:bg-[#faf9fa] text-slate-700 rounded-sm transition text-[11px] font-label font-semibold inline-flex items-center gap-1 cursor-pointer border border-[#d1d5dc]"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#094cb2]" />
                          <span>View Matrix</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 align-middle text-right">
                        {item.isAssigned ? (
                          <Can requiredModule="users" requiredAction="delete">
                            <button
                              onClick={() => setRevokingAssignment(item.rawAssignment)}
                              className="p-1.5 text-slate-400 hover:text-rose-700 border border-transparent hover:border-rose-200 hover:bg-rose-50 rounded-sm transition cursor-pointer"
                              title="Revoke Role Assignment"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </Can>
                        ) : (
                          <Can requiredModule="users" requiredAction="change">
                            <button
                              onClick={() => handleOpenAssignModal(user)}
                              className="px-2.5 py-1 bg-[#094cb2] hover:bg-[#083e91] text-white rounded-xs text-xs font-label font-semibold inline-flex items-center gap-1 shadow-xs transition cursor-pointer"
                              title="Assign Role to User"
                            >
                              <UserPlus className="w-3 h-3" />
                              <span>Assign Role</span>
                            </button>
                          </Can>
                        )}
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: ASSIGN ROLES TO USER */}
      <AssignRoleModal
        isOpen={isAssignModalOpen}
        onClose={handleCloseAssignModal}
        onSubmit={handleAssignSubmit}
        assignLoading={assignLoading}
        userQuery={userQuery}
        setUserQuery={setUserQuery}
        selectedUser={selectedUser}
        setSelectedUser={setSelectedUser}
        userSuggestions={userSuggestions}
        setUserSuggestions={setUserSuggestions}
        selectedRoleId={selectedRoleId}
        setSelectedRoleId={setSelectedRoleId}
        roles={roles}
        selectedRoleObj={selectedRoleObj}
        selectedFacilityId={selectedFacilityId}
        setSelectedFacilityId={setSelectedFacilityId}
        allFacilities={allFacilities}
        onCreateNewUser={(phone) => {
          handleCloseAssignModal();
          setInitialCreatePhone(phone);
          setIsCreateUserModalOpen(true);
        }}
      />

      {/* MODAL: CREATE NEW USER */}
      <CreateUserModal
        isOpen={isCreateUserModalOpen}
        onClose={() => {
          setIsCreateUserModalOpen(false);
          setInitialCreatePhone('');
        }}
        onUserCreated={async () => {
          await loadData();
        }}
        roles={roles}
        allFacilities={allFacilities}
        initialPhone={initialCreatePhone}
      />

      {/* MODAL: INSPECT EFFECTIVE PERMISSIONS */}
      <InspectPermissionsModal
        inspectUser={inspectUser}
        inspectPerms={inspectPerms}
        inspectLoading={inspectLoading}
        onClose={() => { setInspectUser(null); setInspectPerms(null); }}
      />

      {/* MODAL: CONFIRM REVOKE */}
      <RevokeAssignmentModal
        revokingAssignment={revokingAssignment}
        revokeLoading={revokeLoading}
        onClose={() => setRevokingAssignment(null)}
        onConfirm={handleRevokeConfirm}
      />

    </div>
  );
}
