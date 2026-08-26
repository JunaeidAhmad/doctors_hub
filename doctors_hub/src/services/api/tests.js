import {
  BASE_URL,
  fetchWithTimeout,
  handleResponse,
  getHeaders,
  fetchWithDeduplicationAndCache,
  clearCache,
  flattenFacility,
} from './core';

// Facility Tests (prices per location)
export async function getDiagnosticCenterTests({
  location = '',
  center = '',
  hospital = '',
  test = '',
  branch = '',
  search = '',
  category = '',
  page = 1,
  page_size = 20,
} = {}) {
  const locId = location || center || branch || hospital;
  const key = `ft_v2_${locId}_${test}_${search}_${category}_${page}_${page_size}`;
  return fetchWithDeduplicationAndCache(
    key,
    async () => {
      const base = BASE_URL.startsWith('http')
        ? BASE_URL
        : typeof window !== 'undefined'
        ? `${window.location.origin}${BASE_URL}`
        : `http://localhost:8000${BASE_URL}`;
      const url = new URL(`${base}/facility-tests/`);
      if (locId) url.searchParams.append('location', locId);
      if (test) url.searchParams.append('test', test);
      if (search) url.searchParams.append('search', search);
      if (category && category !== 'all' && category !== 'All Test Categories') {
        url.searchParams.append('category', category);
      }
      if (page) url.searchParams.append('page', page);
      if (page_size) url.searchParams.append('page_size', page_size);
      const res = await fetchWithTimeout(url, { headers: getHeaders() });
      return flattenFacility(await handleResponse(res));
    },
    60000
  );
}

export async function createDiagnosticCenterTest(data) {
  // Map frontend fields to backend serializer fields
  const payload = { ...data };
  payload.location_id = data.center || data.hospital || data.branch || data.location_id;
  payload.test_id = data.test || data.test_id;

  const res = await fetchWithTimeout(`${BASE_URL}/facility-tests/`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function updateFacilityTest(id, data) {
  const payload = { ...data };
  if (data.test) payload.test_id = data.test;
  const res = await fetchWithTimeout(`${BASE_URL}/facility-tests/${id}/`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  clearCache();
  return handleResponse(res);
}

export async function updateDiagnosticCenterTest(id, data) {
  return updateFacilityTest(id, data);
}

export async function deleteDiagnosticCenterTest(id) {
  const res = await fetchWithTimeout(`${BASE_URL}/facility-tests/${id}/`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  if (res.status === 204 || res.status === 200) return true;
  return handleResponse(res);
}

// Backward compatibility alias for branch tests
export async function getBranchTests(params) {
  return getDiagnosticCenterTests(params);
}
export async function createBranchTest(data) {
  return createDiagnosticCenterTest(data);
}
export async function deleteBranchTest(id) {
  return deleteDiagnosticCenterTest(id);
}

// Test Categories
export async function getTestCategories() {
  return fetchWithDeduplicationAndCache('test_categories', async () => {
    const res = await fetchWithTimeout(`${BASE_URL}/test-categories/`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  });
}

export async function createTestCategory(data) {
  clearCache();
  const res = await fetchWithTimeout(`${BASE_URL}/test-categories/`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function updateTestCategory(id, data) {
  clearCache();
  const res = await fetchWithTimeout(`${BASE_URL}/test-categories/${id}/`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function deleteTestCategory(id) {
  clearCache();
  const res = await fetchWithTimeout(`${BASE_URL}/test-categories/${id}/`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  if (res.status === 204 || res.status === 200) return true;
  return handleResponse(res);
}

// Pathology Base Tests
export async function getTests({ search = '', category = '' } = {}) {
  const key = `tests_${search}_${category}`;
  return fetchWithDeduplicationAndCache(
    key,
    async () => {
      const url = new URL(`${BASE_URL}/tests/`);
      if (search) url.searchParams.append('search', search);
      if (category) url.searchParams.append('category', category);
      const res = await fetchWithTimeout(url, { headers: getHeaders() });
      return handleResponse(res);
    },
    60000
  );
}

export async function createTest(testData) {
  clearCache();
  const res = await fetchWithTimeout(`${BASE_URL}/tests/`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(testData),
  });
  return handleResponse(res);
}

export async function updateTest(id, testData) {
  clearCache();
  const res = await fetchWithTimeout(`${BASE_URL}/tests/${id}/`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(testData),
  });
  return handleResponse(res);
}

export async function deleteTest(id) {
  clearCache();
  const res = await fetchWithTimeout(`${BASE_URL}/tests/${id}/`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  if (res.status === 204 || res.status === 200) return true;
  return handleResponse(res);
}
