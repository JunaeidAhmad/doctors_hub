import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import { 
  Users, Building2, TestTube, Calendar, Plus, Edit, Trash2, CheckCircle, 
  XCircle, Search, RefreshCw, AlertCircle, ShieldAlert, Sparkles, Clock, MapPin, Stethoscope, ChevronRight, Filter, Calculator 
} from 'lucide-react';

export const CITY_THANAS = {
  "Dhaka": [
    "Dhanmondi", "Mirpur", "Uttara", "Gulshan", "Banani", "Panthapath", 
    "Motijheel", "Mohammadpur", "Badda", "Savar", "Farmgate", "Tejgaon", 
    "Malibagh", "Shyamoli", "Rampura", "Jatrabari", "Lalbagh", "Khilgaon", 
    "Keraniganj", "Gazipur", "Narayanganj"
  ],
  "Chittagong": [
    "Panchlaish", "Agrabad", "GEC Circle", "Halishahar", "Nasirabad", 
    "Chawkbazar", "Pahartali", "Khulshi", "Kotwali", "Patenga", 
    "Sitakunda", "Hathazari"
  ],
  "Sylhet": [
    "Zindabazar", "Nayasarak", "Amberkhana", "Chauhatta", "Subidbazar", 
    "Tilagarh", "Shibganj", "Kadamtali", "Shahjalal Uposahar"
  ],
  "Rajshahi": [
    "Laxmipur", "Kazla", "Motihar", "Boalia", "Rajputra", 
    "Shaheb Bazar", "New Market", "Upashahar"
  ],
  "Khulna": [
    "KDA Avenue", "Sonadanga", "Boyra", "Khalishpur", "Daulatpur", 
    "Rupsha", "Gollamari", "Khan Jahan Ali"
  ],
  "Barisal": [
    "Sadar Road", "Rupatali", "Natun Bazar", "C&B Road", "Alekanda", 
    "Jordan Road", "Kashipur"
  ],
  "Rangpur": [
    "Park More", "Medical East Gate", "Jahaj Company More", "Dhap", 
    "Carmel Road", "Pairaband"
  ],
  "Mymensingh": [
    "Charpara", "Ganginarpar", "Town Hall", "Maskanda", "Akua", 
    "Kewatkhali", "Patuakhali Road"
  ],
  "Comilla": [
    "Kandirpar", "Jhawtala", "Badurtala", "Tomsom Bridge", "Ramghat", 
    "Bagichagaon", "Dharmpur"
  ]
};

/**
 * Helper to auto-calculate price based on original price and discount input
 * Supports percentages (e.g. "20%", "25% OFF") or flat amounts (e.g. "200 BDT", "150")
 */
function calculateFinalPrice(origPriceStr, discountStr) {
  const orig = parseFloat(origPriceStr);
  if (isNaN(orig) || orig <= 0) return '';
  if (!discountStr || !discountStr.trim()) return orig.toString();

  const distTrim = discountStr.trim();
  // Check if percentage (e.g. "20%", "25% OFF")
  const pctMatch = distTrim.match(/^(\d+(?:\.\d+)?)\s*%/);
  if (pctMatch) {
    const pct = parseFloat(pctMatch[1]);
    const finalPrice = Math.round(orig * (1 - pct / 100));
    return (finalPrice >= 0 ? finalPrice : 0).toString();
  }

  // Check if flat amount (e.g. "200", "200 BDT")
  const flatMatch = distTrim.match(/^(\d+(?:\.\d+)?)/);
  if (flatMatch) {
    const flat = parseFloat(flatMatch[1]);
    const finalPrice = Math.round(orig - flat);
    return (finalPrice >= 0 ? finalPrice : 0).toString();
  }

  return orig.toString();
}

