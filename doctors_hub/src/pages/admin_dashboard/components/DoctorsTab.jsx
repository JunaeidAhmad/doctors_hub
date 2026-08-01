import React from 'react';
import { Search, Plus, Edit, Trash2, XCircle, Stethoscope } from 'lucide-react';

export default function DoctorsTab({
  doctors = [],
  doctorSpecialties = [],
  hospitals = [],
  diagnosticCenters = [],
  searchTerm,
  setSearchTerm,
  showDoctorModal,
  setShowDoctorModal,
  editingDoctor,
  doctorForm,
  setDoctorForm,
  handleOpenDoctorModal,
  handleSaveDoctor,
  handleDeleteDoctor
}) {
  return (
    <>
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search doctor name or qualification..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
            />
          </div>
          <button
            onClick={() => handleOpenDoctorModal()}
            className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-teal-600/20"
          >
            <Plus className="w-4 h-4" /> Add New Specialist Doctor
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 text-[11px] uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Doctor Name</th>
                <th className="py-3.5 px-4">Qualification & Experience</th>
                <th className="py-3.5 px-4">Specialties</th>
                <th className="py-3.5 px-4">Affiliations & Chambers</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {doctors
                .filter(d => `${d.name} ${d.qualification} ${d.experience}`.toLowerCase().includes(searchTerm.toLowerCase()))
                .map(d => (
                  <tr key={d.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-4 px-4 font-bold text-white">
                      <div className="text-sm text-teal-400 flex items-center gap-1.5">
                        <Stethoscope className="w-4 h-4 text-teal-400" />
                        <span>{d.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-slate-200 font-semibold">{d.qualification}</div>
                      <div className="text-slate-400 text-[11px]">{d.experience}</div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex flex-wrap gap-1">
                        {(d.specialties || []).map((s, idx) => (
                          <span key={s.id || idx} className="px-2 py-0.5 bg-teal-500/20 text-teal-300 border border-teal-500/30 rounded text-[10px] font-bold">
                            {s.name || s}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-slate-300 text-[11px]">
                        {(d.affiliations || []).map((aff, idx) => (
                          <div key={idx} className="truncate max-w-xs">
                            • {aff.hospital?.name || aff.diagnostic_center?.name || 'Private Chamber'} ({aff.consultation_type || 'OPD'})
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right space-x-2 whitespace-nowrap">
                      <button onClick={() => handleOpenDoctorModal(d)} className="p-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeleteDoctor(d.id, d.name)} className="p-2 bg-rose-500/20 text-rose-400 rounded-lg hover:bg-rose-500/30">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: ADD / EDIT DOCTOR */}
      {showDoctorModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-2xl w-full space-y-4 my-8 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white">
                {editingDoctor ? 'Edit Specialist Doctor' : 'Add New Specialist Doctor'}
              </h3>
              <button onClick={() => setShowDoctorModal(false)} className="text-slate-400 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDoctor} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Doctor Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Prof. Dr. M. A. Karim"
                  value={doctorForm.name}
                  onChange={e => setDoctorForm({ ...doctorForm, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Qualifications *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MBBS, FCPS (Cardiology), FACC"
                    value={doctorForm.qualification}
                    onChange={e => setDoctorForm({ ...doctorForm, qualification: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Experience *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 15+ Yrs Exp."
                    value={doctorForm.experience}
                    onChange={e => setDoctorForm({ ...doctorForm, experience: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-teal-400 font-bold mb-1.5">Doctor Specialties *</label>
                <div className="flex flex-wrap gap-2 p-3 bg-slate-950 border border-slate-800 rounded-xl max-h-36 overflow-y-auto">
                  {doctorSpecialties.map(spec => {
                    const isSelected = (doctorForm.selectedSpecialties || []).includes(spec.id);
                    return (
                      <button
                        key={spec.id}
                        type="button"
                        onClick={() => {
                          const current = doctorForm.selectedSpecialties || [];
                          const updated = current.includes(spec.id)
                            ? current.filter(id => id !== spec.id)
                            : [...current, spec.id];
                          setDoctorForm({ ...doctorForm, selectedSpecialties: updated });
                        }}
                        className={`px-3 py-1 rounded-lg border text-xs font-bold transition ${
                          isSelected 
                            ? 'bg-teal-500/20 text-teal-300 border-teal-500/50' 
                            : 'bg-slate-900 text-slate-400 border-slate-800'
                        }`}
                      >
                        {spec.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button type="button" onClick={() => setShowDoctorModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 font-bold rounded-xl">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl shadow-lg">
                  Save Doctor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
