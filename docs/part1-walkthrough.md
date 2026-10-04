# Doctors Hub — Part 1 Walkthrough

This document records the actual changes implemented across Phases 0–9 of Part 1, derived directly from `plan/PART1_IMPLEMENTATION_PLAN.md` and commit `4af04c3`.

---

## Phase 0: Baseline & Guardrails
- **Files Changed:**
  - `docs/part1-baseline.md`: Baseline performance measurements and initial database row counts.
  - `doctors_hub/src/services/api/core.js`: Implemented `setCached` size guard (>500,000 chars skips localStorage and stays in memoryCache only).
- **Tests Added/Verified:**
  - Verified full backend test suite on PostgreSQL baseline.

---

## Phase 1: Doctor Sort Removal & Hospital Server-side Ordering
- **Files Changed:**
  - `doctors_hub_backend/doctors/views.py`: Stable ordering `.order_by('name', 'id')` in `DoctorViewSet.get_queryset`.
  - `doctors_hub_backend/facilities/views.py`: Added `OrderingFilter` to `HospitalViewSet` with `name` annotation and ordering fields.
  - `doctors_hub/src/views/DoctorSearch/DoctorSearchPage.jsx`: Removed client-side doctor sorting, `sortOrder` state, and fee fallback.
  - `doctors_hub/src/views/DoctorSearch/components/DoctorSearchHeader.jsx`: Removed sort props.
  - `doctors_hub/src/views/Hospitals/HospitalsPage.jsx`: Delegated ordering to backend (`ordering=name` / `-name`) and connected `totalHospitals` count.
  - `doctors_hub/src/services/api/hospitals.js`: Accepted and forwarded `ordering` parameter with cache key integration.
- **Tests Added:**
  - `doctors_hub_backend/tests/test_part1_hospital_ordering.py`: Test A→Z and Z→A pagination and ordering on hospitals.

---

## Phase 2: Geo by ID Only
- **Files Changed:**
  - `doctors_hub_backend/doctors/views.py`: Removed name-based geo filters (`area`, `district`, `division`, `location`) from `DoctorFilter`, preserving ID filters (`thana_id`, `district_id`, `division_id`). Implemented single-chamber subquery filter in `filter_queryset`.
  - `doctors_hub_backend/facilities/views.py`: Removed name-based geo filters and `resolve_location_q` from `HospitalFilter` and `DiagnosticCenterFilter`.
  - `doctors_hub_backend/core/views.py`: Updated `SearchFacetsAPIView` to accept `division_id`, `district_id`, `thana_id` integers.
  - `doctors_hub_backend/facilities/serializers.py`: Validated required `thana` on `LocationSerializer` creation.
  - `doctors_hub/src/hooks/useGeo.js`: Created hook with `useDivisions`, `useDistricts`, `useThanas`.
  - `doctors_hub/src/components/CascadingLocationFilter.jsx`: Rewritten to accept and emit numeric ID props (`divisionId`, `districtId`, `thanaId`).
  - `doctors_hub/src/data/constants.js`: Deleted legacy static location and division/district constants.
  - `doctors_hub/src/components/Footer.jsx`, `doctors_hub/src/components/TopUtilityStrip.jsx`, `doctors_hub/src/views/DiagnosticsSearch/components/DiagnosticsFilterSidebar.jsx`, `doctors_hub/src/views/DoctorSearch/components/DoctorFilterSidebar.jsx`, `doctors_hub/src/views/AdminDashboard/components/modals/DiagnosticModal.jsx`, `doctors_hub/src/views/AdminDashboard/components/modals/HospitalModal.jsx`: Migrated to ID-based location filters.
  - `doctors_hub/src/services/api/doctors.js`, `hospitals.js`, `diagnosticCenters.js`: Replaced name filters with ID query parameters.
- **Tests Added:**
  - `doctors_hub_backend/tests/test_part1_geo_filters.py`: Verified multi-chamber subquery filtering, single-chamber matching, integer validation, and ID-based facet filtering.

---

