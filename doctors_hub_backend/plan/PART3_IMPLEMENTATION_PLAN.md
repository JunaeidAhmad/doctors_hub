# Doctors Hub — Part 3 Implementation Plan
## Leftovers, partial implementations & performance

Codebase: the current working copy (after Part 2, last synced at `89fac24`).
Backend: `doctors_hub_backend/` (Django 5.2, DRF, Postgres) · Frontend: `doctors_hub/` (React + Vite)

This plan is written for an autonomous coding agent. Read **Section 0** before touching any code. Execute phases **in order**. Each phase ends with a gate that must pass before the next phase starts.

---

## 0. Rules for the agent (read first, apply always)

### 0.1 Working method (no git)
1. **Do not use git.** No branches, commits, stashes or resets. Edit files directly in the working copy.
2. **Change log instead of commits.** After every numbered task, append an entry to `docs/part3-agent-notes.md`:
   - `### P3.<phase>.<task>` with:
     - files changed (paths);
     - a one-line summary of the change;
     - commands run, with result.
   - Only describe what you actually changed. Never describe planned or assumed work as done. If a task is skipped or partial, say so explicitly with the reason.
3. **Database safety.** Before the first migration of each phase, back up the dev database:

   ```bash
   pg_dump "$DATABASE_URL" -Fc -f backups/before_p3_phase<N>.dump
   ```

   (Create `backups/` if missing, and keep it out of any deploy.) If a migration goes wrong, restore with `pg_restore --clean -d "$DATABASE_URL" backups/before_p3_phase<N>.dump` and report.
4. Before editing a file, open and read it in full. Line numbers here are hints. If they don't match, find the code by function or field name.
5. **Stop and report** (write to `docs/part3-agent-notes.md`, then stop) when:
   - a file, function or field named here does not exist;
   - an instruction contradicts the code;
   - a consumer needs a field this plan removes;
   - a gate fails twice after honest fix attempts.
6. Do not refactor, rename or reformat anything outside the current phase.

### 0.2 Hard constraints
- **No invented data**: no default fees, default locations, placeholder counts or fallback names. Missing data → empty state, "—", or hidden.
- **Do not touch**: OTP logic, JWT/auth flows, SMS credentials, or rating/review values (static by product decision).
- **No new dependencies**, except enabling `django.contrib.postgres`, which ships with Django.
- **Migrations**: `makemigrations <app>` → read the generated file → never edit old migrations. Data migrations must be reversible or use `RunPython.noop` as the reverse.
- **Keep the test suite green.** Only change an existing test when this plan changes the contract it checks, and note it in the change log.
- Every API contract change is recorded in `docs/part3-api-changes.md`, which the Flutter patient app follows.

### 0.3 Commands
```bash
cd doctors_hub_backend
python manage.py migrate
python -m pytest -q                      # on Postgres
python manage.py spectacular --file /tmp/schema.yml --validate
python manage.py check --deploy          # used in Phase 1

cd doctors_hub
npm run build
npm test
```

### 0.4 Gate template
Each phase gate means all of the following:
- `pytest` passes on **Postgres**;
- `spectacular --validate` passes;
- `npm run build` and `npm test` pass;
- the phase's grep checks return what they say;
- the manual checks are done and recorded in the change log.

---

## Decisions already made (do not revisit)

