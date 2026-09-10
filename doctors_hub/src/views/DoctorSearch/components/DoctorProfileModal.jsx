import React from 'react';

export default function DoctorProfileModal({
  doctor,
  onClose,
  onBookDoctorSlot
}) {
  if (!doctor) return null;

  const academicTitle = doctor.academic_title || '';
  const fullName = academicTitle
    ? `${academicTitle} ${doctor.name}`
    : (doctor.name.startsWith('Dr.') ? doctor.name : `Dr. ${doctor.name}`);

  const affiliations = Array.isArray(doctor.affiliations) && doctor.affiliations.length > 0
    ? doctor.affiliations
    : [
        {
          id: 'aff-default',
          facility_name: doctor.hospital_name || doctor.chamber_name || 'Specialist Chamber',
          district: doctor.district || 'Dhaka, Bangladesh',
          fee: doctor.fee || 1500,
          chamber_type: 'Primary Chamber',
          status_label: 'Available Today',
          schedules: [{ day_of_week: 'Saturday', start_time: '17:00', end_time: '21:00' }]
        }
      ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-surface-container-lowest rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-outline-variant shadow-xl p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          type="button"
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-surface-container-low hover:bg-surface-container flex items-center justify-center text-outline hover:text-on-surface transition-colors cursor-pointer"
          title="Close"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>

        {/* Doctor Header */}
        <div className="flex flex-col sm:flex-row items-start gap-4 pb-5 border-b border-outline-variant">
          {(() => {
            const isFemale = String(doctor?.gender).toLowerCase() === 'female';
            const defaultAvatar = isFemale ? '/default-doctor-female.svg' : '/default-doctor-male.svg';
            const avatarUrl = doctor.image || defaultAvatar;
            return (
              <img
                src={avatarUrl}
                alt={doctor.name}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = defaultAvatar;
                }}
                className="w-24 h-24 rounded-xl object-cover border border-outline-variant shrink-0 bg-surface-container-low shadow-inner"
              />
            );
          })()}

          <div className="flex-1 min-w-0 pr-6">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h2 className="text-xl font-bold text-on-surface">
                {fullName}
              </h2>
              {doctor.bmdc_number && (
                <span className="inline-flex items-center gap-1 bg-primary/10 border border-primary/30 text-primary text-xs font-semibold px-2 py-0.5 rounded-full">
                  <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    verified
                  </span>
                  BMDC: {doctor.bmdc_number}
                </span>
              )}
            </div>

            <p className="text-xs sm:text-sm font-semibold text-primary mb-1">
              {doctor.qualification}
            </p>

            {doctor.institution && (
              <p className="text-xs text-on-surface-variant flex items-center gap-1 mb-2">
                <span className="material-symbols-outlined text-[15px] text-outline">domain</span>
                {doctor.institution}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-3 text-xs text-outline font-medium">
              {doctor.experience && (
                <span className="flex items-center gap-1 text-on-surface">
                  <span className="material-symbols-outlined text-secondary text-[16px]">workspace_premium</span>
                  {doctor.experience}
                </span>
              )}
              {doctor.rating && (
                <span className="flex items-center gap-1 text-on-surface">
                  <span className="material-symbols-outlined text-primary text-[15px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  <strong>{Number(doctor.rating).toFixed(1)}</strong> ({doctor.review_count || 120} reviews)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Doctor Bio / Description */}
        {doctor.description && (
          <div className="py-4 border-b border-outline-variant">
            <h3 className="text-xs font-bold uppercase tracking-wider text-outline mb-1.5">
              About Doctor
            </h3>
            <p className="text-xs sm:text-sm text-on-surface leading-relaxed">
              {doctor.description}
            </p>
          </div>
        )}

        {/* Specialties */}
        {doctor.specialties && doctor.specialties.length > 0 && (
          <div className="py-4 border-b border-outline-variant">
            <h3 className="text-xs font-bold uppercase tracking-wider text-outline mb-2">
              Medical Specialties
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {doctor.specialties.map((s) => {
                const sName = typeof s === 'object' ? s.name : s;
                return (
                  <span
                    key={sName}
                    className="bg-surface-container-low border border-outline-variant/60 text-primary text-xs font-medium px-2.5 py-1 rounded-lg"
                  >
                    {sName}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Chambers & Visiting Hours Matrix */}
        <div className="pt-4 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-outline">
            Chambers &amp; Consultation Visiting Hours
          </h3>

          <div className="space-y-3">
            {affiliations.map((aff, affIdx) => {
              const facName = aff.facility_name || aff.facilityName || aff.name || 'Medical Facility';
              const facAddr = aff.district || aff.address || 'Dhaka';
              const affFee = aff.fee ? `৳${Number(aff.fee).toLocaleString()}` : '৳1,200';
              const schedText = aff.schedules && aff.schedules.length > 0
                ? aff.schedules.map(s => `${s.day_of_week} (${s.start_time?.slice(0, 5)} - ${s.end_time?.slice(0, 5)})`).join(' | ')
                : (aff.visitDays ? `${aff.visitDays} (${aff.visitTime || '5:00 PM - 9:00 PM'})` : 'Daily (Except Friday) 6:00 PM - 9:00 PM');

              return (
                <div
                  key={aff.id || affIdx}
                  className="p-4 rounded-xl border border-outline-variant bg-surface-container-low flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h4 className="text-sm font-bold text-on-surface">
                        {facName}
                      </h4>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary">
                        {affFee}
                      </span>
                    </div>
                    <p className="text-xs text-outline mb-1">{facAddr}</p>
                    <p className="text-xs text-on-surface-variant flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px] text-primary">schedule</span>
                      {schedText}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      if (onBookDoctorSlot) {
                        onBookDoctorSlot(aff, doctor);
                      }
                    }}
                    className="px-4 py-2 bg-primary hover:bg-primary-container text-on-primary font-semibold text-xs rounded-lg transition-all shadow-xs flex items-center gap-1.5 shrink-0 cursor-pointer active:scale-[0.98]"
                  >
                    <span className="material-symbols-outlined text-[16px]">calendar_add_on</span>
                    Book Here
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
