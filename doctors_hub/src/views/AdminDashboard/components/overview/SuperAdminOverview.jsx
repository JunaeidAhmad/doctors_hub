import React from 'react';
import { 
  Sparkles, Plus, Building2, FlaskConical, Stethoscope, TestTube, 
  Calendar, Edit, Trash2, Activity, Layers, ArrowUpRight 
} from 'lucide-react';
import { useAdminContext } from '../../context/AdminContext';

export default function SuperAdminOverview() {
  const {
    hospitals,
    diagnosticCenters,
    doctors,
    tests,
    doctorBookings,
    labBookings,
    doctorSpecialties,
    hospitalCategories,
    diagnosticCategories,
    hospitalServices,
    diagnosticServices,
    handleOpenHospitalModal,
    handleOpenDiagnosticModal,
    handleOpenDoctorModal,
    handleOpenTestModal,
    handleOpenDoctorSpecModal,
    handleDeleteDoctorSpec,
    handleOpenHospitalCatModal,
    handleDeleteHospitalCat,
    handleOpenDiagCatModal,
    handleDeleteDiagCat,
    handleOpenHospServiceModal,
    handleDeleteHospService,
    handleOpenDiagServiceModal,
    handleDeleteDiagService,
    setActiveTab
  } = useAdminContext();

  return (
    <div className="space-y-6">
      
      {/* Header Banner & Quick Actions */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950/40 to-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-500/30 text-teal-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Platform Operations Command</span>
          </div>
          <h2 className="text-2xl font-black text-white">Healthcare System Overview</h2>
          <p className="text-xs text-slate-400 mt-1">Real-time stats across all Hospitals, Diagnostics, Doctors & Master Test catalogs.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => handleOpenHospitalModal && handleOpenHospitalModal()}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Add Hospital
          </button>
          <button
            onClick={() => handleOpenDiagnosticModal && handleOpenDiagnosticModal()}
            className="px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Add Diagnostics
          </button>
          <button
            onClick={() => handleOpenDoctorModal && handleOpenDoctorModal()}
            className="px-3.5 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Add Doctor
          </button>
          <button
            onClick={() => handleOpenTestModal && handleOpenTestModal()}
            className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Add Master Test
          </button>
        </div>
      </div>

      {/* Metrics Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div onClick={() => setActiveTab('hospitals')} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl cursor-pointer hover:border-emerald-500/50 transition group">
          <div className="flex items-center justify-between text-emerald-400 mb-2">
            <Building2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">Hospitals</span>
          </div>
          <div className="text-2xl font-black text-white">{hospitals.length}</div>
          <div className="text-xs text-slate-400 font-semibold mt-1">Hospitals</div>
        </div>

        <div onClick={() => setActiveTab('diagnostics')} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl cursor-pointer hover:border-cyan-500/50 transition group">
          <div className="flex items-center justify-between text-cyan-400 mb-2">
            <FlaskConical className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-bold bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded border border-cyan-500/30">Diagnostics</span>
          </div>
          <div className="text-2xl font-black text-white">{diagnosticCenters.length}</div>
          <div className="text-xs text-slate-400 font-semibold mt-1">Diagnostic Branches</div>
        </div>

        <div onClick={() => setActiveTab('doctors')} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl cursor-pointer hover:border-teal-500/50 transition group">
          <div className="flex items-center justify-between text-teal-400 mb-2">
            <Stethoscope className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-bold bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded border border-teal-500/30">Doctors</span>
          </div>
          <div className="text-2xl font-black text-white">{doctors.length}</div>
          <div className="text-xs text-slate-400 font-semibold mt-1">Specialist Doctors</div>
        </div>

        <div onClick={() => setActiveTab('tests')} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl cursor-pointer hover:border-purple-500/50 transition group">
          <div className="flex items-center justify-between text-purple-400 mb-2">
            <TestTube className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-bold bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded border border-purple-500/30">Tests</span>
          </div>
          <div className="text-2xl font-black text-white">{tests.length}</div>
          <div className="text-xs text-slate-400 font-semibold mt-1">Base Tests</div>
        </div>

        <div onClick={() => setActiveTab('doc-bookings')} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl cursor-pointer hover:border-amber-500/50 transition group">
          <div className="flex items-center justify-between text-amber-400 mb-2">
            <Calendar className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">Serials</span>
          </div>
          <div className="text-2xl font-black text-white">{doctorBookings.length}</div>
          <div className="text-xs text-slate-400 font-semibold mt-1">Doctor Serials</div>
        </div>

        <div onClick={() => setActiveTab('lab-bookings')} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl cursor-pointer hover:border-rose-500/50 transition group">
          <div className="flex items-center justify-between text-rose-400 mb-2">
            <Calendar className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-bold bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded border border-rose-500/30">Pickups</span>
          </div>
          <div className="text-2xl font-black text-white">{labBookings.length}</div>
          <div className="text-xs text-slate-400 font-semibold mt-1">Lab Pickups</div>
        </div>
      </div>

      {/* Global Taxonomy Management Panels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Doctor Specialties */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-teal-400" />
              <h3 className="font-bold text-sm text-white">Doctor Specialties ({doctorSpecialties.length})</h3>
            </div>
            <button
              onClick={() => handleOpenDoctorSpecModal()}
              className="p-1.5 bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 rounded-lg text-xs font-bold flex items-center gap-1 transition"
            >
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </div>
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1 text-xs">
            {doctorSpecialties.map(spec => (
              <div key={spec.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 hover:border-teal-500/30">
                <span className="text-slate-200 font-medium">{spec.name}</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => handleOpenDoctorSpecModal(spec)} className="p-1 text-slate-400 hover:text-teal-400">
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDeleteDoctorSpec(spec.id, spec.name)} className="p-1 text-slate-400 hover:text-rose-400">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hospital Categories */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-400" />
              <h3 className="font-bold text-sm text-white">Hospital Categories ({hospitalCategories.length})</h3>
            </div>
            <button
              onClick={() => handleOpenHospitalCatModal()}
              className="p-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-lg text-xs font-bold flex items-center gap-1 transition"
            >
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </div>
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1 text-xs">
            {hospitalCategories.map(cat => (
              <div key={cat.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 hover:border-emerald-500/30">
                <span className="text-slate-200 font-medium">{cat.name}</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => handleOpenHospitalCatModal(cat)} className="p-1 text-slate-400 hover:text-emerald-400">
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDeleteHospitalCat(cat.id, cat.name)} className="p-1 text-slate-400 hover:text-rose-400">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Diagnostic Categories */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-cyan-400" />
              <h3 className="font-bold text-sm text-white">Diagnostics Categories ({diagnosticCategories.length})</h3>
            </div>
            <button
              onClick={() => handleOpenDiagCatModal()}
              className="p-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 rounded-lg text-xs font-bold flex items-center gap-1 transition"
            >
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </div>
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1 text-xs">
            {diagnosticCategories.map(cat => (
              <div key={cat.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 hover:border-cyan-500/30">
                <span className="text-slate-200 font-medium">{cat.name}</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => handleOpenDiagCatModal(cat)} className="p-1 text-slate-400 hover:text-cyan-400">
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDeleteDiagCat(cat.id, cat.name)} className="p-1 text-slate-400 hover:text-rose-400">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
