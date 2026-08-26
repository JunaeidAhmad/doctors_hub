import {
  BASE_URL,
  fetchWithTimeout,
  handleResponse,
  getHeaders,
  fetchWithDeduplicationAndCache,
  setCached,
  flattenFacility,
} from './core';

// Admin Bootstrap (BFF pattern)
export async function getAdminDashboardInit() {
  const res = await fetchWithTimeout(`${BASE_URL}/admin/dashboard-init/`, {
    headers: getHeaders(),
  });
  const data = await handleResponse(res);
  if (data && typeof data === 'object') {
    if (Array.isArray(data.hospitals)) {
      data.hospitals = data.hospitals.map(flattenFacility);
    }
    if (Array.isArray(data.diagnostic_centers)) {
      data.diagnostic_centers = data.diagnostic_centers.map(flattenFacility);
    }
  }
  return data;
}

// Search Metadata / Bootstrap Endpoint
export async function getSearchMetadata() {
  return fetchWithDeduplicationAndCache('search_metadata', async () => {
    const res = await fetchWithTimeout(`${BASE_URL}/search-metadata/`, {
      headers: getHeaders(),
    });
    const data = await handleResponse(res);
    if (data && typeof data === 'object') {
      if (data.specialties) setCached('specialties', data.specialties);
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
export async function getSearchFacets({ location = '', area = '', search = '' } = {}) {
  const params = {};
  if (location && location !== 'All Bangladesh') params.location = location;
  if (area && area !== 'All Areas') params.area = area;
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
