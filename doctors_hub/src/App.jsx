import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import TopUtilityStrip from './components/TopUtilityStrip';
import StickyNavbar from './components/StickyNavbar';
import HomePage from './pages/HomePage';
import OpdDoctorSearchPage from './pages/OpdDoctorSearchPage';
import PathologySearchPage from './pages/PathologySearchPage';
import DirectSearchPage from './pages/DirectSearchPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import BookingModal from './components/BookingModal';
import LabBookingModal from './components/LabBookingModal';
import LoginModal from './components/LoginModal';
import UserSettingsModal from './components/UserSettingsModal';
import Footer from './components/Footer';
import ToastNotification from './components/ToastNotification';
import { api } from './services/api';

function getPageFromPath(path) {
  if (path === '/admin') return 'admin';
  if (path === '/opd-search') return 'opd-search';
  if (path === '/pathology-search') return 'pathology-search';
  if (path === '/direct-search') return 'direct-search';
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
    if (path === '/opd-search') return 'opd-doctors';
    if (path === '/pathology-search') return 'pathology';
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
    else if (currentPage === 'opd-search') setActiveTab('opd-doctors');
    else if (currentPage === 'pathology-search') setActiveTab('pathology');
    else if (currentPage === 'direct-search') setActiveTab('home');
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
  const handleExecuteSearch = (mode, param) => {
    if (mode === 'doctor' || selectedSpecialty || param) {
      if (param) setSelectedSpecialty(param);
      navigate('/opd-search');
      setActiveTab('opd-doctors');
    } else if (mode === 'pathology' || selectedTest) {
      navigate('/pathology-search');
      setActiveTab('pathology');
    } else if (searchKeyword.trim() !== '') {
      navigate('/direct-search');
    } else {
      navigate('/opd-search');
      setActiveTab('opd-doctors');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavClick = (tabId) => {
    setActiveTab(tabId);
    if (tabId === 'admin') {
      navigate('/admin');
    } else if (tabId === 'home') {
      navigate('/');
    } else if (tabId === 'opd-doctors') {
      navigate('/opd-search');
    } else if (tabId === 'pathology') {
      navigate('/pathology-search');
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
            activeEngineTab={activeEngineTab}
            setActiveEngineTab={setActiveEngineTab}
            onExecuteSearch={handleExecuteSearch}
            onBookDoctorSlot={(chamber, doctor) => setBookingDoctorState({ chamber, doctor })}
            onBookLabTest={(test) => setBookingLabState(test)}
            showToast={showToast}
          />
        )}

        {currentPage === 'opd-search' && (
          <OpdDoctorSearchPage
            initialSpecialty={selectedSpecialty}
            initialLocation={selectedLocation}
            initialKeyword={searchKeyword}
            onBookDoctorSlot={(chamber, doctor) => setBookingDoctorState({ chamber, doctor })}
            onNavigateHome={() => handleNavClick('home')}
          />
        )}

        {currentPage === 'pathology-search' && (
          <PathologySearchPage
            initialTest={selectedTest || searchKeyword}
            onBookLabTest={(test) => setBookingLabState(test)}
            onNavigateHome={() => handleNavClick('home')}
          />
        )}

        {currentPage === 'direct-search' && (
          <DirectSearchPage
            initialKeyword={searchKeyword}
            onBookDoctorSlot={(chamber, doctor) => setBookingDoctorState({ chamber, doctor })}
            onBookLabTest={(test) => setBookingLabState(test)}
            onNavigateHome={() => handleNavClick('home')}
          />
        )}
      </main>

      {/* FOOTER */}
      {currentPage !== 'admin' && (
        <Footer onSelectLocation={(loc) => {
          setSelectedLocation(loc);
          navigate('/opd-search');
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
