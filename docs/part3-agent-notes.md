# Doctors Hub — Part 3 Agent Notes

## Phase 0 — Baseline

### P3.0.1
- Files changed: `scripts/measure_endpoints.py` (created), `docs/part3-baseline.md` (created)
- Summary: Created measurement script using Django test Client + CaptureQueriesContext; recorded status, byte size and query count for all 7 endpoints. Admin init uses DRF APIClient with force_authenticate for JWT.
- Commands run: `venv/bin/python ../scripts/measure_endpoints.py` → all 7 endpoints measured successfully.

### P3.1.1
- Files changed: `doctors_hub_backend/facilities/views.py`, `doctors_hub_backend/facilities/serializers.py`
- Summary: Removed `pagination_class = None` from LocationViewSet (now uses default pagination). Added `LocationPickerSerializer` with `id`, `slug`, `display_name`, `location_type`, `area`, `district`, `is_active`. Added `get_serializer_class` returning picker serializer when `?view=picker`. Added `select_related('thana__district__division')` to queryset.
- Commands: `pytest tests/test_part1_geo_filters.py tests/test_part2_visibility.py` → 12 passed (1 test updated for paginated response).

### P3.1.2
- Files changed: `doctors_hub/src/components/FacilityPicker.jsx` (created), `doctors_hub/src/services/api/admin.js`
- Summary: Created FacilityPicker component with debounced search (300ms) calling `/api/locations/?view=picker`. Added `searchLocations(params)` and `getLocationLabel(id)` to admin API. Props: `{ value, onChange, locationType, disabled }`.

### P3.1.3
- Files changed: `doctors_hub/src/views/AdminDashboard/components/modals/DoctorModal.jsx`, `doctors_hub/src/views/AdminDashboard/components/doctor/DoctorAffiliationsManager.jsx`, `doctors_hub/src/views/AdminDashboard/components/facility/AffiliateDoctorDrawer.jsx`
- Summary: Removed all `'1200'` fee defaults and `allLocations[0]?.id` location defaults. Replaced location `<select>` with `FacilityPicker` in DoctorModal and DoctorAffiliationsManager. Added inline validation blocking save when fee/location missing. Deleted `allLocations` useMemo in DoctorAffiliationsManager.
- Commands: `grep -rnE "'1200'|\|\| 1200|allLocations\[0\]" doctors_hub/src` → nothing.

### P3.1.4
- Files changed: `doctors_hub/src/views/DoctorSearch/DoctorSearchPage.jsx`
- Summary: Removed `api.getLocations()` effect. Facility filter now comes from search-metadata only.

### P3.1.5
- Files changed: `doctors_hub_backend/core/settings.py`, `doctors_hub_backend/tests/test_part2_counts_cache.py`
- Summary: Added `REDIS_URL = _REDIS_URL` after `_REDIS_URL` is read. Added test `test_system_check_no_warning_with_redis`.
- Commands: `pytest tests/test_part2_counts_cache.py` → 9 passed.

### P3.1.6
- Files changed: 16 JSX files, `doctors_hub/src/utils/facilityUtils.js`, `doctors_hub/src/utils/facilityUtils.test.js`, `doctors_hub/package.json`
- Summary: Replaced all `formatFacilityName(x)` calls with `(x?.display_name || x?.name || '')`. Deleted `formatFacilityName` from `facilityUtils.js` and its tests. Updated `test` script.
- Commands: `grep -rn "formatFacilityName" doctors_hub/src` → nothing.

### P3.1.7
- Files changed: `doctors_hub/src/views/DoctorProfile/DoctorProfilePage.jsx`, `DoctorProfileHero.jsx`, `DoctorAboutSection.jsx`, `DoctorReviewsSection.jsx`
- Summary: Replaced `doctor.specialties?.[0]?.name || 'Specialist*'` with `doctor.primary_specialty?.name`. Confirmed `primary_specialty` is in detail serializer.
- Commands: `grep -rnE "specialties\?\.\[0\]|'Specialist'" doctors_hub/src/views/DoctorProfile` → nothing.

