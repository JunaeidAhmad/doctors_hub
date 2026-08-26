export const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

let refreshPromise = null;

export function clearSession() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('user');
}

export async function refreshAccessToken() {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const res = await fetch(`${BASE_URL}/auth/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({}),
      });
      if (!res.ok) return null;
      const data = await res.json();
      if (!data.access) return null;
      localStorage.setItem('access_token', data.access);
      return data.access;
    } catch {
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function rawFetchWithTimeout(url, options = {}, timeoutMs = 60000) {
  if (!timeoutMs || typeof timeoutMs !== 'number' || timeoutMs <= 0) {
    return fetch(url, options);
  }
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
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

export async function fetchWithTimeout(url, options = {}, timeoutMs = 60000, _isRetry = false) {
  const response = await rawFetchWithTimeout(url, options, timeoutMs);

  const urlString = typeof url === 'string' ? url : url.toString();
  const isAuthCall = urlString.includes('/auth/');
  if (response.status !== 401 || _isRetry || isAuthCall) {
    return response;
  }

  const newToken = await refreshAccessToken();
  if (!newToken) {
    clearSession();
    return response;
  }

  const retryOptions = {
    ...options,
    headers: { ...(options.headers || {}), Authorization: `Bearer ${newToken}` },
  };
  return rawFetchWithTimeout(url, retryOptions, timeoutMs, true);
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

export function getCached(key, ttlMs = 300000) {
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

export function setCached(key, data) {
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
export async function fetchWithDeduplicationAndCache(cacheKey, fetchFn, ttlMs = 300000) {
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
export async function handleResponse(response) {
  if (!response.ok) {
    if (response.status === 401) {
      clearSession();
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
export function flattenFacility(data) {
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
      name: loc.name || data.name || data.facility_name || data.center_name || '',
      branch: loc.branch || data.branch || '',
      address_line: addressLine,
      address: addressLine,
      city,
      district,
      division,
      area,
      category: data.category || catList[0] || null,
      categories: catList,
      category_name: data.category?.name || catList[0]?.name || data.category_name || '',
      location_id: data.location_id || loc.id,
      id: data.id || data.location_id || loc.id,
    };
  }
  return data;
}

/**
 * Get headers, including optional Authorization token
 */
export function getHeaders(token = null) {
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
