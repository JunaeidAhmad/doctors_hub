import React from 'react';
import { Search, Plus, Trash2, XCircle, Calculator, Building2, FlaskConical } from 'lucide-react';
import { calculateFinalPrice } from '../utils/adminHelpers';

export default function BranchTestsTab({
  branchTests = [],
  diagnosticCenters = [],
  hospitals = [],
  tests = [],
  searchTerm,
  setSearchTerm,
  branchTestBranchFilter,
  setBranchTestBranchFilter,
  branchTestTestFilter,
  setBranchTestTestFilter,
  showBranchTestModal,
  setShowBranchTestModal,
  branchTestForm,
  setBranchTestForm,
  handleOpenBranchTestModal,
  handleSaveBranchTest,
  handleDeleteBranchTest
}) {
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
              {branchTests
                .filter(bt => {
                  const facilityName = bt.hospital_name || bt.hospital?.name || bt.center_name || bt.center?.name || '';
                  const testName = bt.test_name || bt.test?.name || '';
                  const matchesSearch = `${facilityName} ${testName}`.toLowerCase().includes(searchTerm.toLowerCase());
                  
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

      {/* MODAL: BRANCH TEST PRICING */}
      {showBranchTestModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Add Diagnostic Test Price Offering</h3>
              <button onClick={() => setShowBranchTestModal(false)} className="text-slate-400 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBranchTest} className="space-y-3 text-xs">
              {/* FACILITY TYPE SELECTOR */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Facility Type *</label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 border border-slate-800 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setBranchTestForm({ ...branchTestForm, facility_type: 'diagnostic_center', hospital: '' })}
                    className={`py-2 px-3 rounded-lg font-bold flex items-center justify-center gap-1.5 transition ${
                      branchTestForm.facility_type === 'diagnostic_center'
                        ? 'bg-cyan-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <FlaskConical className="w-3.5 h-3.5" /> Diagnostic Center
                  </button>
                  <button
                    type="button"
                    onClick={() => setBranchTestForm({ ...branchTestForm, facility_type: 'hospital', center: '' })}
                    className={`py-2 px-3 rounded-lg font-bold flex items-center justify-center gap-1.5 transition ${
                      branchTestForm.facility_type === 'hospital'
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5" /> Hospital Lab
                  </button>
                </div>
              </div>

              {/* TARGET SELECTION DEPENDING ON FACILITY TYPE */}
              {branchTestForm.facility_type === 'diagnostic_center' ? (
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Select Standalone Diagnostic Center *</label>
                  <select
                    required
                    value={branchTestForm.center}
                    onChange={e => setBranchTestForm({ ...branchTestForm, center: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold"
                  >
                    <option value="">Select Diagnostic Center</option>
                    {diagnosticCenters.map(dc => (
                      <option key={dc.id} value={dc.id}>{dc.name} ({dc.branch})</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Select Hospital (Internal Diagnostics) *</label>
                  <select
                    required
                    value={branchTestForm.hospital}
                    onChange={e => setBranchTestForm({ ...branchTestForm, hospital: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold"
                  >
                    <option value="">Select Hospital Branch</option>
                    {hospitals.map(h => (
                      <option key={h.id} value={h.id}>{h.name} ({h.branch || 'Main'})</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Select Test *</label>
                <select
                  required
                  value={branchTestForm.test}
                  onChange={e => setBranchTestForm({ ...branchTestForm, test: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold"
                >
                  <option value="">Select Diagnostic Test</option>
                  {tests.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Original Price (৳) *</label>
                  <input
                    type="number"
                    required
                    value={branchTestForm.original_price}
                    onChange={e => {
                      const newOrig = e.target.value;
                      const calcPrice = calculateFinalPrice(newOrig, branchTestForm.discount);
                      setBranchTestForm({ ...branchTestForm, original_price: newOrig, price: calcPrice });
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Discount Tag *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 25% OFF"
                    value={branchTestForm.discount}
                    onChange={e => {
                      const newDist = e.target.value;
                      const calcPrice = calculateFinalPrice(branchTestForm.original_price, newDist);
                      setBranchTestForm({ ...branchTestForm, discount: newDist, price: calcPrice });
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-emerald-400 font-bold mb-1">Final Discounted Offer Price (৳) *</label>
                <input
                  type="number"
                  required
                  value={branchTestForm.price}
                  onChange={e => setBranchTestForm({ ...branchTestForm, price: e.target.value })}
                  className="w-full bg-slate-950 border border-emerald-500/50 rounded-xl px-3 py-2 text-emerald-300 font-bold font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setShowBranchTestModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 font-bold rounded-xl">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl shadow-lg shadow-teal-600/20">Save Test Pricing</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
