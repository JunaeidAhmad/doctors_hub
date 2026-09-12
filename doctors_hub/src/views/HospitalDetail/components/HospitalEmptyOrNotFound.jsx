import React from 'react';
import { Building2, ArrowLeft, RefreshCw } from 'lucide-react';

export function HospitalLoadingState() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-8 bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-semibold text-on-surface-variant">Loading Hospital Facility Details...</p>
      </div>
    </div>
  );
}

export function HospitalNotFoundState({ onNavigateHospitals, onNavigateHome }) {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-8 bg-background">
      <div className="bg-surface-container-lowest p-8 rounded-2xl border border-outline-variant text-center max-w-md shadow-sm">
        <div className="w-16 h-16 rounded-2xl bg-surface-container-low flex items-center justify-center mx-auto mb-4 text-outline">
          <Building2 className="w-8 h-8" />
        </div>

        <h2 className="text-xl font-bold text-on-surface">Hospital Facility Not Found</h2>
        <p className="text-xs text-on-surface-variant mt-2 mb-6">
          The requested hospital branch or medical center profile could not be loaded. It may have been relocated or updated.
        </p>

        <div className="flex items-center justify-center gap-3">
          <button
            onClick={onNavigateHospitals || onNavigateHome}
            className="px-5 py-2.5 bg-primary text-white rounded-xl font-bold text-xs shadow-sm hover:bg-primary-container transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Hospitals</span>
          </button>
        </div>
      </div>
    </div>
  );
}
