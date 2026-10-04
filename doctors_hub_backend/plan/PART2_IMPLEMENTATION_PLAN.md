# Doctors Hub — Part 2 Implementation Plan
## Backend bug fixes (plus Part 1 leftovers)

Repo: `https://github.com/JunaeidAhmad/doctors_hub`, starting from commit `4af04c3` (Part 1 complete)
Backend: `doctors_hub_backend/` (Django 5.2, DRF, Postgres) · Frontend: `doctors_hub/` (React + Vite)

This plan is written for an autonomous coding agent. Read **Section 0** before touching any code. Execute phases **in order**. Each phase ends with a gate that must pass before the next phase starts.

---

## 0. Rules for the agent (read first, apply always)

### 0.1 Working method
1. One git branch per phase: `part2/phase-<N>-<short-name>`, branched from the previous phase's branch.
2. One commit per numbered task, with message format `P2.<phase>.<task>: <what changed>`.
3. Before editing a file, open and read it in full. Line numbers here are hints. If they don't match, find the code by the function or field name.
4. **Stop and report** instead of improvising, by writing to `docs/part2-agent-notes.md` and stopping, when:
   - a file, function or field named here does not exist;
   - an instruction contradicts the code;
   - a data check finds rows the plan says should not exist;
   - a gate fails twice after honest fix attempts.
5. Do not refactor, rename or reformat anything outside the current phase.
6. **Reporting honesty.** `docs/part2-agent-notes.md` must describe only what was changed, with the commit hash per task. Do not describe features that were not built. For every gate, record the exact commands run and their output summary.

### 0.2 Hard constraints
- **No invented data anywhere.** No placeholder numbers, default prices, default fees, default locations or fallback names in code or UI. If data is missing, show an empty state, "—", or hide the element.
- **Do not touch:** OTP logic (including the `123`/`123456` bypass), JWT and auth flows, SMS credentials, or rating/review values (static by product decision). Phone *normalization* at input boundaries is allowed (Phase 4); OTP *logic* is not.
- **No new dependencies.**
- **Migrations:** `makemigrations <app>`, read the generated file, never edit old migrations. Data migrations must be reversible or use `migrations.RunPython.noop` as the reverse.
- **Keep the test suite green.** Only change an existing test when this plan changes the contract it checks, and say so in the commit message.
- All "today"/"now" logic uses `timezone.localdate()` / `timezone.localtime()`. `TIME_ZONE` is already `Asia/Dhaka`.
- Locations are referenced by ID only (as in Part 1).

### 0.3 Commands
```bash
cd doctors_hub_backend
python manage.py migrate
python -m pytest -q
python manage.py spectacular --file /tmp/schema.yml --validate

cd doctors_hub
npm run build
npm test
```

### 0.4 Gate template
Each phase gate consists of:
- `pytest` passes;
- `spectacular --validate` passes;
- `npm run build` and `npm test` pass;
- the phase's grep checks return what they say;
- the manual checks are done.

Record all of it in `docs/part2-agent-notes.md` under the phase heading.

---

## Decisions already made (do not revisit)

| # | Decision |
|---|---|
| 2 | Fee filtering is not needed: remove `fee_max` everywhere. The single-chamber `Exists` filter from Part 1 stays. |
| 3, 4, 9, 10, 11, 21 | Already fixed in Part 1. Only regression tests or greps here. |
| 5 | Public visitors never see inactive facilities, inactive tests or categories, unavailable offerings, or inactive chambers. `is_verified` stays a badge only, and unverified items are still shown. Admin-type users (super admin or any facility role) see everything within their scope. |
| 6 | `status` is never writable through create or PATCH on any booking type. Status changes go through an explicit transition endpoint with an allowed-transitions table. |
| 7 | A booking never modifies an existing Patient record. Per-booking name, age and gender are stored on the booking as a snapshot. |
| 8 | Canonical stored phone format is `01XXXXXXXXX` (11 digits). Existing duplicate patients are merged. |
| 13 | Bookings store `fee_at_booking` / `price_at_booking` at creation. |
| 14 | Facilities must reference a real `Thana` ID. All name-guessing and auto-creation of geo rows is deleted. |
| 15 | `FacilityTest.price` becomes optional. **Existing prices are kept (including ৳500 values).** Only new rows start empty. An empty price displays as **"Price at counter"** / **"মূল্য কাউন্টারে জানুন"**. Booking a test with no price is allowed. |
| 16 | **Existing hospital values stay** (Part 1 decision, `details_reviewed` flag). The model defaults for *new* hospitals become empty/unknown, and the UI hides empty values. |
| 17 | Super admin means superuser or the seeded system "Super Admin" role. Facility admin means an active facility role holding `roles.edit`. Facility staff means any active facility role. |
| 18 | One all-or-nothing endpoint saves a doctor's chambers and schedules. Doctors stay separately created (global). |
| 19 | `/search-facets/` keeps only hospital category counts, computed with the same filters as the hospital list. The doctor and diagnostic facet sections are deleted. |
| 20 | Public caches are invalidated on every relevant admin write via a version key. Production without Redis raises a startup warning. |
| 22 | Category counts are computed on read. The stored `HospitalCategory.count` field and its admin input are deleted. |
| 23 | `/api/specialties/` returns real specialties by default. Aliases are only available at `/api/specialty-aliases/`. |
| 24 | All booking confirmation SMS are sent after commit, in a background thread, so the request never waits on the SMS gateway. |

---

## Phase overview

