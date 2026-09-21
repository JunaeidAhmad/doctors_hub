/**
 * Doctor name formatting and bilingual display utilities.
 */

const HONORIFIC_PREFIX_RE = /^(?:Dr\.?|Dr\b|ডাক্তার|ডা[ঃ:\.]?)\s*/i;

/**
 * Strips common doctor honorifics from a name string.
 */
export function stripHonorific(name) {
  if (!name) return '';
  let cleaned = String(name).trim();
  while (HONORIFIC_PREFIX_RE.test(cleaned)) {
    cleaned = cleaned.replace(HONORIFIC_PREFIX_RE, '').trim();
  }
  return cleaned;
}

/**
 * Returns the localized doctor display name.
 * In Bangla mode ('bn'): returns doctor.bn_name || doctor.name
 * In English mode ('en'): returns doctor.name || doctor.bn_name
 *
 * @param {Object} doctor Doctor entity
 * @param {string} lang Language code ('en' or 'bn')
 * @returns {string} Display name
 */
export function displayName(doctor, lang = 'en') {
  if (!doctor) return '';
  if (lang === 'bn') {
    return doctor.bn_name || doctor.name || '';
  }
  return doctor.name || doctor.bn_name || '';
}

/**
 * Returns formatted doctor name with proper honorific prefix.
 * e.g., "Dr. Sarah Ahmed" or "ডাঃ সারাহ আহমেদ"
 */
export function formatDoctorTitle(doctor, lang = 'en') {
  const name = displayName(doctor, lang);
  if (!name) return '';
  const clean = stripHonorific(name);
  if (lang === 'bn') {
    return `ডাঃ ${clean}`;
  }
  return `Dr. ${clean}`;
}
