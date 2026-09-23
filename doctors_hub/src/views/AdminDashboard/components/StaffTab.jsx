import React, { useState, useEffect } from 'react';
import { 
  Users, UserPlus, Trash2, ShieldCheck, Phone, CheckCircle2, 
  AlertCircle, RefreshCw, X, Lock, Building2, UserCheck
} from 'lucide-react';
import { api, ensureArray } from '../../../services/api';
import { useAdminContext } from '../context/AdminContext';
import { formatFacilityName } from '../../../utils/facilityUtils';

export default function StaffTab() {
  const { isSuperAdmin, isFacilityAdmin, hospitals, diagnosticCenters, activeUser, setSuccessMsg, setError } = useAdminContext();
  
  // Available facilities to manage
  const managedFacilities = [
    ...(ensureArray(hospitals) || []).map(h => ({ id: h.id || h.location_id, name: formatFacilityName(h), type: 'Hospital' })),
    ...(ensureArray(diagnosticCenters) || []).map(d => ({ id: d.id || d.location_id, name: formatFacilityName(d), type: 'Diagnostic Center' }))
  ];

  const [selectedFacilityId, setSelectedFacilityId] = useState(managedFacilities[0]?.id || '');
  const [staffList, setStaffList] = useState([]);
  const [rolesList, setRolesList] = useState([]);
  const [loading, setLoading] = useState(false);

  // Add Staff Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    first_name: '',
    last_name: '',
    phone_number: '',
    password: '',
    role_ids: []
  });
  const [addingLoading, setAddingLoading] = useState(false);

  useEffect(() => {
    if (!selectedFacilityId && managedFacilities.length > 0) {
      setSelectedFacilityId(managedFacilities[0].id);
    }
  }, [managedFacilities]);

  useEffect(() => {
    if (selectedFacilityId) {
      loadStaff(selectedFacilityId);
    }
  }, [selectedFacilityId]);

  const loadStaff = async (facId) => {
    setLoading(true);
    try {
      const data = await api.getFacilityStaff(facId);
      setStaffList(ensureArray(data));
    } catch (e) {
      if (setError) setError(e.message || 'Failed to load staff members');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = async () => {
    setIsAddModalOpen(true);
    try {
      const allRoles = await api.getRoles();
      // Only show facility-scoped roles
      const facilityRoles = ensureArray(allRoles).filter(r => r.scope_type === 'facility');
      setRolesList(facilityRoles);
      if (facilityRoles.length > 0) {
        setAddForm(prev => ({ ...prev, role_ids: [facilityRoles[0].id] }));
      }
    } catch (e) {
      console.error('Failed to load roles', e);
    }
  };

  const handleAddStaff = async (e) => {
    e.preventDefault();
    if (!selectedFacilityId) return;
    setAddingLoading(true);

    try {
      await api.addFacilityStaff(selectedFacilityId, addForm);
      if (setSuccessMsg) setSuccessMsg(`Staff member ${addForm.first_name} added successfully.`);
      setIsAddModalOpen(false);
      setAddForm({ first_name: '', last_name: '', phone_number: '', password: '', role_ids: [] });
      loadStaff(selectedFacilityId);
    } catch (e) {
      if (setError) setError(e.message || 'Failed to add staff member');
    } finally {
      setAddingLoading(false);
    }
  };

  const handleDeleteStaff = async (userId, staffName) => {
    if (!window.confirm(`Are you sure you want to remove staff member "${staffName}"?`)) return;
    try {
      await api.deleteFacilityStaff(selectedFacilityId, userId);
      if (setSuccessMsg) setSuccessMsg(`Removed ${staffName} from facility staff.`);
      loadStaff(selectedFacilityId);
    } catch (e) {
      if (setError) setError(e.message || 'Failed to remove staff member');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 pb-2 border-b border-[#d1d5dc]">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-label font-bold tracking-widest text-[#094cb2] uppercase bg-[#e7ebff] px-2 py-0.5 rounded-xs">
              Facility Operations
            </span>
            <span className="text-[10px] text-slate-400 font-label">• Delegated Personnel</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-[#1b1c1d] tracking-tight">
            Delegated Facility Staff
          </h1>
          <p className="text-xs text-slate-500 font-body mt-1">
            Manage receptionists, lab technicians, and billing operators assigned to your facility branches.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto shrink-0">
          {managedFacilities.length > 1 && (
            <select
              value={selectedFacilityId}
              onChange={e => setSelectedFacilityId(e.target.value)}
              className="bg-white border border-[#d1d5dc] rounded-sm px-3 py-1.5 text-xs text-[#1b1c1d] focus:outline-none focus:border-[#094cb2] font-body"
            >
              {managedFacilities.map(f => (
                <option key={f.id} value={f.id}>{f.name} ({f.type})</option>
              ))}
            </select>
          )}

          <button
            type="button"
            onClick={handleOpenAddModal}
            className="bg-[#094cb2] hover:bg-[#083e91] text-white font-label font-semibold px-3.5 py-2 rounded-sm text-xs flex items-center gap-1.5 transition shadow-sm cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add Staff Member</span>
          </button>
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-white border border-[#d1d5dc] rounded-sm shadow-card overflow-hidden">
        <div className="p-3.5 border-b border-[#d1d5dc] bg-[#faf9fa] flex items-center justify-between">
          <h3 className="font-serif font-bold text-slate-900 text-sm flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-[#094cb2]" />
            <span>Active Team Members ({staffList.length})</span>
          </h3>
          <button
            type="button"
            onClick={() => loadStaff(selectedFacilityId)}
            className="text-slate-500 hover:text-slate-800 text-xs font-label flex items-center gap-1.5 transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#094cb2]' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#094cb2] mb-2" />
            <span className="font-serif text-sm text-slate-700">Loading team members...</span>
          </div>
        ) : staffList.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs space-y-2">
            <Users className="w-8 h-8 mx-auto text-slate-300" />
            <p className="font-serif text-sm text-slate-700">No staff members added yet</p>
            <p className="text-[11px] text-slate-400 max-w-sm mx-auto font-body">
              Add receptionists or lab operators to grant them access to process appointments and reports.
            </p>
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="mt-2 bg-[#e7ebff] text-[#094cb2] hover:bg-[#d9e2ff] border border-[#094cb2]/30 px-3 py-1.5 rounded-sm text-xs font-label font-semibold transition cursor-pointer inline-flex items-center gap-1"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add First Staff Member</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-body">
              <thead className="bg-[#f7f6f7] border-b border-[#d1d5dc] text-slate-500 font-label text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 w-[30%] font-semibold">Name</th>
                  <th className="py-3 px-4 w-[25%] font-semibold">Phone (Login ID)</th>
                  <th className="py-3 px-4 w-[20%] font-semibold">Role</th>
                  <th className="py-3 px-4 w-[15%] font-semibold">Status</th>
                  <th className="py-3 px-4 w-[10%] text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e3e5ea] text-slate-700">
                {staffList.map(staff => (
                  <tr key={staff.user_id || staff.membership_id} className="hover:bg-[#e7ebff]/25 transition-colors">
                    <td className="py-3.5 px-4 font-serif font-bold text-sm text-[#1b1c1d] flex items-center gap-2">
                      <div className="w-7 h-7 rounded-sm bg-[#e7ebff] text-[#094cb2] flex items-center justify-center font-serif font-bold text-xs shrink-0">
                        {(staff.first_name || 'S')[0].toUpperCase()}
                      </div>
                      <span>{staff.first_name} {staff.last_name}</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[#094cb2] text-xs font-semibold">{staff.phone_number}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-xs bg-[#e7ebff] text-[#094cb2] border border-[#094cb2]/20 text-[10px] font-label font-bold uppercase">
                        {staff.role || 'Facility Staff'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1.5 text-emerald-800 font-label font-bold text-[11px]">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                        <span>Active</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleDeleteStaff(staff.user_id, `${staff.first_name} ${staff.last_name}`)}
                        className="p-1.5 rounded-sm border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 transition cursor-pointer"
                        title="Revoke Access"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Staff Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white border border-[#d1d5dc] rounded-sm p-5 shadow-elevated space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#d1d5dc]">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xs bg-[#e7ebff] text-[#094cb2]">
                  <UserPlus className="w-4 h-4" />
                </div>
                <h3 className="font-serif font-bold text-slate-900 text-base">Add Facility Staff</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddStaff} className="space-y-3.5 text-xs font-body">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-label font-semibold mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahim"
                    value={addForm.first_name}
                    onChange={e => setAddForm({ ...addForm, first_name: e.target.value })}
                    className="w-full bg-white border border-[#d1d5dc] rounded-sm px-3 py-2 text-[#1b1c1d] focus:outline-none focus:border-[#094cb2]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-label font-semibold mb-1">Last Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Ahmed"
                    value={addForm.last_name}
                    onChange={e => setAddForm({ ...addForm, last_name: e.target.value })}
                    className="w-full bg-white border border-[#d1d5dc] rounded-sm px-3 py-2 text-[#1b1c1d] focus:outline-none focus:border-[#094cb2]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-label font-semibold mb-1 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-[#094cb2]" />
                  <span>Phone Number (Login ID) *</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="017xxxxxxxx"
                  value={addForm.phone_number}
                  onChange={e => setAddForm({ ...addForm, phone_number: e.target.value })}
                  className="w-full bg-white border border-[#d1d5dc] rounded-sm px-3 py-2 text-[#1b1c1d] focus:outline-none focus:border-[#094cb2] font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-label font-semibold mb-1 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-[#094cb2]" />
                  <span>Password *</span>
                </label>
                <input
                  type="password"
                  required
                  placeholder="Min 6 characters"
                  value={addForm.password}
                  onChange={e => setAddForm({ ...addForm, password: e.target.value })}
                  className="w-full bg-white border border-[#d1d5dc] rounded-sm px-3 py-2 text-[#1b1c1d] focus:outline-none focus:border-[#094cb2]"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-label font-semibold mb-1.5 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#094cb2]" />
                  <span>Assign Roles *</span>
                </label>
                <div className="space-y-1.5 max-h-32 overflow-y-auto bg-[#faf9fa] p-2.5 rounded-sm border border-[#d1d5dc]">
                  {rolesList.length === 0 ? (
                    <div className="text-slate-400 text-xs text-center py-2">No roles available</div>
                  ) : (
                    rolesList.map(r => (
                      <label key={r.id} className="flex items-center gap-2 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={(addForm.role_ids || []).includes(r.id)}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setAddForm(prev => {
                              const currentIds = prev.role_ids || [];
                              return {
                                ...prev,
                                role_ids: checked 
                                  ? [...currentIds, r.id] 
                                  : currentIds.filter(id => id !== r.id)
                              };
                            });
                          }}
                          className="w-4 h-4 rounded-xs border-[#d1d5dc] text-[#094cb2] focus:ring-[#094cb2] cursor-pointer"
                        />
                        <span className="text-xs text-slate-700 font-body">{r.name}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#d1d5dc]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-sm border border-[#d1d5dc] text-slate-700 hover:bg-[#f7f6f7] font-label font-semibold text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingLoading}
                  className="bg-[#094cb2] hover:bg-[#083e91] text-white font-label font-semibold px-4 py-1.5 rounded-sm shadow-sm transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 text-xs"
                >
                  {addingLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Create Staff Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