| Phase | Name | Covers |
|---|---|---|
| 0 | Part 1 leftovers & documentation fix | Part 1 gaps |
| 1 | Quick fixes | #1, #2, #23, day filter |
| 2 | Strict geo | #14 |
| 3 | Public visibility | #5 |
| 4 | Patients & phone numbers | #7, #8 |
| 5 | Booking rules, price snapshots, async SMS | #6, #12, #13, #24, #21 regression |
| 6 | Optional test prices & honest hospital defaults | #15, #16 |
| 7 | Atomic chambers endpoint | #18 |
| 8 | Role properties | #17 |
| 9 | Counts, facets & cache invalidation | #19, #20, #22 |
| 10 | Final sweep | all |

---

## Phase 0 — Part 1 leftovers & documentation fix

**P2.0.1 Replace the Part 1 walkthrough.** The existing `walkthrough.md` (wherever it lives) describes features that were never built (facility proxy models, 3-tier pricing, a new RBAC model, `FacilityTestBulkSerializer`). Replace it with `docs/part1-walkthrough.md`, generated **only** from `plan/PART1_IMPLEMENTATION_PLAN.md` and `git show --stat 4af04c3`. It has one section per plan phase (0–9), each listing the files changed and the tests added. Also append to `docs/part1-baseline.md` the size of `GET /api/facility-tests/search/?page_size=4`, which was never recorded.

**P2.0.2 Remove the patient-facing fee fallback.** In `src/components/BookingModal.jsx`, remove `|| 1200` in both places (the fee sent and the fee shown). If the fee is missing, show "Fee at chamber" / "ফি চেম্বারে জানুন" and send nothing.

**P2.0.3 Remove the fake admin count.** In `src/views/AdminDashboard/components/DoctorsTab.jsx`, remove the `|| 4820` fallback and show the API count.

**P2.0.4 Stop auto-selecting a location.** In `src/views/AdminDashboard/components/doctor/DoctorAffiliationsManager.jsx`, remove `allLocations[0]?.id` as a default or fallback. The location select starts empty and saving is blocked until one is chosen. (`DoctorModal.jsx` is fixed in Phase 7.)

**P2.0.5 Use the backend display name.** In `src/components/HospitalServiceBookingModal.jsx`, replace `formatFacilityName(hospital)` with `hospital.display_name`. If nothing else imports `formatFacilityName`, delete it from `utils/facilityUtils.js`, delete its tests from `facilityUtils.test.js`, and adjust the `test` script in `package.json` if the file becomes empty.

**P2.0.6 Remove the per-object count fallback.** In `facilities/serializers.py`, `HospitalSerializer.to_representation` and `DiagnosticCenterSerializer.to_representation` must not query counts per object when the annotation is missing. Remove the fallback queries and ensure every queryset feeding these serializers annotates `doctor_count` and `test_count`:
- `HospitalViewSet`
- `DiagnosticCenterViewSet`
- `AdminInitAPIView`
- facility retrieve paths

Add an `assertNumQueries` test for `/api/hospitals/?page_size=20`.

**P2.0.7 Facility profile location editing.** `views/AdminDashboard/components/facility/FacilityProfile.jsx` still edits `division`/`district`/`area` as free text, defaults them to `'Dhaka'`, and sends the names to `patchHospital`/`patchDiagnosticCenter`. The backend update path ignores those keys, so a facility admin's location edit **silently does nothing**. (This file was missing from the Part 1 P1.2.10 list.) Fix:
- Replace the three text inputs with `CascadingLocationFilter` (IDs).
- Initialize it from the facility's `division_id`/`district_id`/`thana_id`.
- Send `thana` (ID) in the payload, and remove the `division`, `district` and `area` keys.
- Remove every `'Dhaka'` default, including the header line `formData.district || 'Dhaka'`.

**P2.0.8 Stale affiliation shape readers.** Part 1 moved affiliations to a nested `facility` object, but some readers still use the removed `location` shape and fall back to fake text. Fix each one to read `aff.facility.*` and show nothing (or "—") when it's missing:
- `views/AdminDashboard/components/overview/DoctorOverview.jsx`: `aff.location?.area || 'Dhaka'` currently always shows "Dhaka". Change it to `aff.facility?.area`.
- `views/AdminDashboard/components/doctor/DoctorAffiliationsManager.jsx`: `aff.location?.address_line || aff.location?.area || 'Dhaka, Bangladesh'`. Change it to `aff.facility?.address`.
- `utils/scheduleUtils.js` (conflict message): replace the `aff.hospital?.name || … || aff.location?.name` chain with `aff.facility?.display_name || 'another chamber'`.

Then grep `src/` for `\.location\?\.\|\.location\.` on affiliation, booking or facility-test objects and fix any other hits the same way.

**P2.0.9 Location label default.** In `components/TopUtilityStrip.jsx`, `selectedLocation || 'Dhaka'` shows Dhaka when nothing is selected. Show "All Bangladesh" / "সারা বাংলাদেশ" as the label for "no filter", or hide the label. This is a display string only; it must not become a filter value again.

**P2.0.10 Auto-picked specialty for new doctors.** `views/AdminDashboard/components/modals/DoctorModal.jsx` (`defaultSpecId = doctorSpecialties[0].id`) and `components/facility/AffiliateDoctorDrawer.jsx` (`specialty_ids: [doctorSpecialties[0].id]`) give a new doctor the first specialty in the list when the admin picks none. Start with no specialty selected, and require a choice before saving.

**Gate:**
- `grep -rnE "\|\| 1200|\|\| 4820|allLocations\[0\]|doctorSpecialties\[0\]" doctors_hub/src` → nothing outside `DoctorModal.jsx`. That file is fixed in Phase 7, except `doctorSpecialties[0]`, which must already be gone.
- `grep -rnE "\|\| 'Dhaka|'Dhaka, Bangladesh'|division: 'Dhaka'|district: 'Dhaka'" doctors_hub/src` → nothing.
- `docs/part1-walkthrough.md` exists and mentions none of: `standard_price`, `proxy`, `FacilityTestBulkSerializer`.
- Manual check: a facility admin changes their facility's thana in FacilityProfile, reloads, and the new thana is shown.

