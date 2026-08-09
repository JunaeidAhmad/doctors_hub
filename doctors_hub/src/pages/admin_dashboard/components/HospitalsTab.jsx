import React from 'react';
import { Search, Plus, Edit, Trash2, XCircle, CheckCircle, Building2 } from 'lucide-react';
import { CITY_THANAS, LOCATIONS } from '../../../data/mockData';

export default function HospitalsTab({
  hospitals = [],
  hospitalCategories = [],
  hospitalServices = [],
  searchTerm,
  setSearchTerm,
  showHospitalModal,
  setShowHospitalModal,
  editingHospital,
  hospitalForm,
  setHospitalForm,
  handleOpenHospitalModal,
  handleSaveHospital,
  handleDeleteHospital,
  toggleHospitalServiceSelection,
  handleOpenBranchTestModal
}) {
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
              {hospitals
                .filter(h => `${h.name} ${h.branch} ${h.city}`.toLowerCase().includes(searchTerm.toLowerCase()))
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

      {/* MODAL: ADD / EDIT HOSPITAL */}
      {showHospitalModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-2xl w-full space-y-4 my-8 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white">
                {editingHospital ? 'Edit Hospital' : 'Add New Hospital Branch'}
              </h3>
              <button onClick={() => setShowHospitalModal(false)} className="text-slate-400 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveHospital} className="space-y-4 text-xs">
              
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Hospital Category *</label>
                <select
                  required
                  value={hospitalForm.category_id}
                  onChange={e => setHospitalForm({ ...hospitalForm, category_id: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white font-bold"
                >
                  <option value="">Select Hospital Category</option>
                  {hospitalCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Hospital Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ibn Sina Healthcare Group"
                  value={hospitalForm.name}
                  onChange={e => setHospitalForm({ ...hospitalForm, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
                <div>
                  <label className="block text-emerald-400 font-bold mb-1">Step 1: Select City *</label>
                  <select
                    required
                    value={hospitalForm.city}
                    onChange={e => {
                      const newCity = e.target.value;
                      const thanas = CITY_THANAS[newCity] || [];
                      setHospitalForm({
                        ...hospitalForm,
                        city: newCity,
                        district: newCity,
                        branch: thanas[0] || 'Main',
                        isCustomBranch: false,
                        customBranch: ''
                      });
                    }}
                    className="w-full bg-slate-900 border border-emerald-500/50 rounded-xl px-3 py-2 text-white font-bold"
                  >
                    {LOCATIONS.filter(l => l !== 'All Bangladesh').map(loc => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-emerald-400 font-bold mb-1">Step 2: Select Branch (Thanas in {hospitalForm.city}) *</label>
                  <select
                    required
                    value={hospitalForm.isCustomBranch ? 'Other' : hospitalForm.branch}
                    onChange={e => {
                      const val = e.target.value;
                      if (val === 'Other') {
                        setHospitalForm({ ...hospitalForm, isCustomBranch: true, branch: 'Other' });
                      } else {
                        setHospitalForm({ ...hospitalForm, isCustomBranch: false, branch: val, customBranch: '' });
                      }
                    }}
                    className="w-full bg-slate-900 border border-emerald-500/50 rounded-xl px-3 py-2 text-white font-bold"
                  >
                    {(CITY_THANAS[hospitalForm.city] || []).map(th => (
                      <option key={th} value={th}>{th} Branch</option>
                    ))}
                    <option value="Other">+ Other (Custom Branch Name)</option>
                  </select>
                </div>

                {hospitalForm.isCustomBranch && (
                  <div className="md:col-span-2 mt-1">
                    <label className="block text-slate-300 font-semibold mb-1">Specify Custom Branch Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rampura Main Branch"
                      value={hospitalForm.customBranch}
                      onChange={e => setHospitalForm({ ...hospitalForm, customBranch: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Full Address</label>
                <input
                  type="text"
                  placeholder="e.g. House 48, Road 9/A, Dhanmondi"
                  value={hospitalForm.address}
                  onChange={e => setHospitalForm({ ...hospitalForm, address: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={hospitalForm.phone}
                    onChange={e => setHospitalForm({ ...hospitalForm, phone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Open Hours / Timing</label>
                  <input
                    type="text"
                    value={hospitalForm.open_timing}
                    onChange={e => setHospitalForm({ ...hospitalForm, open_timing: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Tagline</label>
                  <input
                    type="text"
                    value={hospitalForm.tagline}
                    onChange={e => setHospitalForm({ ...hospitalForm, tagline: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Badge Tag</label>
                  <input
                    type="text"
                    value={hospitalForm.badge}
                    onChange={e => setHospitalForm({ ...hospitalForm, badge: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Hospital Description</label>
                <textarea
                  rows="2"
                  value={hospitalForm.description}
                  onChange={e => setHospitalForm({ ...hospitalForm, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                ></textarea>
              </div>

              <div className="pt-2">
                <label className="block text-slate-300 font-semibold mb-1.5">Services & Facilities (Click to Select / Deselect) *</label>
                <div className="flex flex-wrap gap-2 p-3 bg-slate-950 border border-slate-800 rounded-xl max-h-44 overflow-y-auto">
                  {hospitalServices.map(srv => {
                    const isSelected = hospitalForm.service_ids.includes(srv.id);
                    return (
                      <button
                        key={srv.id}
                        type="button"
                        onClick={() => toggleHospitalServiceSelection(srv.id)}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 ${
                          isSelected 
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm shadow-emerald-500/20' 
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
                        }`}
                      >
                        <CheckCircle className={`w-3.5 h-3.5 ${isSelected ? 'opacity-100 text-emerald-400' : 'opacity-0'}`} />
                        <span>{srv.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button type="button" onClick={() => setShowHospitalModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 font-bold rounded-xl">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg">
                  Save Hospital
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </>
  );
}
