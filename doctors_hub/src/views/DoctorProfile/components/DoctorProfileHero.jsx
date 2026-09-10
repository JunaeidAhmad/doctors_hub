import React, { useState } from 'react';

function getDoctorDefaultAvatar(doctor) {
  const isFemale = String(doctor?.gender).toLowerCase() === 'female';
  return isFemale ? '/default-doctor-female.svg' : '/default-doctor-male.svg';
}

export default function DoctorProfileHero({ doctor, onShare, onSave, onPrint }) {
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!doctor) return null;

  const defaultAvatar = getDoctorDefaultAvatar(doctor);
  const avatarUrl = doctor.image || defaultAvatar;
  const isVerified = Boolean(doctor.is_verified && doctor.bmdc_number);
  const specialtyName = doctor.specialties?.[0]?.name || 'Specialist Physician';
  const doctorDisplayName = doctor.name || '';

  const ratingNum = parseFloat(doctor.rating) || 4.9;
  const reviewCount = doctor.review_count || 120;
  const experienceText = doctor.experience || '15+ Years';

  const handleShareClick = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
    if (onShare) onShare();
  };

  const handleSaveClick = () => {
    setSaved(!saved);
    if (onSave) onSave(!saved);
  };

  const handlePrintClick = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  return (
    <section className="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl p-6 lg:p-8 shadow-[0_1px_3px_0_rgba(15,23,42,0.04),0_1px_2px_-1px_rgba(15,23,42,0.02)] transition-shadow">
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start justify-between">
        
        {/* Doctor Visual & Identity */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 w-full lg:w-auto">
          {/* Avatar Frame with Status Beacon */}
          <div className="relative shrink-0 mx-auto sm:mx-0">
            <div className="w-28 h-28 lg:w-36 lg:h-36 rounded-2xl overflow-hidden ring-4 ring-surface-container-low border border-outline-variant/70 bg-surface-container shadow-inner">
              <img
                src={avatarUrl}
                alt={doctor.name}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = defaultAvatar;
                }}
                className="w-full h-full object-cover"
              />
            </div>
            {/* Live Chamber Status Beacon */}
            <span className="absolute -bottom-1 -right-1 bg-primary text-on-primary text-label-sm font-label-sm px-2.5 py-0.5 rounded-full border-2 border-surface-container-lowest flex items-center gap-1.5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-primary-fixed animate-ping"></span>
              <span>Chamber Active</span>
            </span>
          </div>

          {/* Doctor Key Attributes */}
          <div className="space-y-2 text-center sm:text-left min-w-0 flex-1">
            {/* Badges Row */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              {isVerified ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-label-sm font-label-sm bg-primary-fixed/20 text-primary border border-primary/20 font-semibold shadow-2xs">
                  <span className="material-symbols-outlined text-[15px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    verified
                  </span>
                  <span>BMDC Reg: {doctor.bmdc_number} Verified</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-label-sm font-label-sm bg-slate-100 text-slate-600 border border-slate-200 font-semibold">
                  <span className="material-symbols-outlined text-[15px]">verified</span>
                  <span>{doctor.bmdc_number ? `BMDC: ${doctor.bmdc_number}` : 'BMDC Verification Pending'}</span>
                </span>
              )}

              <span className="inline-flex items-center px-3 py-1 rounded-md text-label-sm font-label-sm bg-teal-50 text-teal-800 border border-teal-200/60 font-semibold">
                {specialtyName}
              </span>
            </div>

            {/* Doctor Full Name */}
            <h1 className="font-headline-lg text-headline-lg text-on-surface font-bold tracking-tight text-slate-900 leading-tight">
              {doctorDisplayName}
            </h1>

            {/* Qualifications Line */}
            {doctor.qualification && (
              <p className="font-label-lg text-label-lg text-on-surface-variant max-w-2xl leading-relaxed text-slate-600">
                {doctor.qualification}
              </p>
            )}

            {/* Seniority / Academic Title & Institution */}
            {(doctor.academic_title || doctor.institution) && (
              <div className="flex items-center justify-center sm:justify-start gap-2 text-on-surface-variant font-body-md text-body-md pt-0.5 text-slate-600">
                <span className="material-symbols-outlined text-[18px] text-secondary shrink-0">
                  domain
                </span>
                <span className="truncate">
                  {doctor.academic_title && (
                    <span className="font-medium">{doctor.academic_title}{doctor.institution ? ', ' : ''}</span>
                  )}
                  {doctor.institution && (
                    <span className="font-semibold text-on-surface text-slate-900">{doctor.institution}</span>
                  )}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Quick Utility Actions */}
        <div className="flex lg:flex-col sm:flex-row flex-wrap gap-2.5 w-full lg:w-auto shrink-0 justify-center sm:justify-start lg:items-end border-t lg:border-t-0 pt-4 lg:pt-0 border-outline-variant/60">
          <button
            type="button"
            onClick={handleShareClick}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-label-md font-label-md text-on-surface-variant hover:text-primary hover:bg-surface-container-low transition-colors border border-outline-variant/70 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">
              {copied ? 'check' : 'share'}
            </span>
            <span>{copied ? 'Link Copied!' : 'Share Profile'}</span>
          </button>

          <button
            type="button"
            onClick={handleSaveClick}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-label-md font-label-md transition-colors border border-outline-variant/70 cursor-pointer ${
              saved ? 'bg-primary-fixed/20 text-primary border-primary/30 font-bold' : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-low'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: saved ? "'FILL' 1" : "'FILL' 0" }}>
              {saved ? 'bookmark' : 'bookmark_add'}
            </span>
            <span>{saved ? 'Saved Doctor' : 'Save Doctor'}</span>
          </button>

          <button
            type="button"
            onClick={handlePrintClick}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-label-md font-label-md text-on-surface-variant hover:text-primary hover:bg-surface-container-low transition-colors border border-outline-variant/70 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">print</span>
            <span>Print Chamber Details</span>
          </button>
        </div>
      </div>

      {/* Highlights Micro-strip (2 Clean Metrics: Clinical Experience & Patient Trust Index) */}
      <div className="mt-8 pt-6 border-t border-outline-variant/60 grid grid-cols-1 sm:grid-cols-2 gap-4 text-center sm:text-left">
        {/* Metric 1: Clinical Experience */}
        <div className="p-4 rounded-xl bg-surface-container-low/50 border border-outline-variant/40 flex flex-col justify-between">
          <p className="text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
            Clinical Experience
          </p>
          <p className="text-headline-sm font-headline-sm text-on-surface font-bold mt-1 text-slate-900">
            {experienceText.includes('Y') ? experienceText : `${experienceText} Years`}
          </p>
          <p className="text-body-sm font-body-sm text-primary flex items-center justify-center sm:justify-start gap-1 mt-1 font-medium">
            <span className="material-symbols-outlined text-[15px]">workspace_premium</span>
            <span>Continuous Medical Practice</span>
          </p>
        </div>

        {/* Metric 2: Patient Trust Index */}
        <div className="p-4 rounded-xl bg-surface-container-low/50 border border-outline-variant/40 flex flex-col justify-between">
          <p className="text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
            Patient Trust Index
          </p>
          <div className="flex items-center gap-1.5 mt-1 justify-center sm:justify-start">
            <span className="text-headline-sm font-headline-sm text-on-surface font-bold text-slate-900">
              {ratingNum.toFixed(1)}
            </span>
            <div className="flex text-amber-500">
              {[1, 2, 3, 4, 5].map((s) => (
                <span
                  key={s}
                  className="material-symbols-outlined text-[18px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  star
                </span>
              ))}
            </div>
          </div>
          <p className="text-body-sm font-body-sm text-on-surface-variant mt-1 text-slate-500">
            {reviewCount}+ Verified Patient Consultations
          </p>
        </div>
      </div>
    </section>
  );
}
