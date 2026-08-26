import {
  BASE_URL,
  fetchWithTimeout,
  handleResponse,
  getHeaders,
  fetchWithDeduplicationAndCache,
  clearCache,
  flattenFacility,
} from './core';
import { getHospitalById } from './hospitals';

// Diagnostic Services
export async function getDiagnosticServices() {
  return fetchWithDeduplicationAndCache('diagnostic_services', async () => {
    const res = await fetchWithTimeout(`${BASE_URL}/diagnostic-services/`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  });
}

export async function createDiagnosticService(data) {
  clearCache();
  const res = await fetchWithTimeout(`${BASE_URL}/diagnostic-services/`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function updateDiagnosticService(id, data) {
  clearCache();
  const res = await fetchWithTimeout(`${BASE_URL}/diagnostic-services/${id}/`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function deleteDiagnosticService(id) {
  clearCache();
  const res = await fetchWithTimeout(`${BASE_URL}/diagnostic-services/${id}/`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  if (res.status === 204 || res.status === 200) return true;
  return handleResponse(res);
}

// Diagnostic Center Categories
export async function getDiagnosticCenterCategories() {
  return fetchWithDeduplicationAndCache('diagnostic_center_categories', async () => {
    const res = await fetchWithTimeout(`${BASE_URL}/diagnostic-center-categories/`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  });
}

export async function createDiagnosticCenterCategory(data) {
  clearCache();
  const res = await fetchWithTimeout(`${BASE_URL}/diagnostic-center-categories/`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function updateDiagnosticCenterCategory(id, data) {
  clearCache();
  const res = await fetchWithTimeout(`${BASE_URL}/diagnostic-center-categories/${id}/`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function deleteDiagnosticCenterCategory(id) {
  clearCache();
  const res = await fetchWithTimeout(`${BASE_URL}/diagnostic-center-categories/${id}/`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  if (res.status === 204 || res.status === 200) return true;
  return handleResponse(res);
}

// Diagnostic Centers
export async function getDiagnosticCenters({
  location = '',
  division = '',
  district = '',
  area = '',
  ownership_type = '',
  category = '',
  spec = '',
  owner = '',
  testcat = '',
  search = '',
  page = 1,
  page_size = 10,
} = {}) {
  const key = `diag_${location}_${division}_${district}_${area}_${ownership_type}_${category}_${spec}_${owner}_${testcat}_${search}_${page}_${page_size}`;
  return fetchWithDeduplicationAndCache(
    key,
    async () => {
      const url = new URL(`${BASE_URL}/diagnostic-centers/`);
      if (location && location !== 'All Bangladesh') url.searchParams.append('location', location);
      if (division && division !== 'All Bangladesh') url.searchParams.append('division', division);
      if (district && district !== 'All Districts') url.searchParams.append('district', district);
      if (area && area !== 'All Areas') url.searchParams.append('area', area);
      if (ownership_type && ownership_type !== 'all') url.searchParams.append('ownership_type', ownership_type);
      if (category) url.searchParams.append('category', category);
      if (spec) url.searchParams.append('spec', spec);
      if (owner) url.searchParams.append('owner', owner);
      if (testcat) url.searchParams.append('testcat', testcat);
      if (search) url.searchParams.append('search', search);
      if (page) url.searchParams.append('page', page);
      if (page_size) url.searchParams.append('page_size', page_size);
      const res = await fetchWithTimeout(url, { headers: getHeaders() });
      return flattenFacility(await handleResponse(res));
    },
    60000
  );
}

export async function getDiagnosticCenterById(id) {
  const res = await fetchWithTimeout(`${BASE_URL}/diagnostic-centers/${id}/`, { headers: getHeaders() });
  return flattenFacility(await handleResponse(res));
}

export async function createDiagnosticCenter(data) {
  const res = await fetchWithTimeout(`${BASE_URL}/diagnostic-centers/`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function updateDiagnosticCenter(id, data) {
  const res = await fetchWithTimeout(`${BASE_URL}/diagnostic-centers/${id}/`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function patchDiagnosticCenter(id, data) {
  const isFormData = data instanceof FormData;
  const headers = getHeaders();
  if (isFormData) delete headers['Content-Type'];
  const res = await fetchWithTimeout(`${BASE_URL}/diagnostic-centers/${id}/`, {
    method: 'PATCH',
    headers,
    body: isFormData ? data : JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function deleteDiagnosticCenter(id) {
  const res = await fetchWithTimeout(`${BASE_URL}/diagnostic-centers/${id}/`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  if (res.status === 204 || res.status === 200) return true;
  return handleResponse(res);
}

// Backward compatibility alias for getBranches / getChambers
export async function getBranches({ location = '' } = {}) {
  return getDiagnosticCenters({ location });
}

export async function getBranchById(id) {
  try {
    return await getHospitalById(id);
  } catch {
    return await getDiagnosticCenterById(id);
  }
}

export async function getChambers(location = '') {
  return getBranches({ location });
}

export async function getChamberById(id) {
  return getBranchById(id);
}

export async function createBranch(data) {
  clearCache();
  return createDiagnosticCenter(data);
}

export async function updateBranch(id, data) {
  clearCache();
  return updateDiagnosticCenter(id, data);
}

export async function deleteBranch(id) {
  clearCache();
  return deleteDiagnosticCenter(id);
}

export async function createChamber(data) {
  clearCache();
  return createDiagnosticCenter(data);
}

export async function updateChamber(id, data) {
  clearCache();
  return updateDiagnosticCenter(id, data);
}

export async function deleteChamber(id) {
  clearCache();
  return deleteDiagnosticCenter(id);
}
