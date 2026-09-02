import {
  BASE_URL,
  fetchWithTimeout,
  handleResponse,
  getHeaders,
  flattenFacility,
} from './core';

// OTP Services
export async function sendOtp(phone, purpose = 'booking') {
  const res = await fetchWithTimeout(`${BASE_URL}/bookings/otp/send/`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ phone, purpose }),
  });
  return handleResponse(res);
}

export async function verifyOtp(phone, otp_code, purpose = 'booking') {
  const res = await fetchWithTimeout(`${BASE_URL}/bookings/otp/verify/`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ phone, otp_code, purpose }),
  });
  return handleResponse(res);
}

// Patient Lookup
export async function lookupPatient(phone) {
  if (!phone) return { found: false };
  const res = await fetchWithTimeout(`${BASE_URL}/bookings/patients/lookup/?phone=${encodeURIComponent(phone)}`, {
    headers: getHeaders(),
  });
  return handleResponse(res);
}

// Doctor Booking
export async function createDoctorBooking(bookingData) {
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
}

// Test / Lab Booking
export async function createTestBooking(testData) {
  const payload = { ...testData };
  if (testData.test && !testData.facility_test_id) {
    payload.facility_test_id = testData.test;
  }
  if (testData.facility_test && !testData.facility_test_id) {
    payload.facility_test_id = testData.facility_test;
  }
  if (testData.address && !testData.pickup_address_line) {
    payload.pickup_address_line = testData.address;
  }
  if (!payload.pickup_district) {
    payload.pickup_district = testData.city || testData.district || 'Dhaka';
  }
  const res = await fetchWithTimeout(`${BASE_URL}/bookings/test/`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export const createLabBooking = createTestBooking;

// Hospital Service Booking
export async function createHospitalServiceBooking(bookingData) {
  const payload = { ...bookingData };
  if (bookingData.hospital && !bookingData.hospital_id) {
    payload.hospital_id = bookingData.hospital;
  }
  if (bookingData.service && !bookingData.service_id) {
    payload.service_id = bookingData.service;
  }
  const res = await fetchWithTimeout(`${BASE_URL}/bookings/hospital-service/`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

// Bookings Admin Management
export async function getDoctorBookings() {
  const res = await fetchWithTimeout(`${BASE_URL}/bookings/doctor/`, {
    headers: getHeaders(),
  });
  return flattenFacility(await handleResponse(res));
}

export async function updateDoctorBookingStatus(id, status) {
  const res = await fetchWithTimeout(`${BASE_URL}/bookings/doctor/${id}/`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify({ status }),
  });
  return handleResponse(res);
}

export async function getTestBookings() {
  const res = await fetchWithTimeout(`${BASE_URL}/bookings/test/`, {
    headers: getHeaders(),
  });
  return flattenFacility(await handleResponse(res));
}

export const getLabBookings = getTestBookings;

export async function updateTestBookingStatus(id, status) {
  const res = await fetchWithTimeout(`${BASE_URL}/bookings/test/${id}/`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify({ status }),
  });
  return handleResponse(res);
}

export const updateLabBookingStatus = updateTestBookingStatus;

export async function getHospitalServiceBookings() {
  const res = await fetchWithTimeout(`${BASE_URL}/bookings/hospital-service/`, {
    headers: getHeaders(),
  });
  return flattenFacility(await handleResponse(res));
}

export async function updateHospitalServiceBookingStatus(id, status) {
  const res = await fetchWithTimeout(`${BASE_URL}/bookings/hospital-service/${id}/`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify({ status }),
  });
  return handleResponse(res);
}

