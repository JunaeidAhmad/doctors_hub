import React from 'react';
import { Search, Plus, Trash2, XCircle, Calculator } from 'lucide-react';
import { calculateFinalPrice } from '../utils/adminHelpers';

export default function BranchTestsTab({
  branchTests = [],
  diagnosticCenters = [],
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
                placeholder="Search center or test..."
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
              <option value="">Filter by Diagnostic Center</option>
              {diagnosticCenters.map(dc => (
                <option key={dc.id} value={dc.id}>{dc.name} ({dc.branch})</option>
              ))}
            </select>
          </div>
          <button
            onClick={() => handleOpenBranchTestModal()}
            className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-teal-600/20"
          >
            <Plus className="w-4 h-4" /> Add Branch Test Price Offering
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 text-[11px] uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Diagnostic Center</th>
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
                  const matchesSearch = `${bt.center_name} ${bt.test_name}`.toLowerCase().includes(searchTerm.toLowerCase());
                  const matchesBranch = !branchTestBranchFilter || (bt.center?.id || bt.center) === branchTestBranchFilter;
                  return matchesSearch && matchesBranch;
                })
                .map(bt => (
                  <tr key={bt.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-4 px-4 font-bold text-teal-300">
                      {bt.center_name || bt.center?.name || 'Diagnostic Center'}
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
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: BRANCH TEST PRICING */}
      {showBranchTestModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Add Diagnostic Center Test Price</h3>
              <button onClick={() => setShowBranchTestModal(false)} className="text-slate-400 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBranchTest} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Select Diagnostic Center *</label>
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
                <button type="submit" className="px-5 py-2 bg-teal-600 text-white font-bold rounded-xl">Save Pricing</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
