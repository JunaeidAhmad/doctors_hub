import { BASE_URL, fetchWithTimeout, handleResponse, getHeaders } from './core';

export async function getPermissionsCatalog() {
  const res = await fetchWithTimeout(`${BASE_URL}/permissions-catalog/`, {
    headers: getHeaders(),
  });
  return handleResponse(res);
}

export async function getRoles() {
  const res = await fetchWithTimeout(`${BASE_URL}/roles/`, {
    headers: getHeaders(),
  });
  return handleResponse(res);
}

export async function createRole(data) {
  const res = await fetchWithTimeout(`${BASE_URL}/roles/`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function updateRole(id, data) {
  const res = await fetchWithTimeout(`${BASE_URL}/roles/${id}/`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function deleteRole(id) {
  const res = await fetchWithTimeout(`${BASE_URL}/roles/${id}/`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  if (res.status === 204) return true;
  return handleResponse(res);
}

export async function getUserRoles(params = {}) {
  const query = new URLSearchParams(params).toString();
  const url = `${BASE_URL}/user-roles/${query ? `?${query}` : ''}`;
  const res = await fetchWithTimeout(url, {
    headers: getHeaders(),
  });
  return handleResponse(res);
}

export async function createUserRole(data) {
  const res = await fetchWithTimeout(`${BASE_URL}/user-roles/`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function updateUserRole(id, data) {
  const res = await fetchWithTimeout(`${BASE_URL}/user-roles/${id}/`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function deleteUserRole(id) {
  const res = await fetchWithTimeout(`${BASE_URL}/user-roles/${id}/`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  if (res.status === 204) return true;
  return handleResponse(res);
}

export async function searchUsers(query = '') {
  const url = `${BASE_URL}/user-roles/search-users/${query ? `?q=${encodeURIComponent(query)}` : ''}`;
  const res = await fetchWithTimeout(url, {
    headers: getHeaders(),
  });
  return handleResponse(res);
}

export async function getUserEffectivePermissions(userId) {
  const url = `${BASE_URL}/user-roles/user-permissions/${userId}/`;
  const res = await fetchWithTimeout(url, {
    headers: getHeaders(),
  });
  return handleResponse(res);
}
