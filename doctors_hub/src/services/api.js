const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://doctors-hub.onrender.com/api';

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
    const res = await fetch(`${BASE_URL}/auth/login/`, {
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
    const res = await fetch(`${BASE_URL}/auth/register/`, {
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
    const res = await fetch(`${BASE_URL}/auth/me/`, {
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
    const res = await fetch(`${BASE_URL}/specialties/`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },
  async createSpecialty(data) {
    const res = await fetch(`${BASE_URL}/specialties/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
  async updateSpecialty(id, data) {
    const res = await fetch(`${BASE_URL}/specialties/${id}/`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
  async deleteSpecialty(id) {
    const res = await fetch(`${BASE_URL}/specialties/${id}/`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (res.status === 204 || res.status === 200) return true;
    return handleResponse(res);
  },

  // Hospital Categories (renamed from HospitalSpecialty)
  async getHospitalCategories() {
    const res = await fetch(`${BASE_URL}/hospital-categories/`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },
  async createHospitalCategory(data) {
    const res = await fetch(`${BASE_URL}/hospital-categories/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
  async updateHospitalCategory(id, data) {
    const res = await fetch(`${BASE_URL}/hospital-categories/${id}/`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
  async deleteHospitalCategory(id) {
    const res = await fetch(`${BASE_URL}/hospital-categories/${id}/`, {
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

  // Diagnostic Center Categories
  async getDiagnosticCenterCategories() {
    const res = await fetch(`${BASE_URL}/diagnostic-center-categories/`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },
  async createDiagnosticCenterCategory(data) {
    const res = await fetch(`${BASE_URL}/diagnostic-center-categories/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
  async updateDiagnosticCenterCategory(id, data) {
    const res = await fetch(`${BASE_URL}/diagnostic-center-categories/${id}/`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
  async deleteDiagnosticCenterCategory(id) {
    const res = await fetch(`${BASE_URL}/diagnostic-center-categories/${id}/`, {
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
    const res = await fetch(url, { headers: getHeaders() });
    return handleResponse(res);
  },
  async getDiagnosticCenterById(id) {
    const res = await fetch(`${BASE_URL}/diagnostic-centers/${id}/`, { headers: getHeaders() });
    return handleResponse(res);
  },
  async createDiagnosticCenter(data) {
    const res = await fetch(`${BASE_URL}/diagnostic-centers/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
  async updateDiagnosticCenter(id, data) {
    const res = await fetch(`${BASE_URL}/diagnostic-centers/${id}/`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
  async deleteDiagnosticCenter(id) {
    const res = await fetch(`${BASE_URL}/diagnostic-centers/${id}/`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (res.status === 204 || res.status === 200) return true;
    return handleResponse(res);
  },

  // Diagnostic Center Tests (prices per center)
  async getDiagnosticCenterTests({ center = '', test = '', branch = '' } = {}) {
    const url = new URL(`${BASE_URL}/diagnostic-center-tests/`);
    if (center || branch) url.searchParams.append('center', center || branch);
    if (test) url.searchParams.append('test', test);
    const res = await fetch(url, { headers: getHeaders() });
    return handleResponse(res);
  },
  async createDiagnosticCenterTest(data) {
    const res = await fetch(`${BASE_URL}/diagnostic-center-tests/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
  async deleteDiagnosticCenterTest(id) {
    const res = await fetch(`${BASE_URL}/diagnostic-center-tests/${id}/`, {
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
    const res = await fetch(`${BASE_URL}/test-categories/`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },
  async createTestCategory(data) {
    const res = await fetch(`${BASE_URL}/test-categories/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
  async updateTestCategory(id, data) {
    const res = await fetch(`${BASE_URL}/test-categories/${id}/`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
  async deleteTestCategory(id) {
    const res = await fetch(`${BASE_URL}/test-categories/${id}/`, {
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
    const res = await fetch(url, { headers: getHeaders() });
    return handleResponse(res);
  },
  async createTest(testData) {
    const res = await fetch(`${BASE_URL}/tests/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(testData),
    });
    return handleResponse(res);
  },
  async updateTest(id, testData) {
    const res = await fetch(`${BASE_URL}/tests/${id}/`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(testData),
    });
    return handleResponse(res);
  },
  async deleteTest(id) {
    const res = await fetch(`${BASE_URL}/tests/${id}/`, {
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
    const res = await fetch(url, { headers: getHeaders() });
    return handleResponse(res);
  },
  async getHospitalById(id) {
    const res = await fetch(`${BASE_URL}/hospitals/${id}/`, { headers: getHeaders() });
    return handleResponse(res);
  },
  async createHospital(data) {
    const res = await fetch(`${BASE_URL}/hospitals/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
  async updateHospital(id, data) {
    const res = await fetch(`${BASE_URL}/hospitals/${id}/`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
  async deleteHospital(id) {
    const res = await fetch(`${BASE_URL}/hospitals/${id}/`, {
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
    const res = await fetch(url, { headers: getHeaders() });
    return handleResponse(res);
  },
  async createDoctor(doctorData) {
    const res = await fetch(`${BASE_URL}/doctors/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(doctorData),
    });
    return handleResponse(res);
  },
  async updateDoctor(id, doctorData) {
    const res = await fetch(`${BASE_URL}/doctors/${id}/`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(doctorData),
    });
    return handleResponse(res);
  },
  async deleteDoctor(id) {
    const res = await fetch(`${BASE_URL}/doctors/${id}/`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (res.status === 204 || res.status === 200) return true;
    return handleResponse(res);
  },

  // Doctor Booking
  async createDoctorBooking(bookingData) {
    const res = await fetch(`${BASE_URL}/bookings/doctor/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(bookingData),
    });
    return handleResponse(res);
  },

  // Lab Booking
  async createLabBooking(labData) {
    const res = await fetch(`${BASE_URL}/bookings/lab/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(labData),
    });
    return handleResponse(res);
  },

  // Bookings Admin Management
  async getDoctorBookings() {
    const res = await fetch(`${BASE_URL}/bookings/doctor/`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async updateDoctorBookingStatus(id, status) {
    const res = await fetch(`${BASE_URL}/bookings/doctor/${id}/`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ status }),
    });
    return handleResponse(res);
  },

  async getLabBookings() {
    const res = await fetch(`${BASE_URL}/bookings/lab/`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async updateLabBookingStatus(id, status) {
    const res = await fetch(`${BASE_URL}/bookings/lab/${id}/`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ status }),
    });
    return handleResponse(res);
  },
};
