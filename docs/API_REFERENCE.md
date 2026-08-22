# Doctor's Hub REST API Reference

Welcome to the backend API reference for **Doctor's Hub**. This platform powers doctor search and scheduling, hospital and diagnostic center discovery, lab test catalog management, online appointment/test bookings, and role-scoped administrative workflows.

---

## 1. Getting Started & Interactive Documentation

### Interactive UIs
The backend provides interactive OpenAPI 3.0 documentation using offline-bundled static assets (`drf-spectacular-sidecar`):

| Interface | URL | Description |
| :--- | :--- | :--- |
| **Swagger UI** | [`/api/docs/`](http://localhost:8000/api/docs/) | Interactive API explorer & test console |
| **Redoc** | [`/api/redoc/`](http://localhost:8000/api/redoc/) | Clean, structured 3-panel API reference |
| **OpenAPI Schema (YAML)** | [`/api/schema/`](http://localhost:8000/api/schema/) | Raw OpenAPI 3.0 YAML schema download |

### Base URLs & Versioning
All endpoints are available with both the root prefix and versioned alias:
- **Standard Prefix**: `/api/...` (e.g., `/api/doctors/`)
- **Version 1 Prefix**: `/api/v1/...` (e.g., `/api/v1/doctors/`)

---

## 2. Authentication & Authorization

### JWT Bearer Authentication
Except for public read / self-registration endpoints, authenticated requests must supply an `Authorization` HTTP header with a valid JWT token:

```http
Authorization: Bearer <access_token>
```

- **Access Token Lifetime**: 60 minutes
- **Refresh Token Lifetime**: 7 days

### Role-Based Access Control (RBAC) & Scoping

| Role | Identifiers / Fields | Scope & Capabilities |
| :--- | :--- | :--- |
| `super_admin` | `is_superuser=True`, `role='super_admin'` | Full unrestricted global access to all facilities, doctors, verifications, staff, and platform settings. |
| `facility_admin` | `role='facility_admin'` | Scoped to facilities in `user.managed_location_ids`. Can manage hospital/diagnostic details, test offerings, facility doctors, staff, and bookings for their branches. |
| `staff` | `role='staff'` | Delegated facility staff assigned to a location via `FacilityMembership`. |
| `doctor` | `role='doctor'`, `doctor_profile` | Scoped to own doctor profile, chambers, affiliations, schedules, and patient consultation bookings. |
| `anonymous` | None | Public discovery: search metadata, doctors directory, facility directory, test catalog, and booking submission. |

### Rate Limits & Throttling
- **Anonymous Users**: `10,000 / day`
- **Authenticated Users**: `50,000 / day`
- **Registration Endpoints**: `60 / hour`
- **Login Endpoint**: `120 / hour`

---

## 3. API Endpoints by Tag

### 3.1. Authentication & Profile (`Authentication & Profile`)

#### User Login
- **Endpoint**: `POST /api/auth/login/`
- **Throttling**: `120/hour`
- **Request Body**:
  ```json
  {
    "phone_number": "01711000000",
    "password": "SecurePassword123"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "user": {
      "id": "11111111-1111-1111-1111-111111111111",
      "phone_number": "01711000000",
      "first_name": "Admin",
      "last_name": "User",
      "role": "super_admin",
      "is_staff": true,
      "is_superuser": true,
      "managed_locations": [],
      "doctor_id": null
    },
    "refresh": "<jwt_refresh_token>",
    "access": "<jwt_access_token>"
  }
  ```

#### Current User Profile
- **Endpoints**:
  - `GET /api/auth/me/` (Retrieve authenticated user profile)
  - `PATCH /api/auth/me/` (Update `first_name`, `last_name`)
- **Headers**: `Authorization: Bearer <access_token>`

#### Self-Registration (Public)
- **Facility Registration**: `POST /api/auth/register/facility/`
  ```json
  {
    "phone_number": "01811223344",
    "password": "Password123",
    "first_name": "Rahim",
    "last_name": "Khan",
    "facility_name": "Labaid Diagnostic",
    "branch": "Dhanmondi Branch",
    "location_type": "diagnostic_center",
    "division": "Dhaka",
    "district": "Dhaka",
    "area": "Dhanmondi",
    "address_line": "House 1, Road 4, Dhanmondi",
    "facility_phone": "01811223344",
    "facility_email": "info@labaid.com.bd"
  }
  ```
  *Note*: Creates the facility with `is_verified=False`. It becomes live once verified by a Super Admin.

- **Doctor Self-Registration**: `POST /api/auth/register/doctor/`
  ```json
  {
    "phone_number": "01911223344",
    "password": "Password123",
    "name": "Dr. Sarah Ahmed",
    "bmdc_number": "A-12345",
    "qualification": "MBBS, FCPS (Cardiology)",
    "specialty_ids": ["uuid-specialty-1"],
    "experience": "10 years"
  }
  ```

---

### 3.2. Search & Discovery (`Search & Discovery`)

#### Search Metadata Dropdowns
- **Endpoint**: `GET /api/search-metadata/`
- **Description**: Returns all distinct doctor specialties, test categories, hospital categories, and diagnostic center categories with active item counts.

#### Real-time Faceted Search
- **Endpoint**: `GET /api/search-facets/`
- **Query Parameters**:
  - `location` (or `loc`): Division, district, or area (e.g., `"Dhaka"`, `"Chittagong"`)
  - `area`: Specific area (e.g., `"Dhanmondi"`, `"Banani"`, `"Uttara"`)
  - `search` (or `q`): Free-text search string for doctor, test, or facility name
- **Response `200 OK`**:
  ```json
  {
    "total_doctors": 45,
    "total_hospitals": 12,
    "total_diagnostic_centers": 18,
    "specialties": [...],
    "hospital_categories": [...],
    "diagnostic_center_categories": [...],
    "test_categories": [...],
    "districts": ["Dhaka", "Chittagong", "Sylhet"],
    "divisions": ["Dhaka", "Chittagong", "Sylhet"]
  }
  ```

---

### 3.3. Doctors (`Doctors`)

#### Doctor Directory & Search
- **Endpoint**: `GET /api/doctors/` | `GET /api/doctors/{id}/`
- **Filtering Options**:
  - `?specialty=<name|slug|uuid>`
  - `?location=<district|division|area>`
  - `?area=<area>`
  - `?district=<district>`
  - `?division=<division>`
  - `?fee_max=<amount>`
  - `?day=<Sat|Sun|Mon|Tue|Wed|Thu|Fri>`
  - `?hospital=<uuid>`
  - `?diagnostic_center=<uuid>`
  - `?search=<keyword>`

#### Specialties
- **Endpoint**: `GET /api/specialties/` | `POST /api/specialties/` (Super Admin)

#### Doctor Affiliations & Visiting Schedules
- **Affiliations**: `GET /api/affiliations/` | `POST /api/affiliations/`
  - Links a doctor to a hospital/diagnostic facility location with consultation fee.
- **Schedules**: `GET /api/schedules/` | `POST /api/schedules/`
  - Visiting days (`day_of_week`), start time, end time, and patient limit per slot.

---

### 3.4. Facilities (`Facilities`)

#### Locations (Master Facility Records)
- **Endpoint**: `GET /api/locations/` | `POST /api/locations/`
- **Location Types**: `hospital`, `diagnostic_center`, `both`

#### Hospitals & Categories
- **Hospitals**: `GET /api/hospitals/` | `POST /api/hospitals/` | `GET /api/hospitals/{slug_or_id}/`
  - Filters: `category`, `district`, `division`, `area`, `has_diagnostic_center`, `search`
- **Hospital Categories**: `GET /api/hospital-categories/`
- **Hospital Services**: `GET /api/hospital-services/` (e.g., ICU, Emergency, NICU, CCU)

#### Diagnostic Centers & Services
- **Diagnostic Centers**: `GET /api/diagnostic-centers/` | `POST /api/diagnostic-centers/` | `GET /api/diagnostic-centers/{slug_or_id}/`
  - Filters: `category`, `testcat`, `district`, `division`, `area`, `search`
- **Diagnostic Categories**: `GET /api/diagnostic-center-categories/`
- **Diagnostic Services**: `GET /api/diagnostic-services/` (e.g., 3T MRI, Digital X-Ray, CT Scan)

#### Doctor Chambers
- **Endpoint**: `GET /api/chambers/` | `POST /api/chambers/`

---

### 3.5. Diagnostic Tests (`Diagnostic Tests`)

#### Test Categories
- **Endpoint**: `GET /api/test-categories/` | `POST /api/test-categories/` (Super Admin)
  - Categories: Pathology, Radiology & Imaging, Cardiology, Biochemistry, etc.

#### Master Test Catalog
- **Endpoint**: `GET /api/tests/` | `POST /api/tests/` (Super Admin)
  - Fields: `name`, `code`, `sample_type`, `preparation_instructions`, `fasting_required`, `report_time_hours`

#### Branch Test Offerings (`facility-tests`)
- **Endpoint**: `GET /api/facility-tests/` | `POST /api/facility-tests/` | `PATCH /api/facility-tests/{id}/`
- **Description**: Specific price, discount, availability, and home sample collection flags for a test at a specific diagnostic center branch.

---

### 3.6. Bookings (`Bookings`)

#### Doctor Appointment Bookings
- **Create**: `POST /api/bookings/doctor/` (Public / Authenticated)
  ```json
  {
    "affiliation": "uuid-doctor-affiliation",
    "patient_name": "Karim Ullah",
    "patient_phone": "01700112233",
    "patient_age": 35,
    "patient_gender": "male",
    "booking_date": "2026-08-25",
    "notes": "Follow up consultation"
  }
  ```
- **List / Manage**: `GET /api/bookings/doctor/` | `PATCH /api/bookings/doctor/{id}/`
  - Scoped to Super Admin, Facility Admin (for their facility), or Doctor (for their consultations).
  - Statuses: `pending`, `confirmed`, `completed`, `cancelled`, `no_show`

#### Lab Test Bookings
- **Create**: `POST /api/bookings/lab/` (Public / Authenticated)
  ```json
  {
    "facility_test": "uuid-facility-test",
    "patient_name": "Amina Begum",
    "patient_phone": "01799887766",
    "booking_date": "2026-08-26",
    "home_collection": true,
    "address": "Flat 4B, Road 12, Dhanmondi"
  }
  ```
- **List / Manage**: `GET /api/bookings/lab/` | `PATCH /api/bookings/lab/{id}/`

---

### 3.7. Admin & Staff Management (`Admin & Staff Management`)

#### Admin Dashboard Bootstrap
- **Endpoint**: `GET /api/admin/dashboard-init/`
- **Headers**: `Authorization: Bearer <access_token>`
- **Description**: Returns reference taxonomies along with all facilities, doctors, branch tests, and bookings scoped to the caller's role in a single optimized payload.

#### Delegated Facility Staff Management
- **List Facility Staff**: `GET /api/facilities/{location_id}/staff/`
- **Add Facility Staff**: `POST /api/facilities/{location_id}/staff/`
  ```json
  {
    "phone_number": "01722334455",
    "password": "StaffPassword123",
    "first_name": "Tanvir",
    "last_name": "Ahmed"
  }
  ```
- **Remove Staff**: `DELETE /api/facilities/{location_id}/staff/{user_id}/`

#### Super Admin Verification Queue
- **Get Queue**: `GET /api/admin/verifications/`
  - Returns all pending facilities (`pending_facilities`) and doctors (`pending_doctors`).
- **Approve / Reject**: `POST /api/admin/verifications/{entity_type}/{entity_id}/`
  - `entity_type`: `facility` or `doctor`
  - `entity_id`: UUID
  - Body: `{"action": "approve"}` or `{"action": "reject"}`

#### Platform Super Admins
- **List Platform Admins**: `GET /api/admin/platform-admins/`
- **Create / Promote Super Admin**: `POST /api/admin/platform-admins/`

---

## 4. Standard Error Response Format

When an API error occurs, responses conform to DRF standard format:

```json
{
  "detail": "Error message description."
}
```

Validation errors return field-specific maps:
```json
{
  "phone_number": [
    "A user with that phone number already exists."
  ]
}
```

| HTTP Status Code | Meaning |
| :--- | :--- |
| `200 OK` | Request succeeded |
| `201 Created` | Resource created successfully |
| `204 No Content` | Resource deleted successfully |
| `400 Bad Request` | Validation failure or invalid parameters |
| `401 Unauthorized` | Missing or expired JWT token |
| `403 Forbidden` | Insufficient role or scope permissions |
| `404 Not Found` | Requested resource does not exist |
| `429 Too Many Requests` | Throttling rate limit exceeded |
| `500 Internal Server Error` | Server error |