## Phase 3: Flat Facility Shape
- **Files Changed:**
  - `doctors_hub_backend/core/text.py`: Added `format_facility_name(name, branch)`.
  - `doctors_hub_backend/facilities/models.py`: Added `Location.display_name` property.
  - `doctors_hub_backend/facilities/serializers_summary.py`: Created `FacilitySummarySerializer`.
  - `doctors_hub_backend/facilities/serializers.py`: Integrated `FacilitySummarySerializer` into `HospitalSerializer` and `DiagnosticCenterSerializer` representation.
  - `doctors_hub_backend/doctors/serializers.py`: Added nested `facility` summary to `DoctorAffiliationSerializer`.
  - `doctors_hub_backend/tests/serializers.py`: Added nested `facility` summary to `FacilityTestSerializer`.
  - `doctors_hub_backend/bookings/serializers.py`: Added nested `facility` summary to all booking serializers.
  - `doctors_hub_backend/core/views.py`: Updated `SearchMetadataAPIView` with `FacilitySummarySerializer`.
  - `doctors_hub/src/services/api/core.js`: Removed `flattenFacility` helper.
  - `doctors_hub/src/utils/facilityUtils.js`, `facilityUtils.test.js`: Streamlined facility utilities.
- **Tests Added:**
  - `doctors_hub_backend/tests/test_part1_facility_shape.py`: Validated flat facility attributes, nested `facility` on affiliations, tests, and bookings, and query bounds.

---

## Phase 4: Exact Categories & Specialty Suggest
- **Files Changed:**
  - `doctors_hub_backend/core/filters.py`: Implemented `exact_slug_or_id_q`.
  - `doctors_hub_backend/facilities/views.py`: Applied exact slug/UUID matching in `HospitalFilter` and `DiagnosticCenterFilter`.
  - `doctors_hub_backend/tests/views.py`: Applied exact category matching in `TestFilter` and `FacilityTestFilter`.
  - `doctors_hub_backend/doctors/services/specialty_suggest.py`: Implemented ranking algorithm for specialty suggestion (exact, prefix, contains with alias match).
  - `doctors_hub_backend/doctors/views.py`: Added `/api/specialties/suggest/` endpoint.
  - `doctors_hub_backend/core/views.py`: Slimmed `SearchMetadataAPIView` by pruning `search_terms`.
  - `doctors_hub/src/hooks/useSpecialtySuggest.js`: Created debounced suggest hook.
  - `doctors_hub/src/views/DiagnosticsSearch/hooks/useDiagnosticsSearch.js`: Updated category resolution to exact matches.
- **Tests Added:**
  - `doctors_hub_backend/tests/test_part1_suggest_and_categories.py`: Tested suggest ranking, Bangla alias matching, deduplication, and exact category slug/UUID matching.

---

## Phase 5: Diagnostics Search Endpoint
- **Files Changed:**
  - `doctors_hub_backend/tests/pricing.py`: Created `net_price()` database expression for calculated pricing.
  - `doctors_hub_backend/tests/search.py`: Implemented server-side diagnostics search service (grouping by test, facet computation, ordering, and hydration).
  - `doctors_hub_backend/tests/serializers.py`: Created `FacilityTestSearchGroupSerializer` and `FacilityTestSearchOfferingSerializer`.
  - `doctors_hub_backend/core/pagination.py`: Created `SearchPagination` with facets envelope.
  - `doctors_hub_backend/tests/views.py`: Added `search` action on `FacilityTestViewSet` (`/api/facility-tests/search/`).
  - `doctors_hub/src/services/api/tests.js`: Added `searchFacilityTests`.
  - `doctors_hub/src/views/DiagnosticsSearch/hooks/useDiagnosticsSearch.js`: Replaced client-side grouping and slicing with direct server API calls.
  - `doctors_hub/src/views/DiagnosticsSearch/DiagnosticsSearchPage.jsx`, `DiagnosticsFilterSidebar.jsx`, `DiagnosticsResultsHeader.jsx`: Connected server search results and facets.
- **Tests Added:**
  - `doctors_hub_backend/tests/test_facility_test_search.py`: Comprehensive test suite for grouping, facets, ordering, pagination, and query bounds.

---

