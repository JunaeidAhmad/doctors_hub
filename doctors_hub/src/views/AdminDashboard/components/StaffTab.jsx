import React, { useState, useEffect } from 'react';
import { 
  Users, UserPlus, Trash2, ShieldCheck, Phone, CheckCircle2, 
  AlertCircle, RefreshCw, X, Lock, Building2, UserCheck
} from 'lucide-react';
import { api, ensureArray } from '../../../services/api';
import { useAdminContext } from '../context/AdminContext';

export default function StaffTab() {
  const { isSuperAdmin, isFacilityAdmin, hospitals, diagnosticCenters, activeUser, setSuccessMsg, setError } = useAdminContext();
  
  // Available facilities to manage
  const managedFacilities = [
    ...(ensureArray(hospitals) || []).map(h => ({ id: h.id || h.location_id, name: h.name, type: 'Hospital' })),
    ...(ensureArray(diagnosticCenters) || []).map(d => ({ id: d.id || d.location_id, name: d.name, type: 'Diagnostic Center' }))
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
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400">
              <Users className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-black text-white">Delegated Staff Management</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Manage receptionists, lab technicians, and billing operators for your facility branches
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {managedFacilities.length > 1 && (
            <select
              value={selectedFacilityId}
              onChange={e => setSelectedFacilityId(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
            >
              {managedFacilities.map(f => (
                <option key={f.id} value={f.id}>{f.name} ({f.type})</option>
              ))}
            </select>
          )}

          <button
            type="button"
            onClick={handleOpenAddModal}
            className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-teal-600/20 text-xs flex items-center gap-2 transition cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Staff Member</span>
          </button>
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="p-4 sm:p-6 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-teal-400" />
            <span>Active Team Members ({staffList.length})</span>
          </h3>
          <button
            type="button"
            onClick={() => loadStaff(selectedFacilityId)}
            className="text-slate-400 hover:text-slate-200 text-xs flex items-center gap-1.5 transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-teal-400 mb-2" />
            <span>Loading team members...</span>
          </div>
        ) : staffList.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs space-y-3">
            <Users className="w-10 h-10 mx-auto text-slate-600" />
            <p className="font-semibold text-slate-300">No staff members added yet</p>
            <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
              Add receptionists or lab operators to grant them access to process appointments and reports.
            </p>
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="mt-2 bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              + Add First Staff Member
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 font-bold border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-6">Name</th>
                  <th className="py-3.5 px-6">Phone (Login ID)</th>
                  <th className="py-3.5 px-6">Role</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {staffList.map(staff => (
                  <tr key={staff.user_id || staff.membership_id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-6 text-white font-bold flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-teal-500/20 border border-teal-500/40 text-teal-300 flex items-center justify-center font-black text-xs">
                        {(staff.first_name || 'S')[0].toUpperCase()}
                      </div>
                      <span>{staff.first_name} {staff.last_name}</span>
                    </td>
                    <td className="py-3.5 px-6 font-mono text-teal-300">{staff.phone_number}</td>
                    <td className="py-3.5 px-6">
                      <span className="px-2.5 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-[10px] font-bold uppercase">
                        {staff.role || 'Facility Staff'}
                      </span>
                    </td>
                    <td className="py-3.5 px-6">
                      <span className="inline-flex items-center gap-1.5 text-emerald-400 font-bold text-[11px]">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                        <span>Active</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <button
                        type="button"
                        onClick={() => handleDeleteStaff(staff.user_id, `${staff.first_name} ${staff.last_name}`)}
                        className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 hover:border-rose-500/40 transition cursor-pointer"
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
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-teal-400" />
                <h3 className="font-black text-white text-base">Add Facility Staff</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddStaff} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahim"
                    value={addForm.first_name}
                    onChange={e => setAddForm({ ...addForm, first_name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Last Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Ahmed"
                    value={addForm.last_name}
                    onChange={e => setAddForm({ ...addForm, last_name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-teal-400" />
                  <span>Phone Number (Login ID) *</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="017xxxxxxxx"
                  value={addForm.phone_number}
                  onChange={e => setAddForm({ ...addForm, phone_number: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-teal-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-teal-400" />
                  <span>Password *</span>
                </label>
                <input
                  type="password"
                  required
                  placeholder="Min 6 characters"
                  value={addForm.password}
                  onChange={e => setAddForm({ ...addForm, password: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-2 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                  <span>Assign Roles *</span>
                </label>
                <div className="space-y-2 max-h-32 overflow-y-auto bg-slate-950/50 p-3 rounded-xl border border-slate-800">
                  {rolesList.length === 0 ? (
                    <div className="text-slate-500 text-xs text-center py-2">No roles available</div>
                  ) : (
                    rolesList.map(r => (
                      <label key={r.id} className="flex items-center gap-2 cursor-pointer group">
                        <div className="relative flex items-center justify-center">
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
                            className="peer appearance-none w-4 h-4 border border-slate-700 rounded bg-slate-900 checked:bg-teal-500 checked:border-teal-500 cursor-pointer transition-all"
                          />
                          <div className="absolute opacity-0 peer-checked:opacity-100 pointer-events-none text-white">
                            <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                        <span className="text-xs text-slate-300 group-hover:text-white transition-colors">{r.name}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingLoading}
                  className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-teal-600/30 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {addingLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Create Staff Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
