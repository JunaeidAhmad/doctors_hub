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
    <div className="min-h-screen bg-[#faf9fa] text-[#1b1c1d] pb-20 font-body selection:bg-[#e7ebff] selection:text-[#094cb2]">
      
      {/* Top Sticky Institutional Masthead Header (Alexandria Style) */}
      <header className="w-full bg-white border-b border-[#d1d5dc] py-2.5 px-3 sm:px-6 sticky top-0 z-40 shadow-subtle">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-3 sm:gap-4">
          
          {/* Left Cluster: DoctorsHub Seal & Registry Authority Indicators */}
          <div className="flex items-center gap-3 sm:gap-5 min-w-0">
            {/* Mobile menu toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(prev => !prev)}
              aria-label="Toggle navigation drawer"
              className="md:hidden p-2 rounded-sm bg-[#f7f6f7] hover:bg-[#f0eeef] text-slate-700 border border-[#d1d5dc] transition cursor-pointer shrink-0"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Brand & Seal */}
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => onNavigate('home')}>
              <div className="w-9 h-9 rounded-sm bg-[#094cb2] flex items-center justify-center text-white shadow-sm ring-1 ring-[#094cb2]/20 shrink-0 group-hover:bg-[#083e91] transition-all">
                <RoleIcon className="w-5 h-5" />
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-headline font-serif text-base sm:text-lg font-bold text-slate-900 tracking-tight truncate">
                    DoctorsHub
                  </span>
                  <span className="text-[10px] font-label font-semibold px-2 py-0.5 rounded-full bg-[#e7ebff] text-[#094cb2] uppercase tracking-wider shrink-0 border border-[#094cb2]/20">
                    {roleTitle}
                  </span>
                </div>
                <span className="text-[10px] font-label tracking-wide text-slate-500 truncate hidden xs:block">
                  {headerFacilityName || 'Bangladesh Medical Directorate • Central Registry'}
                </span>
              </div>
            </div>

            <div className="h-6 w-px bg-[#e3e5ea] hidden xl:block"></div>

            {/* System Status Indicators (Alexandria Telemetry) */}
            <nav className="hidden lg:flex items-center gap-4 text-[11px] font-label">
              <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                SYS.STATUS: <span className="text-emerald-700 font-semibold">OPTIMAL</span>
              </span>
              <span className="text-slate-500 hover:text-slate-800 font-medium transition-colors flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 text-[#094cb2]" />
                BMDC Sync: Active
              </span>
            </nav>
          </div>

          {/* Right Cluster: Action & Session Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Refresh */}
            <button
              onClick={loadAllData}
              title="Refresh Data"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm border border-[#d1d5dc] bg-white hover:bg-[#f7f6f7] text-slate-700 font-label font-medium text-xs shadow-subtle transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            {/* Exit to Public Portal */}
            <button
              onClick={() => onNavigate('home')}
              title="Exit to Public Portal"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm border border-[#d1d5dc] bg-white hover:bg-[#f7f6f7] text-slate-700 font-label font-medium text-xs shadow-subtle transition-all cursor-pointer"
            >
              <Home className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Public Site</span>
            </button>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              title="Log out of admin session"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-800 font-label font-medium text-xs shadow-subtle transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-700" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>

            {/* Chief Officer / Admin Avatar */}
            {userPhone && (
              <div className="hidden md:flex items-center gap-2 pl-2 border-l border-[#e3e5ea]">
                <div className="w-7 h-7 rounded-sm bg-[#e7ebff] border border-[#094cb2]/20 flex items-center justify-center text-[#094cb2] font-mono text-[10px] font-bold">
                  {userPhone.slice(-2)}
                </div>
                <div className="hidden xl:flex flex-col text-left leading-none">
                  <span className="text-[11px] font-semibold text-slate-900 font-label">{roleTitle}</span>
                  <span className="text-[10px] text-slate-500 font-mono mt-0.5">{userPhone}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer (Alexandria White Surface) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity" 
            onClick={() => setMobileMenuOpen(false)}
          />
          
          {/* Drawer Content */}
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white border-r border-[#d1d5dc] shadow-elevated z-10 animate-in slide-in-from-left duration-200">
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-4 border-b border-[#e3e5ea] bg-[#f7f6f7]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-sm bg-[#094cb2] text-white flex items-center justify-center font-bold">
                  <RoleIcon className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-headline font-serif font-bold text-xs text-slate-900 block">{roleTitle}</span>
                  <span className="text-[10px] text-slate-500 block font-mono">{userPhone}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 text-slate-500 hover:text-slate-900 rounded hover:bg-slate-200 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto admin-scrollbar p-2">
              <AdminSidebar onTabSelect={() => setMobileMenuOpen(false)} isMobile={true} />
            </div>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="max-w-[1600px] mx-auto flex gap-6 px-3 sm:px-6 pt-4 sm:pt-6">

        {/* SIDEBAR (Desktop Alexandria Master Directory) */}
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
