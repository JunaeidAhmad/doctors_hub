import {
  BASE_URL,
  fetchWithTimeout,
  handleResponse,
  getHeaders,
  fetchWithDeduplicationAndCache,
  setCached,
} from './core';

// Admin Bootstrap (BFF pattern)
export async function getAdminDashboardInit() {
  const res = await fetchWithTimeout(`${BASE_URL}/admin/dashboard-init/`, {
    headers: getHeaders(),
  });
  return handleResponse(res);
}

// Search Metadata / Bootstrap Endpoint
export async function getSearchMetadata() {
  return fetchWithDeduplicationAndCache('search_metadata', async () => {
    const res = await fetchWithTimeout(`${BASE_URL}/search-metadata/`, {
      headers: getHeaders(),
    });
    const data = await handleResponse(res);
    if (data && typeof data === 'object') {
      if (data.specialties_az) setCached('specialties', data.specialties_az);
      else if (data.specialties) setCached('specialties', data.specialties);
      if (data.test_categories) setCached('test_categories', data.test_categories);
      if (data.diagnostic_center_categories) setCached('diagnostic_center_categories', data.diagnostic_center_categories);
      if (data.hospital_categories) setCached('hospital_categories', data.hospital_categories);
      if (data.hospital_services) setCached('hospital_services', data.hospital_services);
      if (data.diagnostic_services) setCached('diagnostic_services', data.diagnostic_services);
    }
    return data;
  });
}

// Dynamic Search Facets Endpoint
export async function getSearchFacets({ division_id = null, district_id = null, thana_id = null, search = '' } = {}) {
  const params = {};
  if (division_id) params.division_id = division_id;
  if (district_id) params.district_id = district_id;
  if (thana_id) params.thana_id = thana_id;
  if (search && search.trim()) params.search = search.trim();

  const query = new URLSearchParams(params).toString();
  const key = `search_facets_${query || 'all'}`;

  return fetchWithDeduplicationAndCache(key, async () => {
    const url = `${BASE_URL}/search-facets/${query ? `?${query}` : ''}`;
    const res = await fetchWithTimeout(url, { headers: getHeaders() });
    return handleResponse(res);
  });
}

// Locations
export async function getLocations() {
  const res = await fetchWithTimeout(`${BASE_URL}/locations/`, {
    headers: getHeaders(),
  });
  return handleResponse(res);
}

export async function searchLocations(params = {}) {
  const query = new URLSearchParams({ view: 'picker', page_size: 20 });
  if (params.search) query.set('search', params.search);
  if (params.location_type) query.set('location_type', params.location_type);
  const res = await fetchWithTimeout(`${BASE_URL}/locations/?${query}`, {
    headers: getHeaders(),
  });
  return handleResponse(res);
}

export async function getLocationLabel(id) {
  const res = await fetchWithTimeout(`${BASE_URL}/locations/${id}/?view=picker`, {
    headers: getHeaders(),
  });
  return handleResponse(res);
}

export async function getPracticeLocations() {
  return getLocations();
}

// Delegated Facility Staff Management
export async function getFacilityStaff(locationId) {
  const res = await fetchWithTimeout(`${BASE_URL}/facilities/${locationId}/staff/`, {
    headers: getHeaders(),
  });
  return handleResponse(res);
}

export async function addFacilityStaff(locationId, staffData) {
  const res = await fetchWithTimeout(`${BASE_URL}/facilities/${locationId}/staff/`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(staffData),
  });
  return handleResponse(res);
}

export async function deleteFacilityStaff(locationId, userId) {
  const res = await fetchWithTimeout(`${BASE_URL}/facilities/${locationId}/staff/${userId}/`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  if (res.status === 204) return true;
  return handleResponse(res);
}

// Super Admin Verification Queue & Platform Admins
export async function getVerificationQueue() {
  const res = await fetchWithTimeout(`${BASE_URL}/admin/verifications/`, {
    headers: getHeaders(),
  });
  return handleResponse(res);
}

export async function performVerificationAction(entityType, entityId, action = 'approve') {
  const res = await fetchWithTimeout(`${BASE_URL}/admin/verifications/${entityType}/${entityId}/`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ action }),
  });
  return handleResponse(res);
}

export async function getPlatformAdmins() {
  const res = await fetchWithTimeout(`${BASE_URL}/admin/platform-admins/`, {
    headers: getHeaders(),
  });
  return handleResponse(res);
}

export async function createPlatformAdmin(data) {
  const res = await fetchWithTimeout(`${BASE_URL}/admin/platform-admins/`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

// User Management (Admin CRUD)
export async function createUser(userData) {
  const res = await fetchWithTimeout(`${BASE_URL}/users/`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(userData),
  });
  return handleResponse(res);
}

export async function getUsers(params = {}) {
  const query = new URLSearchParams(params).toString();
  const res = await fetchWithTimeout(`${BASE_URL}/users/${query ? `?${query}` : ''}`, {
    headers: getHeaders(),
  });
  return handleResponse(res);
}

