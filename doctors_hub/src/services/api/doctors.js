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

// Doctors
export async function getDoctors({
  specialty = '',
  location = '',
  division = '',
  district = '',
  area = '',
  search = '',
  hospital = '',
  diagnostic_center = '',
  fee_max = '',
  day = '',
  page = 1,
  page_size = 20,
} = {}) {
  const key = `doc_${specialty}_${location}_${division}_${district}_${area}_${search}_${hospital}_${diagnostic_center}_${fee_max}_${day}_${page}_${page_size}`;
  return fetchWithDeduplicationAndCache(
    key,
    async () => {
      const url = new URL(`${BASE_URL}/doctors/`);
      if (specialty) url.searchParams.append('specialty', specialty);
      if (location && location !== 'All Bangladesh') url.searchParams.append('location', location);
      if (division && division !== 'All Bangladesh') url.searchParams.append('division', division);
      if (district && district !== 'All Districts') url.searchParams.append('district', district);
      if (area && area !== 'All Areas') url.searchParams.append('area', area);
      if (search) url.searchParams.append('search', search);
      if (hospital) url.searchParams.append('hospital', hospital);
      if (diagnostic_center) url.searchParams.append('diagnostic_center', diagnostic_center);
      if (fee_max) url.searchParams.append('fee_max', fee_max);
      if (day && day !== 'All') url.searchParams.append('day', day);
      if (page) url.searchParams.append('page', page);
      if (page_size) url.searchParams.append('page_size', page_size);
      const res = await fetchWithTimeout(url, { headers: getHeaders() });
      return handleResponse(res);
    },
    60000
  );
}

export async function createDoctor(doctorData) {
  const res = await fetchWithTimeout(`${BASE_URL}/doctors/`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(doctorData),
  });
  return handleResponse(res);
}

export async function updateDoctor(id, doctorData) {
  const res = await fetchWithTimeout(`${BASE_URL}/doctors/${id}/`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify(doctorData),
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

// Affiliation Schedules
export async function createAffiliationSchedule(data) {
  const res = await fetchWithTimeout(`${BASE_URL}/schedules/`, {
    method: 'POST',
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
