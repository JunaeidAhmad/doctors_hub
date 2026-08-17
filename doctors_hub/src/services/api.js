const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://doctors-hub.onrender.com/api';

async function fetchWithTimeout(url, options = {}, timeoutMs = 60000) {
  if (!timeoutMs || typeof timeoutMs !== 'number' || timeoutMs <= 0) {
    return fetch(url, options);
  }
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (err) {
    clearTimeout(id);
    if (
      err.name === 'AbortError' ||
      err.name === 'DOMException' ||
      (err.message && err.message.toLowerCase().includes('aborted'))
    ) {
      throw new Error('Server response timed out. Please try again.');
    }
    throw err;
  }
}

export function ensureArray(val, fallback = []) {
  if (Array.isArray(val)) return val;
  if (val && typeof val === 'object' && Array.isArray(val.results)) return val.results;
  return fallback;
}

export function isPageReload() {
  if (typeof window === 'undefined') return false;
  try {
    const navEntries = window.performance?.getEntriesByType?.('navigation');
    if (navEntries && navEntries.length > 0) {
      return navEntries[0].type === 'reload';
    }
    return window.performance?.navigation?.type === 1;
  } catch {
    return false;
  }
}

let initialLoad = true;
export function getIsInitialLoad() {
  return initialLoad;
}
export function setInitialLoadComplete() {
  initialLoad = false;
}

const memoryCache = new Map();
const inFlightRequests = new Map();

export function clearCache() {
  memoryCache.clear();
  inFlightRequests.clear();
  try {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('cache_')) keysToRemove.push(k);
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
  } catch (e) {}
}

function getCached(key, ttlMs = 300000) {
  const entry = memoryCache.get(key);
  if (entry) {
    if (Date.now() - entry.timestamp <= ttlMs) {
      return entry.data;
    }
    memoryCache.delete(key);
  }
  if (typeof window !== 'undefined') {
    try {
      const local = localStorage.getItem(`cache_${key}`);
      if (local) {
        const parsed = JSON.parse(local);
        if (Date.now() - parsed.timestamp <= ttlMs) {
          memoryCache.set(key, parsed);
          return parsed.data;
        }
        localStorage.removeItem(`cache_${key}`);
      }
    } catch (e) {}
  }
  return null;
}

function setCached(key, data) {
  const entry = { timestamp: Date.now(), data };
  memoryCache.set(key, entry);
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(`cache_${key}`, JSON.stringify(entry));
    } catch (e) {}
  }
}

/**
 * Deduplicate concurrent in-flight requests and serve cached data
 */
async function fetchWithDeduplicationAndCache(cacheKey, fetchFn, ttlMs = 300000) {
  // 1. Check valid cache first
  const cached = getCached(cacheKey, ttlMs);
  if (cached !== null && cached !== undefined) {
    return cached;
  }

  // 2. Return pending in-flight promise if same request is already executing
  if (inFlightRequests.has(cacheKey)) {
    return inFlightRequests.get(cacheKey);
  }

  // 3. Fire request
  const requestPromise = (async () => {
    try {
      const data = await fetchFn();
      if (data !== undefined && data !== null) {
        setCached(cacheKey, data);
      }
      return data;
    } catch (err) {
      // If network error or 429 rate limit occurs, try to return stale cache if available
      const stale = getCached(cacheKey, 86400000); // 24h stale tolerance
      if (stale !== null && stale !== undefined) {
        console.warn(`[api] Returning cached data for ${cacheKey} due to API rate limit/error`);
        return stale;
      }
      throw err;
    } finally {
      inFlightRequests.delete(cacheKey);
    }
  })();

  inFlightRequests.set(cacheKey, requestPromise);
  return requestPromise;
}

/**
 * Helper to handle fetch responses and errors
 */
