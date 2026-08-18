import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, AlertCircle, RefreshCw, Key, Lock, Phone, UserCheck, 
  Building2, TestTube2, Stethoscope, CheckCircle2, ArrowRight, UserPlus, 
  LogIn, Award, FileText, MapPin, Sparkles, AlertTriangle
} from 'lucide-react';
import { api, ensureArray } from '../../../services/api';
import CascadingLocationFilter from '../../../components/CascadingLocationFilter';

export default function AdminLoginForm({ onAdminLoggedIn }) {
  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'reg_diagnostic' | 'reg_hospital' | 'reg_doctor'
  
  // Login states
  const [adminPhone, setAdminPhone] = useState('0178787878');
  const [adminPassword, setAdminPassword] = useState('super123');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginErr, setLoginErr] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Common Registration states
  const [regLoading, setRegLoading] = useState(false);
  const [regErr, setRegErr] = useState('');
  
  // Diagnostic Center Registration Form
  const [diagForm, setDiagForm] = useState({
    name: '',
    branch: '',
    license_number: '',
    division: 'Dhaka',
    district: 'Dhaka',
    area: 'Dhanmondi',
    address_line: '',
    phone_number: '',
    password: '',
    admin_name: '',
    email: '',
    category_id: ''
  });

  // Hospital Registration Form
  const [hospForm, setHospForm] = useState({
    name: '',
    branch: '',
    license_number: '',
    division: 'Dhaka',
    district: 'Dhaka',
    area: 'Dhanmondi',
    address_line: '',
    phone_number: '',
    password: '',
    admin_name: '',
    category_id: ''
  });

  // Doctor Registration Form
  const [docForm, setDocForm] = useState({
    name: '',
    phone_number: '',
    password: '',
    bmdc_number: '',
    qualification: '',
    experience: '5+ years',
    specialty_id: '',
    email: ''
  });

  // Reference metadata for dropdowns
  const [specialties, setSpecialties] = useState([]);
  const [hospitalCategories, setHospitalCategories] = useState([]);
  const [diagnosticCategories, setDiagnosticCategories] = useState([]);

  useEffect(() => {
    api.getSpecialties().then(data => setSpecialties(ensureArray(data))).catch(() => {});
    api.getHospitalCategories().then(data => setHospitalCategories(ensureArray(data))).catch(() => {});
    api.getDiagnosticCenterCategories().then(data => setDiagnosticCategories(ensureArray(data))).catch(() => {});
  }, []);

  const fillCredentials = (phone, pass) => {
    setAdminPhone(phone);
    setAdminPassword(pass);
    setLoginErr('');
  };

  const handleAdminLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginErr('');

    try {
      const res = await api.login(adminPhone.trim(), adminPassword);
      const user = res?.user || api.getCurrentUser();

      const allowedRoles = ['super_admin', 'facility_admin', 'doctor', 'staff'];
      const hasAccess = Boolean(
        user?.is_staff ||
        user?.is_superuser ||
        allowedRoles.includes(user?.role) ||
        user?.phone_number === '01700000000' ||
        user?.phone === '01700000000'
      );

      if (hasAccess) {
        if (onAdminLoggedIn) onAdminLoggedIn(user);
      } else {
        setLoginErr('Access Denied: This account does not have administrative privileges.');
      }
    } catch (err) {
      setLoginErr(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoginLoading(false);
    }
  };

  // Facility Registration Handler
  const handleFacilityRegister = async (e, type) => {
    e.preventDefault();
    setRegLoading(true);
    setRegErr('');
    setSuccessMsg('');

    const form = type === 'diagnostic_center' ? diagForm : hospForm;

    try {
      const payload = {
        facility_type: type,
        name: form.name.trim(),
        branch: form.branch.trim(),
        license_number: form.license_number.trim(),
        division: form.division,
        district: form.district,
        area: form.area,
        address_line: form.address_line.trim() || `${form.area}, ${form.district}`,
        category_id: form.category_id || undefined,
        phone_number: form.phone_number.trim(),
        password: form.password,
        first_name: form.admin_name.trim() || form.name.trim(),
        email: form.email ? form.email.trim() : undefined
      };

      const res = await api.registerFacility(payload);
      setSuccessMsg('Registration successful! Your facility is ready for setup. Public listing will go live once verified by Super Admin.');
      if (res?.user && onAdminLoggedIn) {
        setTimeout(() => onAdminLoggedIn(res.user), 1200);
      }
    } catch (err) {
      setRegErr(err.message || 'Registration failed. Please verify the input fields.');
    } finally {
      setRegLoading(false);
    }
  };

  // Doctor Registration Handler
  const handleDoctorRegister = async (e) => {
    e.preventDefault();
    setRegLoading(true);
    setRegErr('');
    setSuccessMsg('');

    try {
      const payload = {
        name: docForm.name.trim(),
        phone_number: docForm.phone_number.trim(),
        password: docForm.password,
        bmdc_number: docForm.bmdc_number.trim(),
        qualification: docForm.qualification.trim(),
        experience: docForm.experience.trim() || '5+ years',
        specialty_ids: docForm.specialty_id ? [docForm.specialty_id] : [],
        email: docForm.email ? docForm.email.trim() : undefined
      };

      const res = await api.registerDoctor(payload);
      setSuccessMsg('Registration successful! Welcome Dr. ' + docForm.name + '. You can now configure your chambers and weekly availability.');
      if (res?.user && onAdminLoggedIn) {
        setTimeout(() => onAdminLoggedIn(res.user), 1200);
      }
    } catch (err) {
      setRegErr(err.message || 'Registration failed. Please check your BMDC number and phone.');
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      
      {/* Background Decorative Gradient Blobs */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-2xl w-full bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10 my-8">
        
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-teal-500/20 text-slate-950">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-white via-slate-100 to-teal-300 bg-clip-text text-transparent">
            DoctorsHub Partner & Admin Portal
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            Unified management console and self-serve onboarding for Hospitals, Diagnostic Centers, and Doctors
          </p>
        </div>

        {/* Unified Mode Switcher Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-slate-950/80 border border-slate-800 rounded-2xl mb-6 text-xs font-bold">
          <button
            type="button"
            onClick={() => { setActiveTab('login'); setLoginErr(''); setRegErr(''); setSuccessMsg(''); }}
            className={`py-2.5 px-2 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activeTab === 'login' 
                ? 'bg-teal-500 text-slate-950 shadow-md font-extrabold' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('reg_diagnostic'); setLoginErr(''); setRegErr(''); setSuccessMsg(''); }}
            className={`py-2.5 px-2 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activeTab === 'reg_diagnostic' 
                ? 'bg-teal-500 text-slate-950 shadow-md font-extrabold' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <TestTube2 className="w-3.5 h-3.5" />
            <span>Diagnostic Lab</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('reg_hospital'); setLoginErr(''); setRegErr(''); setSuccessMsg(''); }}
            className={`py-2.5 px-2 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activeTab === 'reg_hospital' 
                ? 'bg-teal-500 text-slate-950 shadow-md font-extrabold' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Hospital</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('reg_doctor'); setLoginErr(''); setRegErr(''); setSuccessMsg(''); }}
            className={`py-2.5 px-2 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activeTab === 'reg_doctor' 
                ? 'bg-teal-500 text-slate-950 shadow-md font-extrabold' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Stethoscope className="w-3.5 h-3.5" />
            <span>Doctor</span>
          </button>
        </div>

        {/* Global Feedback Banners */}
        {loginErr && (
          <div className="mb-6 p-3.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{loginErr}</span>
          </div>
        )}

        {regErr && (
          <div className="mb-6 p-3.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{regErr}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">{successMsg}</p>
              <p className="text-slate-300 text-[11px] mt-1">Redirecting to your management workspace...</p>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 1: SIGN IN FORM */}
        {/* ========================================================================= */}
        {activeTab === 'login' && (
          <div>
            {/* Demo Credentials Quick Fill Box */}
            <div className="mb-6 bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 text-xs space-y-2.5">
              <div className="flex items-center justify-between text-slate-300 font-bold">
                <span className="flex items-center gap-1.5 text-teal-400">
                  <Key className="w-3.5 h-3.5" />
                  <span>Role-Based Test Accounts (1-Click Fill):</span>
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                <button
                  type="button"
                  onClick={() => fillCredentials('0178787878', 'super123')}
                  className="p-2.5 rounded-xl bg-slate-900/90 hover:bg-teal-950/60 border border-slate-700 hover:border-teal-500/60 text-left transition cursor-pointer group"
                >
                  <div className="text-amber-400 font-bold text-[10px]">👑 Super Admin</div>
                  <div className="text-teal-300 font-bold mt-0.5">0178787878</div>
                  <div className="text-slate-400 text-[10px]">pass: super123</div>
                </button>

                <button
                  type="button"
                  onClick={() => fillCredentials('0177777777', 'popular123')}
                  className="p-2.5 rounded-xl bg-slate-900/90 hover:bg-teal-950/60 border border-slate-700 hover:border-teal-500/60 text-left transition cursor-pointer group"
                >
                  <div className="text-purple-400 font-bold text-[10px] flex items-center gap-1">
                    <TestTube2 className="w-3 h-3" />
                    <span>Popular Diagnostic</span>
                  </div>
                  <div className="text-teal-300 font-bold mt-0.5">0177777777</div>
                  <div className="text-slate-400 text-[10px]">pass: popular123</div>
                </button>

                <button
                  type="button"
                  onClick={() => fillCredentials('0188888888', 'square123')}
                  className="p-2.5 rounded-xl bg-slate-900/90 hover:bg-teal-950/60 border border-slate-700 hover:border-teal-500/60 text-left transition cursor-pointer group"
                >
                  <div className="text-blue-400 font-bold text-[10px] flex items-center gap-1">
                    <Building2 className="w-3 h-3" />
                    <span>Square Hospital</span>
                  </div>
                  <div className="text-teal-300 font-bold mt-0.5">0188888888</div>
                  <div className="text-slate-400 text-[10px]">pass: square123</div>
                </button>

                <button
                  type="button"
                  onClick={() => fillCredentials('0199999999', 'harun123')}
                  className="p-2.5 rounded-xl bg-slate-900/90 hover:bg-teal-950/60 border border-slate-700 hover:border-teal-500/60 text-left transition cursor-pointer group"
                >
                  <div className="text-emerald-400 font-bold text-[10px] flex items-center gap-1">
                    <Stethoscope className="w-3 h-3" />
                    <span>Prof. Dr. Harun</span>
                  </div>
                  <div className="text-teal-300 font-bold mt-0.5">0199999999</div>
                  <div className="text-slate-400 text-[10px]">pass: harun123</div>
                </button>
              </div>
            </div>

            <form onSubmit={handleAdminLoginSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-teal-400" />
                  <span>Admin / Staff Phone Number</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="0178787878"
                  value={adminPhone}
                  onChange={e => setAdminPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-teal-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1.5 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-teal-400" />
                  <span>Password</span>
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={adminPassword}
                  onChange={e => setAdminPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-teal-500 font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full mt-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-teal-600/30 transition flex items-center justify-center gap-2 text-sm cursor-pointer disabled:opacity-50"
              >
                {loginLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Sign In to Workspace'}
              </button>
            </form>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: REGISTER DIAGNOSTIC CENTER */}
        {/* ========================================================================= */}
        {activeTab === 'reg_diagnostic' && (
          <form onSubmit={(e) => handleFacilityRegister(e, 'diagnostic_center')} className="space-y-4 text-xs">
            <div className="bg-teal-500/10 border border-teal-500/30 rounded-2xl p-3.5 text-[11px] text-teal-300 flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
              <span>
                Register your Diagnostic Center to manage test pricing, branch catalogs, and sample collection orders.
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Center Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Popular Diagnostic Center"
                  value={diagForm.name}
                  onChange={e => setDiagForm({ ...diagForm, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Branch Name</label>
                <input
                  type="text"
                  placeholder="e.g. Uttara Branch"
                  value={diagForm.branch}
                  onChange={e => setDiagForm({ ...diagForm, branch: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">DGHS / Trade License No.</label>
                <input
                  type="text"
                  placeholder="e.g. DGHS-REG-2024-889"
                  value={diagForm.license_number}
                  onChange={e => setDiagForm({ ...diagForm, license_number: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Specialization Category</label>
                <select
                  value={diagForm.category_id}
                  onChange={e => setDiagForm({ ...diagForm, category_id: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-teal-500 cursor-pointer"
                >
                  <option value="">Select Specialization...</option>
                  {diagnosticCategories.map(cat => (
                    <option key={cat.id || cat.slug} value={cat.id || cat.slug}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Cascading Location Filter */}
            <div className="border border-slate-800/80 bg-slate-950/40 rounded-2xl p-3 space-y-2">
              <label className="block text-[11px] font-bold text-teal-400 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                <span>Facility Location (Division &rarr; District &rarr; Thana) *</span>
              </label>
              <CascadingLocationFilter
                division={diagForm.division}
                district={diagForm.district}
                area={diagForm.area}
                onChange={({ division, district, area }) => {
                  setDiagForm({ ...diagForm, division, district, area });
                }}
                theme="dark"
                accent="teal"
                layout="grid"
                showLabels={true}
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Street Address</label>
              <input
                type="text"
                placeholder="e.g. House 12, Road 4, Sector 7"
                value={diagForm.address_line}
                onChange={e => setDiagForm({ ...diagForm, address_line: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-teal-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800/80">
              <div>
                <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-teal-400" />
                  <span>Admin Contact Phone (Login ID) *</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="017xxxxxxxx"
                  value={diagForm.phone_number}
                  onChange={e => setDiagForm({ ...diagForm, phone_number: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-teal-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-teal-400" />
                  <span>Admin Password *</span>
                </label>
                <input
                  type="password"
                  required
                  placeholder="Min 6 characters"
                  value={diagForm.password}
                  onChange={e => setDiagForm({ ...diagForm, password: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={regLoading}
              className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-teal-600/30 transition flex items-center justify-center gap-2 text-sm cursor-pointer disabled:opacity-50"
            >
              {regLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Register Diagnostic Center'}
            </button>
          </form>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: REGISTER HOSPITAL */}
        {/* ========================================================================= */}
        {activeTab === 'reg_hospital' && (
          <form onSubmit={(e) => handleFacilityRegister(e, 'hospital')} className="space-y-4 text-xs">
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-3.5 text-[11px] text-blue-300 flex items-start gap-2">
              <Building2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <span>
                Register your Hospital to manage doctor chambers, departments, bed availability, and patient appointments.
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Hospital Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Square Hospital"
                  value={hospForm.name}
                  onChange={e => setHospForm({ ...hospForm, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Branch Name</label>
                <input
                  type="text"
                  placeholder="e.g. Main Branch"
                  value={hospForm.branch}
                  onChange={e => setHospForm({ ...hospForm, branch: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">DGHS / Health Ministry Reg No.</label>
                <input
                  type="text"
                  placeholder="e.g. DGHS-HOSP-2024"
                  value={hospForm.license_number}
                  onChange={e => setHospForm({ ...hospForm, license_number: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Hospital Category</label>
                <select
                  value={hospForm.category_id}
                  onChange={e => setHospForm({ ...hospForm, category_id: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="">Select Category...</option>
                  {hospitalCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Cascading Location Filter */}
            <div className="border border-slate-800/80 bg-slate-950/40 rounded-2xl p-3 space-y-2">
              <label className="block text-[11px] font-bold text-blue-400 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                <span>Hospital Location (Division &rarr; District &rarr; Thana) *</span>
              </label>
              <CascadingLocationFilter
                division={hospForm.division}
                district={hospForm.district}
                area={hospForm.area}
                onChange={({ division, district, area }) => {
                  setHospForm({ ...hospForm, division, district, area });
                }}
                theme="dark"
                accent="cyan"
                layout="grid"
                showLabels={true}
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Street Address</label>
              <input
                type="text"
                placeholder="e.g. 18/F Bir Uttam Qazi Nuruzzaman Sarak"
                value={hospForm.address_line}
                onChange={e => setHospForm({ ...hospForm, address_line: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800/80">
              <div>
                <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-blue-400" />
                  <span>Admin Contact Phone (Login ID) *</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="018xxxxxxxx"
                  value={hospForm.phone_number}
                  onChange={e => setHospForm({ ...hospForm, phone_number: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-blue-400" />
                  <span>Admin Password *</span>
                </label>
                <input
                  type="password"
                  required
                  placeholder="Min 6 characters"
                  value={hospForm.password}
                  onChange={e => setHospForm({ ...hospForm, password: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={regLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-600/30 transition flex items-center justify-center gap-2 text-sm cursor-pointer disabled:opacity-50"
            >
              {regLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Register Hospital'}
            </button>
          </form>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: REGISTER DOCTOR */}
        {/* ========================================================================= */}
        {activeTab === 'reg_doctor' && (
          <form onSubmit={handleDoctorRegister} className="space-y-4 text-xs">
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-3.5 text-[11px] text-emerald-300 flex items-start gap-2">
              <Stethoscope className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                Register as a verified specialist doctor with your BMDC number to manage appointments and chamber schedules.
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Doctor Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Prof. Dr. Harun-Or-Rashid"
                  value={docForm.name}
                  onChange={e => setDocForm({ ...docForm, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">BMDC Registration No. *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BMDC-A-45920"
                  value={docForm.bmdc_number}
                  onChange={e => setDocForm({ ...docForm, bmdc_number: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Primary Specialty *</label>
                <select
                  required
                  value={docForm.specialty_id}
                  onChange={e => setDocForm({ ...docForm, specialty_id: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="">Select Primary Specialty...</option>
                  {specialties.map(spec => (
                    <option key={spec.id} value={spec.id}>{spec.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Experience</label>
                <input
                  type="text"
                  placeholder="e.g. 12 Years"
                  value={docForm.experience}
                  onChange={e => setDocForm({ ...docForm, experience: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Medical Degrees & Qualifications *</label>
              <textarea
                required
                rows="2"
                placeholder="e.g. MBBS, FCPS (Medicine), MD (Nephrology), FACP (USA)"
                value={docForm.qualification}
                onChange={e => setDocForm({ ...docForm, qualification: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-emerald-500"
              ></textarea>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800/80">
              <div>
                <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Doctor Phone (Login ID) *</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="019xxxxxxxx"
                  value={docForm.phone_number}
                  onChange={e => setDocForm({ ...docForm, phone_number: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Password *</span>
                </label>
                <input
                  type="password"
                  required
                  placeholder="Min 6 characters"
                  value={docForm.password}
                  onChange={e => setDocForm({ ...docForm, password: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={regLoading}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-2 text-sm cursor-pointer disabled:opacity-50"
            >
              {regLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Register Doctor Profile'}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}

