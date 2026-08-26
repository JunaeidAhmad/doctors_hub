import {
  BASE_URL,
  clearSession,
  fetchWithTimeout,
  handleResponse,
  getHeaders,
} from './core';

export async function fetchPermissions() {
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/auth/me/permissions/`, {
      method: 'GET',
      headers: getHeaders(),
    });
    const data = await handleResponse(res);
    localStorage.setItem('permissions', JSON.stringify(data));
    return data;
  } catch (err) {
    console.error("Failed to fetch permissions:", err);
    return null;
  }
}

export function getCurrentPermissions() {
  try {
    const permStr = localStorage.getItem('permissions');
    return permStr ? JSON.parse(permStr) : null;
  } catch {
    return null;
  }
}

export async function login(phone_number, password) {
  clearSession();
  const res = await fetchWithTimeout(`${BASE_URL}/auth/login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ phone_number, password }),
  });
  const data = await handleResponse(res);
  if (data.access) {
    localStorage.setItem('access_token', data.access);
    if (data.user) {
      localStorage.setItem('user', JSON.stringify(data.user));
      await fetchPermissions();
    }
  }
  return data;
}

export async function register(phone_number, password, first_name = '', last_name = '') {
  clearSession();
  const res = await fetchWithTimeout(`${BASE_URL}/auth/register/`, {
    method: 'POST',
    headers: getHeaders(),
    credentials: 'include',
    body: JSON.stringify({ phone_number, password, first_name, last_name }),
  });
  const data = await handleResponse(res);
  if (data.access) {
    localStorage.setItem('access_token', data.access);
    if (data.user) {
      localStorage.setItem('user', JSON.stringify(data.user));
      await fetchPermissions();
    }
  }
  return data;
}

export async function logout() {
  try {
    await fetch(`${BASE_URL}/auth/logout/`, {
      method: 'POST',
      headers: getHeaders(),
      credentials: 'include',
    });
  } catch {
    /* clear locally regardless */
  }
  clearSession();
  localStorage.removeItem('permissions');
}

export function setSession(access, user) {
  if (access) localStorage.setItem('access_token', access);
  if (user) {
    localStorage.setItem('user', JSON.stringify(user));
    // Usually follow this by fetchPermissions() in the caller
  }
}

export function getCurrentUser() {
  try {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  } catch {
    return null;
  }
}

export async function updateProfile(profileData) {
  const res = await fetchWithTimeout(`${BASE_URL}/auth/me/`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify(profileData),
  });
  const data = await handleResponse(res);
  const existingUser = getCurrentUser() || {};
  const updatedUser = { ...existingUser, ...data };
  localStorage.setItem('user', JSON.stringify(updatedUser));
  return updatedUser;
}

// Onboarding Self-Registration
export async function registerFacility(data) {
  const res = await fetchWithTimeout(`${BASE_URL}/auth/register/facility/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  const json = await handleResponse(res);
  if (json?.access) {
    setSession(json.access, json.user);
    await fetchPermissions();
  }
  return json;
}

export async function registerDoctor(data) {
  const res = await fetchWithTimeout(`${BASE_URL}/auth/register/doctor/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  const json = await handleResponse(res);
  if (json?.access) {
    setSession(json.access, json.user);
    await fetchPermissions();
  }
  return json;
}
