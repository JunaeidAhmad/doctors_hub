# Doctors Hub — Part 2 API Changes

This document describes API changes made in Part 2. The Flutter patient app follows this document.

---

## New Endpoints

### Booking Status Transitions
```
POST /api/bookings/doctor/{id}/transition/
POST /api/bookings/test/{id}/transition/
POST /api/bookings/hospital-service/{id}/transition/
```
Body: `{"to": "<status>"}`

Allowed transitions:
- `pending` → `confirmed`, `cancelled`
- `confirmed` → `completed`, `cancelled`, `no_show`
- `completed`, `cancelled`, `no_show` → terminal (no further transitions)

Returns 400 with allowed targets if invalid.

### Atomic Chambers Sync
```
PUT /api/doctors/{id}/chambers/
```
Body:
```json
{"chambers": [{
  "id": "<affiliation uuid, omit for new>",
  "location_id": "<uuid, required>",
  "chamber_type": "Primary Chamber",
  "fee": "800.00",
  "advance_booking_days": 14,
  "schedules": [{"id": "<omit for new>", "day_of_week": "Monday",
                 "start_time": "17:00", "end_time": "21:00",
                 "max_patients": 30, "avg_consult_minutes": 10}]
}]}
```
Response: `{"chambers": [...], "deactivated": [...], "deleted": [...]}`

---

## Removed Parameters

- `fee_max` — removed from `/api/doctors/` filter. No replacement needed.
- `canonical_only` — removed from `/api/specialties/`. The endpoint always returns specialties.
- Name-based location inputs (`division`, `district`, `area` as strings) — replaced by `thana_id` (integer).

---

## Removed or Changed Fields

### Status Writability
- `status` is now **read-only** on all booking create and PATCH endpoints.
- Use the `transition` endpoint to change status.

### Price Nullability
- `FacilityTest.price` is now nullable (`null` means "price at counter").
- `calculated_price` and `discounted_price` return `null` when price is `null`.
- `min_price` / `max_price` in search results return `null` when no priced offerings exist.

### Booking Snapshots
- `DoctorBooking` now includes `fee_at_booking` (exposed as `fee` in API).
- `TestBooking` now includes `price_at_booking` (exposed as `price`), `home_charge_at_booking`, and `collection_type`.
- `patient_age` and `patient_gender` are stored per-booking (snapshot), not on the Patient.

### Hospital Defaults
- `Hospital.bed_capacity`, `icu_beds_total`, `icu_beds_available`, `ot_suites_count`, `has_helipad` are now nullable.
- `Hospital.emergency_phone`, `ambulance_phone`, `accreditation`, `dghs_reg_no`, `parking_capacity` default to empty string.
- Existing values are preserved.

### Category Counts
- `HospitalCategory.count` field removed. Use `hospital_count` annotation instead.
- `TestCategory` now returns `test_count` and `center_count` annotations.
- `DiagnosticCenterCategory` now returns `center_count` annotation.

### Search Facets
- `/api/search-facets/` now returns only `hospital_categories` (slim payload).
- Removed: `total_doctors`, `total_hospitals`, `total_diagnostic_centers`, `specialties`, `diagnostic_center_categories`, `test_categories`.

---

## Phone Format

Canonical stored phone format is `01XXXXXXXXX` (11 digits).
- `8801XXXXXXXXX` → `01XXXXXXXXX`
- `1XXXXXXXXX` → `01XXXXXXXXX`
- `+8801XXXXXXXXX` → `01XXXXXXXXX`

All input boundaries (booking serializers, OTP, patient lookup) normalize to this format.
