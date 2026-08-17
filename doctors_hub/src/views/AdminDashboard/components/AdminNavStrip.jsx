import React, { useRef } from 'react';
import { 
  Users, Building2, FlaskConical, Stethoscope, Activity, TestTube, 
  Calculator, Calendar, ChevronLeft, ChevronRight, Layers, Clock, ShieldCheck 
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
    ];
  } else {
    // Super Admin (Full List)
    visibleTabs = [
      { id: 'overview', label: 'Overview', icon: Users },
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
    ];
  }

  return (
    <div className="relative bg-slate-900/90 border border-slate-800/80 rounded-2xl p-2 shadow-xl backdrop-blur-md flex items-center gap-2">
      <button
        onClick={() => navSliderRef.current?.scrollBy({ left: -220, behavior: 'smooth' })}
        className="p-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-xl hidden sm:flex shrink-0 border border-slate-700/50 cursor-pointer"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      <div ref={navSliderRef} className="admin-sliding-bar flex items-center gap-2 overflow-x-auto scroll-smooth py-1 px-1 text-xs w-full">
        {visibleTabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); if (setSearchTerm) setSearchTerm(''); }}
              className={`px-4 py-2.5 font-bold rounded-xl border flex items-center gap-2 transition-all whitespace-nowrap shadow-sm cursor-pointer ${
                isActive 
                  ? 'border-teal-400/60 text-teal-300 bg-gradient-to-r from-teal-950/60 to-slate-900 shadow-teal-500/10' 
                  : 'border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 hover:border-slate-700'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-teal-400' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <button
        onClick={() => navSliderRef.current?.scrollBy({ left: 220, behavior: 'smooth' })}
        className="p-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-xl hidden sm:flex shrink-0 border border-slate-700/50 cursor-pointer"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
