import React from 'react';
import { ChevronRight, Home, Building2, CheckCircle } from 'lucide-react';

export default function HospitalBreadcrumbs({ hospital, onNavigateHome, onNavigateHospitals }) {
  const hospitalName = hospital?.name || hospital?.facility_name || 'Hospital Details';
  const district = hospital?.district || hospital?.city || 'Dhaka';

  return (
    <nav aria-label="Breadcrumb" className="flex items-center justify-between text-xs text-slate-500 py-1">
      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap font-medium">
        <button
          onClick={onNavigateHome}
          className="flex items-center gap-1 text-slate-500 hover:text-primary transition-colors cursor-pointer"
        >
          <Home className="w-3.5 h-3.5 text-slate-400" />
          <span>Home</span>
        </button>

        <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />

        <button
          onClick={onNavigateHospitals || onNavigateHome}
          className="flex items-center gap-1 text-slate-500 hover:text-primary transition-colors cursor-pointer"
        >
          <Building2 className="w-3.5 h-3.5 text-slate-400" />
          <span>Hospitals</span>
        </button>

        <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />

        <span className="text-on-surface font-bold truncate max-w-[220px] sm:max-w-md">
          {hospitalName}, {district}
        </span>
      </div>

      <div className="hidden sm:flex items-center gap-2">
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold text-[11px] border border-emerald-200">
          <CheckCircle className="w-3 h-3 text-emerald-600" />
          Verified Tertiary Facility
        </span>
      </div>
    </nav>
  );
}
