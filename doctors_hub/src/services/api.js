const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://doctors-hub.onrender.com/api';

async function fetchWithTimeout(url, options = {}, timeoutMs = 15000) {
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
  if (Array.isArray(val) && val.length > 0) return val;
  if (val && typeof val === 'object' && Array.isArray(val.results) && val.results.length > 0) return val.results;
  return fallback;
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
    throw new Error(errorMessage);
  }
  return response.json();
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
    const res = await fetchWithTimeout(`${BASE_URL}/specialties/`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },
  async createSpecialty(data) {
    const res = await fetchWithTimeout(`${BASE_URL}/specialties/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
  async updateSpecialty(id, data) {
    const res = await fetchWithTimeout(`${BASE_URL}/specialties/${id}/`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
  async deleteSpecialty(id) {
    const res = await fetchWithTimeout(`${BASE_URL}/specialties/${id}/`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (res.status === 204 || res.status === 200) return true;
    return handleResponse(res);
  },

  // Hospital Categories (renamed from HospitalSpecialty)
  async getHospitalCategories() {
    const res = await fetchWithTimeout(`${BASE_URL}/hospital-categories/`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },
  async createHospitalCategory(data) {
    const res = await fetchWithTimeout(`${BASE_URL}/hospital-categories/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
  async updateHospitalCategory(id, data) {
    const res = await fetchWithTimeout(`${BASE_URL}/hospital-categories/${id}/`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
  async deleteHospitalCategory(id) {
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
    const res = await fetchWithTimeout(`${BASE_URL}/hospital-services/`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },
  async createHospitalService(data) {
    const res = await fetchWithTimeout(`${BASE_URL}/hospital-services/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
  async updateHospitalService(id, data) {
    const res = await fetchWithTimeout(`${BASE_URL}/hospital-services/${id}/`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
  async deleteHospitalService(id) {
    const res = await fetchWithTimeout(`${BASE_URL}/hospital-services/${id}/`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (res.status === 204 || res.status === 200) return true;
    return handleResponse(res);
  },

  // Diagnostic Services
  async getDiagnosticServices() {
    const res = await fetchWithTimeout(`${BASE_URL}/diagnostic-services/`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },
  async createDiagnosticService(data) {
    const res = await fetchWithTimeout(`${BASE_URL}/diagnostic-services/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
  async updateDiagnosticService(id, data) {
    const res = await fetchWithTimeout(`${BASE_URL}/diagnostic-services/${id}/`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
  async deleteDiagnosticService(id) {
    const res = await fetchWithTimeout(`${BASE_URL}/diagnostic-services/${id}/`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (res.status === 204 || res.status === 200) return true;
    return handleResponse(res);
  },

  // Diagnostic Center Categories
  async getDiagnosticCenterCategories() {
    const res = await fetchWithTimeout(`${BASE_URL}/diagnostic-center-categories/`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },
  async createDiagnosticCenterCategory(data) {
    const res = await fetchWithTimeout(`${BASE_URL}/diagnostic-center-categories/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
  async updateDiagnosticCenterCategory(id, data) {
    const res = await fetchWithTimeout(`${BASE_URL}/diagnostic-center-categories/${id}/`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
  async deleteDiagnosticCenterCategory(id) {
    const res = await fetchWithTimeout(`${BASE_URL}/diagnostic-center-categories/${id}/`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (res.status === 204 || res.status === 200) return true;
    return handleResponse(res);
  },

  // Diagnostic Centers
  async getDiagnosticCenters({ location = '', category = '', search = '' } = {}) {
    const url = new URL(`${BASE_URL}/diagnostic-centers/`);
    if (location && location !== 'All Bangladesh') url.searchParams.append('location', location);
    if (category) url.searchParams.append('category', category);
    if (search) url.searchParams.append('search', search);
    const res = await fetchWithTimeout(url, { headers: getHeaders() });
    return handleResponse(res);
  },
  async getDiagnosticCenterById(id) {
    const res = await fetchWithTimeout(`${BASE_URL}/diagnostic-centers/${id}/`, { headers: getHeaders() });
    return handleResponse(res);
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
  async deleteDiagnosticCenter(id) {
    const res = await fetchWithTimeout(`${BASE_URL}/diagnostic-centers/${id}/`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (res.status === 204 || res.status === 200) return true;
    return handleResponse(res);
  },

  // Diagnostic Center Tests (prices per center)
  async getDiagnosticCenterTests({ center = '', hospital = '', test = '', branch = '' } = {}) {
    const url = new URL(`${BASE_URL}/diagnostic-center-tests/`);
    if (center || branch) url.searchParams.append('center', center || branch);
    if (hospital) url.searchParams.append('hospital', hospital);
    if (test) url.searchParams.append('test', test);
    const res = await fetchWithTimeout(url, { headers: getHeaders() });
    return handleResponse(res);
  },
  async createDiagnosticCenterTest(data) {
    const res = await fetchWithTimeout(`${BASE_URL}/diagnostic-center-tests/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
  async deleteDiagnosticCenterTest(id) {
    const res = await fetchWithTimeout(`${BASE_URL}/diagnostic-center-tests/${id}/`, {
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
    const res = await fetchWithTimeout(`${BASE_URL}/test-categories/`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },
  async createTestCategory(data) {
    const res = await fetchWithTimeout(`${BASE_URL}/test-categories/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
  async updateTestCategory(id, data) {
    const res = await fetchWithTimeout(`${BASE_URL}/test-categories/${id}/`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
  async deleteTestCategory(id) {
    const res = await fetchWithTimeout(`${BASE_URL}/test-categories/${id}/`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (res.status === 204 || res.status === 200) return true;
    return handleResponse(res);
  },

  // Pathology Base Tests
  async getTests({ search = '', category = '' } = {}) {
    const url = new URL(`${BASE_URL}/tests/`);
    if (search) url.searchParams.append('search', search);
    if (category) url.searchParams.append('category', category);
    const res = await fetchWithTimeout(url, { headers: getHeaders() });
    return handleResponse(res);
  },
  async createTest(testData) {
    const res = await fetchWithTimeout(`${BASE_URL}/tests/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(testData),
    });
    return handleResponse(res);
  },
  async updateTest(id, testData) {
    const res = await fetchWithTimeout(`${BASE_URL}/tests/${id}/`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(testData),
    });
    return handleResponse(res);
  },
  async deleteTest(id) {
    const res = await fetchWithTimeout(`${BASE_URL}/tests/${id}/`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (res.status === 204 || res.status === 200) return true;
    return handleResponse(res);
  },

  // Hospitals
  async getHospitals({ location = '', category = '', search = '' } = {}) {
    const url = new URL(`${BASE_URL}/hospitals/`);
    if (location && location !== 'All Bangladesh') url.searchParams.append('location', location);
    if (category) url.searchParams.append('category', category);
    if (search) url.searchParams.append('search', search);
    const res = await fetchWithTimeout(url, { headers: getHeaders() });
    return handleResponse(res);
  },
  async getHospitalById(id) {
    const res = await fetchWithTimeout(`${BASE_URL}/hospitals/${id}/`, { headers: getHeaders() });
    return handleResponse(res);
  },
  async createHospital(data) {
    const res = await fetchWithTimeout(`${BASE_URL}/hospitals/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
  async updateHospital(id, data) {
    const res = await fetchWithTimeout(`${BASE_URL}/hospitals/${id}/`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
  async deleteHospital(id) {
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
      return await this.getDiagnosticCenterById(id);
    } catch {
      return await this.getHospitalById(id);
    }
  },
  async getChambers(location = '') {
    return this.getBranches({ location });
  },
  async getChamberById(id) {
    return this.getBranchById(id);
  },
  async createBranch(data) { return this.createDiagnosticCenter(data); },
  async updateBranch(id, data) { return this.updateDiagnosticCenter(id, data); },
  async deleteBranch(id) { return this.deleteDiagnosticCenter(id); },
  async createChamber(data) { return this.createDiagnosticCenter(data); },
  async updateChamber(id, data) { return this.updateDiagnosticCenter(id, data); },
  async deleteChamber(id) { return this.deleteDiagnosticCenter(id); },

  // Doctors
  async getDoctors({ specialty = '', location = '', search = '', consultation_type = '', hospital = '', diagnostic_center = '' } = {}) {
    const url = new URL(`${BASE_URL}/doctors/`);
    if (specialty) url.searchParams.append('specialty', specialty);
    if (location && location !== 'All Bangladesh') {
      url.searchParams.append('location', location);
    }
    if (search) url.searchParams.append('search', search);
    if (consultation_type) url.searchParams.append('consultation_type', consultation_type);
    if (hospital) url.searchParams.append('hospital', hospital);
    if (diagnostic_center) url.searchParams.append('diagnostic_center', diagnostic_center);
    const res = await fetchWithTimeout(url, { headers: getHeaders() });
    return handleResponse(res);
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
    const res = await fetchWithTimeout(`${BASE_URL}/bookings/doctor/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(bookingData),
    });
    return handleResponse(res);
  },

  // Lab Booking
  async createLabBooking(labData) {
    const res = await fetchWithTimeout(`${BASE_URL}/bookings/lab/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(labData),
    });
    return handleResponse(res);
  },

  // Bookings Admin Management
  async getDoctorBookings() {
    const res = await fetchWithTimeout(`${BASE_URL}/bookings/doctor/`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
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
    return handleResponse(res);
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
