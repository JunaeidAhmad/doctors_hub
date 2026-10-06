import {
  BASE_URL,
  fetchWithTimeout,
  handleResponse,
  getHeaders,
  fetchWithDeduplicationAndCache,
  clearCache,
} from './core';

// Doctor Specialties
export async function getSpecialties() {
  return fetchWithDeduplicationAndCache('specialties', async () => {
    const res = await fetchWithTimeout(`${BASE_URL}/specialties/`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  });
}

export async function getCanonicalSpecialties({ search = '' } = {}) {
  const url = new URL(`${BASE_URL}/specialties/`);
  if (search) url.searchParams.append('search', search);
  const res = await fetchWithTimeout(url, { headers: getHeaders() });
  return handleResponse(res);
}

export async function createSpecialty(data) {
  clearCache();
  const res = await fetchWithTimeout(`${BASE_URL}/specialties/`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function updateSpecialty(id, data) {
  clearCache();
  const res = await fetchWithTimeout(`${BASE_URL}/specialties/${id}/`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function deleteSpecialty(id) {
  clearCache();
  const res = await fetchWithTimeout(`${BASE_URL}/specialties/${id}/`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  if (res.status === 204 || res.status === 200) return true;
  return handleResponse(res);
}

// Specialty Aliases
export async function getSpecialtyAliases({
  specialty = '',
  is_verified = '',
  language = '',
  search = '',
  page = '',
  page_size = '',
} = {}) {
  const url = new URL(`${BASE_URL}/specialty-aliases/`);
  if (specialty) url.searchParams.append('specialty', specialty);
  if (is_verified !== '' && is_verified !== null && is_verified !== undefined) {
    url.searchParams.append('is_verified', is_verified);
  }
  if (language) url.searchParams.append('language', language);
  if (search) url.searchParams.append('search', search);
  if (page) url.searchParams.append('page', page);
  if (page_size) url.searchParams.append('page_size', page_size);

  const res = await fetchWithTimeout(url, { headers: getHeaders() });
  return handleResponse(res);
}

export async function getSpecialtyAliasCounts() {
  const res = await fetchWithTimeout(`${BASE_URL}/specialty-aliases/counts/`, {
    headers: getHeaders(),
  });
  return handleResponse(res);
}

export async function createSpecialtyAlias(data) {
  clearCache();
  const res = await fetchWithTimeout(`${BASE_URL}/specialty-aliases/`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function updateSpecialtyAlias(id, data) {
  clearCache();
  const res = await fetchWithTimeout(`${BASE_URL}/specialty-aliases/${id}/`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function deleteSpecialtyAlias(id) {
  clearCache();
  const res = await fetchWithTimeout(`${BASE_URL}/specialty-aliases/${id}/`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  if (res.status === 204 || res.status === 200) return true;
  return handleResponse(res);
}

export async function verifySpecialtyAlias(id) {
  clearCache();
  const res = await fetchWithTimeout(`${BASE_URL}/specialty-aliases/${id}/verify/`, {
    method: 'POST',
    headers: getHeaders(),
  });
  return handleResponse(res);
}

export async function batchVerifySpecialtyAliases(alias_ids) {
  clearCache();
  const res = await fetchWithTimeout(`${BASE_URL}/specialty-aliases/batch-verify/`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ alias_ids }),
  });
  return handleResponse(res);
}

// Doctors
export async function getDoctors({
  specialty = '',
  division_id = null,
  district_id = null,
  thana_id = null,
  search = '',
  bmdc = '',
  hospital = '',
  diagnostic_center = '',
  facility = '',
  gender = '',
  day = '',
  page = 1,
  page_size = 20,
} = {}) {
  const key = `doc_${specialty}_${division_id || ''}_${district_id || ''}_${thana_id || ''}_${search}_${bmdc}_${hospital}_${diagnostic_center}_${facility}_${gender}_${day}_${page}_${page_size}`;
  return fetchWithDeduplicationAndCache(
    key,
    async () => {
      const url = new URL(`${BASE_URL}/doctors/`);
      if (specialty) url.searchParams.append('specialty', specialty);
      if (division_id) url.searchParams.append('division_id', division_id);
      if (district_id) url.searchParams.append('district_id', district_id);
      if (thana_id) url.searchParams.append('thana_id', thana_id);
      if (search) url.searchParams.append('search', search);
      if (bmdc) url.searchParams.append('bmdc', bmdc);
      if (hospital) url.searchParams.append('hospital', hospital);
      if (diagnostic_center) url.searchParams.append('diagnostic_center', diagnostic_center);
      if (facility) url.searchParams.append('facility', facility);
      if (gender && gender.toLowerCase() !== 'all') url.searchParams.append('gender', gender);
      if (day && day !== 'All' && day !== 'All Days') url.searchParams.append('day', day);
      if (page) url.searchParams.append('page', page);
      if (page_size) url.searchParams.append('page_size', page_size);
      const res = await fetchWithTimeout(url, { headers: getHeaders() });
      return handleResponse(res);
    },
    60000
  );
}

export async function getRelatedDoctors({
  specialty = '',
  division_id = null,
  district_id = null,
  thana_id = null,
  hospital = '',
  diagnostic_center = '',
  facility = '',
  gender = '',
  day = '',
  limit = 6,
} = {}) {
  const key = `docrel_${specialty}_${division_id || ''}_${district_id || ''}_${thana_id || ''}_${hospital || ''}_${diagnostic_center || ''}_${facility || ''}_${gender || ''}_${day || ''}_${limit}`;
  return fetchWithDeduplicationAndCache(
    key,
    async () => {
      const url = new URL(`${BASE_URL}/doctors/related/`);
      if (specialty) url.searchParams.append('specialty', specialty);
      if (division_id) url.searchParams.append('division_id', division_id);
      if (district_id) url.searchParams.append('district_id', district_id);
      if (thana_id) url.searchParams.append('thana_id', thana_id);
      if (hospital) url.searchParams.append('hospital', hospital);
      if (diagnostic_center) url.searchParams.append('diagnostic_center', diagnostic_center);
      if (facility) url.searchParams.append('facility', facility);
      if (gender && gender.toLowerCase() !== 'all') url.searchParams.append('gender', gender);
      if (day && day !== 'All' && day !== 'All Days') url.searchParams.append('day', day);
      if (limit) url.searchParams.append('limit', limit);
      const res = await fetchWithTimeout(url, { headers: getHeaders() });
      return handleResponse(res);
    },
    60000
  );
}

export async function getDoctor(idOrSlug) {
  if (!idOrSlug) return null;
  return fetchWithDeduplicationAndCache(
    `doctor_${idOrSlug}`,
    async () => {
      const res = await fetchWithTimeout(`${BASE_URL}/doctors/${idOrSlug}/`, {
        headers: getHeaders(),
      });
      return handleResponse(res);
    },
    60000
  );
}

export async function createDoctor(doctorData) {
  const isFormData = typeof FormData !== 'undefined' && doctorData instanceof FormData;
  const res = await fetchWithTimeout(`${BASE_URL}/doctors/`, {
    method: 'POST',
    headers: getHeaders(null, isFormData),
    body: isFormData ? doctorData : JSON.stringify(doctorData),
  });
  return handleResponse(res);
}

export async function updateDoctor(id, doctorData) {
  const isFormData = typeof FormData !== 'undefined' && doctorData instanceof FormData;
  const res = await fetchWithTimeout(`${BASE_URL}/doctors/${id}/`, {
    method: 'PATCH',
    headers: getHeaders(null, isFormData),
    body: isFormData ? doctorData : JSON.stringify(doctorData),
  });
  return handleResponse(res);
}

export async function deleteDoctor(id) {
  const res = await fetchWithTimeout(`${BASE_URL}/doctors/${id}/`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  if (res.status === 204 || res.status === 200) return true;
  return handleResponse(res);
}

// Doctor Affiliations
export async function createDoctorAffiliation(data) {
  const res = await fetchWithTimeout(`${BASE_URL}/affiliations/`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function updateDoctorAffiliation(id, data) {
  const res = await fetchWithTimeout(`${BASE_URL}/affiliations/${id}/`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function deleteDoctorAffiliation(id) {
  const res = await fetchWithTimeout(`${BASE_URL}/affiliations/${id}/`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  if (res.status === 204 || res.status === 200) return true;
  return handleResponse(res);
}

export async function syncDoctorChambers(doctorId, chambers) {
  const res = await fetchWithTimeout(`${BASE_URL}/doctors/${doctorId}/chambers/`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({ chambers }),
  });
  return handleResponse(res);
}

// Affiliation Schedules
export async function createAffiliationSchedule(data) {
  const res = await fetchWithTimeout(`${BASE_URL}/schedules/`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function updateAffiliationSchedule(id, data) {
  const res = await fetchWithTimeout(`${BASE_URL}/schedules/${id}/`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function deleteAffiliationSchedule(id) {
  const res = await fetchWithTimeout(`${BASE_URL}/schedules/${id}/`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  if (res.status === 204 || res.status === 200) return true;
  return handleResponse(res);
}

// Affiliation Availability
export async function getAffiliationAvailability(id, { fromDate = '', days = 7 } = {}) {
  const url = new URL(`${BASE_URL}/affiliations/${id}/availability/`);
  if (fromDate) url.searchParams.append('from', fromDate);
  if (days) url.searchParams.append('days', days);
  const cacheKey = `aff_avail_${id}_${fromDate}_${days}`;
  return fetchWithDeduplicationAndCache(cacheKey, async () => {
    const res = await fetchWithTimeout(url, { headers: getHeaders() });
    return handleResponse(res);
  }, 30000);
}

// Schedule Exceptions
export async function getScheduleExceptions(params = {}) {
  const url = new URL(`${BASE_URL}/schedule-exceptions/`);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') {
      url.searchParams.append(k, v);
    }
  });
  const res = await fetchWithTimeout(url, { headers: getHeaders() });
  return handleResponse(res);
}

export async function createScheduleException(data) {
  const res = await fetchWithTimeout(`${BASE_URL}/schedule-exceptions/`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function deleteScheduleException(id) {
  const res = await fetchWithTimeout(`${BASE_URL}/schedule-exceptions/${id}/`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  if (res.status === 204 || res.status === 200) return true;
  return handleResponse(res);
}

// Facility Doctor Onboarding
export async function onboardFacilityDoctor(locationId, { doctor, affiliation }) {
  let docId = doctor?.id;
  if (!docId) {
    const newDoc = await createDoctor(doctor);
    docId = newDoc.id;
  }
  return createDoctorAffiliation({
    doctor: docId,
    location_id: locationId,
    ...affiliation,
  });
}