export default function AdminDashboardPage({ currentUser, onNavigate, onAdminLoggedIn }) {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'doctors' | 'chambers' | 'tests' | 'branch-tests' | 'doc-bookings' | 'lab-bookings'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Data states
  const [doctors, setDoctors] = useState([]);
  const [chambers, setChambers] = useState([]);
  const [tests, setTests] = useState([]);
  const [branchTests, setBranchTests] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [doctorBookings, setDoctorBookings] = useState([]);
  const [labBookings, setLabBookings] = useState([]);

  // Branch Test Filters
  const [branchTestBranchFilter, setBranchTestBranchFilter] = useState('');
  const [branchTestTestFilter, setBranchTestTestFilter] = useState('');

  // Modals state
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [doctorForm, setDoctorForm] = useState({
    id: '',
    name: '',
    qualification: '',
    experience: '10+ Yrs Exp.',
    selectedSpecialties: [],
    affiliations: [
      {
        branch: '',
        consultation_type: 'OPD',
        original_fee: '1500',
        discount: '20% OFF',
        fee: '1200',
        schedules: [
          { day_of_week: 'Sat', start_time: '17:00', end_time: '21:00' }
        ]
      }
    ]
  });

  const [showChamberModal, setShowChamberModal] = useState(false);
  const [editingChamber, setEditingChamber] = useState(null);
  const [chamberForm, setChamberForm] = useState({
    id: '',
    hospital_name: 'Ibn Sina Healthcare Group',
    branch_name: 'Dhanmondi Branch',
    isCustomBranch: false,
    customBranchName: '',
    city: 'Dhaka',
    location: '',
    verified: true,
    rating: 4.8,
    reviews_count: 50,
    open_timing: '08:00 AM - 08:00 PM',
    contact_phone: '+880 1700-000000',
    tagline: 'Leading Healthcare & Diagnostic Hub',
    badge: 'Verified Partner',
    image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=600&q=80',
    servicesStr: '24/7 Specialist OPD Consultation, Digital Radiology & X-Ray, 4D Ultrasonography, CT Scan',
    description: 'Premier multispecialty OPD and clinical diagnostic center.',
    facility_types: ['Hospital', 'Diagnostic Center']
  });

  const [showTestModal, setShowTestModal] = useState(false);
  const [editingTest, setEditingTest] = useState(null);
  const [testForm, setTestForm] = useState({
    id: '', name: '', category: 'Routine Blood Profiles', fasting_required: false, description: ''
  });

  const [showBranchTestModal, setShowBranchTestModal] = useState(false);
  const [editingBranchTest, setEditingBranchTest] = useState(null);
  const [branchTestForm, setBranchTestForm] = useState({
    id: '',
    branch: '',
    test: '',
    original_price: '700',
    discount: '25% OFF',
    price: '525',
    report_delivery_date: new Date().toISOString().split('T')[0],
    report_time_slot: '05:00 PM - 09:00 PM'
  });

  // Dedicated Admin Login State
  const [adminPhone, setAdminPhone] = useState('01700000000');
  const [adminPassword, setAdminPassword] = useState('admin123');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginErr, setLoginErr] = useState('');

  // General Search filter inside tables
  const [searchTerm, setSearchTerm] = useState('');

  const isStaff = currentUser?.is_staff || false;

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    setError('');
    try {
      const [docsData, chambsData, testsData, specsData, branchTestsData] = await Promise.all([
        api.getDoctors(),
        api.getBranches(),
        api.getTests(),
        api.getSpecialties(),
        api.getBranchTests().catch(() => [])
      ]);
      setDoctors(docsData || []);
      setChambers(chambsData || []);
      setTests(testsData || []);
      setSpecialties(specsData || []);
      setBranchTests(branchTestsData || []);

      if (isStaff) {
        try {
          const [docBks, labBks] = await Promise.all([
            api.getDoctorBookings(),
            api.getLabBookings()
          ]);
          setDoctorBookings(docBks || []);
          setLabBookings(labBks || []);
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

  // --- DOCTOR CRUD HANDLERS ---
  const handleOpenDoctorModal = (doc = null) => {
    if (doc) {
      setEditingDoctor(doc);
      const specIds = Array.isArray(doc.specialties) 
        ? doc.specialties.map(s => s.id || s)
        : (doc.specialty ? [doc.specialty.id || doc.specialty] : []);

      const affs = Array.isArray(doc.affiliations) && doc.affiliations.length > 0
        ? doc.affiliations.map(a => ({
            branch: a.branch_id || a.branch || chambers[0]?.id || '',
            consultation_type: a.consultation_type || 'OPD',
            original_fee: a.original_fee || a.fee || '1500',
            discount: a.discount || '20% OFF',
            fee: a.fee || '1200',
            schedules: Array.isArray(a.schedules) && a.schedules.length > 0
              ? a.schedules.map(s => ({
                  day_of_week: s.day_of_week || 'Sat',
                  start_time: s.start_time || '17:00',
                  end_time: s.end_time || '21:00'
                }))
              : [{ day_of_week: 'Sat', start_time: '17:00', end_time: '21:00' }]
          }))
        : [{
            branch: chambers[0]?.id || '',
            consultation_type: 'OPD',
            original_fee: '1500',
            discount: '20% OFF',
            fee: '1200',
            schedules: [{ day_of_week: 'Sat', start_time: '17:00', end_time: '21:00' }]
          }];

      setDoctorForm({
        id: doc.id,
        name: doc.name,
        qualification: doc.qualification,
        experience: doc.experience,
        selectedSpecialties: specIds,
        affiliations: affs
      });
    } else {
      setEditingDoctor(null);
      setDoctorForm({
        id: `doc-${Date.now()}`,
        name: '',
        qualification: 'MBBS, FCPS (Medicine)',
        experience: '12+ Yrs Exp.',
        selectedSpecialties: specialties[0] ? [specialties[0].id] : [],
        affiliations: [
          {
            branch: chambers[0]?.id || '',
            consultation_type: 'OPD',
            original_fee: '1500',
            discount: '20% OFF',
            fee: '1200',
            schedules: [{ day_of_week: 'Sat', start_time: '17:00', end_time: '21:00' }]
          }
        ]
      });
    }
    setShowDoctorModal(true);
  };

  const handleToggleSpecialty = (specId) => {
    setDoctorForm(prev => {
      const exists = prev.selectedSpecialties.includes(specId);
      const updated = exists 
        ? prev.selectedSpecialties.filter(id => id !== specId)
        : [...prev.selectedSpecialties, specId];
      return { ...prev, selectedSpecialties: updated };
    });
  };

  const handleAddAffiliation = () => {
    setDoctorForm(prev => ({
      ...prev,
      affiliations: [
        ...prev.affiliations,
        {
          branch: chambers[0]?.id || '',
          consultation_type: 'OPD',
          original_fee: '1500',
          discount: '20% OFF',
          fee: '1200',
          schedules: [{ day_of_week: 'Sat', start_time: '17:00', end_time: '21:00' }]
        }
      ]
    }));
  };

  const handleRemoveAffiliation = (index) => {
    setDoctorForm(prev => ({
      ...prev,
      affiliations: prev.affiliations.filter((_, i) => i !== index)
    }));
  };

  const handleAddScheduleRow = (affIndex) => {
    setDoctorForm(prev => {
      const updatedAffs = [...prev.affiliations];
      updatedAffs[affIndex].schedules.push({ day_of_week: 'Mon', start_time: '17:00', end_time: '21:00' });
      return { ...prev, affiliations: updatedAffs };
    });
  };

  const handleRemoveScheduleRow = (affIndex, schIndex) => {
    setDoctorForm(prev => {
      const updatedAffs = [...prev.affiliations];
      updatedAffs[affIndex].schedules = updatedAffs[affIndex].schedules.filter((_, i) => i !== schIndex);
      return { ...prev, affiliations: updatedAffs };
    });
  };

  const handleSaveDoctor = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        id: doctorForm.id,
        name: doctorForm.name,
        qualification: doctorForm.qualification,
        experience: doctorForm.experience,
        specialty_ids: doctorForm.selectedSpecialties,
        affiliations: doctorForm.affiliations.map(a => ({
          ...a,
          fee: parseFloat(a.fee) || 1000
        }))
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

  // --- CHAMBER / HOSPITAL CRUD HANDLERS ---
  const handleOpenChamberModal = (ch = null) => {
    if (ch) {
      setEditingChamber(ch);
      const cityName = ch.city || 'Dhaka';
      const cityThanasList = CITY_THANAS[cityName] || CITY_THANAS["Dhaka"];
      const isCustom = !cityThanasList.includes(ch.name);

      setChamberForm({
        id: ch.id,
        hospital_name: ch.hospital_name || (ch.hospital?.name) || 'Medical Group',
        branch_name: isCustom ? 'Other' : ch.name,
        isCustomBranch: isCustom,
        customBranchName: isCustom ? ch.name : '',
        city: cityName,
        location: ch.location,
        verified: ch.verified,
        rating: ch.rating || 4.8,
        reviews_count: ch.reviews_count || ch.reviewsCount || 50,
        open_timing: ch.open_timing || ch.openTiming || '08:00 AM - 08:00 PM',
        contact_phone: ch.contact_phone || ch.contactPhone || '',
        tagline: ch.tagline || '',
        badge: ch.badge || 'Verified Partner',
        image: ch.image || 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=600&q=80',
        servicesStr: Array.isArray(ch.services) ? ch.services.join(', ') : (ch.services || ''),
        description: ch.description || '',
        facility_types: ch.facility_types && ch.facility_types.length > 0 ? ch.facility_types : ['Hospital', 'Diagnostic Center']
      });
    } else {
      setEditingChamber(null);
      setChamberForm({
        id: `branch-${Date.now()}`,
        hospital_name: 'Ibn Sina Healthcare Group',
        branch_name: CITY_THANAS["Dhaka"][0],
        isCustomBranch: false,
        customBranchName: '',
        city: 'Dhaka',
        location: 'House 48, Road 9/A, Dhanmondi',
        verified: true,
        rating: 4.8,
        reviews_count: 50,
        open_timing: '07:30 AM - 10:30 PM',
        contact_phone: '+880 9610-010615',
        tagline: 'Premier Multispecialty Healthcare Hub',
        badge: 'Verified Partner',
        image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=600&q=80',
        servicesStr: '24/7 Specialist OPD Consultation, Digital Radiology & X-Ray, 4D Ultrasonography, CT Scan',
        description: 'Multispecialty healthcare and clinical diagnostic facility.',
        facility_types: ['Hospital', 'Diagnostic Center']
      });
    }
    setShowChamberModal(true);
  };

  const handleSaveChamber = async (e) => {
    e.preventDefault();
    try {
      const finalBranchName = chamberForm.isCustomBranch ? chamberForm.customBranchName : chamberForm.branch_name;
      const services = chamberForm.servicesStr.split(',').map(s => s.trim()).filter(Boolean);
      
      const payload = {
        id: chamberForm.id,
        hospital_name: chamberForm.hospital_name,
        name: finalBranchName,
        facility_types: chamberForm.facility_types,
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
        await api.updateBranch(editingChamber.id, payload);
        showNotification(`Branch "${payload.hospital_name} - ${payload.name}" updated successfully!`);
      } else {
        await api.createBranch(payload);
        showNotification(`Branch "${payload.hospital_name} - ${payload.name}" added successfully!`);
      }
      setShowChamberModal(false);
      loadAllData();
    } catch (err) {
      alert(`Error saving hospital branch: ${err.message}`);
    }
  };

  const handleDeleteChamber = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove hospital branch "${name}"?`)) return;
    try {
      await api.deleteBranch(id);
      showNotification(`Branch "${name}" removed.`);
      loadAllData();
    } catch (err) {
      alert(`Failed to delete branch: ${err.message}`);
    }
  };

  // --- PATHOLOGY BASE TEST CRUD ---
  const handleOpenTestModal = (t = null) => {
    if (t) {
      setEditingTest(t);
      setTestForm({
        id: t.id,
        name: t.name,
        category: t.category,
        fasting_required: t.fasting_required,
        description: t.description || ''
      });
    } else {
      setEditingTest(null);
      setTestForm({
        id: `test-${Date.now()}`,
        name: '',
        category: 'Routine Blood Profiles',
        fasting_required: false,
        description: 'Comprehensive diagnostic test profile.'
      });
    }
    setShowTestModal(true);
  };

  const handleSaveTest = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...testForm };
      if (editingTest) {
        await api.updateTest(editingTest.id, payload);
        showNotification(`Pathology Test "${payload.name}" updated.`);
      } else {
        await api.createTest(payload);
        showNotification(`Pathology Test "${payload.name}" created.`);
      }
      setShowTestModal(false);
      loadAllData();
    } catch (err) {
      alert(`Error saving test: ${err.message}`);
    }
  };

  const handleDeleteTest = async (id, name) => {
    if (!window.confirm(`Delete pathology test "${name}"?`)) return;
    try {
      await api.deleteTest(id);
      showNotification(`Test "${name}" deleted.`);
      loadAllData();
    } catch (err) {
      alert(`Failed to delete test: ${err.message}`);
    }
  };

  // --- BRANCH TEST PRICING CRUD HANDLERS ---
  const handleOpenBranchTestModal = (bt = null) => {
    const todayStr = new Date().toISOString().split('T')[0];
    if (bt) {
      setEditingBranchTest(bt);
      setBranchTestForm({
        id: bt.id,
        branch: bt.branch?.id || bt.branch || chambers[0]?.id || '',
        test: bt.test?.id || bt.test || tests[0]?.id || '',
        original_price: bt.original_price ? bt.original_price.toString() : '700',
        discount: bt.discount || '25% OFF',
        price: bt.price ? bt.price.toString() : '525',
        report_delivery_date: todayStr,
        report_time_slot: '05:00 PM - 09:00 PM'
      });
    } else {
      setEditingBranchTest(null);
      setBranchTestForm({
        id: '',
        branch: chambers[0]?.id || '',
        test: tests[0]?.id || '',
        original_price: '700',
        discount: '25% OFF',
        price: '525',
        report_delivery_date: todayStr,
        report_time_slot: '05:00 PM - 09:00 PM'
      });
    }
    setShowBranchTestModal(true);
  };

  const handleSaveBranchTest = async (e) => {
    e.preventDefault();
    try {
      const formattedReportTime = `Delivery: ${branchTestForm.report_delivery_date} | Slot: ${branchTestForm.report_time_slot}`;
      
      const payload = {
        branch: branchTestForm.branch,
        test: branchTestForm.test,
        price: parseFloat(branchTestForm.price) || 0,
        original_price: branchTestForm.original_price ? parseFloat(branchTestForm.original_price) : null,
        discount: branchTestForm.discount,
        report_time: formattedReportTime
      };

      await api.createBranchTest(payload);
      showNotification("Diagnostic Branch Test pricing updated!");
      setShowBranchTestModal(false);
      loadAllData();
    } catch (err) {
      alert(`Error saving branch test: ${err.message}`);
    }
  };

  const handleDeleteBranchTest = async (id) => {
    if (!window.confirm("Remove this diagnostic test offering?")) return;
    try {
      await api.deleteBranchTest(id);
      showNotification("Diagnostic test offering removed.");
      loadAllData();
    } catch (err) {
      alert(`Failed to remove: ${err.message}`);
    }
  };

  // Filtered Branch Tests for Tab 3
  const filteredBranchTests = useMemo(() => {
    return branchTests.filter(bt => {
      const bHospitalName = bt.hospital_name || (bt.branch?.hospital_name) || (bt.branch?.hospital?.name) || '';
      const bBranchName = bt.branch_name || (bt.branch?.name) || '';
      const fullBranchDisplayName = bHospitalName ? `${bHospitalName} - ${bBranchName}` : bBranchName;
      const tName = bt.test_details?.name || (bt.test?.name) || '';

      if (branchTestBranchFilter && !fullBranchDisplayName.toLowerCase().includes(branchTestBranchFilter.toLowerCase())) {
        return false;
      }
      if (branchTestTestFilter && !tName.toLowerCase().includes(branchTestTestFilter.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [branchTests, branchTestBranchFilter, branchTestTestFilter]);

  if (!isStaff) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
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
              <input
                type="text"
                required
                placeholder="01700000000"
                value={adminPhone}
                onChange={e => setAdminPhone(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-teal-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">Admin Password</label>
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
              className="w-full mt-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-teal-600/30 transition flex items-center justify-center gap-2 text-sm"
            >
              {loginLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Sign In to Admin Console'}
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
              <p className="text-xs text-slate-400">Manage Hospitals, Diagnostic Test Pricing, Doctors & Schedules</p>
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
              Exit Console
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

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-800 overflow-x-auto pb-1 text-xs">
          {[
            { id: 'overview', label: 'Overview', icon: Users },
            { id: 'chambers', label: `Hospitals & Branches (${chambers.length})`, icon: Building2 },
            { id: 'doctors', label: `Specialist Doctors (${doctors.length})`, icon: Stethoscope },
            { id: 'tests', label: `Pathology Base Tests (${tests.length})`, icon: TestTube },
            { id: 'branch-tests', label: `Diagnostic Test Prices (${branchTests.length})`, icon: TestTube },
            { id: 'doc-bookings', label: `Doctor Bookings (${doctorBookings.length})`, icon: Calendar },
            { id: 'lab-bookings', label: `Lab Bookings (${labBookings.length})`, icon: Calendar },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setSearchTerm(''); }}
                className={`px-4 py-3 font-bold rounded-t-xl border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${
                  isActive 
                    ? 'border-teal-400 text-teal-400 bg-slate-900' 
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* 1. HOSPITALS & BRANCHES TAB */}
        {activeTab === 'chambers' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
              <div className="relative flex-1 min-w-[240px]">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search hospital name, branch or city..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                />
              </div>
              <button
                onClick={() => handleOpenChamberModal()}
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-emerald-600/20"
              >
                <Plus className="w-4 h-4" /> Add New Hospital Branch
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 text-[11px] uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4">Hospital & Branch Name</th>
                    <th className="py-3.5 px-4">Facility Types</th>
                    <th className="py-3.5 px-4">Location & City</th>
                    <th className="py-3.5 px-4">Contact Phone</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {chambers
                    .filter(c => {
                      const fullStr = `${c.hospital_name || ''} ${c.name} ${c.city} ${c.location}`.toLowerCase();
                      return fullStr.includes(searchTerm.toLowerCase());
                    })
                    .map(ch => {
                      const displayName = ch.hospital_name ? `${ch.hospital_name} - ${ch.name}` : ch.name;
                      const facilities = ch.facility_types && ch.facility_types.length > 0 ? ch.facility_types : ['Hospital', 'Diagnostic Center'];

                      return (
                        <tr key={ch.id} className="hover:bg-slate-800/40 transition">
                          <td className="py-4 px-4 font-bold text-white">
                            <div className="text-sm text-emerald-400">{displayName}</div>
                            <div className="text-slate-400 text-[11px] font-normal">{ch.tagline}</div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex flex-wrap gap-1">
                              {facilities.map(f => (
                                <span key={f} className="px-2 py-0.5 bg-teal-500/20 text-teal-300 border border-teal-500/30 rounded text-[10px] font-bold">
                                  {f}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="text-slate-200">{ch.location}</div>
                            <div className="text-slate-400 font-bold">{ch.city}</div>
                          </td>
                          <td className="py-4 px-4 font-mono text-slate-300">
                            {ch.contact_phone}
                          </td>
                          <td className="py-4 px-4 text-right space-x-2 whitespace-nowrap">
                            <button
                              onClick={() => handleOpenChamberModal(ch)}
                              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
                              title="Edit Branch"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteChamber(ch.id, displayName)}
                              className="p-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 rounded-lg transition"
                              title="Delete Branch"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  {chambers.length === 0 && (
                    <tr>
                      <td colSpan="5" className="py-8 text-center text-slate-500">No branches added yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 2. DOCTORS TAB */}
        {activeTab === 'doctors' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
              <div className="relative flex-1 min-w-[240px]">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search doctor name or specialty..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                />
              </div>
              <button
                onClick={() => handleOpenDoctorModal()}
                className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-teal-600/20"
              >
                <Plus className="w-4 h-4" /> Add Doctor (With Multi-Chamber & Schedules)
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 text-[11px] uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4">Doctor Profile</th>
                    <th className="py-3.5 px-4">Specialties</th>
                    <th className="py-3.5 px-4">Chamber Affiliations & Schedules</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {doctors
                    .filter(d => {
                      const specNames = Array.isArray(d.specialties) ? d.specialties.map(s=>s.name||s).join(' ') : (d.specialty || '');
                      return `${d.name} ${specNames}`.toLowerCase().includes(searchTerm.toLowerCase());
                    })
                    .map(doc => {
                      const specs = Array.isArray(doc.specialties) 
                        ? doc.specialties.map(s => s.name || s)
                        : [doc.specialty || doc.specialty_details?.name || 'General Physician'];
                      const affs = doc.affiliations || [];

                      return (
                        <tr key={doc.id} className="hover:bg-slate-800/40 transition">
                          <td className="py-4 px-4 font-bold text-white">
                            <div className="text-sm text-teal-300">{doc.name}</div>
                            <div className="text-slate-400 text-[11px] font-normal">{doc.qualification}</div>
                            <div className="text-[10px] text-slate-500 font-semibold">{doc.experience}</div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex flex-wrap gap-1">
                              {specs.map(s => (
                                <span key={s} className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-[10px] font-bold">
                                  {s}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            {affs.length > 0 ? (
                              <div className="space-y-1.5">
                                {affs.map((a, i) => (
                                  <div key={i} className="bg-slate-950 p-2 rounded-lg border border-slate-800 text-[11px]">
                                    <div className="flex items-center justify-between font-bold text-slate-200">
                                      <span>{a.branch_name || 'Medical Branch'}</span>
                                      <span className={`px-1.5 py-0.5 rounded text-[10px] ${a.consultation_type === 'In-patient' ? 'bg-purple-500/20 text-purple-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                                        {a.consultation_type} (৳{a.fee})
                                      </span>
                                    </div>
                                    {a.schedules && a.schedules.length > 0 && (
                                      <div className="text-[10px] text-slate-400 mt-1 flex flex-wrap gap-2">
                                        {a.schedules.map((sch, sIdx) => (
                                          <span key={sIdx}>• {sch.day_of_week} ({sch.start_time}-{sch.end_time})</span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-slate-500 italic">No affiliations set</span>
                            )}
                          </td>
                          <td className="py-4 px-4 text-right space-x-2 whitespace-nowrap">
                            <button
                              onClick={() => handleOpenDoctorModal(doc)}
                              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
                              title="Edit Doctor & Affiliations"
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
                      );
                    })}
                  {doctors.length === 0 && (
                    <tr>
                      <td colSpan="4" className="py-8 text-center text-slate-500">No doctors added.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. DIAGNOSTIC BRANCH TEST PRICING TAB (WITH TASKS 1, 2, 3 IMPLEMENTED) */}
        {activeTab === 'branch-tests' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl space-y-4">
            
            {/* Header & Modal Action */}
            <div className="p-5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-white">Diagnostic Branch Test Pricing</h3>
                <p className="text-xs text-slate-400">Assign pathology tests to specific hospital branches with auto-calculated discounts</p>
              </div>
              <button
                onClick={() => handleOpenBranchTestModal()}
                className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-teal-600/20"
              >
                <Plus className="w-4 h-4" /> Assign Test Pricing To Branch
              </button>
            </div>

            {/* TASK 3: FILTER BAR FOR DIAGNOSTIC BRANCH & TEST NAME */}
            <div className="px-5 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 text-xs text-slate-400 font-bold">
                <Filter className="w-4 h-4 text-teal-400" />
                <span>Filters:</span>
              </div>

              {/* Diagnostic Branch Filter */}
              <div className="flex-1 min-w-[200px]">
                <select
                  value={branchTestBranchFilter}
                  onChange={(e) => setBranchTestBranchFilter(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500 font-semibold"
                >
                  <option value="">All Diagnostic Branches</option>
                  {chambers.map(c => {
                    const full = c.hospital_name ? `${c.hospital_name} - ${c.name}` : c.name;
                    return <option key={c.id} value={full}>{full}</option>;
                  })}
                </select>
              </div>

              {/* Test Name Filter */}
              <div className="flex-1 min-w-[200px]">
                <select
                  value={branchTestTestFilter}
                  onChange={(e) => setBranchTestTestFilter(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500 font-semibold"
                >
                  <option value="">All Pathology Tests</option>
                  {tests.map(t => (
                    <option key={t.id} value={t.name}>{t.name}</option>
                  ))}
                </select>
              </div>

              {(branchTestBranchFilter || branchTestTestFilter) && (
                <button
                  onClick={() => {
                    setBranchTestBranchFilter('');
                    setBranchTestTestFilter('');
                  }}
                  className="text-xs text-rose-400 hover:underline font-bold px-2 py-1"
                >
                  Reset Filters
                </button>
              )}
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 text-[11px] uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4">Hospital & Branch Name (Diagnostic Branch)</th>
                    <th className="py-3.5 px-4">Test Name</th>
                    <th className="py-3.5 px-4">Calculated Test Price</th>
                    <th className="py-3.5 px-4">Report Delivery Calendar & Slot</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredBranchTests.map(bt => {
                    {/* TASK 1: COMBINE HOSPITAL NAME + BRANCH NAME */}
                    const bHospitalName = bt.hospital_name || (bt.branch?.hospital_name) || (bt.branch?.hospital?.name) || '';
                    const bBranchName = bt.branch_name || (bt.branch?.name) || 'Diagnostic Center';
                    const fullBranchDisplayName = bHospitalName ? `${bHospitalName} - ${bBranchName}` : bBranchName;
                    
                    const tName = bt.test_details?.name || (bt.test?.name) || 'Pathology Test';

                    return (
                      <tr key={bt.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-4 px-4 font-bold text-emerald-400">
                          <div className="text-sm">{fullBranchDisplayName}</div>
                        </td>
                        <td className="py-4 px-4 font-bold text-white">
                          <div>{tName}</div>
                          {bt.discount && (
                            <span className="inline-block mt-0.5 px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                              {bt.discount}
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-4 font-mono font-bold text-teal-300">
                          <div className="text-base text-teal-300">৳{bt.price}</div>
                          {bt.original_price && (
                            <div className="line-through text-slate-500 text-xs">Original: ৳{bt.original_price}</div>
                          )}
                        </td>
                        <td className="py-4 px-4 text-slate-300">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-semibold text-slate-200">
                            <Calendar className="w-3.5 h-3.5 text-teal-400" />
                            <span>{bt.report_time || 'Same Day Delivery'}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-right space-x-2 whitespace-nowrap">
                          <button
                            onClick={() => handleOpenBranchTestModal(bt)}
                            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteBranchTest(bt.id)}
                            className="p-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 rounded-lg transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredBranchTests.length === 0 && (
                    <tr>
                      <td colSpan="5" className="py-8 text-center text-slate-500">
                        No diagnostic branch test offerings match your search criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 4. PATHOLOGY BASE TESTS TAB */}
        {activeTab === 'tests' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
              <div className="relative flex-1 min-w-[240px]">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search test name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                />
              </div>
              <button
                onClick={() => handleOpenTestModal()}
                className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-teal-600/20"
              >
                <Plus className="w-4 h-4" /> Add Pathology Base Test
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 text-[11px] uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4">Test Name</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">Fasting Required</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {tests
                    .filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map(t => (
                      <tr key={t.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-4 px-4 font-bold text-white">
                          <div>{t.name}</div>
                          <div className="text-[11px] text-slate-400 font-normal">{t.description}</div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="px-2.5 py-1 bg-teal-500/10 text-teal-400 rounded-md border border-teal-500/20 font-bold">
                            {t.category}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          {t.fasting_required ? (
                            <span className="text-amber-400 font-semibold">Fasting Required</span>
                          ) : (
                            <span className="text-slate-400">No Fasting</span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-right space-x-2 whitespace-nowrap">
                          <button
                            onClick={() => handleOpenTestModal(t)}
                            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteTest(t.id, t.name)}
                            className="p-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 rounded-lg transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>

      {/* --- HOSPITAL / BRANCH MODAL --- */}
      {showChamberModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white">
              {editingChamber ? 'Edit Hospital Branch' : 'Add New Hospital Branch'}
            </h3>
            
            <form onSubmit={handleSaveChamber} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">1. Hospital Group Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ibn Sina Healthcare Group / Square Hospital"
                  value={chamberForm.hospital_name}
                  onChange={e => setChamberForm({...chamberForm, hospital_name: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-teal-500 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">2. City Location</label>
                  <select
                    value={chamberForm.city}
                    onChange={e => {
                      const newCity = e.target.value;
                      const defaultBranch = CITY_THANAS[newCity] ? CITY_THANAS[newCity][0] : 'Main Branch';
                      setChamberForm({
                        ...chamberForm, 
                        city: newCity,
                        branch_name: defaultBranch,
                        isCustomBranch: false
                      });
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-teal-500 font-semibold"
                  >
                    {Object.keys(CITY_THANAS).map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">3. Branch Thana / Area</label>
                  {!chamberForm.isCustomBranch ? (
                    <select
                      value={chamberForm.branch_name}
                      onChange={e => {
                        if (e.target.value === '__custom__') {
                          setChamberForm({...chamberForm, isCustomBranch: true, customBranchName: ''});
                        } else {
                          setChamberForm({...chamberForm, branch_name: e.target.value});
                        }
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-teal-500 font-semibold"
                    >
                      {(CITY_THANAS[chamberForm.city] || []).map(t => (
                        <option key={t} value={`${t} Branch`}>{t} Branch</option>
                      ))}
                      <option value="__custom__">+ Enter Custom Branch Name...</option>
                    </select>
                  ) : (
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        required
                        placeholder="e.g. South City Branch"
                        value={chamberForm.customBranchName}
                        onChange={e => setChamberForm({...chamberForm, customBranchName: e.target.value})}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-teal-500"
                      />
                      <button
                        type="button"
                        onClick={() => setChamberForm({...chamberForm, isCustomBranch: false})}
                        className="text-[10px] text-teal-400 underline shrink-0"
                      >
                        List
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Street Address Location</label>
                <input
                  type="text"
                  required
                  placeholder="House 48, Road 9/A, Dhanmondi, Dhaka"
                  value={chamberForm.location}
                  onChange={e => setChamberForm({...chamberForm, location: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Facility Capabilities</label>
                <div className="flex items-center gap-4 text-xs">
                  {['Hospital', 'Diagnostic Center', 'Standalone Chamber'].map(fType => (
                    <label key={fType} className="flex items-center gap-1.5 text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={chamberForm.facility_types.includes(fType)}
                        onChange={e => {
                          const updated = e.target.checked
                            ? [...chamberForm.facility_types, fType]
                            : chamberForm.facility_types.filter(t => t !== fType);
                          setChamberForm({...chamberForm, facility_types: updated});
                        }}
                        className="rounded text-teal-500 focus:ring-teal-500"
                      />
                      <span>{fType}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    required
                    value={chamberForm.contact_phone}
                    onChange={e => setChamberForm({...chamberForm, contact_phone: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Opening Hours</label>
                  <input
                    type="text"
                    required
                    value={chamberForm.open_timing}
                    onChange={e => setChamberForm({...chamberForm, open_timing: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Services & Facilities (Comma Separated)</label>
                <input
                  type="text"
                  value={chamberForm.servicesStr}
                  onChange={e => setChamberForm({...chamberForm, servicesStr: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowChamberModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl"
                >
                  Save Branch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- DIAGNOSTIC BRANCH TEST MODAL (WITH TASK 2 CALENDAR/SLOT AND TASK 4 AUTO-CALCULATION) --- */}
      {showBranchTestModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white">Assign Test Pricing To Diagnostic Branch</h3>
            
            <form onSubmit={handleSaveBranchTest} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Select Diagnostic Branch</label>
                <select
                  value={branchTestForm.branch}
                  onChange={e => setBranchTestForm({...branchTestForm, branch: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-semibold"
                >
                  {chambers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.hospital_name ? `${c.hospital_name} - ${c.name}` : c.name} ({c.city})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Select Pathology Test</label>
                <select
                  value={branchTestForm.test}
                  onChange={e => setBranchTestForm({...branchTestForm, test: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-semibold"
                >
                  {tests.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.category})</option>
                  ))}
                </select>
              </div>

              {/* TASK 4: AUTO CALCULATED PRICE FROM ORIGINAL PRICE AND DISCOUNT */}
              <div className="grid grid-cols-2 gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Original Price (BDT)</label>
                  <input
                    type="number"
                    required
                    placeholder="700"
                    value={branchTestForm.original_price}
                    onChange={e => {
                      const newOrig = e.target.value;
                      const calculated = calculateFinalPrice(newOrig, branchTestForm.discount);
                      setBranchTestForm({
                        ...branchTestForm, 
                        original_price: newOrig,
                        price: calculated || branchTestForm.price
                      });
                    }}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Discount Tag (% or BDT)</label>
                  <input
                    type="text"
                    placeholder="25% OFF / 150 BDT"
                    value={branchTestForm.discount}
                    onChange={e => {
                      const newDisc = e.target.value;
                      const calculated = calculateFinalPrice(branchTestForm.original_price, newDisc);
                      setBranchTestForm({
                        ...branchTestForm, 
                        discount: newDisc,
                        price: calculated || branchTestForm.price
                      });
                    }}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div className="col-span-2 pt-2 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400 font-bold flex items-center gap-1.5">
                    <Calculator className="w-4 h-4 text-teal-400" />
                    Calculated Final Price:
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      required
                      value={branchTestForm.price}
                      onChange={e => setBranchTestForm({...branchTestForm, price: e.target.value})}
                      className="w-28 bg-slate-900 border border-teal-500/50 rounded-xl px-3 py-1.5 text-teal-300 font-mono font-bold text-sm text-right focus:outline-none"
                    />
                    <span className="text-teal-400 font-bold">BDT</span>
                  </div>
                </div>
              </div>

              {/* TASK 2: REPORT PROCESSING TIME CALENDAR & TIME SLOT */}
              <div className="grid grid-cols-2 gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div>
                  <label className="block text-slate-300 font-bold mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-teal-400" />
                    Report Delivery Date
                  </label>
                  <input
                    type="date"
                    required
                    value={branchTestForm.report_delivery_date}
                    onChange={e => setBranchTestForm({...branchTestForm, report_delivery_date: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-teal-400" />
                    Time Slot
                  </label>
                  <select
                    value={branchTestForm.report_time_slot}
                    onChange={e => setBranchTestForm({...branchTestForm, report_time_slot: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-semibold"
                  >
                    <option value="Same Day Morning (10:00 AM - 01:00 PM)">Morning (10:00 AM - 01:00 PM)</option>
                    <option value="Same Day Afternoon (02:00 PM - 05:00 PM)">Afternoon (02:00 PM - 05:00 PM)</option>
                    <option value="05:00 PM - 09:00 PM">Evening (05:00 PM - 09:00 PM)</option>
                    <option value="Next Day Morning (10:00 AM)">Next Day Morning (10:00 AM)</option>
                    <option value="Within 24 Hours">Within 24 Hours</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowBranchTestModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl"
                >
                  Save Test Pricing
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- DOCTOR MODAL (MULTI-SPECIALTY, MULTI-CHAMBER & TASK 4 AUTO-CALCULATED DOCTOR FEE) --- */}
      {showDoctorModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-5">
            <h3 className="text-lg font-bold text-white">
              {editingDoctor ? 'Edit Doctor & Multi-Chamber Schedules' : 'Add New Doctor (Multi-Specialty & Multi-Chamber)'}
            </h3>

            <form onSubmit={handleSaveDoctor} className="space-y-5 text-xs">
              
              <div>
                <label className="block text-slate-300 font-bold mb-1">Doctor Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Prof. Dr. A. K. M. Fazlul Haque"
                  value={doctorForm.name}
                  onChange={e => setDoctorForm({...doctorForm, name: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Qualifications</label>
                  <input
                    type="text"
                    required
                    placeholder="MBBS, FCPS (Medicine), MD (Cardiology)"
                    value={doctorForm.qualification}
                    onChange={e => setDoctorForm({...doctorForm, qualification: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Experience</label>
                  <input
                    type="text"
                    required
                    placeholder="15+ Yrs Exp."
                    value={doctorForm.experience}
                    onChange={e => setDoctorForm({...doctorForm, experience: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              {/* Multi Specialties Checkbox Selection */}
              <div>
                <label className="block text-slate-300 font-bold mb-2">
                  Doctor Specialties (Select Multiple):
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800 max-h-36 overflow-y-auto">
                  {specialties.map(s => {
                    const isChecked = doctorForm.selectedSpecialties.includes(s.id);
                    return (
                      <label key={s.id} className="flex items-center gap-2 text-slate-300 hover:text-white cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSpecialty(s.id)}
                          className="rounded text-teal-500 focus:ring-teal-500"
                        />
                        <span className="font-semibold">{s.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Chamber Affiliations & Schedules List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-slate-300 font-bold">
                    Chamber Affiliations & Specific Visiting Schedules:
                  </label>
                  <button
                    type="button"
                    onClick={handleAddAffiliation}
                    className="text-xs text-teal-400 font-bold hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Chamber Location
                  </button>
                </div>

                {doctorForm.affiliations.map((aff, affIdx) => (
                  <div key={affIdx} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="font-bold text-teal-400">Chamber Affiliation #{affIdx + 1}</span>
                      {doctorForm.affiliations.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveAffiliation(affIdx)}
                          className="text-rose-400 text-xs font-semibold hover:underline"
                        >
                          Remove Chamber
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-400 mb-1">Select Branch / Chamber</label>
                        <select
                          value={aff.branch}
                          onChange={e => {
                            const val = e.target.value;
                            setDoctorForm(prev => {
                              const updated = [...prev.affiliations];
                              updated[affIdx].branch = val;
                              return { ...prev, affiliations: updated };
                            });
                          }}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white font-semibold"
                        >
                          {chambers.map(c => (
                            <option key={c.id} value={c.id}>
                              {c.hospital_name ? `${c.hospital_name} - ${c.name}` : c.name} ({c.city})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-400 mb-1">Consultation Tag</label>
                        <select
                          value={aff.consultation_type}
                          onChange={e => {
                            const val = e.target.value;
                            setDoctorForm(prev => {
                              const updated = [...prev.affiliations];
                              updated[affIdx].consultation_type = val;
                              return { ...prev, affiliations: updated };
                            });
                          }}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white font-semibold"
                        >
                          <option value="OPD">OPD (Chamber Doctor)</option>
                          <option value="In-patient">In-patient (Hospital Doctor)</option>
                        </select>
                      </div>
                    </div>

                    {/* TASK 4: AUTO-CALCULATE DOCTOR CONSULTATION FEE */}
                    <div className="grid grid-cols-3 gap-2 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
                      <div>
                        <label className="block text-slate-400 text-[11px] mb-1">Original Fee</label>
                        <input
                          type="number"
                          placeholder="1500"
                          value={aff.original_fee || ''}
                          onChange={e => {
                            const val = e.target.value;
                            setDoctorForm(prev => {
                              const updated = [...prev.affiliations];
                              updated[affIdx].original_fee = val;
                              updated[affIdx].fee = calculateFinalPrice(val, updated[affIdx].discount) || updated[affIdx].fee;
                              return { ...prev, affiliations: updated };
                            });
                          }}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-white font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-400 text-[11px] mb-1">Discount Tag</label>
                        <input
                          type="text"
                          placeholder="20% OFF"
                          value={aff.discount || ''}
                          onChange={e => {
                            const val = e.target.value;
                            setDoctorForm(prev => {
                              const updated = [...prev.affiliations];
                              updated[affIdx].discount = val;
                              updated[affIdx].fee = calculateFinalPrice(updated[affIdx].original_fee, val) || updated[affIdx].fee;
                              return { ...prev, affiliations: updated };
                            });
                          }}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-teal-400 font-bold text-[11px] mb-1">Final Fee (BDT)</label>
                        <input
                          type="number"
                          required
                          value={aff.fee}
                          onChange={e => {
                            const val = e.target.value;
                            setDoctorForm(prev => {
                              const updated = [...prev.affiliations];
                              updated[affIdx].fee = val;
                              return { ...prev, affiliations: updated };
                            });
                          }}
                          className="w-full bg-slate-950 border border-teal-500/50 rounded px-2 py-1 text-teal-300 font-mono font-bold"
                        />
                      </div>
                    </div>

                    {/* Schedules inside Affiliation */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-bold text-slate-400">Visiting Days & Hours Schedule:</span>
                        <button
                          type="button"
                          onClick={() => handleAddScheduleRow(affIdx)}
                          className="text-[11px] text-teal-400 font-semibold hover:underline"
                        >
                          + Add Schedule Day
                        </button>
                      </div>

                      <div className="space-y-1.5">
                        {aff.schedules.map((sch, schIdx) => (
                          <div key={schIdx} className="flex items-center gap-2">
                            <select
                              value={sch.day_of_week}
                              onChange={e => {
                                const val = e.target.value;
                                setDoctorForm(prev => {
                                  const updated = [...prev.affiliations];
                                  updated[affIdx].schedules[schIdx].day_of_week = val;
                                  return { ...prev, affiliations: updated };
                                });
                              }}
                              className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200 text-xs"
                            >
                              {['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Everyday'].map(d => (
                                <option key={d} value={d}>{d}</option>
                              ))}
                            </select>

                            <input
                              type="text"
                              placeholder="17:00"
                              value={sch.start_time}
                              onChange={e => {
                                const val = e.target.value;
                                setDoctorForm(prev => {
                                  const updated = [...prev.affiliations];
                                  updated[affIdx].schedules[schIdx].start_time = val;
                                  return { ...prev, affiliations: updated };
                                });
                              }}
                              className="w-20 bg-slate-900 border border-slate-800 rounded px-2 py-1 text-white font-mono text-xs"
                            />

                            <span className="text-slate-500 text-xs">to</span>

                            <input
                              type="text"
                              placeholder="21:00"
                              value={sch.end_time}
                              onChange={e => {
                                const val = e.target.value;
                                setDoctorForm(prev => {
                                  const updated = [...prev.affiliations];
                                  updated[affIdx].schedules[schIdx].end_time = val;
                                  return { ...prev, affiliations: updated };
                                });
                              }}
                              className="w-20 bg-slate-900 border border-slate-800 rounded px-2 py-1 text-white font-mono text-xs"
                            />

                            {aff.schedules.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveScheduleRow(affIdx, schIdx)}
                                className="text-rose-400 hover:text-rose-300 text-xs px-1"
                              >
                                &times;
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowDoctorModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl"
                >
                  Save Doctor Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- BASE PATHOLOGY TEST MODAL --- */}
      {showTestModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white">
              {editingTest ? 'Edit Pathology Base Test' : 'Add New Pathology Base Test'}
            </h3>
            
            <form onSubmit={handleSaveTest} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Test Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Complete Blood Count (CBC)"
                  value={testForm.name}
                  onChange={e => setTestForm({...testForm, name: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Category</label>
                <input
                  type="text"
                  required
                  placeholder="Routine Blood Profiles"
                  value={testForm.category}
                  onChange={e => setTestForm({...testForm, category: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Description</label>
                <textarea
                  rows="3"
                  value={testForm.description}
                  onChange={e => setTestForm({...testForm, description: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                ></textarea>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="f-req"
                  checked={testForm.fasting_required}
                  onChange={e => setTestForm({...testForm, fasting_required: e.target.checked})}
                  className="rounded text-teal-500"
                />
                <label htmlFor="f-req" className="text-slate-300 font-semibold">Fasting Required Before Test</label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowTestModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl"
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
