import React from 'react';

const SERVICE_ICONS = [
  'stethoscope',
  'monitor_heart',
  'cardiology',
  'vital_signs',
  'vaccines',
  'emergency',
  'health_and_safety',
  'medical_services'
];

export default function DoctorServicesSection({ doctor }) {
  if (!doctor) return null;

  const specialties = Array.isArray(doctor.specialties) ? doctor.specialties : [];
  const primarySpecialty = specialties[0]?.name || 'Clinical Specialty';

  // Parse clinical_services from doctor model (comma or newline separated)
  let services = [];
  if (doctor.clinical_services && doctor.clinical_services.trim()) {
    services = doctor.clinical_services
      .split(/[\n,]+/)
      .map(s => s.trim())
      .filter(Boolean)
      .map((title, idx) => ({
        title,
        description: 'Comprehensive diagnostic evaluation, procedural consultation, and patient care.',
        icon: SERVICE_ICONS[idx % SERVICE_ICONS.length]
      }));
  }

  // Fallback if clinical_services is empty: derive from specialties
  if (services.length === 0) {
    if (specialties.length > 0) {
      services = specialties.map((spec, idx) => ({
        title: spec.name,
        description: spec.description || `Specialized clinical assessment, evidence-based management, and treatment protocols in ${spec.name}.`,
        icon: SERVICE_ICONS[idx % SERVICE_ICONS.length]
      }));
    } else {
      services = [
        {
          title: 'Specialist OPD Consultation',
          description: 'Initial disease triage, clinical history review, and personalized care plan formulation.',
          icon: 'stethoscope'
        },
        {
          title: 'Preventive Health Assessment',
          description: 'Routine screening, diagnostic lab investigation review, and lifestyle risk management.',
          icon: 'monitor_heart'
        }
      ];
    }
  }

  return (
    <section className="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl p-6 lg:p-7 shadow-[0_1px_3px_0_rgba(15,23,42,0.04)]">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-5 pb-3 border-b border-outline-variant/50">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[22px]">
            medical_services
          </span>
          <h2 className="text-title-lg font-title-lg text-on-surface font-bold text-slate-900">
            Specializations &amp; Clinical Services
          </h2>
        </div>
        <span className="text-label-sm font-label-sm text-primary bg-primary-fixed/20 border border-primary/20 px-3 py-1 rounded-full font-semibold">
          {primarySpecialty}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {services.map((item, idx) => (
          <div
            key={idx}
            className={`p-3.5 rounded-xl border border-outline-variant/60 bg-surface-container-low/40 flex items-start gap-3.5 hover:border-primary/40 transition-colors ${
              idx === services.length - 1 && services.length % 2 !== 0 ? 'sm:col-span-2' : ''
            }`}
          >
            <span className="p-2.5 rounded-xl bg-surface-container-lowest text-primary shadow-2xs border border-outline-variant/40 shrink-0">
              <span className="material-symbols-outlined text-[20px]">
                {item.icon || 'stethoscope'}
              </span>
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-title-md text-title-md text-on-surface text-slate-900 font-semibold leading-snug">
                {item.title}
              </p>
              <p className="text-body-sm font-body-sm text-on-surface-variant mt-0.5 text-slate-600 leading-relaxed">
                {item.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
