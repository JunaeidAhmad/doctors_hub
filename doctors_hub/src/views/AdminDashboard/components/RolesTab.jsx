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
        showToast('Role updated successfully');
      } else {
        await api.createRole(formData);
        showToast('Role created successfully');
      }
      handleCloseForm();
      await loadData();
    } catch (err) {
      console.error(err);
      showToast('Failed to save role. Check validation errors.', 'error');
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
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-400" />
            {editingRole ? 'Edit Role' : 'Create New Role'}
          </h2>
          <button onClick={handleCloseForm} className="p-2 hover:bg-slate-700 rounded-lg text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Role Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                disabled={editingRole?.is_system}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
              />
            </div>
            
            {isSuperAdmin && !editingRole?.is_system && (
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Scope</label>
                <select
                  value={formData.scope_type}
                  onChange={e => setFormData({...formData, scope_type: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="global">Global (Platform Wide)</option>
                  <option value="facility">Facility (Specific to a location)</option>
                  <option value="self">Self (Own records only)</option>
                </select>
              </div>
            )}

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-400 mb-1">Description</label>
              <input
                type="text"
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                disabled={editingRole?.is_system}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
              />
            </div>
          </div>

          <h3 className="text-md font-bold text-white mb-4 border-b border-slate-800 pb-2">Permissions Matrix</h3>
          <div className="space-y-6">
            {Object.entries(groupedPermissions).map(([module, perms]) => (
              <div key={module} className="bg-slate-950/50 rounded-xl p-4 border border-slate-800/50">
                <h4 className="text-sm font-semibold text-slate-300 capitalize mb-3">{module.replace('_', ' ')}</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {perms.map(perm => (
                    <label key={perm.id} className="flex items-center gap-2 cursor-pointer group">
                      <div className="relative flex items-center justify-center">
                        <input
                          type="checkbox"
                          checked={formData.permissions.includes(perm.id)}
                          onChange={() => handlePermissionToggle(perm.id)}
                          disabled={editingRole?.is_system}
                          className="peer appearance-none w-5 h-5 border border-slate-700 rounded bg-slate-900 checked:bg-indigo-500 checked:border-indigo-500 disabled:opacity-50 cursor-pointer transition-all"
                        />
                        <div className="absolute opacity-0 peer-checked:opacity-100 pointer-events-none text-white">
                          <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                      <span className="text-xs text-slate-400 group-hover:text-slate-300 transition-colors">
                        {perm.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={handleCloseForm}
              className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || editingRole?.is_system}
              className="px-4 py-2 bg-indigo-500 text-white font-medium rounded-lg hover:bg-indigo-600 transition flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              Save Role
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-400" />
            Roles & Permissions
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Manage custom roles and configure their permissions matrix.
          </p>
        </div>
        
        <Can requiredModule="roles" requiredAction="create">
          <button
            onClick={() => handleOpenForm()}
            className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-xl text-sm flex items-center gap-2 transition"
          >
            <Plus className="w-4 h-4" />
            Create Role
          </button>
        </Can>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        {loading && roles.length === 0 ? (
          <div className="p-8 text-center text-slate-400 flex flex-col items-center justify-center">
            <RefreshCw className="w-6 h-6 animate-spin mb-3 text-indigo-500" />
            <p>Loading roles...</p>
          </div>
        ) : roles.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            No roles found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-800/50 border-b border-slate-800">
                  <th className="px-5 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Role Name</th>
                  <th className="px-5 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Scope</th>
                  <th className="px-5 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Type</th>
                  <th className="px-5 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {roles.map(role => (
                  <tr key={role.id} className="hover:bg-slate-800/20 transition-colors">
                    <td className="px-5 py-4 align-middle">
                      <div className="font-medium text-slate-200">{role.name}</div>
                      {role.description && <div className="text-xs text-slate-500 mt-0.5">{role.description}</div>}
                    </td>
                    <td className="px-5 py-4 align-middle">
                      <span className={`inline-flex px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        role.scope_type === 'global' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 
                        role.scope_type === 'facility' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        role.scope_type === 'self' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                        'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                      }`}>
                        {role.scope_type}
                      </span>
                    </td>
                    <td className="px-5 py-4 align-middle">
                      {role.is_system ? (
                        <span className="inline-flex px-2 py-1 rounded text-xs font-medium bg-slate-800 text-slate-300">System</span>
                      ) : (
                        <span className="inline-flex px-2 py-1 rounded text-xs font-medium bg-indigo-500/10 text-indigo-400">Custom</span>
                      )}
                    </td>
                    <td className="px-5 py-4 align-middle text-right">
                      <div className="flex justify-end gap-2">
                        <Can requiredModule="roles" requiredAction="edit">
                          <button
                            onClick={() => handleOpenForm(role)}
                            className="p-1.5 text-slate-400 hover:text-indigo-400 bg-slate-800 hover:bg-slate-700 rounded-lg transition"
                            title={role.is_system ? "View Role" : "Edit Role"}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </Can>
                        <Can requiredModule="roles" requiredAction="delete">
                          <button
                            onClick={() => handleDelete(role)}
                            disabled={role.is_system}
                            className="p-1.5 text-slate-400 hover:text-rose-400 bg-slate-800 hover:bg-slate-700 rounded-lg transition disabled:opacity-30 disabled:hover:text-slate-400"
                            title="Delete Role"
                          >
                            <Trash2 className="w-4 h-4" />
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