| Topic | Decision |
|---|---|
| Doctor list payload | `/api/doctors/` (list) uses a new lean serializer. Detail (`/api/doctors/{id}/`) keeps the full serializer. The two specialty fields become one, `specialties`, ordered primary first, plus `primary_specialty`. |
| Chambers inside doctor payloads | They use a lean chamber shape with no doctor fields repeated, and the facility as a mini object. |
| Doctor list `meta` | Computed once from the already-filtered queryset. The duplicate keys `tier1_count` / `tier2_count` are removed. |
| `search-metadata` | Facilities are returned once (`facilities`), in a mini shape. `hospitals` and `diagnostic_centers` are removed; consumers filter by `location_type`. |
| Specialty counts | Constant number of queries, cached under the public cache version. |
| Admin init | Doctors use the lean list serializer. `tests` becomes a lean picker list. All querysets are prefetched. |
| Locations | `/api/locations/` is paginated. Pickers use server search. Division/District/Thana stay unpaginated (small, fixed reference data). |
| Search speed | Postgres `pg_trgm` GIN indexes on the searched text columns. Existing `icontains` queries stay as they are (trigram indexes accelerate them). `about` is removed from doctor search fields. |
| Doctor's main specialty on profile pages | Uses `primary_specialty`, not `specialties[0]`. |

---

## Phase overview

| Phase | Name | Covers |
|---|---|---|
| 0 | Baseline | Measurements before changes |
| 1 | Part 2 leftovers | DoctorModal fakes, facility picker + location pagination, Redis check bug, `formatFacilityName`, primary specialty display, concurrency test, notes cleanup |
| 2 | Role call-site inventory | Unfinished Part 2 Phase 8 |
| 3 | Doctor payload | Lean list serializer, single specialties field, lean chambers, single `meta` computation |
| 4 | Metadata & specialty counts | Facilities once, mini shape, constant-query counts |
| 5 | Admin init | Lean doctors, lean tests, prefetching |
| 6 | Search indexes | `pg_trgm` GIN indexes |
| 7 | Final sweep | All |

---

## Phase 0 — Baseline

**P3.0.1** With the dev server and seeded DB running, record the status, JSON byte size and SQL query count for each of the following in `docs/part3-baseline.md`:
- `GET /api/doctors/?page_size=20`
- `GET /api/doctors/?specialty=<a common slug>&page_size=20`
- `GET /api/doctors/<any slug>/`
- `GET /api/search-metadata/`
- `GET /api/admin/init/` (as a super admin; use the real route from `core/urls.py`)
- `GET /api/locations/`
- `GET /api/specialties/`

To count queries, use `django.test.utils.CaptureQueriesContext` in a small management command or shell script, `scripts/measure_endpoints.py`, that hits each URL through the test `Client`. Keep the script; it's reused in Phase 7.

**P3.0.2** For each search column in Phase 6, run `EXPLAIN ANALYZE` on the doctor search `?search=rahman` query and the facility test search `?q=cbc` query, and paste the plans into the baseline doc.

**Gate:** `docs/part3-baseline.md` exists with all rows filled, and `scripts/measure_endpoints.py` runs.

---

## Phase 1 — Part 2 leftovers

**P3.1.1 Paginate `/api/locations/`.**
- `facilities/views.py` → `LocationViewSet`: remove `pagination_class = None`, so it uses the default `StandardResultsSetPagination`.
- Add a lean serializer `LocationPickerSerializer` (`id`, `slug`, `display_name`, `location_type`, `area`, `district`, `is_active`). Use it when the query param `view=picker` is present, via `get_serializer_class`.
- Keep `?search=` and `?location_type=` working; `location_type` already filters.

**P3.1.2 Facility picker component.** Create `src/components/FacilityPicker.jsx`:
- A debounced (300 ms) search input calling `GET /api/locations/?view=picker&search=<q>&location_type=<optional>&page_size=20`.
- Results show `display_name · area, district`.
- Props: `{ value, onChange, locationType, disabled }`. `value` is the location ID. On mount with a value, it fetches `/api/locations/<id>/?view=picker` to show the label.
- No default selection.

Add `searchLocations(params)` and `getLocationLabel(id)` to `services/api/admin.js`. Update `getLocations` to handle the paginated envelope, or delete it if nothing uses it after P3.1.4.

