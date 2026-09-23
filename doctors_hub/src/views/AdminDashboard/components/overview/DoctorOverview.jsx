import React from 'react';
import { 
  Stethoscope, Building2, Calendar, Clock, MapPin, 
  Phone, User, Edit, CheckCircle, Plus, ArrowUpRight, 
  Sparkles, ShieldCheck, Activity, Award 
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
      <div className="bg-white border border-[#d1d5dc] rounded-sm p-5 md:p-6 shadow-card">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-xs bg-[#e7ebff] border border-[#094cb2]/20 text-[#094cb2] text-[10px] font-label font-bold uppercase tracking-wider">
                <Stethoscope className="w-3 h-3" />
                <span>Doctor Consultation Console</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xs bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-label font-bold">
                <CheckCircle className="w-3 h-3" />
                <span>Verified Specialist</span>
              </span>
            </div>

            <div>
              {/* Designation */}
              {doctor?.academic_title && (
                <p className="text-xs font-label font-semibold text-[#094cb2] flex items-center gap-1.5 mb-1">
                  <Award className="w-3.5 h-3.5 text-[#094cb2] shrink-0" />
                  <span>{doctor.academic_title}</span>
                </p>
              )}
              {/* Institute Name */}
              {doctor?.institution && (
                <p className="text-xs font-body text-slate-500 flex items-center gap-1.5 mb-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{doctor.institution}</span>
                </p>
              )}
              {/* Doctor Name */}
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#1b1c1d] flex items-center gap-2">
                <span>{docName}</span>
              </h2>
              <p className="text-sm text-slate-700 font-label font-medium mt-1">
                {docQual}
              </p>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5 font-body">
                <Activity className="w-3.5 h-3.5 text-[#094cb2]" />
                <span>Specialties: {docSpecs} • {docExp}</span>
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap lg:flex-col gap-2 shrink-0">
            <button
              onClick={() => setActiveTab('doctors')}
              className="px-3.5 py-2 bg-[#094cb2] hover:bg-[#083e91] text-white font-label text-xs font-semibold rounded-sm flex items-center gap-2 shadow-sm transition cursor-pointer"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Edit My Profile & Specialties</span>
            </button>
            <button
              onClick={() => setActiveTab('doc-affiliations')}
              className="px-3.5 py-2 border border-[#d1d5dc] bg-white hover:bg-[#f7f6f7] text-slate-700 font-label text-xs font-semibold rounded-sm flex items-center gap-2 shadow-sm transition cursor-pointer"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Manage Chambers & Fees</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Doctor Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        {/* Specializations */}
        <div 
          onClick={() => setActiveTab('doctors')} 
          className="bg-white border border-[#d1d5dc] p-4 rounded-sm shadow-card cursor-pointer hover:border-[#094cb2] transition-colors group"
        >
          <div className="flex items-center justify-between text-teal-700 mb-1.5">
            <Stethoscope className="w-4 h-4 group-hover:scale-105 transition-transform" />
            <span className="text-[10px] font-label font-bold bg-teal-50 text-teal-800 px-1.5 py-0.5 rounded-xs border border-teal-200">Profile</span>
          </div>
          <div className="text-2xl font-serif font-bold text-[#1b1c1d]">{doctor?.specialties?.length || 2}</div>
          <div className="text-[11px] text-slate-500 font-label mt-0.5">Medical Specializations</div>
        </div>

        {/* Practice Locations */}
        <div 
          onClick={() => setActiveTab('doc-affiliations')} 
          className="bg-white border border-[#d1d5dc] p-4 rounded-sm shadow-card cursor-pointer hover:border-[#094cb2] transition-colors group"
        >
          <div className="flex items-center justify-between text-emerald-700 mb-1.5">
            <Building2 className="w-4 h-4 group-hover:scale-105 transition-transform" />
            <span className="text-[10px] font-label font-bold bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded-xs border border-emerald-200">Locations</span>
          </div>
          <div className="text-2xl font-serif font-bold text-[#1b1c1d]">{affiliations.length || 2}</div>
          <div className="text-[11px] text-slate-500 font-label mt-0.5">Chambers & Hospitals</div>
        </div>

        {/* Schedule Slots */}
        <div 
          onClick={() => setActiveTab('doc-schedules')} 
          className="bg-white border border-[#d1d5dc] p-4 rounded-sm shadow-card cursor-pointer hover:border-[#094cb2] transition-colors group"
        >
          <div className="flex items-center justify-between text-cyan-700 mb-1.5">
            <Clock className="w-4 h-4 group-hover:scale-105 transition-transform" />
            <span className="text-[10px] font-label font-bold bg-cyan-50 text-cyan-800 px-1.5 py-0.5 rounded-xs border border-cyan-200">Visiting</span>
          </div>
          <div className="text-2xl font-serif font-bold text-[#1b1c1d]">{totalScheduleSlots || 4}</div>
          <div className="text-[11px] text-slate-500 font-label mt-0.5">Weekly Visiting Slots</div>
        </div>

        {/* Patient Appointments */}
        <div 
          onClick={() => setActiveTab('doc-bookings')} 
          className="bg-white border border-[#d1d5dc] p-4 rounded-sm shadow-card cursor-pointer hover:border-[#094cb2] transition-colors group"
        >
          <div className="flex items-center justify-between text-amber-700 mb-1.5">
            <Calendar className="w-4 h-4 group-hover:scale-105 transition-transform" />
            <span className="text-[10px] font-label font-bold bg-amber-50 text-amber-800 px-1.5 py-0.5 rounded-xs border border-amber-200">Serials</span>
          </div>
          <div className="text-2xl font-serif font-bold text-[#1b1c1d]">{doctorBookings.length}</div>
          <div className="text-[11px] text-slate-500 font-label mt-0.5">Patient Appointments</div>
        </div>

      </div>

      {/* Doctor Practice Locations & Upcoming Appointments Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* Practice Locations Card */}
        <div className="bg-white border border-[#d1d5dc] rounded-sm p-4 md:p-5 shadow-card">
          <div className="flex items-center justify-between mb-3 border-b border-[#d1d5dc] pb-2.5">
            <h3 className="font-serif font-bold text-sm text-[#1b1c1d] flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-700" />
              <span>Consultation Chambers & Visiting Hours</span>
            </h3>
            <button 
              onClick={() => setActiveTab('doc-affiliations')}
              className="text-xs text-[#094cb2] hover:underline font-label font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>Manage Chambers</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
          
          <div className="space-y-2.5">
            {affiliations.map((aff, idx) => (
              <div key={aff.id || idx} className="p-3 rounded-xs bg-[#faf9fa] border border-[#e3e5ea] text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="font-serif font-bold text-[#1b1c1d] text-sm">
                    {aff.hospital?.name || aff.diagnostic_center?.name || aff.chamber_name || aff.facility_name || 'Medical Chamber'}
                  </div>
                  <div className="text-[#094cb2] font-serif font-bold text-sm">৳{aff.fee || 1500}</div>
                </div>
                <div className="text-slate-500 font-body flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{aff.location?.area || 'Dhaka'}</span>
                </div>
                {Array.isArray(aff.schedules) && aff.schedules.length > 0 && (
                  <div className="pt-2 border-t border-[#e3e5ea] flex flex-wrap gap-1">
                    {aff.schedules.map((sch, sIdx) => (
                      <span key={sch.id || sIdx} className="px-2 py-0.5 rounded-xs bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-label font-medium">
                        {sch.day_of_week}: {sch.start_time} - {sch.end_time}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {affiliations.length === 0 && (
              <div className="text-center py-6 text-slate-400 text-xs font-body">No chambers or consultation locations linked yet.</div>
            )}
          </div>
        </div>

        {/* Upcoming Appointments Card */}
        <div className="bg-white border border-[#d1d5dc] rounded-sm p-4 md:p-5 shadow-card">
          <div className="flex items-center justify-between mb-3 border-b border-[#d1d5dc] pb-2.5">
            <h3 className="font-serif font-bold text-sm text-[#1b1c1d] flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-700" />
              <span>Upcoming Patient Appointments</span>
            </h3>
            <button 
              onClick={() => setActiveTab('doc-bookings')}
              className="text-xs text-[#094cb2] hover:underline font-label font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>View All Serials</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2">
            {(doctorBookings || []).slice(0, 4).map((b, idx) => (
              <div key={b.id || idx} className="flex items-center justify-between p-2.5 rounded-xs bg-[#faf9fa] border border-[#e3e5ea] text-xs">
                <div>
                  <div className="text-slate-800 font-medium font-body">{b.patient_name || 'Registered Patient'}</div>
                  <div className="text-slate-500 font-label text-[11px]">
                    Date: {b.appointment_date || b.date} • Slot: {b.appointment_time || b.slot}
                  </div>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-0.5 rounded-xs text-[10px] font-label font-bold border ${
                    b.status === 'confirmed' 
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                      : 'bg-amber-50 text-amber-800 border-amber-200'
                  }`}>
                    {b.status || 'Confirmed'}
                  </span>
                </div>
              </div>
            ))}

            {(!doctorBookings || doctorBookings.length === 0) && (
              <div className="text-center py-6 text-slate-400 text-xs font-body">
                No upcoming appointments scheduled yet.
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
