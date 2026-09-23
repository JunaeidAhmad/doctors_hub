import React from 'react';
import { 
  Building2, FlaskConical, Stethoscope, TestTube, 
  Calendar, CheckCircle, Clock, MapPin, Phone, Mail, 
  ArrowUpRight, Plus, Edit, Sparkles, AlertCircle, ShieldCheck
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
      <div className="bg-white border border-[#d1d5dc] rounded-sm p-5 md:p-6 shadow-card">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-xs bg-[#e7ebff] border border-[#094cb2]/20 text-[#094cb2] text-[10px] font-label font-bold uppercase tracking-wider">
                {isHospital ? <Building2 className="w-3 h-3" /> : <FlaskConical className="w-3 h-3" />}
                <span>{isHospital ? 'Hospital Authority Console' : 'Diagnostic Center Console'}</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xs bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-label font-bold">
                <CheckCircle className="w-3 h-3" />
                <span>{badge}</span>
              </span>
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#1b1c1d] flex flex-wrap items-center gap-2">
                <span>{facilityName}</span>
                {branchName && <span className="text-[#094cb2] text-lg sm:text-xl font-normal font-sans">({branchName})</span>}
              </h2>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5 font-body">
                <MapPin className="w-3.5 h-3.5 text-[#094cb2] shrink-0" />
                <span>{address}</span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 font-label pt-1 border-t border-[#e3e5ea]">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{timing}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>{phone}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>{email}</span>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap lg:flex-col gap-2 shrink-0">
            <button
              onClick={() => setActiveTab(isHospital ? 'hospitals' : 'diagnostics')}
              className="px-3.5 py-2 bg-[#094cb2] hover:bg-[#083e91] text-white font-label text-xs font-semibold rounded-sm flex items-center gap-2 shadow-sm transition cursor-pointer"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Edit Facility Profile</span>
            </button>
            <button
              onClick={() => setActiveTab('doctors')}
              className="px-3.5 py-2 border border-[#d1d5dc] bg-white hover:bg-[#f7f6f7] text-slate-700 font-label text-xs font-semibold rounded-sm flex items-center gap-2 shadow-sm transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Affiliated Doctors</span>
            </button>
            <button
              onClick={() => setActiveTab('branch-tests')}
              className="px-3.5 py-2 border border-[#d1d5dc] bg-white hover:bg-[#f7f6f7] text-slate-700 font-label text-xs font-semibold rounded-sm flex items-center gap-2 shadow-sm transition cursor-pointer"
            >
              <TestTube className="w-3.5 h-3.5" />
              <span>Manage Test Prices</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Tailored Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        {/* Diagnostic Tests & Pricing */}
        <div 
          onClick={() => setActiveTab('branch-tests')} 
          className="bg-white border border-[#d1d5dc] p-4 rounded-sm shadow-card cursor-pointer hover:border-[#094cb2] transition-colors group"
        >
          <div className="flex items-center justify-between text-purple-700 mb-1.5">
            <TestTube className="w-4 h-4 group-hover:scale-105 transition-transform" />
            <span className="text-[10px] font-label font-bold bg-purple-50 text-purple-800 px-1.5 py-0.5 rounded-xs border border-purple-200">Catalog</span>
          </div>
          <div className="text-2xl font-serif font-bold text-[#1b1c1d]">{branchTests.length}</div>
          <div className="text-[11px] text-slate-500 font-label mt-0.5">Offered Tests & Prices</div>
        </div>

        {/* Affiliated Doctors */}
        <div 
          onClick={() => setActiveTab('doctors')} 
          className="bg-white border border-[#d1d5dc] p-4 rounded-sm shadow-card cursor-pointer hover:border-[#094cb2] transition-colors group"
        >
          <div className="flex items-center justify-between text-teal-700 mb-1.5">
            <Stethoscope className="w-4 h-4 group-hover:scale-105 transition-transform" />
            <span className="text-[10px] font-label font-bold bg-teal-50 text-teal-800 px-1.5 py-0.5 rounded-xs border border-teal-200">Doctors</span>
          </div>
          <div className="text-2xl font-serif font-bold text-[#1b1c1d]">{doctors.length}</div>
          <div className="text-[11px] text-slate-500 font-label mt-0.5">Affiliated Specialists</div>
        </div>

        {/* Doctor Appointments */}
        <div 
          onClick={() => setActiveTab('doc-bookings')} 
          className="bg-white border border-[#d1d5dc] p-4 rounded-sm shadow-card cursor-pointer hover:border-[#094cb2] transition-colors group"
        >
          <div className="flex items-center justify-between text-amber-700 mb-1.5">
            <Calendar className="w-4 h-4 group-hover:scale-105 transition-transform" />
            <span className="text-[10px] font-label font-bold bg-amber-50 text-amber-800 px-1.5 py-0.5 rounded-xs border border-amber-200">Serials</span>
          </div>
          <div className="text-2xl font-serif font-bold text-[#1b1c1d]">{doctorBookings.length}</div>
          <div className="text-[11px] text-slate-500 font-label mt-0.5">Patient Serials</div>
        </div>

        {/* Lab Bookings */}
        <div 
          onClick={() => setActiveTab('lab-bookings')} 
          className="bg-white border border-[#d1d5dc] p-4 rounded-sm shadow-card cursor-pointer hover:border-[#094cb2] transition-colors group"
        >
          <div className="flex items-center justify-between text-rose-700 mb-1.5">
            <Calendar className="w-4 h-4 group-hover:scale-105 transition-transform" />
            <span className="text-[10px] font-label font-bold bg-rose-50 text-rose-800 px-1.5 py-0.5 rounded-xs border border-rose-200">Orders</span>
          </div>
          <div className="text-2xl font-serif font-bold text-[#1b1c1d]">{labBookings.length}</div>
          <div className="text-[11px] text-slate-500 font-label mt-0.5">Lab Test Orders</div>
        </div>

      </div>

      {/* Quick Action Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* Test Pricing Shortcuts */}
        <div className="bg-white border border-[#d1d5dc] rounded-sm p-4 md:p-5 shadow-card">
          <div className="flex items-center justify-between mb-3 border-b border-[#d1d5dc] pb-2.5">
            <h3 className="font-serif font-bold text-sm text-[#1b1c1d] flex items-center gap-2">
              <TestTube className="w-4 h-4 text-purple-700" />
              <span>Diagnostic Test Pricing & Discounts</span>
            </h3>
            <button 
              onClick={() => setActiveTab('add-tests-to-diagnostics')}
              className="text-xs text-[#094cb2] hover:underline font-label font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>Add More Tests</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-xs text-slate-500 mb-3 font-body">
            You are managing test prices, discount percentages, and sample collection availability for {facilityName}.
          </p>
          <div className="space-y-2">
            {(branchTests || []).slice(0, 4).map((bt, idx) => (
              <div key={bt.id || idx} className="flex items-center justify-between p-2.5 rounded-xs bg-[#faf9fa] border border-[#e3e5ea] text-xs">
                <div>
                  <div className="text-slate-800 font-medium font-body">{bt.test_name || bt.test?.name || 'Medical Test'}</div>
                  <div className="text-slate-500 font-label text-[11px]">{bt.category_name || bt.test?.category?.name || 'General Investigation'}</div>
                </div>
                <div className="text-right">
                  <div className="text-[#094cb2] font-serif font-bold">৳{bt.discounted_price || bt.price}</div>
                  {bt.discount && <div className="text-rose-700 font-label text-[10px] font-semibold">{bt.discount} OFF</div>}
                </div>
              </div>
            ))}
            {(!branchTests || branchTests.length === 0) && (
              <div className="text-center py-6 text-slate-400 text-xs font-body">No tests added yet for this facility.</div>
            )}
          </div>
        </div>

        {/* Doctor Affiliations Shortcut */}
        <div className="bg-white border border-[#d1d5dc] rounded-sm p-4 md:p-5 shadow-card">
          <div className="flex items-center justify-between mb-3 border-b border-[#d1d5dc] pb-2.5">
            <h3 className="font-serif font-bold text-sm text-[#1b1c1d] flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-teal-700" />
              <span>Practicing Doctors & Visiting Fees</span>
            </h3>
            <button 
              onClick={() => setActiveTab('doctors')}
              className="text-xs text-[#094cb2] hover:underline font-label font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>View All Doctors</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-xs text-slate-500 mb-3 font-body">
            Specialist doctors with chambers and OPD consultation slots at {facilityName}.
          </p>
          <div className="space-y-2">
            {(doctors || []).slice(0, 4).map((doc, idx) => (
              <div key={doc.id || idx} className="flex items-center justify-between p-2.5 rounded-xs bg-[#faf9fa] border border-[#e3e5ea] text-xs">
                <div>
                  <div className="text-slate-800 font-medium font-body">{doc.name}</div>
                  <div className="text-slate-500 font-label text-[11px]">{doc.qualification}</div>
                </div>
                <div className="text-right">
                  <span className="px-2 py-0.5 rounded-xs bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-label font-bold">
                    Active Chamber
                  </span>
                </div>
              </div>
            ))}
            {(!doctors || doctors.length === 0) && (
              <div className="text-center py-6 text-slate-400 text-xs font-body">No doctors affiliated yet with this facility.</div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
