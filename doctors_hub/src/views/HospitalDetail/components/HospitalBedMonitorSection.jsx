import React from 'react';
import { 
  Activity, HeartPulse, Baby, Bed, Users, 
  PhoneCall, Clock, Info, ShieldAlert 
} from 'lucide-react';
import { formatFacilityName } from '../../../utils/facilityUtils';

export default function HospitalBedMonitorSection({ hospital }) {
  const hospitalName = formatFacilityName(hospital) || '';
  const emergencyPhone = hospital?.emergency_phone || null;
  const icuAvailable = hospital?.icu_beds_available ?? null;
  const icuTotal = hospital?.icu_beds_total ?? null;

  // If no ICU data at all, hide the section
  if (icuTotal == null && icuAvailable == null && !emergencyPhone) {
    return null;
  }

  // Build bed units dynamically from available data
  const bedUnits = [];

  if (icuTotal != null || icuAvailable != null) {
    bedUnits.push({
      id: 'bed-icu',
      title: 'General ICU',
      typeTag: 'Critical Care',
      tagColor: 'bg-emerald-100 text-emerald-800',
      icon: Activity,
      iconColor: 'text-emerald-700',
      borderStyle: icuAvailable != null && icuAvailable > 0
        ? 'border-2 border-emerald-500/40 bg-emerald-50/30'
        : 'border-2 border-amber-500/40 bg-amber-50/30',
      available: icuAvailable,
      total: icuTotal,
      status: icuAvailable != null && icuAvailable > 0 ? 'Available' : icuAvailable === 0 ? 'Full' : null,
      statusColor: icuAvailable != null && icuAvailable > 0 ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold',
      numColor: icuAvailable != null && icuAvailable > 0 ? 'text-emerald-700' : 'text-amber-700',
    });
  }

  return (
    <section className="bg-surface-container-lowest rounded-2xl border border-outline-variant/70 p-5 sm:p-6 lg:p-8 space-y-6 scroll-mt-24" id="bed-monitor-section">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-outline-variant/50 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600"></span>
            </span>
            <span className="text-xs font-bold text-primary uppercase tracking-wider">
              Bed Availability
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-on-surface">
            Critical Care & Bed Availability
          </h2>
          {hospitalName && (
            <p className="text-xs sm:text-sm text-on-surface-variant mt-0.5">
              Current bed status at {hospitalName}.
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          {emergencyPhone && (
            <a
              href={`tel:${emergencyPhone}`}
              className="px-4 py-2 rounded-lg bg-error/10 text-error border border-error/20 hover:bg-error hover:text-white text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5 transition-all shadow-2xs"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Emergency: {emergencyPhone}</span>
            </a>
          )}
        </div>
      </div>

      {/* Bed Matrix */}
      {bedUnits.length > 0 && (
        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${Math.min(bedUnits.length, 5)} gap-4`}>
          {bedUnits.map((bed) => {
            const Icon = bed.icon;

            return (
              <div
                key={bed.id}
                className={`p-4 rounded-xl ${bed.borderStyle} flex flex-col justify-between transition-all`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${bed.tagColor}`}>
                      {bed.typeTag}
                    </span>
                    <Icon className={`w-5 h-5 ${bed.iconColor}`} />
                  </div>

                  <h4 className="text-base font-bold text-on-surface mt-2.5">
                    {bed.title}
                  </h4>
                </div>

                <div className="mt-4 pt-3 border-t border-outline-variant/60 flex items-baseline justify-between">
                  <div>
                    {bed.available != null && (
                      <span className={`text-2xl font-bold ${bed.numColor}`}>{bed.available}</span>
                    )}
                    {bed.total != null && (
                      <span className="text-xs text-on-surface-variant"> / {bed.total} Total</span>
                    )}
                  </div>
                  {bed.status && (
                    <span className={`text-xs uppercase ${bed.statusColor}`}>{bed.status}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Admission notice strip */}
      {emergencyPhone && (
        <div className="p-4 rounded-xl bg-surface-container-low flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs sm:text-sm text-on-surface-variant border border-outline-variant/40">
          <div className="flex items-center gap-2.5">
            <Info className="w-5 h-5 text-primary shrink-0" />
            <span>
              For priority admissions or ICU transfer requests, contact the admission desk directly.
            </span>
          </div>
        </div>
      )}
    </section>
  );
}
