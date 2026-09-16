import {
  BASE_URL,
  fetchWithTimeout,
  handleResponse,
  getHeaders,
  fetchWithDeduplicationAndCache,
} from './core';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export async function getDivisions() {
  return fetchWithDeduplicationAndCache('geo_divisions', async () => {
    const res = await fetchWithTimeout(`${BASE_URL}/divisions/`, {
      headers: getHeaders(),
    });
    const data = await handleResponse(res);
    return Array.isArray(data) ? data : data?.results || [];
  }, ONE_DAY_MS);
}

export async function getDistricts(divisionId = null) {
  const cacheKey = divisionId ? `geo_districts_${divisionId}` : 'geo_districts_all';
  return fetchWithDeduplicationAndCache(cacheKey, async () => {
    const url = new URL(`${BASE_URL}/districts/`);
    if (divisionId) {
      url.searchParams.append('division', divisionId);
    }
    const res = await fetchWithTimeout(url, {
      headers: getHeaders(),
    });
    const data = await handleResponse(res);
    return Array.isArray(data) ? data : data?.results || [];
  }, ONE_DAY_MS);
}

export async function getThanas(districtId = null, search = '') {
  const cacheKey = `geo_thanas_${districtId || 'all'}_${search}`;
  return fetchWithDeduplicationAndCache(cacheKey, async () => {
    const url = new URL(`${BASE_URL}/thanas/`);
    if (districtId) {
      url.searchParams.append('district', districtId);
    }
    if (search) {
      url.searchParams.append('search', search);
    }
    const res = await fetchWithTimeout(url, {
      headers: getHeaders(),
    });
    const data = await handleResponse(res);
    return Array.isArray(data) ? data : data?.results || [];
  }, ONE_DAY_MS);
}