**P3.1.3 `DoctorModal.jsx`: remove the invented values.** In `views/AdminDashboard/components/modals/DoctorModal.jsx`:
- Remove every `'1200'` fee default (about 4 places: new-chamber state, mapping of existing chambers, the reset helpers). A new chamber's fee starts as `''`. An existing chamber with a `null` fee shows `''`.
- Remove every `allLocations[0]?.id` default (about 3 places). A new chamber's location starts as `''`.
- Replace the chamber location `<select>`, which is built from `allLocations` (the first 50 hospitals and centers from admin init only), with `FacilityPicker`.
- Saving is blocked, with an inline message, until every chamber has a location and a fee greater than 0. The placeholder text `e.g. 1200` may stay; it's a hint, not a value.
- Delete the `allLocations` `useMemo` if nothing else uses it.

Apply the same `FacilityPicker` replacement in `views/AdminDashboard/components/doctor/DoctorAffiliationsManager.jsx`, which builds its own `allLocations` list.

**P3.1.4 `DoctorSearchPage` location fetch.** In `views/DoctorSearch/DoctorSearchPage.jsx`, delete the `api.getLocations()` effect ("Ensure all hospital & diagnostic center locations are loaded"). The facility filter already comes from `search-metadata` `facilities`.

**P3.1.5 Redis warning bug.**
- `core/settings.py` defines `_REDIS_URL` but not `REDIS_URL`, so the `core.W001` check in `accounts/apps.py` reads an attribute that never exists and warns even when Redis is configured. Add `REDIS_URL = _REDIS_URL` right after `_REDIS_URL` is read.
- Add a test: with `DEBUG=False` and `REDIS_URL='redis://x'` (override `settings`), there's no `core.W001`. The existing test covers the warning case.

**P3.1.6 Remove the last frontend name formatter.**
- `views/AdminDashboard/components/doctor/DoctorScheduleManager.jsx` imports `formatFacilityName`. Replace its uses with the API's `display_name` (`aff.facility.display_name` or the equivalent object in that file).
- Then delete `formatFacilityName` from `utils/facilityUtils.js`, delete its tests from `utils/facilityUtils.test.js`, and adjust the `test` script in `package.json` if the test file becomes empty.

**P3.1.7 Main specialty on profile pages.** These read `doctor.specialties?.[0]?.name || 'Specialist'`, which depends on M2M order and falls back to an invented word:
- `views/DoctorProfile/DoctorProfilePage.jsx`
- `views/DoctorProfile/components/DoctorProfileHero.jsx`
- `views/DoctorProfile/components/DoctorAboutSection.jsx`
- `views/DoctorProfile/components/DoctorReviewsSection.jsx`

Use `doctor.primary_specialty?.name` (plus `bn_name` where the page shows Bangla). If that's missing, hide the specialty line. Confirm `primary_specialty` is in the detail serializer output; if not, stop and report.

**P3.1.8 Concurrency test on Postgres.** Run `pytest tests/test_part1_availability.py::DoctorBookingConcurrencyTestCase -q` alone and inside the full suite, on Postgres. If it fails in the full suite:
- Find the cause (shared state, the transaction test case mixed with other test types, or connection handling).
- Fix the test isolation, not the booking service, unless the booking service is actually at fault, in which case stop and report.

Record both runs in the change log.

**P3.1.9 Clean up the Part 2 notes.** `docs/part2-agent-notes.md` contains a stale "Phase 10 (partial) / remaining work: Phase 9…" section that contradicts the later sections, and says all gate greps are clean although the Phase 0 grep still matched `DoctorModal.jsx`. Fix both:
- Delete the stale section.
- Add an "Errata (found in Part 3 review)" section listing:
  - `DoctorModal` defaults (fixed in P3.1.3);
  - the missing role call-site inventory (Phase 2);
  - the `REDIS_URL` check bug (P3.1.5).

**Gate:**
- `grep -rnE "'1200'|\|\| 1200|allLocations\[0\]" doctors_hub/src` → nothing.
- `grep -rn "formatFacilityName" doctors_hub/src` → nothing.
- `grep -rnE "specialties\?\.\[0\]|'Specialist'" doctors_hub/src/views/DoctorProfile` → nothing.
- `python manage.py check --deploy` with `DEBUG=False` and a `REDIS_URL` set shows no `core.W001`.
- Manual check: in the admin doctor modal, search for a hospital that's beyond the first 50 alphabetically, select it, and save. Saving with an empty fee is blocked.

