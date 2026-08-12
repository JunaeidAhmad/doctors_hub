import React from 'react';
import { Search, Plus, Edit, Trash2, Building2 } from 'lucide-react';
import { useAdminContext } from '../context/AdminContext';
import HospitalModal from './modals/HospitalModal';

export default function HospitalsTab() {
  const {
    hospitals,
    searchTerm,
    setSearchTerm,
    handleOpenHospitalModal,
    handleDeleteHospital,
    handleOpenBranchTestModal
  } = useAdminContext();

  return (
    <>
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search hospital name, branch or city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
            />
          </div>
          <button
            onClick={() => handleOpenHospitalModal()}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-emerald-600/20"
          >
            <Plus className="w-4 h-4" /> Add New Hospital Branch
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 text-[11px] uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Hospital Name</th>
                <th className="py-3.5 px-4">Branch</th>
                <th className="py-3.5 px-4">Services & Facilities</th>
                <th className="py-3.5 px-4">Location & City</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {(hospitals || [])
                .filter(h => `${h?.name || ''} ${h?.branch || ''} ${h?.city || ''}`.toLowerCase().includes((searchTerm || '').toLowerCase()))
                .map(h => (
                  <tr key={h.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-4 px-4 font-bold text-white">
                      <div className="text-sm text-emerald-400">{h.name}</div>
                      <div className="text-slate-400 text-[11px] font-normal">{h.tagline}</div>
                    </td>
                    <td className="py-4 px-4 font-bold text-teal-300">
                      {h.branch || 'Main Branch'}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex flex-wrap gap-1">
                        {(h.services || []).map((s, idx) => (
                          <span key={s.id || idx} className="px-2 py-0.5 bg-teal-500/20 text-teal-300 border border-teal-500/30 rounded text-[10px] font-bold">
                            {s.name || s}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-slate-200">{h.address}</div>
                      <div className="text-slate-400 font-bold">{h.city}</div>
                    </td>
                    <td className="py-4 px-4 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => handleOpenBranchTestModal && handleOpenBranchTestModal(null, 'hospital', h.id)}
                        title="Add Diagnostic Test to this Hospital's Internal Lab"
                        className="px-2.5 py-1.5 bg-emerald-500/20 text-emerald-300 rounded-lg hover:bg-emerald-500/30 inline-flex items-center gap-1 text-[11px] font-bold border border-emerald-500/30 transition"
                      >
                        <Building2 className="w-3.5 h-3.5" /> + Test
                      </button>
                      <button onClick={() => handleOpenHospitalModal(h)} className="p-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeleteHospital(h.id, h.name)} className="p-2 bg-rose-500/20 text-rose-400 rounded-lg hover:bg-rose-500/30">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      <HospitalModal />
    </>
  );
}
