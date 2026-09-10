import React from 'react';

function getDegreeTag(deg) {
  const d = deg.toUpperCase();
  if (d.includes('MBBS')) return 'UNDERGRADUATE MEDICAL DEGREE';
  if (d.includes('FCPS')) return 'POSTGRADUATE FELLOWSHIP';
  if (d.includes('FRCP') || d.includes('FRCS') || d.includes('FACC') || d.includes('FACS') || d.includes('FELLOW')) return 'INTERNATIONAL FELLOWSHIP';
  if (d.includes('MD')) return 'DOCTOR OF MEDICINE (MD)';
  if (d.includes('MS')) return 'MASTER OF SURGERY (MS)';
  if (d.includes('MRCP') || d.includes('MRCS')) return 'ROYAL COLLEGE MEMBERSHIP';
  if (d.includes('DGO') || d.includes('D-') || d.includes('DIPLOMA')) return 'POSTGRADUATE DIPLOMA';
  return 'CLINICAL CREDENTIAL';
}

function getDegreeSubtitle(deg, defaultInstitution) {
  const d = deg.toUpperCase();
  if (d.includes('MBBS')) {
    return 'Dhaka Medical College (DMC) / Recognized Medical College';
  }
  if (d.includes('FCPS')) {
    return 'Bangladesh College of Physicians and Surgeons (BCPS)';
  }
  if (d.includes('MD') || d.includes('MS')) {
    return defaultInstitution || 'National Institute / Bangabandhu Sheikh Mujib Medical University (BSMMU)';
  }
  if (d.includes('FACC')) {
    return 'American College of Cardiology (USA)';
  }
  if (d.includes('FRCP')) {
    return 'Royal College of Physicians (UK / Edin / Glasg)';
  }
  return defaultInstitution || 'Accredited Medical Institution';
}

export default function DoctorQualificationsTimeline({ doctor }) {
  if (!doctor) return null;

  const rawQual = doctor.qualification || 'MBBS, FCPS';
  const degrees = rawQual
    .split(/[,;\n]+/)
    .map(d => d.trim())
    .filter(Boolean);

  const defaultInst = doctor.institution || '';

  return (
    <section className="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl p-6 lg:p-7 shadow-[0_1px_3px_0_rgba(15,23,42,0.04)]">
      <div className="flex items-center gap-2.5 mb-6 pb-3 border-b border-outline-variant/50">
        <span className="material-symbols-outlined text-primary text-[22px]">
          school
        </span>
        <h2 className="text-title-lg font-title-lg text-on-surface font-bold text-slate-900">
          Academic Qualifications &amp; Advanced Training
        </h2>
      </div>

      <div className="relative pl-7 space-y-6 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-outline-variant/70">
        {degrees.map((deg, idx) => {
          const tag = getDegreeTag(deg);
          const institutionText = getDegreeSubtitle(deg, defaultInst);
          const isPrimary = idx === 0 || tag.includes('FELLOWSHIP') || tag.includes('DOCTOR');

          return (
            <div key={idx} className="relative">
              {/* Timeline Bullet Node */}
              <span 
                className={`absolute -left-[30px] top-1.5 w-3.5 h-3.5 rounded-full ring-4 ring-surface-container-lowest ${
                  isPrimary ? 'bg-primary' : 'bg-outline'
                }`} 
              />
              
              <div className="space-y-0.5">
                <span className="text-label-sm font-label-sm text-secondary font-bold tracking-wide uppercase">
                  {tag}
                </span>
                <h3 className="text-title-md font-title-md text-on-surface text-slate-900 font-semibold leading-snug">
                  {deg}
                </h3>
                <p className="text-body-md font-body-md text-on-surface-variant text-slate-600">
                  {institutionText}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
