import React from 'react';
import { 
  Sparkles, Plus, Building2, FlaskConical, Stethoscope, TestTube, 
  Calendar, Edit, Trash2, Activity, Layers, ArrowUpRight, RefreshCw 
} from 'lucide-react';
import { useAdminContext } from '../../context/AdminContext';

export default function SuperAdminOverview() {
  const {
    hospitals = [],
    diagnosticCenters = [],
    doctors = [],
    tests = [],
    doctorBookings = [],
    labBookings = [],
    doctorSpecialties = [],
    hospitalCategories = [],
    diagnosticCategories = [],
    hospitalServices = [],
    diagnosticServices = [],
    loading,
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

  const safeHospitals = hospitals || [];
  const safeDiagnostics = diagnosticCenters || [];
  const safeDoctors = doctors || [];
  const safeTests = tests || [];
  const safeDocBookings = doctorBookings || [];
  const safeLabBookings = labBookings || [];
  const safeDoctorSpecs = doctorSpecialties || [];
  const safeHospitalCats = hospitalCategories || [];
  const safeDiagCats = diagnosticCategories || [];

  return (
    <div className="space-y-6">
      
      {/* Header Banner & Quick Actions */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950/40 to-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-500/30 text-teal-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Platform Operations Command</span>
          </div>
          <h2 className="text-2xl font-black text-white flex items-center gap-3">
            <span>Healthcare System Overview</span>
            {loading && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-normal">
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span>Syncing catalog data...</span>
              </span>
            )}
          </h2>
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
          <div className="text-2xl font-black text-white">
            {loading ? <RefreshCw className="w-5 h-5 animate-spin text-emerald-400 inline" /> : safeHospitals.length}
          </div>
          <div className="text-xs text-slate-400 font-semibold mt-1">Hospitals</div>
        </div>

        <div onClick={() => setActiveTab('diagnostics')} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl cursor-pointer hover:border-cyan-500/50 transition group">
          <div className="flex items-center justify-between text-cyan-400 mb-2">
            <FlaskConical className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-bold bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded border border-cyan-500/30">Diagnostics</span>
          </div>
          <div className="text-2xl font-black text-white">
            {loading ? <RefreshCw className="w-5 h-5 animate-spin text-cyan-400 inline" /> : safeDiagnostics.length}
          </div>
          <div className="text-xs text-slate-400 font-semibold mt-1">Diagnostic Branches</div>
        </div>

        <div onClick={() => setActiveTab('doctors')} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl cursor-pointer hover:border-teal-500/50 transition group">
          <div className="flex items-center justify-between text-teal-400 mb-2">
            <Stethoscope className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-bold bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded border border-teal-500/30">Doctors</span>
          </div>
          <div className="text-2xl font-black text-white">
            {loading ? <RefreshCw className="w-5 h-5 animate-spin text-teal-400 inline" /> : safeDoctors.length}
          </div>
          <div className="text-xs text-slate-400 font-semibold mt-1">Specialist Doctors</div>
        </div>

        <div onClick={() => setActiveTab('tests')} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl cursor-pointer hover:border-purple-500/50 transition group">
          <div className="flex items-center justify-between text-purple-400 mb-2">
            <TestTube className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-bold bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded border border-purple-500/30">Tests</span>
          </div>
          <div className="text-2xl font-black text-white">
            {loading ? <RefreshCw className="w-5 h-5 animate-spin text-purple-400 inline" /> : safeTests.length}
          </div>
          <div className="text-xs text-slate-400 font-semibold mt-1">Base Tests</div>
        </div>

        <div onClick={() => setActiveTab('doc-bookings')} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl cursor-pointer hover:border-amber-500/50 transition group">
          <div className="flex items-center justify-between text-amber-400 mb-2">
            <Calendar className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">Serials</span>
          </div>
          <div className="text-2xl font-black text-white">
            {loading ? <RefreshCw className="w-5 h-5 animate-spin text-amber-400 inline" /> : safeDocBookings.length}
          </div>
          <div className="text-xs text-slate-400 font-semibold mt-1">Doctor Serials</div>
        </div>

        <div onClick={() => setActiveTab('lab-bookings')} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl cursor-pointer hover:border-rose-500/50 transition group">
          <div className="flex items-center justify-between text-rose-400 mb-2">
            <Calendar className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-bold bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded border border-rose-500/30">Pickups</span>
          </div>
          <div className="text-2xl font-black text-white">
            {loading ? <RefreshCw className="w-5 h-5 animate-spin text-rose-400 inline" /> : safeLabBookings.length}
          </div>
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
              <h3 className="font-bold text-sm text-white">Doctor Specialties ({safeDoctorSpecs.length})</h3>
            </div>
            <button
              onClick={() => handleOpenDoctorSpecModal && handleOpenDoctorSpecModal()}
              className="p-1.5 bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </div>
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1 text-xs">
            {safeDoctorSpecs.map(spec => (
              <div key={spec.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 hover:border-teal-500/30">
                <span className="text-slate-200 font-medium">{spec.name}</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => handleOpenDoctorSpecModal && handleOpenDoctorSpecModal(spec)} className="p-1 text-slate-400 hover:text-teal-400 cursor-pointer">
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDeleteDoctorSpec && handleDeleteDoctorSpec(spec.id, spec.name)} className="p-1 text-slate-400 hover:text-rose-400 cursor-pointer">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
            {safeDoctorSpecs.length === 0 && (
              <div className="text-center py-4 text-slate-500 text-xs">No doctor specialties found.</div>
            )}
          </div>
        </div>

        {/* Hospital Categories */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-400" />
              <h3 className="font-bold text-sm text-white">Hospital Categories ({safeHospitalCats.length})</h3>
            </div>
            <button
              onClick={() => handleOpenHospitalCatModal && handleOpenHospitalCatModal()}
              className="p-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </div>
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1 text-xs">
            {safeHospitalCats.map(cat => (
              <div key={cat.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 hover:border-emerald-500/30">
                <span className="text-slate-200 font-medium">{cat.name}</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => handleOpenHospitalCatModal && handleOpenHospitalCatModal(cat)} className="p-1 text-slate-400 hover:text-emerald-400 cursor-pointer">
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDeleteHospitalCat && handleDeleteHospitalCat(cat.id, cat.name)} className="p-1 text-slate-400 hover:text-rose-400 cursor-pointer">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
            {safeHospitalCats.length === 0 && (
              <div className="text-center py-4 text-slate-500 text-xs">No hospital categories found.</div>
            )}
          </div>
        </div>

        {/* Diagnostic Categories */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-cyan-400" />
              <h3 className="font-bold text-sm text-white">Diagnostics Categories ({safeDiagCats.length})</h3>
            </div>
            <button
              onClick={() => handleOpenDiagCatModal && handleOpenDiagCatModal()}
              className="p-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </div>
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1 text-xs">
            {safeDiagCats.map(cat => (
              <div key={cat.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 hover:border-cyan-500/30">
                <span className="text-slate-200 font-medium">{cat.name}</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => handleOpenDiagCatModal && handleOpenDiagCatModal(cat)} className="p-1 text-slate-400 hover:text-cyan-400 cursor-pointer">
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDeleteDiagCat && handleDeleteDiagCat(cat.id, cat.name)} className="p-1 text-slate-400 hover:text-rose-400 cursor-pointer">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
            {safeDiagCats.length === 0 && (
              <div className="text-center py-4 text-slate-500 text-xs">No diagnostic categories found.</div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
