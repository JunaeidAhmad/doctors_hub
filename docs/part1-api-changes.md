# Doctors Hub — Part 1 API Changes Reference

This document catalogs every API endpoint added, modified, or deprecated as part of the Part 1 Architecture, Database Unification, and Booking System overhaul.

---

## 1. Facilities & Locations Unification

### Overview
- Hospital and Diagnostic Center tables were consolidated into the unified `facilities_location` model.
- Polymo-relational queries and joins replaced with direct foreign keys to `Location`.

### Endpoints
#### `GET /api/hospitals/`
- **Change**: Streamlined payload. Removed unpaginated nested test lists and large embedded doctor lists.
- **Response**: List of hospitals formatted via `FacilitySummarySerializer` (`id`, `name`, `branch`, `slug`, `location_type`, `area`, `district`, `division`, `address_line`, `phone_number`, `rating`, `review_count`, `featured_image`).
- **Reduction**: Payload shrunk from ~2.17 MB to ~24.9 KB (-98.85%).

#### `GET /api/hospitals/{slug_or_id}/`
- **Change**: Streamlined detail representation without massive nested entities.
- **Dedicated Sub-endpoints**:
  - `GET /api/hospitals/{id}/doctors/`: Paginated or filtered affiliated doctors.
  - `GET /api/hospitals/{id}/tests/`: Paginated facility test offerings.

#### `GET /api/diagnostic-centers/`
- **Change**: List payload stripped of heavy nested `available_tests` and affiliations.
- **Reduction**: Payload (with `page_size=50`) shrunk from ~5.76 MB to ~18.4 KB (-99.68%).

#### `GET /api/locations/{id}/summary/`
- **New/Enhanced**: Unified endpoint returning location details, contact info, and facility categorization.

---

## 2. Diagnostic Tests & Pricing

### Overview
- `FacilityTest.price` was replaced with the multi-tier pricing model: `standard_price`, `urgent_price`, and `home_collection_fee`.

### Endpoints
#### `GET /api/tests/`
- Canonical catalog of diagnostic tests.

#### `GET /api/facility-tests/`
- **Change**: Filterable by `location`, `test`, `search`, and price ranges.
- **Fields**:
  - `id`: UUID
  - `location`: UUID of facility
  - `test`: Canonical test details
  - `standard_price`: Decimal
  - `urgent_price`: Decimal (optional)
  - `home_collection_fee`: Decimal (optional)
  - `is_available`: Boolean

#### `POST /api/facility-tests/bulk/`
- **New**: Bulk create or update facility tests for a specific location.

---

## 3. RBAC (Role-Based Access Control)

### Overview
- Replaced legacy single-field `User.role` with multi-role assignments via `UserRole` mapping users to `Role` instances with granular permission flags and facility scoping.

### Endpoints
#### `GET /api/users/me/`
- **Change**: Returns active profile information including:
  - `is_super_admin`: Boolean
  - `is_facility_admin`: Boolean
  - `is_doctor`: Boolean
  - `managed_locations`: List of `{ id, name, location_type, branch }`
  - `roles`: List of assigned role names

#### `GET /api/roles/`
- Role management list for platform administrators.

#### `POST /api/user-roles/`
- Assigns a user to a scoped role for a specific facility or globally.

#### `DELETE /api/user-roles/{id}/`
- Revokes a role assignment.

---

## 4. Doctor Directory & Availability Engine

### Overview
- Elimination of invented 15-minute static slot generation (`validate_slot_against_schedule`, fake `slotsLeft`, `05:15 PM`).
- Introduction of appointment capacity (`max_patients`), estimated consultation time (`avg_consult_minutes`), and serial-based queuing.

### Endpoints
#### `GET /api/doctors/`
- **Filters Added**:
  - `bmdc`: Case-insensitive BMDC registration number lookup (`lookup_expr='iexact'`).
  - `search`: Full text search across doctor name, qualifications, institution, academic title.
