import {
  BASE_URL,
  fetchWithTimeout,
  handleResponse,
  getHeaders,
  flattenFacility,
} from './core';

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

// Lab Booking
export async function createLabBooking(labData) {
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

export async function getLabBookings() {
  const res = await fetchWithTimeout(`${BASE_URL}/bookings/lab/`, {
    headers: getHeaders(),
  });
  return flattenFacility(await handleResponse(res));
}

export async function updateLabBookingStatus(id, status) {
  const res = await fetchWithTimeout(`${BASE_URL}/bookings/lab/${id}/`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify({ status }),
  });
  return handleResponse(res);
}
