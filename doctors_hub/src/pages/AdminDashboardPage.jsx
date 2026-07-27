import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { 
  Users, Building2, TestTube, Calendar, Plus, Edit, Trash2, CheckCircle, 
  XCircle, Search, RefreshCw, AlertCircle, ShieldAlert, Sparkles 
} from 'lucide-react';

export default function AdminDashboardPage({ currentUser, onNavigate, onAdminLoggedIn }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Data states
  const [doctors, setDoctors] = useState([]);
  const [chambers, setChambers] = useState([]);
  const [tests, setTests] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [doctorBookings, setDoctorBookings] = useState([]);
  const [labBookings, setLabBookings] = useState([]);

  // Modals state
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [doctorForm, setDoctorForm] = useState({
    id: '', name: '', specialty: '', chamber: '', qualification: '', 
    experience: '', visit_days: '', visit_time: '', fee: '', slotsStr: '',
    consultation_type: 'OPD'
  });

  const [showChamberModal, setShowChamberModal] = useState(false);
  const [editingChamber, setEditingChamber] = useState(null);
  const [chamberForm, setChamberForm] = useState({
    id: '', name: '', location: '', city: 'Dhaka', verified: true, 
    rating: 4.8, reviews_count: 50, open_timing: '08:00 AM - 08:00 PM', 
    contact_phone: '', tagline: '', badge: 'Verified Partner', image: '',
    servicesStr: '', description: '',
    facility_types: ['Hospital', 'Diagnostic Center']
  });

  const [showTestModal, setShowTestModal] = useState(false);
  const [editingTest, setEditingTest] = useState(null);
  const [testForm, setTestForm] = useState({
    id: '', name: '', category: 'Routine Blood Profiles', price: '', 
    original_price: '', discount: '', fasting_required: false, 
    report_time: 'Same Day', description: ''
  });

  // Search filter inside tables
  const [searchTerm, setSearchTerm] = useState('');

  const isStaff = currentUser?.is_staff || false;

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    setError('');
    try {
      const [docsData, chambsData, testsData, specsData] = await Promise.all([
        api.getDoctors(),
        api.getChambers(),
        api.getTests(),
        api.getSpecialties()
      ]);
      setDoctors(docsData);
      setChambers(chambsData);
      setTests(testsData);
      setSpecialties(specsData);

      if (isStaff) {
        try {
          const [docBks, labBks] = await Promise.all([
            api.getDoctorBookings(),
            api.getLabBookings()
          ]);
          setDoctorBookings(docBks);
          setLabBookings(labBks);
        } catch (bErr) {
          console.warn("Could not load bookings:", bErr);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load system data');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  // --- DOCTOR CRUD ---
  const handleOpenDoctorModal = (doc = null) => {
    if (doc) {
      setEditingDoctor(doc);
      setDoctorForm({
        id: doc.id,
        name: doc.name,
        specialty: doc.specialty?.id || doc.specialty || '',
        chamber: doc.chamber?.id || doc.chamber || '',
        qualification: doc.qualification,
        experience: doc.experience,
        visit_days: doc.visit_days,
        visit_time: doc.visit_time,
        fee: doc.fee,
        slotsStr: Array.isArray(doc.slots) ? doc.slots.join(', ') : ''
      });
    } else {
      setEditingDoctor(null);
      setDoctorForm({
        id: `doc-${Date.now()}`,
        name: '',
        specialty: specialties[0]?.id || '',
        chamber: chambers[0]?.id || '',
        qualification: 'MBBS, FCPS',
        experience: '5+ Yrs Exp.',
        visit_days: 'Sat, Mon, Wed',
        visit_time: '05:00 PM - 09:00 PM',
        fee: '1000',
        slotsStr: '05:00 PM, 06:00 PM, 07:00 PM'
      });
    }
    setShowDoctorModal(true);
  };

  const handleSaveDoctor = async (e) => {
    e.preventDefault();
    try {
      const slots = doctorForm.slotsStr.split(',').map(s => s.trim()).filter(Boolean);
      const payload = {
        id: doctorForm.id,
        name: doctorForm.name,
        specialty: doctorForm.specialty,
        chamber: doctorForm.chamber,
        qualification: doctorForm.qualification,
        experience: doctorForm.experience,
        visit_days: doctorForm.visit_days,
        visit_time: doctorForm.visit_time,
        fee: parseFloat(doctorForm.fee) || 0,
        slots: slots
      };

      if (editingDoctor) {
        await api.updateDoctor(editingDoctor.id, payload);
        showNotification(`Doctor "${payload.name}" updated successfully!`);
      } else {
        await api.createDoctor(payload);
        showNotification(`Doctor "${payload.name}" added successfully!`);
      }
      setShowDoctorModal(false);
      loadAllData();
    } catch (err) {
      alert(`Error saving doctor: ${err.message}`);
    }
  };

  const handleDeleteDoctor = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove Dr. ${name}?`)) return;
    try {
      await api.deleteDoctor(id);
      showNotification(`Dr. ${name} removed.`);
      loadAllData();
    } catch (err) {
      alert(`Failed to delete doctor: ${err.message}`);
    }
  };

  // --- CHAMBER / MEDICAL PARTNER CRUD ---
  const handleOpenChamberModal = (ch = null) => {
    if (ch) {
      setEditingChamber(ch);
      setChamberForm({
        id: ch.id,
        name: ch.name,
        location: ch.location,
        city: ch.city,
        verified: ch.verified,
        rating: ch.rating,
        reviews_count: ch.reviews_count || ch.reviewsCount || 50,
        open_timing: ch.open_timing || ch.openTiming || '',
        contact_phone: ch.contact_phone || ch.contactPhone || '',
        tagline: ch.tagline || '',
        badge: ch.badge || '',
        image: ch.image || '',
        servicesStr: Array.isArray(ch.services) ? ch.services.join(', ') : (ch.services || ''),
        description: ch.description || ''
      });
    } else {
      setEditingChamber(null);
      setChamberForm({
        id: `chamber-${Date.now()}`,
        name: '',
        location: '',
        city: 'Dhaka',
        verified: true,
        rating: 4.8,
        reviews_count: 50,
        open_timing: '08:00 AM - 09:00 PM',
        contact_phone: '+880 1700-000000',
        tagline: 'Leading Healthcare & Diagnostic Hub',
        badge: 'Verified Partner',
        image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=600&q=80',
        servicesStr: '24/7 Specialist OPD Consultation, Digital Radiology & X-Ray, 4D Ultrasonography & Color Doppler, Automated Pathology & Biochemistry',
        description: 'Premier multispecialty OPD and clinical diagnostic center offering high-quality specialist doctor chambers, radiology, and lab tests.'
      });
    }
    setShowChamberModal(true);
  };

  const handleSaveChamber = async (e) => {
    e.preventDefault();
    try {
      const services = chamberForm.servicesStr.split(',').map(s => s.trim()).filter(Boolean);
      const payload = {
        id: chamberForm.id,
        name: chamberForm.name,
        location: chamberForm.location,
        city: chamberForm.city,
        verified: chamberForm.verified,
        rating: parseFloat(chamberForm.rating) || 0,
        reviews_count: parseInt(chamberForm.reviews_count, 10) || 0,
        open_timing: chamberForm.open_timing,
        contact_phone: chamberForm.contact_phone,
        tagline: chamberForm.tagline,
        badge: chamberForm.badge,
        image: chamberForm.image,
        services: services,
        description: chamberForm.description
      };

      if (editingChamber) {
        await api.updateChamber(editingChamber.id, payload);
        showNotification(`Medical Partner "${payload.name}" updated successfully!`);
      } else {
        await api.createChamber(payload);
        showNotification(`Medical Partner "${payload.name}" added successfully!`);
      }
      setShowChamberModal(false);
      loadAllData();
    } catch (err) {
      alert(`Error saving medical partner: ${err.message}`);
    }
  };

  const handleDeleteChamber = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove hospital "${name}"?`)) return;
    try {
      await api.deleteChamber(id);
      showNotification(`Hospital "${name}" removed.`);
      loadAllData();
    } catch (err) {
      alert(`Failed to delete hospital: ${err.message}`);
    }
  };

  // --- PATHOLOGY TEST CRUD ---
  const handleOpenTestModal = (t = null) => {
    if (t) {
      setEditingTest(t);
      setTestForm({
        id: t.id,
        name: t.name,
        category: t.category,
        price: t.price,
        original_price: t.original_price || '',
        discount: t.discount || '',
        fasting_required: t.fasting_required,
        report_time: t.report_time,
        description: t.description || ''
      });
    } else {
      setEditingTest(null);
      setTestForm({
        id: `test-${Date.now()}`,
        name: '',
        category: 'Routine Blood Profiles',
        price: '500',
        original_price: '700',
        discount: '25% OFF',
        fasting_required: false,
        report_time: 'Same Day (6 Hours)',
        description: 'Comprehensive diagnostic test panel.'
      });
    }
    setShowTestModal(true);
  };

  const handleSaveTest = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...testForm,
        price: parseFloat(testForm.price) || 0,
        original_price: testForm.original_price ? parseFloat(testForm.original_price) : null
      };

      if (editingTest) {
        await api.updateTest(editingTest.id, payload);
        showNotification(`Test "${payload.name}" updated successfully!`);
      } else {
        await api.createTest(payload);
        showNotification(`Test "${payload.name}" added successfully!`);
      }
      setShowTestModal(false);
      loadAllData();
    } catch (err) {
      alert(`Error saving test: ${err.message}`);
    }
  };

  const handleDeleteTest = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove test "${name}"?`)) return;
    try {
      await api.deleteTest(id);
      showNotification(`Test "${name}" removed.`);
      loadAllData();
    } catch (err) {
      alert(`Failed to delete test: ${err.message}`);
    }
  };

  // --- BOOKING STATUS UPDATES ---
  const handleUpdateDoctorBookingStatus = async (id, status) => {
    try {
      await api.updateDoctorBookingStatus(id, status);
      showNotification(`Booking #${id} status changed to ${status}`);
      loadAllData();
    } catch (err) {
      alert(`Failed to update booking status: ${err.message}`);
    }
  };

  const handleUpdateLabBookingStatus = async (id, status) => {
    try {
      await api.updateLabBookingStatus(id, status);
      showNotification(`Lab Booking #${id} status changed to ${status}`);
      loadAllData();
    } catch (err) {
      alert(`Failed to update lab booking status: ${err.message}`);
    }
  };

  // Dedicated Admin Login State
  const [adminPhone, setAdminPhone] = useState('01700000000');
  const [adminPassword, setAdminPassword] = useState('admin123456');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginErr, setLoginErr] = useState('');

  const handleAdminLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginErr('');
    try {
      const data = await api.login(adminPhone, adminPassword);
      if (!data.user?.is_staff) {
        setLoginErr('Account authenticated, but lacks Admin staff privileges (is_staff = False).');
      } else {
        if (onAdminLoggedIn) onAdminLoggedIn(data.user);
        loadAllData();
      }
    } catch (err) {
      setLoginErr(err.message || 'Invalid admin credentials.');
    } finally {
      setLoginLoading(false);
    }
  };

  if (!isStaff) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-md w-full bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-teal-500/20 text-slate-950">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black bg-gradient-to-r from-white via-slate-200 to-teal-300 bg-clip-text text-transparent">
              Admin Portal Access
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Restricted management console for DoctorsHub administrators
            </p>
          </div>

          {loginErr && (
            <div className="mb-6 p-4 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{loginErr}</span>
            </div>
          )}

          <form onSubmit={handleAdminLoginSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">Admin Phone Number</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="01700000000"
                  value={adminPhone}
                  onChange={e => setAdminPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-teal-500 font-mono transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">Admin Password</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={adminPassword}
                onChange={e => setAdminPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-teal-500 font-mono transition"
              />
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full mt-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-teal-600/30 transition transform active:scale-98 flex items-center justify-center gap-2 text-sm"
            >
              {loginLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Authenticating...
                </>
              ) : (
                'Sign In to Admin Console'
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-800/80 text-center">
            <button
              onClick={() => onNavigate('home')}
              className="text-xs text-slate-400 hover:text-teal-300 font-medium transition"
            >
              &larr; Back to Public Patient View
            </button>
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-16">
      {/* Header */}
      <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center font-black text-slate-950 text-xl shadow-lg shadow-teal-500/20">
              A
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-white via-slate-200 to-teal-300 bg-clip-text text-transparent flex items-center gap-2">
                DoctorsHub Admin Portal
                <span className="text-xs font-normal px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-400 border border-teal-500/30">
                  Staff Verified
                </span>
              </h1>
              <p className="text-xs text-slate-400">Control & management console for doctors, hospitals, lab tests & bookings</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadAllData}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition"
              title="Refresh Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <div className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-slate-300">{currentUser?.phone_number}</span>
            </div>
            <button
              onClick={() => onNavigate('home')}
              className="px-3 py-1.5 text-xs bg-teal-600/30 hover:bg-teal-600/50 text-teal-300 rounded-lg border border-teal-500/40 transition font-medium"
            >
              Exit to Patient View
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Success notification banner */}
        {successMsg && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <span className="text-sm font-medium">{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg('')} className="text-emerald-400 hover:text-white">
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex overflow-x-auto gap-2 p-1.5 bg-slate-900 border border-slate-800 rounded-2xl mb-8 scrollbar-none">
          {[
            { id: 'overview', label: 'Overview', icon: Sparkles },
            { id: 'doctors', label: `Doctors (${doctors.length})`, icon: Users },
            { id: 'hospitals', label: `Medical Partners (${chambers.length})`, icon: Building2 },
            { id: 'tests', label: `Lab Tests (${tests.length})`, icon: TestTube },
            { id: 'doc-bookings', label: `Doctor Bookings (${doctorBookings.length})`, icon: Calendar },
            { id: 'lab-bookings', label: `Lab Bookings (${labBookings.length})`, icon: TestTube },
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setSearchTerm(''); }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                  active
                    ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-lg shadow-teal-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {loading && (
          <div className="py-20 text-center text-slate-400">
            <RefreshCw className="w-8 h-8 mx-auto animate-spin text-teal-400 mb-3" />
            <p className="text-sm">Loading admin data from database...</p>
          </div>
        )}

        {!loading && (
          <>
            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 relative overflow-hidden group hover:border-teal-500/50 transition">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-wider font-semibold text-slate-400 mb-1">Total Doctors</p>
                        <h3 className="text-3xl font-extrabold text-white">{doctors.length}</h3>
                      </div>
                      <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
                        <Users className="w-6 h-6" />
                      </div>
                    </div>
                    <button 
                      onClick={() => setActiveTab('doctors')}
                      className="mt-4 text-xs font-semibold text-teal-400 hover:text-teal-300 flex items-center gap-1"
                    >
                      Manage Doctors &rarr;
                    </button>
                  </div>

                  <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 relative overflow-hidden group hover:border-emerald-500/50 transition">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-wider font-semibold text-slate-400 mb-1">Hospitals / Chambers</p>
                        <h3 className="text-3xl font-extrabold text-white">{chambers.length}</h3>
                      </div>
                      <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                        <Building2 className="w-6 h-6" />
                      </div>
                    </div>
                    <button 
                      onClick={() => setActiveTab('hospitals')}
                      className="mt-4 text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                    >
                      Manage Hospitals &rarr;
                    </button>
                  </div>

                  <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 relative overflow-hidden group hover:border-cyan-500/50 transition">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-wider font-semibold text-slate-400 mb-1">Pathology Tests</p>
                        <h3 className="text-3xl font-extrabold text-white">{tests.length}</h3>
                      </div>
                      <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                        <TestTube className="w-6 h-6" />
                      </div>
                    </div>
                    <button 
                      onClick={() => setActiveTab('tests')}
                      className="mt-4 text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                    >
                      Manage Tests &rarr;
                    </button>
                  </div>

                  <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 relative overflow-hidden group hover:border-amber-500/50 transition">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-wider font-semibold text-slate-400 mb-1">Total Patient Bookings</p>
                        <h3 className="text-3xl font-extrabold text-white">{doctorBookings.length + labBookings.length}</h3>
                      </div>
                      <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                        <Calendar className="w-6 h-6" />
                      </div>
                    </div>
                    <button 
                      onClick={() => setActiveTab('doc-bookings')}
                      className="mt-4 text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1"
                    >
                      View Bookings &rarr;
                    </button>
                  </div>
                </div>

                {/* Quick Add Section */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
                  <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                    <Plus className="w-5 h-5 text-teal-400" />
                    Quick Actions
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <button
                      onClick={() => handleOpenDoctorModal()}
                      className="p-4 bg-slate-800 hover:bg-slate-700/80 border border-slate-700 rounded-xl flex items-center gap-3 transition text-left group"
                    >
                      <div className="w-10 h-10 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center group-hover:scale-110 transition">
                        <Users className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-200 text-sm">Add New Doctor</div>
                        <div className="text-xs text-slate-400">Register specialist physician</div>
                      </div>
                    </button>

                    <button
                      onClick={() => handleOpenChamberModal()}
                      className="p-4 bg-slate-800 hover:bg-slate-700/80 border border-slate-700 rounded-xl flex items-center gap-3 transition text-left group"
                    >
                      <div className="w-10 h-10 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-200 text-sm">Add Hospital / Chamber</div>
                        <div className="text-xs text-slate-400">Add medical center or hub</div>
                      </div>
                    </button>

                    <button
                      onClick={() => handleOpenTestModal()}
                      className="p-4 bg-slate-800 hover:bg-slate-700/80 border border-slate-700 rounded-xl flex items-center gap-3 transition text-left group"
                    >
                      <div className="w-10 h-10 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center group-hover:scale-110 transition">
                        <TestTube className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-200 text-sm">Add Pathology Test</div>
                        <div className="text-xs text-slate-400">Add diagnostic lab test</div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* System Summary Info */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
                  <h3 className="text-base font-bold text-white mb-2">Connected Database Specs</h3>
                  <p className="text-xs text-slate-400 mb-4">Real-time status of PostgreSQL models and viewsets</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                      <span className="text-slate-400 block">Specialties Count</span>
                      <span className="font-bold text-white text-base">{specialties.length} Specialties</span>
                    </div>
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                      <span className="text-slate-400 block">Doctor Bookings</span>
                      <span className="font-bold text-white text-base">{doctorBookings.length} Bookings</span>
                    </div>
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                      <span className="text-slate-400 block">Lab Test Bookings</span>
                      <span className="font-bold text-white text-base">{labBookings.length} Bookings</span>
                    </div>
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                      <span className="text-slate-400 block">REST Auth API</span>
                      <span className="font-bold text-emerald-400 text-base">SimpleJWT Active</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* DOCTORS TAB */}
            {activeTab === 'doctors' && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <div className="p-5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
                  <div className="relative flex-1 min-w-[240px]">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search doctor by name or qualification..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                    />
                  </div>
                  <button
                    onClick={() => handleOpenDoctorModal()}
                    className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-medium text-sm rounded-xl transition shadow-lg shadow-teal-600/20"
                  >
                    <Plus className="w-4 h-4" /> Add Doctor
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-300">
                    <thead className="bg-slate-950 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="py-3.5 px-4">Doctor Name</th>
                        <th className="py-3.5 px-4">Specialty</th>
                        <th className="py-3.5 px-4">Chamber / Hospital</th>
                        <th className="py-3.5 px-4">Visit Schedule</th>
                        <th className="py-3.5 px-4">Fee</th>
                        <th className="py-3.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {doctors
                        .filter(d => d.name.toLowerCase().includes(searchTerm.toLowerCase()) || d.qualification.toLowerCase().includes(searchTerm.toLowerCase()))
                        .map(doc => (
                          <tr key={doc.id} className="hover:bg-slate-800/40 transition">
                            <td className="py-4 px-4 font-semibold text-white">
                              <div>{doc.name}</div>
                              <div className="text-xs text-slate-400 font-normal">{doc.qualification}</div>
                            </td>
                            <td className="py-4 px-4">
                              <span className="px-2.5 py-1 bg-teal-500/10 text-teal-400 rounded-md border border-teal-500/20 text-xs">
                                {doc.specialty_name || doc.specialty?.name || doc.specialty}
                              </span>
                            </td>
                            <td className="py-4 px-4">
                              <div className="text-slate-200 text-xs font-medium">{doc.chamber_name || doc.chamber?.name || doc.chamber}</div>
                              <div className="text-[11px] text-slate-400">{doc.chamber?.city}</div>
                            </td>
                            <td className="py-4 px-4 text-xs">
                              <div className="text-slate-200">{doc.visit_days}</div>
                              <div className="text-slate-400">{doc.visit_time}</div>
                            </td>
                            <td className="py-4 px-4 font-mono text-emerald-400 font-bold text-xs">
                              ৳{doc.fee}
                            </td>
                            <td className="py-4 px-4 text-right space-x-2 whitespace-nowrap">
                              <button
                                onClick={() => handleOpenDoctorModal(doc)}
                                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
                                title="Edit Doctor"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteDoctor(doc.id, doc.name)}
                                className="p-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 rounded-lg transition"
                                title="Delete Doctor"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      {doctors.length === 0 && (
                        <tr>
                          <td colSpan="6" className="py-8 text-center text-slate-500">No doctors registered yet.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* HOSPITALS / CHAMBERS TAB */}
            {activeTab === 'hospitals' && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <div className="p-5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
                  <div className="relative flex-1 min-w-[240px]">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search hospital or city..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <button
                    onClick={() => handleOpenChamberModal()}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm rounded-xl transition shadow-lg shadow-emerald-600/20"
                  >
                    <Plus className="w-4 h-4" /> Add Hospital / Chamber
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-300">
                    <thead className="bg-slate-950 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="py-3.5 px-4">Hospital / Chamber Name</th>
                        <th className="py-3.5 px-4">Location & City</th>
                        <th className="py-3.5 px-4">Contact Phone</th>
                        <th className="py-3.5 px-4">Rating</th>
                        <th className="py-3.5 px-4">Status</th>
                        <th className="py-3.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {chambers
                        .filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.city.toLowerCase().includes(searchTerm.toLowerCase()))
                        .map(ch => (
                          <tr key={ch.id} className="hover:bg-slate-800/40 transition">
                            <td className="py-4 px-4 font-semibold text-white">
                              <div>{ch.name}</div>
                              <div className="text-xs text-slate-400 font-normal">{ch.tagline}</div>
                            </td>
                            <td className="py-4 px-4 text-xs">
                              <div className="text-slate-200">{ch.location}</div>
                              <div className="text-slate-400 font-medium">{ch.city}</div>
                            </td>
                            <td className="py-4 px-4 font-mono text-xs text-slate-300">
                              {ch.contact_phone}
                            </td>
                            <td className="py-4 px-4 text-xs font-bold text-amber-400">
                              ⭐ {ch.rating} ({ch.reviews_count})
                            </td>
                            <td className="py-4 px-4">
                              {ch.verified ? (
                                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-[11px] font-semibold">Verified</span>
                              ) : (
                                <span className="px-2 py-0.5 bg-slate-800 text-slate-400 rounded text-[11px]">Standard</span>
                              )}
                            </td>
                            <td className="py-4 px-4 text-right space-x-2 whitespace-nowrap">
                              <button
                                onClick={() => window.open(`/partner/${ch.id}`, '_blank')}
                                className="px-2.5 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 font-bold text-xs rounded-lg transition border border-emerald-500/30"
                                title="View Public Medical Partner Page"
                              >
                                View Partner Page ↗
                              </button>
                              <button
                                onClick={() => handleOpenChamberModal(ch)}
                                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
                                title="Edit Partner Details & Services"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteChamber(ch.id, ch.name)}
                                className="p-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 rounded-lg transition"
                                title="Delete Hospital"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      {chambers.length === 0 && (
                        <tr>
                          <td colSpan="6" className="py-8 text-center text-slate-500">No chambers recorded yet.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* LAB TESTS TAB */}
            {activeTab === 'tests' && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <div className="p-5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
                  <div className="relative flex-1 min-w-[240px]">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search pathology test name..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <button
                    onClick={() => handleOpenTestModal()}
                    className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-sm rounded-xl transition shadow-lg shadow-cyan-600/20"
                  >
                    <Plus className="w-4 h-4" /> Add Pathology Test
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-300">
                    <thead className="bg-slate-950 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="py-3.5 px-4">Test Name</th>
                        <th className="py-3.5 px-4">Category</th>
                        <th className="py-3.5 px-4">Price</th>
                        <th className="py-3.5 px-4">Report Time</th>
                        <th className="py-3.5 px-4">Fasting Required</th>
                        <th className="py-3.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {tests
                        .filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()))
                        .map(t => (
                          <tr key={t.id} className="hover:bg-slate-800/40 transition">
                            <td className="py-4 px-4 font-semibold text-white">
                              <div>{t.name}</div>
                              <div className="text-xs text-slate-400 font-normal">{t.description}</div>
                            </td>
                            <td className="py-4 px-4 text-xs text-slate-300">
                              <span className="px-2.5 py-1 bg-cyan-500/10 text-cyan-400 rounded-md border border-cyan-500/20">
                                {t.category}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-xs">
                              <span className="font-mono text-emerald-400 font-bold text-sm">৳{t.price}</span>
                              {t.original_price && (
                                <span className="line-through text-slate-500 ml-2 text-xs">৳{t.original_price}</span>
                              )}
                              {t.discount && (
                                <span className="ml-2 text-[10px] text-amber-400 font-bold bg-amber-400/10 px-1.5 py-0.5 rounded">{t.discount}</span>
                              )}
                            </td>
                            <td className="py-4 px-4 text-xs text-slate-300">
                              {t.report_time}
                            </td>
                            <td className="py-4 px-4 text-xs">
                              {t.fasting_required ? (
                                <span className="text-amber-400 font-medium">Fasting Req.</span>
                              ) : (
                                <span className="text-slate-400">No Fasting</span>
                              )}
                            </td>
                            <td className="py-4 px-4 text-right space-x-2 whitespace-nowrap">
                              <button
                                onClick={() => handleOpenTestModal(t)}
                                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
                                title="Edit Test"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteTest(t.id, t.name)}
                                className="p-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 rounded-lg transition"
                                title="Delete Test"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      {tests.length === 0 && (
                        <tr>
                          <td colSpan="6" className="py-8 text-center text-slate-500">No lab tests added.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* DOCTOR BOOKINGS TAB */}
            {activeTab === 'doc-bookings' && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <div className="p-5 border-b border-slate-800">
                  <h3 className="text-base font-bold text-white">Patient Doctor Consultation Bookings</h3>
                  <p className="text-xs text-slate-400">Manage OPD appointments and change status</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-300">
                    <thead className="bg-slate-950 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="py-3.5 px-4">Booking ID</th>
                        <th className="py-3.5 px-4">Patient Name</th>
                        <th className="py-3.5 px-4">Doctor & Chamber</th>
                        <th className="py-3.5 px-4">Appointment Date & Slot</th>
                        <th className="py-3.5 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {doctorBookings.map(b => (
                        <tr key={b.id} className="hover:bg-slate-800/40 transition">
                          <td className="py-4 px-4 font-mono text-xs text-slate-400">#{b.id}</td>
                          <td className="py-4 px-4 font-semibold text-white">{b.patient_name}</td>
                          <td className="py-4 px-4 text-xs">
                            <div className="font-semibold text-teal-300">{b.doctor_name || `Doctor ID: ${b.doctor}`}</div>
                            <div className="text-slate-400">{b.chamber_name || `Chamber ID: ${b.chamber}`}</div>
                          </td>
                          <td className="py-4 px-4 text-xs">
                            <div className="font-medium text-white">{b.date}</div>
                            <div className="text-emerald-400 font-mono">{b.slot}</div>
                          </td>
                          <td className="py-4 px-4">
                            <select
                              value={b.status}
                              onChange={(e) => handleUpdateDoctorBookingStatus(b.id, e.target.value)}
                              className="bg-slate-950 border border-slate-700 text-xs text-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-teal-500"
                            >
                              <option value="Confirmed">Confirmed</option>
                              <option value="Completed">Completed</option>
                              <option value="Cancelled">Cancelled</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                      {doctorBookings.length === 0 && (
                        <tr>
                          <td colSpan="5" className="py-8 text-center text-slate-500">No doctor bookings recorded yet.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* LAB BOOKINGS TAB */}
            {activeTab === 'lab-bookings' && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <div className="p-5 border-b border-slate-800">
                  <h3 className="text-base font-bold text-white">Home Sample Pickup Lab Bookings</h3>
                  <p className="text-xs text-slate-400">View diagnostic requests and dispatch status</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-300">
                    <thead className="bg-slate-950 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="py-3.5 px-4">Booking ID</th>
                        <th className="py-3.5 px-4">Patient Name & Phone</th>
                        <th className="py-3.5 px-4">Test Name</th>
                        <th className="py-3.5 px-4">Pickup Address & Date</th>
                        <th className="py-3.5 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {labBookings.map(b => (
                        <tr key={b.id} className="hover:bg-slate-800/40 transition">
                          <td className="py-4 px-4 font-mono text-xs text-slate-400">#{b.id}</td>
                          <td className="py-4 px-4">
                            <div className="font-semibold text-white">{b.patient_name}</div>
                            <div className="text-xs font-mono text-slate-400">{b.patient_phone}</div>
                          </td>
                          <td className="py-4 px-4 text-xs font-semibold text-cyan-300">
                            {b.test_name || `Test ID: ${b.test}`}
                          </td>
                          <td className="py-4 px-4 text-xs">
                            <div className="text-white font-medium">{b.pickup_date}</div>
                            <div className="text-slate-400 text-[11px] max-w-xs line-clamp-1">{b.address}</div>
                          </td>
                          <td className="py-4 px-4">
                            <select
                              value={b.status}
                              onChange={(e) => handleUpdateLabBookingStatus(b.id, e.target.value)}
                              className="bg-slate-950 border border-slate-700 text-xs text-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-cyan-500"
                            >
                              <option value="Confirmed">Confirmed</option>
                              <option value="Sample Collected">Sample Collected</option>
                              <option value="Completed">Completed</option>
                              <option value="Cancelled">Cancelled</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                      {labBookings.length === 0 && (
                        <tr>
                          <td colSpan="5" className="py-8 text-center text-slate-500">No lab test bookings recorded yet.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* --- DOCTOR MODAL --- */}
      {showDoctorModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">
              {editingDoctor ? 'Edit Doctor Details' : 'Add New Doctor'}
            </h3>
            <form onSubmit={handleSaveDoctor} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Doctor Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Prof. Dr. Farhan Ahmed"
                  value={doctorForm.name}
                  onChange={e => setDoctorForm({...doctorForm, name: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Specialty</label>
                  <select
                    value={doctorForm.specialty}
                    onChange={e => setDoctorForm({...doctorForm, specialty: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-teal-500"
                  >
                    {specialties.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Chamber / Hospital</label>
                  <select
                    value={doctorForm.chamber}
                    onChange={e => setDoctorForm({...doctorForm, chamber: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-teal-500"
                  >
                    {chambers.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Qualifications & Degrees</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MBBS, FCPS (Medicine), MD (Cardiology)"
                  value={doctorForm.qualification}
                  onChange={e => setDoctorForm({...doctorForm, qualification: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Experience</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 15+ Yrs Exp."
                    value={doctorForm.experience}
                    onChange={e => setDoctorForm({...doctorForm, experience: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Consultation Fee (BDT)</label>
                  <input
                    type="number"
                    required
                    placeholder="1200"
                    value={doctorForm.fee}
                    onChange={e => setDoctorForm({...doctorForm, fee: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-teal-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Visit Days</label>
                  <input
                    type="text"
                    required
                    placeholder="Sat, Mon, Wed"
                    value={doctorForm.visit_days}
                    onChange={e => setDoctorForm({...doctorForm, visit_days: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Visit Time</label>
                  <input
                    type="text"
                    required
                    placeholder="05:00 PM - 09:00 PM"
                    value={doctorForm.visit_time}
                    onChange={e => setDoctorForm({...doctorForm, visit_time: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Available Slots (Comma Separated)</label>
                <input
                  type="text"
                  placeholder="05:15 PM, 06:00 PM, 07:00 PM"
                  value={doctorForm.slotsStr}
                  onChange={e => setDoctorForm({...doctorForm, slotsStr: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-teal-500 font-mono"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowDoctorModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white font-semibold rounded-xl transition shadow-lg shadow-teal-600/30"
                >
                  Save Doctor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- CHAMBER MODAL --- */}
      {showChamberModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">
              {editingChamber ? 'Edit Hospital / Chamber' : 'Add New Hospital / Chamber'}
            </h3>
            <form onSubmit={handleSaveChamber} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Hospital / Chamber Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Square Hospital OPD Hub"
                  value={chamberForm.name}
                  onChange={e => setChamberForm({...chamberForm, name: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">City</label>
                  <select
                    value={chamberForm.city}
                    onChange={e => setChamberForm({...chamberForm, city: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Dhaka">Dhaka</option>
                    <option value="Chittagong">Chittagong</option>
                    <option value="Sylhet">Sylhet</option>
                    <option value="Rajshahi">Rajshahi</option>
                    <option value="Khulna">Khulna</option>
                    <option value="Barisal">Barisal</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    required
                    placeholder="+880 1700-000000"
                    value={chamberForm.contact_phone}
                    onChange={e => setChamberForm({...chamberForm, contact_phone: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Detailed Address Location</label>
                <input
                  type="text"
                  required
                  placeholder="House 18, Road 2, Dhanmondi, Dhaka"
                  value={chamberForm.location}
                  onChange={e => setChamberForm({...chamberForm, location: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Opening Hours</label>
                  <input
                    type="text"
                    required
                    placeholder="07:00 AM - 10:30 PM"
                    value={chamberForm.open_timing}
                    onChange={e => setChamberForm({...chamberForm, open_timing: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Badge Tag</label>
                  <input
                    type="text"
                    placeholder="Super Partner / Top Rated"
                    value={chamberForm.badge}
                    onChange={e => setChamberForm({...chamberForm, badge: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Tagline</label>
                <input
                  type="text"
                  placeholder="Premier OPD & Diagnostic Center"
                  value={chamberForm.tagline}
                  onChange={e => setChamberForm({...chamberForm, tagline: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Image URL</label>
                <input
                  type="text"
                  placeholder="https://images.unsplash.com/..."
                  value={chamberForm.image}
                  onChange={e => setChamberForm({...chamberForm, image: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Medical Services & Facilities (Comma Separated)</label>
                <input
                  type="text"
                  placeholder="e.g. 24/7 OPD Consultation, Digital X-Ray, 4D Ultrasonography, CT Scan"
                  value={chamberForm.servicesStr}
                  onChange={e => setChamberForm({...chamberForm, servicesStr: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Partner Overview & Description</label>
                <textarea
                  rows="3"
                  placeholder="Detailed background summary of the medical center facility..."
                  value={chamberForm.description}
                  onChange={e => setChamberForm({...chamberForm, description: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                ></textarea>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="ch-ver"
                  checked={chamberForm.verified}
                  onChange={e => setChamberForm({...chamberForm, verified: e.target.checked})}
                  className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500"
                />
                <label htmlFor="ch-ver" className="text-slate-300 font-semibold">Verified Medical Partner</label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowChamberModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition shadow-lg shadow-emerald-600/30"
                >
                  Save Medical Partner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- TEST MODAL --- */}
      {showTestModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">
              {editingTest ? 'Edit Pathology Test' : 'Add New Pathology Test'}
            </h3>
            <form onSubmit={handleSaveTest} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Test Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Complete Blood Count (CBC)"
                  value={testForm.name}
                  onChange={e => setTestForm({...testForm, name: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Category</label>
                  <input
                    type="text"
                    required
                    placeholder="Routine Blood Profiles"
                    value={testForm.category}
                    onChange={e => setTestForm({...testForm, category: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Report Delivery Time</label>
                  <input
                    type="text"
                    required
                    placeholder="Same Day (6 Hours)"
                    value={testForm.report_time}
                    onChange={e => setTestForm({...testForm, report_time: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Discount Price (BDT)</label>
                  <input
                    type="number"
                    required
                    placeholder="450"
                    value={testForm.price}
                    onChange={e => setTestForm({...testForm, price: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Original Price</label>
                  <input
                    type="number"
                    placeholder="600"
                    value={testForm.original_price}
                    onChange={e => setTestForm({...testForm, original_price: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Discount Badge</label>
                  <input
                    type="text"
                    placeholder="25% OFF"
                    value={testForm.discount}
                    onChange={e => setTestForm({...testForm, discount: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Description</label>
                <textarea
                  rows="2"
                  placeholder="Test measures RBC, WBC, Platelets..."
                  value={testForm.description}
                  onChange={e => setTestForm({...testForm, description: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                ></textarea>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="t-fasting"
                  checked={testForm.fasting_required}
                  onChange={e => setTestForm({...testForm, fasting_required: e.target.checked})}
                  className="w-4 h-4 rounded text-cyan-500 focus:ring-cyan-500"
                />
                <label htmlFor="t-fasting" className="text-slate-300">Overnight Fasting Required (8-12 hrs)</label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowTestModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-xl transition shadow-lg shadow-cyan-600/30"
                >
                  Save Test
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
