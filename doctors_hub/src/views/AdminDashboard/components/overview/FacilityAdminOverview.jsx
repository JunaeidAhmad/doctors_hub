import React from 'react';
import { 
  Building2, FlaskConical, Stethoscope, TestTube, 
  Calendar, CheckCircle, Clock, MapPin, Phone, Mail, 
  ArrowUpRight, Plus, Edit, Sparkles, AlertCircle
} from 'lucide-react';
import { useAdminContext } from '../../context/AdminContext';

export default function FacilityAdminOverview() {
  const {
    hospitals,
    diagnosticCenters,
    doctors,
    branchTests,
    doctorBookings,
    labBookings,
    setActiveTab,
    handleOpenHospitalModal,
    handleOpenDiagnosticModal
  } = useAdminContext();

  // Active managed facility
  const activeHospital = hospitals && hospitals.length > 0 ? hospitals[0] : null;
  const activeDiagnostic = diagnosticCenters && diagnosticCenters.length > 0 ? diagnosticCenters[0] : null;
  const isHospital = Boolean(activeHospital);
  const facility = activeHospital || activeDiagnostic;

  const loc = facility?.location_details || facility?.location || {};
  const facilityName = facility?.name || loc?.name || (isHospital ? 'Square Hospital' : 'Popular Diagnostic Centre');
  const branchName = facility?.branch || loc?.branch || (isHospital ? 'Panthapath Main' : 'Dhanmondi Branch');
  const address = loc?.address_line || loc?.area || 'Dhaka, Bangladesh';
  const phone = loc?.phone || '+880 1700-000000';
  const email = loc?.email || 'admin@facility.com';
  const timing = loc?.open_timing || '24/7 Open';
  const rating = loc?.rating || 4.8;
  const badge = loc?.badge || (isHospital ? 'Top Rated Hospital' : 'Verified Diagnostic');

  return (
    <div className="space-y-6">
      
      {/* Managed Facility Hero Card */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-500/30 text-teal-300 text-xs font-bold uppercase tracking-wider">
                {isHospital ? <Building2 className="w-3.5 h-3.5" /> : <FlaskConical className="w-3.5 h-3.5" />}
                <span>{isHospital ? 'Hospital Management' : 'Diagnostic Center Management'}</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>{badge}</span>
              </span>
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
                <span>{facilityName}</span>
                {branchName && <span className="text-teal-400 text-lg sm:text-xl font-semibold">({branchName})</span>}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 flex items-center gap-2 font-medium">
                <MapPin className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                <span>{address}</span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-teal-400" />
                <span>{timing}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-teal-400" />
                <span>{phone}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-teal-400" />
                <span>{email}</span>
              </div>
            </div>
          </div>

          {/* Quick Action Button */}
          <div className="flex flex-wrap lg:flex-col gap-2.5 shrink-0">
            <button
              onClick={() => {
                if (isHospital && activeHospital) handleOpenHospitalModal(activeHospital);
                else if (activeDiagnostic) handleOpenDiagnosticModal(activeDiagnostic);
              }}
              className="px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-teal-600/20 transition cursor-pointer"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Edit Facility Profile</span>
            </button>
            <button
              onClick={() => setActiveTab('branch-tests')}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-teal-300 font-bold text-xs rounded-xl flex items-center gap-2 border border-slate-700 transition cursor-pointer"
            >
              <TestTube className="w-3.5 h-3.5" />
              <span>Manage Test Prices</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Tailored Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Diagnostic Tests & Pricing */}
        <div 
          onClick={() => setActiveTab('branch-tests')} 
          className="bg-slate-900 border border-slate-800 p-5 rounded-2xl cursor-pointer hover:border-purple-500/50 transition group shadow-lg"
        >
          <div className="flex items-center justify-between text-purple-400 mb-2">
            <TestTube className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-bold bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded border border-purple-500/30">Catalog</span>
          </div>
          <div className="text-3xl font-black text-white">{branchTests.length}</div>
          <div className="text-xs text-slate-400 font-semibold mt-1">Offered Tests & Prices</div>
        </div>

        {/* Affiliated Doctors */}
        <div 
          onClick={() => setActiveTab('doctors')} 
          className="bg-slate-900 border border-slate-800 p-5 rounded-2xl cursor-pointer hover:border-teal-500/50 transition group shadow-lg"
        >
          <div className="flex items-center justify-between text-teal-400 mb-2">
            <Stethoscope className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-bold bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded border border-teal-500/30">Doctors</span>
          </div>
          <div className="text-3xl font-black text-white">{doctors.length}</div>
          <div className="text-xs text-slate-400 font-semibold mt-1">Affiliated Specialist Doctors</div>
        </div>

        {/* Doctor Appointments */}
        <div 
          onClick={() => setActiveTab('doc-bookings')} 
          className="bg-slate-900 border border-slate-800 p-5 rounded-2xl cursor-pointer hover:border-amber-500/50 transition group shadow-lg"
        >
          <div className="flex items-center justify-between text-amber-400 mb-2">
            <Calendar className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">Serials</span>
          </div>
          <div className="text-3xl font-black text-white">{doctorBookings.length}</div>
          <div className="text-xs text-slate-400 font-semibold mt-1">Doctor Patient Serials</div>
        </div>

        {/* Lab Bookings */}
        <div 
          onClick={() => setActiveTab('lab-bookings')} 
          className="bg-slate-900 border border-slate-800 p-5 rounded-2xl cursor-pointer hover:border-rose-500/50 transition group shadow-lg"
        >
          <div className="flex items-center justify-between text-rose-400 mb-2">
            <Calendar className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-bold bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded border border-rose-500/30">Pickups</span>
          </div>
          <div className="text-3xl font-black text-white">{labBookings.length}</div>
          <div className="text-xs text-slate-400 font-semibold mt-1">Lab Test Orders</div>
        </div>

      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Test Pricing Shortcuts */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <TestTube className="w-4 h-4 text-purple-400" />
              <span>Diagnostic Test Pricing & Discounts</span>
            </h3>
            <button 
              onClick={() => setActiveTab('add-tests-to-diagnostics')}
              className="text-xs text-teal-400 hover:text-teal-300 font-semibold flex items-center gap-1"
            >
              <span>Add More Tests</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            You are managing test prices, discount percentages, and home sample collection availability for {facilityName}.
          </p>
          <div className="space-y-2">
            {(branchTests || []).slice(0, 4).map((bt, idx) => (
              <div key={bt.id || idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-xs">
                <div>
                  <div className="text-white font-bold">{bt.test_name || bt.test?.name || 'Medical Test'}</div>
                  <div className="text-slate-400 text-[11px]">{bt.category_name || bt.test?.category?.name || 'General Investigation'}</div>
                </div>
                <div className="text-right">
                  <div className="text-teal-400 font-bold">৳{bt.discounted_price || bt.price}</div>
                  {bt.discount && <div className="text-rose-400 text-[10px]">{bt.discount} OFF</div>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Doctor Affiliations Shortcut */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-teal-400" />
              <span>Practicing Doctors & Visiting Fees</span>
            </h3>
            <button 
              onClick={() => setActiveTab('doctors')}
              className="text-xs text-teal-400 hover:text-teal-300 font-semibold flex items-center gap-1"
            >
              <span>View All Doctors</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            Specialist doctors with chambers and OPD consultation slots at {facilityName}.
          </p>
          <div className="space-y-2">
            {(doctors || []).slice(0, 4).map((doc, idx) => (
              <div key={doc.id || idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-xs">
                <div>
                  <div className="text-white font-bold">{doc.name}</div>
                  <div className="text-slate-400 text-[11px]">{doc.qualification}</div>
                </div>
                <div className="text-right">
                  <span className="px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 text-[10px] font-bold">
                    Active Chamber
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