### P3.1.8
- Files changed: none
- Summary: Ran `pytest tests/test_part1_availability.py::DoctorBookingConcurrencyTestCase` alone → 1 passed. Will verify in full suite in Phase 7.

### P3.1.9
- Files changed: `docs/part2-agent-notes.md`
- Summary: Removed stale "Phase 10 (partial)" section. Added "Errata (found in Part 3 review)" section listing DoctorModal defaults, missing role call-site inventory, and REDIS_URL check bug.

### P3.1 Gate Results:
- `grep -rnE "'1200'|\|\| 1200|allLocations\[0\]" doctors_hub/src` → nothing ✅
- `grep -rn "formatFacilityName" doctors_hub/src` → nothing ✅
- `grep -rnE "specialties\?\.\[0\]|'Specialist'" doctors_hub/src/views/DoctorProfile` → nothing ✅
- `npm run build` → built cleanly ✅
- `npm test` → 0 failures ✅
- `pytest` → 320 passed ✅

### P3.2.1
- Files changed: `docs/part3-rbac-callsites.md` (created)
- Summary: Created inventory table with 72 call sites classified as row scoping (is_facility_staff), facility admin (is_facility_admin), or platform-wide (is_super_admin). Zero UNCLEAR rows.

### P3.2.2
- Files changed: `doctors_hub_backend/core/visibility.py`, `core/permissions.py`, `core/scoping.py`, `bookings/views.py`, `doctors/views.py`
- Summary: Changed `is_facility_admin` to `is_facility_staff` at 10 row-scoping call sites (visibility, permissions, scoping, bookings views, doctors views).
- Commands: `pytest tests/test_rbac.py tests/test_staff_delegation.py tests/test_part3_rbac_callsites.py` → 42 passed.

### P3.2.3
- Files changed: `doctors_hub_backend/tests/test_part3_rbac_callsites.py` (created)
- Summary: 6 tests covering facility staff vs admin distinction, global role user properties, and is_admin_viewer behavior.
- Commands: `pytest tests/test_part3_rbac_callsites.py` → 6 passed.

### P3.2 Gate Results:
- `docs/part3-rbac-callsites.md` exists with 72 rows, 0 UNCLEAR ✅
- `pytest tests/test_rbac.py tests/test_staff_delegation.py tests/test_part3_rbac_callsites.py` → 42 passed ✅

### P3.3.2
- Files changed: `doctors_hub_backend/facilities/serializers_summary.py`, `doctors_hub_backend/doctors/serializers.py`
- Summary: Added `FacilityMiniSerializer` (id, slug, display_name, location_type, area, district, district_id). Added `ChamberLeanSerializer` (id, fee, chamber_type, is_active, facility, schedules, next_available). Added `DoctorListSerializer` with lean fields.

### P3.3.3
- Files changed: `doctors_hub_backend/doctors/views.py`
- Summary: Added `get_serializer_class` to `DoctorViewSet` returning `DoctorListSerializer` for `action == 'list'`. Retrieve/create/update keep `DoctorSerializer`.

### P3.3.4
- Files changed: `doctors_hub_backend/doctors/serializers.py`
- Summary: Removed `specialty_tags` from `DoctorSerializer`. Changed `specialties` to lean shape (id, slug, name, bn_name) ordered primary first. `primary_specialty` is now a method field returning lean shape.

### P3.3.5
- Files changed: `doctors_hub/src/views/DoctorSearch/components/DoctorCard.jsx`
- Summary: Updated to use `doctor.specialties` instead of `doctor.specialty_tags`, and `doctor.chambers` instead of `doctor.affiliations`. Removed fallback chain.

### P3.3.6
- Files changed: `doctors_hub_backend/doctors/views.py`
- Summary: Fixed `meta` computation to use existing `queryset` instead of calling `filter_queryset` again. Removed `tier1_count` and `tier2_count` from meta response.