- **Fields**:
  - `next_available`: Computed lightweight next consultation session object (`date`, `session_start`, `session_end`, `remaining_capacity`, `session_key`, `facility_name`, `advance_booking_days`), or `null` if none in next 7 days.

#### `GET /api/affiliations/{id}/availability/`
- **New Endpoint**: Returns dynamic consultation availability for a doctor's affiliation over a date window.
- **Parameters**:
  - `from`: Start date (`YYYY-MM-DD`, default today)
  - `days`: Window length (1–30, default 7)
- **Response Shape**:
  ```json
  {
    "affiliation_id": "uuid",
    "doctor_name": "Dr. Farhana Ahmed",
    "location_name": "Ibn Sina Hospital Dhanmondi",
    "advance_booking_days": 14,
    "dates": [
      {
        "date": "2026-10-01",
        "day_of_week": "Thursday",
        "status": "available",
        "sessions": [
          {
            "session_key": "s:uuid",
            "start_time": "17:00:00",
            "end_time": "21:00:00",
            "max_patients": 30,
            "booked_count": 4,
            "remaining_capacity": 26,
            "status": "available"
          }
        ]
      }
    ]
  }
  ```

#### `GET /api/schedule-exceptions/` & `POST /api/schedule-exceptions/`
- **New ViewSet**: Manage leaves, hour modifications, and extra consultation sessions.
- **Permissions**: Scoped facility admin, doctor owner, or super admin.
- **Fields**:
  - `affiliation_id`: UUID
  - `date`: Date (`YYYY-MM-DD`)
  - `kind`: `'cancel'` | `'modify'` | `'extra'`
  - `schedule`: UUID (required for `cancel` and `modify`; null for `extra`)
  - `start_time`: Time (required for `modify` and `extra`)
  - `end_time`: Time (required for `modify` and `extra`)
  - `max_patients`: Positive integer
  - `avg_consult_minutes`: Positive integer
  - `note`: Text (reason / public note)
  - `affected_bookings`: Read-only count of active bookings on this date affected by this exception.

#### `DELETE /api/schedule-exceptions/{id}/`
- Removes a schedule exception.

---

## 5. Doctor Bookings Overhaul

### Endpoints
#### `POST /api/bookings/doctors/`
- **Removed Fields**: `slot`, static time string.
- **Required Request Payload**:
  ```json
  {
    "affiliation_id": "uuid",
    "date": "2026-10-05",
    "session_key": "s:uuid",
    "patient_name": "Rahim Uddin",
    "patient_phone": "01711223344",
    "patient_gender": "Male",
    "patient_age": 35,
    "otp_code": "123456"
  }
  ```
- **Validation**:
  - Rejects past dates.
  - Rejects dates beyond `advance_booking_days`.
  - Rejects if session capacity is reached (HTTP 400: `"This consultation session is fully booked."`).
  - Rejects if session is cancelled by an active schedule exception (HTTP 400: `"Consultation session is cancelled on this date."`).
- **Response Shape**:
  ```json
  {
    "id": "uuid",
    "serial_number": 5,
    "serial_display": "Serial #5",
    "estimated_time": "17:40:00",
    "session_start": "17:00:00",
    "session_end": "21:00:00",
    "booking_date": "2026-10-05",
    "status": "pending",
    "fee": "1200.00"
  }
  ```

---

## 6. Doctor Onboarding & Duplicate Prevention

### Constraints
- Database `UniqueConstraint(fields=['doctor', 'location'], name='unique_doctor_location')` on `DoctorAffiliation`.
- Case-insensitive BMDC uniqueness and filter: `GET /api/doctors/?bmdc={bmdc}`.

### Endpoints
#### `POST /api/affiliations/`
- Re-affiliating an already affiliated doctor to the same facility returns clean HTTP 400:
  `"This doctor is already affiliated with this facility."`

#### `POST /api/doctors/`
- Creating a doctor with an existing BMDC registration returns clean HTTP 400 validation error.
