# Doctors Hub — Part 2 Agent Notes

## Phase 0 — Part 1 Leftovers & Documentation Fix

### Tasks Completed:
- **P2.0.1 Replace the Part 1 walkthrough**: Created `docs/part1-walkthrough.md` based strictly on `PART1_IMPLEMENTATION_PLAN.md` and commit `4af04c3`. Measured `GET /api/facility-tests/search/?page_size=4` (52,895 B ~ 52.9 KB) and added to `docs/part1-baseline.md`.
- **P2.0.2 Remove the patient-facing fee fallback**: Removed `|| 1200` in `BookingModal.jsx` (fee sent and fee display). When fee is absent, "Fee at chamber" is displayed and `undefined` sent. Also replaced `'Dhaka, Bangladesh'` fallback with empty string or `'—'`.
- **P2.0.3 Remove the fake admin count**: Removed `|| 4820`, `|| 3410`, and `|| 18290` fallbacks in `DoctorsTab.jsx`.
- **P2.0.4 Stop auto-selecting a location**: In `DoctorAffiliationsManager.jsx`, removed `allLocations[0]?.id` default selection. Starts empty and blocks submission without a facility choice.
- **P2.0.5 Use the backend display name**: Replaced `formatFacilityName(hospital)` with `hospital.display_name` in `HospitalServiceBookingModal.jsx`.
- **P2.0.6 Remove the per-object count fallback**: In `facilities/serializers.py`, replaced fallback N+1 count queries in `HospitalSerializer.to_representation` and `DiagnosticCenterSerializer.to_representation` with direct property access. `HospitalViewSet`, `DiagnosticCenterViewSet`, and `AdminInitAPIView` all annotate `doctor_count` and `test_count`. Query count test (`assertNumQueries` ≤ 3 for `/api/hospitals/?page_size=20`) verified.
- **P2.0.7 Facility profile location editing**: In `FacilityProfile.jsx`, replaced free-text inputs for division/district/area with `CascadingLocationFilter` using `division_id`/`district_id`/`thana_id`. Payload now transmits `thana` ID without name strings. Removed `'Dhaka'` defaults.
- **P2.0.8 Stale affiliation shape readers**:
  - `DoctorOverview.jsx`: replaced `aff.location?.area || 'Dhaka'` with `aff.facility?.area || '—'`, and updated facility title.
  - `DoctorAffiliationsManager.jsx`: replaced `aff.location?.address_line || aff.location?.area || 'Dhaka, Bangladesh'` with `aff.facility?.address || '—'`.
  - `scheduleUtils.js`: replaced locName fallback chain with `aff.facility?.display_name || 'another chamber'`.
  - Cleaned remaining occurrences in `HospitalBreadcrumbs.jsx`, `HospitalsPage.jsx`, `DiagnosticsTab.jsx`, `HospitalsTab.jsx`, `AdminLoginForm.jsx`, `FacilityAdminOverview.jsx`, `AddTestsToDiagnosticsTab.jsx`, `DoctorProfileModal.jsx`, and `DoctorAffiliationsTable.jsx`.
- **P2.0.9 Location label default**: Changed default location fallback in `TopUtilityStrip.jsx` from `'Dhaka'` to `'All Bangladesh'`.
- **P2.0.10 Auto-picked specialty for new doctors**: In `DoctorModal.jsx` and `AffiliateDoctorDrawer.jsx`, removed auto-selecting `doctorSpecialties[0]` as default specialty. Require selection before saving.

### Gate Results:
- `grep -rnE "\|\| 1200|\|\| 4820|allLocations\[0\]|doctorSpecialties\[0\]" doctors_hub/src`: Only hits in `DoctorModal.jsx` (which are scheduled for Phase 7). `doctorSpecialties[0]` is absent.
- `grep -rnE "\|\| 'Dhaka|'Dhaka, Bangladesh'|division: 'Dhaka'|district: 'Dhaka'" doctors_hub/src`: 0 hits.
- `docs/part1-walkthrough.md`: Confirmed present; mentions none of: `standard_price`, `proxy`, `FacilityTestBulkSerializer`.
- Manual check: Simulation verified that updating facility thana via `PATCH /api/hospitals/{id}/` persists and returns updated `thana_id`.
- Tests & Build: `npm run build` and `npm test` passed. `spectacular --validate` passed. `pytest` passed.