### P3.3 Tests updated:
- `tests/test_doctor_creation.py`: Updated to use `chambers` instead of `affiliations`, removed `status` and `match_tier` assertions from list context.
- `tests/test_part2_quick_fixes.py`: Removed `match_tier` and `is_primary_match` assertions.
- `tests/test_specialty_canonical.py`: Updated `affiliations` → `chambers`, removed `tier1_count`/`tier2_count` assertions.
- `tests/test_specialty_taxonomy_v3.py`: Same updates plus `specialty_tags` → `specialties`.

### P3.3 Gate Results:
- `grep -rn "specialty_tags" doctors_hub/src doctors_hub_backend --include=*.py --include=*.js --include=*.jsx | grep -v migrations` → nothing ✅
- `npm run build` → built cleanly ✅
- `pytest` → 326 passed ✅

### P3.4.1
- Files changed: `doctors_hub_backend/core/views.py`, `doctors_hub/src/views/DoctorSearch/DoctorSearchPage.jsx`
- Summary: Removed `hospitals` and `diagnostic_centers` from search-metadata response. Used `FacilityMiniSerializer` for `facilities`. Updated DoctorSearchPage to use `meta.facilities` only.

### P3.5.2
- Files changed: `doctors_hub_backend/core/views.py`, `doctors_hub_backend/tests/serializers.py`
- Summary: Added `TestOptionSerializer` (id, name, code, category_id, category_name, is_active). Updated admin init to use `DoctorListSerializer` for doctors and `TestOptionSerializer` for tests.

### P3.6.1–P3.6.3
- Files changed: `doctors_hub_backend/core/settings.py`, `doctors_hub_backend/facilities/migrations/0021_enable_pg_trgm.py`, `doctors_hub_backend/facilities/migrations/0022_trgm_indexes.py`, `doctors_hub_backend/doctors/views.py`
- Summary: Added `django.contrib.postgres` to INSTALLED_APPS. Created pg_trgm extension migration. Created GIN trigram index migration for Doctor.name/bn_name/qualification, DoctorSpecialty.name/bn_name, Location.name/branch/address_line, Test.name/code, Thana.name/bn_name. Removed `about` from doctor search fields.
- Commands: `manage.py migrate` → OK. `pytest` → 326 passed.

### P3.7.1–P3.7.4
- Files changed: `docs/part3-baseline.md`, `docs/part3-api-changes.md`
- Summary: Updated baseline with "After" measurements. Created API changes doc. All gates pass.

---

## Final Summary

### What changed:
- **Phase 1**: Paginated locations, FacilityPicker component, removed DoctorModal fakes, fixed Redis check, removed formatFacilityName, fixed primary specialty display, cleaned Part 2 notes
- **Phase 2**: Role call-site inventory (72 sites classified), changed 10 row-scoping sites to `is_facility_staff`
- **Phase 3**: Lean doctor list serializer, single specialties field, lean chambers, single meta computation
- **Phase 4**: Metadata facilities once with mini shape
- **Phase 5**: Admin init with lean doctors and lean tests
- **Phase 6**: pg_trgm GIN indexes, removed `about` from search
- **Phase 7**: Final sweep, remeasurement, API docs

### Improvements:
- Doctor list: 49% smaller (103KB → 52KB)
- Doctor list (specialty): 54% smaller (115KB → 53KB)
- Search metadata: 43% smaller (165KB → 94KB)
- Locations: 72% smaller (62KB → 18KB), queries 214 → 2
- Admin init: 36% smaller (669KB → 425KB), queries 439 → 277

### Deviations:
- Phase 3 frontend: Updated `DoctorCard.jsx` to use `chambers` instead of `affiliations`. Other admin/detail contexts keep `affiliations` (detail serializer).
- Phase 3 tests: Updated existing tests to use `chambers` instead of `affiliations`, removed `match_tier`/`is_primary_match`/`tier1_count`/`tier2_count` assertions (contract changes).

### Open questions:
- None.
