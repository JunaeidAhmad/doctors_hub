import React from 'react';
import { 
  Sparkles, Plus, Building2, FlaskConical, Stethoscope, TestTube, 
  Calendar, Edit, Trash2, Activity 
} from 'lucide-react';
import { useAdminContext } from '../context/AdminContext';

export default function OverviewTab() {
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
            <span>Admin Operations Command</span>
          </div>
          <h2 className="text-2xl font-black text-white">Healthcare System Overview</h2>
          <p className="text-xs text-slate-400 mt-1">Real-time stats across Hospitals, Diagnostics & Branches, Services, Doctors & Diagnostic test pricing.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => handleOpenHospitalModal && handleOpenHospitalModal()}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md"
          >
            <Plus className="w-3.5 h-3.5" /> Add Hospital
          </button>
          <button
            onClick={() => handleOpenDiagnosticModal && handleOpenDiagnosticModal()}
            className="px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md"
          >
            <Plus className="w-3.5 h-3.5" /> Add Diagnostics / Branch
          </button>
          <button
            onClick={() => handleOpenDoctorModal && handleOpenDoctorModal()}
            className="px-3.5 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md"
          >
            <Plus className="w-3.5 h-3.5" /> Add Doctor
          </button>
        </div>
      </div>

      {/* Metrics Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div onClick={() => setActiveTab && setActiveTab('hospitals')} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl cursor-pointer hover:border-emerald-500/50 transition group">
          <div className="flex items-center justify-between text-emerald-400 mb-2">
            <Building2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">Hospitals</span>
          </div>
          <div className="text-2xl font-black text-white">{hospitals.length}</div>
          <div className="text-xs text-slate-400 font-semibold mt-1">Hospitals</div>
        </div>

        <div onClick={() => setActiveTab && setActiveTab('diagnostics')} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl cursor-pointer hover:border-cyan-500/50 transition group">
          <div className="flex items-center justify-between text-cyan-400 mb-2">
            <FlaskConical className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-bold bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded border border-cyan-500/30">Diagnostics</span>
          </div>
          <div className="text-2xl font-black text-white">{diagnosticCenters.length}</div>
          <div className="text-xs text-slate-400 font-semibold mt-1">Diagnostic Branches</div>
        </div>

        <div onClick={() => setActiveTab && setActiveTab('doctors')} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl cursor-pointer hover:border-teal-500/50 transition group">
          <div className="flex items-center justify-between text-teal-400 mb-2">
            <Stethoscope className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-bold bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded border border-teal-500/30">Doctors</span>
          </div>
          <div className="text-2xl font-black text-white">{doctors.length}</div>
          <div className="text-xs text-slate-400 font-semibold mt-1">Specialist Doctors</div>
        </div>

        <div onClick={() => setActiveTab && setActiveTab('tests')} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl cursor-pointer hover:border-amber-500/50 transition group">
          <div className="flex items-center justify-between text-amber-400 mb-2">
            <TestTube className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">Tests</span>
          </div>
          <div className="text-2xl font-black text-white">{tests.length}</div>
          <div className="text-xs text-slate-400 font-semibold mt-1">Base Tests</div>
        </div>

        <div onClick={() => setActiveTab && setActiveTab('doc-bookings')} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl cursor-pointer hover:border-indigo-500/50 transition group">
          <div className="flex items-center justify-between text-indigo-400 mb-2">
            <Calendar className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-bold bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/30">Doctor Bks</span>
          </div>
          <div className="text-2xl font-black text-white">{doctorBookings.length}</div>
          <div className="text-xs text-slate-400 font-semibold mt-1">Doctor Serials</div>
        </div>

        <div onClick={() => setActiveTab && setActiveTab('lab-bookings')} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl cursor-pointer hover:border-purple-500/50 transition group">
          <div className="flex items-center justify-between text-purple-400 mb-2">
            <Calendar className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-bold bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded border border-purple-500/30">Lab Bks</span>
          </div>
          <div className="text-2xl font-black text-white">{labBookings.length}</div>
          <div className="text-xs text-slate-400 font-semibold mt-1">Lab Pickups</div>
        </div>
      </div>

      {/* CATEGORIES & SERVICES OVERVIEW CARDS */}
      <div className="space-y-6">
        
        {/* ROW 1: 3 CARDS (Doctor Specialties, Hospital Categories, Diagnostics Categories) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* 1. Doctor Specialties Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 font-bold text-white text-sm">
                <Stethoscope className="w-4 h-4 text-teal-400" />
                <span>Doctor Specialties ({doctorSpecialties.length})</span>
              </div>
              <button
                onClick={() => handleOpenDoctorSpecModal && handleOpenDoctorSpecModal()}
                className="text-[11px] font-bold text-teal-400 hover:underline flex items-center gap-1 bg-teal-500/10 px-2.5 py-1 rounded-lg border border-teal-500/20"
              >
                <Plus className="w-3 h-3" /> Add
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1">
              {doctorSpecialties.map(s => (
                <span key={s.id} className="text-[11px] bg-slate-800/80 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-700/80 font-medium flex items-center gap-1">
                  <span>{s.name}</span>
                  <button onClick={() => handleOpenDoctorSpecModal && handleOpenDoctorSpecModal(s)} className="text-slate-400 hover:text-teal-400 ml-1" title="Edit Specialty">
                    <Edit className="w-3 h-3" />
                  </button>
                  <button onClick={() => handleDeleteDoctorSpec && handleDeleteDoctorSpec(s.id, s.name)} className="text-slate-400 hover:text-rose-400 ml-0.5" title="Delete Specialty">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* 2. Hospital Categories Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 font-bold text-white text-sm">
                <Building2 className="w-4 h-4 text-emerald-400" />
                <span>Hospital Categories ({hospitalCategories.length})</span>
              </div>
              <button
                onClick={() => handleOpenHospitalCatModal && handleOpenHospitalCatModal()}
                className="text-[11px] font-bold text-emerald-400 hover:underline flex items-center gap-1 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20"
              >
                <Plus className="w-3 h-3" /> Add
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1">
              {hospitalCategories.map(hc => (
                <span key={hc.id} className="text-[11px] bg-slate-800/80 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-700/80 font-medium flex items-center gap-1">
                  <span>{hc.name}</span>
                  <button onClick={() => handleOpenHospitalCatModal && handleOpenHospitalCatModal(hc)} className="text-slate-400 hover:text-emerald-400 ml-1" title="Edit Category">
                    <Edit className="w-3 h-3" />
                  </button>
                  <button onClick={() => handleDeleteHospitalCat && handleDeleteHospitalCat(hc.id, hc.name)} className="text-slate-400 hover:text-rose-400 ml-0.5" title="Delete Category">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* 3. Diagnostics Categories Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-lg">
            {(() => {
              const isSpecializationDiagCat = (c) => {
                if (!c || c.id === 'all' || c.id === 'by-specialization' || c.id === 'by-ownership-type') return false;
                const pId = typeof c.parent === 'object' && c.parent ? c.parent.id : c.parent;
                const pName = (typeof c.parent === 'object' && c.parent ? c.parent.name : c.parent_name) || '';
                if (pId === 'by-specialization' || String(pName).toLowerCase().includes('specialization')) return true;
                const name = String(c.name || '').toLowerCase();
                const isOwnershipName = name.includes('government') || name.includes('private') || name.includes('corporate') || name.includes('hospital-affiliated') || name.includes('ownership');
                return !isOwnershipName;
              };

              const isOwnershipDiagCat = (c) => {
                if (!c || c.id === 'all' || c.id === 'by-specialization' || c.id === 'by-ownership-type') return false;
                const pId = typeof c.parent === 'object' && c.parent ? c.parent.id : c.parent;
                const pName = (typeof c.parent === 'object' && c.parent ? c.parent.name : c.parent_name) || '';
                if (pId === 'by-ownership-type' || String(pName).toLowerCase().includes('ownership')) return true;
                const name = String(c.name || '').toLowerCase();
                return name.includes('government') || name.includes('private') || name.includes('corporate') || name.includes('hospital-affiliated') || name.includes('ownership');
              };

              const specCats = diagnosticCategories.filter(isSpecializationDiagCat);
              const ownCats = diagnosticCategories.filter(isOwnershipDiagCat);
              const totalValidCount = specCats.length + ownCats.length;

              return (
                <>
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2 font-bold text-white text-sm">
                      <FlaskConical className="w-4 h-4 text-cyan-400" />
                      <span>Diagnostics Categories ({totalValidCount})</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenDiagCatModal && handleOpenDiagCatModal(null, 'by-specialization')}
                        className="text-[10px] font-bold text-teal-300 hover:underline flex items-center gap-0.5 bg-teal-500/10 px-2 py-1 rounded-lg border border-teal-500/20"
                        title="Add Specialization Category"
                      >
                        <Plus className="w-3 h-3" /> Specialization
                      </button>
                      <button
                        onClick={() => handleOpenDiagCatModal && handleOpenDiagCatModal(null, 'by-ownership-type')}
                        className="text-[10px] font-bold text-cyan-300 hover:underline flex items-center gap-0.5 bg-cyan-500/10 px-2 py-1 rounded-lg border border-cyan-500/20"
                        title="Add Ownership Category"
                      >
                        <Plus className="w-3 h-3" /> Ownership
                      </button>
                    </div>
                  </div>

                  <div className="max-h-56 overflow-y-auto pr-1 space-y-3">
                    {/* SECTION 1: BY SPECIALIZATION */}
                    <div>
                      <div className="text-[10px] font-bold text-teal-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                        <span>By Specialization ({specCats.length})</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {specCats.map(dc => (
                          <span key={dc.id} className="text-[11px] bg-slate-800/80 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-700/80 font-medium flex items-center gap-1">
                            <span>{dc.name}</span>
                            <button onClick={() => handleOpenDiagCatModal && handleOpenDiagCatModal(dc, 'by-specialization')} className="text-slate-400 hover:text-cyan-400 ml-1" title="Edit Category">
                              <Edit className="w-3 h-3" />
                            </button>
                            <button onClick={() => handleDeleteDiagCat && handleDeleteDiagCat(dc.id, dc.name)} className="text-slate-400 hover:text-rose-400 ml-0.5" title="Delete Category">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* CLEAR DIVIDER LINE BETWEEN THE TWO CATEGORY TYPES */}
                    <div className="pt-1 pb-1">
                      <div className="border-t-2 border-slate-700/80 w-full" />
                    </div>

                    {/* SECTION 2: BY OWNERSHIP & TYPE */}
                    <div>
                      <div className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                        <span>By Ownership & Type ({ownCats.length})</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {ownCats.map(dc => (
                          <span key={dc.id} className="text-[11px] bg-slate-800/80 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-700/80 font-medium flex items-center gap-1">
                            <span>{dc.name}</span>
                            <button onClick={() => handleOpenDiagCatModal && handleOpenDiagCatModal(dc, 'by-ownership-type')} className="text-slate-400 hover:text-cyan-400 ml-1" title="Edit Category">
                              <Edit className="w-3 h-3" />
                            </button>
                            <button onClick={() => handleDeleteDiagCat && handleDeleteDiagCat(dc.id, dc.name)} className="text-slate-400 hover:text-rose-400 ml-0.5" title="Delete Category">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>

        </div>

        {/* ROW 2: 2 CARDS (Hospital Services & Diagnostic Services) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* 1. Hospital Services Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 font-bold text-white text-sm">
                <Activity className="w-4 h-4 text-amber-400" />
                <span>Hospital Services ({hospitalServices.length})</span>
              </div>
              <button
                onClick={() => handleOpenHospServiceModal && handleOpenHospServiceModal()}
                className="text-[11px] font-bold text-amber-400 hover:underline flex items-center gap-1 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20"
              >
                <Plus className="w-3 h-3" /> Add Service
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1">
              {hospitalServices.map(hs => (
                <span key={hs.id} className="text-[11px] bg-slate-800/80 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-700/80 font-medium flex items-center gap-1">
                  <span>{hs.name}</span>
                  <button onClick={() => handleOpenHospServiceModal && handleOpenHospServiceModal(hs)} className="text-slate-400 hover:text-amber-400 ml-1" title="Edit Service">
                    <Edit className="w-3 h-3" />
                  </button>
                  <button onClick={() => handleDeleteHospService && handleDeleteHospService(hs.id, hs.name)} className="text-slate-400 hover:text-rose-400 ml-0.5" title="Delete Service">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* 2. Diagnostic Services Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 font-bold text-white text-sm">
                <FlaskConical className="w-4 h-4 text-purple-400" />
                <span>Diagnostic Services ({diagnosticServices.length})</span>
              </div>
              <button
                onClick={() => handleOpenDiagServiceModal && handleOpenDiagServiceModal()}
                className="text-[11px] font-bold text-purple-400 hover:underline flex items-center gap-1 bg-purple-500/10 px-2.5 py-1 rounded-lg border border-purple-500/20"
              >
                <Plus className="w-3 h-3" /> Add Service
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1">
              {diagnosticServices.map(ds => (
                <span key={ds.id} className="text-[11px] bg-slate-800/80 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-700/80 font-medium flex items-center gap-1">
                  <span>{ds.name}</span>
                  <button onClick={() => handleOpenDiagServiceModal && handleOpenDiagServiceModal(ds)} className="text-slate-400 hover:text-purple-400 ml-1" title="Edit Service">
                    <Edit className="w-3 h-3" />
                  </button>
                  <button onClick={() => handleDeleteDiagService && handleDeleteDiagService(ds.id, ds.name)} className="text-slate-400 hover:text-rose-400 ml-0.5" title="Delete Service">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* Quick Preview Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Doctor Bookings Table Preview */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Calendar className="w-4 h-4 text-teal-400" /> Recent Doctor Bookings
            </h3>
            <button onClick={() => setActiveTab && setActiveTab('doc-bookings')} className="text-xs font-bold text-teal-400 hover:underline">
              View All &rarr;
            </button>
          </div>
          {doctorBookings.length === 0 ? (
            <p className="text-xs text-slate-500 py-4 text-center">No doctor bookings recorded yet.</p>
          ) : (
            <div className="space-y-2">
              {doctorBookings.slice(0, 4).map(b => (
                <div key={b.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-white">{b.patient_name}</div>
                    <div className="text-[10px] text-slate-400">{b.date} • {b.slot}</div>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-[10px] font-bold">
                    {b.status || 'Confirmed'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Lab Bookings Table Preview */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <TestTube className="w-4 h-4 text-cyan-400" /> Recent Home Lab Pickups
            </h3>
            <button onClick={() => setActiveTab && setActiveTab('lab-bookings')} className="text-xs font-bold text-cyan-400 hover:underline">
              View All &rarr;
            </button>
          </div>
          {labBookings.length === 0 ? (
            <p className="text-xs text-slate-500 py-4 text-center">No lab bookings recorded yet.</p>
          ) : (
            <div className="space-y-2">
              {labBookings.slice(0, 4).map(b => (
                <div key={b.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-white">{b.patient_name} (+880 {b.patient_phone})</div>
                    <div className="text-[10px] text-slate-400">Pickup: {b.pickup_date}</div>
                  </div>
                  <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded text-[10px] font-bold">
                    {b.status || 'Confirmed'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
