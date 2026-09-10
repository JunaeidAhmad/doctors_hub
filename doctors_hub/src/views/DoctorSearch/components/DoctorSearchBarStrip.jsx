import React from 'react';

const DEFAULT_FACILITIES = [
  { id: 'popular', name: 'Popular Diagnostic Centre' },
  { id: 'square', name: 'Square Hospital' },
  { id: 'evercare', name: 'Evercare Hospital' },
  { id: 'ibn_sina', name: 'Ibn Sina Diagnostic & Hospital' },
  { id: 'labaid', name: 'LabAid Specialized Hospital' },
  { id: 'united', name: 'United Hospital' },
  { id: 'medinova', name: 'Medinova Medical Centre' },
  { id: 'central', name: 'Central Hospital Limited' },
  { id: 'anwer_khan', name: 'Anwer Khan Modern Hospital' },
  { id: 'green_life', name: 'Green Life Hospital' }
];

export default function DoctorSearchBarStrip({
  specialty,
  onSpecialtyChange,
  specialties = [],
  facility,
  onFacilityChange,
  facilities = [],
  keyword,
  onKeywordChange,
  onSearchSubmit
}) {
  const facilityOptions = facilities.length > 0 ? facilities : DEFAULT_FACILITIES;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSearchSubmit) onSearchSubmit();
  };

  return (
    <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-xs p-2.5 sm:p-3">
      <form
        className="flex flex-col lg:flex-row gap-2.5 items-stretch lg:items-center"
        onSubmit={handleSubmit}
      >
        {/* 1. Specialty Selector */}
        <div className="relative flex-1 lg:max-w-[260px]">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary flex items-center pointer-events-none">
            <span className="material-symbols-outlined text-[20px]">stethoscope</span>
          </div>
          <select
            value={specialty || ''}
            onChange={(e) => onSpecialtyChange && onSpecialtyChange(e.target.value)}
            className="w-full bg-surface-container-low border border-outline-variant/60 rounded-lg pl-10 pr-9 py-2.5 text-body-sm font-medium text-on-surface focus:border-primary focus:ring-1 focus:ring-primary appearance-none cursor-pointer truncate"
            style={{ WebkitAppearance: 'none', MozAppearance: 'none' }}
          >
            <option value="">All Specialties</option>
            {specialties.length > 0 ? (
              specialties.map((s) => {
                const val = typeof s === 'object' ? (s.name || s.slug) : s;
                const label = typeof s === 'object' ? s.name : s;
                return (
                  <option key={val} value={val}>
                    {label}
                  </option>
                );
              })
            ) : (
              <>
                <option value="Cardiology">Cardiology</option>
                <option value="Gynecology">Gynecology & Obstetrics</option>
                <option value="Orthopedics">Orthopedics & Spine</option>
                <option value="Pediatrics">Pediatrics & Child Health</option>
                <option value="Medicine">General & Internal Medicine</option>
                <option value="Neurology">Neurology & Brain</option>
                <option value="Dermatology">Dermatology & Skin</option>
                <option value="Gastroenterology">Gastroenterology</option>
              </>
            )}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none flex items-center">
            <span className="material-symbols-outlined text-[18px]">expand_more</span>
          </div>
        </div>

        {/* 2. Hospital & Diagnostic Center Selector */}
        <div className="relative flex-1 lg:max-w-[300px]">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary flex items-center pointer-events-none">
            <span className="material-symbols-outlined text-[20px]">local_hospital</span>
          </div>
          <select
            value={facility || ''}
            onChange={(e) => onFacilityChange && onFacilityChange(e.target.value)}
            className="w-full bg-surface-container-low border border-outline-variant/60 rounded-lg pl-10 pr-9 py-2.5 text-body-sm font-medium text-on-surface focus:border-primary focus:ring-1 focus:ring-primary appearance-none cursor-pointer truncate"
            style={{ WebkitAppearance: 'none', MozAppearance: 'none' }}
          >
            <option value="">Select Hospital & Diagnostic Center</option>
            {facilityOptions.map((fac) => {
              const facVal = fac.id || fac.name;
              const facLabel = fac.name;
              return (
                <option key={facVal} value={facVal}>
                  {facLabel}
                </option>
              );
            })}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none flex items-center">
            <span className="material-symbols-outlined text-[18px]">expand_more</span>
          </div>
        </div>

        {/* 3. Keyword / Doctor Search Input */}
        <div className="relative flex-1 min-w-0">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline flex items-center pointer-events-none">
            <span className="material-symbols-outlined text-[20px]">search</span>
          </div>
          <input
            type="text"
            value={keyword || ''}
            onChange={(e) => onKeywordChange && onKeywordChange(e.target.value)}
            placeholder="Search by Doctor name or specialty"
            className="w-full bg-surface-container-low border border-outline-variant/60 rounded-lg pl-10 pr-4 py-2.5 text-body-sm text-on-surface placeholder:text-outline focus:border-primary focus:ring-1 focus:ring-primary outline-none"
          />
        </div>

        {/* 4. Emerald Search Button */}
        <button
          type="submit"
          className="bg-primary hover:bg-primary-container text-on-primary font-semibold flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg shadow-sm transition-all shrink-0 active:scale-[0.98] cursor-pointer font-label-lg text-label-lg"
        >
          <span className="material-symbols-outlined text-[18px]">search</span>
          <span>Search Doctors</span>
        </button>
      </form>
    </div>
  );
}
