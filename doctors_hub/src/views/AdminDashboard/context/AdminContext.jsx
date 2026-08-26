import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { api, clearCache } from '../../../services/api';


function ensureArray(val, fallback = []) {
  if (Array.isArray(val)) return val;
  if (val && typeof val === 'object' && Array.isArray(val.results)) return val.results;
  return fallback;
}

const AdminContext = createContext(null);

export function AdminProvider({ children, currentUser, onLogout, showToast }) {
  const [activeTab, setActiveTab] = useState('overview'); 
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const isFetchingRef = useRef(false);

  // We wrap showToast to mimic the old state setters so we don't have to refactor everything
  const setSuccessMsg = (msg) => {
    if (msg && showToast) showToast(msg, 'success');
  };
  const setError = (msg) => {
    if (msg && showToast) showToast(msg, 'error');
  };
  const error = ''; // stub for components destructuring error
  const successMsg = ''; // stub for components destructuring successMsg

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
  const [dashboardCounts, setDashboardCounts] = useState({});

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
  const [addTestsFacilityPrefill, setAddTestsFacilityPrefill] = useState({ type: 'diagnostic_center', id: null });

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

  const [activeUser, setActiveUser] = useState(() => currentUser !== undefined ? currentUser : api.getCurrentUser());

  const storedUser = activeUser;
  const isSuperAdmin = Boolean(storedUser) && Boolean(
    storedUser?.is_superuser || 
    storedUser?.is_super_admin || 
    storedUser?.role === 'super_admin'
  );
  const isFacilityAdmin = Boolean(storedUser) && Boolean(
    storedUser?.is_facility_admin || 
    storedUser?.role === 'facility_admin' || 
    (Array.isArray(storedUser?.managed_locations) && storedUser.managed_locations.length > 0)
  );
  const isHospitalAdmin = isFacilityAdmin && storedUser?.managed_locations?.some(loc => loc.location_type === 'hospital');
  const isDiagnosticAdmin = isFacilityAdmin && storedUser?.managed_locations?.some(loc => loc.location_type === 'diagnostic_center');
  const isDoctor = Boolean(storedUser) && Boolean(
    storedUser?.is_doctor || 
    storedUser?.role === 'doctor' || 
    storedUser?.doctor_id
  );
  const isStaffRole = Boolean(storedUser) && Boolean(
    storedUser?.role === 'staff' || 
    (Array.isArray(storedUser?.roles) && storedUser.roles.includes('Staff')) ||
    storedUser?.is_staff
  );
  const isStaff = Boolean(
    storedUser && (
      isSuperAdmin || 
      isFacilityAdmin || 
      isDoctor || 
      isStaffRole ||
      storedUser?.is_staff
    )
  );
  const role = isSuperAdmin ? 'super_admin' : 
               isHospitalAdmin ? 'hospital_admin' : 
               isDiagnosticAdmin ? 'diagnostic_admin' : 
               isDoctor ? 'doctor' : 
               isStaffRole ? 'staff' : (storedUser?.role || '');

  const handleLogout = async () => {
    await api.logout();
    clearCache();
    setActiveUser(null);
    setHospitals([]);
    setDiagnosticCenters([]);
    setDoctors([]);
    setTests([]);
    setBranchTests([]);
    setDoctorBookings([]);
    setLabBookings([]);
    setDoctorSpecialties([]);
    setHospitalCategories([]);
    setDiagnosticCategories([]);
    setHospitalServices([]);
    setDiagnosticServices([]);
    setTestCategories([]);
    setShowHospitalModal(false);
    setShowDiagnosticModal(false);
    setShowDoctorModal(false);
    setShowTestModal(false);
    setShowBranchTestModal(false);
    setShowDoctorSpecModal(false);
    setShowHospitalCatModal(false);
    setShowDiagCatModal(false);
    setShowHospServiceModal(false);
    setShowDiagServiceModal(false);
    setShowTestCatModal(false);
    setAddTestsFacilityPrefill({ type: 'diagnostic_center', id: null });
    setActiveTab('overview');
    setError('');
    setSuccessMsg('');
    if (onLogout) {
      onLogout();
    }
  };

  useEffect(() => {
    const usr = currentUser !== undefined ? currentUser : api.getCurrentUser();
    setActiveUser(usr);
    if (usr) {
      loadInitialData();
    } else {
      setLoading(false);
    }
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

      if (res && typeof res === 'object' && (Array.isArray(res.hospitals) || Array.isArray(res.doctors))) {
        if (res.current_user) {
          setActiveUser(res.current_user);
        }
        if (res.counts) {
          setDashboardCounts(res.counts);
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
      setRefreshTrigger(prev => prev + 1);
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
    if (showToast) showToast(msg, 'success');
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

  const handleNavigateToAddTests = (facilityType = 'diagnostic_center', facilityId = null, facilityObj = null) => {
    if (facilityType === 'diagnostic_center' && facilityObj && facilityId) {
      setDiagnosticCenters(prev => {
        const list = Array.isArray(prev) ? prev : [];
        const exists = list.some(dc => String(dc.id || dc.location_details?.id) === String(facilityId));
        return exists ? list : [facilityObj, ...list];
      });
    } else if (facilityType === 'hospital' && facilityObj && facilityId) {
      setHospitals(prev => {
        const list = Array.isArray(prev) ? prev : [];
        const exists = list.some(h => String(h.id || h.location_details?.id) === String(facilityId));
        return exists ? list : [facilityObj, ...list];
      });
    }
    setAddTestsFacilityPrefill({ type: facilityType, id: facilityId ? String(facilityId) : null });
    setActiveTab('add-tests-to-diagnostics');
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

  const handleOpenTestModal = (t = null) => {
    setActiveTab('tests');
    setEditingTest(t);
    setShowTestModal(true);
  };

  const handleOpenTestCatModal = (tc = null) => {
    setActiveTab('test-cats');
    setEditingTestCat(tc);
    setShowTestCatModal(true);
  };

  // Delete helpers
  const handleDeleteHospital = async (id, name) => {
    if (!window.confirm(`Delete Hospital "${name}"?`)) return;
    try {
      await api.deleteHospital(id);
      showNotification(`Hospital "${name}" removed.`);
      loadInitialData();
    } catch (err) {
      if (showToast) showToast(`Error deleting hospital: ${err.message}`, 'error');
    }
  };

  const handleDeleteDiagnostic = async (id, name) => {
    if (!window.confirm(`Delete Diagnostic Center "${name}"?`)) return;
    try {
      await api.deleteDiagnosticCenter(id);
      showNotification(`Diagnostic Center "${name}" removed.`);
      loadInitialData();
    } catch (err) {
      if (showToast) showToast(`Error deleting center: ${err.message}`, 'error');
    }
  };

  const handleDeleteDoctor = async (id, name) => {
    if (!window.confirm(`Remove Dr. ${name}?`)) return;
    try {
      await api.deleteDoctor(id);
      showNotification(`Dr. ${name} removed.`);
      loadInitialData();
    } catch (err) {
      if (showToast) showToast(`Failed to delete doctor: ${err.message}`, 'error');
    }
  };

  const handleDeleteTest = async (id, name) => {
    if (!window.confirm(`Delete Base Test "${name}"?`)) return;
    try {
      await api.deleteTest(id).catch(() => null);
      setTests(prev => prev.filter(t => String(t.id) !== String(id)));
      showNotification(`Test "${name}" deleted.`);
    } catch (err) {
      if (showToast) showToast(`Error deleting test: ${err.message}`, 'error');
    }
  };

  const handleDeleteTestCat = async (id, name) => {
    if (!window.confirm(`Delete Test Category "${name}"?`)) return;
    try {
      await api.deleteTestCategory(id).catch(() => null);
      setTestCategories(prev => prev.filter(tc => String(tc.id) !== String(id)));
      showNotification(`Test Category "${name}" deleted.`);
    } catch (err) {
      if (showToast) showToast(`Error deleting category: ${err.message}`, 'error');
    }
  };

  const handleDeleteBranchTest = async (id) => {
    if (!window.confirm("Remove this test offering?")) return;
    try {
      await api.deleteDiagnosticCenterTest(id).catch(() => null);
      showNotification("Test offering removed.");
      setBranchTests(prev => prev.filter(bt => String(bt.id) !== String(id)));
    } catch (err) {
      if (showToast) showToast(`Failed to remove: ${err.message}`, 'error');
    }
  };

  const handleDeleteDoctorSpec = async (id, name) => {
    if (!window.confirm(`Delete Doctor Specialty "${name}"?`)) return;
    try {
      await api.deleteSpecialty(id).catch(() => null);
      setDoctorSpecialties(prev => prev.filter(s => String(s.id) !== String(id)));
      showNotification(`Doctor Specialty "${name}" deleted.`);
    } catch (err) {
      if (showToast) showToast(`Error deleting specialty: ${err.message}`, 'error');
    }
  };

  const handleDeleteHospitalCat = async (id, name) => {
    if (!window.confirm(`Delete Hospital Category "${name}"?`)) return;
    try {
      await api.deleteHospitalCategory(id).catch(() => null);
      setHospitalCategories(prev => prev.filter(c => String(c.id) !== String(id)));
      showNotification(`Hospital Category "${name}" deleted.`);
    } catch (err) {
      if (showToast) showToast(`Error deleting category: ${err.message}`, 'error');
    }
  };

  const handleDeleteDiagCat = async (id, name) => {
    if (!window.confirm(`Delete Diagnostic Category "${name}"?`)) return;
    try {
      await api.deleteDiagnosticCenterCategory(id).catch(() => null);
      setDiagnosticCategories(prev => prev.filter(c => String(c.id) !== String(id)));
      showNotification(`Diagnostic Category "${name}" deleted.`);
    } catch (err) {
      if (showToast) showToast(`Error deleting category: ${err.message}`, 'error');
    }
  };

  const handleDeleteHospService = async (id, name) => {
    if (!window.confirm(`Delete Hospital Service "${name}"?`)) return;
    try {
      await api.deleteHospitalService(id).catch(() => null);
      setHospitalServices(prev => prev.filter(s => String(s.id) !== String(id)));
      showNotification(`Hospital Service "${name}" deleted.`);
    } catch (err) {
      if (showToast) showToast(`Error deleting service: ${err.message}`, 'error');
    }
  };

  const handleDeleteDiagService = async (id, name) => {
    if (!window.confirm(`Delete Diagnostic Service "${name}"?`)) return;
    try {
      await api.deleteDiagnosticService(id).catch(() => null);
      setDiagnosticServices(prev => prev.filter(s => String(s.id) !== String(id)));
      showNotification(`Diagnostic Service "${name}" deleted.`);
    } catch (err) {
      if (showToast) showToast(`Error deleting service: ${err.message}`, 'error');
    }
  };

  const counts = {
    hospitals: dashboardCounts.hospitals ?? (hospitals || []).length,
    diagnostics: dashboardCounts.diagnostic_centers ?? (diagnosticCenters || []).length,
    doctors: dashboardCounts.doctors ?? (doctors || []).length,
    doctorSpecs: (doctorSpecialties || []).length,
    hospitalSpecs: (hospitalCategories || []).length,
    diagCats: (diagnosticCategories || []).length,
    hospServices: (hospitalServices || []).length,
    diagServices: (diagnosticServices || []).length,
    tests: dashboardCounts.tests ?? (tests || []).length,
    testCats: (testCategories || []).length,
    branchTests: dashboardCounts.branch_tests ?? (branchTests || []).length,
    docBookings: dashboardCounts.doctor_bookings ?? (doctorBookings || []).length,
    labBookings: dashboardCounts.lab_bookings ?? (labBookings || []).length
  };

  const value = {
    isStaff,
    role,
    isSuperAdmin,
    isFacilityAdmin,
    isHospitalAdmin,
    isDiagnosticAdmin,
    isDoctor,
    isStaffRole,
    activeTab, setActiveTab,
    loading, setLoading,
    error, setError,
    successMsg, setSuccessMsg, showNotification,
    searchTerm, setSearchTerm, refreshTrigger,
    
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
    showTestModal, setShowTestModal, editingTest, setEditingTest, handleOpenTestModal,
    showBranchTestModal, setShowBranchTestModal, editingBranchTest, setEditingBranchTest, branchTestPrefill, handleOpenBranchTestModal,
    addTestsFacilityPrefill, setAddTestsFacilityPrefill, handleNavigateToAddTests,

    // Category Modal states & openers
    showDoctorSpecModal, setShowDoctorSpecModal, editingDoctorSpec, setEditingDoctorSpec, handleOpenDoctorSpecModal,
    showHospitalCatModal, setShowHospitalCatModal, editingHospitalCat, setEditingHospitalCat, handleOpenHospitalCatModal,
    showDiagCatModal, setShowDiagCatModal, editingDiagCat, setEditingDiagCat, diagCatDefaultParent, handleOpenDiagCatModal,
    showHospServiceModal, setShowHospServiceModal, editingHospService, setEditingHospService, handleOpenHospServiceModal,
    showDiagServiceModal, setShowDiagServiceModal, editingDiagService, setEditingDiagService, handleOpenDiagServiceModal,
    showTestCatModal, setShowTestCatModal, editingTestCat, setEditingTestCat, handleOpenTestCatModal,

    // Filters
    branchTestBranchFilter, setBranchTestBranchFilter,
    branchTestTestFilter, setBranchTestTestFilter,

    // Delete actions
    handleDeleteHospital,
    handleDeleteDiagnostic,
    handleDeleteDoctor,
    handleDeleteTest,
    handleDeleteTestCat,
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
