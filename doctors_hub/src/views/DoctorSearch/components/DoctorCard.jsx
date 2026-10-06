import React, { useState, useMemo } from 'react';
import DoctorChamberCard from './DoctorChamberCard';
import { displayName, formatDoctorTitle, formatNextAvailable } from '../../../utils/doctorUtils';
import { formatDisplayTime } from '../../../utils/scheduleUtils';
import { useLang } from '../../../hooks/useLang';
import { t } from '../../../data/strings';

function getDoctorDefaultAvatar(doctor) {
  const g = String(doctor?.gender || '').toLowerCase();
  if (g === 'female') return '/default-doctor-female.svg';
  if (g === 'male') return '/default-doctor-male.svg';
  return '/default-doctor-neutral.svg';
}

export default function DoctorCard({
  doctor,
  _index = 0,
  filteredFacility,
  filteredLocation,
  onBookDoctorSlot,
  onViewProfile,
  onSelectHospital,
  onSelectSpecialty,
  specialtyFilterActive = false,
  activeSpecialtyName = '',
  activeSpecialtyBnName = '',
  relatedVia = null
}) {
  const lang = useLang();
  const defaultAvatar = getDoctorDefaultAvatar(doctor);
  const avatarUrl = doctor.image || defaultAvatar;
  const bmdcNo = doctor.bmdc_number;
  
  // Qualifications strictly from API
  const qualification = doctor.qualification || '';

  // Verbatim specialty text from card / API
  const specialtyDisplay = doctor.specialty_display?.en || doctor.specialty_source || '';

  // Process canonical specialties for chips
  const rawSpecialties = Array.isArray(doctor.specialties) && doctor.specialties.length > 0
    ? doctor.specialties
    : (doctor.specialty ? [doctor.specialty] : []);

  const seenSpecialties = new Set();
  const specialties = [];
  for (const s of rawSpecialties) {
    if (!s) continue;
    const name = (typeof s === 'string' ? s : (s.name || s.canonical_name || '')).trim();
    const slug = (typeof s === 'object' && s?.slug) || '';
    if (name && !seenSpecialties.has(name.toLowerCase())) {
      seenSpecialties.add(name.toLowerCase());
      specialties.push({
        id: (typeof s === 'object' && s?.id) || name,
        name,
        slug,
        bn_name: (typeof s === 'object' && s?.bn_name) || ''
      });
    }
  }

  // Designation & Institution strictly from API
  const designation = doctor.designation || doctor.academic_title || '';
  const institution = doctor.institution || '';
  const experience = doctor.experience || '';
  const rating = doctor.rating ? Number(doctor.rating).toFixed(1) : null;
  const reviewCount = doctor.review_count || null;

  // Process chambers strictly from database API:
  const chambers = Array.isArray(doctor.chambers) && doctor.chambers.length > 0
    ? doctor.chambers.map((aff, i) => {
        const fac = aff.facility || {};
        const facName = fac.display_name || fac.name || aff.name || '';
        const locId = fac.id || aff.location_id || aff.location || '';
        const locSlug = fac.slug || '';
        const address = fac.address || fac.district || '';
        const district = fac.district || '';
        const thana = fac.area || '';
        return {
          id: aff.id || `aff-${doctor.id}-${i + 1}`,
          affiliationId: aff.id,
          facility: fac,
          locationId: String(locId),
          locationSlug: String(locSlug),
          display_name: facName,
          name: facName,
          rawName: String(fac.name || ''),
          branch: String(fac.branch || ''),
          address,
          location: address,
          district: String(district),
          thana: String(thana),
          fee: aff.fee ? Math.round(Number(aff.fee)) : (doctor.fee ? Math.round(Number(doctor.fee)) : null),
          next_available: aff.next_available || null,
          visitSchedule: aff.schedules && aff.schedules.length > 0
            ? aff.schedules.map(s => s.day_of_week?.slice(0, 3)).filter(Boolean).join(', ')
            : (aff.visitSchedule || null),
          schedules: aff.schedules || []
        };
      })
    : [];

  // Match the chamber that best fits active facility/location filters
  const matchedChamberId = useMemo(() => {
    if (!chambers || chambers.length === 0) return null;
    if (filteredFacility) {
      const q = String(filteredFacility).trim().toLowerCase();
      const match = chambers.find((c) => {
        if (!c) return false;
        if (c.locationId && c.locationId.toLowerCase() === q) return true;
        if (c.locationSlug && c.locationSlug.toLowerCase() === q) return true;
        if (c.affiliationId && String(c.affiliationId).toLowerCase() === q) return true;
        if (c.id && String(c.id).toLowerCase() === q) return true;
        if (c.facility_name && c.facility_name.toLowerCase().includes(q)) return true;
        if (c.rawName && c.rawName.toLowerCase().includes(q)) return true;
        if (c.branch && c.branch.toLowerCase().includes(q)) return true;
        if (c.rawName && q.includes(c.rawName.toLowerCase()) && c.rawName.length > 3) return true;
        return false;
      });
      if (match) return match.id;
    }
    const area = filteredLocation?.area;
    if (area) {
      const qArea = area.trim().toLowerCase();
      const match = chambers.find((c) =>
        (c.branch && c.branch.toLowerCase().includes(qArea)) ||
        (c.thana && c.thana.toLowerCase().includes(qArea)) ||
        (c.address && c.address.toLowerCase().includes(qArea))
      );
      if (match) return match.id;
    }
    const district = filteredLocation?.district;
    if (district) {
      const qDist = district.trim().toLowerCase();
      const match = chambers.find((c) =>
        (c.district && c.district.toLowerCase().includes(qDist)) ||
        (c.address && c.address.toLowerCase().includes(qDist))
      );
      if (match) return match.id;
    }
    return chambers[0]?.id;
  }, [chambers, filteredFacility, filteredLocation]);

  // Selected Chamber State (defaults to matched chamber, user click takes precedence)
  const [userSelectedChamberId, setUserSelectedChamberId] = useState(null);
  const selectedChamberId = userSelectedChamberId && chambers.some(c => c.id === userSelectedChamberId)
    ? userSelectedChamberId
    : matchedChamberId;
  const selectedChamber = chambers.find(c => c.id === selectedChamberId) || chambers[0];

  const handleBookAppointment = () => {
    if (onBookDoctorSlot && selectedChamber) {
      onBookDoctorSlot(selectedChamber, doctor);
    }
  };

  const doctorDisplayName = formatDoctorTitle(doctor);
  const doctorBnName = doctor.bn_name;

  return (
    <article className="bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-xs hover:shadow-md transition-shadow duration-200 overflow-hidden">
      <div className="p-5 sm:p-6">
        {/* Doctor Info Section */}
        <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-5">
          {/* Avatar with Circular Calendar Badge at Bottom Right */}
          <div className="relative shrink-0 mx-auto sm:mx-0">
            <img
              src={avatarUrl}
              alt={displayName(doctor)}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = defaultAvatar;
              }}
              className="w-24 h-24 rounded-2xl object-cover border border-outline-variant shadow-inner bg-surface-container-low"
            />
            {chambers.length > 0 && (
              <div
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#006877] ring-2 ring-white flex items-center justify-center shadow-xs"
                title="Chamber Appointment Available"
              >
                <span className="material-symbols-outlined text-white text-[13px]">
                  calendar_month
                </span>
              </div>
            )}
          </div>

          {/* Main Credentials & Info */}
          <div className="flex-grow min-w-0 w-full">
            {/* Name and BMDC Pill Row */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-4">
              <div className="min-w-0 flex-1">
                {/* Non-clickable Doctor Name without designation */}
                <h3 className="font-bold text-xl sm:text-[22px] text-slate-900 tracking-tight leading-snug flex flex-wrap items-baseline gap-2">
                  <span>{doctorDisplayName}</span>
                  {doctorBnName && (
                    <span className="text-sm sm:text-base font-normal text-slate-500">
                      ({doctorBnName.startsWith('ডা') ? doctorBnName : `ডাঃ ${doctorBnName}`})
                    </span>
                  )}
                </h3>
                {/* Qualifications Line in Cyan/Teal */}
                {qualification && (
                  <p className="text-[13px] sm:text-sm font-semibold text-[#007a8c] mt-1 leading-snug">
                    {qualification}
                  </p>
                )}
              </div>

              {(bmdcNo || relatedVia) && (
                <div className="flex flex-wrap items-center gap-2 shrink-0 self-start sm:self-auto">
                  {relatedVia && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-indigo-300/80 bg-indigo-50/60 text-indigo-800 font-bold text-xs shadow-2xs">
                      <span className="material-symbols-outlined text-indigo-700 text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                        link
                      </span>
                      <span>
                        {t('relatedBadge', {
                          name: lang === 'bn' ? (relatedVia.bn_name || relatedVia.name) : relatedVia.name
                        })}
                      </span>
                    </span>
                  )}
                  {bmdcNo && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-sky-300/80 bg-sky-50/60 text-[#0284c7] font-bold text-xs shadow-2xs">
                      <span className="material-symbols-outlined text-[#007a8c] text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                        verified
                      </span>
                      <span>BMDC: {bmdcNo}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Institution Row */}
            {(institution || designation) && (
              <div className="mt-2 text-xs sm:text-sm text-slate-600 flex items-start sm:items-center gap-1.5">
                <span className="material-symbols-outlined text-slate-400 text-[18px] shrink-0 mt-0.5 sm:mt-0">apartment</span>
                <span className="leading-snug break-words">
                  {designation && <span className="text-slate-600 font-normal">{designation}{institution ? ', ' : ''}</span>}
                  {institution && <strong className="text-slate-900 font-bold">{institution}</strong>}
                </span>
              </div>
            )}

            {/* Verbatim Card Specialty Line */}
            {specialtyDisplay && (
              <div className="mt-1.5 text-xs sm:text-sm font-medium text-slate-700 leading-snug">
                {specialtyDisplay}
              </div>
            )}

            {/* Specialties Row (placed below designation & institute) */}
            {specialties.length > 0 && (
              <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                <span className="material-symbols-outlined text-slate-400 text-[18px] shrink-0" title="Specialties">
                  medical_services
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {specialties.map((s, idx) => (
                    <button
                      key={s.id || s.slug || idx}
                      type="button"
                      onClick={() => {
                        if (onSelectSpecialty) {
                          onSelectSpecialty(s.slug || s.name);
                        }
                      }}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200/70 shadow-2xs transition-colors cursor-pointer"
                      title={s.bn_name ? `${s.name} (${s.bn_name})` : s.name}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {specialtyFilterActive && doctor.match_rank === 2 && activeSpecialtyName && (
              <div className="mt-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200/70 shadow-2xs">
                  {t('alsoPractices', {
                    specialty: lang === 'bn'
                      ? (activeSpecialtyBnName || activeSpecialtyName)
                      : activeSpecialtyName
                  })}
                </span>
              </div>
            )}

            {/* Metrics Row: Blue Ribbon + Experience • Star + Rating */}
            {(experience || rating) && (
              <div className="mt-2.5 flex flex-wrap items-center gap-2 sm:gap-2.5 text-xs sm:text-sm">
                {experience && (
                  <span className="inline-flex items-center gap-1 text-slate-700 font-medium">
                    <span className="material-symbols-outlined text-[#0284c7] text-[18px]">workspace_premium</span>
                    <span>{experience}</span>
                  </span>
                )}

                {experience && rating && <span className="text-slate-300">•</span>}

                {rating && (
                  <span className="inline-flex items-center gap-1 text-slate-700 font-medium">
                    <span className="material-symbols-outlined text-[#007a8c] text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                      star
                    </span>
                    <strong className="text-slate-900 font-bold">{rating}</strong>
                    {reviewCount !== null && reviewCount !== undefined && (
                      <span className="text-slate-500">({reviewCount} reviews)</span>
                    )}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Chambers Matrix (2 columns for multi-chambers; 1 column if 1 chamber) */}
        {chambers.length > 0 && (
          <div className={`mt-5 pt-4 border-t border-outline-variant/60 grid grid-cols-1 ${chambers.length > 1 ? 'md:grid-cols-2' : ''} gap-3`}>
            {chambers.map((chamber) => (
              <DoctorChamberCard
                key={chamber.id}
                chamber={chamber}
                isSelected={selectedChamber?.id === chamber.id}
                onSelect={() => setUserSelectedChamberId(chamber.id)}
                onSelectHospital={onSelectHospital}
              />
            ))}
          </div>
        )}

        {/* Live Availability Status & Action Footer */}
        <div className="mt-5 pt-4 border-t border-outline-variant flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Appointment Status Pill reflecting the Selected Chamber */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <div className="w-9 h-9 rounded-full bg-[#006877]/10 border border-[#006877]/30 flex items-center justify-center text-[#006877] shrink-0">
              <span className="material-symbols-outlined text-[18px]">schedule</span>
            </div>
            <div>
              <div className="text-label-sm font-label-sm text-[#006877] font-bold">
                {formatNextAvailable(selectedChamber?.next_available || chambers[0]?.next_available)}
              </div>
              <div className="text-body-sm text-outline flex items-center gap-1.5">
                <span className="truncate max-w-[220px] font-medium text-on-surface">
                  {selectedChamber?.facility_name || (chambers.length === 0 ? 'Chamber details on request' : 'Selected Chamber')}
                </span>
                {selectedChamber?.visitSchedule && (
                  <>
                    <span>•</span>
                    <span className="text-slate-500 text-xs">
                      {selectedChamber.visitSchedule.split('(')[0] || 'Advance Booking Open'}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => {
                if (onViewProfile) {
                  onViewProfile({ ...doctor, chambers });
                } else {
                  const targetSlug = doctor?.slug || doctor?.id;
                  if (targetSlug) {
                    window.location.href = `/doctor/${targetSlug}`;
                  }
                }
              }}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-lg border border-secondary text-secondary hover:bg-secondary-container/10 font-label-lg text-label-lg transition-colors cursor-pointer text-center"
            >
              View Full Profile
            </button>
            <button
              type="button"
              onClick={handleBookAppointment}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-label-lg text-label-lg transition-all shadow-sm flex items-center justify-center gap-1.5 active:scale-[0.98] cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">calendar_add_on</span>
              Book Appointment
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