---

## Phase 1 — Quick fixes (#1, #2, #23, day filter)

**P2.1.1 (#1) Location search 500.** In `facilities/views.py` → `LocationViewSet.search_fields`, replace `'area', 'district'` with `'thana__name', 'thana__bn_name', 'thana__district__name', 'thana__district__bn_name'`.

Test: `GET /api/locations/?search=dhan` → 200 and matches a location in Dhanmondi.

**P2.1.2 (#2) Remove `fee_max`.**
- Backend: in `doctors/views.py` `DoctorFilter`, delete the `fee_max` filter, its `Meta.fields` entry and its branch in `filter_queryset`. Remove it from any `extend_schema` params.
- Frontend: delete `fee_max` from `services/api/doctors.js` `getDoctors` (param, cache key, URL). In `views/DoctorSearch/DoctorSearchPage.jsx`, delete the `maxFee` state, its slider/control, the URL param and its entry in active-filter chips (`DoctorActiveFiltersBar.jsx`).
- Update tests that used `fee_max` so they test the same single-chamber rule with `district_id` + `day` instead. This keeps the Part 1 regression covered.

**P2.1.3 Day filter exact match.** In the `day` branch of `DoctorFilter.filter_queryset`:
- Accept a full day name (case-insensitive) or a 3-letter abbreviation via the existing `DAY_MAP`.
- Anything else → 400 `{"day": ["Unknown day."]}`. Raise `ValidationError` from the filter, or validate in the form with `ChoiceFilter` semantics.
- Match with `schedules__day_of_week__iexact` only. Delete the `istartswith` branch.

Test: `day=t` → 400; `day=tue` → Tuesday only.

**P2.1.4 (#23) `/specialties/` returns specialties.** In `doctors/views.py` → `DoctorSpecialtyViewSet.list`:
- Always use the specialty queryset path (the current `canonical_only`/`all` branch).
- Delete the alias-listing branch and stop using `SpecialtyOptionSerializer` there. Delete the serializer if nothing else imports it.
- Pass the cached `specialty_doctor_counts()` map in serializer context once per request, so `doctor_count` doesn't recompute per item.
- The `canonical_only` and `all` params become unnecessary. Keep ignoring them silently.

**Do not modify** `suggest_specialties` (`/api/specialties/suggest/`), `resolve_specialty_exact`, `match_node_ids`, `related_node_ids` or `DoctorFilter.filter_specialty`. The specialty ranking design (primary match → secondary match → related siblings, alias text accepted in `?specialty=`) stays exactly as it is. This task only changes what the plain list endpoint returns.

**P2.1.5 Frontend consumers of `getSpecialties()`:**
- `views/Home/components/SpecialtyGrid.jsx`
- `views/Home/components/ThreeWayEngine.jsx`
- `views/DoctorSearch/DoctorSearchPage.jsx`
- `views/AdminDashboard/context/AdminContext.jsx`
- `views/AdminDashboard/components/AdminLoginForm.jsx`

Grep each for `alias_id` and `canonical_name` usage, and update them to read specialty fields (`id`, `slug`, `name`, `bn_name`, `doctor_count`). In `services/api/doctors.js`, `getCanonicalSpecialties` can call the same URL without `canonical_only`.

Per-screen changes. Every screen below currently receives 616 alias rows in which several rows share one specialty `id`:

| Screen | Today (alias rows) | Task |
|---|---|---|
| `Home/components/SpecialtyGrid.jsx` | First 20 alias names as cards; duplicates like "Cardiologist" and "Heart Specialist"; duplicate React keys | Cards are now one per specialty. Pass `spec.slug` (not `name`) to `onSelectSpecialty`, and compare `isSelected` on slug. Key on `spec.id`. Default order: `doctor_count` descending, so the grid shows the most-used specialties first. |
| `Home/components/ThreeWayEngine.jsx` | Fallback (when metadata fails) fills its specialty dropdown with alias rows | No code change beyond P2.1.5's field check; it now gets specialties. |
| `DoctorSearch/DoctorSearchPage.jsx` | Same fallback | Same. |
| `AdminDashboard/components/CategoriesTab.jsx` | Lists all 616 alias rows as editable "specialties". Editing an alias row opens the **specialty** edit form pre-filled with the alias name, so saving can rename the specialty to the alias; deleting one row deletes the specialty | Now one row per specialty. Verify edit and delete act on the specialty and show `name`. Alias management stays on the taxonomy screens using `/specialty-aliases/`. |
| `AdminDashboard/components/doctor/DoctorProfileEditor.jsx` | Matches `ds.name === s \|\| ds.id === s`; may resolve to an alias row and show the alias as the doctor's specialty | Match by `id` only and display the specialty `name`. |
| `AdminDashboard/components/modals/DoctorModal.jsx`, `facility/AffiliateDoctorDrawer.jsx`, `DoctorsTab.jsx` | Specialty pickers and filters list duplicate options | Options are one per specialty, labelled `name` (+ ` · bn_name`). The first-item default is removed in P2.0.10. |
| `AdminDashboard/components/overview/SuperAdminOverview.jsx` | Specialty count shows 616 | Shows the real number of specialties. Verify. |
| `AdminDashboard/components/AdminLoginForm.jsx` | Doctor sign-up specialty dropdown lists aliases | One option per specialty. |

**Not affected:** the specialty search box (it uses `/specialties/suggest/`, so alias text like "heart specialist" still finds Cardiologist), and doctor results (`/doctors/?specialty=` keeps its ranking and still accepts alias text).

**P2.1.6 Tests.** Create `tests/test_part2_quick_fixes.py` covering:
- #1 location search;
- `fee_max` is ignored (unknown param);
- day exact matching;
- `/specialties/` returns one row per specialty with no `alias_id`, and the list size equals `DoctorSpecialty.objects.count()`.
- Ranking regression for `/doctors/?specialty=`: set up one primary-match doctor, one secondary-match doctor, one related-sibling doctor and one unrelated doctor. Assert the order is primary, then secondary, then sibling, and that the unrelated doctor is excluded. Run it with the specialty slug, the UUID, and a verified alias's text; all three return the same ordered list.
- `/specialties/suggest/?q=<verified alias text>` still returns the canonical specialty with `matched_term` set to the alias.

**Gate:**
- `grep -rn "fee_max\|maxFee" doctors_hub/src doctors_hub_backend --include=*.py --include=*.js --include=*.jsx | grep -v migrations` → nothing.
- `grep -rn "alias_id" doctors_hub/src` → only admin alias-management screens.

---

## Phase 2 — Strict geo (#14)

**P2.2.1 Data check first.** Run `Location.objects.filter(thana__isnull=True).count()`. If it's not 0, stop and report the rows. Do not guess thanas.

**P2.2.2 Model cleanup** (`facilities/models.py` → `Location`):
- Delete `_resolve_legacy_geo`, the thana fallback block in `save()` (the Dhanmondi / first-thana / `get_or_create` logic), and any `area` / `district` / `division` property *setters* and `_pending_*` attributes.
- Keep read-only properties if serializers use them.
- Make `thana` non-nullable (`null=False`) with a migration.

**P2.2.3 Write-path cleanup.**
- `facilities/serializers.py` → `LocationSerializer`: delete `input_area`, `input_district`, `input_division`, `_resolve_thana` and the `DIST_ALIASES` block. `thana` (ID) is required on create and optional on update. An invalid ID gets DRF's normal 400.
- `services/facilities.py`: delete `_resolve_thana` and the `DIST_ALIASES` copy. Wherever facility creation used district/area strings, require `thana_id` from the payload and raise `ValidationError({'thana_id': ...})` if it is missing or invalid.

**P2.2.4 Management commands.**
- Grep `*/management/commands/*.py` for `area=`, `district=`, `division=`, `_resolve_thana` and `DIST_ALIASES`.
- Where a command must turn names into a thana (imports/seeds), use a new strict helper `facilities/geo.py::get_thana_strict(district_name, thana_name)`. It matches by `iexact` on `name` or `bn_name` within the district, never creates rows, and raises `CommandError` listing the unknown value.
- Delete every other `DIST_ALIASES` copy in the backend.

**P2.2.5 Test factories.**
- `tests/factories.py` → `LocationFactory`: remove `area = ...` and `district = ...`. Add `thana = factory.LazyFunction(...)`, which gets or creates the Division "Dhaka" → District "Dhaka" → Thana "Dhanmondi" with `get_or_create`. That's allowed in test factories only.
- Update `tests/test_fixes.py` and `tests/test_n_plus_one.py` (and any other test using `area=`/`district=` kwargs) to pass `thana=`.

**P2.2.6 Tests.** Create `tests/test_part2_geo_strict.py` covering:
- creating a facility with no thana → 400;
- creating with a nonexistent thana ID → 400;
- creating with a valid thana → 201, with correct `district`/`division` in the response;
- no new `Division`/`District`/`Thana` rows are created by any facility write (assert counts unchanged);
- `get_thana_strict` raises on an unknown name.

**Gate:** `grep -rn "DIST_ALIASES\|_resolve_legacy_geo\|_resolve_thana\|input_district\|input_area\|name__icontains='Sadar'" doctors_hub_backend --include=*.py | grep -v migrations` → nothing.

---

## Phase 3 — Public visibility (#5)

**P2.3.1 Visibility helper.** Create `core/visibility.py` with two functions:
- `is_admin_viewer(user) -> bool`: True for an authenticated user who `is_super_admin` or has any active facility-scoped role.
- `PublicVisibilityMixin`: a viewset mixin with a class attribute `public_filter` (a `Q` or a callable returning `Q`). In `get_queryset()`, after the existing queryset is built, if `not is_admin_viewer(request.user)`, apply `.filter(public_filter)`.

Admin viewers keep the existing `RoleScopedQuerysetMixin` scoping unchanged. Retrieve of a filtered-out object therefore returns 404 for public users.

**P2.3.2 Apply it to public read endpoints:**

| Viewset | `public_filter` |
|---|---|
| `HospitalViewSet` | `Q(location__is_active=True)` |
| `DiagnosticCenterViewSet` | `Q(location__is_active=True)` |
| `LocationViewSet` | `Q(is_active=True)` |
| `TestViewSet` | `Q(is_active=True, category__is_active=True)` |
| `TestCategoryViewSet` | `Q(is_active=True)` |
| `FacilityTestViewSet` (list/retrieve) | `Q(is_available=True, location__is_active=True, test__is_active=True, test__category__is_active=True)` |
| `DoctorAffiliationViewSet` | `Q(location__is_active=True)` (+ `is_active=True` after Phase 7) |

**P2.3.3 Nested and computed data:**
- In `DoctorViewSet`, the prefetch for `affiliations` uses `Prefetch('affiliations', queryset=DoctorAffiliation.objects.filter(location__is_active=True)...)` for non-admin viewers. The `DoctorFilter` chamber `Exists` subquery adds `location__is_active=True`.
- The facility actions (`/hospitals/{id}/doctors/`, `/tests/`) and `/facility-tests/search/` already filter active rows (verify).
- `SearchMetadataAPIView` lists only active facilities and active test categories.

**P2.3.4 Tests.** Create `tests/test_part2_visibility.py`. For each viewset in the table:
- an anonymous user doesn't see the inactive row in the list and gets 404 on retrieve;
- a super admin sees it;
- a facility admin sees it only if it's within their scope;
- a doctor with one chamber at an inactive location shows only the active chamber publicly.

**Gate:** manual check. Deactivate one hospital in admin. It disappears from the public hospitals page, search results and a doctor's chamber list, but stays visible in the admin dashboard.

---

## Phase 4 — Patients & phone numbers (#7, #8)

**P2.4.1 Phone helper.** Create `core/phone.py` with:
- `canonical_bd_phone(raw) -> str`: strip non-digits; `8801XXXXXXXXX` → `01XXXXXXXXX`; a 10-digit `1XXXXXXXXX` → `01XXXXXXXXX`. The result must match `^01[3-9]\d{8}$`, otherwise raise `ValueError`.
- `BDPhoneField(serializers.CharField)`: its `to_internal_value` returns the canonical form, and a `ValueError` becomes a validation error using the existing message from `core/validators.py`.

Leave `services/sms.normalize_bd_phone` (the SMS gateway format) unchanged.

**P2.4.2 Use the field at every input boundary.**
- All booking serializers' `patient_phone` / `phone`.
- The patient lookup endpoint's phone query param.
- OTP **request** and **verify** input phone fields. Normalization only: do not change OTP logic.

Also add `Patient.save()` → `self.phone = canonical_bd_phone(self.phone)` as a safety net.

**P2.4.3 Data migration** (`bookings`, one migration, run inside a transaction):
1. Group Patients by `canonical_bd_phone(phone)`. Skip phones that fail to canonicalize, and list them in the migration output.
2. For groups with more than one row, keep the earliest `created_at`. Repoint `patient` FKs on `DoctorBooking`, `TestBooking` and `HospitalServiceBooking` to the kept row, and delete the others.
3. Update kept rows to the canonical phone.
4. Canonicalize `patient_phone` on all three booking tables and `phone` on `OTPVerification`.

Before writing it, run a dry count of duplicate groups and record it in the notes.

**P2.4.4 Patient service.** Create `bookings/patients.py` → `get_or_create_patient(phone, name) -> Patient`. It creates the patient with `name` if the canonical phone is new. **It never modifies an existing patient.**
- Delete `resolve_patient` from `bookings/serializers.py`, along with the name/age/gender overwrite logic.
- Delete the patient creation inside `TestBooking.save()` and `HospitalServiceBooking.save()`.
- Patient resolution moves into each booking's create path (Phase 5 services). It must not happen in `validate()`.

**P2.4.5 Per-booking snapshot.** Add `patient_age = PositiveSmallIntegerField(null=True, blank=True)` and `patient_gender = CharField(max_length=10, blank=True, choices=Patient.Gender.choices)` to `BaseBooking` (it's abstract, so this migrates all three tables). The serializers accept `patient_age` / `patient_gender` as write fields and store them on the booking. `patient_name` is already per booking.

**P2.4.6 Tests.** Create `tests/test_part2_patients.py` covering:
- `01711111111`, `+8801711111111` and `8801711111111` → one patient;
- an invalid number → 400;
- booking "Karim (son)" on Rahim's phone leaves Patient.name = "Rahim" and sets booking.patient_name = "Karim (son)";
- the booking snapshot age and gender are stored and the patient's age and gender are untouched;
- the migration merge logic (call the migration's function directly on test data): two duplicates plus bookings → one patient, and all bookings are repointed;
- the OTP request/verify flow still works when the phone is sent in `+880` form.

**Gate:** `grep -rn "def resolve_patient\|Patient.objects.get_or_create" doctors_hub_backend --include=*.py | grep -v "migrations\|bookings/patients.py"` → nothing.

---

## Phase 5 — Booking rules, price snapshots, async SMS (#6, #12, #13, #24, #21)

**P2.5.1 Async SMS helper.** Create `core/tasks.py` with `run_after_commit(fn, *args)`:
- It calls `transaction.on_commit` with a function that starts a `threading.Thread(daemon=True)`.
- The thread wraps `fn` in try/except and logs with `logging.getLogger('sms')`.
- Setting `SMS_ASYNC` (env, default True) = False runs `fn` synchronously on commit. `tests/conftest.py` sets it False.

Use it for all three confirmation SMS, replacing the doctor booking's direct `on_commit`.

**P2.5.2 Status and transitions (#6).**
- In all three booking serializers, `status` is read-only (create *and* update). Remove the `__init__` special-casing.
- Create `bookings/transitions.py` with an `ALLOWED` table:
  - `pending` → `confirmed`, `cancelled`;
  - `confirmed` → `completed`, `cancelled`, `no_show`;
  - `completed`, `cancelled`, `no_show` → nothing (terminal).
- Add `@action(detail=True, methods=['post'], url_path='transition')` on each booking viewset, with body `{"to": "<status>"}`:
  - permission: the same as the viewset's update permission (`bookings.edit` via the existing classes);
  - validates against `ALLOWED` and returns 400 with the allowed targets if invalid;
  - saves only `status` and `updated_at`.
- Frontend: `services/api/bookings.js` gets `transitionBooking(kind, id, to)`. Replace `updateDoctorBookingStatus` (and the test/service equivalents) with it in `views/AdminDashboard/components/BookingsTab.jsx`. The status dropdown only offers the allowed targets for the current status.

**P2.5.3 Test and hospital-service booking services (#6, #12).** Create `create_test_booking(validated, user)` and `create_hospital_service_booking(validated, user)` in `bookings/services.py`, both under `transaction.atomic()`. Their `create()` methods call these.

*Test bookings:*
- Lock the `FacilityTest` row with `select_for_update()`.
- It must be `is_available` and at an active location, with an active test and category.
- `pickup_date` must be ≥ today and ≤ today + 30 days.
- New field `TestBooking.collection_type` (`center` | `home`, default `center`). `home` requires `facility_test.home_sample_collection=True`, a `pickup_thana` and a non-empty `pickup_address_line`. `center` clears both pickup fields.
- Resolve the patient with `get_or_create_patient`, set `status='pending'`, and send the SMS via `run_after_commit`.

*Hospital-service bookings:*
- `booking_date` must be ≥ today and ≤ today + 30 days.
- The hospital must be active, and the service must be offered (move the existing `clean()` check here).
- Patient resolution, pending status and SMS work the same way as for test bookings.

*Doctor bookings:* in the existing `create_doctor_booking`, replace patient resolution with `get_or_create_patient` and store the `patient_age`/`patient_gender` snapshot.

**P2.5.4 Price snapshots (#13).**
- Add `DoctorBooking.fee_at_booking = DecimalField(8,2, null=True)`, `TestBooking.price_at_booking = DecimalField(10,2, null=True)` and `TestBooking.home_charge_at_booking = DecimalField(10,2, null=True)`.
- In the services, set `fee_at_booking = affiliation.fee` and `price_at_booking = facility_test.calculated_price` (the discounted price, which may be None after Phase 6). Set `home_charge_at_booking = facility_test.home_sample_charge` only when `collection_type == 'home'`.
- Data migration: backfill existing bookings from current values. Record in the notes that historic values are approximate.
- Serializers: `TestBookingSerializer.price` reads `price_at_booking` (not `facility_test.price`). Add `fee` to `DoctorBookingSerializer` from `fee_at_booking`.
- Update the SMS texts and `BookingModal`, `LabBookingModal` and `BookingsTab` to show the snapshot values.

**P2.5.5 (#21) Regression check.** Add a test that freezes time at 00:30 Asia/Dhaka on a Tuesday (still Monday in UTC). It asserts that a doctor booking for "Monday" is rejected as past and that availability starts from Tuesday.

**P2.5.6 Tests.** Create `tests/test_part2_bookings.py` covering:
- status in the payload is ignored on create and PATCH, for all three types;
- valid and invalid transitions;
- test booking rejections: past date, beyond 30 days, unavailable test, inactive location, and home collection where the lab doesn't offer it;
- a home booking without an address → 400;
- a hospital-service booking for a service the hospital doesn't offer → 400;
- snapshots stay unchanged after a price or fee edit;
- the SMS function is called once after commit and not at all when the transaction rolls back (mock it).

**Gate:**
- `grep -rn "send_.*_confirmation_sms(" doctors_hub_backend/bookings --include=*.py` shows calls only inside `run_after_commit(...)`.
- Manual check: an admin moves a booking pending → confirmed → completed; completed → pending is refused.

---

## Phase 6 — Optional test prices & honest hospital defaults (#15, #16)

**P2.6.1 (#15) Model.**
- Change `FacilityTest.price` to `DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)` with no default. This is a schema change only: **do not modify existing values** (৳500 rows stay).
- `calculated_price` / `discounted_price` return `None` when `price` is None.
- `home_sample_charge` default changes from `0.0` to `None` for new rows only.

**P2.6.2 (#15) Stop the default ৳500.** In `services/facilities._attach_category_tests`, delete the `500.00` defaults. A test attached without a price gets `price=None`.

**P2.6.3 (#15) Search and aggregation.**
- `tests/pricing.net_price()` already yields NULL for NULL price. Verify it with a test.
- In `tests/search.py`, `min_price`/`max_price` ignore NULLs automatically. Add `priced_offering_count`.
- Ordering by price uses `F('min_price').asc(nulls_last=True)` / `.desc(nulls_last=True)`, so groups with no priced offering sort last in both directions.

**P2.6.4 (#15) Frontend.** Grep `calculated_price|discounted_price|min_price|max_price|\.price\b` in:
- `views/DiagnosticsSearch/**`
- `views/HospitalDetail/components/HospitalDiagnosticsSection.jsx`
- `components/LabBookingModal.jsx` (or wherever test booking lives)
- the admin test/pricing screens

Wherever a price is null, show **"Price at counter"** (English UI) / **"মূল্য কাউন্টারে জানুন"** (Bangla UI, if a Bangla string table exists). The "from ৳X" line is hidden when `min_price` is null.

The admin price inputs allow empty, and saving empty sends `null`, not `0`.

**P2.6.5 (#16) Hospital defaults for new rows.**
- `Hospital` fields become:
  - `bed_capacity`, `icu_beds_total`, `icu_beds_available`, `ot_suites_count`: `IntegerField(null=True, blank=True)`, no default;
  - `emergency_phone`, `ambulance_phone`, `accreditation`, `dghs_reg_no`, `parking_capacity`: `default=''`;
  - `has_helipad`: `BooleanField(null=True, blank=True)`, no default.
- The migration is AlterField only: **existing row values stay unchanged**.
- In `views/AdminDashboard/components/modals/HospitalModal.jsx`, the create form starts these fields empty. Remove the literal defaults, but keep the existing `rating` default (ratings are static by decision).
- The public hospital components already hide nulls after Part 1. Verify `HospitalShowcaseHero.jsx`, `HospitalBedMonitorSection.jsx` and `HospitalAdmissionInfoSection.jsx` hide `null`, `''` and `has_helipad === null`.

**P2.6.6 Tests.** Create `tests/test_part2_prices_and_defaults.py` covering:
- attaching a category without prices → rows with `price=None`;
- search `min_price` ignores null offerings;
- null-price groups sort last in both directions;
- booking a null-price test → 201 with `price_at_booking=None`;
- a new hospital via the API without those fields → all null/empty;
- an existing hospital's values are unchanged after migrate (assert on a pre-created row).

**Gate:**
- `grep -rn "500.00\|500\.0\b" doctors_hub_backend/services doctors_hub_backend/tests/*.py --include=*.py | grep -v "tests/test_"` → nothing.
- `grep -n "default=650\|JCI\|H-098234\|1700-000000\|280 Car" doctors_hub_backend/facilities/models.py` → nothing.

---

## Phase 7 — Atomic chambers endpoint (#18)

**P2.7.1 Model.** Add `DoctorAffiliation.is_active = BooleanField(default=True, db_index=True)`. Add `Q(is_active=True)` to the Phase 3 public filters wherever affiliations appear: the chamber `Exists`, the doctor prefetch, the facility doctors action, availability and `batch_next_available`. Inactive chambers accept no new bookings; the booking service returns 400.

**P2.7.2 Endpoint.** `PUT /api/doctors/{id}/chambers/` is an `@action(detail=True, methods=['put'], url_path='chambers')` on `DoctorViewSet`, implemented in `doctors/services/chambers.py::sync_chambers(doctor, payload, user)` under `transaction.atomic()`.

Request:
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

**Semantics:** the payload is the complete desired set of chambers **that this user may manage**:
- **Scope:**
  - Super admin: all chambers of the doctor.
  - Facility staff with `doctors.edit`: only chambers at their facilities. Chambers at other facilities are untouched, and including them → 403.
  - The doctor themself (SELF role): mirror the current `DoctorAffiliationViewSet` permission rules exactly. If they are unclear, stop and report.
- **Create:** a chamber without `id`. `location_id` is required (no default). `fee` is required and must be > 0.
- **Update:** a chamber with `id`. It must belong to this doctor and be within scope.
- **Removal:** an in-scope chamber missing from the payload.
  - If it has **any** bookings: set `is_active=False` (keeping the history) and report it as `deactivated`.
  - Otherwise: delete it and report it as `deleted`.
  - It is never cascade-deleted with bookings.
- **Schedule removal:** a schedule with future non-cancelled bookings → 400 naming the schedule and the booking count. The admin must cancel the bookings or use a schedule exception first. Otherwise, delete it.
- **Validation:** run the existing overlap check across **all** of the doctor's active chambers, including out-of-scope ones, after applying the payload. Any error rolls back everything.
- **Response:** 200 with the doctor's full chamber list (the same serializer as `DoctorAffiliationSerializer`) plus `{"deactivated": [...], "deleted": [...]}`.

**P2.7.3 Remove the nested write path.** In `DoctorSerializer.create` and `update`: if the payload contains `affiliations`, return 400 `{"affiliations": ["Use PUT /api/doctors/{id}/chambers/."]}`. Delete the nested-create code.

**P2.7.4 Frontend** (`views/AdminDashboard/components/modals/DoctorModal.jsx`):
- Keep "create/update doctor" as one call. Then make **one** call to `api.syncDoctorChambers(doctorId, chambers)` (new, in `services/api/doctors.js`). Delete the whole per-affiliation and per-schedule call loop.
- Remove `allLocations[0]` defaults, `|| 1200` and `status_label` remnants. New chambers start with an empty location and fee. Saving is blocked until both are set.
- Show `deactivated` and `deleted` results in the success message. On an error, show the server message, and note that nothing was saved.

Also apply `syncDoctorChambers` to `DoctorAffiliationsManager.jsx` if it edits multiple chambers.

`AffiliateDoctorDrawer.jsx` (the single-facility attach) may keep `createDoctorAffiliation`.

**P2.7.5 Tests.** Create `tests/test_part2_chambers.py` covering:
- create two chambers with schedules in one call;
- an overlap in the payload → 400 and nothing saved (assert the counts are unchanged);
- updating a fee;
- removing a chamber with bookings → deactivated, bookings intact;
- removing a chamber with no bookings → deleted;
- removing a schedule with future bookings → 400;
- a facility admin can't touch another facility's chamber (403) and their sync leaves it untouched;
- an inactive chamber is hidden publicly and refuses new bookings;
- a nested `affiliations` on doctor create → 400.

**Gate:**
- `grep -rn "createDoctorAffiliation\|updateDoctorAffiliation\|deleteDoctorAffiliation" doctors_hub/src/views/AdminDashboard/components/modals/DoctorModal.jsx` → nothing.
- Manual check: edit a doctor with two chambers and change both, then simulate a failure (an overlapping schedule). Confirm nothing changed.

---

## Phase 8 — Role properties (#17)

**P2.8.1 Call-site inventory first.** Before changing anything, list every use of `is_super_admin`, `is_facility_admin` and `is_facility_staff` outside tests and migrations (about 69, in 13 files). Write them to `docs/part2-rbac-callsites.md` as a table with columns file:line, current check, purpose, and new check.

Classify each with these rules:
- **Row scoping** (which facilities' rows a user may see or edit, e.g. `core/scoping.py`) → `is_facility_staff`.
- **Facility administration** (managing staff, roles or facility settings) → `is_facility_admin`.
- **Platform-wide actions** → `is_super_admin`.
- **Anything already gated by page permissions** (`HasPagePermission…`): keep the page permission, and remove redundant role-property checks only if the permission already covers them.

If a call site doesn't fit any rule, mark it "UNCLEAR", stop and report.

**P2.8.2 Properties** (`accounts/models.py`):
- `SUPER_ADMIN_ROLE_NAME = "Super Admin"` lives in `accounts/constants.py`. It's the same name `sync_permissions` seeds; import it there too.
- `is_super_admin`: `is_superuser` **or** an assignment to an active role with `is_system=True`, `scope_type=GLOBAL` and `name=SUPER_ADMIN_ROLE_NAME`.
- `is_facility_staff`: any assignment to an **active** role with `scope_type=FACILITY` (adds the missing `is_active` check).
- `is_facility_admin`: `is_facility_staff` **and** that role holds the permission with codename for `roles.edit`. Check the codename format in `sync_permissions` and use exactly that.
- Other global roles get access only through their page permissions.

**P2.8.3 Apply the new checks** at each call site as the inventory table says, one commit per file.

**P2.8.4 Tests.** Create `tests/test_part2_roles.py` covering:
- a user with a non-system global role (e.g. "Content Editor") is not super admin and only reaches what its permissions allow;
- a facility user without `roles.edit` is staff but not admin: scoped reads work, and managing staff and roles → 403;
- a facility user with `roles.edit` is admin;
- an inactive role grants nothing;
- a superuser without a role is super admin.

Update existing `tests/test_rbac.py` and `tests/test_staff_delegation.py` expectations only where the inventory documents the change.

**Gate:**
- `docs/part2-rbac-callsites.md` exists with no "UNCLEAR" rows.
- Manual check: log in as a facility staff user without `roles.edit`. They can see their facility's bookings but can't open staff or role management.

---

## Phase 9 — Counts, facets & cache invalidation (#19, #20, #22)

**P2.9.1 (#22) Category counts on read.**
- `HospitalCategoryViewSet.get_queryset` annotates `hospital_count`: a `Subquery` count of hospitals in the category with an active location. Find the FK's `related_name` in the model.
- `DiagnosticCenterCategoryViewSet` annotates `center_count` the same way.
- `TestCategoryViewSet` annotates `test_count` (active tests) and `center_count` (distinct active locations offering an available test in the category).
- Delete `HospitalCategory.count` (migration) and remove it from `HospitalCategorySerializer`.
- Frontend `CategoryModals.jsx`: remove the `count` inputs and state for hospital and test categories. `CategoriesTab.jsx` shows the computed counts.

**P2.9.2 (#19) Slim facets.** `core/views.py` → `SearchFacetsAPIView` returns only:
```json
{"hospital_categories": [{"id","slug","name","hospital_count"}]}
```
- Counts are computed from `HospitalFilter(request.GET, queryset=<public hospital queryset>)` with the `category` param removed. The counts therefore reflect location and search filters but not the category filter itself.
- Delete the doctor, diagnostic-center, specialty and test-category sections, and their serializer imports.
- The cache key includes the Phase 9.3 version.
- Frontend: `HospitalsPage.jsx` passes the same params it sends to `getHospitals` (search included) to `getSearchFacets`, and `admin.js getSearchFacets` forwards `search`. Update `tests/test_search_facets.py` to the new contract.

**P2.9.3 (#20) Cache invalidation.**
- Create `core/cache_keys.py` with:
  - `public_cache_version()`, which reads the key `public_cache_version` (default 1);
  - `bump_public_cache()`, which does `cache.incr` with a fallback set, exactly like `bump_taxonomy_version`.
- The `search-metadata` and `search-facets` cache keys become `f"...:v{public_cache_version()}:..."`.
- Create `core/signals.py` (connected in an app config's `ready()`). `post_save` and `post_delete` on these models call `bump_public_cache()`:
  - Location, Hospital, DiagnosticCenter;
  - HospitalCategory, DiagnosticCenterCategory, TestCategory, Test, FacilityTest;
  - DoctorSpecialty, SpecialtyAlias;
  - Doctor, DoctorAffiliation.
- `post_save`, `post_delete` and `m2m_changed` (on `parent_categories`, `related` and `Doctor.specialties`) on DoctorSpecialty and SpecialtyAlias also call `bump_taxonomy_version()`. Remove the now-duplicate manual calls in `doctors/serializers.py` and `doctors/admin.py` only if the signal covers them.
- Bulk `.update()` calls in management commands don't fire signals, so add an explicit `bump_public_cache()` at the end of each data-changing command.
- **Startup warning:** add a Django system check `core.W001` that warns when `DEBUG` is False and `REDIS_URL` is empty. The message says caches are per-process and must not run with multiple workers.

**P2.9.4 Tests.** Create `tests/test_part2_counts_cache.py` covering:
- category counts are correct and exclude inactive items;
- the facets endpoint has only `hospital_categories`, and its counts match `/api/hospitals/?category=<slug>` counts under the same `district_id`;
- editing a hospital name, then `GET /search-metadata/`, shows the new name immediately;
- adding an alias bumps the taxonomy version;
- the system check warns with `DEBUG=False` and no Redis.

**Gate:**
- The `/api/search-facets/` payload is under 10 KB. Record it next to the 60 KB baseline.
- `grep -n "'count'" doctors_hub/src/views/AdminDashboard/components/modals/CategoryModals.jsx` → nothing.

---

## Phase 10 — Final sweep

**P2.10.1 Checks.** Run the full backend suite on Postgres, `spectacular --validate`, `npm run build` and `npm test`, and re-run every phase gate grep.

**P2.10.2 Re-probe every Part 2 item.** Write `tests/test_part2_regressions.py` with one test per item (#1–#24). Items fixed in Part 1 (#3, #4, #9, #10, #11, #21) get a regression test too.

**P2.10.3 API changes doc.** Write `docs/part2-api-changes.md` covering:
- new endpoints (transition, chambers);
- removed params (`fee_max`, name-based location inputs);
- removed or changed fields (`count`, `status` writability, price nullability, snapshots, `patient_age`/`patient_gender`, `collection_type`);
- the phone format.

The Flutter patient app follows this document.

**P2.10.4 Merge summary.** Write a short merge summary in `docs/part2-agent-notes.md`: what changed, deviations and open questions. Only list things that exist in the diff.

---

## Out of scope for Part 2 (do not do)

- OTP logic and the OTP bypass codes, JWT and auth flows, SMS credentials: security work, handled separately.
- `User.phone_number` normalization (auth).
- Part 3 redundancy cleanup:
  - duplicate `/api/v1/` routes and duplicate booking routes;
  - the `LabBooking` aliases;
  - one-off management commands;
  - renaming the `tests` app;
  - a real task queue replacing the thread-based SMS.
