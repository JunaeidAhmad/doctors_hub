import React from 'react';
import { 
  Activity, HeartPulse, Baby, Bed, Users, 
  PhoneCall, Clock, Info, ShieldAlert 
} from 'lucide-react';

export default function HospitalBedMonitorSection({ hospital }) {
  const hospitalName = hospital?.name || hospital?.facility_name || 'Square Hospital';
  const emergencyPhone = hospital?.emergency_phone || '10678';
  const icuAvailable = hospital?.icu_beds_available ?? 4;
  const icuTotal = hospital?.icu_beds_total || 24;

  const bedUnits = [
    {
      id: 'bed-icu',
      title: 'General ICU',
      floor: '3rd Floor, Tower A',
      typeTag: 'Critical Care',
      tagColor: 'bg-emerald-100 text-emerald-800',
      icon: Activity,
      iconColor: 'text-emerald-700',
      borderStyle: 'border-2 border-emerald-500/40 bg-emerald-50/30',
      available: icuAvailable,
      total: icuTotal,
      status: 'Available',
      statusColor: 'text-emerald-700 font-bold',
      numColor: 'text-emerald-700',
    },
    {
      id: 'bed-ccu',
      title: 'CCU (Coronary)',
      floor: '4th Floor, Tower A',
      typeTag: 'Coronary Care',
      tagColor: 'bg-emerald-100 text-emerald-800',
      icon: HeartPulse,
      iconColor: 'text-emerald-700',
      borderStyle: 'border-2 border-emerald-500/40 bg-emerald-50/30',
      available: 2,
      total: 16,
      status: 'Available',
      statusColor: 'text-emerald-700 font-bold',
      numColor: 'text-emerald-700',
    },
    {
      id: 'bed-nicu',
      title: 'NICU Level III',
      floor: '5th Floor, Tower B',
      typeTag: 'Neonatal ICU',
      tagColor: 'bg-amber-100 text-amber-800',
      icon: Baby,
      iconColor: 'text-amber-700',
      borderStyle: 'border-2 border-amber-500/40 bg-amber-50/30',
      available: 1,
      total: 12,
      status: 'High Demand',
      statusColor: 'text-amber-700 font-bold',
      numColor: 'text-amber-700',
    },
    {
      id: 'bed-deluxe',
      title: 'Deluxe Cabin',
      floor: 'Floors 6 to 11',
      typeTag: 'Private Inpatient',
      tagColor: 'bg-surface-container-highest text-on-surface',
      icon: Bed,
      iconColor: 'text-outline',
      borderStyle: 'border border-outline-variant bg-surface-container-low/40',
      available: 9,
      total: 180,
      status: 'Accepting',
      statusColor: 'text-primary font-semibold',
      numColor: 'text-on-surface',
    },
    {
      id: 'bed-ward',
      title: 'General Ward',
      floor: 'Floors 2 to 4, Tower B',
      typeTag: 'Shared Ward',
      tagColor: 'bg-surface-container-highest text-on-surface',
      icon: Users,
      iconColor: 'text-outline',
      borderStyle: 'border border-outline-variant bg-surface-container-low/40',
      available: 14,
      total: 220,
      status: 'Accepting',
      statusColor: 'text-primary font-semibold',
      numColor: 'text-on-surface',
    },
  ];

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
              Hospital Command Center Telemetry
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-on-surface">
            Live Critical Care & Bed Availability Monitor
          </h2>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-0.5">
            Direct feed from {hospitalName} central nursing triage desk. Updated every 3 minutes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-outline flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>Updated 2 mins ago</span>
          </span>

          <a
            href={`tel:${emergencyPhone}`}
            className="px-4 py-2 rounded-lg bg-error/10 text-error border border-error/20 hover:bg-error hover:text-white text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5 transition-all shadow-2xs"
          >
            <PhoneCall className="w-4 h-4" />
            <span>Emergency Admission: {emergencyPhone}</span>
          </a>
        </div>
      </div>

      {/* Real-time Bed Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
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
                <p className="text-xs text-outline mt-0.5">
                  {bed.floor}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-outline-variant/60 flex items-baseline justify-between">
                <div>
                  <span className={`text-2xl font-bold ${bed.numColor}`}>{bed.available}</span>
                  <span className="text-xs text-on-surface-variant"> / {bed.total} Total</span>
                </div>
                <span className={`text-xs uppercase ${bed.statusColor}`}>{bed.status}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Admission Desk Notice Strip */}
      <div className="p-4 rounded-xl bg-surface-container-low flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs sm:text-sm text-on-surface-variant border border-outline-variant/40">
        <div className="flex items-center gap-2.5">
          <Info className="w-5 h-5 text-primary shrink-0" />
          <span>
            For priority trauma admissions or ICU transfer requests with cardiac support ambulance, contact the Admission Coordinator directly.
          </span>
        </div>

        <div className="flex items-center gap-3 shrink-0 font-bold text-on-surface self-end sm:self-auto">
          <a
            href="tel:+8801713066666"
            className="text-primary hover:underline"
          >
            Coordinator Desk: +880 1713-066666
          </a>
        </div>
      </div>
    </section>
  );
}