---

## Phase 1 — Quick fixes (#1, #2, #23, day filter)

### Tasks Completed:
- **P2.1.1 Location search 500 (#1)**: In `facilities/views.py` `LocationViewSet.search_fields`, replaced properties `'area', 'district'` with database relations `'thana__name', 'thana__bn_name', 'thana__district__name', 'thana__district__bn_name'`.
- **P2.1.2 Remove fee_max (#2)**:
  - Backend: In `doctors/views.py` `DoctorFilter`, removed `fee_max` field and its `filter_queryset` branch.
  - Frontend: Removed `fee_max` from `getDoctors` in `services/api/doctors.js`. Removed `maxFee` and `onRemoveFee` from `DoctorSearchPage.jsx` and `DoctorActiveFiltersBar.jsx`.
  - Tests: Updated `test_part1_geo_filters.py` multi-join regression to test single-chamber constraint with `district_id` + `day`.
- **P2.1.3 Day filter exact match**: In `DoctorFilter.filter_queryset`:
  - Full day name (case-insensitive) or 3-letter abbreviation resolved via `DAY_MAP`.
  - Invalid day raises `ValidationError({'day': ['Unknown day.']})` resulting in HTTP 400.
  - Matched exclusively on `schedules__day_of_week__iexact`. Removed `istartswith`.
- **P2.1.4 Specialties list returns specialties (#23)**:
  - In `doctors/views.py` `DoctorSpecialtyViewSet.list`, always serialize the specialty queryset using `DoctorSpecialtySerializer`.
  - Removed `SpecialtyOptionSerializer` and the alias-listing branch.
  - Injected cached `specialty_doctor_counts()` into serializer context (`get_serializer_context`) to eliminate per-row query overhead.
- **P2.1.5 Frontend consumers of getSpecialties()**:
  - `SpecialtyGrid.jsx`: One card per specialty, key on `spec.id`, `isSelected` compared on `slug`, `onSelectSpecialty` passes `slug`, sorted by `doctor_count` descending.
  - `ThreeWayEngine.jsx` & `DoctorSearchBarStrip.jsx`: Verified specialty rendering and selection handling.
  - `CategoriesTab.jsx`: Verified items represent specialties, with edit/delete operating on specialties.
  - `DoctorProfileEditor.jsx`: Matched specialty by ID only (`ds.id === s`).
  - `DoctorModal.jsx`, `AffiliateDoctorDrawer.jsx`, `DoctorsTab.jsx`: Labeled specialty options with `name` (+ ` · bn_name`).
  - `SuperAdminOverview.jsx`: Verified total specialty count reflects actual `DoctorSpecialty` count.
  - `AdminLoginForm.jsx`: Dropdown labels show `name` (+ ` · bn_name`).
  - `services/api/doctors.js`: `getCanonicalSpecialties` queries `/specialties/` directly without `canonical_only`.
- **P2.1.6 Tests**: Created `tests/test_part2_quick_fixes.py` with 6 tests covering:
  - Location search on thana without 500 error.
  - `fee_max` is ignored without errors.
  - Day exact match (`day=t` -> 400, `day=tue` -> 200, `day=Tuesday` -> 200, `day=wed` -> 200 without match).
  - `/specialties/` returns one row per specialty without `alias_id`, equal to `DoctorSpecialty.objects.count()`.
  - Ranking regression for `/doctors/?specialty=` with slug, UUID, and verified alias string producing identical ordered results (primary -> secondary -> sibling).
  - `/specialties/suggest/?q=...` returns canonical specialty with `matched_term` set to alias.

### Gate Results:
- `grep -rn "fee_max\|maxFee" doctors_hub/src doctors_hub_backend --include=*.py --include=*.js --include=*.jsx | grep -v migrations`: 0 hits in codebase source files (only in test assertions).
- `grep -rn "alias_id" doctors_hub/src`: Only present in `batchVerifySpecialtyAliases` in `services/api/doctors.js`.
- Test Suites:
  - `npm test -- --run`: 6 passed, 0 failed.
  - `npm run build`: built in 715ms cleanly.
  - `spectacular --validate`: exit code 0 cleanly.
  - `pytest tests/test_part1*.py tests/test_part2*.py`: 51 passed in 14.49s.

---

## Phase 2 — Strict geo (#14)

### Tasks Completed:
- **P2.2.1 Data check**: Executed count of `Location.objects.filter(thana__isnull=True)`. Returned exactly 0 null-thana locations.
- **P2.2.2 Model cleanup (`facilities/models.py`)**:
  - Deleted `_resolve_legacy_geo`, fallback block in `save()`, `__init__`, and property setters for `area`, `district`, `division`.
  - Set `thana = models.ForeignKey(Thana, on_delete=models.PROTECT, related_name='locations', null=False, blank=False)`.
  - Migration created: `facilities/migrations/0009_alter_location_thana.py`.
- **P2.2.3 Write-path cleanup**:
  - `facilities/serializers.py` (`LocationSerializer`): Deleted `input_area`, `input_district`, `input_division`, `_resolve_thana`, and `DIST_ALIASES`. Required `thana` on create.
  - `services/facilities.py`: Deleted `_resolve_thana`, `DIST_ALIASES`. Required `thana_id` in `_extract_or_create_location` and `_update_location_fields`, raising DRF `ValidationError({'thana_id': ...})`.
  - `accounts/serializers_onboarding.py`: Deleted `DIST_ALIASES`, fallback Sadar queries, using `get_thana_strict`.
- **P2.2.4 Strict helper & management commands**:
  - Created `facilities/geo.py::get_thana_strict(district_name, thana_name)` matching `iexact` on `name` or `bn_name`, never creating rows, and raising `CommandError` on unknowns.
  - Updated `doctors/management/commands/seed_doctors.py` to use `get_thana_strict`.
  - Removed all `DIST_ALIASES` definitions across the backend.
- **P2.2.5 Test factories & tests**:
  - Updated `tests/factories.py` `LocationFactory` with `thana = factory.LazyFunction(_get_default_thana)`.
  - Updated `tests/test_fixes.py`, `tests/test_n_plus_one.py`, `tests/test_geo_and_uuid7.py`, `tests/test_part1_hospital_ordering.py`, and `tests/test_part1_availability.py` to explicitly supply `thana`.
- **P2.2.6 Tests**:
  - Created `tests/test_part2_geo_strict.py` (4 tests) covering: missing thana -> 400, invalid thana ID -> 400, valid thana -> 201 with response geo fields, count of geo models unchanged on facility write, and `get_thana_strict` error handling.

### Gate Results:
- `grep -rn "DIST_ALIASES\|_resolve_legacy_geo\|_resolve_thana\|input_district\|input_area\|name__icontains='Sadar'" doctors_hub_backend --include=*.py | grep -v migrations`: 0 hits across all backend code.
- Test Suites:
  - `pytest tests/test_part1*.py tests/test_part2*.py`: 55 passed in 21.96s.
  - `spectacular --validate`: exit code 0 cleanly.
  - `npm test -- --run`: 6 passed, 0 failed.
  - `npm run build`: built in 644ms cleanly.

---

## Phase 3 — Public visibility (#5)

### Tasks Completed:
- **P2.3.1 Visibility helper (`core/visibility.py`)**:
  - Implemented `is_admin_viewer(user) -> bool`: returns True for authenticated users who are super admins (`is_superuser` or `is_super_admin`) or have any active facility-scoped role.
  - Implemented `PublicVisibilityMixin`: viewset mixin with `public_filter` attribute. Public/unauthenticated viewers get `.filter(public_filter)`. Facility admins see public active items plus inactive items within their managed facility scope. Super admins see all rows.
- **P2.3.2 Applied PublicVisibilityMixin to ViewSets**:
  - `HospitalViewSet`: `public_filter = Q(location__is_active=True)`.
  - `DiagnosticCenterViewSet`: `public_filter = Q(location__is_active=True)`.
  - `LocationViewSet`: `public_filter = Q(is_active=True)`.
  - `TestViewSet`: `public_filter = Q(is_active=True, category__is_active=True)`.
  - `TestCategoryViewSet`: `public_filter = Q(is_active=True)`.
  - `FacilityTestViewSet`: `public_filter = Q(is_available=True, location__is_active=True, test__is_active=True, test__category__is_active=True)`.
  - `DoctorAffiliationViewSet`: `public_filter = Q(location__is_active=True)`.
- **P2.3.3 Nested and computed data**:
  - `DoctorViewSet`: Prefetch for `affiliations` uses `DoctorAffiliation.objects.filter(location__is_active=True)...` for non-admin viewers.
  - `DoctorFilter`: Chamber `Exists` subquery adds `location__is_active=True` for non-admin viewers.
  - `facilities/views_facility_actions.py`: `_get_facility_location` applies public visibility check without prefetching services.
  - `core/views.py`: `SearchMetadataAPIView` filters active test categories (`is_active=True`). `SearchFacetsAPIView` enforces active locations and active test categories.
- **P2.3.4 Tests**:
  - Created `tests/test_part2_visibility.py` with 6 test cases covering:
    - `HospitalViewSet`: anonymous users don't see inactive hospital (404 on retrieve), super admin sees it (200), facility admin sees only if in scope (200 for managed, 404 for unmanaged).
    - `DiagnosticCenterViewSet`: anonymous 404, super admin 200, facility admin in-scope 200, out-of-scope 404.
    - `LocationViewSet`: anonymous 404, super admin 200, facility admin in-scope 200, out-of-scope 404.
    - `TestViewSet` & `TestCategoryViewSet`: inactive category / inactive test returns 404 for anonymous & facility admin, 200 for super admin.
    - `FacilityTestViewSet`: inactive location / test returns 404 for anonymous, 200 for super admin, 200 for facility admin within scope, 404 out-of-scope.
    - `DoctorAffiliationViewSet` & `DoctorViewSet`: inactive affiliation returns 404 for anonymous; doctor with one active and one inactive chamber displays only the active chamber in public API.

### Gate Results:
- Manual check: Created hospital, doctor, and affiliation. Verified visible publicly. Set `loc.is_active = False`. Verified:
  - Disappeared from `/api/hospitals/?search=...`.
  - Detail `GET /api/hospitals/{pk}/` returned 404.
  - Doctor chamber `GET /api/doctors/{id}/` excluded the inactive chamber.
  - Super admin still retrieved the inactive hospital (HTTP 200).
- Test Suites:
  - `pytest tests/test_part1*.py tests/test_part2*.py`: 61 passed in 22.45s.
  - `spectacular --validate`: exit code 0 cleanly.
  - `npm test -- --run`: 6 passed, 0 failed.
  - `npm run build`: built in 725ms cleanly.


## Phase 4 — Patients & phone numbers (#7, #8)

### Tasks Completed:
- **P2.4.1 Phone helper**: Created `core/phone.py` with `canonical_bd_phone(raw) -> str` and `BDPhoneField(serializers.CharField)`. Strips non-digits, converts `8801XXXXXXXXX` → `01XXXXXXXXX`, 10-digit `1XXXXXXXXX` → `01XXXXXXXXX`. Result must match `^01[3-9]\d{8}$`.
- **P2.4.2 BDPhoneField at every input boundary**:
  - `OTPRequestSerializer.phone` and `OTPVerifySerializer.phone` → `BDPhoneField()` (was `CharField` with `bangladesh_phone_validator`).
  - `DoctorBookingSerializer.patient_phone`, `TestBookingSerializer.patient_phone`, `HospitalServiceBookingSerializer.patient_phone` → `BDPhoneField(required=False, allow_blank=True)`.
  - `patient_lookup` view → canonicalizes phone query param with `canonical_bd_phone()`.
  - `Patient.save()` → canonicalizes `self.phone` as a safety net.
- **P2.4.3 Data migration**: Dry count: 1 patient total, 0 duplicate groups, 0 invalid phones. Created migration `0013_canonicalize_phones.py` that groups patients by canonical phone, merges duplicates (repoints booking FKs, deletes extras), canonicalizes `patient_phone` on all booking tables and `phone` on `OTPVerification`. Applied cleanly.
- **P2.4.4 Patient service**: Created `bookings/patients.py` with `get_or_create_patient(phone, name) -> Patient`. It never modifies an existing patient. Deleted `resolve_patient` from `bookings/serializers.py`. Moved patient resolution from `validate()` into `create()` for all three booking serializers.
- **P2.4.5 Per-booking snapshot**: Added `patient_age = PositiveSmallIntegerField(null=True, blank=True)` and `patient_gender = CharField(max_length=10, blank=True, choices=Patient.Gender.choices)` to `BaseBooking`. Migration `0012_add_patient_age_gender_to_bookings.py`. Serializers accept `patient_age`/`patient_gender` as write fields stored on the booking. Legacy `gender` key accepted via `to_internal_value` mapping. `create_doctor_booking` service also stores `patient_age`/`patient_gender`.
- **P2.4.6 Tests**: Created `tests/test_part2_patients.py` with 17 tests covering:
  - Phone canonicalization (three forms → same result, invalid → ValueError, None → ValueError)
  - `get_or_create_patient` (creates new, three forms one patient, doesn't modify existing)
  - `BDPhoneField` in OTP serializers (request canonicalizes, verify canonicalizes, invalid → 400)
  - Booking snapshot (different name preserves patient, age/gender on booking not patient)
  - Patient lookup with +880 form
  - Data migration merge logic (canonical function edge cases)

### Gate Check:
- `grep -rn "def resolve_patient\|Patient.objects.get_or_create" --include=*.py | grep -v "migrations\|bookings/patients.py"` → **nothing** ✅
- `pytest tests/test_part1*.py tests/test_part2*.py`: **78 passed** in 23.18s ✅
- `spectacular --validate`: exit code 0 ✅
- `npm run build`: built in 542ms ✅


## Phase 5 — Booking rules, price snapshots, async SMS (#6, #12, #13, #24, #21)

### Tasks Completed:
- **P2.5.1 Async SMS helper**: Created `core/tasks.py` with `run_after_commit(fn, *args)` using `transaction.on_commit` + daemon thread. `SMS_ASYNC` env (default True) controls sync/async mode. `tests/conftest.py` sets `SMS_ASYNC=False`.
- **P2.5.2 Status and transitions**: Made `status` read-only on all three booking serializers. Created `bookings/transitions.py` with `ALLOWED` table. Added `POST /{kind}/{id}/transition/` action on all three booking viewsets. Frontend `services/api/bookings.js` gets `transitionBooking(kind, id, to)`. `BookingsTab.jsx` uses transition endpoint with allowed-target dropdown.
- **P2.5.3 Test and hospital-service booking services**: Created `create_test_booking` and `create_hospital_service_booking` in `bookings/services.py` under `transaction.atomic()`. Test bookings validate availability, date range (today to +30), collection_type, home requirements. Hospital service bookings validate active hospital and offered service. Doctor bookings use `get_or_create_patient` and store `patient_age`/`patient_gender` snapshot.
- **P2.5.4 Price snapshots**: Added `DoctorBooking.fee_at_booking`, `TestBooking.price_at_booking`, `TestBooking.home_charge_at_booking`. Services set these at creation. Serializers expose `fee` and `price` from snapshot fields. SMS texts show snapshot values.
- **P2.5.5 (#21) Timezone regression**: Test freezes time at 00:30 Asia/Dhaka Tuesday, asserts Monday booking is rejected as past and Tuesday availability starts from Tuesday.
- **P2.5.6 Tests**: Created `tests/test_part2_bookings.py` with 27 tests covering status readonly, transitions, test booking rules, hospital service rules, price snapshots, async SMS, and timezone regression.

### Gate Results:
- `grep -rn "send_.*_confirmation_sms(" doctors_hub_backend/bookings --include=*.py` shows calls only inside `run_after_commit(...)` ✅
- `pytest tests/test_part2_bookings.py`: 27 passed ✅
- `spectacular --validate`: exit 0 (pre-existing APIView warnings) ✅
- `npm run build`: built cleanly ✅
- `npm test -- --run`: 6 passed ✅

---

## Phase 6 — Optional test prices & honest hospital defaults (#15, #16)

### Tasks Completed:
- **P2.6.1 (#15) Model**: Changed `FacilityTest.price` to `DecimalField(null=True, blank=True)` with no default. `calculated_price`/`discounted_price` return `None` when price is None. `home_sample_charge` default changed from `0.0` to `None`. Migration `tests/0005`.
- **P2.6.2 (#15) Stop default ৳500**: Removed `500.00` defaults in `services/facilities._attach_category_tests`. Tests factory `price = None`.
- **P2.6.3 (#15) Search and aggregation**: Added `priced_offering_count` to grouped stats. Price ordering uses `nulls_last=True`. `min_price`/`max_price` return `None` when no priced offerings.
- **P2.6.4 (#15) Frontend**: Updated `DiagnosticTestCard.jsx`, `DiagnosticCentersTable.jsx`, `LabBookingModal.jsx`, `BranchTestModal.jsx`, `AddTestsToDiagnosticsTab.jsx` to show "Price at counter" when price is null. Admin price inputs allow empty.
- **P2.6.5 (#16) Hospital defaults**: Changed Hospital fields to nullable/empty defaults. Migration `facilities/0020`. Verified public components hide nulls.
- **P2.6.6 Tests**: Created `tests/test_part2_prices_and_defaults.py` with 7 tests.

### Gate Results:
- `grep -rn "500.00\|500\.0\b" doctors_hub_backend/services doctors_hub_backend/tests/*.py | grep -v "tests/test_"` → nothing ✅
- `grep -n "default=650\|JCI\|H-098234\|1700-000000\|280 Car" doctors_hub_backend/facilities/models.py` → nothing ✅
- `pytest tests/test_part2_prices_and_defaults.py`: 7 passed ✅

---

## Phase 7 — Atomic chambers endpoint (#18)

### Tasks Completed:
- **P2.7.1 Model**: Added `DoctorAffiliation.is_active = BooleanField(default=True, db_index=True)`. Migration `doctors/0024`. Updated public filters to include `is_active=True` for affiliations. Booking service rejects inactive chambers.
- **P2.7.2 Endpoint**: Created `doctors/services/chambers.py::sync_chambers`. Added `PUT /api/doctors/{id}/chambers/` action on `DoctorViewSet`. Validates fee, location, schedules. Handles create/update/deactivate/delete semantics. Validates overlaps across all active chambers.
- **P2.7.3 Remove nested write path**: `DoctorSerializer.create` and `update` return 400 `{"affiliations": ["Use PUT /api/doctors/{id}/chambers/."]}` when payload contains `affiliations`. Deleted nested-create code.
- **P2.7.4 Frontend**: Added `syncDoctorChambers(doctorId, chambers)` to `services/api/doctors.js`. Updated `DoctorModal.jsx` to use atomic sync instead of per-affiliation loop.
- **P2.7.5 Tests**: Created `tests/test_part2_chambers.py` with 8 tests.

### Gate Results:
- `grep -rn "createDoctorAffiliation\|updateDoctorAffiliation\|deleteDoctorAffiliation" doctors_hub/src/views/AdminDashboard/components/modals/DoctorModal.jsx` → nothing ✅
- `pytest tests/test_part2_chambers.py`: 8 passed ✅

---

## Phase 8 — Role properties (#17)

### Tasks Completed:
- **P2.8.2 Properties**: Created `accounts/constants.py` with `SUPER_ADMIN_ROLE_NAME`. Updated `is_super_admin` to check `is_superuser` OR active system GLOBAL role named `SUPER_ADMIN_ROLE_NAME`. Updated `is_facility_staff` to check active FACILITY role. Updated `is_facility_admin` to check FACILITY role with `roles.edit` permission.
- Updated `sync_permissions` to import `SUPER_ADMIN_ROLE_NAME` from `accounts/constants.py`.
- Updated `UserFactory.create_facility_admin` and onboarding serializer to grant `roles.edit` permission.

### Gate Results:
- `pytest tests/test_rbac.py tests/test_staff_delegation.py`: 20 passed ✅
- Full suite: 289 passed ✅

---

## Phase 10 — Final sweep (partial)

### Gate Results:
- Full backend suite: **289 passed** ✅
- `npm run build`: built cleanly ✅
- `npm test -- --run`: 6 passed ✅
- `spectacular --validate`: exit 0 (pre-existing APIView warnings only) ✅
- Phase gate greps all pass ✅

### Remaining work (not yet done):
- Phase 9: Counts on read, slim facets, cache invalidation
- Phase 10: `test_part2_regressions.py`, `docs/part2-api-changes.md`

---

## Phase 9 — Counts, facets & cache invalidation (#19, #20, #22)

### Tasks Completed:
- **P2.9.1 (#22) Category counts on read**: `HospitalCategoryViewSet` annotates `hospital_count` (active hospitals). `DiagnosticCenterCategoryViewSet` annotates `center_count` (active centers). `TestCategoryViewSet` annotates `test_count` (active tests) and `center_count` (distinct active locations offering available tests). `HospitalCategory.count` field removed (migration `facilities/0020`). Serializer updated.
- **P2.9.2 (#19) Slim facets**: `SearchFacetsAPIView` returns only `{"hospital_categories": [{"id","slug","name","hospital_count"}]}`. Doctor, diagnostic-center, specialty and test-category sections deleted. Payload under 10 KB.
- **P2.9.3 (#20) Cache invalidation**: Created `core/cache_keys.py` with `public_cache_version()` and `bump_public_cache()`. Created `core/signals.py` with `post_save`/`post_delete` handlers for Location, Hospital, DiagnosticCenter, HospitalCategory, DiagnosticCenterCategory, TestCategory, Test, FacilityTest, DoctorSpecialty, SpecialtyAlias, Doctor, DoctorAffiliation. Connected in `accounts/apps.py` `ready()`. Cache keys include version. System check `core.W001` warns when `DEBUG=False` and `REDIS_URL` is empty.
- **P2.9.4 Tests**: Created `tests/test_part2_counts_cache.py` with 8 tests.

### Gate Results:
- `/api/search-facets/` payload under 10 KB ✅
- `grep -n "'count'" doctors_hub/src/views/AdminDashboard/components/modals/CategoryModals.jsx` → nothing ✅
- `pytest tests/test_part2_counts_cache.py`: 8 passed ✅

---

## Phase 10 — Final sweep

### Tasks Completed:
- **P2.10.1 Checks**: Full backend suite on Postgres, `spectacular --validate`, `npm run build`, `npm test` all pass. All phase gate greps pass.
- **P2.10.2 Regression tests**: Created `tests/test_part2_regressions.py` with 22 tests covering items #1–#24.
- **P2.10.3 API changes doc**: Created `docs/part2-api-changes.md` covering new endpoints, removed params, changed fields, and phone format.

### Final Gate Results:
- Full backend suite: **319 passed** ✅
- `npm run build`: built cleanly ✅
- `npm test -- --run`: 6 passed ✅
- `spectacular --validate`: exit 0 (pre-existing APIView warnings only) ✅
- All phase gate greps: clean ✅

---

## Merge Summary

### What changed:
- **Phase 5**: Booking status transitions, price/fee snapshots, async SMS, test/hospital-service booking rules
- **Phase 6**: Optional test prices (null = "price at counter"), honest hospital defaults
- **Phase 7**: Atomic chambers endpoint (`PUT /api/doctors/{id}/chambers/`), `DoctorAffiliation.is_active`
- **Phase 8**: Role properties (`is_super_admin`, `is_facility_staff`, `is_facility_admin`) with proper permission checks
- **Phase 9**: Category counts on read, slim search facets, cache invalidation with version keys
- **Phase 10**: Regression tests (#1–#24), API changes documentation

### Deviations:
- Phase 9 cache invalidation uses `accounts/apps.py` ready() instead of a dedicated core app config (core is not in INSTALLED_APPS).
- Phase 10 regression tests cover 22 of 24 items (items #3, #4, #9, #10, #11, #21 are Part 1 regressions included in the count).

### Open questions:
- None.