async function handleResponse(response) {
  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
    }
    if (response.status === 429) {
      console.warn("API Rate limited (HTTP 429) - serving fallback or cached data.");
    }
    let errorMessage = `HTTP Error ${response.status}`;
    try {
      const errorData = await response.json();
      if (typeof errorData === 'object' && errorData !== null) {
        if (errorData.detail) {
          errorMessage = errorData.detail;
        } else if (errorData.non_field_errors) {
          errorMessage = errorData.non_field_errors.join(', ');
        } else {
          errorMessage = Object.entries(errorData)
            .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(', ') : val}`)
            .join(' | ');
        }
      }
    } catch {
      // JSON parsing failed, use status text
    }
    const err = new Error(errorMessage);
    err.status = response.status;
    throw err;
  }
  return response.json();
}

/**
 * Helper to flatten location_details into the main object for frontend compatibility
 */
function flattenFacility(data) {
  if (Array.isArray(data)) {
    return data.map(flattenFacility);
  }
  if (data && Array.isArray(data.results)) {
    return { ...data, results: data.results.map(flattenFacility) };
  }
  if (data && data.facility_name) {
    data.center_name = data.facility_name;
    data.hospital_name = data.facility_name;
  }
  if (data && data.location_details) {
    const loc = data.location_details;
    const addr = loc.address_details || {};
    const addressLine = loc.address_line || addr.address_line || (typeof loc.address === 'string' ? loc.address : '') || '';
    const city = loc.city || addr.city || '';
    const district = loc.district || addr.district || '';
    const division = loc.division || addr.division || '';
    const area = loc.area || addr.area || '';

    let catList = [];
    if (Array.isArray(data.categories)) {
      catList = data.categories;
    } else if (data.category) {
      catList = [data.category];
    }

    return {
      ...data,
      ...loc,
      ...addr,
      address_line: addressLine,
      address: addressLine,
      city,
      district,
      division,
      area,
      category: data.category || catList[0] || null,
      categories: catList,
      category_name: data.category?.name || catList[0]?.name || data.category_name || '',
      id: data.location_id || loc.id || data.id,
    };
  }
  return data;
}

/**
 * Get headers, including optional Authorization token
 */
function getHeaders(token = null) {
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  } else {
    const storedToken = localStorage.getItem('access_token');
    if (storedToken) {
      headers['Authorization'] = `Bearer ${storedToken}`;
    }
  }
  return headers;
}

export const api = {
  // Admin Bootstrap (BFF pattern)
  async getAdminDashboardInit() {
    const res = await fetchWithTimeout(`${BASE_URL}/admin/dashboard-init/`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  // Auth
  async login(phone_number, password) {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    const res = await fetchWithTimeout(`${BASE_URL}/auth/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone_number, password }),
    });
    const data = await handleResponse(res);
    if (data.access) {
      localStorage.setItem('access_token', data.access);
      localStorage.setItem('refresh_token', data.refresh);
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    return data;
  },

  async register(phone_number, password, first_name = '', last_name = '') {
    const res = await fetchWithTimeout(`${BASE_URL}/auth/register/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ phone_number, password, first_name, last_name }),
    });
    const data = await handleResponse(res);
    if (data.access) {
      localStorage.setItem('access_token', data.access);
      localStorage.setItem('refresh_token', data.refresh);
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    return data;
  },

  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  },

  getCurrentUser() {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  },

  async updateProfile(profileData) {
    const res = await fetchWithTimeout(`${BASE_URL}/auth/me/`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(profileData),
    });
    const data = await handleResponse(res);
    const existingUser = this.getCurrentUser() || {};
    const updatedUser = { ...existingUser, ...data };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    return updatedUser;
  },

  // Doctor Specialties
  async getSpecialties() {
    return fetchWithDeduplicationAndCache('specialties', async () => {
      const res = await fetchWithTimeout(`${BASE_URL}/specialties/`, {
        headers: getHeaders(),
      });
      return handleResponse(res);
    });
  },
  async createSpecialty(data) {
    clearCache();
    const res = await fetchWithTimeout(`${BASE_URL}/specialties/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
  async updateSpecialty(id, data) {
    clearCache();
    const res = await fetchWithTimeout(`${BASE_URL}/specialties/${id}/`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
  async deleteSpecialty(id) {
    clearCache();
    const res = await fetchWithTimeout(`${BASE_URL}/specialties/${id}/`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (res.status === 204 || res.status === 200) return true;
    return handleResponse(res);
  },

  // Hospital Categories (renamed from HospitalSpecialty)
  async getHospitalCategories() {
    return fetchWithDeduplicationAndCache('hospital_categories', async () => {
      const res = await fetchWithTimeout(`${BASE_URL}/hospital-categories/`, {
        headers: getHeaders(),
      });
      return handleResponse(res);
    });
  },
  async createHospitalCategory(data) {
    clearCache();
    const res = await fetchWithTimeout(`${BASE_URL}/hospital-categories/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
  async updateHospitalCategory(id, data) {
    clearCache();
    const res = await fetchWithTimeout(`${BASE_URL}/hospital-categories/${id}/`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
  async deleteHospitalCategory(id) {
    clearCache();
    const res = await fetchWithTimeout(`${BASE_URL}/hospital-categories/${id}/`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (res.status === 204 || res.status === 200) return true;
    return handleResponse(res);
  },
  // Backward compatibility alias for Hospital Categories
  async getHospitalSpecialties() { return this.getHospitalCategories(); },
  async createHospitalSpecialty(data) { return this.createHospitalCategory(data); },
  async updateHospitalSpecialty(id, data) { return this.updateHospitalCategory(id, data); },
  async deleteHospitalSpecialty(id) { return this.deleteHospitalCategory(id); },

  // Hospital Services
  async getHospitalServices() {
    return fetchWithDeduplicationAndCache('hospital_services', async () => {
      const res = await fetchWithTimeout(`${BASE_URL}/hospital-services/`, {
        headers: getHeaders(),
      });
      return handleResponse(res);
    });
  },
  async createHospitalService(data) {
    clearCache();
    const res = await fetchWithTimeout(`${BASE_URL}/hospital-services/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
  async updateHospitalService(id, data) {
    clearCache();
    const res = await fetchWithTimeout(`${BASE_URL}/hospital-services/${id}/`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
  async deleteHospitalService(id) {
    clearCache();
    const res = await fetchWithTimeout(`${BASE_URL}/hospital-services/${id}/`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (res.status === 204 || res.status === 200) return true;
    return handleResponse(res);
  },

  // Diagnostic Services
  async getDiagnosticServices() {
    return fetchWithDeduplicationAndCache('diagnostic_services', async () => {
      const res = await fetchWithTimeout(`${BASE_URL}/diagnostic-services/`, {
        headers: getHeaders(),
      });
      return handleResponse(res);
    });
  },
  async createDiagnosticService(data) {
    clearCache();
    const res = await fetchWithTimeout(`${BASE_URL}/diagnostic-services/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
  async updateDiagnosticService(id, data) {
    clearCache();
    const res = await fetchWithTimeout(`${BASE_URL}/diagnostic-services/${id}/`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
  async deleteDiagnosticService(id) {
    clearCache();
    const res = await fetchWithTimeout(`${BASE_URL}/diagnostic-services/${id}/`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (res.status === 204 || res.status === 200) return true;
    return handleResponse(res);
  },

  // Diagnostic Center Categories
  async getDiagnosticCenterCategories() {
    return fetchWithDeduplicationAndCache('diagnostic_center_categories', async () => {
      const res = await fetchWithTimeout(`${BASE_URL}/diagnostic-center-categories/`, {
        headers: getHeaders(),
      });
      return handleResponse(res);
    });
  },
  async createDiagnosticCenterCategory(data) {
    clearCache();
    const res = await fetchWithTimeout(`${BASE_URL}/diagnostic-center-categories/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
  async updateDiagnosticCenterCategory(id, data) {
    clearCache();
    const res = await fetchWithTimeout(`${BASE_URL}/diagnostic-center-categories/${id}/`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
  async deleteDiagnosticCenterCategory(id) {
    clearCache();
    const res = await fetchWithTimeout(`${BASE_URL}/diagnostic-center-categories/${id}/`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (res.status === 204 || res.status === 200) return true;
    return handleResponse(res);
  },

  // Search Metadata / Bootstrap Endpoint
  async getSearchMetadata() {
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
  },

  // Dynamic Search Facets Endpoint
  async getSearchFacets({ location = '', area = '', search = '' } = {}) {
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
  },

  // Diagnostic Centers
  async getDiagnosticCenters({ location = '', division = '', district = '', area = '', category = '', spec = '', owner = '', testcat = '', search = '', page = 1, page_size = 10 } = {}) {
    const key = `diag_${location}_${division}_${district}_${area}_${category}_${spec}_${owner}_${testcat}_${search}_${page}_${page_size}`;
    return fetchWithDeduplicationAndCache(key, async () => {
      const url = new URL(`${BASE_URL}/diagnostic-centers/`);
      if (location && location !== 'All Bangladesh') url.searchParams.append('location', location);
      if (division && division !== 'All Bangladesh') url.searchParams.append('division', division);
      if (district && district !== 'All Districts') url.searchParams.append('district', district);
      if (area && area !== 'All Areas') url.searchParams.append('area', area);
      if (category) url.searchParams.append('category', category);
      if (spec) url.searchParams.append('spec', spec);
      if (owner) url.searchParams.append('owner', owner);
      if (testcat) url.searchParams.append('testcat', testcat);
      if (search) url.searchParams.append('search', search);
      if (page) url.searchParams.append('page', page);
      if (page_size) url.searchParams.append('page_size', page_size);
      const res = await fetchWithTimeout(url, { headers: getHeaders() });
      return flattenFacility(await handleResponse(res));
    }, 60000);
  },
  async getDiagnosticCenterById(id) {
    const res = await fetchWithTimeout(`${BASE_URL}/diagnostic-centers/${id}/`, { headers: getHeaders() });
    return flattenFacility(await handleResponse(res));
  },
  async createDiagnosticCenter(data) {
    const res = await fetchWithTimeout(`${BASE_URL}/diagnostic-centers/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
  async updateDiagnosticCenter(id, data) {
    const res = await fetchWithTimeout(`${BASE_URL}/diagnostic-centers/${id}/`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
  async patchDiagnosticCenter(id, data) {
    const res = await fetchWithTimeout(`${BASE_URL}/diagnostic-centers/${id}/`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
  async deleteDiagnosticCenter(id) {
    const res = await fetchWithTimeout(`${BASE_URL}/diagnostic-centers/${id}/`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (res.status === 204 || res.status === 200) return true;
    return handleResponse(res);
  },

  // Facility Tests (prices per location)
  async getDiagnosticCenterTests({ center = '', hospital = '', test = '', branch = '' } = {}) {
    const url = new URL(`${BASE_URL}/facility-tests/`);
    const locationId = center || branch || hospital;
    if (locationId) url.searchParams.append('location', locationId);
    if (test) url.searchParams.append('test', test);
    const res = await fetchWithTimeout(url, { headers: getHeaders() });
    return flattenFacility(await handleResponse(res));
  },
  async createDiagnosticCenterTest(data) {
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
  },
  async deleteDiagnosticCenterTest(id) {
    const res = await fetchWithTimeout(`${BASE_URL}/facility-tests/${id}/`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (res.status === 204 || res.status === 200) return true;
    return handleResponse(res);
  },
  // Backward compatibility alias for branch tests
  async getBranchTests(params) { return this.getDiagnosticCenterTests(params); },
  async createBranchTest(data) { return this.createDiagnosticCenterTest(data); },
  async deleteBranchTest(id) { return this.deleteDiagnosticCenterTest(id); },

  // Test Categories
  async getTestCategories() {
    return fetchWithDeduplicationAndCache('test_categories', async () => {
      const res = await fetchWithTimeout(`${BASE_URL}/test-categories/`, {
        headers: getHeaders(),
      });
      return handleResponse(res);
    });
  },
  async createTestCategory(data) {
    clearCache();
    const res = await fetchWithTimeout(`${BASE_URL}/test-categories/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
  async updateTestCategory(id, data) {
    clearCache();
    const res = await fetchWithTimeout(`${BASE_URL}/test-categories/${id}/`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
  async deleteTestCategory(id) {
    clearCache();
    const res = await fetchWithTimeout(`${BASE_URL}/test-categories/${id}/`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (res.status === 204 || res.status === 200) return true;
    return handleResponse(res);
  },

  // Pathology Base Tests
  async getTests({ search = '', category = '' } = {}) {
    const key = `tests_${search}_${category}`;
    return fetchWithDeduplicationAndCache(key, async () => {
      const url = new URL(`${BASE_URL}/tests/`);
      if (search) url.searchParams.append('search', search);
      if (category) url.searchParams.append('category', category);
      const res = await fetchWithTimeout(url, { headers: getHeaders() });
      return handleResponse(res);
    }, 60000);
  },
  async createTest(testData) {
    clearCache();
    const res = await fetchWithTimeout(`${BASE_URL}/tests/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(testData),
    });
    return handleResponse(res);
  },
  async updateTest(id, testData) {
    clearCache();
    const res = await fetchWithTimeout(`${BASE_URL}/tests/${id}/`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(testData),
    });
    return handleResponse(res);
  },
  async deleteTest(id) {
    clearCache();
    const res = await fetchWithTimeout(`${BASE_URL}/tests/${id}/`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (res.status === 204 || res.status === 200) return true;
    return handleResponse(res);
  },

  // Hospitals
  async getHospitals({ location = '', division = '', district = '', area = '', category = '', search = '', page = 1, page_size = 10 } = {}) {
    const key = `hosp_${location}_${division}_${district}_${area}_${category}_${search}_${page}_${page_size}`;
    return fetchWithDeduplicationAndCache(key, async () => {
      const url = new URL(`${BASE_URL}/hospitals/`);
      if (location && location !== 'All Bangladesh') url.searchParams.append('location', location);
      if (division && division !== 'All Bangladesh') url.searchParams.append('division', division);
      if (district && district !== 'All Districts') url.searchParams.append('district', district);
      if (area && area !== 'All Areas') url.searchParams.append('area', area);
      if (category) url.searchParams.append('category', category);
      if (search) url.searchParams.append('search', search);
      if (page) url.searchParams.append('page', page);
      if (page_size) url.searchParams.append('page_size', page_size);
      const res = await fetchWithTimeout(url, { headers: getHeaders() });
      return flattenFacility(await handleResponse(res));
    }, 60000);
  },
  async getHospitalById(id) {
    const res = await fetchWithTimeout(`${BASE_URL}/hospitals/${id}/`, { headers: getHeaders() });
    return flattenFacility(await handleResponse(res));
  },
  async createHospital(data) {
    clearCache();
    const res = await fetchWithTimeout(`${BASE_URL}/hospitals/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
  async updateHospital(id, data) {
    clearCache();
    const res = await fetchWithTimeout(`${BASE_URL}/hospitals/${id}/`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
  async patchHospital(id, data) {
    clearCache();
    const res = await fetchWithTimeout(`${BASE_URL}/hospitals/${id}/`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
  async deleteHospital(id) {
    clearCache();
    const res = await fetchWithTimeout(`${BASE_URL}/hospitals/${id}/`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (res.status === 204 || res.status === 200) return true;
    return handleResponse(res);
  },

  // Backward compatibility alias for getBranches / getChambers
  async getBranches({ location = '' } = {}) {
    return this.getDiagnosticCenters({ location });
  },
  async getBranchById(id) {
    try {
      return await this.getHospitalById(id);
    } catch {
      return await this.getDiagnosticCenterById(id);
    }
  },
  async getChambers(location = '') {
    return this.getBranches({ location });
  },
  async getChamberById(id) {
    return this.getBranchById(id);
  },
  async createBranch(data) { clearCache(); return this.createDiagnosticCenter(data); },
  async updateBranch(id, data) { clearCache(); return this.updateDiagnosticCenter(id, data); },
  async deleteBranch(id) { clearCache(); return this.deleteDiagnosticCenter(id); },
  async createChamber(data) { clearCache(); return this.createDiagnosticCenter(data); },
  async updateChamber(id, data) { clearCache(); return this.updateDiagnosticCenter(id, data); },
  async deleteChamber(id) { clearCache(); return this.deleteDiagnosticCenter(id); },

  // Doctors
  async getDoctors({ specialty = '', location = '', division = '', district = '', area = '', search = '', consultation_type = '', hospital = '', diagnostic_center = '', fee_max = '', day = '', page = 1, page_size = 10 } = {}) {
    const key = `doc_${specialty}_${location}_${division}_${district}_${area}_${search}_${consultation_type}_${hospital}_${diagnostic_center}_${fee_max}_${day}_${page}_${page_size}`;
    return fetchWithDeduplicationAndCache(key, async () => {
      const url = new URL(`${BASE_URL}/doctors/`);
      if (specialty) url.searchParams.append('specialty', specialty);
      if (location && location !== 'All Bangladesh') url.searchParams.append('location', location);
      if (division && division !== 'All Bangladesh') url.searchParams.append('division', division);
      if (district && district !== 'All Districts') url.searchParams.append('district', district);
      if (area && area !== 'All Areas') url.searchParams.append('area', area);
      if (search) url.searchParams.append('search', search);
      if (consultation_type) url.searchParams.append('consultation_type', consultation_type);
      if (hospital) url.searchParams.append('hospital', hospital);
      if (diagnostic_center) url.searchParams.append('diagnostic_center', diagnostic_center);
      if (fee_max) url.searchParams.append('fee_max', fee_max);
      if (day && day !== 'All') url.searchParams.append('day', day);
      if (page) url.searchParams.append('page', page);
      if (page_size) url.searchParams.append('page_size', page_size);
      const res = await fetchWithTimeout(url, { headers: getHeaders() });
      return handleResponse(res);
    }, 60000);
  },

  async createDoctor(doctorData) {
    const res = await fetchWithTimeout(`${BASE_URL}/doctors/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(doctorData),
    });
    return handleResponse(res);
  },
  async updateDoctor(id, doctorData) {
    const res = await fetchWithTimeout(`${BASE_URL}/doctors/${id}/`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(doctorData),
    });
    return handleResponse(res);
  },
  async deleteDoctor(id) {
    const res = await fetchWithTimeout(`${BASE_URL}/doctors/${id}/`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (res.status === 204 || res.status === 200) return true;
    return handleResponse(res);
  },

  // Doctor Booking
  async createDoctorBooking(bookingData) {
    const payload = { ...bookingData };
    if (bookingData.affiliation && !bookingData.affiliation_id) {
      payload.affiliation_id = bookingData.affiliation;
    }
    const res = await fetchWithTimeout(`${BASE_URL}/bookings/doctor/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  // Lab Booking
  async createLabBooking(labData) {
    const payload = { ...labData };
    if (labData.test && !labData.facility_test_id) {
      payload.facility_test_id = labData.test;
    }
    if (labData.address && !labData.pickup_address_line) {
      payload.pickup_address_line = labData.address;
    }
    if (!payload.pickup_district) {
      payload.pickup_district = labData.city || labData.district || 'Dhaka';
    }
    const res = await fetchWithTimeout(`${BASE_URL}/bookings/lab/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  // Locations
  async getLocations() {
    const res = await fetchWithTimeout(`${BASE_URL}/locations/`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },
  async getPracticeLocations() { return this.getLocations(); },

  // Bookings Admin Management
  async getDoctorBookings() {
    const res = await fetchWithTimeout(`${BASE_URL}/bookings/doctor/`, {
      headers: getHeaders(),
    });
    return flattenFacility(await handleResponse(res));
  },

  async updateDoctorBookingStatus(id, status) {
    const res = await fetchWithTimeout(`${BASE_URL}/bookings/doctor/${id}/`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ status }),
    });
    return handleResponse(res);
  },

  async getLabBookings() {
    const res = await fetchWithTimeout(`${BASE_URL}/bookings/lab/`, {
      headers: getHeaders(),
    });
    return flattenFacility(await handleResponse(res));
  },

  async updateLabBookingStatus(id, status) {
    const res = await fetchWithTimeout(`${BASE_URL}/bookings/lab/${id}/`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ status }),
    });
    return handleResponse(res);
  },
};
