import React from 'react';
import { 
  Sparkles, Plus, Building2, FlaskConical, Stethoscope, TestTube, 
  Calendar, Edit, Trash2, Activity, Layers, ArrowUpRight, RefreshCw,
  ShieldCheck, CheckCircle, BarChart3, TrendingUp
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
      {/* Editorial Header Banner & Quick Actions */}
      <div className="bg-white border border-[#d1d5dc] rounded-sm p-5 md:p-6 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-xs bg-[#e7ebff] border border-[#094cb2]/20 text-[#094cb2] text-[10px] font-label font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3 h-3" />
            <span>Platform Telemetry Dispatch</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-[#1b1c1d] flex flex-wrap items-center gap-3">
            <span>Healthcare Operations Overview</span>
            {loading && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-xs bg-amber-50 border border-amber-200 text-amber-800 text-xs font-label">
                <RefreshCw className="w-3 h-3 animate-spin text-amber-600" />
                <span>Syncing catalog data...</span>
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-500 font-body mt-1 max-w-2xl">
            Live institutional telemetry across accredited hospital networks, diagnostic laboratories, specialist physicians, and master clinical taxonomies.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => handleOpenHospitalModal && handleOpenHospitalModal()}
            className="px-3 py-1.5 bg-[#094cb2] hover:bg-[#083e91] text-white font-label text-xs font-semibold rounded-sm flex items-center gap-1.5 shadow-sm transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Add Hospital
          </button>
          <button
            onClick={() => handleOpenDiagnosticModal && handleOpenDiagnosticModal()}
            className="px-3 py-1.5 border border-[#d1d5dc] bg-white hover:bg-[#f7f6f7] text-slate-700 font-label text-xs font-semibold rounded-sm flex items-center gap-1.5 shadow-sm transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Add Diagnostics
          </button>
          <button
            onClick={() => handleOpenDoctorModal && handleOpenDoctorModal()}
            className="px-3 py-1.5 border border-[#d1d5dc] bg-white hover:bg-[#f7f6f7] text-slate-700 font-label text-xs font-semibold rounded-sm flex items-center gap-1.5 shadow-sm transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Add Doctor
          </button>
          <button
            onClick={() => handleOpenTestModal && handleOpenTestModal()}
            className="px-3 py-1.5 border border-[#d1d5dc] bg-white hover:bg-[#f7f6f7] text-slate-700 font-label text-xs font-semibold rounded-sm flex items-center gap-1.5 shadow-sm transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Add Master Test
          </button>
        </div>
      </div>

      {/* Metrics Bento Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div 
          onClick={() => setActiveTab('hospitals')} 
          className="bg-white border border-[#d1d5dc] p-3.5 rounded-sm shadow-card cursor-pointer hover:border-[#094cb2] transition-colors group"
        >
          <div className="flex items-center justify-between text-[#094cb2] mb-1.5">
            <Building2 className="w-4 h-4 group-hover:scale-105 transition-transform" />
            <span className="text-[10px] font-label font-bold bg-[#e7ebff] text-[#094cb2] px-1.5 py-0.5 rounded-xs">Hospitals</span>
          </div>
          <div className="text-2xl font-serif font-bold text-[#1b1c1d]">
            {loading ? <RefreshCw className="w-4 h-4 animate-spin text-[#094cb2] inline" /> : safeHospitals.length}
          </div>
          <div className="text-[11px] text-slate-500 font-label mt-0.5">Clinical Campuses</div>
        </div>

        <div 
          onClick={() => setActiveTab('diagnostics')} 
          className="bg-white border border-[#d1d5dc] p-3.5 rounded-sm shadow-card cursor-pointer hover:border-[#094cb2] transition-colors group"
        >
          <div className="flex items-center justify-between text-cyan-700 mb-1.5">
            <FlaskConical className="w-4 h-4 group-hover:scale-105 transition-transform" />
            <span className="text-[10px] font-label font-bold bg-cyan-50 text-cyan-800 px-1.5 py-0.5 rounded-xs border border-cyan-200">Diagnostics</span>
          </div>
          <div className="text-2xl font-serif font-bold text-[#1b1c1d]">
            {loading ? <RefreshCw className="w-4 h-4 animate-spin text-cyan-600 inline" /> : safeDiagnostics.length}
          </div>
          <div className="text-[11px] text-slate-500 font-label mt-0.5">Laboratory Branches</div>
        </div>

        <div 
          onClick={() => setActiveTab('doctors')} 
          className="bg-white border border-[#d1d5dc] p-3.5 rounded-sm shadow-card cursor-pointer hover:border-[#094cb2] transition-colors group"
        >
          <div className="flex items-center justify-between text-teal-700 mb-1.5">
            <Stethoscope className="w-4 h-4 group-hover:scale-105 transition-transform" />
            <span className="text-[10px] font-label font-bold bg-teal-50 text-teal-800 px-1.5 py-0.5 rounded-xs border border-teal-200">Doctors</span>
          </div>
          <div className="text-2xl font-serif font-bold text-[#1b1c1d]">
            {loading ? <RefreshCw className="w-4 h-4 animate-spin text-teal-600 inline" /> : safeDoctors.length}
          </div>
          <div className="text-[11px] text-slate-500 font-label mt-0.5">Specialist Registry</div>
        </div>

        <div 
          onClick={() => setActiveTab('tests')} 
          className="bg-white border border-[#d1d5dc] p-3.5 rounded-sm shadow-card cursor-pointer hover:border-[#094cb2] transition-colors group"
        >
          <div className="flex items-center justify-between text-purple-700 mb-1.5">
            <TestTube className="w-4 h-4 group-hover:scale-105 transition-transform" />
            <span className="text-[10px] font-label font-bold bg-purple-50 text-purple-800 px-1.5 py-0.5 rounded-xs border border-purple-200">Tests</span>
          </div>
          <div className="text-2xl font-serif font-bold text-[#1b1c1d]">
            {loading ? <RefreshCw className="w-4 h-4 animate-spin text-purple-600 inline" /> : safeTests.length}
          </div>
          <div className="text-[11px] text-slate-500 font-label mt-0.5">Pathology Catalog</div>
        </div>

        <div 
          onClick={() => setActiveTab('doc-bookings')} 
          className="bg-white border border-[#d1d5dc] p-3.5 rounded-sm shadow-card cursor-pointer hover:border-[#094cb2] transition-colors group"
        >
          <div className="flex items-center justify-between text-amber-700 mb-1.5">
            <Calendar className="w-4 h-4 group-hover:scale-105 transition-transform" />
            <span className="text-[10px] font-label font-bold bg-amber-50 text-amber-800 px-1.5 py-0.5 rounded-xs border border-amber-200">Serials</span>
          </div>
          <div className="text-2xl font-serif font-bold text-[#1b1c1d]">
            {loading ? <RefreshCw className="w-4 h-4 animate-spin text-amber-600 inline" /> : safeDocBookings.length}
          </div>
          <div className="text-[11px] text-slate-500 font-label mt-0.5">Doctor Serials</div>
        </div>

        <div 
          onClick={() => setActiveTab('lab-bookings')} 
          className="bg-white border border-[#d1d5dc] p-3.5 rounded-sm shadow-card cursor-pointer hover:border-[#094cb2] transition-colors group"
        >
          <div className="flex items-center justify-between text-rose-700 mb-1.5">
            <Calendar className="w-4 h-4 group-hover:scale-105 transition-transform" />
            <span className="text-[10px] font-label font-bold bg-rose-50 text-rose-800 px-1.5 py-0.5 rounded-xs border border-rose-200">Pickups</span>
          </div>
          <div className="text-2xl font-serif font-bold text-[#1b1c1d]">
            {loading ? <RefreshCw className="w-4 h-4 animate-spin text-rose-600 inline" /> : safeLabBookings.length}
          </div>
          <div className="text-[11px] text-slate-500 font-label mt-0.5">Home Lab Pickups</div>
        </div>
      </div>

      {/* Global Taxonomy Management Panels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Doctor Specialties */}
        <div className="bg-white border border-[#d1d5dc] rounded-sm p-4 shadow-card">
          <div className="flex items-center justify-between mb-3 border-b border-[#d1d5dc] pb-2.5">
            <div className="flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-[#094cb2]" />
              <h3 className="font-serif font-bold text-sm text-[#1b1c1d]">Specialties ({safeDoctorSpecs.length})</h3>
            </div>
            <button
              onClick={() => handleOpenDoctorSpecModal && handleOpenDoctorSpecModal()}
              className="px-2 py-0.5 bg-[#e7ebff] hover:bg-[#d9e2ff] text-[#094cb2] rounded-xs text-xs font-label font-semibold flex items-center gap-1 transition cursor-pointer"
            >
              <Plus className="w-3 h-3" /> Add
            </button>
          </div>
          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1 text-xs">
            {safeDoctorSpecs.map(spec => (
              <div key={spec.id} className="flex items-center justify-between p-2 rounded-xs bg-[#faf9fa] border border-[#e3e5ea] hover:border-[#094cb2]/40 transition-colors">
                <span className="text-slate-800 font-medium font-body">{spec.name}</span>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => handleOpenDoctorSpecModal && handleOpenDoctorSpecModal(spec)} 
                    className="p-1 text-slate-400 hover:text-[#094cb2] transition-colors cursor-pointer"
                    title="Edit Specialty"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => handleDeleteDoctorSpec && handleDeleteDoctorSpec(spec.id, spec.name)} 
                    className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                    title="Delete Specialty"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
            {safeDoctorSpecs.length === 0 && (
              <div className="text-center py-6 text-slate-400 text-xs font-body">No doctor specialties recorded.</div>
            )}
          </div>
        </div>

        {/* Hospital Categories */}
        <div className="bg-white border border-[#d1d5dc] rounded-sm p-4 shadow-card">
          <div className="flex items-center justify-between mb-3 border-b border-[#d1d5dc] pb-2.5">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-700" />
              <h3 className="font-serif font-bold text-sm text-[#1b1c1d]">Hospital Categories ({safeHospitalCats.length})</h3>
            </div>
            <button
              onClick={() => handleOpenHospitalCatModal && handleOpenHospitalCatModal()}
              className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xs text-xs font-label font-semibold flex items-center gap-1 transition cursor-pointer"
            >
              <Plus className="w-3 h-3" /> Add
            </button>
          </div>
          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1 text-xs">
            {safeHospitalCats.map(cat => (
              <div key={cat.id} className="flex items-center justify-between p-2 rounded-xs bg-[#faf9fa] border border-[#e3e5ea] hover:border-emerald-600/40 transition-colors">
                <span className="text-slate-800 font-medium font-body">{cat.name}</span>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => handleOpenHospitalCatModal && handleOpenHospitalCatModal(cat)} 
                    className="p-1 text-slate-400 hover:text-emerald-700 transition-colors cursor-pointer"
                    title="Edit Category"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => handleDeleteHospitalCat && handleDeleteHospitalCat(cat.id, cat.name)} 
                    className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                    title="Delete Category"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
            {safeHospitalCats.length === 0 && (
              <div className="text-center py-6 text-slate-400 text-xs font-body">No hospital categories recorded.</div>
            )}
          </div>
        </div>

        {/* Diagnostic Categories */}
        <div className="bg-white border border-[#d1d5dc] rounded-sm p-4 shadow-card">
          <div className="flex items-center justify-between mb-3 border-b border-[#d1d5dc] pb-2.5">
            <div className="flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-cyan-700" />
              <h3 className="font-serif font-bold text-sm text-[#1b1c1d]">Diagnostics Categories ({safeDiagCats.length})</h3>
            </div>
            <button
              onClick={() => handleOpenDiagCatModal && handleOpenDiagCatModal()}
              className="px-2 py-0.5 bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-200 rounded-xs text-xs font-label font-semibold flex items-center gap-1 transition cursor-pointer"
            >
              <Plus className="w-3 h-3" /> Add
            </button>
          </div>
          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1 text-xs">
            {safeDiagCats.map(cat => (
              <div key={cat.id} className="flex items-center justify-between p-2 rounded-xs bg-[#faf9fa] border border-[#e3e5ea] hover:border-cyan-600/40 transition-colors">
                <span className="text-slate-800 font-medium font-body">{cat.name}</span>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => handleOpenDiagCatModal && handleOpenDiagCatModal(cat)} 
                    className="p-1 text-slate-400 hover:text-cyan-700 transition-colors cursor-pointer"
                    title="Edit Category"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => handleDeleteDiagCat && handleDeleteDiagCat(cat.id, cat.name)} 
                    className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                    title="Delete Category"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
            {safeDiagCats.length === 0 && (
              <div className="text-center py-6 text-slate-400 text-xs font-body">No diagnostic categories recorded.</div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
