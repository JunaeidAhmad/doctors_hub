import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import { SPECIALTIES, HOSPITAL_CATEGORIES, DIAGNOSTIC_CENTER_CATEGORIES, HOSPITAL_SERVICES, DIAGNOSTIC_SERVICES, TEST_CATEGORIES, CITY_THANAS, LOCATIONS } from '../data/mockData';
import { 
  Users, Building2, TestTube, Calendar, Plus, Edit, Trash2, CheckCircle, 
  XCircle, Search, RefreshCw, AlertCircle, ShieldAlert, Sparkles, Clock, MapPin, Stethoscope, ChevronLeft, ChevronRight, Filter, Calculator, FlaskConical, Activity
} from 'lucide-react';

/**
 * Helper to auto-calculate price based on original price and discount input
 */
function calculateFinalPrice(origPriceStr, discountStr) {
  const orig = parseFloat(origPriceStr);
  if (isNaN(orig) || orig <= 0) return '';
  if (!discountStr || !discountStr.trim()) return orig.toString();

  const distTrim = discountStr.trim();
  const pctMatch = distTrim.match(/^(\d+(?:\.\d+)?)\s*%/);
  if (pctMatch) {
    const pct = parseFloat(pctMatch[1]);
    const finalPrice = Math.round(orig * (1 - pct / 100));
    return (finalPrice >= 0 ? finalPrice : 0).toString();
  }

  const flatMatch = distTrim.match(/^(\d+(?:\.\d+)?)/);
  if (flatMatch) {
    const flat = parseFloat(flatMatch[1]);
    const finalPrice = Math.round(orig - flat);
    return (finalPrice >= 0 ? finalPrice : 0).toString();
  }

  return orig.toString();
}

