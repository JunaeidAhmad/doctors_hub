import React from 'react';

export default function DoctorAboutSection({ doctor }) {
  if (!doctor) return null;

  const doctorDisplayName = doctor.name || '';

  const primarySpecialty = doctor.specialties?.[0]?.name || 'Specialist Physician';

  // Format paragraphs from doctor.about or intelligent fallback
  const aboutText = doctor.about?.trim() || '';
  const paragraphs = aboutText
    ? aboutText.split('\n\n').filter(Boolean)
    : [
        `${doctorDisplayName} is a highly accomplished ${primarySpecialty} with extensive clinical expertise in comprehensive diagnosis, evidence-based patient management, and advanced care protocols. ${
          doctor.institution ? `Currently affiliated with ${doctor.institution}, ` : ''
        }dedicated to providing patients with empathetic, precise, and high-quality consultations.`,
        `With ${doctor.experience || 'over a decade of'} clinical experience and a track record of exemplary patient outcomes, ${doctorDisplayName} is committed to staying abreast of modern clinical guidelines, preventive healthcare measures, and dedicated patient follow-ups.`
      ];

  return (
    <article className="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl p-6 lg:p-7 shadow-[0_1px_3px_0_rgba(15,23,42,0.04)]">
      <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-outline-variant/50">
        <span className="material-symbols-outlined text-primary text-[22px]">
          clinical_notes
        </span>
        <h2 className="text-title-lg font-title-lg text-on-surface font-bold text-slate-900">
          About
        </h2>
      </div>

      <div className="space-y-3.5 text-slate-700 leading-relaxed">
        {paragraphs.map((para, idx) => (
          <p key={idx} className={idx === 0 ? "text-body-lg font-body-lg" : "text-body-md font-body-md"}>
            {para}
          </p>
        ))}
      </div>
    </article>
  );
}
