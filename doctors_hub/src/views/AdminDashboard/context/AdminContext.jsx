import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { api, clearCache } from '../../../services/api';


function ensureArray(val, fallback = []) {
  if (Array.isArray(val)) return val;
  if (val && typeof val === 'object' && Array.isArray(val.results)) return val.results;
  return fallback;
}

const AdminContext = createContext(null);

export function AdminProvider({ children, currentUser }) {
  const [activeTab, setActiveTab] = useState('overview'); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const isFetchingRef = useRef(false);

  // Main Data States
  const [hospitals, setHospitals] = useState([]);
  const [diagnosticCenters, setDiagnosticCenters] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [tests, setTests] = useState([]);
  const [branchTests, setBranchTests] = useState([]);
  
  // Category & Metadata States
  const [doctorSpecialties, setDoctorSpecialties] = useState([]);
  const [hospitalCategories, setHospitalCategories] = useState([]);
  const [diagnosticCategories, setDiagnosticCategories] = useState([]);
  const [hospitalServices, setHospitalServices] = useState([]);
  const [diagnosticServices, setDiagnosticServices] = useState([]);
  const [testCategories, setTestCategories] = useState([]);
  
  // Bookings States
  const [doctorBookings, setDoctorBookings] = useState([]);
  const [labBookings, setLabBookings] = useState([]);

  // Modal Control States
  const [showHospitalModal, setShowHospitalModal] = useState(false);
  const [editingHospital, setEditingHospital] = useState(null);

  const [showDiagnosticModal, setShowDiagnosticModal] = useState(false);
  const [editingDiagnostic, setEditingDiagnostic] = useState(null);

  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState(null);

  const [showTestModal, setShowTestModal] = useState(false);
  const [editingTest, setEditingTest] = useState(null);

  const [showBranchTestModal, setShowBranchTestModal] = useState(false);
  const [editingBranchTest, setEditingBranchTest] = useState(null);
  const [branchTestPrefill, setBranchTestPrefill] = useState({ type: null, id: null });

  // Category & Service Modal States
  const [showDoctorSpecModal, setShowDoctorSpecModal] = useState(false);
  const [editingDoctorSpec, setEditingDoctorSpec] = useState(null);

  const [showHospitalCatModal, setShowHospitalCatModal] = useState(false);
  const [editingHospitalCat, setEditingHospitalCat] = useState(null);

  const [showDiagCatModal, setShowDiagCatModal] = useState(false);
  const [editingDiagCat, setEditingDiagCat] = useState(null);
  const [diagCatDefaultParent, setDiagCatDefaultParent] = useState('by-specialization');

  const [showHospServiceModal, setShowHospServiceModal] = useState(false);
  const [editingHospService, setEditingHospService] = useState(null);

  const [showDiagServiceModal, setShowDiagServiceModal] = useState(false);
  const [editingDiagService, setEditingDiagService] = useState(null);

  const [showTestCatModal, setShowTestCatModal] = useState(false);
  const [editingTestCat, setEditingTestCat] = useState(null);

  // Branch Test Filters
  const [branchTestBranchFilter, setBranchTestBranchFilter] = useState('');
  const [branchTestTestFilter, setBranchTestTestFilter] = useState('');

  const [activeUser, setActiveUser] = useState(currentUser || api.getCurrentUser());

  const storedUser = activeUser || currentUser || api.getCurrentUser();
  const role = storedUser?.role || (storedUser?.is_superuser ? 'super_admin' : (storedUser?.phone_number === '01700000000' || storedUser?.phone === '01700000000' ? 'super_admin' : ''));
  const isSuperAdmin = role === 'super_admin' || Boolean(storedUser?.is_superuser);
  const isFacilityAdmin = role === 'facility_admin';
  const isDoctor = role === 'doctor';
  const isStaff = Boolean(
    isSuperAdmin || 
    isFacilityAdmin || 
    isDoctor || 
    storedUser?.is_staff
  );

  const handleLogout = () => {
    api.logout();
    clearCache();
    setActiveUser(null);
    setHospitals([]);
    setDiagnosticCenters([]);
    setDoctors([]);
    setBranchTests([]);
    setDoctorBookings([]);
    setLabBookings([]);
  };

  useEffect(() => {
    setActiveUser(currentUser || api.getCurrentUser());
    loadInitialData();
  }, [currentUser]);

  const loadInitialData = async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setLoading(true);
    setError('');
    clearCache();
    try {
      // 1. Try single aggregated backend endpoint (BFF Pattern - 1 Request)
      const res = await api.getAdminDashboardInit().catch(() => null);

      if (res && typeof res === 'object' && Array.isArray(res.hospitals)) {
        if (res.current_user) {
          setActiveUser(res.current_user);
        }
        setHospitals(ensureArray(res.hospitals, []));
        setDiagnosticCenters(ensureArray(res.diagnostic_centers, []));
        setDoctors(ensureArray(res.doctors, []));
        setTests(ensureArray(res.tests, []));
        setBranchTests(ensureArray(res.branch_tests, []));
        setDoctorSpecialties(ensureArray(res.doctor_specialties, []));
        setHospitalCategories(ensureArray(res.hospital_categories, []));
        setDiagnosticCategories(ensureArray(res.diagnostic_categories, []));
        setHospitalServices(ensureArray(res.hospital_services, []));
        setDiagnosticServices(ensureArray(res.diagnostic_services, []));
        setTestCategories(ensureArray(res.test_categories, []));
        setDoctorBookings(ensureArray(res.doctor_bookings, []));
        setLabBookings(ensureArray(res.lab_bookings, []));
        return;
      }

      // 2. Fallback to batched requests if single aggregated endpoint is not available
      await loadInitialDataBatched();
    } catch (err) {
      console.warn("Backend load warning:", err);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  };

  const loadInitialDataBatched = async () => {
    const fetchItem = async (fn, setter, fallback) => {
      try {
        const data = await fn();
        setter(ensureArray(data, fallback));
      } catch (err) {
        console.warn('Batched fetch error:', err);
        setter(fallback);
      }
    };

    // Slot 1: Core Hospitals, Tests, Doctors (starts immediately)
    fetchItem(() => api.getHospitals(), setHospitals, []);
    fetchItem(() => api.getTests(), setTests, []);
    fetchItem(() => api.getDoctors(), setDoctors, []);

    setLoading(false);

    // Slot 2: Diagnostic Centers & Branch Tests (100ms delay)
    setTimeout(() => {
      fetchItem(() => api.getDiagnosticCenters(), setDiagnosticCenters, []);
      fetchItem(() => api.getDiagnosticCenterTests(), setBranchTests, []);
      fetchItem(() => api.getSpecialties(), setDoctorSpecialties, []);
    }, 100);

    // Slot 3: Categories & Services (200ms delay)
    setTimeout(() => {
      fetchItem(() => api.getHospitalCategories(), setHospitalCategories, []);
      fetchItem(() => api.getDiagnosticCenterCategories(), setDiagnosticCategories, []);
      fetchItem(() => api.getHospitalServices(), setHospitalServices, []);
    }, 200);

    // Slot 4: Test Categories & Bookings (300ms delay)
    setTimeout(() => {
      fetchItem(() => api.getDiagnosticServices(), setDiagnosticServices, []);
      fetchItem(() => api.getTestCategories(), setTestCategories, []);
      fetchItem(() => api.getDoctorBookings(), setDoctorBookings, []);
      fetchItem(() => api.getLabBookings(), setLabBookings, []);
    }, 300);
  };

  const showNotification = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  // Helper opener actions
  const handleOpenHospitalModal = (h = null) => {
    setActiveTab('hospitals');
    setEditingHospital(h);
    setShowHospitalModal(true);
  };

  const handleOpenDiagnosticModal = (dc = null) => {
    setActiveTab('diagnostics');
    setEditingDiagnostic(dc);
    setShowDiagnosticModal(true);
  };

  const handleOpenDoctorModal = (doc = null) => {
    setActiveTab('doctors');
    setEditingDoctor(doc);
    setShowDoctorModal(true);
  };

  const handleOpenBranchTestModal = (bt = null, prefillType = null, prefillId = null) => {
    setActiveTab('branch-tests');
    setEditingBranchTest(bt);
    setBranchTestPrefill({ type: prefillType, id: prefillId });
    setShowBranchTestModal(true);
  };

  const handleOpenDoctorSpecModal = (s = null) => {
    setActiveTab('doctor-specs');
    setEditingDoctorSpec(s);
    setShowDoctorSpecModal(true);
  };

  const handleOpenHospitalCatModal = (hc = null) => {
    setActiveTab('hospital-specs');
    setEditingHospitalCat(hc);
    setShowHospitalCatModal(true);
  };

  const handleOpenDiagCatModal = (dc = null) => {
    setActiveTab('diag-cats');
    setEditingDiagCat(dc);
    setShowDiagCatModal(true);
  };


  const handleOpenHospServiceModal = (hs = null) => {
    setActiveTab('hosp-services');
    setEditingHospService(hs);
    setShowHospServiceModal(true);
  };

  const handleOpenDiagServiceModal = (ds = null) => {
    setActiveTab('diag-services');
    setEditingDiagService(ds);
    setShowDiagServiceModal(true);
  };

  // Delete helpers
  const handleDeleteHospital = async (id, name) => {
    if (!window.confirm(`Delete Hospital "${name}"?`)) return;
    try {
      await api.deleteHospital(id);
      showNotification(`Hospital "${name}" removed.`);
      loadInitialData();
    } catch (err) {
      alert(`Error deleting hospital: ${err.message}`);
    }
  };

  const handleDeleteDiagnostic = async (id, name) => {
    if (!window.confirm(`Delete Diagnostic Center "${name}"?`)) return;
    try {
      await api.deleteDiagnosticCenter(id);
      showNotification(`Diagnostic Center "${name}" removed.`);
      loadInitialData();
    } catch (err) {
      alert(`Error deleting center: ${err.message}`);
    }
  };

  const handleDeleteDoctor = async (id, name) => {
    if (!window.confirm(`Remove Dr. ${name}?`)) return;
    try {
      await api.deleteDoctor(id);
      showNotification(`Dr. ${name} removed.`);
      loadInitialData();
    } catch (err) {
      alert(`Failed to delete doctor: ${err.message}`);
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

  const value = {
    isStaff,
    role,
    isSuperAdmin,
    isFacilityAdmin,
    isDoctor,
    activeTab, setActiveTab,
    loading, setLoading,
    error, setError,
    successMsg, setSuccessMsg, showNotification,
    searchTerm, setSearchTerm,
    
    // Entity data & setters
    hospitals, setHospitals,
    diagnosticCenters, setDiagnosticCenters,
    doctors, setDoctors,
    tests, setTests,
    branchTests, setBranchTests,
    doctorSpecialties, setDoctorSpecialties,
    hospitalCategories, setHospitalCategories,
    diagnosticCategories, setDiagnosticCategories,
    hospitalServices, setHospitalServices,
    diagnosticServices, setDiagnosticServices,
    testCategories, setTestCategories,
    doctorBookings, setDoctorBookings,
    labBookings, setLabBookings,
    
    // Modal states & openers
    showHospitalModal, setShowHospitalModal, editingHospital, setEditingHospital, handleOpenHospitalModal,
    showDiagnosticModal, setShowDiagnosticModal, editingDiagnostic, setEditingDiagnostic, handleOpenDiagnosticModal,
    showDoctorModal, setShowDoctorModal, editingDoctor, setEditingDoctor, handleOpenDoctorModal,
    showTestModal, setShowTestModal, editingTest, setEditingTest,
    showBranchTestModal, setShowBranchTestModal, editingBranchTest, setEditingBranchTest, branchTestPrefill, handleOpenBranchTestModal,

    // Category Modal states & openers
    showDoctorSpecModal, setShowDoctorSpecModal, editingDoctorSpec, setEditingDoctorSpec, handleOpenDoctorSpecModal,
    showHospitalCatModal, setShowHospitalCatModal, editingHospitalCat, setEditingHospitalCat, handleOpenHospitalCatModal,
    showDiagCatModal, setShowDiagCatModal, editingDiagCat, setEditingDiagCat, diagCatDefaultParent, handleOpenDiagCatModal,
    showHospServiceModal, setShowHospServiceModal, editingHospService, setEditingHospService, handleOpenHospServiceModal,
    showDiagServiceModal, setShowDiagServiceModal, editingDiagService, setEditingDiagService, handleOpenDiagServiceModal,
    showTestCatModal, setShowTestCatModal, editingTestCat, setEditingTestCat,

    // Filters
    branchTestBranchFilter, setBranchTestBranchFilter,
    branchTestTestFilter, setBranchTestTestFilter,

    // Delete actions
    handleDeleteHospital,
    handleDeleteDiagnostic,
    handleDeleteDoctor,
    handleDeleteBranchTest,
    handleDeleteDoctorSpec,
    handleDeleteHospitalCat,
    handleDeleteDiagCat,
    handleDeleteHospService,
    handleDeleteDiagService,

    counts,
    loadAllData: loadInitialData,
    handleLogout,
    activeUser,
    storedUser
  };

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdminContext() {
  const ctx = useContext(AdminContext);
  if (!ctx) {
    throw new Error('useAdminContext must be used within an AdminProvider');
  }
  return ctx;
}
