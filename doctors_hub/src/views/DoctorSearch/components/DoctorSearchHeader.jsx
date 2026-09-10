import React from 'react';

export default function DoctorSearchHeader({
  specialty = '',
  location = 'Dhaka',
  onNavigateHome
}) {
  const displayLocation = location && location !== 'All Bangladesh' ? location : 'Bangladesh';
  const hierarchyLabel = specialty
    ? `${specialty} in ${displayLocation}`
    : `Doctors in ${displayLocation}`;

  return (
    <section className="bg-surface-container-lowest border-b border-outline-variant">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Breadcrumbs Hierarchy */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-outline font-medium">
            <button
              onClick={onNavigateHome}
              className="hover:text-primary flex items-center gap-1 transition-colors cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">home</span>
              Home
            </button>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-outline">Doctor Search</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="font-semibold text-on-surface">{hierarchyLabel}</span>
          </nav>

          {/* Status & Assurance */}
          <div className="flex items-center gap-3 text-label-sm font-label-sm">
            <span className="inline-flex items-center gap-1.5 text-primary bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20 font-medium">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary animate-ping"></span>
              Instant Appointment Booking Available
            </span>
            <span className="text-outline hidden sm:inline">Updated 2 mins ago</span>
          </div>
        </div>
      </div>
    </section>
  );
}
