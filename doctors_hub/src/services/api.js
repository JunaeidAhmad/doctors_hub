const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://doctors-hub.onrender.com/api';

/**
 * Helper to handle fetch responses and errors
 */
async function handleResponse(response) {
  if (!response.ok) {
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
    const res = await fetch(`${BASE_URL}/auth/login/`, {
      method: 'POST',
      headers: getHeaders(),
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

  // Specialties
  async getSpecialties() {
    const res = await fetch(`${BASE_URL}/specialties/`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  // Pathology Base Tests
  async getTests(search = '') {
    const url = new URL(`${BASE_URL}/tests/`);
    if (search) url.searchParams.append('search', search);
    const res = await fetch(url, { headers: getHeaders() });
    return handleResponse(res);
  },

  // Branch Tests (Diagnostic test prices)
  async getBranchTests({ branch = '', test = '' } = {}) {
    const url = new URL(`${BASE_URL}/branch-tests/`);
    if (branch) url.searchParams.append('branch', branch);
    if (test) url.searchParams.append('test', test);
    const res = await fetch(url, { headers: getHeaders() });
    return handleResponse(res);
  },

  // Hospitals & Branches
  async getHospitals() {
    const res = await fetch(`${BASE_URL}/hospitals/`, { headers: getHeaders() });
    return handleResponse(res);
  },

  async getHospitalById(id) {
    const res = await fetch(`${BASE_URL}/hospitals/${id}/`, { headers: getHeaders() });
    return handleResponse(res);
  },

  async getBranches({ location = '', hospital = '', facility_type = '' } = {}) {
    const url = new URL(`${BASE_URL}/branches/`);
    if (location && location !== 'All Bangladesh') {
      url.searchParams.append('location', location);
    }
    if (hospital) url.searchParams.append('hospital', hospital);
    if (facility_type) url.searchParams.append('facility_type', facility_type);
    const res = await fetch(url, { headers: getHeaders() });
    return handleResponse(res);
  },

  async getBranchById(id) {
    const res = await fetch(`${BASE_URL}/branches/${id}/`, { headers: getHeaders() });
    return handleResponse(res);
  },

  // Backward compatibility alias for getBranches
  async getChambers(location = '') {
    return this.getBranches({ location });
  },

  async getChamberById(id) {
    return this.getBranchById(id);
  },

  // Doctors
  async getDoctors({ specialty = '', location = '', search = '', consultation_type = '', hospital = '' } = {}) {
    const url = new URL(`${BASE_URL}/doctors/`);
    if (specialty) url.searchParams.append('specialty', specialty);
    if (location && location !== 'All Bangladesh') {
      url.searchParams.append('location', location);
    }
    if (search) url.searchParams.append('search', search);
    if (consultation_type) url.searchParams.append('consultation_type', consultation_type);
    if (hospital) url.searchParams.append('hospital', hospital);
    const res = await fetch(url, { headers: getHeaders() });
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

  // --- ADMIN MANAGEMENT METHODS ---

  // Admin Hospitals CRUD
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
    if (res.status === 204) return true;
    return handleResponse(res);
  },

  // Admin Branch CRUD
  async createBranch(data) {
    const res = await fetch(`${BASE_URL}/branches/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async updateBranch(id, data) {
    const res = await fetch(`${BASE_URL}/branches/${id}/`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async deleteBranch(id) {
    const res = await fetch(`${BASE_URL}/branches/${id}/`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (res.status === 204) return true;
    return handleResponse(res);
  },

  // Backward compatibility alias for createChamber/updateChamber/deleteChamber
  async createChamber(chamberData) { return this.createBranch(chamberData); },
  async updateChamber(id, chamberData) { return this.updateBranch(id, chamberData); },
  async deleteChamber(id) { return this.deleteBranch(id); },

  // Admin Doctor CRUD
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
    if (res.status === 204) return true;
    return handleResponse(res);
  },

  // Admin Branch Test CRUD
  async createBranchTest(branchTestData) {
    const res = await fetch(`${BASE_URL}/branch-tests/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(branchTestData),
    });
    return handleResponse(res);
  },

  async deleteBranchTest(id) {
    const res = await fetch(`${BASE_URL}/branch-tests/${id}/`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (res.status === 204) return true;
    return handleResponse(res);
  },

  // Admin Pathology Test CRUD
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
    if (res.status === 204) return true;
    return handleResponse(res);
  },

  // Admin Specialty CRUD
  async createSpecialty(specialtyData) {
    const res = await fetch(`${BASE_URL}/specialties/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(specialtyData),
    });
    return handleResponse(res);
  },

  async deleteSpecialty(id) {
    const res = await fetch(`${BASE_URL}/specialties/${id}/`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (res.status === 204) return true;
    return handleResponse(res);
  },

  // Admin Bookings Management
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
