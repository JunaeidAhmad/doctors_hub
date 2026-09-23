import React, { useRef } from 'react';
import { 
  Users, Building2, FlaskConical, Stethoscope, Activity, TestTube, 
  Calculator, Calendar, ChevronLeft, ChevronRight, Layers, Clock, ShieldCheck, Crown 
} from 'lucide-react';
import { useAdminContext } from '../context/AdminContext';

export default function AdminNavStrip() {
  const { 
    activeTab, 
    setActiveTab, 
    setSearchTerm, 
    counts, 
    isSuperAdmin, 
    isFacilityAdmin, 
    isDoctor,
    hospitals,
    diagnosticCenters
  } = useAdminContext();
  const navSliderRef = useRef(null);

  const isHospitalAdmin = isFacilityAdmin && (hospitals && hospitals.length > 0);
  const isDiagnosticAdmin = isFacilityAdmin && !isHospitalAdmin;

  let visibleTabs = [];

  if (isDoctor) {
    visibleTabs = [
      { id: 'overview', label: 'Overview', icon: Users },
      { id: 'doctors', label: 'My Doctor Profile', icon: Stethoscope },
      { id: 'doc-affiliations', label: 'Chambers & Fees', icon: Building2 },
      { id: 'doc-schedules', label: 'Visiting Schedules', icon: Clock },
      { id: 'doc-bookings', label: `Patient Appointments (${counts.docBookings || 0})`, icon: Calendar },
    ];
  } else if (isFacilityAdmin) {
    visibleTabs = [
      { id: 'overview', label: 'Overview', icon: Users },
      ...(isHospitalAdmin ? [
        { id: 'hospitals', label: 'My Hospital Profile', icon: Building2 }
      ] : [
        { id: 'diagnostics', label: 'My Diagnostic Branch', icon: FlaskConical }
      ]),
      { id: 'branch-tests', label: `Offered Test Prices (${counts.branchTests || 0})`, icon: Calculator },
      { id: 'add-tests-to-diagnostics', label: 'Add Tests to Facility', icon: Layers },
      { id: 'doctors', label: `Affiliated Doctors (${counts.doctors || 0})`, icon: Stethoscope },
      { id: 'doc-bookings', label: `Doctor Serials (${counts.docBookings || 0})`, icon: Calendar },
      { id: 'lab-bookings', label: `Lab Bookings (${counts.labBookings || 0})`, icon: Calendar },
      { id: 'staff', label: 'Team & Staff', icon: Users },
    ];
  } else {
    // Super Admin (Full List)
    visibleTabs = [
      { id: 'overview', label: 'Overview', icon: Users },
      { id: 'verification-queue', label: 'Verification Queue', icon: ShieldCheck },
      { id: 'platform-admins', label: 'Users & Roles', icon: Crown },
      { id: 'hospitals', label: `Hospitals (${counts.hospitals || 0})`, icon: Building2 },
      { id: 'hospital-specs', label: `Hospital Categories (${counts.hospitalSpecs || 0})`, icon: Building2 },
      { id: 'hosp-services', label: `Hospital Services (${counts.hospServices || 0})`, icon: Activity },
      { id: 'doctors', label: `Specialist Doctors (${counts.doctors || 0})`, icon: Stethoscope },
      { id: 'doctor-specs', label: `Doctor Specialties (${counts.doctorSpecs || 0})`, icon: Stethoscope },
      { id: 'doc-bookings', label: `Doctor Bookings (${counts.docBookings || 0})`, icon: Calendar },
      { id: 'diagnostics', label: `Diagnostics & Branches (${counts.diagnostics || 0})`, icon: FlaskConical },
      { id: 'diag-cats', label: `Diagnostics Categories (${counts.diagCats || 0})`, icon: FlaskConical },
      { id: 'diag-services', label: `Diagnostic Services (${counts.diagServices || 0})`, icon: FlaskConical },
      { id: 'tests', label: `Add Test (${counts.tests || 0})`, icon: TestTube },
      { id: 'test-cats', label: `Test Categories (${counts.testCats || 0})`, icon: TestTube },
      { id: 'add-tests-to-diagnostics', label: 'Add Tests to Diagnostics', icon: Layers },
      { id: 'branch-tests', label: `Diagnostic Test Prices (${counts.branchTests || 0})`, icon: Calculator },
      { id: 'lab-bookings', label: `Lab Bookings (${counts.labBookings || 0})`, icon: Calendar },
      { id: 'staff', label: 'Facility Staff', icon: Users },
    ];
  }


  return (
    <div className="relative bg-white border border-[#d1d5dc] rounded-sm p-1.5 shadow-subtle flex items-center gap-1.5 font-label">
      <button
        onClick={() => navSliderRef.current?.scrollBy({ left: -220, behavior: 'smooth' })}
        className="p-1.5 bg-[#f7f6f7] hover:bg-[#f0eeef] text-slate-600 rounded-sm hidden sm:flex shrink-0 border border-[#d1d5dc] cursor-pointer"
        aria-label="Scroll left"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      <div ref={navSliderRef} className="admin-scrollbar flex items-center gap-1.5 overflow-x-auto scroll-smooth py-0.5 px-0.5 text-xs w-full">
        {visibleTabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); if (setSearchTerm) setSearchTerm(''); }}
              className={`px-3 py-1.5 font-semibold rounded-sm border flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer text-xs ${
                isActive 
                  ? 'border-[#094cb2]/30 text-[#094cb2] bg-[#e7ebff] shadow-subtle' 
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-[#f7f6f7]'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#094cb2]' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <button
        onClick={() => navSliderRef.current?.scrollBy({ left: 220, behavior: 'smooth' })}
        className="p-1.5 bg-[#f7f6f7] hover:bg-[#f0eeef] text-slate-600 rounded-sm hidden sm:flex shrink-0 border border-[#d1d5dc] cursor-pointer"
        aria-label="Scroll right"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
