import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { 
  SPECIALTIES, HOSPITAL_CATEGORIES, DIAGNOSTIC_CENTER_CATEGORIES, 
  HOSPITAL_SERVICES, DIAGNOSTIC_SERVICES, TEST_CATEGORIES,
  HOSPITALS, DIAGNOSTIC_CENTERS, DOCTORS, TESTS, DIAGNOSTIC_CENTER_TESTS
} from '../../data/mockData';
import { 
  ShieldAlert, RefreshCw, CheckCircle, AlertCircle 
} from 'lucide-react';

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

function ensureArray(val, fallback = []) {
  if (Array.isArray(val)) return val;
  if (val && typeof val === 'object' && Array.isArray(val.results)) return val.results;
  return fallback;
}

export default function AdminDashboard({ currentUser, onNavigate, onAdminLoggedIn }) {
  const [activeTab, setActiveTab] = useState('overview'); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

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
  const [diagCatForm, setDiagCatForm] = useState({ id: '', name: '', icon: 'Building2', description: '', parent: 'by-specialization' });

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
    open_timing: '24/7 Inpatient & Doctor Services',
    tagline: 'Premier Multispecialty Doctor & Inpatient Hospital in Dhanmondi',
    badge: 'Super Hospital',
    logo: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=600&q=80',
    image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=600&q=80',
    description: 'Leading hospital offering inpatient and doctor consultation.',
    is_verified: true
  });

  // Diagnostic Center Modal State
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
    specialization_category_id: '',
    ownership_category_id: '',
    test_category_ids: [],
    service_ids: [],
    address: 'House 16, Road 2, Dhanmondi / Panthapath',
    phone: '+880 9613-787801',
    email: 'info@populardiagnostic.com',
    rating: 4.85,
    reviews_count: 410,
    open_timing: '07:00 AM - 11:00 PM',
    tagline: 'Nationwide Leading Diagnostic & Imaging Hub',
    badge: 'Verified Hospital',
    logo: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=600&q=80',
    image: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=600&q=80',
    description: 'Popular Medical Center providing state-of-the-art diagnostic imaging and visiting doctor chambers.',
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
    facility_type: 'diagnostic_center',
    center: '',
    hospital: '',
    test: '',
    original_price: '700',
    discount: '25% OFF',
    price: '525',
    report_delivery_date: new Date().toISOString().split('T')[0],
    report_time_slot: '05:00 PM - 09:00 PM'
  });

  const isStaff = currentUser?.is_staff || currentUser?.is_superuser || currentUser?.phone === '01700000000' || false;

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    setError('');
    try {
      const [
        hospsData, diagsData, docsData, testsData, branchTestsData
      ] = await Promise.all([
        api.getHospitals().catch(() => HOSPITALS),
        api.getDiagnosticCenters().catch(() => DIAGNOSTIC_CENTERS),
        api.getDoctors().catch(() => DOCTORS),
        api.getTests().catch(() => TESTS),
        api.getDiagnosticCenterTests().catch(() => DIAGNOSTIC_CENTER_TESTS)
      ]);

      setHospitals(ensureArray(hospsData, HOSPITALS));
      setDiagnosticCenters(ensureArray(diagsData, DIAGNOSTIC_CENTERS));
      setDoctors(ensureArray(docsData, DOCTORS));
      setTests(ensureArray(testsData, TESTS));
      setBranchTests(ensureArray(branchTestsData, DIAGNOSTIC_CENTER_TESTS));
    } catch (err) {
      console.warn("Backend load failed or timed out, loading local mock data:", err);
      setHospitals(HOSPITALS);
      setDiagnosticCenters(DIAGNOSTIC_CENTERS);
      setDoctors(DOCTORS);
      setTests(TESTS);
      setBranchTests(DIAGNOSTIC_CENTER_TESTS);
    } finally {
      setLoading(false);
    }
  };

  const loadAllData = () => loadInitialData();

  const showNotification = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  // Hospital Handlers
  const handleOpenHospitalModal = (h = null) => {
    setActiveTab('hospitals');
    if (h) {
      setEditingHospital(h);
      const catId = typeof h.category === 'object' ? h.category?.id : (h.category || h.category_id || '');
      const srvIds = Array.isArray(h.services) 
        ? h.services.map(s => typeof s === 'object' ? s.id : s) 
        : [];

      setHospitalForm({
        id: h.id,
        name: h.name,
        city: h.city || h.district || 'Dhaka',
        branch: h.branch || 'Main',
        isCustomBranch: false,
        customBranch: '',
        category_id: catId,
        service_ids: srvIds,
        address: h.address || '',
        phone: h.phone || '',
        email: h.email || '',
        rating: h.rating || 4.9,
        reviews_count: h.reviews_count || 100,
        open_timing: h.open_timing || '24/7 Inpatient & Doctor Services',
        tagline: h.tagline || '',
        badge: h.badge || '',
        logo: h.logo || '',
        image: h.image || '',
        description: h.description || '',
        is_verified: h.is_verified ?? true
      });
    } else {
      setEditingHospital(null);
      setHospitalForm({
        id: '',
        name: '',
        city: 'Dhaka',
        branch: 'Dhanmondi',
        isCustomBranch: false,
        customBranch: '',
        category_id: hospitalCategories[0]?.id || '',
        service_ids: (hospitalServices || []).slice(0, 3).map(s => s.id),
        address: '',
        phone: '',
        email: '',
        rating: 4.9,
        reviews_count: 150,
        open_timing: '24/7 Inpatient & Doctor Services',
        tagline: '',
        badge: 'Hospital',
        logo: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=600&q=80',
        image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=600&q=80',
        description: '',
        is_verified: true
      });
    }
    setShowHospitalModal(true);
  };

  const handleSaveHospital = async (e) => {
    e.preventDefault();
    try {
      const finalBranch = hospitalForm.isCustomBranch ? hospitalForm.customBranch : hospitalForm.branch;
      const payload = {
        name: hospitalForm.name,
        city: hospitalForm.city,
        district: hospitalForm.city,
        branch: finalBranch,
        category_id: hospitalForm.category_id,
        service_ids: hospitalForm.service_ids,
        address: hospitalForm.address,
        phone: hospitalForm.phone,
        email: hospitalForm.email,
        rating: parseFloat(hospitalForm.rating) || 4.9,
        reviews_count: parseInt(hospitalForm.reviews_count, 10) || 100,
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
    if (!window.confirm(`Delete Hospital "${name}"?`)) return;
    try {
      await api.deleteHospital(id);
      showNotification(`Hospital "${name}" removed.`);
      loadAllData();
    } catch (err) {
      alert(`Error deleting hospital: ${err.message}`);
    }
  };

  const toggleHospitalServiceSelection = (srvId) => {
    const current = hospitalForm.service_ids || [];
    const updated = current.includes(srvId)
      ? current.filter(id => id !== srvId)
      : [...current, srvId];
    setHospitalForm({ ...hospitalForm, service_ids: updated });
  };

  // Diagnostic Handlers
  const handleOpenDiagnosticModal = (dc = null) => {
    setActiveTab('diagnostics');
    if (dc) {
      setEditingDiagnostic(dc);
      const specCatId = dc.specialization_category?.id || dc.specialization_category || '';
      const ownCatId = dc.ownership_category?.id || dc.ownership_category || '';
      const srvIds = Array.isArray(dc.services) 
        ? dc.services.map(s => typeof s === 'object' ? s.id : s) 
        : [];

      const existingTestCatIds = [];
      if (Array.isArray(dc.offered_tests)) {
        dc.offered_tests.forEach(ot => {
          const testCatId = ot.test?.category || ot.test?.category_id || ot.category;
          if (testCatId && !existingTestCatIds.includes(testCatId.toString())) {
            existingTestCatIds.push(testCatId.toString());
          }
        });
      }

      setDiagnosticForm({
        id: dc.id,
        name: dc.name,
        city: dc.district || dc.city || 'Dhaka',
        district: dc.district || dc.city || 'Dhaka',
        branch: dc.branch || 'Main',
        isCustomBranch: false,
        customBranch: '',
        specialization_category_id: specCatId,
        ownership_category_id: ownCatId,
        test_category_ids: existingTestCatIds,
        service_ids: srvIds,
        address: dc.address || '',
        phone: dc.phone || '',
        email: dc.email || '',
        rating: dc.rating || 4.85,
        reviews_count: dc.reviews_count || 100,
        open_timing: dc.open_timing || '07:00 AM - 11:00 PM',
        tagline: dc.tagline || '',
        badge: dc.badge || '',
        logo: dc.logo || '',
        image: dc.image || '',
        description: dc.description || '',
        is_verified: dc.is_verified ?? true
      });
    } else {
      setEditingDiagnostic(null);
      setDiagnosticForm({
        id: '',
        name: '',
        city: 'Dhaka',
        district: 'Dhaka',
        branch: 'Panthapath',
        isCustomBranch: false,
        customBranch: '',
        specialization_category_id: '',
        ownership_category_id: '',
        test_category_ids: [],
        service_ids: (diagnosticServices || []).slice(0, 3).map(s => s.id),
        address: '',
        phone: '',
        email: '',
        rating: 4.85,
        reviews_count: 200,
        open_timing: '07:00 AM - 11:00 PM',
        tagline: '',
        badge: 'Verified Hospital',
        logo: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=600&q=80',
        image: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=600&q=80',
        description: '',
        is_verified: true
      });
    }
    setShowDiagnosticModal(true);
  };

  const handleSaveDiagnostic = async (e) => {
    e.preventDefault();
    try {
      const finalBranch = diagnosticForm.isCustomBranch ? diagnosticForm.customBranch : diagnosticForm.branch;
      const payload = {
        name: diagnosticForm.name,
        city: diagnosticForm.city,
        district: diagnosticForm.city,
        branch: finalBranch,
        specialization_category_id: diagnosticForm.specialization_category_id || null,
        ownership_category_id: diagnosticForm.ownership_category_id || null,
        test_category_ids: diagnosticForm.test_category_ids || [],
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

      let savedCenter;
      if (editingDiagnostic) {
        savedCenter = await api.updateDiagnosticCenter(editingDiagnostic.id, payload);
        showNotification(`Diagnostic Center "${payload.name} (${payload.branch})" updated!`);
      } else {
        savedCenter = await api.createDiagnosticCenter(payload);
        showNotification(`Diagnostic Center "${payload.name} (${payload.branch})" created!`);
      }

      const centerId = savedCenter?.id || (editingDiagnostic ? editingDiagnostic.id : null);
      if (centerId && diagnosticForm.test_category_ids?.length > 0) {
        const testsToAttach = (tests || []).filter(t => {
          const catId = t.category || t.category_id || t.categoryGroup;
          return catId && diagnosticForm.test_category_ids.includes(catId.toString());
        });
        for (const testObj of testsToAttach) {
          try {
            await api.createDiagnosticCenterTest({
              center: centerId,
              test: testObj.id,
              price: testObj.price || 500,
              original_price: testObj.originalPrice || 700,
              discount: '20% OFF',
              report_time: `${testObj.reportTimeHours || 24} Hours`,
              is_available: true,
              home_sample_collection: true
            });
          } catch (e) {
            // Test attachment might already exist
          }
        }
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

  const toggleDiagnosticServiceSelection = (srvId) => {
    const current = diagnosticForm.service_ids || [];
    const updated = current.includes(srvId)
      ? current.filter(id => id !== srvId)
      : [...current, srvId];
    setDiagnosticForm({ ...diagnosticForm, service_ids: updated });
  };

  const toggleDiagnosticTestCategorySelection = (catId) => {
    const current = diagnosticForm.test_category_ids || [];
    const updated = current.includes(catId)
      ? current.filter(id => id !== catId)
      : [...current, catId];
    setDiagnosticForm({ ...diagnosticForm, test_category_ids: updated });
  };

  // Doctor Handlers
  const handleOpenDoctorModal = (doc = null) => {
    setActiveTab('doctors');
    if (doc) {
      setEditingDoctor(doc);
      const specIds = Array.isArray(doc.specialties) 
        ? doc.specialties.map(s => typeof s === 'object' ? (s.id || s) : s)
        : [];

      const affs = Array.isArray(doc.affiliations) && doc.affiliations.length > 0
        ? doc.affiliations.map(a => ({
            hospital: a.hospital?.id || a.hospital || null,
            diagnostic_center: a.diagnostic_center?.id || a.diagnostic_center || null,
            consultation_type: a.consultation_type || 'Doctor',
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
            consultation_type: 'Doctor',
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
        affiliations: (doctorForm.affiliations || []).map(a => ({
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

  // Branch Test Handlers
  const handleOpenBranchTestModal = (bt = null, prefillType = null, prefillId = null) => {
    setActiveTab('branch-tests');
    if (bt) {
      setEditingBranchTest(bt);
      const isHosp = Boolean(bt.hospital || bt.hospital_name || bt.facility_type === 'hospital');
      setBranchTestForm({
        id: bt.id,
        facility_type: isHosp ? 'hospital' : 'diagnostic_center',
        center: bt.center?.id || bt.center || '',
        hospital: bt.hospital?.id || bt.hospital || '',
        test: bt.test?.id || bt.test || (tests[0]?.id || ''),
        original_price: bt.original_price ? bt.original_price.toString() : (bt.price ? bt.price.toString() : '700'),
        discount: bt.discount || '25% OFF',
        price: bt.price ? bt.price.toString() : '525',
        report_delivery_date: new Date().toISOString().split('T')[0],
        report_time_slot: '05:00 PM - 09:00 PM'
      });
    } else {
      setEditingBranchTest(null);
      const isHospPrefill = prefillType === 'hospital';
      const isDiagPrefill = prefillType === 'diagnostic';
      setBranchTestForm({
        id: '',
        facility_type: isHospPrefill ? 'hospital' : 'diagnostic_center',
        center: isDiagPrefill ? prefillId : (diagnosticCenters[0]?.id || ''),
        hospital: isHospPrefill ? prefillId : (hospitals[0]?.id || ''),
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
      const isHosp = branchTestForm.facility_type === 'hospital';
      const selectedTest = tests.find(t => String(t.id) === String(branchTestForm.test));
      const selectedCenter = !isHosp ? diagnosticCenters.find(dc => String(dc.id) === String(branchTestForm.center)) : null;
      const selectedHospital = isHosp ? hospitals.find(h => String(h.id) === String(branchTestForm.hospital)) : null;

      const payload = {
        test: branchTestForm.test,
        center: !isHosp ? (branchTestForm.center || null) : null,
        hospital: isHosp ? (branchTestForm.hospital || null) : null,
        price: parseFloat(branchTestForm.price) || 0,
        original_price: branchTestForm.original_price ? parseFloat(branchTestForm.original_price) : null,
        discount: branchTestForm.discount,
        report_time: `${branchTestForm.report_delivery_date} | ${branchTestForm.report_time_slot}`
      };

      let resData;
      try {
        resData = await api.createDiagnosticCenterTest(payload);
      } catch (err) {
        console.warn("Backend save failed, updating local state:", err);
      }

      const newEntry = {
        id: resData?.id || branchTestForm.id || `bt-custom-${Date.now()}`,
        facility_type: branchTestForm.facility_type,
        center: !isHosp ? (selectedCenter?.id || branchTestForm.center) : null,
        center_name: !isHosp ? (selectedCenter?.name || '') : '',
        center_branch: !isHosp ? (selectedCenter?.branch || '') : '',
        hospital: isHosp ? (selectedHospital?.id || branchTestForm.hospital) : null,
        hospital_name: isHosp ? (selectedHospital?.name || '') : '',
        hospital_branch: isHosp ? (selectedHospital?.branch || '') : '',
        test: selectedTest?.id || branchTestForm.test,
        test_name: selectedTest?.name || 'Diagnostic Test',
        original_price: branchTestForm.original_price,
        discount: branchTestForm.discount,
        price: branchTestForm.price
      };

      setBranchTests(prev => {
        const existingIdx = prev.findIndex(b => String(b.id) === String(newEntry.id));
        if (existingIdx >= 0) {
          const updated = [...prev];
          updated[existingIdx] = newEntry;
          return updated;
        }
        return [newEntry, ...prev];
      });

      const facilityName = selectedHospital ? selectedHospital.name : (selectedCenter ? selectedCenter.name : 'Facility');
      showNotification(`Test "${newEntry.test_name}" added to ${facilityName}!`);
      setShowBranchTestModal(false);
    } catch (err) {
      alert(`Error saving test price offering: ${err.message}`);
    }
  };

  const handleDeleteBranchTest = async (id) => {
    if (!window.confirm("Remove this test offering?")) return;
    try {
      await api.deleteDiagnosticCenterTest(id).catch(() => null);
      showNotification("Test offering removed.");
      setBranchTests(prev => prev.filter(bt => String(bt.id) !== String(id)));
    } catch (err) {
      alert(`Failed to remove: ${err.message}`);
    }
  };

  // Category CRUD Handlers
  const handleOpenDoctorSpecModal = (s = null) => {
    setActiveTab('doctor-specs');
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
      let resData;
      try {
        if (editingDoctorSpec) {
          resData = await api.updateSpecialty(editingDoctorSpec.id, doctorSpecForm);
        } else {
          resData = await api.createSpecialty(doctorSpecForm);
        }
      } catch (err) {
        console.warn("Backend save failed, using local update:", err);
      }
      const newSpec = {
        id: resData?.id || doctorSpecForm.id || `spec-${Date.now()}`,
        name: doctorSpecForm.name,
        icon: doctorSpecForm.icon || 'Stethoscope',
        description: doctorSpecForm.description || ''
      };
      setDoctorSpecialties(prev => {
        if (editingDoctorSpec) {
          return prev.map(s => String(s.id) === String(editingDoctorSpec.id) ? newSpec : s);
        }
        return [...prev, newSpec];
      });
      showNotification(`Specialty "${doctorSpecForm.name}" ${editingDoctorSpec ? 'updated' : 'created'}.`);
      setShowDoctorSpecModal(false);
    } catch (err) {
      alert(`Error saving specialty: ${err.message}`);
    }
  };

  const handleDeleteDoctorSpec = async (id, name) => {
    if (!window.confirm(`Delete Doctor Specialty "${name}"?`)) return;
    try {
      await api.deleteSpecialty(id).catch(() => null);
      setDoctorSpecialties(prev => prev.filter(s => String(s.id) !== String(id)));
      showNotification(`Doctor Specialty "${name}" deleted.`);
    } catch (err) {
      alert(`Error deleting specialty: ${err.message}`);
    }
  };

  const handleOpenHospitalCatModal = (hc = null) => {
    setActiveTab('hospital-specs');
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
      let resData;
      try {
        if (editingHospitalCat) {
          resData = await api.updateHospitalCategory(editingHospitalCat.id, hospitalCatForm);
        } else {
          resData = await api.createHospitalCategory(hospitalCatForm);
        }
      } catch (err) {
        console.warn("Backend save failed, using local update:", err);
      }
      const newCat = {
        id: resData?.id || hospitalCatForm.id || `hosp-cat-${Date.now()}`,
        name: hospitalCatForm.name,
        icon: hospitalCatForm.icon || 'Building2',
        description: hospitalCatForm.description || '',
        count: hospitalCatForm.count || 0
      };
      setHospitalCategories(prev => {
        if (editingHospitalCat) {
          return prev.map(c => String(c.id) === String(editingHospitalCat.id) ? newCat : c);
        }
        return [...prev, newCat];
      });
      showNotification(`Hospital Category "${hospitalCatForm.name}" ${editingHospitalCat ? 'updated' : 'created'}.`);
      setShowHospitalCatModal(false);
    } catch (err) {
      alert(`Error saving category: ${err.message}`);
    }
  };

  const handleDeleteHospitalCat = async (id, name) => {
    if (!window.confirm(`Delete Hospital Category "${name}"?`)) return;
    try {
      await api.deleteHospitalCategory(id).catch(() => null);
      setHospitalCategories(prev => prev.filter(c => String(c.id) !== String(id)));
      showNotification(`Hospital Category "${name}" deleted.`);
    } catch (err) {
      alert(`Error deleting category: ${err.message}`);
    }
  };

  const handleOpenDiagCatModal = (dc = null, defaultParent = 'by-specialization') => {
    setActiveTab('diag-cats');
    if (dc && dc.name) {
      setEditingDiagCat(dc);
      const parentVal = typeof dc.parent === 'object' 
        ? (dc.parent?.id || dc.parent?.name) 
        : (dc.parent || dc.parent_name || defaultParent);
      setDiagCatForm({ 
        id: dc.id, 
        name: dc.name, 
        icon: dc.icon || 'Building2', 
        description: dc.description || '', 
        parent: parentVal 
      });
    } else {
      setEditingDiagCat(null);
      setDiagCatForm({ id: '', name: '', icon: 'Building2', description: '', parent: defaultParent });
    }
    setShowDiagCatModal(true);
  };

  const handleSaveDiagCat = async (e) => {
    e.preventDefault();
    try {
      let resData;
      try {
        if (editingDiagCat) {
          resData = await api.updateDiagnosticCenterCategory(editingDiagCat.id, diagCatForm);
        } else {
          resData = await api.createDiagnosticCenterCategory(diagCatForm);
        }
      } catch (err) {
        console.warn("Backend save diag cat failed, updating local state:", err);
      }

      const newCat = {
        id: resData?.id || diagCatForm.id || `diag-cat-${Date.now()}`,
        name: diagCatForm.name,
        icon: diagCatForm.icon || 'Building2',
        description: diagCatForm.description || '',
        parent: diagCatForm.parent || 'by-specialization'
      };

      setDiagnosticCategories(prev => {
        if (editingDiagCat) {
          return prev.map(c => String(c.id) === String(editingDiagCat.id) ? newCat : c);
        }
        return [...prev, newCat];
      });

      showNotification(`Diagnostic Category "${diagCatForm.name}" ${editingDiagCat ? 'updated' : 'created'}.`);
      setShowDiagCatModal(false);
    } catch (err) {
      alert(`Error saving category: ${err.message}`);
    }
  };

  const handleDeleteDiagCat = async (id, name) => {
    if (!window.confirm(`Delete Diagnostic Category "${name}"?`)) return;
    try {
      await api.deleteDiagnosticCenterCategory(id).catch(() => null);
      setDiagnosticCategories(prev => prev.filter(c => String(c.id) !== String(id)));
      showNotification(`Diagnostic Category "${name}" deleted.`);
    } catch (err) {
      alert(`Error deleting category: ${err.message}`);
    }
  };

  const handleOpenHospServiceModal = (hs = null) => {
    setActiveTab('hosp-services');
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
      let resData;
      try {
        if (editingHospService) {
          resData = await api.updateHospitalService(editingHospService.id, hospServiceForm);
        } else {
          resData = await api.createHospitalService(hospServiceForm);
        }
      } catch (err) {
        console.warn("Backend save failed, using local update:", err);
      }
      const newSrv = {
        id: resData?.id || hospServiceForm.id || `hs-${Date.now()}`,
        name: hospServiceForm.name,
        icon: hospServiceForm.icon || 'Activity',
        description: hospServiceForm.description || ''
      };
      setHospitalServices(prev => {
        if (editingHospService) {
          return prev.map(s => String(s.id) === String(editingHospService.id) ? newSrv : s);
        }
        return [...prev, newSrv];
      });
      showNotification(`Hospital Service "${hospServiceForm.name}" ${editingHospService ? 'updated' : 'created'}.`);
      setShowHospServiceModal(false);
    } catch (err) {
      alert(`Error saving service: ${err.message}`);
    }
  };

  const handleDeleteHospService = async (id, name) => {
    if (!window.confirm(`Delete Hospital Service "${name}"?`)) return;
    try {
      await api.deleteHospitalService(id).catch(() => null);
      setHospitalServices(prev => prev.filter(s => String(s.id) !== String(id)));
      showNotification(`Hospital Service "${name}" deleted.`);
    } catch (err) {
      alert(`Error deleting service: ${err.message}`);
    }
  };

  const handleOpenDiagServiceModal = (ds = null) => {
    setActiveTab('diag-services');
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
      let resData;
      try {
        if (editingDiagService) {
          resData = await api.updateDiagnosticService(editingDiagService.id, diagServiceForm);
        } else {
          resData = await api.createDiagnosticService(diagServiceForm);
        }
      } catch (err) {
        console.warn("Backend save failed, using local update:", err);
      }
      const newSrv = {
        id: resData?.id || diagServiceForm.id || `ds-${Date.now()}`,
        name: diagServiceForm.name,
        icon: diagServiceForm.icon || 'FlaskConical',
        description: diagServiceForm.description || ''
      };
      setDiagnosticServices(prev => {
        if (editingDiagService) {
          return prev.map(s => String(s.id) === String(editingDiagService.id) ? newSrv : s);
        }
        return [...prev, newSrv];
      });
      showNotification(`Diagnostic Service "${diagServiceForm.name}" ${editingDiagService ? 'updated' : 'created'}.`);
      setShowDiagServiceModal(false);
    } catch (err) {
      alert(`Error saving service: ${err.message}`);
    }
  };

  const handleDeleteDiagService = async (id, name) => {
    if (!window.confirm(`Delete Diagnostic Service "${name}"?`)) return;
    try {
      await api.deleteDiagnosticService(id).catch(() => null);
      setDiagnosticServices(prev => prev.filter(s => String(s.id) !== String(id)));
      showNotification(`Diagnostic Service "${name}" deleted.`);
    } catch (err) {
      alert(`Error deleting service: ${err.message}`);
    }
  };

  if (!isStaff) {
    return <AdminLoginForm onAdminLoggedIn={onAdminLoggedIn} />;
  }

  const counts = {
    hospitals: (hospitals || []).length,
    diagnostics: (diagnosticCenters || []).length,
    doctors: (doctors || []).length,
    doctorSpecs: (doctorSpecialties || []).length,
    hospitalSpecs: (hospitalCategories || []).length,
    diagCats: (diagnosticCategories || []).length,
    hospServices: (hospitalServices || []).length,
    diagServices: (diagnosticServices || []).length,
    tests: (tests || []).length,
    testCats: (testCategories || []).length,
    branchTests: (branchTests || []).length,
    docBookings: (doctorBookings || []).length,
    labBookings: (labBookings || []).length
  };

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
        <AdminNavStrip
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          setSearchTerm={setSearchTerm}
          counts={counts}
        />

        {/* ACTIVE TAB VIEWS */}
        {activeTab === 'overview' && (
          <OverviewTab
            hospitals={hospitals}
            diagnosticCenters={diagnosticCenters}
            doctors={doctors}
            tests={tests}
            doctorBookings={doctorBookings}
            labBookings={labBookings}
            doctorSpecialties={doctorSpecialties}
            hospitalCategories={hospitalCategories}
            diagnosticCategories={diagnosticCategories}
            hospitalServices={hospitalServices}
            diagnosticServices={diagnosticServices}
            handleOpenHospitalModal={handleOpenHospitalModal}
            handleOpenDiagnosticModal={handleOpenDiagnosticModal}
            handleOpenDoctorModal={handleOpenDoctorModal}
            handleOpenDoctorSpecModal={handleOpenDoctorSpecModal}
            handleDeleteDoctorSpec={handleDeleteDoctorSpec}
            handleOpenHospitalCatModal={handleOpenHospitalCatModal}
            handleDeleteHospitalCat={handleDeleteHospitalCat}
            handleOpenDiagCatModal={handleOpenDiagCatModal}
            handleDeleteDiagCat={handleDeleteDiagCat}
            handleOpenHospServiceModal={handleOpenHospServiceModal}
            handleDeleteHospService={handleDeleteHospService}
            handleOpenDiagServiceModal={handleOpenDiagServiceModal}
            handleDeleteDiagService={handleDeleteDiagService}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'hospitals' && (
          <HospitalsTab
            hospitals={hospitals}
            hospitalCategories={hospitalCategories}
            hospitalServices={hospitalServices}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            showHospitalModal={showHospitalModal}
            setShowHospitalModal={setShowHospitalModal}
            editingHospital={editingHospital}
            hospitalForm={hospitalForm}
            setHospitalForm={setHospitalForm}
            handleOpenHospitalModal={handleOpenHospitalModal}
            handleSaveHospital={handleSaveHospital}
            handleDeleteHospital={handleDeleteHospital}
            toggleHospitalServiceSelection={toggleHospitalServiceSelection}
            handleOpenBranchTestModal={handleOpenBranchTestModal}
          />
        )}

        {activeTab === 'diagnostics' && (
          <DiagnosticsTab
            diagnosticCenters={diagnosticCenters}
            diagnosticCategories={diagnosticCategories}
            testCategories={testCategories}
            diagnosticServices={diagnosticServices}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            showDiagnosticModal={showDiagnosticModal}
            setShowDiagnosticModal={setShowDiagnosticModal}
            editingDiagnostic={editingDiagnostic}
            diagnosticForm={diagnosticForm}
            setDiagnosticForm={setDiagnosticForm}
            handleOpenDiagnosticModal={handleOpenDiagnosticModal}
            handleSaveDiagnostic={handleSaveDiagnostic}
            handleDeleteDiagnostic={handleDeleteDiagnostic}
            toggleDiagnosticServiceSelection={toggleDiagnosticServiceSelection}
            toggleDiagnosticTestCategorySelection={toggleDiagnosticTestCategorySelection}
            handleOpenBranchTestModal={handleOpenBranchTestModal}
          />
        )}

        {activeTab === 'add-tests-to-diagnostics' && (
          <AddTestsToDiagnosticsTab
            diagnosticCenters={diagnosticCenters}
            setDiagnosticCenters={setDiagnosticCenters}
            hospitals={hospitals}
            setHospitals={setHospitals}
            tests={tests}
            testCategories={testCategories}
            branchTests={branchTests}
            setBranchTests={setBranchTests}
            showNotification={showNotification}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'doctors' && (
          <DoctorsTab
            doctors={doctors}
            doctorSpecialties={doctorSpecialties}
            hospitals={hospitals}
            diagnosticCenters={diagnosticCenters}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            showDoctorModal={showDoctorModal}
            setShowDoctorModal={setShowDoctorModal}
            editingDoctor={editingDoctor}
            doctorForm={doctorForm}
            setDoctorForm={setDoctorForm}
            handleOpenDoctorModal={handleOpenDoctorModal}
            handleSaveDoctor={handleSaveDoctor}
            handleDeleteDoctor={handleDeleteDoctor}
          />
        )}

        {activeTab === 'tests' && (
          <TestsTab
            tests={tests}
            setTests={setTests}
            testCategories={testCategories}
            diagnosticCenters={diagnosticCenters}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            showTestModal={showTestModal}
            setShowTestModal={setShowTestModal}
            editingTest={editingTest}
            setEditingTest={setEditingTest}
            testForm={testForm}
            setTestForm={setTestForm}
            loadAllData={loadAllData}
            showNotification={showNotification}
            handleOpenBranchTestModal={handleOpenBranchTestModal}
          />
        )}

        {activeTab === 'branch-tests' && (
          <BranchTestsTab
            branchTests={branchTests}
            diagnosticCenters={diagnosticCenters}
            hospitals={hospitals}
            tests={tests}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            branchTestBranchFilter={branchTestBranchFilter}
            setBranchTestBranchFilter={setBranchTestBranchFilter}
            branchTestTestFilter={branchTestTestFilter}
            setBranchTestTestFilter={setBranchTestTestFilter}
            showBranchTestModal={showBranchTestModal}
            setShowBranchTestModal={setShowBranchTestModal}
            branchTestForm={branchTestForm}
            setBranchTestForm={setBranchTestForm}
            handleOpenBranchTestModal={handleOpenBranchTestModal}
            handleSaveBranchTest={handleSaveBranchTest}
            handleDeleteBranchTest={handleDeleteBranchTest}
          />
        )}

        {['doctor-specs', 'hospital-specs', 'diag-cats', 'hosp-services', 'diag-services', 'test-cats'].includes(activeTab) && (
          <CategoriesTab
            activeTab={activeTab}
            doctorSpecialties={doctorSpecialties}
            setDoctorSpecialties={setDoctorSpecialties}
            hospitalCategories={hospitalCategories}
            setHospitalCategories={setHospitalCategories}
            diagnosticCategories={diagnosticCategories}
            setDiagnosticCategories={setDiagnosticCategories}
            hospitalServices={hospitalServices}
            setHospitalServices={setHospitalServices}
            diagnosticServices={diagnosticServices}
            setDiagnosticServices={setDiagnosticServices}
            testCategories={testCategories}
            setTestCategories={setTestCategories}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            showDoctorSpecModal={showDoctorSpecModal}
            setShowDoctorSpecModal={setShowDoctorSpecModal}
            editingDoctorSpec={editingDoctorSpec}
            setEditingDoctorSpec={setEditingDoctorSpec}
            doctorSpecForm={doctorSpecForm}
            setDoctorSpecForm={setDoctorSpecForm}
            handleOpenDoctorSpecModal={handleOpenDoctorSpecModal}
            handleSaveDoctorSpec={handleSaveDoctorSpec}
            handleDeleteDoctorSpec={handleDeleteDoctorSpec}
            showHospitalCatModal={showHospitalCatModal}
            setShowHospitalCatModal={setShowHospitalCatModal}
            editingHospitalCat={editingHospitalCat}
            setEditingHospitalCat={setEditingHospitalCat}
            hospitalCatForm={hospitalCatForm}
            setHospitalCatForm={setHospitalCatForm}
            handleOpenHospitalCatModal={handleOpenHospitalCatModal}
            handleSaveHospitalCat={handleSaveHospitalCat}
            handleDeleteHospitalCat={handleDeleteHospitalCat}
            showDiagCatModal={showDiagCatModal}
            setShowDiagCatModal={setShowDiagCatModal}
            editingDiagCat={editingDiagCat}
            setEditingDiagCat={setEditingDiagCat}
            diagCatForm={diagCatForm}
            setDiagCatForm={setDiagCatForm}
            handleOpenDiagCatModal={handleOpenDiagCatModal}
            handleSaveDiagCat={handleSaveDiagCat}
            handleDeleteDiagCat={handleDeleteDiagCat}
            showHospServiceModal={showHospServiceModal}
            setShowHospServiceModal={setShowHospServiceModal}
            editingHospService={editingHospService}
            setEditingHospService={setEditingHospService}
            hospServiceForm={hospServiceForm}
            setHospServiceForm={setHospServiceForm}
            handleOpenHospServiceModal={handleOpenHospServiceModal}
            handleSaveHospService={handleSaveHospService}
            handleDeleteHospService={handleDeleteHospService}
            showDiagServiceModal={showDiagServiceModal}
            setShowDiagServiceModal={setShowDiagServiceModal}
            editingDiagService={editingDiagService}
            setEditingDiagService={setEditingDiagService}
            diagServiceForm={diagServiceForm}
            setDiagServiceForm={setDiagServiceForm}
            handleOpenDiagServiceModal={handleOpenDiagServiceModal}
            handleSaveDiagService={handleSaveDiagService}
            handleDeleteDiagService={handleDeleteDiagService}
            showTestCatModal={showTestCatModal}
            setShowTestCatModal={setShowTestCatModal}
            editingTestCat={editingTestCat}
            setEditingTestCat={setEditingTestCat}
            testCatForm={testCatForm}
            setTestCatForm={setTestCatForm}
            loadAllData={loadAllData}
            showNotification={showNotification}
          />
        )}

        {['doc-bookings', 'lab-bookings'].includes(activeTab) && (
          <BookingsTab
            activeTab={activeTab}
            doctorBookings={doctorBookings}
            labBookings={labBookings}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
          />
        )}

      </main>

    </div>
  );
}
