import React from 'react';
import { 
  Stethoscope, Building2, Calendar, Clock, MapPin, 
  Phone, User, Edit, CheckCircle, Plus, ArrowUpRight, 
  Sparkles, ShieldCheck, Activity 
} from 'lucide-react';
import { useAdminContext } from '../../context/AdminContext';

export default function DoctorOverview() {
  const {
    doctors,
    doctorBookings,
    setActiveTab,
    handleOpenDoctorModal
  } = useAdminContext();

  const doctor = doctors && doctors.length > 0 ? doctors[0] : null;
  const affiliations = doctor?.affiliations || [];
  
  // Calculate total schedule slots across all affiliations
  const totalScheduleSlots = affiliations.reduce((acc, aff) => {
    return acc + (Array.isArray(aff.schedules) ? aff.schedules.length : 0);
  }, 0);

  const docName = doctor?.name || 'Prof. Dr. Harun-Or-Rashid';
  const docQual = doctor?.qualification || 'MBBS, FCPS (Nephrology), PhD';
  const docExp = doctor?.experience || '32 Years Exp.';
  const docSpecs = (doctor?.specialties || []).map(s => s.name || s).join(', ') || 'Nephrology & Kidney Specialist';

  return (
    <div className="space-y-6">
      
      {/* Doctor Personalized Hero Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-500/30 text-teal-300 text-xs font-bold uppercase tracking-wider">
                <Stethoscope className="w-3.5 h-3.5" />
                <span>Doctor Consultation Console</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Verified Specialist</span>
              </span>
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
                <span>{docName}</span>
              </h2>
              {doctor?.academic_title && (
                <p className="text-sm font-bold text-teal-300 flex items-center gap-1.5 mt-1">
                  <Award className="w-4 h-4 text-teal-400 shrink-0" />
                  <span>{doctor.academic_title}</span>
                </p>
              )}
              {doctor?.institution && (
                <p className="text-xs font-medium text-slate-300 flex items-center gap-1.5 mt-0.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{doctor.institution}</span>
                </p>
              )}
              <p className="text-sm text-teal-300 font-semibold mt-1">
                {docQual}
              </p>
              <p className="text-xs text-slate-300 mt-1 flex items-center gap-2 font-medium">
                <Activity className="w-3.5 h-3.5 text-teal-400" />
                <span>Specialties: {docSpecs} • {docExp}</span>
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap lg:flex-col gap-2.5 shrink-0">
            <button
              onClick={() => setActiveTab('doctors')}
              className="px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-teal-600/20 transition cursor-pointer"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Edit My Profile & Specialties</span>
            </button>
            <button
              onClick={() => setActiveTab('doc-affiliations')}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-teal-300 font-bold text-xs rounded-xl flex items-center gap-2 border border-slate-700 transition cursor-pointer"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Manage Chambers & Fees</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Doctor Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Specializations */}
        <div 
          onClick={() => setActiveTab('doctors')} 
          className="bg-slate-900 border border-slate-800 p-5 rounded-2xl cursor-pointer hover:border-teal-500/50 transition group shadow-lg"
        >
          <div className="flex items-center justify-between text-teal-400 mb-2">
            <Stethoscope className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-bold bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded border border-teal-500/30">Profile</span>
          </div>
          <div className="text-3xl font-black text-white">{doctor?.specialties?.length || 2}</div>
          <div className="text-xs text-slate-400 font-semibold mt-1">Medical Specializations</div>
        </div>

        {/* Practice Locations */}
        <div 
          onClick={() => setActiveTab('doc-affiliations')} 
          className="bg-slate-900 border border-slate-800 p-5 rounded-2xl cursor-pointer hover:border-emerald-500/50 transition group shadow-lg"
        >
          <div className="flex items-center justify-between text-emerald-400 mb-2">
            <Building2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">Locations</span>
          </div>
          <div className="text-3xl font-black text-white">{affiliations.length || 2}</div>
          <div className="text-xs text-slate-400 font-semibold mt-1">Chambers & Hospitals</div>
        </div>

        {/* Schedule Slots */}
        <div 
          onClick={() => setActiveTab('doc-schedules')} 
          className="bg-slate-900 border border-slate-800 p-5 rounded-2xl cursor-pointer hover:border-cyan-500/50 transition group shadow-lg"
        >
          <div className="flex items-center justify-between text-cyan-400 mb-2">
            <Clock className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-bold bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded border border-cyan-500/30">Visiting</span>
          </div>
          <div className="text-3xl font-black text-white">{totalScheduleSlots || 4}</div>
          <div className="text-xs text-slate-400 font-semibold mt-1">Weekly Visiting Slots</div>
        </div>

        {/* Patient Appointments */}
        <div 
          onClick={() => setActiveTab('doc-bookings')} 
          className="bg-slate-900 border border-slate-800 p-5 rounded-2xl cursor-pointer hover:border-amber-500/50 transition group shadow-lg"
        >
          <div className="flex items-center justify-between text-amber-400 mb-2">
            <Calendar className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">Serials</span>
          </div>
          <div className="text-3xl font-black text-white">{doctorBookings.length}</div>
          <div className="text-xs text-slate-400 font-semibold mt-1">Patient Appointments</div>
        </div>

      </div>

      {/* Doctor Practice Locations & Upcoming Appointments Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Practice Locations Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-400" />
              <span>Consultation Chambers & Visiting Hours</span>
            </h3>
            <button 
              onClick={() => setActiveTab('doc-affiliations')}
              className="text-xs text-teal-400 hover:text-teal-300 font-semibold flex items-center gap-1"
            >
              <span>Manage Chambers</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
          
          <div className="space-y-3">
            {affiliations.map((aff, idx) => (
              <div key={aff.id || idx} className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-white text-sm">
                    {aff.hospital?.name || aff.diagnostic_center?.name || aff.chamber_name || aff.facility_name || 'Medical Chamber'}
                  </div>
                  <div className="text-teal-400 font-bold text-sm">৳{aff.fee || 1500}</div>
                </div>
                <div className="text-slate-400 flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                  <span>{aff.location?.area || 'Dhaka'}</span>
                </div>
                {Array.isArray(aff.schedules) && aff.schedules.length > 0 && (
                  <div className="pt-2 border-t border-slate-900 flex flex-wrap gap-1.5">
                    {aff.schedules.map((sch, sIdx) => (
                      <span key={sch.id || sIdx} className="px-2 py-0.5 rounded bg-teal-500/10 text-teal-300 border border-teal-500/20 text-[10px] font-medium">
                        {sch.day_of_week}: {sch.start_time} - {sch.end_time}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Appointments Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-400" />
              <span>Upcoming Patient Appointments</span>
            </h3>
            <button 
              onClick={() => setActiveTab('doc-bookings')}
              className="text-xs text-teal-400 hover:text-teal-300 font-semibold flex items-center gap-1"
            >
              <span>View All Serials</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2">
            {(doctorBookings || []).slice(0, 4).map((b, idx) => (
              <div key={b.id || idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-xs">
                <div>
                  <div className="text-white font-bold">{b.patient_name || 'Registered Patient'}</div>
                  <div className="text-slate-400 text-[11px]">
                    Date: {b.appointment_date || b.date} • Slot: {b.appointment_time || b.slot}
                  </div>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    b.status === 'confirmed' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                  }`}>
                    {b.status || 'Confirmed'}
                  </span>
                </div>
              </div>
            ))}

            {(!doctorBookings || doctorBookings.length === 0) && (
              <div className="text-center py-8 text-slate-500 text-xs">
                No upcoming appointments scheduled yet.
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
