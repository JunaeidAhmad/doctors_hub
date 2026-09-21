import React, { useState } from 'react';
import { 
  ShieldAlert, RefreshCw, CheckCircle, AlertCircle, LogOut, 
  User, Stethoscope, Building2, FlaskConical, Crown, Home, Menu, X 
} from 'lucide-react';
import { AdminProvider, useAdminContext } from './context/AdminContext';

import AdminLoginForm from './components/AdminLoginForm';
import AdminSidebar from './components/AdminSidebar';
import AdminNavStrip from './components/AdminNavStrip';
import OverviewTab from './components/OverviewTab';
import HospitalsTab from './components/HospitalsTab';
import DiagnosticsTab from './components/DiagnosticsTab';
import DoctorsTab from './components/DoctorsTab';
import TestsTab from './components/TestsTab';
import BranchTestsTab from './components/BranchTestsTab';
import CategoriesTab from './components/CategoriesTab';
import SpecialtiesTaxonomyTab from './components/SpecialtiesTaxonomyTab';
import BookingsTab from './components/BookingsTab';
import AddTestsToDiagnosticsTab from './components/AddTestsToDiagnosticsTab';
import DoctorAffiliationsManager from './components/doctor/DoctorAffiliationsManager';
import DoctorScheduleManager from './components/doctor/DoctorScheduleManager';
import StaffTab from './components/StaffTab';
import RolesTab from './components/RolesTab';
import VerificationQueueTab from './components/VerificationQueueTab';
import AssignRolesTab from './components/AssignRolesTab';
import FacilityProfile from './components/facility/FacilityProfile';

