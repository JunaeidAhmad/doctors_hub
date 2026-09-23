import React, { useState, useEffect } from 'react';
import { 
  Crown, UserPlus, ShieldAlert, Phone, Lock, CheckCircle2, 
  AlertCircle, RefreshCw, X, UserCheck, Shield
} from 'lucide-react';
import { api, ensureArray } from '../../../services/api';
import { useAdminContext } from '../context/AdminContext';

export default function PlatformAdminsTab() {
  const { setSuccessMsg, setError } = useAdminContext();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(false);

  // Invite Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    phone_number: '',
    password: '',
    first_name: '',
    last_name: ''
  });
  const [addingLoading, setAddingLoading] = useState(false);

  const loadAdmins = async () => {
    setLoading(true);
    try {
      const data = await api.getPlatformAdmins();
      setAdmins(ensureArray(data));
    } catch (e) {
      if (setError) setError(e.message || 'Failed to load platform admins');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdmins();
  }, []);

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    setAddingLoading(true);

    try {
      const res = await api.createPlatformAdmin(form);
      if (setSuccessMsg) setSuccessMsg(res?.message || `Super Admin ${form.phone_number} provisioned successfully.`);
      setIsModalOpen(false);
      setForm({ phone_number: '', password: '', first_name: '', last_name: '' });
      loadAdmins();
    } catch (e) {
      if (setError) setError(e.message || 'Failed to create Super Admin');
    } finally {
      setAddingLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 pb-2 border-b border-[#d1d5dc]">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-label font-bold tracking-widest text-[#094cb2] uppercase bg-[#e7ebff] px-2 py-0.5 rounded-xs">
              Platform Governance
            </span>
            <span className="text-[10px] text-slate-400 font-label">• Institutional Council</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-[#1b1c1d] tracking-tight">
            Platform Super Administrators
          </h1>
          <p className="text-xs text-slate-500 font-body mt-1">
            Global governance executives with platform-wide audit, taxonomy management, and partner verification authority.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="bg-[#094cb2] hover:bg-[#083e91] text-white font-label text-xs font-semibold px-4 py-2 rounded-sm shadow-sm flex items-center gap-1.5 transition cursor-pointer shrink-0"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Add Platform Admin</span>
        </button>
      </div>

      {/* Admin Table */}
      <div className="bg-white border border-[#d1d5dc] rounded-sm shadow-card overflow-hidden">
        <div className="p-3.5 border-b border-[#d1d5dc] bg-[#faf9fa] flex items-center justify-between">
          <h3 className="font-serif font-bold text-slate-900 text-sm flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#094cb2]" />
            <span>Active Platform Administrators ({admins.length})</span>
          </h3>
          <button
            type="button"
            onClick={loadAdmins}
            className="text-slate-500 hover:text-slate-800 text-xs font-label flex items-center gap-1.5 transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#094cb2]' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#094cb2] mb-2" />
            <span className="font-serif text-sm text-slate-700">Loading platform administrators...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-body">
              <thead className="bg-[#f7f6f7] border-b border-[#d1d5dc] text-slate-500 font-label text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 w-[35%] font-semibold">Administrator Name</th>
                  <th className="py-3 px-4 w-[25%] font-semibold">Phone Number</th>
                  <th className="py-3 px-4 w-[25%] font-semibold">Role Authority</th>
                  <th className="py-3 px-4 w-[15%] font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e3e5ea] text-slate-700">
                {admins.map(adm => (
                  <tr key={adm.id} className="hover:bg-[#e7ebff]/25 transition-colors">
                    <td className="py-3.5 px-4 font-serif font-bold text-sm text-[#1b1c1d] flex items-center gap-2">
                      <div className="w-7 h-7 rounded-sm bg-amber-50 text-amber-800 border border-amber-200 flex items-center justify-center font-serif font-bold text-xs shrink-0">
                        👑
                      </div>
                      <span>{adm.first_name || 'Platform'} {adm.last_name || 'Admin'}</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[#094cb2] text-xs font-semibold">{adm.phone_number}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-xs bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-label font-bold uppercase">
                        Super Admin (Global)
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1.5 text-emerald-800 font-label font-bold text-[11px]">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                        <span>Active</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invite Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white border border-[#d1d5dc] rounded-sm p-5 shadow-elevated space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#d1d5dc]">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xs bg-amber-50 text-amber-800 border border-amber-200">
                  <Crown className="w-4 h-4" />
                </div>
                <h3 className="font-serif font-bold text-slate-900 text-base">Add Platform Super Admin</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddAdmin} className="space-y-3.5 text-xs font-body">
              <div className="bg-[#faf9fa] border border-[#d1d5dc] rounded-sm p-3 text-[11px] text-slate-600 font-body">
                Grant full global platform authority. New super admin can verify facilities, doctors, and manage all taxonomy.
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-label font-semibold mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tariq"
                    value={form.first_name}
                    onChange={e => setForm({ ...form, first_name: e.target.value })}
                    className="w-full bg-white border border-[#d1d5dc] rounded-sm px-3 py-2 text-[#1b1c1d] focus:outline-none focus:border-[#094cb2]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-label font-semibold mb-1">Last Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Rahman"
                    value={form.last_name}
                    onChange={e => setForm({ ...form, last_name: e.target.value })}
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
                  value={form.phone_number}
                  onChange={e => setForm({ ...form, phone_number: e.target.value })}
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
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  className="w-full bg-white border border-[#d1d5dc] rounded-sm px-3 py-2 text-[#1b1c1d] focus:outline-none focus:border-[#094cb2]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#d1d5dc]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-sm border border-[#d1d5dc] text-slate-700 hover:bg-[#f7f6f7] font-label font-semibold text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingLoading}
                  className="bg-[#094cb2] hover:bg-[#083e91] text-white font-label font-semibold px-4 py-1.5 rounded-sm shadow-sm transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 text-xs"
                >
                  {addingLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Create Super Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
