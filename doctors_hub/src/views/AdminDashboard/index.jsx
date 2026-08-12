import React from 'react';
import { ShieldAlert, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
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

function AdminDashboardContent({ onNavigate, onAdminLoggedIn }) {
  const {
    isStaff,
    activeTab,
    loading,
    error,
    successMsg,
    loadAllData
  } = useAdminContext();

  if (!isStaff) {
    return <AdminLoginForm onAdminLoggedIn={onAdminLoggedIn} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      
      {/* Top Header */}
      <header className="bg-slate-900 border-b border-slate-800 py-4 px-6 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-extrabold text-white text-lg">DoctorsHub Admin Management Console</h1>
              <p className="text-xs text-slate-400">Manage Hospitals, Diagnostics & Branches, Services, Doctors & Test Pricing</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadAllData}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-700"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <button
              onClick={() => onNavigate('home')}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-xs"
            >
              Exit
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 pt-8 space-y-6">

        {/* Notifications */}
        {successMsg && (
          <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 p-4 rounded-2xl text-xs font-bold flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {error && (
          <div className="bg-rose-500/20 border border-rose-500/40 text-rose-300 p-4 rounded-2xl text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* TOP NAVIGATION MENU TABS */}
        <AdminNavStrip />

        {/* ACTIVE TAB VIEWS */}
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'hospitals' && <HospitalsTab />}
        {activeTab === 'diagnostics' && <DiagnosticsTab />}
        {activeTab === 'add-tests-to-diagnostics' && <AddTestsToDiagnosticsTab />}
        {activeTab === 'doctors' && <DoctorsTab />}
        {activeTab === 'tests' && <TestsTab />}
        {activeTab === 'branch-tests' && <BranchTestsTab />}
        {['doctor-specs', 'hospital-specs', 'diag-cats', 'hosp-services', 'diag-services', 'test-cats'].includes(activeTab) && <CategoriesTab />}
        {['doc-bookings', 'lab-bookings'].includes(activeTab) && <BookingsTab />}

      </main>

    </div>
  );
}

export default function AdminDashboard({ currentUser, onNavigate, onAdminLoggedIn }) {
  return (
    <AdminProvider currentUser={currentUser}>
      <AdminDashboardContent onNavigate={onNavigate} onAdminLoggedIn={onAdminLoggedIn} />
    </AdminProvider>
  );
}