---

## Phase 2 — Role call-site inventory (unfinished Part 2 Phase 8)

Part 2 rewrote the three role properties correctly, but did not classify the places that use them. Do that now.

**P3.2.1 Inventory.** List every use of `is_super_admin`, `is_facility_admin` and `is_facility_staff` outside `tests/` and `migrations/` (currently about 75). Write them to `docs/part3-rbac-callsites.md` as a table with these columns:
- file:line;
- code excerpt;
- purpose;
- current property;
- correct property;
- action (keep / change).

Classification rules:
- **Row scoping** (which facilities' rows a user may see or edit, e.g. `core/scoping.py`, `RoleScopedQuerysetMixin`) → `is_facility_staff`.
- **Facility administration** (managing staff, roles or facility settings) → `is_facility_admin`.
- **Platform-wide actions** (creating facilities, global settings, taxonomy) → `is_super_admin`.
- **Already gated by a page permission** (`HasPagePermission…`, `required_module`): keep the page permission. Remove a redundant role-property check only if the permission fully covers it, and write down why.

If a row doesn't fit any rule, mark it "UNCLEAR", stop and report. Do not guess.

**P3.2.2 Apply.** Change only the rows marked "change", file by file, logging each file in the change log.

**P3.2.3 Tests.** Create `tests/test_part3_rbac_callsites.py`. For every row changed in P3.2.2, add a test that would have failed under the old property and passes under the new one. At minimum:
- a facility staff user without `roles.edit` can list their facility's bookings but gets 403 on staff/role management;
- a user with a non-system global role reaches only what its page permissions allow.

**Gate:**
- `docs/part3-rbac-callsites.md` exists, has one row per call site (compare the count with the grep count), and has zero "UNCLEAR" rows.
- `pytest tests/test_rbac.py tests/test_staff_delegation.py tests/test_part2_roles.py tests/test_part3_rbac_callsites.py` passes.

---

## Phase 3 — Doctor payload

Problem: each doctor in `/api/doctors/` costs about 2 KB, for three reasons:
- each chamber nests a full `FacilitySummary` (about 20 fields) and repeats the doctor's own fields (`doctor_name`, `doctor_bn_name`, `academic_title`, `institution`, `qualification`, `experience`);
- `specialty_tags` and `specialties` carry the same data twice;
- `list()` re-runs `filter_queryset` a second time to build `meta`.

**P3.3.1 Consumer inventory first.** List every field read from `/api/doctors/` list items by:
- `views/DoctorSearch/**` (`DoctorCard.jsx`, `DoctorChamberCard.jsx`, list rendering);
- `views/AdminDashboard/components/DoctorsTab.jsx`;
- `views/AdminDashboard/components/facility/AffiliateDoctorDrawer.jsx`;
- `views/AdminDashboard/context/AdminContext.jsx`, plus every component that reads its `doctors` state.

Write the inventory to `docs/part3-doctor-fields.md`. Any field read by a list consumer must exist in the lean serializer below. If a consumer needs a field not listed below, add it only if it's a scalar on `Doctor`; otherwise stop and report.

**P3.3.2 Lean chamber serializer.** In `doctors/serializers.py`, add:
- `FacilityMiniSerializer` (in `facilities/serializers_summary.py`): `id`, `slug`, `display_name`, `location_type`, `area`, `district`, `district_id`.
- `ChamberLeanSerializer` (model `DoctorAffiliation`): `id`, `fee`, `chamber_type`, `is_active`, `facility` (`FacilityMiniSerializer`, source `location`), `schedules` (the existing `AffiliationScheduleSerializer`, read-only), and `next_available` (from `context['next_available_map']`, as in `DoctorAffiliationSerializer`).

It carries **no doctor fields**.

**P3.3.3 Lean doctor serializer.** Add `DoctorListSerializer`, read-only, with these fields:
- `id`, `slug`, `name`, `bn_name`, `academic_title`, `qualification`, `institution`, `experience`, `image`, `gender`, `bmdc_number`, `rating`, `review_count`, `is_verified`;
- `primary_specialty`: `{id, slug, name, bn_name}` or `null`;
- `specialties`: a list of `{id, slug, name, bn_name}`, ordered primary first, then by name;
- `chambers`: `ChamberLeanSerializer(many=True, source='affiliations')`, already filtered to active chambers at active locations for public viewers by the existing prefetch;
- `match_rank`: only when the specialty filter annotates it (use `SerializerMethodField` returning `getattr(obj, 'match_rank', None)`).

In `DoctorViewSet.get_serializer_class()`, return `DoctorListSerializer` for `action == 'list'`. Retrieve, create and update keep `DoctorSerializer`.

**P3.3.4 One specialties field on detail too.** In `DoctorSerializer` (detail), remove `specialty_tags`. Change `specialties` to the same lean shape as the list, ordered primary first, and keep `primary_specialty`. Check the detail consumers (`views/DoctorProfile/**`, admin modals that load a doctor) for any reads of specialty `parents` or `description`. If any exist, stop and report.

**P3.3.5 Frontend.**
- Update every consumer from P3.3.1 to the new names. `doctor.affiliations` becomes `doctor.chambers` in list contexts. `chamber.facility.display_name` keeps its meaning.
- `doctor.specialty_tags` becomes `doctor.specialties`. In `DoctorCard.jsx`, delete the `specialty_tags`-then-`specialties` fallback chain.
- In the admin, when the doctor modal opens to edit, it must fetch the full doctor (`GET /api/doctors/{id}/`) rather than reuse the list item. Check whether it already does. If it reuses the list item, add the fetch.

**P3.3.6 Single `meta` computation.** In `DoctorViewSet.list`, the `meta` block calls `self.filter_queryset(self.get_queryset())` a second time. Use the `queryset` variable already built at the top of `list()`: `queryset.order_by().values('match_rank').annotate(c=Count('id', distinct=True))`.

Remove the duplicate keys `tier1_count` and `tier2_count` from `meta`. No frontend file reads `meta` counts today (verify with a grep), so the remaining keys are `specialty`, `specialty_bn`, `slug`, `is_umbrella`, `primary_count`, `secondary_count`, `related_count` and `match_count`.

**P3.3.7 Tests.** Create `tests/test_part3_doctor_payload.py` covering:
- a list item has no `specialty_tags`, no `affiliations` key and no `doctor_name` inside chambers;
- `specialties[0]` is the primary specialty;
- `chambers[*].facility` has exactly the mini fields;
- the detail still returns `schedules` and full fields;
- `meta` is present with the expected keys when `?specialty=` is given, and is computed with no second filter pass (`assertNumQueries` lower than the baseline);
- an `assertNumQueries` bound for `?page_size=20`.

**Gate:**
- `GET /api/doctors/?page_size=20` is at least 50% smaller than the Phase 0 baseline, with fewer queries. Record both.
- `grep -rn "specialty_tags" doctors_hub/src doctors_hub_backend --include=*.py --include=*.js --include=*.jsx | grep -v migrations` → nothing.
- Manual check: the doctor search cards, chamber cards, admin doctors tab, onboarding drawer and doctor profile page all render correctly.

---

## Phase 4 — Metadata & specialty counts

**P3.4.1 Facilities once.** In `core/views.py` → `SearchMetadataAPIView`:
- Remove the `hospitals` and `diagnostic_centers` keys, and their entries in the response serializer used for the schema.
- Serialize `facilities` with `FacilityMiniSerializer` (from Phase 3) instead of `FacilitySummarySerializer`.

Frontend:
- `views/DoctorSearch/DoctorSearchPage.jsx`: delete the `meta.hospitals || meta.diagnostic_centers` fallback and use `meta.facilities`, filtering by `location_type` where a type-specific list is needed.
- Grep `src/` for other reads of `.hospitals` / `.diagnostic_centers` on the metadata response and fix them. `AdminContext` reads `res.hospitals` from **admin init**, not metadata; leave it.

**P3.4.2 Constant-query specialty counts.** Rewrite `specialty_doctor_counts(doc_qs=None)` in `doctors/services/specialty_relations.py` so its query count doesn't grow with the number of umbrellas. It uses at most 3 queries:
1. `Doctor.specialties.through.objects.filter(doctor__in=doc_qs).values_list('doctorspecialty_id', 'doctor_id')`. Check the real through-table column names first.
2. The umbrella → child mapping from the `parent_categories` through table (or `subspecialties`), as `(parent_id, child_id)` pairs.
3. The ids of umbrella nodes.

Then compute in Python:
- a leaf count = number of distinct doctors on that node;
- an umbrella count = number of distinct doctors on the umbrella or any child.

The result must be identical to the old function. Write the test by keeping the old implementation as `_specialty_doctor_counts_reference` inside the test file only, and comparing the two on a fixture with 2 umbrellas, shared children and doctors tagged in several nodes.

**P3.4.3 One cache for counts.** Wrap the default call (`doc_qs is None`) in a cache keyed `f"specialty_counts:v{public_cache_version()}"` with a 10-minute TTL. Replace the separate `specialty_counts_v1` cache in `doctors/services/specialty_suggest.py` with a call to this function. The Part 2 signals already bump the version on Doctor and specialty writes, and `m2m_changed` on `Doctor.specialties` also bumps it; verify that.

**P3.4.4 Tests.** Create `tests/test_part3_metadata_counts.py` covering:
- the metadata has `facilities`, and no `hospitals`/`diagnostic_centers`;
- a facility item has exactly the mini fields;
- new counts equal the reference counts;
- `specialty_doctor_counts()` runs in ≤ 3 queries regardless of umbrella count (create 10 umbrellas);
- the cache is invalidated after adding a specialty to a doctor.

**Gate:** the `search-metadata` size and query count are recorded against the Phase 0 baseline and must be lower.

---

## Phase 5 — Admin init

**P3.5.1 Consumer inventory.** In `views/AdminDashboard/context/AdminContext.jsx`, list each key read from `getAdminDashboardInit()` and every component that reads the resulting state (`doctors`, `tests`, `branchTests`, `hospitals`, `diagnosticCenters`, bookings). Write the list to `docs/part3-admin-init-fields.md`.

**P3.5.2 Lean payload** in `core/views.py` → `AdminInitAPIView`:
- `doctors`: `DoctorListSerializer` (Phase 3), with the same `next_available` batching as the doctor list. If the admin doesn't display `next_available`, skip the batch and don't include the field.
- `tests`: a new `TestOptionSerializer` (`id`, `name`, `code`, `category_id`, `category_name`, `is_active`). This is the picker list for all tests; it stays unpaginated because pickers need the full catalogue, but it's lean.
- Screens that manage tests in a table must load `/api/tests/` with pagination instead of using this list. Check the inventory. If a test management table reads fields beyond the lean set from context `tests`, switch that table to `api.getTests({page, page_size, search})`.
- `hospitals` / `diagnostic_centers`: keep the existing serializers (already counts-annotated by Part 2) and add `select_related('location__thana__district__division', 'category')` and `prefetch_related('services')` to their base querysets.
- `branch_tests`, bookings: add `select_related` for `location__thana__district__division`, `test__category` and `patient` as their serializers require.

**P3.5.3 Tests.** Create `tests/test_part3_admin_init.py`:
- an `assertNumQueries` bound for admin init as a super admin and as a facility admin, with 50 doctors, 50 hospitals and 400 tests;
- a `tests` item has exactly the lean fields;
- a `doctors` item matches the `DoctorListSerializer` shape.

**Gate:**
- The admin init size and query count are recorded against baseline and must be lower.
- Manual check: every admin tab loads, including tests management, test pickers in `BranchTestModal` and the doctor list.

---

## Phase 6 — Search indexes

**P3.6.1 Enable `pg_trgm`.** Add `django.contrib.postgres` to `INSTALLED_APPS`. Create a migration in `core`, or in `facilities` if `core` has no migrations package, that runs:

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

Run it through `migrations.RunPython`, executing only when `schema_editor.connection.vendor == 'postgresql'`, so SQLite runs still work.

**P3.6.2 GIN trigram indexes.** Add them in migrations with the same vendor guard, using `RunPython` that executes `CREATE INDEX IF NOT EXISTS … USING gin (<col> gin_trgm_ops)`, with a matching reverse that drops it:

| Table (model) | Columns |
|---|---|
| `Doctor` | `name`, `bn_name`, `qualification` |
| `DoctorSpecialty` | `name`, `bn_name` |
| `Location` | `name`, `branch`, `address_line` |
| `Test` | `name`, `code` |
| `Thana` | `name`, `bn_name` |

`icontains` compiles to `UPPER(col) LIKE UPPER(%x%)` in Django. Create the indexes on `UPPER(col)` (`USING gin (UPPER(col) gin_trgm_ops)`) so the planner can use them. Verify with `EXPLAIN` in P3.6.4 and adjust the expression if the plan still shows a sequential scan.

**P3.6.3 Trim the doctor search fields.** In `DoctorViewSet.search_fields`, remove `'about'` (long free text, noisy matches and unindexable cheaply). Keep the rest. Note it in `docs/part3-api-changes.md`.

**P3.6.4 Verify.** Re-run the `EXPLAIN ANALYZE` queries from P3.0.2 and paste the new plans into `docs/part3-baseline.md`. At least the `Doctor.name` and `Test.name` lookups must show a Bitmap Index Scan on the trigram index. At current data sizes the planner may still prefer a sequential scan on small tables. If so, record it, and confirm index use with `SET enable_seqscan = off;` in the same session.

**P3.6.5 Tests.** Run the full suite on Postgres and on SQLite; the migrations must be no-ops on SQLite. Add `tests/test_part3_search.py` asserting that `/api/doctors/?search=<word in about only>` no longer matches, and that a name search still matches.

**Gate:** the `EXPLAIN` evidence is recorded, and both database backends run the migrations cleanly.

---

## Phase 7 — Final sweep

**P3.7.1 Checks.** Run the full backend suite on Postgres, `spectacular --validate`, `npm run build` and `npm test`, and re-run every gate grep from Phases 1–6.

**P3.7.2 Remeasure.** Re-run `scripts/measure_endpoints.py` and add an "After" column to `docs/part3-baseline.md` with sizes and query counts.

**P3.7.3 API changes doc.** Write `docs/part3-api-changes.md` covering:
- `/api/locations/` is now paginated, and `view=picker` was added;
- the doctor list item shape (`chambers`, single `specialties`, no `specialty_tags`);
- `meta` keys;
- the `search-metadata` keys and facility shape;
- the admin init `tests`/`doctors` shapes;
- `about` was removed from doctor search.

**P3.7.4 Summary.** End `docs/part3-agent-notes.md` with a summary listing:
- what changed, phase by phase;
- deviations from this plan;
- open questions.

Everything in it must be traceable to the per-task entries above it.

---

## Out of scope for Part 3 (do not do)

- OTP logic and the bypass codes `123`/`123456` (must be removed before launch; handled separately), JWT/auth, SMS credentials.
- Redundancy cleanup, saved for a later part:
  - duplicate `/api/v1/` routes and duplicate booking routes;
  - the `LabBooking` aliases;
  - one-off management commands;
  - renaming the `tests` app;
  - a real task queue for SMS.
