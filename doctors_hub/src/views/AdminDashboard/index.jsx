import React from 'react';
import { 
  ShieldAlert, RefreshCw, CheckCircle, AlertCircle, LogOut, 
  User, Stethoscope, Building2, FlaskConical, Crown, Home 
} from 'lucide-react';
import { AdminProvider, useAdminContext } from './context/AdminContext';

import AdminLoginForm from './components/AdminLoginForm';
import AdminNavStrip from './components/AdminNavStrip';
import OverviewTab from './components/OverviewTab';
import HospitalsTab from './components/HospitalsTab';
import DiagnosticsTab from './components/DiagnosticsTab';
import DoctorsTab from './components/DoctorsTab';
import TestsTab from './components/TestsTab';
import BranchTestsTab from './components/BranchTestsTab';
import CategoriesTab from './components/CategoriesTab';
import BookingsTab from './components/BookingsTab';
import AddTestsToDiagnosticsTab from './components/AddTestsToDiagnosticsTab';
import DoctorAffiliationsManager from './components/doctor/DoctorAffiliationsManager';
import DoctorScheduleManager from './components/doctor/DoctorScheduleManager';
import StaffTab from './components/StaffTab';
import VerificationQueueTab from './components/VerificationQueueTab';
import PlatformAdminsTab from './components/PlatformAdminsTab';

function AdminDashboardContent({ onNavigate, onAdminLoggedIn }) {

  const {
    isStaff,
    isSuperAdmin,
    isFacilityAdmin,
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

  if (isDoctor) {
    const docName = (doctors && doctors[0]?.name) || storedUser?.first_name || 'Specialist Doctor';
    roleTitle = `Doctor: ${docName}`;
    RoleIcon = Stethoscope;
    roleColor = 'text-teal-300 bg-teal-500/10 border-teal-500/30';
  } else if (isFacilityAdmin) {
    const facName = (hospitals && hospitals[0]?.name) || (diagnosticCenters && diagnosticCenters[0]?.name) || 'Managed Facility';
    roleTitle = `Facility: ${facName}`;
    RoleIcon = hospitals && hospitals.length > 0 ? Building2 : FlaskConical;
    roleColor = 'text-cyan-300 bg-cyan-500/10 border-cyan-500/30';
  } else if (isSuperAdmin) {
    roleTitle = 'Platform Super Admin';
    RoleIcon = Crown;
    roleColor = 'text-amber-300 bg-amber-500/10 border-amber-500/30';
  }

  const userPhone = storedUser?.phone_number || storedUser?.phone || '';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      
      {/* Top Sticky Header */}
      <header className="bg-slate-900/95 backdrop-blur-md border-b border-slate-800 py-3.5 px-4 sm:px-6 sticky top-0 z-30 shadow-lg">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          
          {/* Brand & Context Title */}
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-white text-base sm:text-lg leading-tight">
                  DoctorsHub Admin Console
                </h1>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[11px] font-bold ${roleColor}`}>
                  <RoleIcon className="w-3 h-3" />
                  <span>{roleTitle}</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Logged in as <span className="font-mono text-slate-300 font-semibold">{userPhone}</span>
              </p>
            </div>
          </div>

          {/* Action & Session Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            
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
              className="px-3 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-700/60 transition cursor-pointer"
            >
              <Home className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Public Site</span>
            </button>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              title="Log out of admin session"
              className="px-3.5 py-2 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 hover:text-rose-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400" />
              <span>Log Out</span>
            </button>

          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-6">

        {/* Notifications */}
        {successMsg && (
          <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 p-4 rounded-2xl text-xs font-bold flex items-center gap-2 animate-fadeIn">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {error && (
          <div className="bg-rose-500/20 border border-rose-500/40 text-rose-300 p-4 rounded-2xl text-xs font-bold flex items-center gap-2 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* TOP NAVIGATION MENU TABS */}
        <AdminNavStrip />

        {/* ACTIVE TAB VIEWS */}
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'verification-queue' && <VerificationQueueTab />}
        {activeTab === 'platform-admins' && <PlatformAdminsTab />}
        {activeTab === 'staff' && <StaffTab />}
        {activeTab === 'hospitals' && <HospitalsTab />}
        {activeTab === 'diagnostics' && <DiagnosticsTab />}
        {activeTab === 'add-tests-to-diagnostics' && <AddTestsToDiagnosticsTab />}
        {activeTab === 'doctors' && <DoctorsTab />}
        {activeTab === 'doc-affiliations' && <DoctorAffiliationsManager />}
        {activeTab === 'doc-schedules' && <DoctorScheduleManager />}
        {activeTab === 'tests' && <TestsTab />}
        {activeTab === 'branch-tests' && <BranchTestsTab />}
        {['doctor-specs', 'hospital-specs', 'diag-cats', 'hosp-services', 'diag-services', 'test-cats'].includes(activeTab) && <CategoriesTab />}
        {['doc-bookings', 'lab-bookings'].includes(activeTab) && <BookingsTab />}


      </main>

    </div>
  );
}

export default function AdminDashboard({ currentUser, onNavigate, onAdminLoggedIn, onLogout }) {
  return (
    <AdminProvider currentUser={currentUser} onLogout={onLogout}>
      <AdminDashboardContent onNavigate={onNavigate} onAdminLoggedIn={onAdminLoggedIn} />
    </AdminProvider>
  );
}
