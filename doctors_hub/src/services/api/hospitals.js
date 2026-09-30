import {
  BASE_URL,
  fetchWithTimeout,
  handleResponse,
  getHeaders,
  fetchWithDeduplicationAndCache,
  clearCache,
} from './core';

// Hospital Categories (renamed from HospitalSpecialty)
export async function getHospitalCategories() {
  return fetchWithDeduplicationAndCache('hospital_categories', async () => {
    const res = await fetchWithTimeout(`${BASE_URL}/hospital-categories/`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  });
}

export async function createHospitalCategory(data) {
  clearCache();
  const res = await fetchWithTimeout(`${BASE_URL}/hospital-categories/`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function updateHospitalCategory(id, data) {
  clearCache();
  const res = await fetchWithTimeout(`${BASE_URL}/hospital-categories/${id}/`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function deleteHospitalCategory(id) {
  clearCache();
  const res = await fetchWithTimeout(`${BASE_URL}/hospital-categories/${id}/`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  if (res.status === 204 || res.status === 200) return true;
  return handleResponse(res);
}

// Backward compatibility alias for Hospital Categories
export async function getHospitalSpecialties() {
  return getHospitalCategories();
}
export async function createHospitalSpecialty(data) {
  return createHospitalCategory(data);
}
export async function updateHospitalSpecialty(id, data) {
  return updateHospitalCategory(id, data);
}
export async function deleteHospitalSpecialty(id) {
  return deleteHospitalCategory(id);
}

// Hospital Services
export async function getHospitalServices() {
  return fetchWithDeduplicationAndCache('hospital_services', async () => {
    const res = await fetchWithTimeout(`${BASE_URL}/hospital-services/`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  });
}

export async function createHospitalService(data) {
  clearCache();
  const res = await fetchWithTimeout(`${BASE_URL}/hospital-services/`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function updateHospitalService(id, data) {
  clearCache();
  const res = await fetchWithTimeout(`${BASE_URL}/hospital-services/${id}/`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function deleteHospitalService(id) {
  clearCache();
  const res = await fetchWithTimeout(`${BASE_URL}/hospital-services/${id}/`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  if (res.status === 204 || res.status === 200) return true;
  return handleResponse(res);
}

export async function getHospitals({
  division_id = null,
  district_id = null,
  thana_id = null,
  ownership_type = '',
  category = '',
  search = '',
  ordering = '',
  page = 1,
  page_size = 10,
} = {}) {
  const key = `hosp_${division_id || ''}_${district_id || ''}_${thana_id || ''}_${ownership_type}_${category}_${search}_${ordering}_${page}_${page_size}`;
  return fetchWithDeduplicationAndCache(
    key,
    async () => {
      const url = new URL(`${BASE_URL}/hospitals/`);
      if (division_id) url.searchParams.append('division_id', division_id);
      if (district_id) url.searchParams.append('district_id', district_id);
      if (thana_id) url.searchParams.append('thana_id', thana_id);
      if (ownership_type && ownership_type !== 'all') url.searchParams.append('ownership_type', ownership_type);
      if (category) url.searchParams.append('category', category);
      if (search) url.searchParams.append('search', search);
      if (ordering) url.searchParams.append('ordering', ordering);
      if (page) url.searchParams.append('page', page);
      if (page_size) url.searchParams.append('page_size', page_size);
      const res = await fetchWithTimeout(url, { headers: getHeaders() });
      return handleResponse(res);
    },
    60000
  );
}

export async function getHospitalById(id) {
  const res = await fetchWithTimeout(`${BASE_URL}/hospitals/${id}/`, { headers: getHeaders() });
  return handleResponse(res);
}
export const getBranchById = getHospitalById;

export async function createHospital(data) {
  clearCache();
  const res = await fetchWithTimeout(`${BASE_URL}/hospitals/`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function updateHospital(id, data) {
  clearCache();
  const res = await fetchWithTimeout(`${BASE_URL}/hospitals/${id}/`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function patchHospital(id, data) {
  clearCache();
  const isFormData = data instanceof FormData;
  const headers = getHeaders();
  if (isFormData) delete headers['Content-Type'];
  const res = await fetchWithTimeout(`${BASE_URL}/hospitals/${id}/`, {
    method: 'PATCH',
    headers,
    body: isFormData ? data : JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function deleteHospital(id) {
  clearCache();
  const res = await fetchWithTimeout(`${BASE_URL}/hospitals/${id}/`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  if (res.status === 204 || res.status === 200) return true;
  return handleResponse(res);
}

// Facility-scoped actions (P1.6.6)
export async function getFacilityDoctors(kind = 'hospitals', idOrSlug, params = {}) {
  const cleanParams = {};
  for (const [k, v] of Object.entries(params)) {
    if (v !== null && v !== undefined && v !== '' && v !== 'all') {
      cleanParams[k] = v;
    }
  }
  const cacheKey = `fac_docs_${kind}_${idOrSlug}_${JSON.stringify(cleanParams)}`;
  return fetchWithDeduplicationAndCache(
    cacheKey,
    async () => {
      const base = BASE_URL.startsWith('http')
        ? BASE_URL
        : typeof window !== 'undefined'
        ? `${window.location.origin}${BASE_URL}`
        : `http://localhost:8000${BASE_URL}`;
      const url = new URL(`${base}/${kind}/${encodeURIComponent(idOrSlug)}/doctors/`);
      for (const [k, v] of Object.entries(cleanParams)) {
        url.searchParams.set(k, String(v));
      }
      const res = await fetchWithTimeout(url, { headers: getHeaders() });
      return handleResponse(res);
    },
    60000
  );
}

export async function getFacilityTests(kind = 'hospitals', idOrSlug, params = {}) {
  const cleanParams = {};
  for (const [k, v] of Object.entries(params)) {
    if (v !== null && v !== undefined && v !== '' && v !== 'all') {
      cleanParams[k] = v;
    }
  }
  const cacheKey = `fac_tests_${kind}_${idOrSlug}_${JSON.stringify(cleanParams)}`;
  return fetchWithDeduplicationAndCache(
    cacheKey,
    async () => {
      const base = BASE_URL.startsWith('http')
        ? BASE_URL
        : typeof window !== 'undefined'
        ? `${window.location.origin}${BASE_URL}`
        : `http://localhost:8000${BASE_URL}`;
      const url = new URL(`${base}/${kind}/${encodeURIComponent(idOrSlug)}/tests/`);
      for (const [k, v] of Object.entries(cleanParams)) {
        url.searchParams.set(k, String(v));
      }
      const res = await fetchWithTimeout(url, { headers: getHeaders() });
      return handleResponse(res);
    },
    60000
  );
}

