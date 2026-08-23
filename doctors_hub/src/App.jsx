import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import TopUtilityStrip from './components/TopUtilityStrip';
import StickyNavbar from './components/StickyNavbar';
import HomePage from './views/Home/HomePage';
import DoctorSearchPage from './views/DoctorSearch/DoctorSearchPage';
import DiagnosticsSearchPage from './views/DiagnosticsSearch/DiagnosticsSearchPage';
import AdminDashboardPage from './views/AdminDashboard';
import HospitalDetailPage from './views/HospitalDetail/HospitalDetailPage';
import HospitalsPage from './views/Hospitals/HospitalsPage';
import BookingModal from './components/BookingModal';
import LabBookingModal from './components/LabBookingModal';
import LoginModal from './components/LoginModal';
import UserSettingsModal from './components/UserSettingsModal';
import Footer from './components/Footer';
import ToastNotification from './components/ToastNotification';
import { api, isPageReload, setInitialLoadComplete } from './services/api';

function getPageFromPath(path) {
  if (path === '/admin') return 'admin';
  if (path === '/doctor-search') return 'doctor-search';
  if (path === '/diagnostics-search') return 'diagnostics-search';
  if (path === '/hospitals') return 'hospitals';
  if (path.startsWith('/hospital/')) return 'hospital-detail';
  return 'home';
}

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const currentPage = getPageFromPath(location.pathname);

  // Nav highlight state
  const [activeTab, setActiveTab] = useState(() => {
    const path = location.pathname;
    if (path === '/admin') return 'admin';
    if (path === '/doctor-search') return 'doctors';
    if (path === '/diagnostics-search') return 'diagnostics';
    if (path === '/hospitals') return 'hospitals';
    return 'home';
  });
  const isSectionScroll = useRef(false);

  // User auth state
  const [user, setUser] = useState(() => api.getCurrentUser());

  useEffect(() => {
    // Mark initial load complete after first render
    setTimeout(() => {
      setInitialLoadComplete(true);
    }, 100);
  }, []);

  // Sync activeTab when URL changes via browser back/forward
  useEffect(() => {
    if (isSectionScroll.current) {
      isSectionScroll.current = false;
      return;
    }
    if (currentPage === 'admin') setActiveTab('admin');
    else if (currentPage === 'doctor-search') setActiveTab('doctors');
    else if (currentPage === 'diagnostics-search') setActiveTab('diagnostics');
    else if (currentPage === 'hospitals' || currentPage === 'hospital-detail') setActiveTab('hospitals');
    else setActiveTab('home');
  }, [currentPage]);

  // Global Search Filters (Domain Separated)
  const [selectedLocation, setSelectedLocation] = useState('All Bangladesh');
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [selectedTest, setSelectedTest] = useState('');
  const [selectedHospitalCategory, setSelectedHospitalCategory] = useState('');
  const [doctorKeyword, setDoctorKeyword] = useState('');
  const [diagnosticsKeyword, setDiagnosticsKeyword] = useState('');
  const [hospitalKeyword, setHospitalKeyword] = useState('');
  const [activeEngineTab, setActiveEngineTab] = useState('doctor');

  // Modals & Toast State
  const [bookingDoctorState, setBookingDoctorState] = useState(null);
  const [bookingLabState, setBookingLabState] = useState(null);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [userSettingsModalOpen, setUserSettingsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
  };

  const handleLogout = async () => {
    await api.logout();
    setUser(null);
    showToast('Signed out successfully.');
  };

  const handleLoginSuccess = (role, phone) => {
    const loggedInUser = api.getCurrentUser();
    setUser(loggedInUser);
    setLoginModalOpen(false);

    const isPrivileged = Boolean(
      loggedInUser && (
        loggedInUser.is_staff ||
        loggedInUser.is_superuser ||
        ['super_admin', 'facility_admin', 'doctor', 'staff'].includes(loggedInUser.role) ||
        loggedInUser.phone_number === '01700000000' ||
        loggedInUser.phone_number === '0178787878'
      )
    );

    if (isPrivileged) {
      showToast(`Welcome back, ${loggedInUser.first_name || 'Admin'}! Loading workspace...`);
      handleNavClick('admin');
    } else {
      showToast(`Successfully logged in (+880 ${phone})!`);
    }
  };

  const handleUserUpdated = (updatedUser) => {
    setUser(updatedUser);
  };

  // Execute Search Navigation Handler (Decoupled per Domain)
  const handleExecuteSearch = (mode, param, locationOverride) => {
    let locDiv = '';
    let locDist = '';
    let locArea = '';

    if (typeof locationOverride === 'object' && locationOverride !== null) {
      locDiv = locationOverride.division || '';
      locDist = locationOverride.district || '';
      locArea = locationOverride.area || '';
    } else if (typeof locationOverride === 'string') {
      locDiv = locationOverride;
    }

    const appendLocationParams = (queryParams) => {
      if (locDiv && locDiv !== 'All Bangladesh') queryParams.set('division', locDiv);
      if (locDist && locDist !== 'All Districts') queryParams.set('district', locDist);
      if (locArea && locArea !== 'All Areas') queryParams.set('area', locArea);
      if (locDist && locDist !== 'All Districts') {
        queryParams.set('loc', locDist);
      } else if (locDiv && locDiv !== 'All Bangladesh') {
        queryParams.set('loc', locDiv);
      }
    };

    if (mode === 'doctor') {
      if (param !== undefined && param !== null) setSelectedSpecialty(param);
      const targetSpec = param !== undefined && param !== null ? param : selectedSpecialty;
      const queryParams = new URLSearchParams();
      appendLocationParams(queryParams);
      if (targetSpec) queryParams.set('spec', targetSpec);
      const queryStr = queryParams.toString();
      navigate(`/doctor-search${queryStr ? `?${queryStr}` : ''}`);
      setActiveTab('doctors');
    } else if (mode === 'diagnostics') {
      if (param !== undefined && param !== null) setSelectedTest(param);
      const targetTest = param !== undefined && param !== null ? param : selectedTest;
      const queryParams = new URLSearchParams();
      appendLocationParams(queryParams);
      if (targetTest) queryParams.set('testcat', targetTest);
      const queryStr = queryParams.toString();
      navigate(`/diagnostics-search${queryStr ? `?${queryStr}` : ''}`);
      setActiveTab('diagnostics');
    } else if (mode === 'diagnostics_center') {
      const queryParams = new URLSearchParams();
      appendLocationParams(queryParams);
      if (param) queryParams.set('spec', param);
      const queryStr = queryParams.toString();
      navigate(`/diagnostics-search${queryStr ? `?${queryStr}` : ''}`);
      setActiveTab('diagnostics');
    } else if (mode === 'hospital') {
      if (param !== undefined && param !== null) setSelectedHospitalCategory(param);
      const targetCat = param !== undefined && param !== null ? param : selectedHospitalCategory;
      const queryParams = new URLSearchParams();
      appendLocationParams(queryParams);
      if (targetCat) queryParams.set('cat', targetCat);
      const queryStr = queryParams.toString();
      navigate(`/hospitals${queryStr ? `?${queryStr}` : ''}`);
      setActiveTab('hospitals');
    } else {
      navigate('/doctor-search');
      setActiveTab('doctors');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };


  const handleNavClick = (tabId) => {
    setActiveTab(tabId);
    if (tabId === 'admin') {
      navigate('/admin');
    } else if (tabId === 'home') {
      navigate('/');
    } else if (tabId === 'hospitals') {
      navigate('/hospitals');
    } else if (tabId === 'doctors') {
      navigate('/doctor-search');
    } else if (tabId === 'diagnostics') {
      navigate('/diagnostics-search');
    } else {
      isSectionScroll.current = true;
      navigate('/');
      setTimeout(() => {
        const el = document.getElementById(tabId);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectHospital = (hospitalId) => {
    setActiveTab('hospitals');
    navigate(`/hospital/${hospitalId}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleConfirmBooking = (bookingData) => {
    setBookingDoctorState(null);
    showToast(
      `Appointment Confirmed! Serial Ticket ID: ${bookingData.tokenId} for ${bookingData.patientName} with ${bookingData.doctorName} at ${bookingData.chamberName} on ${bookingData.date} (${bookingData.slot}).`
    );
  };

  const handleConfirmLabBooking = (labData) => {
    setBookingLabState(null);
    const serviceLabel = labData.isHomeTest ? 'Home pickup scheduled' : 'Appointment scheduled';
    const centerPart = labData.centerName ? ` at ${labData.centerName}` : '';
    showToast(
      `Lab Booking Confirmed! Ref: ${labData.bookingRef} for ${labData.testName}. ${serviceLabel} on ${labData.pickupDate}${centerPart}.`
    );
  };

  // Helper to extract hospital ID from URL path /hospital/:id
  const currentHospitalId = location.pathname.startsWith('/hospital/')
    ? location.pathname.replace('/hospital/', '')
    : '';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 antialiased selection:bg-emerald-500 selection:text-white">
      
      {/* 1. TOP UTILITY STRIP */}
      {currentPage !== 'admin' && (
        <TopUtilityStrip
          selectedLocation={selectedLocation}
          setSelectedLocation={setSelectedLocation}
          onNavigateAdmin={() => handleNavClick('admin')}
        />
      )}

      {/* 2. STICKY NAVBAR */}
      {currentPage !== 'admin' && (
        <StickyNavbar
          activeTab={activeTab}
          setActiveTab={handleNavClick}
          user={user}
          onOpenLogin={() => setLoginModalOpen(true)}
          onOpenSettings={() => setUserSettingsModalOpen(true)}
          onLogout={handleLogout}
          onOpenAppModal={() => {
            showToast("Scroll down to scan QR or click download APK!");
            const el = document.getElementById("app-download");
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
        />
      )}

      {/* DYNAMIC PAGE ROUTING RENDER */}
      <main className="flex-1">
        {currentPage === 'admin' && (
          <AdminDashboardPage
            currentUser={user}
            onNavigate={handleNavClick}
            onAdminLoggedIn={(loggedInUser) => setUser(loggedInUser)}
            onLogout={handleLogout}
          />
        )}

        {currentPage === 'home' && (
          <HomePage
            selectedSpecialty={selectedSpecialty}
            setSelectedSpecialty={setSelectedSpecialty}
            selectedTest={selectedTest}
            setSelectedTest={setSelectedTest}
            selectedHospitalCategory={selectedHospitalCategory}
            setSelectedHospitalCategory={setSelectedHospitalCategory}
            doctorKeyword={doctorKeyword}
            setDoctorKeyword={setDoctorKeyword}
            selectedLocation={selectedLocation}
            setSelectedLocation={setSelectedLocation}
            activeEngineTab={activeEngineTab}
            setActiveEngineTab={setActiveEngineTab}
            onExecuteSearch={handleExecuteSearch}
            onBookDoctorSlot={(chamber, doctor) => setBookingDoctorState({ chamber, doctor })}
            onBookLabTest={(test) => setBookingLabState(test)}
            onSelectHospital={handleSelectHospital}
            showToast={showToast}
          />
        )}

        {currentPage === 'hospitals' && (
          <HospitalsPage
            initialCategory={selectedHospitalCategory}
            initialKeyword={hospitalKeyword}
            onSelectHospital={handleSelectHospital}
            onNavigateHome={() => handleNavClick('home')}
          />
        )}

        {currentPage === 'hospital-detail' && (
          <HospitalDetailPage
            hospitalId={currentHospitalId}
            onBookDoctorSlot={(arg1, arg2) => {
              if (arg1 && typeof arg1 === 'object' && arg1.chamber && arg1.doctor) {
                setBookingDoctorState({ chamber: arg1.chamber, doctor: arg1.doctor });
              } else {
                setBookingDoctorState({ chamber: arg1, doctor: arg2 });
              }
            }}
            onBookLabTest={(test) => setBookingLabState(test)}
            onNavigateHome={() => handleNavClick('home')}
            onNavigateHospitals={() => handleNavClick('hospitals')}
          />
        )}

        {currentPage === 'doctor-search' && (
          <DoctorSearchPage
            initialSpecialty={selectedSpecialty}
            initialLocation={selectedLocation}
            initialKeyword={doctorKeyword}
            onBookDoctorSlot={(chamber, doctor) => setBookingDoctorState({ chamber, doctor })}
            onSelectHospital={handleSelectHospital}
            onNavigateHome={() => handleNavClick('home')}
          />
        )}

        {currentPage === 'diagnostics-search' && (
          <DiagnosticsSearchPage
            initialTest={selectedTest}
            initialLocation={selectedLocation}
            onBookLabTest={(test) => setBookingLabState(test)}
            onNavigateHome={() => handleNavClick('home')}
          />
        )}

      </main>

      {/* FOOTER */}
      {currentPage !== 'admin' && (
        <Footer 
          onSelectLocation={(loc) => {
            setSelectedLocation(loc);
            navigate('/doctor-search');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onNavigateAdmin={() => handleNavClick('admin')}
        />
      )}


      {/* MODALS */}
      {bookingDoctorState && (
        <BookingModal
          chamber={bookingDoctorState.chamber}
          doctor={bookingDoctorState.doctor}
          onClose={() => setBookingDoctorState(null)}
          onConfirmBooking={handleConfirmBooking}
        />
      )}

      {bookingLabState && (
        <LabBookingModal
          test={bookingLabState}
          onClose={() => setBookingLabState(null)}
          onConfirmLabBooking={handleConfirmLabBooking}
        />
      )}

      {loginModalOpen && (
        <LoginModal
          onClose={() => setLoginModalOpen(false)}
          onLoginSuccess={handleLoginSuccess}
          onOpenAdmin={() => {
            setLoginModalOpen(false);
            handleNavClick('admin');
          }}
        />
      )}

      {userSettingsModalOpen && (
        <UserSettingsModal
          currentUser={user}
          onClose={() => setUserSettingsModalOpen(false)}
          onUserUpdated={handleUserUpdated}
          showToast={showToast}
        />
      )}

      {/* TOAST NOTIFICATION */}
      <ToastNotification
        message={toastMessage}
        onClose={() => setToastMessage('')}
      />

    </div>
  );
}