export default function AdminDashboardPage({ currentUser, onNavigate, onAdminLoggedIn }) {
  const navSliderRef = React.useRef(null);
  const [activeTab, setActiveTab] = useState('overview'); 
  // Tabs: 'overview' | 'hospitals' | 'diagnostics' | 'doctors' | 'doctor-specs' | 'hospital-specs' | 'diag-cats' | 'hosp-services' | 'diag-services' | 'tests' | 'test-cats' | 'branch-tests' | 'doc-bookings' | 'lab-bookings'

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Main Data States
  const [hospitals, setHospitals] = useState([]);
  const [diagnosticCenters, setDiagnosticCenters] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [tests, setTests] = useState([]);
  const [branchTests, setBranchTests] = useState([]);
  
  // Category & Metadata States
  const [doctorSpecialties, setDoctorSpecialties] = useState(SPECIALTIES);
  const [hospitalCategories, setHospitalCategories] = useState(HOSPITAL_CATEGORIES);
  const [diagnosticCategories, setDiagnosticCategories] = useState(DIAGNOSTIC_CENTER_CATEGORIES);
  const [hospitalServices, setHospitalServices] = useState(HOSPITAL_SERVICES);
  const [diagnosticServices, setDiagnosticServices] = useState(DIAGNOSTIC_SERVICES);
  const [testCategories, setTestCategories] = useState(TEST_CATEGORIES);
  
  // Bookings States
  const [doctorBookings, setDoctorBookings] = useState([]);
  const [labBookings, setLabBookings] = useState([]);

  // Category & Service CRUD Modals State
  const [showDoctorSpecModal, setShowDoctorSpecModal] = useState(false);
  const [editingDoctorSpec, setEditingDoctorSpec] = useState(null);
  const [doctorSpecForm, setDoctorSpecForm] = useState({ id: '', name: '', icon: 'Stethoscope', description: '' });

  const [showHospitalCatModal, setShowHospitalCatModal] = useState(false);
  const [editingHospitalCat, setEditingHospitalCat] = useState(null);
  const [hospitalCatForm, setHospitalCatForm] = useState({ id: '', name: '', icon: 'Building2', description: '', count: 0 });

  const [showDiagCatModal, setShowDiagCatModal] = useState(false);
  const [editingDiagCat, setEditingDiagCat] = useState(null);
  const [diagCatForm, setDiagCatForm] = useState({ id: '', name: '', icon: 'Building2', description: '' });

  const [showHospServiceModal, setShowHospServiceModal] = useState(false);
  const [editingHospService, setEditingHospService] = useState(null);
  const [hospServiceForm, setHospServiceForm] = useState({ id: '', name: '', icon: 'Activity', description: '' });

  const [showDiagServiceModal, setShowDiagServiceModal] = useState(false);
  const [editingDiagService, setEditingDiagService] = useState(null);
  const [diagServiceForm, setDiagServiceForm] = useState({ id: '', name: '', icon: 'FlaskConical', description: '' });

  const [showTestCatModal, setShowTestCatModal] = useState(false);
  const [editingTestCat, setEditingTestCat] = useState(null);
  const [testCatForm, setTestCatForm] = useState({ id: '', name: '', icon: 'FlaskConical', description: '', count: 0 });

  // Branch Test Filters
  const [branchTestBranchFilter, setBranchTestBranchFilter] = useState('');
  const [branchTestTestFilter, setBranchTestTestFilter] = useState('');

  // Hospital Modal State
  const [showHospitalModal, setShowHospitalModal] = useState(false);
  const [editingHospital, setEditingHospital] = useState(null);
  const [hospitalForm, setHospitalForm] = useState({
    id: '',
    name: 'Ibn Sina Healthcare Group',
    city: 'Dhaka',
    branch: 'Dhanmondi',
    isCustomBranch: false,
    customBranch: '',
    category_id: '',
    service_ids: [],
    address: 'House 48, Road 9/A, Dhanmondi',
    phone: '+880 9610-010615',
    email: 'info@ibnsina.com.bd',
    rating: 4.9,
    reviews_count: 320,
    open_timing: '24/7 Inpatient & OPD',
    tagline: 'Premier Multispecialty OPD & Inpatient Hospital in Dhanmondi',
    badge: 'Super Partner',
    logo: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=600&q=80',
    image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=600&q=80',
    description: 'Leading hospital offering inpatient and OPD consultation.',
    is_verified: true
  });

  // Diagnostic Center / Branch Modal State
  const [showDiagnosticModal, setShowDiagnosticModal] = useState(false);
  const [editingDiagnostic, setEditingDiagnostic] = useState(null);
  const [diagnosticForm, setDiagnosticForm] = useState({
    id: '',
    name: 'Popular Diagnostic Centre',
    city: 'Dhaka',
    district: 'Dhaka',
    branch: 'Panthapath',
    isCustomBranch: false,
    customBranch: '',
    category_id: '',
    service_ids: [],
    address: 'House 16, Road 2, Dhanmondi / Panthapath',
    phone: '+880 9613-787801',
    email: 'info@populardiagnostic.com',
    rating: 4.85,
    reviews_count: 410,
    open_timing: '07:00 AM - 11:00 PM',
    tagline: 'Nationwide Leading Diagnostic & Imaging Hub',
    badge: 'Verified Partner',
    logo: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=600&q=80',
    image: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=600&q=80',
    description: 'State-of-the-art diagnostic imaging and visiting doctor chambers.',
    is_verified: true
  });

  // Doctor Modal state
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [doctorForm, setDoctorForm] = useState({
    id: '',
    name: '',
    qualification: '',
    experience: '10+ Yrs Exp.',
    selectedSpecialties: [],
    affiliations: []
  });

  // Test Modal state
  const [showTestModal, setShowTestModal] = useState(false);
  const [editingTest, setEditingTest] = useState(null);
  const [testForm, setTestForm] = useState({
    id: '', name: '', category: '', fasting_required: false, description: ''
  });

  // Branch Test Pricing Modal state
  const [showBranchTestModal, setShowBranchTestModal] = useState(false);
  const [editingBranchTest, setEditingBranchTest] = useState(null);
  const [branchTestForm, setBranchTestForm] = useState({
    id: '',
    center: '',
    test: '',
    original_price: '700',
    discount: '25% OFF',
    price: '525',
    report_delivery_date: new Date().toISOString().split('T')[0],
    report_time_slot: '05:00 PM - 09:00 PM'
  });

  // Dedicated Admin Login State
  const [adminPhone, setAdminPhone] = useState('01700000000');
  const [adminPassword, setAdminPassword] = useState('admin123456');
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
      const [
        hospsData, diagsData, docsData, testsData, specsData, 
        branchTestsData, hospCatsData, diagCatsData, hospServsData, diagServsData, testCatsData
      ] = await Promise.all([
        api.getHospitals().catch(() => []),
        api.getDiagnosticCenters().catch(() => []),
        api.getDoctors().catch(() => []),
        api.getTests().catch(() => []),
        api.getSpecialties().catch(() => []),
        api.getDiagnosticCenterTests().catch(() => []),
        api.getHospitalCategories().catch(() => []),
        api.getDiagnosticCenterCategories().catch(() => []),
        api.getHospitalServices().catch(() => []),
        api.getDiagnosticServices().catch(() => []),
        api.getTestCategories().catch(() => [])
      ]);

      setHospitals(hospsData || []);
      setDiagnosticCenters(diagsData || []);
      setDoctors(docsData || []);
      setTests(testsData || []);
      if (Array.isArray(specsData) && specsData.length > 0) setDoctorSpecialties(specsData);
      setBranchTests(branchTestsData || []);
      if (Array.isArray(hospCatsData) && hospCatsData.length > 0) setHospitalCategories(hospCatsData);
      if (Array.isArray(diagCatsData) && diagCatsData.length > 0) setDiagnosticCategories(diagCatsData);
      if (Array.isArray(hospServsData) && hospServsData.length > 0) setHospitalServices(hospServsData);
      if (Array.isArray(diagServsData) && diagServsData.length > 0) setDiagnosticServices(diagServsData);
      if (Array.isArray(testCatsData) && testCatsData.length > 0) setTestCategories(testCatsData);

      if (isStaff) {
        try {
          const [docBks, labBks] = await Promise.all([
            api.getDoctorBookings().catch(() => []),
            api.getLabBookings().catch(() => [])
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

  // --- HOSPITAL CRUD HANDLERS ---
  const handleOpenHospitalModal = (h = null) => {
    if (h) {
      setEditingHospital(h);
      const catIds = Array.isArray(h.categories) ? h.categories.map(c => c.id || c) : [];
      const srvIds = Array.isArray(h.services) ? h.services.map(s => s.id || s) : [];
      const cityName = h.city || h.district || 'Dhaka';
      const cityThanas = CITY_THANAS[cityName] || CITY_THANAS['Dhaka'];
      const rawBranch = h.branch ? h.branch.replace(/ branch$/i, '') : '';
      const isCustom = rawBranch && !cityThanas.includes(rawBranch);

      setHospitalForm({
        id: h.id,
        name: h.name,
        city: cityName,
        branch: isCustom ? 'Other' : (rawBranch || cityThanas[0]),
        isCustomBranch: isCustom,
        customBranch: isCustom ? rawBranch : '',
        category_id: catIds[0] || (hospitalCategories[0] ? hospitalCategories[0].id : ''),
        service_ids: srvIds,
        address: h.address || '',
        district: cityName,
        division: h.division || 'Dhaka',
        phone: h.phone || '',
        email: h.email || '',
        rating: h.rating || 4.8,
        reviews_count: h.reviews_count || 50,
        open_timing: h.open_timing || '24/7 Inpatient & OPD',
        tagline: h.tagline || '',
        badge: h.badge || 'Verified Partner',
        logo: h.logo || 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=600&q=80',
        image: h.image || 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=600&q=80',
        description: h.description || '',
        is_verified: h.is_verified ?? true
      });
    } else {
      setEditingHospital(null);
      setHospitalForm({
        id: '',
        name: 'Ibn Sina Healthcare Group',
        city: 'Dhaka',
        branch: CITY_THANAS['Dhaka'][0],
        isCustomBranch: false,
        customBranch: '',
        category_id: hospitalCategories[0] ? hospitalCategories[0].id : '',
        service_ids: hospitalServices.slice(0, 3).map(s => s.id),
        address: 'House 48, Road 9/A, Dhanmondi',
        district: 'Dhaka',
        division: 'Dhaka',
        phone: '+880 9610-010615',
        email: 'info@ibnsina.com.bd',
        rating: 4.9,
        reviews_count: 320,
        open_timing: '24/7 Inpatient & OPD',
        tagline: 'Premier Multispecialty OPD & Inpatient Hospital in Dhanmondi',
        badge: 'Super Partner',
        logo: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=600&q=80',
        image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=600&q=80',
        description: 'Leading hospital offering inpatient and OPD consultation.',
        is_verified: true
      });
    }
    setShowHospitalModal(true);
  };

  const toggleHospitalServiceSelection = (srvId) => {
    setHospitalForm(prev => {
      const exists = prev.service_ids.includes(srvId);
      const updated = exists ? prev.service_ids.filter(id => id !== srvId) : [...prev.service_ids, srvId];
      return { ...prev, service_ids: updated };
    });
  };

  const handleSaveHospital = async (e) => {
    e.preventDefault();
    try {
      const finalBranch = hospitalForm.isCustomBranch ? hospitalForm.customBranch : (hospitalForm.branch ? `${hospitalForm.branch} Branch` : 'Main Branch');
      const payload = {
        name: hospitalForm.name,
        branch: finalBranch,
        city: hospitalForm.city,
        district: hospitalForm.city,
        division: hospitalForm.division,
        category_ids: hospitalForm.category_id ? [hospitalForm.category_id] : [],
        service_ids: hospitalForm.service_ids,
        address: hospitalForm.address,
        phone: hospitalForm.phone,
        email: hospitalForm.email,
        rating: parseFloat(hospitalForm.rating) || 4.8,
        reviews_count: parseInt(hospitalForm.reviews_count, 10) || 50,
        open_timing: hospitalForm.open_timing,
        tagline: hospitalForm.tagline,
        badge: hospitalForm.badge,
        logo: hospitalForm.logo,
        image: hospitalForm.image,
        description: hospitalForm.description,
        is_verified: hospitalForm.is_verified
      };

      if (editingHospital) {
        await api.updateHospital(editingHospital.id, payload);
        showNotification(`Hospital "${payload.name} (${payload.branch})" updated!`);
      } else {
        await api.createHospital(payload);
        showNotification(`Hospital "${payload.name} (${payload.branch})" created!`);
      }
      setShowHospitalModal(false);
      loadAllData();
    } catch (err) {
      alert(`Error saving hospital: ${err.message}`);
    }
  };

  const handleDeleteHospital = async (id, name) => {
    if (!window.confirm(`Delete hospital "${name}"?`)) return;
    try {
      await api.deleteHospital(id);
      showNotification(`Hospital "${name}" removed.`);
      loadAllData();
    } catch (err) {
      alert(`Error deleting hospital: ${err.message}`);
    }
  };

  // --- DIAGNOSTIC CENTER / BRANCH CRUD HANDLERS (TASK 1, 3, 4, 6) ---
  const handleOpenDiagnosticModal = (dc = null) => {
    if (dc) {
      setEditingDiagnostic(dc);
      const catIds = Array.isArray(dc.categories) ? dc.categories.map(c => c.id || c) : [];
      const srvIds = Array.isArray(dc.services) ? dc.services.map(s => s.id || s) : [];
      const distName = dc.district || dc.city || 'Dhaka';
      const cityThanas = CITY_THANAS[distName] || CITY_THANAS['Dhaka'];
      const rawBranch = dc.branch ? dc.branch.replace(/ branch$/i, '') : '';
      const isCustom = rawBranch && !cityThanas.includes(rawBranch);

      setDiagnosticForm({
        id: dc.id,
        name: dc.name,
        city: distName,
        district: distName,
        branch: isCustom ? 'Other' : (rawBranch || cityThanas[0]),
        isCustomBranch: isCustom,
        customBranch: isCustom ? rawBranch : '',
        category_id: catIds[0] || (diagnosticCategories[0] ? diagnosticCategories[0].id : ''),
        service_ids: srvIds,
        address: dc.address || '',
        division: dc.division || 'Dhaka',
        phone: dc.phone || '',
        email: dc.email || '',
        rating: dc.rating || 4.85,
        reviews_count: dc.reviews_count || 100,
        open_timing: dc.open_timing || '07:00 AM - 11:00 PM',
        tagline: dc.tagline || '',
        badge: dc.badge || 'Verified Partner',
        logo: dc.logo || 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=600&q=80',
        image: dc.image || 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=600&q=80',
        description: dc.description || '',
        is_verified: dc.is_verified ?? true
      });
    } else {
      setEditingDiagnostic(null);
      setDiagnosticForm({
        id: '',
        name: 'Popular Diagnostic Centre',
        city: 'Dhaka',
        district: 'Dhaka',
        branch: CITY_THANAS['Dhaka'][0],
        isCustomBranch: false,
        customBranch: '',
        category_id: diagnosticCategories[0] ? diagnosticCategories[0].id : '',
        service_ids: diagnosticServices.slice(0, 3).map(s => s.id),
        address: 'House 16, Road 2, Dhanmondi / Panthapath',
        division: 'Dhaka',
        phone: '+880 9613-787801',
        email: 'info@populardiagnostic.com',
        rating: 4.85,
        reviews_count: 410,
        open_timing: '07:00 AM - 11:00 PM',
        tagline: 'Nationwide Leading Diagnostic & Imaging Hub',
        badge: 'Verified Partner',
        logo: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=600&q=80',
        image: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=600&q=80',
        description: 'State-of-the-art diagnostic imaging and visiting doctor chambers.',
        is_verified: true
      });
    }
    setShowDiagnosticModal(true);
  };

  const toggleDiagnosticServiceSelection = (srvId) => {
    setDiagnosticForm(prev => {
      const exists = prev.service_ids.includes(srvId);
      const updated = exists ? prev.service_ids.filter(id => id !== srvId) : [...prev.service_ids, srvId];
      return { ...prev, service_ids: updated };
    });
  };

  const handleSaveDiagnostic = async (e) => {
    e.preventDefault();
    try {
      const finalBranch = diagnosticForm.isCustomBranch ? diagnosticForm.customBranch : (diagnosticForm.branch ? `${diagnosticForm.branch} Branch` : 'Main Branch');
      const payload = {
        name: diagnosticForm.name,
        branch: finalBranch,
        district: diagnosticForm.city,
        division: diagnosticForm.division,
        category_ids: diagnosticForm.category_id ? [diagnosticForm.category_id] : [],
        service_ids: diagnosticForm.service_ids,
        address: diagnosticForm.address,
        phone: diagnosticForm.phone,
        email: diagnosticForm.email,
        rating: parseFloat(diagnosticForm.rating) || 4.85,
        reviews_count: parseInt(diagnosticForm.reviews_count, 10) || 100,
        open_timing: diagnosticForm.open_timing,
        tagline: diagnosticForm.tagline,
        badge: diagnosticForm.badge,
        logo: diagnosticForm.logo,
        image: diagnosticForm.image,
        description: diagnosticForm.description,
        is_verified: diagnosticForm.is_verified
      };

      if (editingDiagnostic) {
        await api.updateDiagnosticCenter(editingDiagnostic.id, payload);
        showNotification(`Diagnostic Center "${payload.name} (${payload.branch})" updated!`);
      } else {
        await api.createDiagnosticCenter(payload);
        showNotification(`Diagnostic Center "${payload.name} (${payload.branch})" created!`);
      }
      setShowDiagnosticModal(false);
      loadAllData();
    } catch (err) {
      alert(`Error saving diagnostic center: ${err.message}`);
    }
  };

  const handleDeleteDiagnostic = async (id, name) => {
    if (!window.confirm(`Delete Diagnostic Center "${name}"?`)) return;
    try {
      await api.deleteDiagnosticCenter(id);
      showNotification(`Diagnostic Center "${name}" removed.`);
      loadAllData();
    } catch (err) {
      alert(`Error deleting center: ${err.message}`);
    }
  };

  // --- DOCTOR CRUD HANDLERS ---
  const handleOpenDoctorModal = (doc = null) => {
    if (doc) {
      setEditingDoctor(doc);
      const specIds = Array.isArray(doc.specialties) 
        ? doc.specialties.map(s => s.id || s)
        : [];

      const affs = Array.isArray(doc.affiliations) && doc.affiliations.length > 0
        ? doc.affiliations.map(a => ({
            hospital: a.hospital?.id || a.hospital || null,
            diagnostic_center: a.diagnostic_center?.id || a.diagnostic_center || null,
            consultation_type: a.consultation_type || 'OPD',
            fee: a.fee || '1200',
            schedules: Array.isArray(a.schedules) ? a.schedules : []
          }))
        : [];

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
        id: '',
        name: '',
        qualification: 'MBBS, FCPS (Medicine)',
        experience: '12+ Yrs Exp.',
        selectedSpecialties: doctorSpecialties[0] ? [doctorSpecialties[0].id] : [],
        affiliations: [
          {
            hospital: hospitals[0]?.id || null,
            diagnostic_center: null,
            consultation_type: 'OPD',
            fee: '1200',
            schedules: [{ day_of_week: 'Sat', start_time: '17:00', end_time: '21:00' }]
          }
        ]
      });
    }
    setShowDoctorModal(true);
  };

  const handleSaveDoctor = async (e) => {
    e.preventDefault();
    try {
      const payload = {
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
        showNotification(`Doctor "${payload.name}" updated!`);
      } else {
        await api.createDoctor(payload);
        showNotification(`Doctor "${payload.name}" added!`);
      }
      setShowDoctorModal(false);
      loadAllData();
    } catch (err) {
      alert(`Error saving doctor: ${err.message}`);
    }
  };

  const handleDeleteDoctor = async (id, name) => {
    if (!window.confirm(`Remove Dr. ${name}?`)) return;
    try {
      await api.deleteDoctor(id);
      showNotification(`Dr. ${name} removed.`);
      loadAllData();
    } catch (err) {
      alert(`Failed to delete doctor: ${err.message}`);
    }
  };

  // --- CATEGORIES & SERVICES CRUD HANDLERS ---
  const handleOpenDoctorSpecModal = (s = null) => {
    if (s) {
      setEditingDoctorSpec(s);
      setDoctorSpecForm({ id: s.id, name: s.name, icon: s.icon || 'Stethoscope', description: s.description || '' });
    } else {
      setEditingDoctorSpec(null);
      setDoctorSpecForm({ id: '', name: '', icon: 'Stethoscope', description: '' });
    }
    setShowDoctorSpecModal(true);
  };

  const handleSaveDoctorSpec = async (e) => {
    e.preventDefault();
    try {
      if (editingDoctorSpec) {
        await api.updateSpecialty(editingDoctorSpec.id, doctorSpecForm);
        showNotification(`Specialty "${doctorSpecForm.name}" updated.`);
      } else {
        await api.createSpecialty(doctorSpecForm);
        showNotification(`Specialty "${doctorSpecForm.name}" created.`);
      }
      setShowDoctorSpecModal(false);
      loadAllData();
    } catch (err) {
      alert(`Error saving specialty: ${err.message}`);
    }
  };

  const handleDeleteDoctorSpec = async (id, name) => {
    if (!window.confirm(`Delete Doctor Specialty "${name}"?`)) return;
    try {
      await api.deleteSpecialty(id);
      showNotification(`Doctor Specialty "${name}" deleted.`);
      loadAllData();
    } catch (err) {
      alert(`Error deleting specialty: ${err.message}`);
    }
  };

  const handleOpenHospitalCatModal = (hc = null) => {
    if (hc) {
      setEditingHospitalCat(hc);
      setHospitalCatForm({ id: hc.id, name: hc.name, icon: hc.icon || 'Building2', description: hc.description || '', count: hc.count || 0 });
    } else {
      setEditingHospitalCat(null);
      setHospitalCatForm({ id: '', name: '', icon: 'Building2', description: '', count: 0 });
    }
    setShowHospitalCatModal(true);
  };

  const handleSaveHospitalCat = async (e) => {
    e.preventDefault();
    try {
      if (editingHospitalCat) {
        await api.updateHospitalCategory(editingHospitalCat.id, hospitalCatForm);
        showNotification(`Hospital Category "${hospitalCatForm.name}" updated.`);
      } else {
        await api.createHospitalCategory(hospitalCatForm);
        showNotification(`Hospital Category "${hospitalCatForm.name}" created.`);
      }
      setShowHospitalCatModal(false);
      loadAllData();
    } catch (err) {
      alert(`Error saving category: ${err.message}`);
    }
  };

  const handleDeleteHospitalCat = async (id, name) => {
    if (!window.confirm(`Delete Hospital Category "${name}"?`)) return;
    try {
      await api.deleteHospitalCategory(id);
      showNotification(`Hospital Category "${name}" deleted.`);
      loadAllData();
    } catch (err) {
      alert(`Error deleting category: ${err.message}`);
    }
  };

  const handleOpenDiagCatModal = (dc = null) => {
    if (dc) {
      setEditingDiagCat(dc);
      setDiagCatForm({ id: dc.id, name: dc.name, icon: dc.icon || 'Building2', description: dc.description || '' });
    } else {
      setEditingDiagCat(null);
      setDiagCatForm({ id: '', name: '', icon: 'Building2', description: '' });
    }
    setShowDiagCatModal(true);
  };

  const handleSaveDiagCat = async (e) => {
    e.preventDefault();
    try {
      if (editingDiagCat) {
        await api.updateDiagnosticCenterCategory(editingDiagCat.id, diagCatForm);
        showNotification(`Diagnostic Category "${diagCatForm.name}" updated.`);
      } else {
        await api.createDiagnosticCenterCategory(diagCatForm);
        showNotification(`Diagnostic Category "${diagCatForm.name}" created.`);
      }
      setShowDiagCatModal(false);
      loadAllData();
    } catch (err) {
      alert(`Error saving category: ${err.message}`);
    }
  };

  const handleDeleteDiagCat = async (id, name) => {
    if (!window.confirm(`Delete Diagnostic Category "${name}"?`)) return;
    try {
      await api.deleteDiagnosticCenterCategory(id);
      showNotification(`Diagnostic Category "${name}" deleted.`);
      loadAllData();
    } catch (err) {
      alert(`Error deleting category: ${err.message}`);
    }
  };

  const handleOpenHospServiceModal = (hs = null) => {
    if (hs) {
      setEditingHospService(hs);
      setHospServiceForm({ id: hs.id, name: hs.name, icon: hs.icon || 'Activity', description: hs.description || '' });
    } else {
      setEditingHospService(null);
      setHospServiceForm({ id: '', name: '', icon: 'Activity', description: '' });
    }
    setShowHospServiceModal(true);
  };

  const handleSaveHospService = async (e) => {
    e.preventDefault();
    try {
      if (editingHospService) {
        await api.updateHospitalService(editingHospService.id, hospServiceForm);
        showNotification(`Hospital Service "${hospServiceForm.name}" updated.`);
      } else {
        await api.createHospitalService(hospServiceForm);
        showNotification(`Hospital Service "${hospServiceForm.name}" created.`);
      }
      setShowHospServiceModal(false);
      loadAllData();
    } catch (err) {
      alert(`Error saving service: ${err.message}`);
    }
  };

  const handleDeleteHospService = async (id, name) => {
    if (!window.confirm(`Delete Hospital Service "${name}"?`)) return;
    try {
      await api.deleteHospitalService(id);
      showNotification(`Hospital Service "${name}" deleted.`);
      loadAllData();
    } catch (err) {
      alert(`Error deleting service: ${err.message}`);
    }
  };

  const handleOpenDiagServiceModal = (ds = null) => {
    if (ds) {
      setEditingDiagService(ds);
      setDiagServiceForm({ id: ds.id, name: ds.name, icon: ds.icon || 'FlaskConical', description: ds.description || '' });
    } else {
      setEditingDiagService(null);
      setDiagServiceForm({ id: '', name: '', icon: 'FlaskConical', description: '' });
    }
    setShowDiagServiceModal(true);
  };

  const handleSaveDiagService = async (e) => {
    e.preventDefault();
    try {
      if (editingDiagService) {
        await api.updateDiagnosticService(editingDiagService.id, diagServiceForm);
        showNotification(`Diagnostic Service "${diagServiceForm.name}" updated.`);
      } else {
        await api.createDiagnosticService(diagServiceForm);
        showNotification(`Diagnostic Service "${diagServiceForm.name}" created.`);
      }
      setShowDiagServiceModal(false);
      loadAllData();
    } catch (err) {
      alert(`Error saving service: ${err.message}`);
    }
  };

  const handleDeleteDiagService = async (id, name) => {
    if (!window.confirm(`Delete Diagnostic Service "${name}"?`)) return;
    try {
      await api.deleteDiagnosticService(id);
      showNotification(`Diagnostic Service "${name}" deleted.`);
      loadAllData();
    } catch (err) {
      alert(`Error deleting service: ${err.message}`);
    }
  };

  // --- BRANCH TEST PRICING HANDLERS ---
  const handleOpenBranchTestModal = (bt = null) => {
    if (bt) {
      setEditingBranchTest(bt);
      setBranchTestForm({
        id: bt.id,
        center: bt.center?.id || bt.center || diagnosticCenters[0]?.id || '',
        test: bt.test?.id || bt.test || tests[0]?.id || '',
        original_price: bt.original_price ? bt.original_price.toString() : '700',
        discount: bt.discount || '25% OFF',
        price: bt.price ? bt.price.toString() : '525',
        report_delivery_date: new Date().toISOString().split('T')[0],
        report_time_slot: '05:00 PM - 09:00 PM'
      });
    } else {
      setEditingBranchTest(null);
      setBranchTestForm({
        id: '',
        center: diagnosticCenters[0]?.id || '',
        test: tests[0]?.id || '',
        original_price: '700',
        discount: '25% OFF',
        price: '525',
        report_delivery_date: new Date().toISOString().split('T')[0],
        report_time_slot: '05:00 PM - 09:00 PM'
      });
    }
    setShowBranchTestModal(true);
  };

  const handleSaveBranchTest = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        center: branchTestForm.center,
        test: branchTestForm.test,
        price: parseFloat(branchTestForm.price) || 0,
        original_price: branchTestForm.original_price ? parseFloat(branchTestForm.original_price) : null,
        discount: branchTestForm.discount,
        report_time: `${branchTestForm.report_delivery_date} | ${branchTestForm.report_time_slot}`
      };

      await api.createDiagnosticCenterTest(payload);
      showNotification("Diagnostic Center test pricing created/updated!");
      setShowBranchTestModal(false);
      loadAllData();
    } catch (err) {
      alert(`Error saving branch test: ${err.message}`);
    }
  };

  const handleDeleteBranchTest = async (id) => {
    if (!window.confirm("Remove this test offering?")) return;
    try {
      await api.deleteDiagnosticCenterTest(id);
      showNotification("Test offering removed.");
      loadAllData();
    } catch (err) {
      alert(`Failed to remove: ${err.message}`);
    }
  };

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
                placeholder="admin123456"
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

        {/* TASK 3: TOP NAVIGATION MENU TABS INCLUDING "Diagnostics & Branches" */}
        <div className="relative bg-slate-900/90 border border-slate-800/80 rounded-2xl p-2 shadow-xl backdrop-blur-md flex items-center gap-2">
          <button
            onClick={() => navSliderRef.current?.scrollBy({ left: -220, behavior: 'smooth' })}
            className="p-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-xl hidden sm:flex shrink-0 border border-slate-700/50"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div ref={navSliderRef} className="admin-sliding-bar flex items-center gap-2 overflow-x-auto scroll-smooth py-1 px-1 text-xs w-full">
            {[
              { id: 'overview', label: 'Overview', icon: Users },
              { id: 'hospitals', label: `Hospitals (${hospitals.length})`, icon: Building2 },
              { id: 'diagnostics', label: `Diagnostics & Branches (${diagnosticCenters.length})`, icon: FlaskConical },
              { id: 'doctors', label: `Specialist Doctors (${doctors.length})`, icon: Stethoscope },
              { id: 'doctor-specs', label: `Doctor Specialties (${doctorSpecialties.length})`, icon: Stethoscope },
              { id: 'hospital-specs', label: `Hospital Categories (${hospitalCategories.length})`, icon: Building2 },
              { id: 'diag-cats', label: `Diagnostics Categories (${diagnosticCategories.length})`, icon: FlaskConical },
              { id: 'hosp-services', label: `Hospital Services (${hospitalServices.length})`, icon: Activity },
              { id: 'diag-services', label: `Diagnostic Services (${diagnosticServices.length})`, icon: FlaskConical },
              { id: 'tests', label: `Add Test (${tests.length})`, icon: TestTube },
              { id: 'test-cats', label: `Test Categories (${testCategories.length})`, icon: TestTube },
              { id: 'branch-tests', label: `Diagnostic Test Prices (${branchTests.length})`, icon: Calculator },
              { id: 'doc-bookings', label: `Doctor Bookings (${doctorBookings.length})`, icon: Calendar },
              { id: 'lab-bookings', label: `Lab Bookings (${labBookings.length})`, icon: Calendar },
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); setSearchTerm(''); }}
                  className={`px-4 py-2.5 font-bold rounded-xl border flex items-center gap-2 transition-all whitespace-nowrap shadow-sm ${
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
            className="p-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-xl hidden sm:flex shrink-0 border border-slate-700/50"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* 0. OVERVIEW DASHBOARD TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            
            {/* Header Banner & Quick Actions */}
            <div className="bg-gradient-to-r from-slate-900 via-teal-950/40 to-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-500/30 text-teal-400 text-xs font-bold uppercase tracking-wider mb-2">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Admin Operations Command</span>
                </div>
                <h2 className="text-2xl font-black text-white">Healthcare System Overview</h2>
                <p className="text-xs text-slate-400 mt-1">Real-time stats across Hospitals, Diagnostics & Branches, Services, Doctors & Pathology test pricing.</p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  onClick={() => handleOpenHospitalModal()}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Hospital
                </button>
                <button
                  onClick={() => handleOpenDiagnosticModal()}
                  className="px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Diagnostics / Branch
                </button>
                <button
                  onClick={() => handleOpenDoctorModal()}
                  className="px-3.5 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Doctor
                </button>
              </div>
            </div>

            {/* Metrics Overview Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                <div className="flex items-center justify-between text-emerald-400 mb-2">
                  <Building2 className="w-5 h-5" />
                  <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">Hospitals</span>
                </div>
                <div className="text-2xl font-black text-white">{hospitals.length}</div>
                <div className="text-xs text-slate-400 font-semibold mt-1">Hospitals</div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                <div className="flex items-center justify-between text-cyan-400 mb-2">
                  <FlaskConical className="w-5 h-5" />
                  <span className="text-[10px] font-bold bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded border border-cyan-500/30">Diagnostics</span>
                </div>
                <div className="text-2xl font-black text-white">{diagnosticCenters.length}</div>
                <div className="text-xs text-slate-400 font-semibold mt-1">Diagnostic Branches</div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                <div className="flex items-center justify-between text-teal-400 mb-2">
                  <Stethoscope className="w-5 h-5" />
                  <span className="text-[10px] font-bold bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded border border-teal-500/30">Doctors</span>
                </div>
                <div className="text-2xl font-black text-white">{doctors.length}</div>
                <div className="text-xs text-slate-400 font-semibold mt-1">Specialist Doctors</div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                <div className="flex items-center justify-between text-amber-400 mb-2">
                  <TestTube className="w-5 h-5" />
                  <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">Tests</span>
                </div>
                <div className="text-2xl font-black text-white">{tests.length}</div>
                <div className="text-xs text-slate-400 font-semibold mt-1">Base Tests</div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                <div className="flex items-center justify-between text-indigo-400 mb-2">
                  <Calendar className="w-5 h-5" />
                  <span className="text-[10px] font-bold bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/30">Doctor Bks</span>
                </div>
                <div className="text-2xl font-black text-white">{doctorBookings.length}</div>
                <div className="text-xs text-slate-400 font-semibold mt-1">Doctor Serials</div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                <div className="flex items-center justify-between text-purple-400 mb-2">
                  <Calendar className="w-5 h-5" />
                  <span className="text-[10px] font-bold bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded border border-purple-500/30">Lab Bks</span>
                </div>
                <div className="text-2xl font-black text-white">{labBookings.length}</div>
                <div className="text-xs text-slate-400 font-semibold mt-1">Lab Pickups</div>
              </div>
            </div>

            {/* CATEGORIES & SERVICES OVERVIEW CARDS (EXACT USER DIRECTIVE: ROW 1 HAS 3 CARDS, ROW 2 HAS 2 CARDS!) */}
            <div className="space-y-6">
              
              {/* ROW 1: 3 CARDS (Doctor Specialties, Hospital Categories, Diagnostics Categories) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* 1. Doctor Specialties Card */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-lg">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2 font-bold text-white text-sm">
                      <Stethoscope className="w-4 h-4 text-teal-400" />
                      <span>Doctor Specialties ({doctorSpecialties.length})</span>
                    </div>
                    <button
                      onClick={() => handleOpenDoctorSpecModal()}
                      className="text-[11px] font-bold text-teal-400 hover:underline flex items-center gap-1 bg-teal-500/10 px-2.5 py-1 rounded-lg border border-teal-500/20"
                    >
                      <Plus className="w-3 h-3" /> Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1">
                    {doctorSpecialties.map(s => (
                      <span key={s.id} className="text-[11px] bg-slate-800/80 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-700/80 font-medium flex items-center gap-1">
                        <span>{s.name}</span>
                        <button onClick={() => handleOpenDoctorSpecModal(s)} className="text-slate-400 hover:text-teal-400 ml-1" title="Edit Specialty">
                          <Edit className="w-3 h-3" />
                        </button>
                        <button onClick={() => handleDeleteDoctorSpec(s.id, s.name)} className="text-slate-400 hover:text-rose-400 ml-0.5" title="Delete Specialty">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* 2. Hospital Categories Card */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-lg">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2 font-bold text-white text-sm">
                      <Building2 className="w-4 h-4 text-emerald-400" />
                      <span>Hospital Categories ({hospitalCategories.length})</span>
                    </div>
                    <button
                      onClick={() => handleOpenHospitalCatModal()}
                      className="text-[11px] font-bold text-emerald-400 hover:underline flex items-center gap-1 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20"
                    >
                      <Plus className="w-3 h-3" /> Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1">
                    {hospitalCategories.map(hc => (
                      <span key={hc.id} className="text-[11px] bg-slate-800/80 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-700/80 font-medium flex items-center gap-1">
                        <span>{hc.name}</span>
                        <button onClick={() => handleOpenHospitalCatModal(hc)} className="text-slate-400 hover:text-emerald-400 ml-1" title="Edit Category">
                          <Edit className="w-3 h-3" />
                        </button>
                        <button onClick={() => handleDeleteHospitalCat(hc.id, hc.name)} className="text-slate-400 hover:text-rose-400 ml-0.5" title="Delete Category">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* 3. Diagnostics Categories Card */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-lg">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2 font-bold text-white text-sm">
                      <FlaskConical className="w-4 h-4 text-cyan-400" />
                      <span>Diagnostics Categories ({diagnosticCategories.length})</span>
                    </div>
                    <button
                      onClick={() => handleOpenDiagCatModal()}
                      className="text-[11px] font-bold text-cyan-400 hover:underline flex items-center gap-1 bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/20"
                    >
                      <Plus className="w-3 h-3" /> Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1">
                    {diagnosticCategories.map(dc => (
                      <span key={dc.id} className="text-[11px] bg-slate-800/80 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-700/80 font-medium flex items-center gap-1">
                        <span>{dc.name}</span>
                        <button onClick={() => handleOpenDiagCatModal(dc)} className="text-slate-400 hover:text-cyan-400 ml-1" title="Edit Category">
                          <Edit className="w-3 h-3" />
                        </button>
                        <button onClick={() => handleDeleteDiagCat(dc.id, dc.name)} className="text-slate-400 hover:text-rose-400 ml-0.5" title="Delete Category">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

              </div>

              {/* ROW 2: 2 CARDS (Hospital Services & Diagnostic Services) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* 1. Hospital Services Card */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-lg">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2 font-bold text-white text-sm">
                      <Activity className="w-4 h-4 text-amber-400" />
                      <span>Hospital Services ({hospitalServices.length})</span>
                    </div>
                    <button
                      onClick={() => handleOpenHospServiceModal()}
                      className="text-[11px] font-bold text-amber-400 hover:underline flex items-center gap-1 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20"
                    >
                      <Plus className="w-3 h-3" /> Add Service
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1">
                    {hospitalServices.map(hs => (
                      <span key={hs.id} className="text-[11px] bg-slate-800/80 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-700/80 font-medium flex items-center gap-1">
                        <span>{hs.name}</span>
                        <button onClick={() => handleOpenHospServiceModal(hs)} className="text-slate-400 hover:text-amber-400 ml-1" title="Edit Service">
                          <Edit className="w-3 h-3" />
                        </button>
                        <button onClick={() => handleDeleteHospService(hs.id, hs.name)} className="text-slate-400 hover:text-rose-400 ml-0.5" title="Delete Service">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* 2. Diagnostic Services Card */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-lg">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2 font-bold text-white text-sm">
                      <FlaskConical className="w-4 h-4 text-purple-400" />
                      <span>Diagnostic Services ({diagnosticServices.length})</span>
                    </div>
                    <button
                      onClick={() => handleOpenDiagServiceModal()}
                      className="text-[11px] font-bold text-purple-400 hover:underline flex items-center gap-1 bg-purple-500/10 px-2.5 py-1 rounded-lg border border-purple-500/20"
                    >
                      <Plus className="w-3 h-3" /> Add Service
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1">
                    {diagnosticServices.map(ds => (
                      <span key={ds.id} className="text-[11px] bg-slate-800/80 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-700/80 font-medium flex items-center gap-1">
                        <span>{ds.name}</span>
                        <button onClick={() => handleOpenDiagServiceModal(ds)} className="text-slate-400 hover:text-purple-400 ml-1" title="Edit Service">
                          <Edit className="w-3 h-3" />
                        </button>
                        <button onClick={() => handleDeleteDiagService(ds.id, ds.name)} className="text-slate-400 hover:text-rose-400 ml-0.5" title="Delete Service">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

              </div>

            </div>

            {/* Quick Preview Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Doctor Bookings Table Preview */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <h3 className="font-bold text-white text-sm flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-teal-400" /> Recent Doctor Bookings
                  </h3>
                  <button onClick={() => setActiveTab('doc-bookings')} className="text-xs font-bold text-teal-400 hover:underline">
                    View All &rarr;
                  </button>
                </div>
                {doctorBookings.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4 text-center">No doctor bookings recorded yet.</p>
                ) : (
                  <div className="space-y-2">
                    {doctorBookings.slice(0, 4).map(b => (
                      <div key={b.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                        <div>
                          <div className="font-bold text-white">{b.patient_name}</div>
                          <div className="text-[10px] text-slate-400">{b.date} • {b.slot}</div>
                        </div>
                        <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-[10px] font-bold">
                          {b.status || 'Confirmed'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Lab Bookings Table Preview */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <h3 className="font-bold text-white text-sm flex items-center gap-2">
                    <TestTube className="w-4 h-4 text-cyan-400" /> Recent Home Lab Pickups
                  </h3>
                  <button onClick={() => setActiveTab('lab-bookings')} className="text-xs font-bold text-cyan-400 hover:underline">
                    View All &rarr;
                  </button>
                </div>
                {labBookings.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4 text-center">No lab bookings recorded yet.</p>
                ) : (
                  <div className="space-y-2">
                    {labBookings.slice(0, 4).map(b => (
                      <div key={b.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                        <div>
                          <div className="font-bold text-white">{b.patient_name} (+880 {b.patient_phone})</div>
                          <div className="text-[10px] text-slate-400">Pickup: {b.pickup_date}</div>
                        </div>
                        <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded text-[10px] font-bold">
                          {b.status || 'Confirmed'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

          </div>
        )}

        {/* 1. HOSPITALS TAB */}
        {activeTab === 'hospitals' && (
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
                onClick={() => handleOpenHospitalModal()}
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-emerald-600/20"
              >
                <Plus className="w-4 h-4" /> Add New Hospital Branch
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 text-[11px] uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4">Hospital Name</th>
                    <th className="py-3.5 px-4">Branch</th>
                    <th className="py-3.5 px-4">Services & Facilities</th>
                    <th className="py-3.5 px-4">Location & City</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {hospitals
                    .filter(h => `${h.name} ${h.branch} ${h.city}`.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map(h => (
                      <tr key={h.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-4 px-4 font-bold text-white">
                          <div className="text-sm text-emerald-400">{h.name}</div>
                          <div className="text-slate-400 text-[11px] font-normal">{h.tagline}</div>
                        </td>
                        <td className="py-4 px-4 font-bold text-teal-300">
                          {h.branch || 'Main Branch'}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex flex-wrap gap-1">
                            {(h.services || []).map((s, idx) => (
                              <span key={s.id || idx} className="px-2 py-0.5 bg-teal-500/20 text-teal-300 border border-teal-500/30 rounded text-[10px] font-bold">
                                {s.name || s}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-slate-200">{h.address}</div>
                          <div className="text-slate-400 font-bold">{h.city}</div>
                        </td>
                        <td className="py-4 px-4 text-right space-x-2 whitespace-nowrap">
                          <button onClick={() => handleOpenHospitalModal(h)} className="p-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDeleteHospital(h.id, h.name)} className="p-2 bg-rose-500/20 text-rose-400 rounded-lg hover:bg-rose-500/30">
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

        {/* TASK 3: DIAGNOSTICS & BRANCHES TAB */}
        {activeTab === 'diagnostics' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
              <div className="relative flex-1 min-w-[240px]">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search diagnostic center name or branch..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <button
                onClick={() => handleOpenDiagnosticModal()}
                className="flex items-center gap-2 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-cyan-600/20"
              >
                <Plus className="w-4 h-4" /> Add New Diagnostics / Branch
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 text-[11px] uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4">Diagnostic Center Name</th>
                    <th className="py-3.5 px-4">Branch</th>
                    <th className="py-3.5 px-4">Services & Facilities</th>
                    <th className="py-3.5 px-4">District / Division</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {diagnosticCenters
                    .filter(dc => `${dc.name} ${dc.branch} ${dc.district}`.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map(dc => (
                      <tr key={dc.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-4 px-4 font-bold text-white">
                          <div className="text-sm text-cyan-400">{dc.name}</div>
                          <div className="text-slate-400 text-[11px] font-normal">{dc.tagline}</div>
                        </td>
                        <td className="py-4 px-4 font-bold text-teal-300">
                          {dc.branch || 'Main Branch'}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex flex-wrap gap-1">
                            {(dc.services || []).map((s, idx) => (
                              <span key={s.id || idx} className="px-2 py-0.5 bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded text-[10px] font-bold">
                                {s.name || s}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-slate-200">{dc.address}</div>
                          <div className="text-slate-400 font-bold">{dc.district}</div>
                        </td>
                        <td className="py-4 px-4 text-right space-x-2 whitespace-nowrap">
                          <button onClick={() => handleOpenDiagnosticModal(dc)} className="p-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDeleteDiagnostic(dc.id, dc.name)} className="p-2 bg-rose-500/20 text-rose-400 rounded-lg hover:bg-rose-500/30">
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

      {/* MODAL: ADD / EDIT HOSPITAL (SERIALIZED CITY -> BRANCH DROPDOWN, CATEGORY DROPDOWN, SERVICES AT BOTTOM) */}
      {showHospitalModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-2xl w-full space-y-4 my-8 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white">
                {editingHospital ? 'Edit Hospital' : 'Add New Hospital Branch'}
              </h3>
              <button onClick={() => setShowHospitalModal(false)} className="text-slate-400 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveHospital} className="space-y-4 text-xs">
              
              {/* TASK 4: CATEGORY DROPDOWN */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Hospital Category *</label>
                <select
                  required
                  value={hospitalForm.category_id}
                  onChange={e => setHospitalForm({ ...hospitalForm, category_id: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white font-bold"
                >
                  <option value="">Select Hospital Category</option>
                  {hospitalCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Hospital Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ibn Sina Healthcare Group"
                  value={hospitalForm.name}
                  onChange={e => setHospitalForm({ ...hospitalForm, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-semibold"
                />
              </div>

              {/* TASK 3 & 1: SERIALIZED CITY FIRST, THEN BRANCH DROPDOWN (THANAS OF SELECTED CITY) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
                {/* 1. SELECT CITY FIRST */}
                <div>
                  <label className="block text-emerald-400 font-bold mb-1">Step 1: Select City *</label>
                  <select
                    required
                    value={hospitalForm.city}
                    onChange={e => {
                      const newCity = e.target.value;
                      const thanas = CITY_THANAS[newCity] || [];
                      setHospitalForm({
                        ...hospitalForm,
                        city: newCity,
                        district: newCity,
                        branch: thanas[0] || 'Main',
                        isCustomBranch: false,
                        customBranch: ''
                      });
                    }}
                    className="w-full bg-slate-900 border border-emerald-500/50 rounded-xl px-3 py-2 text-white font-bold"
                  >
                    {LOCATIONS.filter(l => l !== 'All Bangladesh').map(loc => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                </div>

                {/* 2. SELECT BRANCH DROPDOWN BASED ON SELECTED CITY */}
                <div>
                  <label className="block text-emerald-400 font-bold mb-1">Step 2: Select Branch (Thanas in {hospitalForm.city}) *</label>
                  <select
                    required
                    value={hospitalForm.isCustomBranch ? 'Other' : hospitalForm.branch}
                    onChange={e => {
                      const val = e.target.value;
                      if (val === 'Other') {
                        setHospitalForm({ ...hospitalForm, isCustomBranch: true, branch: 'Other' });
                      } else {
                        setHospitalForm({ ...hospitalForm, isCustomBranch: false, branch: val, customBranch: '' });
                      }
                    }}
                    className="w-full bg-slate-900 border border-emerald-500/50 rounded-xl px-3 py-2 text-white font-bold"
                  >
                    {(CITY_THANAS[hospitalForm.city] || []).map(th => (
                      <option key={th} value={th}>{th} Branch</option>
                    ))}
                    <option value="Other">+ Other (Custom Branch Name)</option>
                  </select>
                </div>

                {hospitalForm.isCustomBranch && (
                  <div className="md:col-span-2 mt-1">
                    <label className="block text-slate-300 font-semibold mb-1">Specify Custom Branch Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rampura Main Branch"
                      value={hospitalForm.customBranch}
                      onChange={e => setHospitalForm({ ...hospitalForm, customBranch: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Full Address</label>
                <input
                  type="text"
                  placeholder="e.g. House 48, Road 9/A, Dhanmondi"
                  value={hospitalForm.address}
                  onChange={e => setHospitalForm({ ...hospitalForm, address: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={hospitalForm.phone}
                    onChange={e => setHospitalForm({ ...hospitalForm, phone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Open Hours / Timing</label>
                  <input
                    type="text"
                    value={hospitalForm.open_timing}
                    onChange={e => setHospitalForm({ ...hospitalForm, open_timing: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Tagline</label>
                  <input
                    type="text"
                    value={hospitalForm.tagline}
                    onChange={e => setHospitalForm({ ...hospitalForm, tagline: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Badge Tag</label>
                  <input
                    type="text"
                    value={hospitalForm.badge}
                    onChange={e => setHospitalForm({ ...hospitalForm, badge: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Hospital Description</label>
                <textarea
                  rows="2"
                  value={hospitalForm.description}
                  onChange={e => setHospitalForm({ ...hospitalForm, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                ></textarea>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="hosp_verified"
                  checked={hospitalForm.is_verified}
                  onChange={e => setHospitalForm({ ...hospitalForm, is_verified: e.target.checked })}
                  className="w-4 h-4 text-emerald-500 rounded bg-slate-950 border-slate-800"
                />
                <label htmlFor="hosp_verified" className="text-slate-300 font-semibold cursor-pointer">Verified Hospital Partner</label>
              </div>

              {/* TASK 2: SERVICES & FACILITIES KEPT AT THE VERY BOTTOM OF THE FORM */}
              <div className="pt-2">
                <label className="block text-slate-300 font-semibold mb-1.5">Services & Facilities (Click to Select / Deselect) *</label>
                <div className="flex flex-wrap gap-2 p-3 bg-slate-950 border border-slate-800 rounded-xl max-h-44 overflow-y-auto">
                  {hospitalServices.map(srv => {
                    const isSelected = hospitalForm.service_ids.includes(srv.id);
                    return (
                      <button
                        key={srv.id}
                        type="button"
                        onClick={() => toggleHospitalServiceSelection(srv.id)}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 ${
                          isSelected 
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm shadow-emerald-500/20' 
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
                        }`}
                      >
                        <CheckCircle className={`w-3.5 h-3.5 ${isSelected ? 'opacity-100 text-emerald-400' : 'opacity-0'}`} />
                        <span>{srv.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button type="button" onClick={() => setShowHospitalModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 font-bold rounded-xl">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg">
                  Save Hospital
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT DIAGNOSTICS & BRANCH (SERIALIZED CITY -> BRANCH DROPDOWN, CATEGORY DROPDOWN, SERVICES AT BOTTOM) */}
      {showDiagnosticModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-2xl w-full space-y-4 my-8 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white">
                {editingDiagnostic ? 'Edit Diagnostic Center' : 'Add New Diagnostics / Branch'}
              </h3>
              <button onClick={() => setShowDiagnosticModal(false)} className="text-slate-400 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDiagnostic} className="space-y-4 text-xs">
              
              {/* TASK 4: CATEGORY DROPDOWN */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Diagnostic Category *</label>
                <select
                  required
                  value={diagnosticForm.category_id}
                  onChange={e => setDiagnosticForm({ ...diagnosticForm, category_id: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white font-bold"
                >
                  <option value="">Select Diagnostic Category</option>
                  {diagnosticCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Diagnostic Center Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Popular Diagnostic Centre"
                  value={diagnosticForm.name}
                  onChange={e => setDiagnosticForm({ ...diagnosticForm, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-semibold"
                />
              </div>

              {/* TASK 3 & 1: SERIALIZED CITY FIRST, THEN BRANCH DROPDOWN (THANAS OF SELECTED CITY) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
                {/* 1. SELECT CITY FIRST */}
                <div>
                  <label className="block text-cyan-400 font-bold mb-1">Step 1: Select City *</label>
                  <select
                    required
                    value={diagnosticForm.city}
                    onChange={e => {
                      const newCity = e.target.value;
                      const thanas = CITY_THANAS[newCity] || [];
                      setDiagnosticForm({
                        ...diagnosticForm,
                        city: newCity,
                        district: newCity,
                        branch: thanas[0] || 'Main',
                        isCustomBranch: false,
                        customBranch: ''
                      });
                    }}
                    className="w-full bg-slate-900 border border-cyan-500/50 rounded-xl px-3 py-2 text-white font-bold"
                  >
                    {LOCATIONS.filter(l => l !== 'All Bangladesh').map(loc => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                </div>

                {/* 2. SELECT BRANCH DROPDOWN BASED ON SELECTED CITY */}
                <div>
                  <label className="block text-cyan-400 font-bold mb-1">Step 2: Select Branch (Thanas in {diagnosticForm.city}) *</label>
                  <select
                    required
                    value={diagnosticForm.isCustomBranch ? 'Other' : diagnosticForm.branch}
                    onChange={e => {
                      const val = e.target.value;
                      if (val === 'Other') {
                        setDiagnosticForm({ ...diagnosticForm, isCustomBranch: true, branch: 'Other' });
                      } else {
                        setDiagnosticForm({ ...diagnosticForm, isCustomBranch: false, branch: val, customBranch: '' });
                      }
                    }}
                    className="w-full bg-slate-900 border border-cyan-500/50 rounded-xl px-3 py-2 text-white font-bold"
                  >
                    {(CITY_THANAS[diagnosticForm.city] || []).map(th => (
                      <option key={th} value={th}>{th} Branch</option>
                    ))}
                    <option value="Other">+ Other (Custom Branch Name)</option>
                  </select>
                </div>

                {diagnosticForm.isCustomBranch && (
                  <div className="md:col-span-2 mt-1">
                    <label className="block text-slate-300 font-semibold mb-1">Specify Custom Branch Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Panthapath Main Branch"
                      value={diagnosticForm.customBranch}
                      onChange={e => setDiagnosticForm({ ...diagnosticForm, customBranch: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Full Address</label>
                <input
                  type="text"
                  placeholder="e.g. House 16, Road 2, Dhanmondi / Panthapath"
                  value={diagnosticForm.address}
                  onChange={e => setDiagnosticForm({ ...diagnosticForm, address: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={diagnosticForm.phone}
                    onChange={e => setDiagnosticForm({ ...diagnosticForm, phone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Open Hours / Timing</label>
                  <input
                    type="text"
                    value={diagnosticForm.open_timing}
                    onChange={e => setDiagnosticForm({ ...diagnosticForm, open_timing: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Center Description</label>
                <textarea
                  rows="2"
                  value={diagnosticForm.description}
                  onChange={e => setDiagnosticForm({ ...diagnosticForm, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                ></textarea>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="diag_verified"
                  checked={diagnosticForm.is_verified}
                  onChange={e => setDiagnosticForm({ ...diagnosticForm, is_verified: e.target.checked })}
                  className="w-4 h-4 text-cyan-500 rounded bg-slate-950 border-slate-800"
                />
                <label htmlFor="diag_verified" className="text-slate-300 font-semibold cursor-pointer">Verified Diagnostic Partner</label>
              </div>

              {/* TASK 2: SERVICES & FACILITIES KEPT AT THE VERY BOTTOM OF THE FORM */}
              <div className="pt-2">
                <label className="block text-slate-300 font-semibold mb-1.5">Services & Facilities (Click to Select / Deselect) *</label>
                <div className="flex flex-wrap gap-2 p-3 bg-slate-950 border border-slate-800 rounded-xl max-h-44 overflow-y-auto">
                  {diagnosticServices.map(srv => {
                    const isSelected = diagnosticForm.service_ids.includes(srv.id);
                    return (
                      <button
                        key={srv.id}
                        type="button"
                        onClick={() => toggleDiagnosticServiceSelection(srv.id)}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 ${
                          isSelected 
                            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-sm shadow-cyan-500/20' 
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
                        }`}
                      >
                        <CheckCircle className={`w-3.5 h-3.5 ${isSelected ? 'opacity-100 text-cyan-400' : 'opacity-0'}`} />
                        <span>{srv.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button type="button" onClick={() => setShowDiagnosticModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 font-bold rounded-xl">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl shadow-lg">
                  Save Diagnostic Center
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DOCTOR SPECIALTY */}
      {showDoctorSpecModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4">
            <h3 className="text-base font-bold text-white">{editingDoctorSpec ? 'Edit Doctor Specialty' : 'Add Doctor Specialty'}</h3>
            <form onSubmit={handleSaveDoctorSpec} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Specialty Name *</label>
                <input type="text" required value={doctorSpecForm.name} onChange={e => setDoctorSpecForm({ ...doctorSpecForm, name: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowDoctorSpecModal(false)} className="px-3 py-1.5 bg-slate-800 text-slate-300 font-bold rounded-xl">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-teal-600 text-white font-bold rounded-xl">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: HOSPITAL CATEGORY */}
      {showHospitalCatModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4">
            <h3 className="text-base font-bold text-white">{editingHospitalCat ? 'Edit Hospital Category' : 'Add Hospital Category'}</h3>
            <form onSubmit={handleSaveHospitalCat} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Category Name *</label>
                <input type="text" required value={hospitalCatForm.name} onChange={e => setHospitalCatForm({ ...hospitalCatForm, name: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowHospitalCatModal(false)} className="px-3 py-1.5 bg-slate-800 text-slate-300 font-bold rounded-xl">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-emerald-600 text-white font-bold rounded-xl">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DIAGNOSTIC CATEGORY */}
      {showDiagCatModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4">
            <h3 className="text-base font-bold text-white">{editingDiagCat ? 'Edit Diagnostic Category' : 'Add Diagnostic Category'}</h3>
            <form onSubmit={handleSaveDiagCat} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Category Name *</label>
                <input type="text" required value={diagCatForm.name} onChange={e => setDiagCatForm({ ...diagCatForm, name: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowDiagCatModal(false)} className="px-3 py-1.5 bg-slate-800 text-slate-300 font-bold rounded-xl">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-cyan-600 text-white font-bold rounded-xl">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: HOSPITAL SERVICE */}
      {showHospServiceModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4">
            <h3 className="text-base font-bold text-white">{editingHospService ? 'Edit Hospital Service' : 'Add Hospital Service'}</h3>
            <form onSubmit={handleSaveHospService} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Service Name *</label>
                <input type="text" required value={hospServiceForm.name} onChange={e => setHospServiceForm({ ...hospServiceForm, name: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowHospServiceModal(false)} className="px-3 py-1.5 bg-slate-800 text-slate-300 font-bold rounded-xl">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-amber-600 text-white font-bold rounded-xl">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DIAGNOSTIC SERVICE */}
      {showDiagServiceModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4">
            <h3 className="text-base font-bold text-white">{editingDiagService ? 'Edit Diagnostic Service' : 'Add Diagnostic Service'}</h3>
            <form onSubmit={handleSaveDiagService} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Service Name *</label>
                <input type="text" required value={diagServiceForm.name} onChange={e => setDiagServiceForm({ ...diagServiceForm, name: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowDiagServiceModal(false)} className="px-3 py-1.5 bg-slate-800 text-slate-300 font-bold rounded-xl">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-purple-600 text-white font-bold rounded-xl">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
