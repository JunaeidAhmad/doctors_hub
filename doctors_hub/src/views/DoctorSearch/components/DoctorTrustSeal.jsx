import React from 'react';

export default function DoctorTrustSeal({
  onLookupRegistry
}) {
  return (
    <div className="p-5 rounded-xl border border-outline-variant bg-surface-container-low flex flex-col md:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-3.5">
        <div className="w-12 h-12 rounded-xl bg-surface-container-lowest border border-outline-variant flex items-center justify-center text-primary shrink-0 shadow-xs">
          <span className="material-symbols-outlined text-3xl">health_and_safety</span>
        </div>
        <div>
          <h4 className="font-title-md text-title-md text-on-surface">
            Every Doctor is 100% BMDC Verified
          </h4>
          <p className="text-body-sm text-on-surface-variant mt-0.5 max-w-2xl">
            We sync directly with Bangladesh Medical &amp; Dental Council databases to ensure legitimate credentials, chamber locations, and scheduled visiting hours.
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onLookupRegistry || (() => window.open('https://www.bmdc.org.bd', '_blank'))}
        className="whitespace-nowrap px-4 py-2 font-label-sm text-label-sm text-primary hover:bg-primary/10 rounded-lg border border-primary/30 transition-colors shrink-0 cursor-pointer"
      >
        Lookup BMDC Registry
      </button>
    </div>
  );
}