## Phase 6: Hospital Detail Endpoints & Embedded List Pruning
- **Files Changed:**
  - `doctors_hub_backend/facilities/views_facility_actions.py`: Created `FacilityDetailActionsMixin` providing dedicated `/doctors/` and `/tests/` sub-endpoints.
  - `doctors_hub_backend/facilities/views.py`: Mixed `FacilityDetailActionsMixin` into `HospitalViewSet` and `DiagnosticCenterViewSet`.
  - `doctors_hub_backend/facilities/models.py`: Added `Hospital.details_reviewed` field.
  - `doctors_hub_backend/facilities/serializers.py`: Removed heavy embedded `affiliated_doctors` and `offered_tests` lists; replaced with annotated `doctor_count` and `test_count`.
  - `doctors_hub/src/services/api/hospitals.js`, `diagnosticCenters.js`: Added `getFacilityDoctors` and `getFacilityTests`.
  - `doctors_hub/src/views/HospitalDetail/components/HospitalDoctorsSection.jsx`, `HospitalDiagnosticsSection.jsx`, `HospitalDetailPage.jsx`: Connected dedicated endpoints, removed static fallbacks.
  - `doctors_hub/src/views/AdminDashboard/components/HospitalsTab.jsx`, `HospitalModal.jsx`: Added "Needs review" indicator and `details_reviewed` control.
- **Tests Added:**
  - `doctors_hub_backend/tests/test_part1_facility_actions.py`: Verified pagination, search, facets, and query counts on hospital detail sub-endpoints.

---

## Phase 7: Sessions, Serials & Availability
- **Files Changed:**
  - `doctors_hub_backend/core/settings.py`: Set `TIME_ZONE = 'Asia/Dhaka'`.
  - `doctors_hub_backend/doctors/models.py`: Added `max_patients` and `avg_consult_minutes` to `AffiliationSchedule`; added `advance_booking_days` to `DoctorAffiliation`; removed `status_label`; created `ScheduleException` model.
  - `doctors_hub_backend/bookings/models.py`: Added `session_key`, `session_start`, `session_end`, `estimated_time`, `schedule`, and `schedule_exception` to `DoctorBooking`; removed legacy `slot` field.
  - `doctors_hub_backend/doctors/services/availability.py`: Built availability calculation engine and `batch_next_available`.
  - `doctors_hub_backend/doctors/views.py`: Added `/api/affiliations/{id}/availability/` action and `ScheduleExceptionViewSet`.
  - `doctors_hub_backend/bookings/services.py`: Implemented atomic `create_doctor_booking` with serial numbering and capacity locking.
  - `doctors_hub_backend/bookings/serializers.py`: Updated `DoctorBookingSerializer` for session fields.
  - `doctors_hub_backend/doctors/serializers.py`: Added `next_available` to `DoctorAffiliationSerializer`.
  - `doctors_hub/src/views/DoctorProfile/components/DoctorBookingWidget.jsx`: Updated to render dynamic date chips, session cards, and capacity.
  - `doctors_hub/src/components/BookingModal.jsx`: Connected session booking flow with serial and estimated consultation time display.
  - `doctors_hub/src/views/AdminDashboard/components/doctor/ScheduleExceptionsPanel.jsx`: Created management interface for schedule exceptions.
- **Tests Added:**
  - `doctors_hub_backend/tests/test_part1_availability.py`: Tested session resolution, serial incrementation, exceptions precedence, capacity limits, concurrency locking, and query bounds.

---

## Phase 8: Doctor Onboarding Duplicate Protection
- **Files Changed:**
  - `doctors_hub_backend/doctors/views.py`: Added `bmdc` filter to `DoctorFilter`.
  - `doctors_hub_backend/doctors/models.py`: Added database constraint `UniqueConstraint(fields=['doctor', 'location'], name='unique_doctor_location')`.
  - `doctors_hub_backend/doctors/serializers.py`: Added validation in `DoctorAffiliationSerializer` preventing duplicate doctor-facility links with a clean HTTP 400.
  - `doctors_hub/src/views/AdminDashboard/components/facility/AffiliateDoctorDrawer.jsx`: Refactored into a two-step flow (Step 1: find existing doctor by BMDC/name; Step 2: create new doctor only if not found) with retry-safe linking.
- **Tests Added:**
  - `doctors_hub_backend/tests/test_onboarding.py`: Verified BMDC lookup and duplicate affiliation prevention.

---

## Phase 9: Final Sweep
- **Files Changed:**
  - `docs/part1-baseline.md`: Recorded post-implementation payload sizes and verified database row preservation.
  - `docs/part1-api-changes.md`: Documented new endpoints, modified query parameters, and removed fields.
  - `docs/part1-agent-notes.md`: Documented architectural decisions, session key design, and query optimization details.
- **Tests Added/Verified:**
  - Verified full test suite (214 tests passing), schema validation, and frontend production build.
