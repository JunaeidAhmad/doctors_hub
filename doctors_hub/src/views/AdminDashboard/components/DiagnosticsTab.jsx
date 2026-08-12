import React from 'react';
import { Search, Plus, Edit, Trash2, FlaskConical } from 'lucide-react';
import { useAdminContext } from '../context/AdminContext';
import DiagnosticModal from './modals/DiagnosticModal';

export default function DiagnosticsTab() {
  const {
    diagnosticCenters,
    searchTerm,
    setSearchTerm,
    handleOpenDiagnosticModal,
    handleDeleteDiagnostic,
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
              placeholder="Search diagnostic center name or branch..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
          <button
            onClick={() => handleOpenDiagnosticModal()}
            className="flex items-center gap-2 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-cyan-600/20"
          >
            <Plus className="w-4 h-4" /> Add New Diagnostics / Branch
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 text-[11px] uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Diagnostic Center Name</th>
                <th className="py-3.5 px-4">Branch</th>
                <th className="py-3.5 px-4">Services & Facilities</th>
                <th className="py-3.5 px-4">District / Division</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {(diagnosticCenters || [])
                .filter(dc => `${dc?.name || ''} ${dc?.branch || ''} ${dc?.district || ''}`.toLowerCase().includes((searchTerm || '').toLowerCase()))
                .map(dc => (
                  <tr key={dc.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-4 px-4 font-bold text-white">
                      <div className="text-sm text-cyan-400">{dc.name}</div>
                      <div className="text-slate-400 text-[11px] font-normal">{dc.tagline}</div>
                    </td>
                    <td className="py-4 px-4 font-bold text-teal-300">
                      {dc.branch || 'Main Branch'}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex flex-wrap gap-1">
                        {(dc.services || []).map((s, idx) => (
                          <span key={s.id || idx} className="px-2 py-0.5 bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded text-[10px] font-bold">
                            {s.name || s}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-slate-200">{dc.address}</div>
                      <div className="text-slate-400 font-bold">{dc.district}</div>
                    </td>
                    <td className="py-4 px-4 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => handleOpenBranchTestModal && handleOpenBranchTestModal(null, 'diagnostic', dc.id)}
                        title="Add Test Offering to this Diagnostic Center"
                        className="px-2.5 py-1.5 bg-cyan-500/20 text-cyan-300 rounded-lg hover:bg-cyan-500/30 inline-flex items-center gap-1 text-[11px] font-bold border border-cyan-500/30 transition"
                      >
                        <FlaskConical className="w-3.5 h-3.5" /> + Test
                      </button>
                      <button onClick={() => handleOpenDiagnosticModal(dc)} className="p-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeleteDiagnostic(dc.id, dc.name)} className="p-2 bg-rose-500/20 text-rose-400 rounded-lg hover:bg-rose-500/30">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      <DiagnosticModal />
    </>
  );
}
