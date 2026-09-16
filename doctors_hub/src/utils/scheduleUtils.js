export const DAYS_OF_WEEK = [
  'Saturday', 'Sunday', 'Monday', 'Tuesday', 
  'Wednesday', 'Thursday', 'Friday'
];

// Helper: convert HH:MM:SS or HH:MM to total minutes
export const timeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const parts = String(timeStr).slice(0, 5).split(':');
  return parseInt(parts[0] || '0', 10) * 60 + parseInt(parts[1] || '0', 10);
};

// Helper: convert 24h "HH:MM:SS" or "HH:MM" to 12-hour object
export const parse24To12 = (timeStr) => {
  if (!timeStr) return { hour12: 5, minute: '00', period: 'PM' };
  const parts = String(timeStr).split(':');
  const h24 = parseInt(parts[0] || '0', 10);
  const m = parseInt(parts[1] || '0', 10);
  const period = h24 >= 12 ? 'PM' : 'AM';
  let hour12 = h24 % 12;
  if (hour12 === 0) hour12 = 12;
  const minute = String(Number.isNaN(m) ? 0 : m).padStart(2, '0');
  return { hour12, minute, period };
};

// Helper: convert 12-hour values back to "HH:MM:00"
export const format12To24 = (hour12, minute, period) => {
  let h = parseInt(hour12, 10) || 12;
  if (period === 'AM') {
    if (h === 12) h = 0;
  } else {
    if (h !== 12) h += 12;
  }
  const m = String(parseInt(minute, 10) || 0).padStart(2, '0');
  return `${String(h).padStart(2, '0')}:${m}:00`;
};

// Helper: format for human readable 12-hour display e.g. "05:00 PM"
export const formatDisplayTime = (timeStr) => {
  if (!timeStr) return '';
  const { hour12, minute, period } = parse24To12(timeStr);
  return `${String(hour12).padStart(2, '0')}:${minute} ${period}`;
};

// Helper: calculate readable duration between two times
export const calculateSlotDuration = (startStr, endStr) => {
  const startMin = timeToMinutes(startStr);
  const endMin = timeToMinutes(endStr);
  if (endMin <= startMin) return null;
  const diff = endMin - startMin;
  const hours = Math.floor(diff / 60);
  const mins = diff % 60;
  if (mins === 0) return `${hours} hr${hours > 1 ? 's' : ''}`;
  if (hours === 0) return `${mins} min${mins > 1 ? 's' : ''}`;
  return `${hours} hr${hours > 1 ? 's' : ''} ${mins} min`;
};

// Quick Schedule Presets
export const TIME_PRESETS = [
  { label: 'Morning', icon: '🌅', start: '09:00:00', end: '13:00:00', desc: '09:00 AM – 01:00 PM' },
  { label: 'Afternoon', icon: '☀️', start: '14:00:00', end: '17:00:00', desc: '02:00 PM – 05:00 PM' },
  { label: 'Evening', icon: '🌇', start: '17:00:00', end: '21:00:00', desc: '05:00 PM – 09:00 PM' },
  { label: 'Night', icon: '🌙', start: '19:00:00', end: '22:00:00', desc: '07:00 PM – 10:00 PM' },
];

// Helper: validate schedule time ordering and check overlap across doctor affiliations
export const checkScheduleConflict = (targetDay, startStr, endStr, allAffiliations, currentScheduleId = null) => {
  const startMin = timeToMinutes(startStr);
  const endMin = timeToMinutes(endStr);

  if (startMin >= endMin) {
    return {
      hasConflict: true,
      error: 'End time must be strictly after start time.'
    };
  }

  for (const aff of allAffiliations || []) {
    const schedules = Array.isArray(aff.schedules) ? aff.schedules : [];
    for (const s of schedules) {
      if (currentScheduleId && String(s.id) === String(currentScheduleId)) continue;
      if (s.day_of_week === targetDay) {
        const sStartMin = timeToMinutes(s.start_time);
        const sEndMin = timeToMinutes(s.end_time);

        // Interval overlap: start1 < end2 && end1 > start2
        if (startMin < sEndMin && endMin > sStartMin) {
          const locName = aff.hospital?.name || aff.diagnostic_center?.name || aff.chamber_name || aff.facility_name || aff.location?.name || 'another chamber/location';
          const sStartFormatted = formatDisplayTime(s.start_time);
          const sEndFormatted = formatDisplayTime(s.end_time);
          return {
            hasConflict: true,
            error: `Schedule overlaps with existing chamber at "${locName}" (${sStartFormatted} – ${sEndFormatted}) on ${targetDay}. Doctors cannot be in two chambers simultaneously.`
          };
        }
      }
    }
  }

  return { hasConflict: false };
};
