const BASE_URL = 'http://localhost:8000/api';

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

  // Pathology Tests
  async getTests(search = '') {
    const url = new URL(`${BASE_URL}/tests/`);
    if (search) url.searchParams.append('search', search);
    const res = await fetch(url, { headers: getHeaders() });
    return handleResponse(res);
  },

  // Chambers
  async getChambers(location = '') {
    const url = new URL(`${BASE_URL}/chambers/`);
    if (location && location !== 'All Bangladesh') {
      url.searchParams.append('location', location);
    }
    const res = await fetch(url, { headers: getHeaders() });
    return handleResponse(res);
  },

  // Doctors
  async getDoctors({ specialty = '', location = '', search = '' } = {}) {
    const url = new URL(`${BASE_URL}/doctors/`);
    if (specialty) url.searchParams.append('specialty', specialty);
    if (location && location !== 'All Bangladesh') {
      url.searchParams.append('location', location);
    }
    if (search) url.searchParams.append('search', search);
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
};
