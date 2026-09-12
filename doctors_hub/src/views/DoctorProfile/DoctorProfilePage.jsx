import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from '../../services/api';
import DoctorProfileHero from './components/DoctorProfileHero';
import DoctorAboutSection from './components/DoctorAboutSection';
import DoctorServicesSection from './components/DoctorServicesSection';
import DoctorQualificationsTimeline from './components/DoctorQualificationsTimeline';
import DoctorAffiliationsTable from './components/DoctorAffiliationsTable';
import DoctorReviewsSection from './components/DoctorReviewsSection';
import DoctorBookingWidget from './components/DoctorBookingWidget';

export default function DoctorProfilePage({
  doctorSlug,
  onBookDoctorSlot,
  onNavigateHome,
  onNavigateDoctorSearch,
  showToast
}) {
  const location = useLocation();
  const stateDoctor = location.state?.doctor;
  const stateChambers = location.state?.chambers || stateDoctor?.chambers;

  const [doctor, setDoctor] = useState(stateDoctor || null);
  const [loading, setLoading] = useState(!stateDoctor);
  const [error, setError] = useState(null);
  const [selectedAffIndex, setSelectedAffIndex] = useState(0);

  useEffect(() => {
    let isMounted = true;
    async function loadDoctor() {
      if (!doctorSlug) {
        setError('Doctor identifier is missing.');
        setLoading(false);
        return;
      }

      if (!stateDoctor) setLoading(true);
      setError(null);
      try {
        const data = await api.getDoctor(doctorSlug);
        if (isMounted) {
          if (data) {
            setDoctor(data);
          } else if (!stateDoctor) {
            setError('Doctor profile not found.');
          }
        }
      } catch (err) {
        if (isMounted) {
          console.error('Failed to load doctor profile:', err);
          if (!stateDoctor) {
            setError('Failed to load doctor profile. Please try again.');
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadDoctor();
    window.scrollTo({ top: 0, behavior: 'smooth' });

    return () => {
      isMounted = false;
    };
  }, [doctorSlug, stateDoctor]);

  if (loading) {
    return (
      <div className="bg-background text-on-surface min-h-screen py-10 px-6 max-w-7xl mx-auto space-y-8 animate-pulse">
        {/* Breadcrumb Skeleton */}
        <div className="h-6 bg-slate-200 rounded-md w-1/3"></div>
        
        {/* Hero Skeleton */}
        <div className="bg-white rounded-2xl p-8 border border-slate-200 h-72 flex gap-6">
          <div className="w-32 h-32 rounded-2xl bg-slate-200 shrink-0"></div>
          <div className="space-y-4 flex-1">
            <div className="h-6 bg-slate-200 rounded w-1/4"></div>
            <div className="h-8 bg-slate-200 rounded w-1/2"></div>
            <div className="h-4 bg-slate-200 rounded w-3/4"></div>
            <div className="h-4 bg-slate-200 rounded w-1/3"></div>
          </div>
        </div>

        {/* 2-Col Layout Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 h-48"></div>
            <div className="bg-white rounded-2xl p-6 border border-slate-200 h-64"></div>
          </div>
          <div className="lg:col-span-5">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 h-96"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !doctor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-4 shadow-sm">
          <div className="w-14 h-14 rounded-full bg-rose-50 text-rose-600 mx-auto flex items-center justify-center">
            <span className="material-symbols-outlined text-3xl">error_outline</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">Doctor Not Found</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            {error || "The requested doctor's profile could not be found or has been relocated."}
          </p>
          <div className="pt-2 flex justify-center gap-3">
            {onNavigateDoctorSearch && (
              <button
                type="button"
                onClick={onNavigateDoctorSearch}
                className="px-4 py-2 rounded-xl bg-teal-700 text-white font-semibold text-xs hover:bg-teal-800 transition cursor-pointer"
              >
                Browse All Doctors
              </button>
            )}
            {onNavigateHome && (
              <button
                type="button"
                onClick={onNavigateHome}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition cursor-pointer"
              >
                Go to Home
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const primarySpecialty = doctor.specialties?.[0]?.name || 'Specialist';
  const isVerified = Boolean(doctor.is_verified && doctor.bmdc_number);

  const resolvedAffiliations = useMemo(() => {
    if (!doctor) return [];
    if (Array.isArray(doctor.affiliations) && doctor.affiliations.length > 1) {
      return doctor.affiliations;
    }
    if (Array.isArray(stateChambers) && stateChambers.length > 1) {
      return stateChambers;
    }
    if (Array.isArray(doctor.chambers) && doctor.chambers.length > 1) {
      return doctor.chambers;
    }
    if (Array.isArray(doctor.affiliations) && doctor.affiliations.length > 0) {
      return doctor.affiliations;
    }
    if (Array.isArray(doctor.chambers) && doctor.chambers.length > 0) {
      return doctor.chambers;
    }
    return [];
  }, [doctor, stateChambers]);

  return (
    <div className="bg-background text-on-surface min-h-screen flex flex-col selection:bg-primary selection:text-on-primary">
      {/* 1. Top Sub-Header & Breadcrumb Bar */}
      <div className="bg-surface-container-lowest border-b border-outline-variant/60 py-3.5 px-6 lg:px-12 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <nav className="flex items-center gap-2 text-label-sm font-label-sm text-on-surface-variant text-slate-500">
            <button
              type="button"
              onClick={onNavigateHome}
              className="hover:text-primary transition-colors cursor-pointer"
            >
              Home
            </button>
            <span className="text-outline-variant text-slate-300">/</span>
            <button
              type="button"
              onClick={onNavigateDoctorSearch}
              className="hover:text-primary transition-colors cursor-pointer"
            >
              Specialist Doctors
            </button>
            <span className="text-outline-variant text-slate-300">/</span>
            <span className="text-slate-600">{primarySpecialty}</span>
            <span className="text-outline-variant text-slate-300">/</span>
            <span className="text-primary font-semibold text-teal-800 truncate max-w-[200px] sm:max-w-xs">
              {doctor.name}
            </span>
          </nav>

          <div className="flex items-center gap-3 text-label-sm font-label-sm text-on-surface-variant text-slate-500">
            {isVerified && (
              <span className="inline-flex items-center gap-1 text-primary font-semibold text-teal-700">
                <span className="material-symbols-outlined text-[16px]">lock</span>
                <span>Official Registry Verified Profile</span>
              </span>
            )}
            <span className="text-outline-variant text-slate-300">•</span>
            <span>BMDC Verified System</span>
          </div>
        </div>
      </div>

      {/* 2. Main Canvas Container */}
      <main className="flex-grow max-w-7xl mx-auto w-full px-6 lg:px-12 py-8 space-y-8">
        
        {/* Doctor Hero Card */}
        <DoctorProfileHero doctor={doctor} />

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Clinical Narrative & Credentials (7 cols) */}
          <div className="lg:col-span-7 space-y-8">
            {/* Section A: About The Doctor */}
            <DoctorAboutSection doctor={doctor} />

            {/* Section B: Specializations & Clinical Services */}
            <DoctorServicesSection doctor={doctor} />

            {/* Section C: Academic Qualifications & Training Timeline */}
            <DoctorQualificationsTimeline doctor={doctor} />

            {/* Section D: Hospital Affiliations & Chambers Table */}
            <DoctorAffiliationsTable 
              doctor={doctor} 
              affiliations={resolvedAffiliations}
              selectedAffIndex={selectedAffIndex}
              onSelectAffIndex={setSelectedAffIndex}
            />

            {/* Section E: Patient Reviews & Testimonials */}
            <DoctorReviewsSection doctor={doctor} />
          </div>

          {/* Right Column: Interactive Chamber Booking Widget (5 cols) */}
          <div className="lg:col-span-5">
            <DoctorBookingWidget
              doctor={doctor}
              affiliations={resolvedAffiliations}
              selectedAffIndex={selectedAffIndex}
              onSelectAffIndex={setSelectedAffIndex}
              onBookAppointment={onBookDoctorSlot}
              showToast={showToast}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
