import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import HospitalBreadcrumbs from './components/HospitalBreadcrumbs';
import HospitalShowcaseHero from './components/HospitalShowcaseHero';
import HospitalNavigationTabs from './components/HospitalNavigationTabs';
import HospitalDoctorsSection from './components/HospitalDoctorsSection';
import HospitalDiagnosticsSection from './components/HospitalDiagnosticsSection';
import HospitalBedMonitorSection from './components/HospitalBedMonitorSection';
import HospitalLocationSection from './components/HospitalLocationSection';
import HospitalAdmissionInfoSection from './components/HospitalAdmissionInfoSection';
import { HospitalLoadingState, HospitalNotFoundState } from './components/HospitalEmptyOrNotFound';

export default function HospitalDetailPage({ 
  hospitalId, 
  onBookDoctorSlot, 
  onBookLabTest, 
  onNavigateHome, 
  onNavigateHospitals,
  showToast 
}) {
  const [hospital, setHospital] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    let isMounted = true;
    async function loadHospital() {
      if (!hospitalId) {
        setLoading(false);
        setError(true);
        return;
      }
      setLoading(true);
      setError(false);
      try {
        const data = await api.getHospitalById(hospitalId);
        if (isMounted && data && (data.id || data.location_id || data.name)) {
          setHospital(data);
        } else if (isMounted) {
          setError(true);
        }
      } catch (err) {
        console.error('Failed to fetch hospital:', err);
        if (isMounted) {
          setError(true);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadHospital();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return () => { isMounted = false; };
  }, [hospitalId]);

  const handleScrollToSection = (sectionId) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleTabChange = (tabId, sectionId) => {
    setActiveTab(tabId);
    if (sectionId) {
      handleScrollToSection(sectionId);
    }
  };

  if (loading) {
    return <HospitalLoadingState />;
  }

  if (error || !hospital) {
    return (
      <HospitalNotFoundState 
        onNavigateHospitals={onNavigateHospitals} 
        onNavigateHome={onNavigateHome} 
      />
    );
  }

  const doctorsCount = hospital.doctor_count ?? hospital.specialists_count ?? hospital.total_doctors ?? null;

  return (
    <div className="min-h-screen bg-background text-on-surface antialiased selection:bg-primary-fixed selection:text-on-primary-fixed">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-6 space-y-8">
        {/* 1. BREADCRUMB STRIP */}
        <HospitalBreadcrumbs 
          hospital={hospital} 
          onNavigateHome={onNavigateHome} 
          onNavigateHospitals={onNavigateHospitals} 
        />

        {/* 2. HOSPITAL SHOWCASE HERO CARD */}
        <div id="overview-section">
          <HospitalShowcaseHero 
            hospital={hospital} 
            onScrollToSection={handleScrollToSection} 
          />
        </div>

        {/* 3. STICKY TAB NAVIGATION CLUSTER */}
        <HospitalNavigationTabs 
          activeTab={activeTab} 
          onTabChange={handleTabChange} 
          doctorsCount={doctorsCount} 
        />

        {/* 4. SECTION 1: DOCTORS & CONSULTANTS (BENTO CARDS) */}
        <HospitalDoctorsSection 
          hospital={hospital} 
          onBookDoctorSlot={onBookDoctorSlot} 
        />

        {/* 5. SECTION 2: IN-HOUSE DIAGNOSTIC & LAB FACILITIES */}
        <HospitalDiagnosticsSection 
          hospital={hospital} 
          onBookLabTest={onBookLabTest} 
        />

        {/* 6. SECTION 3: LIVE CRITICAL CARE & BED AVAILABILITY MONITOR */}
        <HospitalBedMonitorSection 
          hospital={hospital} 
        />

        {/* 7. SECTION 4: LOCATION, FLOOR MAP & AMBULANCE STATION */}
        <HospitalLocationSection 
          hospital={hospital} 
        />

        {/* 8. SECTION 5: VISITOR GUIDELINES & ADMISSION INFO */}
        <HospitalAdmissionInfoSection 
          hospital={hospital} 
        />
      </main>
    </div>
  );
}
