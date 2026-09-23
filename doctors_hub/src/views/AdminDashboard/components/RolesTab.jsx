import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Shield, Save, X, RefreshCw } from 'lucide-react';
import api, { ensureArray } from '../../../services/api';
import { useAdminContext } from '../context/AdminContext';
import Can from '../../../components/Can';

export default function RolesTab() {
  const { isSuperAdmin, isFacilityAdmin, activeUser, showToast } = useAdminContext();
  const [roles, setRoles] = useState([]);
  const [permissionsCatalog, setPermissionsCatalog] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form State
  const [isEditing, setIsEditing] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    scope_type: 'facility',
    permissions: []
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [rolesData, permsData] = await Promise.all([
        api.getRoles(),
        api.getPermissionsCatalog()
      ]);
      setRoles(ensureArray(rolesData));
      setPermissionsCatalog(ensureArray(permsData));
    } catch (err) {
      console.error(err);
      showToast('Failed to load roles and permissions.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenForm = (role = null) => {
    if (role) {
      setEditingRole(role);
      setFormData({
        name: role.name,
        description: role.description || '',
        scope_type: role.scope_type,
        permissions: role.permissions || []
      });
    } else {
      setEditingRole(null);
      setFormData({
        name: '',
        description: '',
        scope_type: isSuperAdmin ? 'global' : 'facility',
        permissions: []
      });
    }
    setIsEditing(true);
  };

  const handleCloseForm = () => {
    setIsEditing(false);
    setEditingRole(null);
  };

  const handlePermissionToggle = (permId) => {
    setFormData(prev => {
      const perms = prev.permissions;
      if (perms.includes(permId)) {
        return { ...prev, permissions: perms.filter(p => p !== permId) };
      }
      return { ...prev, permissions: [...perms, permId] };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingRole) {
        await api.updateRole(editingRole.id, formData);
        showToast('Role updated successfully!', 'success');
      } else {
        await api.createRole(formData);
        showToast('Role created successfully!', 'success');
      }
      handleCloseForm();
      await loadData();
    } catch (err) {
      console.error(err);
      showToast(err?.message || 'Failed to save role. Check validation errors.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (role) => {
    if (role.is_system) {
      showToast('System roles cannot be deleted', 'error');
      return;
    }
    if (!window.confirm(`Are you sure you want to delete ${role.name}?`)) return;
    
    setLoading(true);
    try {
      await api.deleteRole(role.id);
      showToast('Role deleted successfully');
      await loadData();
    } catch (err) {
      console.error(err);
      showToast('Failed to delete role', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Group permissions by module for the matrix
  const groupedPermissions = (ensureArray(permissionsCatalog) || []).reduce((acc, perm) => {
    if (!perm || !perm.module) return acc;
    if (!acc[perm.module]) acc[perm.module] = [];
    acc[perm.module].push(perm);
    return acc;
  }, {});

  if (isEditing) {
    return (
      <div className="bg-white border border-[#d1d5dc] rounded-sm shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-[#d1d5dc] flex justify-between items-center bg-[#faf9fa]">
          <h2 className="text-base font-serif font-bold text-[#1b1c1d] flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#094cb2]" />
            <span>{editingRole ? 'Edit Operational Role' : 'Create Operational Role'}</span>
          </h2>
          <button onClick={handleCloseForm} className="p-1.5 hover:bg-slate-100 rounded-sm text-slate-400 hover:text-slate-700 transition cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 font-body">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-xs font-label font-semibold text-slate-700 mb-1">Role Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                disabled={editingRole?.is_system}
                className="w-full bg-white border border-[#d1d5dc] rounded-sm px-3 py-2 text-xs text-[#1b1c1d] focus:border-[#094cb2] disabled:opacity-50"
              />
            </div>
            
            {isSuperAdmin && !editingRole?.is_system && (
              <div>
                <label className="block text-xs font-label font-semibold text-slate-700 mb-1">Scope</label>
                <select
                  value={formData.scope_type}
                  onChange={e => setFormData({...formData, scope_type: e.target.value})}
                  className="w-full bg-white border border-[#d1d5dc] rounded-sm px-3 py-2 text-xs text-[#1b1c1d] focus:border-[#094cb2] cursor-pointer"
                >
                  <option value="global">Global (Platform Wide)</option>
                  <option value="facility">Facility (Specific to a location)</option>
                  <option value="self">Self (Own records only)</option>
                </select>
              </div>
            )}

            <div className="md:col-span-2">
              <label className="block text-xs font-label font-semibold text-slate-700 mb-1">Description</label>
              <input
                type="text"
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                disabled={editingRole?.is_system}
                className="w-full bg-white border border-[#d1d5dc] rounded-sm px-3 py-2 text-xs text-[#1b1c1d] focus:border-[#094cb2] disabled:opacity-50"
              />
            </div>
          </div>

          <h3 className="text-sm font-serif font-bold text-[#1b1c1d] mb-3 border-b border-[#d1d5dc] pb-2">Permissions Matrix</h3>
          <div className="space-y-4">
            {Object.entries(groupedPermissions).map(([module, perms]) => (
              <div key={module} className="bg-[#faf9fa] rounded-sm p-3.5 border border-[#e3e5ea]">
                <h4 className="text-xs font-label font-bold text-slate-800 capitalize mb-2.5">{module.replace('_', ' ')}</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                  {perms.map(perm => (
                    <label key={perm.id} className="flex items-center gap-2 cursor-pointer group">
                      <div className="relative flex items-center justify-center">
                        <input
                          type="checkbox"
                          checked={formData.permissions.includes(perm.id)}
                          onChange={() => handlePermissionToggle(perm.id)}
                          disabled={editingRole?.is_system}
                          className="w-4 h-4 rounded-xs border-[#d1d5dc] text-[#094cb2] focus:ring-[#094cb2] cursor-pointer"
                        />
                      </div>
                      <span className="text-xs text-slate-600 group-hover:text-slate-900 transition-colors font-body">
                        {perm.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-end gap-2 pt-3 border-t border-[#d1d5dc]">
            <button
              type="button"
              onClick={handleCloseForm}
              className="px-3.5 py-1.5 border border-[#d1d5dc] bg-white hover:bg-[#f7f6f7] text-slate-700 font-label font-semibold text-xs rounded-sm transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || editingRole?.is_system}
              className="px-4 py-1.5 bg-[#094cb2] hover:bg-[#083e91] text-white font-label font-semibold text-xs rounded-sm transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-sm"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Role</span>
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Editorial Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 pb-2 border-b border-[#d1d5dc]">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-label font-bold tracking-widest text-[#094cb2] uppercase bg-[#e7ebff] px-2 py-0.5 rounded-xs">
              Access Governance
            </span>
            <span className="text-[10px] text-slate-400 font-label">• RBAC Schemas</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-[#1b1c1d] tracking-tight">
            Roles & Permissions Matrix
          </h1>
          <p className="text-xs text-slate-500 font-body mt-1">
            Manage custom operational roles, scope boundaries, and fine-grained module privileges.
          </p>
        </div>
        
        <Can requiredModule="roles" requiredAction="create">
          <button
            onClick={() => handleOpenForm()}
            className="px-4 py-2 bg-[#094cb2] hover:bg-[#083e91] text-white font-label text-xs font-semibold rounded-sm flex items-center gap-1.5 transition shadow-sm cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Role</span>
          </button>
        </Can>
      </div>

      <div className="bg-white border border-[#d1d5dc] rounded-sm shadow-card overflow-hidden">
        {loading && roles.length === 0 ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center">
            <RefreshCw className="w-6 h-6 animate-spin mb-3 text-[#094cb2]" />
            <p className="font-serif text-sm text-slate-700">Loading roles catalog...</p>
          </div>
        ) : roles.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Shield className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="font-serif text-sm text-slate-700">No operational roles found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-body">
              <thead className="bg-[#f7f6f7] border-b border-[#d1d5dc] text-slate-500 font-label text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 w-[40%] font-semibold">Role Name & Description</th>
                  <th className="py-3 px-4 w-[25%] font-semibold">Scope Boundary</th>
                  <th className="py-3 px-4 w-[20%] font-semibold">Classification</th>
                  <th className="py-3 px-4 w-[15%] text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e3e5ea] text-slate-700">
                {roles.map(role => (
                  <tr key={role.id} className="hover:bg-[#e7ebff]/25 transition-colors">
                    <td className="py-3.5 px-4 align-middle">
                      <div className="font-serif font-bold text-sm text-[#1b1c1d]">{role.name}</div>
                      {role.description && <div className="text-[11px] text-slate-500 mt-0.5">{role.description}</div>}
                    </td>
                    <td className="py-3.5 px-4 align-middle">
                      <span className={`inline-flex px-2 py-0.5 rounded-xs text-[10px] font-label font-bold uppercase tracking-wider ${
                        role.scope_type === 'global' ? 'bg-amber-50 text-amber-800 border border-amber-200' : 
                        role.scope_type === 'facility' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                        role.scope_type === 'self' ? 'bg-purple-50 text-purple-800 border border-purple-200' :
                        'bg-slate-100 text-slate-700 border border-[#d1d5dc]'
                      }`}>
                        {role.scope_type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 align-middle">
                      {role.is_system ? (
                        <span className="inline-flex px-2 py-0.5 rounded-xs text-[10px] font-label font-semibold bg-slate-100 text-slate-700 border border-[#d1d5dc]">System Builtin</span>
                      ) : (
                        <span className="inline-flex px-2 py-0.5 rounded-xs text-[10px] font-label font-semibold bg-[#e7ebff] text-[#094cb2] border border-[#094cb2]/20">Custom Role</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 align-middle text-right">
                      <div className="flex justify-end gap-1.5">
                        <Can requiredModule="roles" requiredAction="edit">
                          <button
                            onClick={() => handleOpenForm(role)}
                            className="p-1.5 border border-[#d1d5dc] bg-white hover:bg-[#f7f6f7] text-slate-700 rounded-sm transition cursor-pointer"
                            title={role.is_system ? "View Role" : "Edit Role"}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </Can>
                        <Can requiredModule="roles" requiredAction="delete">
                          <button
                            onClick={() => handleDelete(role)}
                            disabled={role.is_system}
                            className="p-1.5 border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-sm transition cursor-pointer disabled:opacity-30"
                            title="Delete Role"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </Can>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