function AdminDashboardContent({ onNavigate, onAdminLoggedIn }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const {
    isStaff,
    isSuperAdmin,
    isFacilityAdmin,
    isHospitalAdmin,
    isDiagnosticAdmin,
    isDoctor,
    storedUser,
    activeUser,
    activeTab,
    loading,
    error,
    successMsg,
    loadAllData,
    handleLogout,
    hospitals,
    diagnosticCenters,
    doctors
  } = useAdminContext();

  if (!isStaff) {
    return <AdminLoginForm onAdminLoggedIn={onAdminLoggedIn} />;
  }

  // Determine user display role and entity badge
  let roleTitle = 'Platform Administrator';
  let RoleIcon = Crown;
  let roleColor = 'text-amber-400 bg-amber-500/10 border-amber-500/30';
  let headerFacilityName = '';

  if (isDoctor) {
    const docName = (doctors && doctors[0]?.name) || storedUser?.first_name || 'Specialist Doctor';
    roleTitle = 'Doctor';
    RoleIcon = Stethoscope;
    roleColor = 'text-teal-300 bg-teal-500/10 border-teal-500/30';
    headerFacilityName = `Dr. ${docName}`;
  } else if (isFacilityAdmin) {
    const managedLoc = storedUser?.managed_locations?.[0];
    const isHosp = isHospitalAdmin || managedLoc?.location_type === 'hospital' || (hospitals && hospitals.length > 0);
    const fac = isHosp ? hospitals?.[0] : diagnosticCenters?.[0];
    const facName = managedLoc?.name || fac?.name || (isHosp ? 'Hospital' : 'Diagnostic Center');
    const facBranch = managedLoc?.branch || fac?.branch;
    const branchLabel = facBranch ? ` (${facBranch})` : '';
    
    roleTitle = isHosp ? 'Hospital Admin' : 'Diagnostic Admin';
    headerFacilityName = `${facName}${branchLabel}`;
    RoleIcon = isHosp ? Building2 : FlaskConical;
    roleColor = isHosp 
      ? 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30' 
      : 'text-cyan-300 bg-cyan-500/10 border-cyan-500/30';
  } else if (isSuperAdmin) {
    roleTitle = 'Platform Super Admin';
    RoleIcon = Crown;
    roleColor = 'text-amber-300 bg-amber-500/10 border-amber-500/30';
  }

  const userPhone = storedUser?.phone_number || storedUser?.phone || '';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      
      {/* Top Sticky Header */}
      <header className="bg-slate-900/95 backdrop-blur-md border-b border-slate-800 py-3 px-3 sm:py-3.5 sm:px-6 sticky top-0 z-30 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Brand & Context Title */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Mobile menu toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(prev => !prev)}
              aria-label="Toggle navigation drawer"
              className="md:hidden p-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700/60 transition cursor-pointer shrink-0"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div className={`p-2 sm:p-2.5 rounded-xl sm:rounded-2xl ${isFacilityAdmin ? (hospitals?.length > 0 ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-cyan-500/10 border border-cyan-500/20 text-cyan-400') : 'bg-teal-500/10 border border-teal-500/20 text-teal-400'} shrink-0`}>
              <RoleIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <h1 className="font-extrabold text-white text-sm sm:text-lg leading-tight truncate">
                  {headerFacilityName ? (
                    <span>
                      {headerFacilityName} 
                    </span>
                  ) : (
                    'DoctorsHub Admin'
                  )}
                </h1>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] sm:text-[11px] font-bold ${roleColor}`}>
                  <RoleIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  <span>{roleTitle}</span>
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 truncate hidden sm:block">
                Logged in as <span className="font-mono text-slate-300 font-semibold">{userPhone}</span>
              </p>
            </div>
          </div>

          {/* Action & Session Controls */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            
            {/* Refresh */}
            <button
              onClick={loadAllData}
              title="Refresh Data"
              className="p-2 sm:px-3 sm:py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-700/60 transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            {/* Exit to Public Portal */}
            <button
              onClick={() => onNavigate('home')}
              title="Exit to Public Portal"
              className="p-2 sm:px-3 sm:py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-700/60 transition cursor-pointer"
            >
              <Home className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Public Site</span>
            </button>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              title="Log out of admin session"
              className="px-2.5 py-2 sm:px-3.5 sm:py-2 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 hover:text-rose-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden sm:inline">Log Out</span>
            </button>

          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity" 
            onClick={() => setMobileMenuOpen(false)}
          />
          
          {/* Drawer Content */}
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-slate-900 border-r border-slate-800 shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-xl ${isFacilityAdmin ? 'bg-emerald-500/10 text-emerald-400' : 'bg-teal-500/10 text-teal-400'}`}>
                  <RoleIcon className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-xs text-white block">{roleTitle}</span>
                  <span className="text-[10px] text-slate-400 block font-mono">{userPhone}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto">
              <AdminSidebar onTabSelect={() => setMobileMenuOpen(false)} isMobile={true} />
            </div>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="max-w-7xl mx-auto flex gap-6 px-3 sm:px-6 pt-4 sm:pt-6">

        {/* SIDEBAR (Desktop) */}
        <div className="hidden md:block">
          <AdminSidebar />
        </div>

        {/* ACTIVE TAB VIEWS */}
        <div className="flex-1 space-y-4 sm:space-y-6 min-w-0">

          {/* MOBILE QUICK NAV STRIP */}
          <div className="md:hidden">
            <AdminNavStrip />
          </div>

          {activeTab === 'overview' && <OverviewTab />}
          {activeTab === 'verification-queue' && <VerificationQueueTab />}
          {(activeTab === 'assign-roles' || activeTab === 'platform-admins') && <AssignRolesTab />}
          {activeTab === 'staff' && <StaffTab />}
          {activeTab === 'roles' && <RolesTab />}
          {activeTab === 'hospitals' && (isSuperAdmin ? <HospitalsTab /> : <FacilityProfile kind="hospital" />)}
          {activeTab === 'diagnostics' && (isSuperAdmin ? <DiagnosticsTab /> : <FacilityProfile kind="diagnostic" />)}
          {activeTab === 'add-tests-to-diagnostics' && <AddTestsToDiagnosticsTab />}
          {activeTab === 'doctors' && <DoctorsTab />}
          {activeTab === 'doc-affiliations' && <DoctorAffiliationsManager />}
          {activeTab === 'doc-schedules' && <DoctorScheduleManager />}
          {activeTab === 'tests' && <TestsTab />}
          {activeTab === 'branch-tests' && <BranchTestsTab />}
          {['doctor-specs', 'specialty-aliases'].includes(activeTab) && (
            <SpecialtiesTaxonomyTab initialTab={activeTab === 'specialty-aliases' ? 'aliases' : 'canonical'} />
          )}
          {['hospital-specs', 'diag-cats', 'hosp-services', 'diag-services', 'test-cats'].includes(activeTab) && <CategoriesTab />}
          {['doc-bookings', 'lab-bookings'].includes(activeTab) && <BookingsTab />}
        </div>

      </main>

    </div>
  );
}

export default function AdminDashboard({ currentUser, onNavigate, onAdminLoggedIn, onLogout, showToast }) {
  return (
    <AdminProvider currentUser={currentUser} onLogout={onLogout} showToast={showToast}>
      <AdminDashboardContent onNavigate={onNavigate} onAdminLoggedIn={onAdminLoggedIn} />
    </AdminProvider>
  );
}
