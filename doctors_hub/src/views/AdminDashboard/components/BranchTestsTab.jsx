import React from 'react';
import { Search, Plus, Trash2, Calculator, Building2, FlaskConical } from 'lucide-react';
import { useAdminContext } from '../context/AdminContext';
import BranchTestModal from './modals/BranchTestModal';

export default function BranchTestsTab() {
  const {
    branchTests,
    diagnosticCenters,
    hospitals,
    searchTerm,
    setSearchTerm,
    branchTestBranchFilter,
    setBranchTestBranchFilter,
    handleOpenBranchTestModal,
    handleDeleteBranchTest
  } = useAdminContext();

  return (
    <>
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[240px]">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search facility name or test..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
              />
            </div>
            <select
              value={branchTestBranchFilter}
              onChange={(e) => setBranchTestBranchFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-semibold"
            >
              <option value="">Filter by All Facilities</option>
              <optgroup label="Diagnostic Centers">
                {diagnosticCenters.map(dc => (
                  <option key={`dc-${dc.id}`} value={`dc-${dc.id}`}>{dc.name} ({dc.branch})</option>
                ))}
              </optgroup>
              <optgroup label="Hospitals (Internal Diagnostics)">
                {hospitals.map(h => (
                  <option key={`hosp-${h.id}`} value={`hosp-${h.id}`}>{h.name} ({h.branch || 'Main'})</option>
                ))}
              </optgroup>
            </select>
          </div>
          <button
            onClick={() => handleOpenBranchTestModal()}
            className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-teal-600/20"
          >
            <Plus className="w-4 h-4" /> Add Test Price Offering
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 text-[11px] uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Facility & Branch</th>
                <th className="py-3.5 px-4">Test Name</th>
                <th className="py-3.5 px-4">Original Price</th>
                <th className="py-3.5 px-4">Discount</th>
                <th className="py-3.5 px-4">Offer Price</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {(branchTests || [])
                .filter(bt => {
                  const facilityName = bt?.hospital_name || bt?.hospital?.name || bt?.center_name || bt?.center?.name || '';
                  const testName = bt?.test_name || bt?.test?.name || '';
                  const matchesSearch = `${facilityName} ${testName}`.toLowerCase().includes((searchTerm || '').toLowerCase());
                  
                  if (!branchTestBranchFilter) return matchesSearch;
                  if (branchTestBranchFilter.startsWith('dc-')) {
                    const targetId = branchTestBranchFilter.replace('dc-', '');
                    const centerId = bt.center?.id || bt.center;
                    return matchesSearch && centerId === targetId;
                  }
                  if (branchTestBranchFilter.startsWith('hosp-')) {
                    const targetId = branchTestBranchFilter.replace('hosp-', '');
                    const hospId = bt.hospital?.id || bt.hospital;
                    return matchesSearch && hospId === targetId;
                  }
                  return matchesSearch;
                })
                .map(bt => {
                  const isHospital = Boolean(bt.hospital || bt.hospital_name || bt.facility_type === 'hospital');
                  const facilityName = bt.hospital_name || bt.hospital?.name || bt.center_name || bt.center?.name || 'Medical Facility';
                  const branchName = bt.hospital_branch || bt.hospital?.branch || bt.center_branch || bt.center?.branch || 'Main Branch';
                  
                  return (
                    <tr key={bt.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-4 px-4 font-bold">
                        <div className="flex items-center gap-2">
                          {isHospital ? (
                            <span className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" title="Hospital Diagnostics">
                              <Building2 className="w-3.5 h-3.5" />
                            </span>
                          ) : (
                            <span className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400" title="Diagnostic Center">
                              <FlaskConical className="w-3.5 h-3.5" />
                            </span>
                          )}
                          <div>
                            <div className="text-white text-xs font-bold">{facilityName}</div>
                            <div className="text-[10px] text-slate-400 font-normal">
                              {branchName} • <span className={isHospital ? "text-emerald-400 font-semibold" : "text-cyan-400 font-semibold"}>
                                {isHospital ? "Internal Hospital Lab" : "Diagnostic Center"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 font-bold text-white">
                        <div className="flex items-center gap-1.5">
                          <Calculator className="w-3.5 h-3.5 text-amber-400" />
                          <span>{bt.test_name || bt.test?.name || 'Diagnostic Test'}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 line-through text-slate-500">
                        ৳{bt.original_price || bt.price}
                      </td>
                      <td className="py-4 px-4 text-rose-400 font-bold">
                        {bt.discount || '0%'}
                      </td>
                      <td className="py-4 px-4 text-emerald-400 font-black text-sm">
                        ৳{bt.price}
                      </td>
                      <td className="py-4 px-4 text-right whitespace-nowrap">
                        <button onClick={() => handleDeleteBranchTest(bt.id)} className="p-2 bg-rose-500/20 text-rose-400 rounded-lg hover:bg-rose-500/30">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      <BranchTestModal />
    </>
  );
}
