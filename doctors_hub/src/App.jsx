import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import TopUtilityStrip from './components/TopUtilityStrip';
import StickyNavbar from './components/StickyNavbar';
import HomePage from './pages/HomePage';
import DoctorSearchPage from './pages/DoctorSearchPage';
import DiagnosticsSearchPage from './pages/DiagnosticsSearchPage';
import AdminDashboardPage from './pages/admin_dashboard';
import HospitalDetailPage from './pages/HospitalDetailPage';
import HospitalsPage from './pages/HospitalsPage';
import BookingModal from './components/BookingModal';
import LabBookingModal from './components/LabBookingModal';
import LoginModal from './components/LoginModal';
import UserSettingsModal from './components/UserSettingsModal';
import Footer from './components/Footer';
import ToastNotification from './components/ToastNotification';
import { api } from './services/api';

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

  // Global Search Filters
  const [selectedLocation, setSelectedLocation] = useState('All Bangladesh');
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [selectedTest, setSelectedTest] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
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

  const handleLogout = () => {
    api.logout();
    setUser(null);
    showToast('Signed out successfully.');
  };

  const handleLoginSuccess = (role, phone) => {
    const loggedInUser = api.getCurrentUser();
    setUser(loggedInUser);
    setLoginModalOpen(false);
    showToast(`Successfully logged in (+880 ${phone})!`);
  };

  const handleUserUpdated = (updatedUser) => {
    setUser(updatedUser);
  };

  // Execute Search Navigation Handler
  const handleExecuteSearch = (mode, param, locationOverride) => {
    if (locationOverride) {
      setSelectedLocation(locationOverride);
    }
    const loc = locationOverride || selectedLocation;

    if (mode === 'doctor') {
      if (param) setSelectedSpecialty(param);
      navigate('/doctor-search');
      setActiveTab('doctors');
    } else if (mode === 'diagnostics') {
      if (param) {
        setSelectedTest(param);
        navigate(`/diagnostics-search?loc=${encodeURIComponent(loc)}&testcat=${encodeURIComponent(param)}`);
      } else {
        navigate(`/diagnostics-search?loc=${encodeURIComponent(loc)}`);
      }
      setActiveTab('diagnostics');
    } else if (mode === 'hospital') {
      if (param) setSearchKeyword(param);
      navigate(`/hospitals?loc=${encodeURIComponent(loc)}`);
      setActiveTab('hospitals');
    } else {
      if (searchKeyword.trim() !== '') {
        navigate(`/diagnostics-search?loc=${encodeURIComponent(loc)}`);
        setActiveTab('diagnostics');
      } else {
        navigate('/doctor-search');
        setActiveTab('doctors');
      }
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
    showToast(
      `Lab Booking Confirmed! Ref: ${labData.bookingRef} for ${labData.testName}. Pickup scheduled on ${labData.pickupDate}.`
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
          />
        )}

        {currentPage === 'home' && (
          <HomePage
            selectedSpecialty={selectedSpecialty}
            setSelectedSpecialty={setSelectedSpecialty}
            selectedTest={selectedTest}
            setSelectedTest={setSelectedTest}
            searchKeyword={searchKeyword}
            setSearchKeyword={setSearchKeyword}
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
            initialKeyword={searchKeyword}
            onSelectHospital={handleSelectHospital}
            onNavigateHome={() => handleNavClick('home')}
          />
        )}

        {currentPage === 'hospital-detail' && (
          <HospitalDetailPage
            hospitalId={currentHospitalId}
            onBookDoctorSlot={(chamber, doctor) => setBookingDoctorState({ chamber, doctor })}
            onBookLabTest={(test) => setBookingLabState(test)}
            onNavigateHome={() => handleNavClick('home')}
            onNavigateHospitals={() => handleNavClick('hospitals')}
          />
        )}

        {currentPage === 'doctor-search' && (
          <DoctorSearchPage
            initialSpecialty={selectedSpecialty}
            initialLocation={selectedLocation}
            initialKeyword={searchKeyword}
            onBookDoctorSlot={(chamber, doctor) => setBookingDoctorState({ chamber, doctor })}
            onSelectHospital={handleSelectHospital}
            onNavigateHome={() => handleNavClick('home')}
          />
        )}

        {currentPage === 'diagnostics-search' && (
          <DiagnosticsSearchPage
            initialTest={selectedTest || searchKeyword}
            onBookLabTest={(test) => setBookingLabState(test)}
            onNavigateHome={() => handleNavClick('home')}
          />
        )}

      </main>

      {/* FOOTER */}
      {currentPage !== 'admin' && (
        <Footer onSelectLocation={(loc) => {
          setSelectedLocation(loc);
          navigate('/doctor-search');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }} />
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
