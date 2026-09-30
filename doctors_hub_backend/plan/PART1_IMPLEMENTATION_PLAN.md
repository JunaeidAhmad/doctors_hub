# Doctors Hub — Part 1 Implementation Plan
## Move logic from the frontend to the backend

Repo: `https://github.com/JunaeidAhmad/doctors_hub`
Backend: `doctors_hub_backend/` (Django 5.2, DRF, Postgres) · Frontend: `doctors_hub/` (React + Vite)

This plan is written for an autonomous coding agent. Read **Section 0** before touching any code. Execute phases **in order**; each phase ends with a gate that must pass before the next phase starts.

---

## 0. Rules for the agent (read first, apply always)

### 0.1 Working method
1. Create one git branch per phase: `part1/phase-<N>-<short-name>`, branched from the previous phase's branch.
2. One commit per numbered task. Commit message format: `P1.<phase>.<task>: <what changed>`.
3. Before editing a file, open and read it in full. Line numbers in this plan are hints from an earlier snapshot. If they don't match, find the code by the function or variable name given.
4. **Stop and report** instead of improvising when:
   - a file, function or field named in this plan does not exist;
   - an instruction contradicts what the code does;
   - a gate fails twice after honest fix attempts.

   Write the report into `docs/part1-agent-notes.md` and stop.
5. Do not refactor, rename, reformat, or "clean up" anything not listed in the current phase.

### 0.2 Hard constraints
- **No invented data anywhere.** This covers fake doctors, placeholder numbers, fallback arrays, default prices, "Square Hospital" style fallbacks, default schedules and fake slot counts. If data is missing, show a loading skeleton, an empty state, or hide the element.
- **Do not touch:**
  - authentication, OTP, JWT, permissions/RBAC classes, SMS credentials;
  - rating/review values, which stay static by product decision;
  - anything listed as Part 2 or Part 3 work.
- **No new dependencies** (pip or npm) unless a task explicitly names one.
- **Migrations:** run `python manage.py makemigrations <app>` and read the generated file. Never edit existing migrations. A data migration must be reversible, or have an explicit `migrations.RunPython.noop` reverse.
- **Keep the existing test suite green.** Only update an existing test when this plan changes the contract that test checks, and say so in the commit message.
- **Times** in any new API contract are 24-hour `"HH:MM"` strings. Dates are `"YYYY-MM-DD"`.
- **Locations** in any new or changed API are referenced by ID (`division_id`, `district_id`, `thana_id`, location UUID). Never by name.

### 0.3 Commands
```bash
# Backend (Postgres with the seeded dev database)
cd doctors_hub_backend
python manage.py migrate
python -m pytest -q
python manage.py spectacular --file /tmp/schema.yml --validate   # must not error

# Frontend
cd doctors_hub
npm install
npm run build              # must succeed
npm test                   # existing node tests must pass
```

### 0.4 Phase gate template
Every phase gate means all of the following:
- `python -m pytest -q` passes.
- `spectacular --validate` passes.
- `npm run build` passes.
- The phase-specific grep checks return what they say.
- The manual checks are done and written into `docs/part1-agent-notes.md` under the phase heading, as endpoints hit, status codes, payload sizes and screenshots described in words.

---

## Decisions already made (do not revisit)

| Topic | Decision |
|---|---|
| Diagnostics search | New server-side endpoint `GET /api/facility-tests/search/`. The client does no grouping, filtering, sorting or pagination. |
| Doctor sorting | Remove the sort feature entirely (rating / experience / fee). No `experience_years` field. Backend order stays specialty rank, then name, with `id` as tiebreak. |
| Hospital list sorting | Server-side `ordering=name` / `-name`. The page shows the API `count`. |
| Hard-coded / fake content | Remove all of it from the frontend. |
| Existing hospital placeholder values (650 beds, JCI, helipad, …) | Keep existing row values and keep the model defaults. Add `Hospital.details_reviewed` (default `False`) so admins can see which hospitals still need real values. The frontend renders whatever the API returns and never substitutes its own numbers. |
| Doctor booking model | **Serial/token per session, with an estimated time.** Admins control sessions, capacity, consult time and per-date exceptions. |
| Location filtering | **IDs only.** Delete name-based location filters and the static geo data in the frontend. |
| Facility response shape | One flat facility shape, plus a nested `facility` summary object wherever another entity references a facility. |
| Specialty/category matching | Server-side suggest endpoint for specialties. Category filters are exact slug or UUID. |
| Doctor onboarding | Keep two steps (doctors are global; affiliations are per location). Add duplicate protection and retry-safety. |

---

## Phase overview and dependencies

| Phase | Name | Depends on |
|---|---|---|
| 0 | Baseline & guardrails | — |
| 1 | Remove doctor sort; hospital server-side ordering | 0 |
| 2 | Geo by ID only | 0 |
| 3 | Flat facility shape | 2 |
| 4 | Exact categories + specialty suggest | 3 |
| 5 | Diagnostics search endpoint | 2, 3, 4 |
| 6 | Hospital detail endpoints, drop embedded lists, remove hard-coded content | 3, 5 |
| 7 | Sessions, serials & availability | 3 |
| 8 | Doctor onboarding duplicate protection | 3 |
| 9 | Final sweep | all |

---

## Phase 0 — Baseline & guardrails

**Goal:** record before-numbers and stop giant payloads from being written to localStorage.

**P1.0.1 Baseline measurements.** With the dev server and seeded DB running, record status and JSON byte size for each of these in `docs/part1-baseline.md`:
- `GET /api/diagnostic-centers/?page_size=50`
- `GET /api/hospitals/`
- `GET /api/hospitals/<any-slug>/`
- `GET /api/doctors/`
- `GET /api/search-metadata/`
- `GET /api/search-facets/`

Also record the row counts of `FacilityTest`, `Test`, `TestCategory`, `Location` (by `location_type`), `Doctor`, `DoctorAffiliation`, `AffiliationSchedule`, `DoctorBooking`, `Division`, `District` and `Thana`.

**P1.0.2 localStorage size guard.** In `doctors_hub/src/services/api/core.js`, function `setCached`:
- Serialize once.
- If the serialized length is over 500,000 characters, store only in `memoryCache` and skip localStorage.
- Keep the existing try/catch.

**P1.0.3 Confirm test DB.** Run the full backend suite on Postgres and record the result in the notes.

**Gate:** tests pass, build passes, and the baseline file exists.

---

## Phase 1 — Remove doctor sort; hospital ordering on the server

### Backend
**P1.1.1** `doctors/views.py`, `DoctorViewSet.get_queryset`: change `.order_by('name')` to `.order_by('name', 'id')` so pagination is stable. Do not touch the specialty ranking order inside `DoctorFilter.filter_specialty`, other than appending `'id'` if it isn't already the last key. (It already ends with `'name', 'id'`; verify and leave it.)

**P1.1.2** `facilities/views.py`, `HospitalViewSet`:
- In `get_queryset`, annotate `name=F('location__name')`.
- Add `filters.OrderingFilter` to `filter_backends`, with `ordering_fields = ['name']` and `ordering = ['name']`.
- Keep the existing `.distinct()`.

**P1.1.3** Test `tests/test_part1_hospital_ordering.py`: create 3 hospitals named C, A, B with `page_size=2`. Assert that `ordering=name` gives page 1 = A, B and page 2 = C, and that `ordering=-name` is the reverse.

### Frontend
**P1.1.4** `views/DoctorSearch/DoctorSearchPage.jsx`: delete the sort feature completely:
- the `sortOrder` state;
- the `sortedDoctors` `useMemo`;
- the sort `<select>` or buttons;
- any `sort` URL parameter read or write;
- the fee fallback `1000`.

Render `doctors` directly. Also check `components/DoctorSearchHeader.jsx` and `components/DoctorSearchBarStrip.jsx` for sort props and remove them.

**P1.1.5** `views/Hospitals/HospitalsPage.jsx`:
- Delete the client-side `sortedHospitals` sort.
- Pass `ordering: sortOrder === 'desc' ? '-name' : 'name'` to `api.getHospitals`, and add `sortOrder` to that effect's dependency array.
- Store `hData.count` in a new `totalHospitals` state.
- The "N Active Hospitals" label shows `totalHospitals`, not `filteredHospitals.length`.

**P1.1.6** `services/api/hospitals.js`, `getHospitals`: accept and forward `ordering`, and include it in the cache key.

**Gate:**
- `grep -rnE "highest_rated|fee_low|fee_high|sortedDoctors" doctors_hub/src` returns nothing.
- Manual check: on the hospitals page, page 2 in A→Z order continues alphabetically from page 1.

---

## Phase 2 — Geo by ID only

**Goal:** every location filter uses `division_id` / `district_id` / `thana_id`. Name-based location matching and the static geo data are deleted.

### Backend
**P1.2.1 Doctor filter.** In `doctors/views.py` → `DoctorFilter`:
- Delete the filters `area`, `district`, `division` and `location`, and their methods `filter_area`, `filter_district`, `filter_division` and `filter_location`.
- Keep `thana_id`, `district_id` and `division_id`.
- Remove the deleted names from `Meta.fields`.

**P1.2.2 Hospital and diagnostic-center filters.** In `facilities/views.py`:
- Do the same deletion in `HospitalFilter` and `DiagnosticCenterFilter`.
- Delete the module-level `resolve_location_q`.
- Keep the `*_id` filters.

**P1.2.3 Search facets.** In `core/views.py` → `SearchFacetsAPIView`:
- Replace the `location` / `loc` / `area` params and the `DIST_ALIASES` block with `division_id`, `district_id` and `thana_id`, parsed as ints. A non-integer value returns 400.
- Apply them to `doc_qs` as one `Exists(DoctorAffiliation…)` subquery, and directly to `hosp_qs` and `diag_qs`.
- Remove `districts` and `divisions` from the response; the frontend uses the geo endpoints instead.
- Update the cache key and the `extend_schema` parameters.

**P1.2.4 Doctor multi-join fix.** Do this in the same phase, because the geo filters change here. The affiliation-level filters are `thana_id`, `district_id`, `division_id`, `fee_max`, `day`, `hospital`, `diagnostic_center` and `facility`. Today each one adds a separate join, so conditions can match different chambers. Fix:
1. Declare these filters with `method=` pointing at a no-op that returns the queryset unchanged.
2. Override `DoctorFilter.filter_queryset(self, queryset)`:
   - call `super()`;
   - collect the affiliation-level values from `self.form.cleaned_data`;
   - build one `DoctorAffiliation.objects.filter(doctor=OuterRef('pk'), <all conditions>)`;
   - apply `.filter(Exists(sub))`.
3. The `day` condition becomes `schedules__day_of_week__iexact`.

**P1.2.5 Geo caching.** `DivisionViewSet`, `DistrictViewSet` and `ThanaViewSet` are already unpaginated and `AllowAny`. Wrap their `list` with `cache_page(60 * 60 * 24)` via `method_decorator`. Confirm that `District` filters by `?division=<id>` and `Thana` by `?district=<id>` (they already do).

**P1.2.6 Location write path.** `LocationSerializer`:
- Make `thana` required on create (`required=True` in `extra_kwargs` for create). The simplest way is to validate in `validate()` when `self.instance is None`.
- Do not delete `input_area`/`input_district`/`_resolve_thana` yet (Part 3). Just stop relying on them: when `thana` is missing on create, return 400 `{"thana": ["This field is required."]}`.

**P1.2.7 Tests.** Create `tests/test_part1_geo_filters.py` covering:
- The multi-join regression: a doctor with a Dhaka chamber (fee 1000) and a Sylhet chamber (fee 300). `district_id=<Dhaka>&fee_max=500` → 0 results. `district_id=<Sylhet>&fee_max=500` → 1 result.
- `day=Monday` combined with `district_id` has to match the same chamber.
- `thana_id` on hospitals and diagnostic centers.
- `division_id=abc` → 400.
- Name params such as `district=Dhaka` are ignored, i.e. they return the unfiltered count (django-filter ignores unknown params).
- Facets with `district_id`.
- Update existing tests that used `district=`, `area=` or `location=` (check `tests/test_search_facets.py` and `tests/test_fixes.py`) to use IDs. Note each one in the commit message.

### Frontend
**P1.2.8 Geo hook.** Create `src/hooks/useGeo.js`, exporting:
- `useDivisions()`;
- `useDistricts(divisionId)`;
- `useThanas(districtId)`.

Each one calls the existing `api/geo.js` functions through `fetchWithDeduplicationAndCache` with a 24 h TTL and returns `{ items, isLoading, error }`. Option labels are `name` plus ` · bn_name` when `bn_name` exists.

**P1.2.9 Location filter component.** Rewrite `src/components/CascadingLocationFilter.jsx`:
- Props: `{ divisionId, districtId, thanaId, onChange }`.
- It emits `{ divisionId, districtId, thanaId }` as numbers or `null`.
- `null` means "all".
- Changing the division clears the district and thana; changing the district clears the thana.

**P1.2.10 Update every consumer of the static geo constants.** Files found by grep:
- `components/Footer.jsx`
- `components/TopUtilityStrip.jsx`
- `views/AdminDashboard/components/modals/DiagnosticModal.jsx`
- `views/AdminDashboard/components/modals/HospitalModal.jsx`
- `views/DiagnosticsSearch/components/DiagnosticsFilterSidebar.jsx`
- `views/DoctorSearch/components/DoctorFilterSidebar.jsx`
- `views/DoctorSearch/DoctorSearchPage.jsx`
- `views/Hospitals/HospitalsPage.jsx`

Rules for each file:
- State holds IDs.
- URL params become `division_id`, `district_id` and `thana_id`, and are parsed with `Number()`.
- Drop the "All Bangladesh" / "All Districts" / "All Areas" sentinels and all suffix stripping (`/\s*Division$/` etc.).
- API calls send only non-null IDs.
- The admin modals send `thana` (ID) when creating or editing a facility.
- Footer and TopUtilityStrip location links: if they link to "Doctors in <District>", build the link from the geo API with IDs. If that isn't practical, remove the location links. Do not keep hard-coded names.

**P1.2.11 API layer.** Update `services/api/doctors.js` `getDoctors`, `hospitals.js` `getHospitals` and `diagnosticCenters.js` `getDiagnosticCenters`:
- Replace the `location`/`division`/`district`/`area` params with `division_id`/`district_id`/`thana_id`.
- Remove the sentinel checks.
- Update the cache keys.

**P1.2.12 Home and App links.** Grep `src/App.jsx` and `views/Home/**` for URL building that uses `loc=`, `district=`, `division=` or `area=`, and convert it to ID params.

**P1.2.13 Delete the static geo constants.** From `src/data/constants.js`, delete `DIVISIONS`, `DIVISION_DISTRICTS`, `DISTRICT_THANAS`, `DISTRICT_ALIASES`, `ALL_DISTRICTS`, `CITY_THANAS` and `LOCATIONS`. Also delete any helper that only served them, such as `findDivisionForDistrict`, wherever it is defined.

**Gate:**
- `grep -rnE "DIVISIONS|DISTRICT_THANAS|DIVISION_DISTRICTS|DISTRICT_ALIASES|ALL_DISTRICTS|CITY_THANAS|All Bangladesh|All Districts|All Areas" doctors_hub/src` returns nothing.
- `grep -rn "DIST_ALIASES\|resolve_location_q" doctors_hub_backend --include=*.py | grep -v migrations` returns only `facilities/models.py` and `services/facilities.py`. Those are the legacy write-path resolvers, left for Part 3.
- Manual check: filtering doctors, hospitals and diagnostics by division → district → thana works, and a shared URL reloads the same filter.

---

## Phase 3 — Flat facility shape

**Goal:** the backend returns display-ready facility data. The frontend never reshapes it, and `flattenFacility` is deleted.

### Contract
**`FacilitySummary`.** This object is used everywhere a facility appears:
```json
{
  "id": "<location uuid>", "slug": "...", "location_type": "hospital|diagnostic_center|chamber",
  "ownership_type": "private|government|hospital_affiliated|ngo",
  "name": "Square Hospital", "branch": "Panthapath", "display_name": "Square Hospital (Panthapath)",
  "address": "18/F West Panthapath",
  "thana_id": 12, "area": "Dhanmondi", "area_bn": "ধানমন্ডি",
  "district_id": 3, "district": "Dhaka", "district_bn": "ঢাকা",
  "division_id": 1, "division": "Dhaka", "division_bn": "ঢাকা",
  "phone": "", "email": "", "logo": null, "image": null,
  "rating": 4.9, "reviews_count": 120, "is_verified": true, "is_active": true
}
```

**Top-level facility endpoints** are hospital and diagnostic-center list and detail. They return all `FacilitySummary` fields at the top level, plus their own fields:
- `description`, `tagline`, `badge`, `open_timing`;
- `category` as `{id, slug, name}` or `null`;
- `category_name`;
- `services` as `[{id, name, icon}]`;
- the hospital-specific fields.

`id` is the location UUID. `location_details` no longer exists.

**Referencing entities** are affiliations, facility tests and bookings. Each one gets a nested `"facility": FacilitySummary`. These alias fields are removed: `facility_name`, `center_name`, `hospital_name`, `branch` (top-level), `center_branch`, `district`, `division`, `area` (top-level) and `location_details`.

### Backend
**P1.3.1 Shared formatter.** Move `format_facility_name_sms` from `services/sms.py` into a new `core/text.py` as `format_facility_name(name, branch)`. Keep `services/sms.py` importing it under the old name so SMS code and `tests/test_facility_name_parity.py` keep working unchanged.

**P1.3.2 `display_name` property.** In `facilities/models.py`, add `Location.display_name` as a property returning `format_facility_name(self.name, self.branch)`.

**P1.3.3 Summary serializer.** Create `facilities/serializers_summary.py` with `FacilitySummarySerializer(serializers.ModelSerializer)`, read-only, with the fields above:
- `address` has `source='address_line'`.
- The geo fields read through `thana`, `thana.district` and `thana.district.division`.

It requires `select_related('thana__district__division')`. Add a docstring that says so.

**P1.3.4 Flatten hospital and diagnostic-center reads.** Rewrite the read side of `HospitalSerializer` and `DiagnosticCenterSerializer`:
- Remove `location_details`.
- Override `to_representation` to start from `FacilitySummarySerializer(instance.location).data`, then add the entity's own fields.
- Keep all write-only fields (`location_id`, `category_id`, `service_ids`, `test_category_ids`) and the existing `create`/`update` untouched.
- Do not remove `affiliated_doctors`/`offered_tests` in this phase (Phase 6 does).

**P1.3.5 Nested `facility` on referencing entities.** Replace the facility alias fields with `facility = FacilitySummarySerializer(source='location', read_only=True)` in:
- `doctors/serializers.py` → `DoctorAffiliationSerializer` (remove `location_details`, `facility_name`, `branch`, `district`, `division` and `area`);
- `tests/serializers.py` → `FacilityTestSerializer` (remove `location_details`, `facility_name`, `branch` and `facility_type`);
- `bookings/serializers.py`, all three booking serializers (remove `facility_name`, `branch`, `center_name`, `center_branch` and `hospital_name`).

For bookings the source paths are:
- `affiliation.location`;
- `facility_test.location`;
- `hospital.location`.

**P1.3.6 Query efficiency.** Add `select_related` or `Prefetch` so no new N+1 queries appear. Check `DoctorViewSet`, `DoctorAffiliationViewSet`, `FacilityTestViewSet`, the three booking viewsets, `HospitalViewSet`, `DiagnosticCenterViewSet` and `AdminInitAPIView`. Every `location` path must reach `thana__district__division`.

**P1.3.7 Search metadata.** `core/views.py` → `SearchMetadataAPIView`: serialize `facilities` with `FacilitySummarySerializer`, bump the cache key to `search_metadata_global_v4`, and keep the rest of the response unchanged for now.

**P1.3.8 Tests.** Create `tests/test_part1_facility_shape.py`:
- Hospital list and detail items include `display_name`, `district_id` and `address`, and do not include `location_details`.
- An affiliation has `facility.display_name`.
- A facility test has `facility.district`.
- A doctor booking has `facility.display_name`.
- `display_name` dedupes, using the existing parity cases.
- An `assertNumQueries` upper bound on `/api/doctors/?page_size=20` and `/api/hospitals/?page_size=20`. Measure first, then set the bound to the measured value.

### Frontend
**P1.3.9 Delete the reshaping helpers.** In `services/api/core.js`, delete `flattenFacility`. Remove every call to it in `services/api/*.js`; the grep count is about 19 call sites. API functions return the response as-is.

**P1.3.10 Fix consumers.** Grep `src/` for:

```
location_details|facility_name|center_name|hospital_name|center_branch|flattenFacility|formatFacilityName|category_name \|\||categoryName
```

Update every consumer:
- For a facility, read `x.display_name`, `x.address`, `x.district` and so on.
- For a referencing entity, read `x.facility.display_name` and so on.
- Delete the six-branch category resolver in `HospitalsPage.jsx` (`allHospitalsList`) and use `h.category_name`.
- Delete the `'Multi-Specialty'` and `'Verified Hospital'` fallbacks.

**P1.3.11 Remove the frontend formatter.** Delete `formatFacilityName` from `utils/facilityUtils.js` if nothing uses it after P1.3.10. If `facilityUtils.test.js` only tests it, delete that test and update the `test` script in `package.json` accordingly.

**Gate:**
- `grep -rnE "flattenFacility|location_details|center_name|hospital_name|center_branch" doctors_hub/src` returns nothing.
- The same grep on the backend (excluding migrations and tests) returns nothing, except the `center_branch` / `LabBooking` compatibility aliases, which stay for Part 3.
- Manual check: every page that shows a facility name shows it correctly: search results, cards, hospital detail, booking modals, the admin tabs and bookings.

---

## Phase 4 — Exact categories + specialty suggest

### Backend
**P1.4.1 Exact-match helper.** Create `core/filters.py` with `exact_slug_or_id_q(prefix, raw)`:
- Split `raw` on commas and strip each value.
- For each value, add `Q(**{f"{prefix}slug__iexact": v})`.
- If `uuid.UUID(v)` parses, also add `Q(**{f"{prefix}id": v})`.
- OR everything together.
- An empty value or `"all"` returns `None`, meaning no filter.

**P1.4.2 Apply it to every category filter.** Each one uses `exact_slug_or_id_q`, applies `.distinct()` only where it filters across a multi-valued relation, and gets rid of every `icontains` on a category name or slug:

| Filter | Prefix |
|---|---|
| `HospitalFilter.filter_category` | `category__` |
| `DiagnosticCenterFilter.filter_category` | `category__` |
| `DiagnosticCenterFilter.filter_testcat` | `location__offered_tests__test__category__` |
| `tests/views.py` `TestFilter.filter_category` | `category__` |
| `FacilityTestFilter.filter_category` | `test__category__` |

In `DiagnosticCenterFilter`, delete the `spec` and `owner` filters. Map `owner` usage to the existing `ownership_type`. Keep `categories` only if the frontend uses it (grep); otherwise delete it too.

**P1.4.3 Specialty suggest endpoint.** Add it as an `@action(detail=False, methods=['get'], url_path='suggest', permission_classes=[AllowAny], pagination_class=None, filter_backends=[])` on `DoctorSpecialtyViewSet`, backed by a new `doctors/services/specialty_suggest.py`.

- **Params:** `q` (required, 1–100 characters after stripping; otherwise 400) and `limit` (default 8, max 20).
- **Normalization:** `normalize_text(q)` from `specialty_resolver`.
- **Candidates:**
  - Verified `SpecialtyAlias.normalized`.
  - `DoctorSpecialty.name`, `canonical_name`, `bn_name` and `formal_name`, compared case-insensitively.
- **Match rank:** 0 = exact, 1 = starts with, 2 = contains. Use `__iexact` / `__istartswith` / `__icontains` queries, capped at 50 rows each.
- **Deduplication:** keep one entry per specialty, with its best rank and the term that matched.
- **Ordering:** rank, then `-doctor_count`, then `name`.
- **`doctor_count`:** from `specialty_doctor_counts()`, cached in the Django cache for 5 minutes under key `specialty_counts_v1`.

Response:
```json
[{"id":"…","slug":"cardiology","name":"Cardiology","bn_name":"হৃদরোগ","is_umbrella":false,
  "matched_term":"হৃদরোগ বিশেষজ্ঞ","match_language":"bn","doctor_count":42}]
```

**P1.4.4 Slim search metadata.** In `SearchMetadataAPIView`:
- Remove `search_terms` from `specialty_groups` (both levels) and from `specialties_az`.
- Remove the flat `specialties` alias list and `provider_types`.
- Bump the cache key to `v5`.

Do this only after P1.4.6 has removed all frontend readers; check with the grep in the gate.

**P1.4.5 Tests.** `tests/test_part1_suggest_and_categories.py`:
- Suggest ranking: exact alias beats prefix, which beats contains.
- A Bangla alias match.
- Deduplication across alias and name.
- Empty `q` → 400.
- Anonymous access → 200.
- Category exact match by slug and by UUID.
- A near-miss slug (`ct` when the real slug is `ct-scan`) → 0 results.
- A comma-separated multi-value filter.

### Frontend
**P1.4.6 Suggest hook.** Create `src/hooks/useSpecialtySuggest.js`, returning `{ items, isLoading }`:
- 200 ms debounce (reuse `useDebounce`).
- `AbortController` to cancel stale requests.
- A 60-second cache through `fetchWithDeduplicationAndCache`.

Replace local matching against `search_terms` in `views/Home/components/ThreeWayEngine.jsx`, `views/DoctorSearch/DoctorSearchPage.jsx`, `views/Hospitals/HospitalsPage.jsx` and `services/api/admin.js`. Admin screens that list aliases for editing keep using `/specialty-aliases/`.

**P1.4.7 Category slug resolution.** In `views/DiagnosticsSearch/hooks/useDiagnosticsSearch.js`, `normalizeCategorySlug` does an exact match of slug or id against the loaded `/test-categories/` list. If there's no match, it returns `'all'`. Remove the bidirectional substring matching everywhere it appears. Hospital and diagnostic-center category params send the category `slug`.

**Gate:**
- `grep -rn "search_terms" doctors_hub/src` returns nothing.
- `grep -rn "icontains" doctors_hub_backend/*/views.py | grep -i categ` returns nothing.

---

## Phase 5 — Diagnostics search endpoint

**Goal:** replace roughly 170 lines of client-side grouping, filtering, sorting and pagination in `useDiagnosticsSearch.js` with one server endpoint.

### Contract: `GET /api/facility-tests/search/`
This is public (`AllowAny`), not role-scoped, and read-only.

| Param | Semantics |
|---|---|
| `q` | One combined `icontains` over `test__name`, `test__code`, `test__sample_type`, `test__category__name`, `location__name`, `location__branch` and `location__address_line`. Searching a lab name returns only that lab's offerings (accepted behavior). |
| `testcat` | `exact_slug_or_id_q('test__category__', …)` from Phase 4. Alias `category`. |
| `division_id` / `district_id` / `thana_id` | Integers. No name params. |
| `location_id` | UUID of a single facility (used by Phase 6). |
| `fulfillment` | `home` → `home_sample_collection=True`; `center` → `False`; `all` or missing → no filter. |
| `ownership` | `private` / `government` / `hospital_affiliated` / `ngo`; `all` or missing → no filter. |
| `location_type` | Default `diagnostic_center`; `all` = any type. |
| `ordering` | `price` (default) or `-price`, both on `min_price`; `name` or `-name`. Tiebreak is always `test__name`, then `test_id`. |
| `page`, `page_size` | Default 4, max 50. A page past the end returns 200 with empty `results`, not 404. |
| `include_unavailable` | Default false. |
| `offering_limit` | Default 0, meaning all. |

**Always-on row filters:**
- `location__is_active=True`
- `test__is_active=True`
- `test__category__is_active=True`
- `is_available=True` (unless `include_unavailable`)

Response:
```json
{ "count": 368, "total_pages": 92, "page": 1, "page_size": 4, "next": "...", "previous": null,
  "facets": {
    "ownership":   {"private": 12, "government": 2, "hospital_affiliated": 3, "ngo": 1},
    "fulfillment": {"home": 14, "center": 4}
  },
  "results": [{
    "id": "<test uuid>", "name": "CBC", "slug": "...", "code": "",
    "category_id": "...", "category_name": "Hematology", "category_slug": "hematology",
    "description": "", "sample_type": "", "preparation_instructions": "",
    "fasting_required": false, "report_time_hours": 6,
    "min_price": "400.00", "max_price": "1200.00",
    "offering_count": 8, "location_count": 8, "home_collection_count": 6,
    "offerings": [{
      "id": "<facility_test uuid>",
      "facility": { FacilitySummary },
      "price": "1200.00", "discount_percent": "10.00", "calculated_price": "1080.00",
      "report_time": "Within 6 hours", "is_available": true,
      "home_sample_collection": true, "home_sample_charge": "100.00", "home_sample_note": ""
    }]
  }]
}
```

**Facet definition:** each facet dimension counts **distinct locations** over the rows filtered by every parameter **except that facet's own dimension**. The ownership facet ignores `ownership`; the fulfillment facet ignores `fulfillment`. That's two extra grouped queries.

Descriptive text fields come straight from the database. Empty stays empty; the frontend must not substitute text.

### Backend
**P1.5.1 Price expression.** Create `tests/pricing.py` with `net_price()`:

```
Round(F('price') - F('price') * Coalesce(F('discount_percent'), Value(Decimal('0'))) / Value(Decimal('100')), 2)
```

The output field is `DecimalField(max_digits=10, decimal_places=2)`. Add a test asserting it equals `FacilityTest.calculated_price` for discounts of 0, 10, 12.5 and 33.33, and for NULL.

**P1.5.2 Search service.** Create `tests/search.py`, made of pure functions with no DRF imports:
- `parse_params(query_params) -> dict`, which raises `ValueError` with a field name on bad ints, UUIDs or enum values; the view turns that into a 400.
- `build_row_qs(params, exclude=None)`, which returns a `FacilityTest` queryset with all filters, skipping the dimension named in `exclude` (used for facets).
- `build_grouped(row_qs, ordering)`, which returns `.values('test_id').annotate(min_price, max_price, offering_count=Count('id'), location_count=Count('location_id', distinct=True), home_collection_count=Count('id', filter=Q(home_sample_collection=True)))` plus the order.
- `hydrate(test_ids, row_qs, offering_limit)`, which returns `Test` objects with `select_related('category')` and a `Prefetch('offered_at', queryset=row_qs.select_related('location__thana__district__division').order_by('location__name'), to_attr='matching_offerings')`, in the page's order.
- `build_facets(params)`.

**P1.5.3 Serializers.** In `tests/serializers.py`, add `FacilityTestSearchOfferingSerializer` (using `FacilitySummarySerializer` for `facility`) and `FacilityTestSearchGroupSerializer`. Leave `FacilityTestSerializer` as it is.

**P1.5.4 Paginator.** Create `core/pagination.py` → `SearchPagination(PageNumberPagination)`:
- `page_size = 4`, `max_page_size = 50`, `page_size_query_param = 'page_size'`.
- Override `paginate_queryset` to catch `NotFound` and return an empty page.
- `get_paginated_response(data, facets)` returns the envelope above.

**P1.5.5 View.** Add the `search` action on `FacilityTestViewSet` in `tests/views.py`: `@action(detail=False, methods=['get'], url_path='search', permission_classes=[AllowAny], filter_backends=[])`. Do not call `get_queryset()` / `get_scoped_queryset` inside it. Add `extend_schema` with all params.

**P1.5.6 Tests.** Create `tests/test_facility_test_search.py` covering:
- Grouping by test ID, not name: two tests with the same name stay two groups.
- Two branches of the same lab both appear as offerings.
- Discount math and NULL-safety.
- `testcat` by slug and by UUID, plus a near-miss → 0.
- Geo by each ID level.
- `fulfillment` home and center.
- `ownership`.
- Inactive location, inactive test, inactive category and unavailable offering are all excluded.
- Ordering in both directions with a stable tiebreak.
- `count` and `total_pages` with filters applied.
- `page=99` → 200 and empty.
- Anonymous → 200.
- An offering at the 60th location is reachable.
- The facet excludes its own dimension.
- `assertNumQueries(<= 5)` for one page.

### Frontend
**P1.5.7 API function.** In `services/api/tests.js`, add `searchFacilityTests(params)`:
- Omit null or `'all'` values.
- Wrap it in `fetchWithDeduplicationAndCache` with key `fts_s1_${JSON.stringify(params)}` and a 60 s TTL.
- Return the envelope intact: no `ensureArray`.
- Cap `page_size` at 20.

**P1.5.8 Rewrite `useDiagnosticsSearch.js`.**
- Delete the `processedTests` memo, the client pagination (`pageSize = 4`, `paginatedTests` slicing), the `|| 500` prices, the default descriptions, the facility-name dedupe and the location post-filtering.
- One fetch effect, depending on `[debouncedSearchKeyword, selectedCategory, divisionId, districtId, thanaId, fulfillment, ownership, sortBy, currentPage]`.
- `sortBy` maps to `ordering`: `price_asc` → `price`, `price_desc` → `-price`.
- Expose `results`, `totalCount`, `totalPages`, `facets`, `isLoading` and `error`.
- Keep `handleBookTest`, but read `offering.facility` for the branch/facility object.

**P1.5.9 `DiagnosticsSearchPage.jsx` and its components.**
- Use `totalCount` from the API.
- Replace the hard-coded `ownershipCounts` object with `facets.ownership`.
- Render a skeleton while `isLoading`, an error state on `error`, and the empty state only when loaded with 0 results.
- In `DiagnosticsResultsHeader.jsx`, change the default sort prop `'relevance'` to `'price_asc'`.
- In `App.jsx`, remove the `?spec=` URL param that the hook never reads.

**Gate:**
- `/api/facility-tests/search/?page_size=4` is under 100 KB. Record the size next to the 6 MB baseline.
- In the frontend, `grep -n "processedTests\|500" doctors_hub/src/views/DiagnosticsSearch/hooks/useDiagnosticsSearch.js` finds no price fallback.
- Manual check: page 20+ is reachable, the ownership counts are real, and a lab with two branches shows both.

---

## Phase 6 — Hospital detail endpoints, drop embedded lists, remove hard-coded content

### Backend
**P1.6.1 Facility doctors endpoint.** Create a `FacilityDetailActionsMixin` in `facilities/views_facility_actions.py` and apply it to both `HospitalViewSet` and `DiagnosticCenterViewSet`. It provides `@action(detail=True, methods=['get'], url_path='doctors', permission_classes=[AllowAny])`.

**Important:** resolve the facility **without** `filter_queryset`. `SlugOrPkLookupMixin.get_object` applies the list filters, so `?search=` would 404 the facility. Write a helper `_get_facility_location(pk_or_slug)` that looks up by UUID or `location__slug` on the base model queryset.

- **Params:** `specialty` (slug or UUID, resolved with `resolve_specialty_exact` and expanded with `match_node_ids`), `search` (`icontains` over doctor `name`, `bn_name`, `qualification` and specialty names), `page` and `page_size` (default 12).
- **Result:** paginated **affiliations** at this location, where the doctor exists, ordered by doctor name.
- **Item shape:**
  - `affiliation_id`, `fee`, `chamber_type` and `schedules` (`[{id, day_of_week, start_time, end_time}]`);
  - `next_available` (filled in Phase 7; `null` until then);
  - `doctor`: `{id, slug, name, bn_name, academic_title, qualification, image, gender, bmdc_number, rating, review_count, primary_specialty: {slug, name, bn_name} | null}`.
- `bmdc_number` stays `null` when empty. Never generate one.
- **Facets:** `{"specialties": [{"slug","name","bn_name","count"}]}` counts distinct doctors per specialty among this location's affiliations, filtered by `search` but not by `specialty`, sorted by count descending.

**P1.6.2 Facility tests endpoint.** `@action(detail=True, url_path='tests')` on the same mixin. It calls the Phase 5 service with `location_id=<this facility>` and `location_type=all`, passes through `q`, `testcat`, `fulfillment`, `ordering` and `page`, and returns the same envelope.

**P1.6.3 Drop the embedded lists.** Remove `affiliated_doctors` and `offered_tests` (the `SerializerMethodField`s) from `HospitalSerializer` and `DiagnosticCenterSerializer`. Add:
- `doctor_count`: a `Subquery` count of affiliations at the location;
- `test_count`: a `Subquery` count of available facility tests at the location.

Annotate both in `HospitalViewSet.get_queryset` / `DiagnosticCenterViewSet.get_queryset` and in `AdminInitAPIView`'s base querysets. Delete the now-unused prefetches (`location__affiliations__…`, `location__offered_tests__…`).

**P1.6.4 Details-reviewed flag.**
- Add the model field `Hospital.details_reviewed = BooleanField(default=False)`. The migration leaves all existing rows at `False`.
- Expose it read/write in `HospitalSerializer`.
- Leave the placeholder defaults on the model as they are (product decision).

**P1.6.5 Tests.** Create `tests/test_part1_facility_actions.py`:
- The doctors endpoint paginates.
- The specialty filter uses umbrella expansion.
- The search doesn't 404 the facility.
- The facets ignore the specialty filter.
- `bmdc_number` is null when empty.
- The tests endpoint returns only that location's offerings.
- The hospital list payload has no `affiliated_doctors`/`offered_tests` and has `doctor_count`/`test_count`.
- `assertNumQueries` bounds on all three endpoints.

### Frontend
**P1.6.6 API functions.** Add `getFacilityDoctors(kind, idOrSlug, params)` and `getFacilityTests(kind, idOrSlug, params)`, where `kind` is `'hospitals'` or `'diagnostic-centers'`.

**P1.6.7 `HospitalDoctorsSection.jsx`.**
- Fetch from `getFacilityDoctors` with server-side search, specialty and pagination, using a "Load more" button or pager.
- Build specialty chips from `facets.specialties`.
- Delete:
  - `STITCH_DEFAULT_DOCTORS`, `specialtyCountMap` and the hard-coded `specialties` array;
  - the fake `bmdc_number`, `opd_room`, `chamber_room` and `availability_text`;
  - the default schedule string, the fee fallback `2000`, the default qualification and the `'Square Hospital'` fallback.
- Show the BMDC number only when it is non-empty.

**P1.6.8 `HospitalDiagnosticsSection.jsx`.**
- Fetch from `getFacilityTests` with server-side search and pagination.
- Delete `STITCH_FEATURED_DIAGNOSTICS`, `'Square Hospital'` and the static "Home Sample Collection Available" badge. Show the badge only if `facets.fulfillment.home > 0`.
- Delete the static marketing sentences that describe capabilities the data doesn't state ("operating 24 hours daily", "molecular genomics", …). Replace them with a neutral section title.

**P1.6.9 `HospitalDetailPage.jsx` and the hero/bed sections.**
- Delete the hard-coded Square Hospital fallback object, and show a not-found or error state instead.
- In `HospitalShowcaseHero.jsx`, `HospitalBedMonitorSection.jsx` and `HospitalAdmissionInfoSection.jsx`, remove every literal fallback (`|| 650`, `?? 4`, `|| 48`, `|| 24`, `|| 'JCI …'` and similar). Render the API value, and hide the element when the value is null or empty.

**P1.6.10 Admin updates.**
- `HospitalsPage.jsx` uses `doctor_count` / `test_count`.
- `AdminDashboard/.../modals/DiagnosticModal.jsx` stops reading `editingDiagnostic.offered_tests`. It loads the center's tests from `GET /api/facility-tests/?location=<id>`, following `next` until it's null.
- In `HospitalsTab.jsx`, show a "Needs review" badge when `details_reviewed` is false.
- `HospitalModal.jsx` gets a "Details verified" checkbox bound to `details_reviewed`.

**P1.6.11 Home page fallbacks.**
- Delete `FALLBACK_TEST_CATS` (`ThreeWayEngine.jsx`), `FALLBACK_TEST_CATEGORIES` and `FALLBACK_CENTER_CATEGORIES` (`DiagnosticsSection.jsx`), `FALLBACK_HOSPITAL_CATEGORIES` (`DoctorMonitorGrid.jsx`) and `FALLBACK_SPECIALTIES` (`SpecialtyGrid.jsx`).
- While loading, show a skeleton. On error, show a small retry message.
- Remove the name-based `'All Categories'` filter hacks where the list now comes straight from the API.

**Gate:**
- `grep -rnE "STITCH_|FALLBACK_|Square Hospital|BMDC A-|OPD-|\|\| 650|\|\| 2000" doctors_hub/src` returns nothing.
- Hospital list size recorded against the baseline.
- Manual check: hospital detail with search, a specialty chip, and doctor and test paging.

---

## Phase 7 — Sessions, serials & availability

**Goal:** the backend owns availability. Patients book a **session** on a date and get a **serial number** and an **estimated time**. Admins control sessions, capacity, consult time and per-date exceptions.

### Concepts
- **Weekly session:** the existing `AffiliationSchedule` (day, start, end), plus capacity and average consult minutes.
- **Exception:** a per-date override for an affiliation. It can cancel a weekly session, modify one (hours or capacity), or add an extra session.
- **Session key:** an opaque string identifying one bookable session on a date, `"s:<schedule_id>"` for weekly or `"x:<exception_id>"` for extra. Bookings count against capacity by `(affiliation, date, session_key)`, so changing a session's hours later doesn't orphan existing bookings.
- **Booked count:** bookings with status other than `cancelled`.
- **Serial:** the max serial in the session plus 1. Serials are never reused.
- **Estimated time:** `session_start + booked_before * avg_consult_minutes`. For today's sessions, it is never earlier than now rounded up to 5 minutes.
- **Timezone:** all date and "now" logic uses `Asia/Dhaka`.

### Backend
**P1.7.1 Timezone.** In `core/settings.py`, set `TIME_ZONE = 'Asia/Dhaka'` (`USE_TZ` stays `True`). Use `timezone.localdate()` and `timezone.localtime()` everywhere in the new code.

**P1.7.2 Model changes (`doctors`).**
- `AffiliationSchedule`: add `max_patients = PositiveSmallIntegerField(default=30)` and `avg_consult_minutes = PositiveSmallIntegerField(default=10)`, each validated to be at least 1.
- `DoctorAffiliation`: add `advance_booking_days = PositiveSmallIntegerField(default=14)`.
- Remove `DoctorAffiliation.status_label` (migration drops the field).
- New model `ScheduleException`:
  - `id` (uuid7), `affiliation` (FK, CASCADE, `related_name='schedule_exceptions'`), `date` (DateField, indexed);
  - `kind` (`cancel` | `modify` | `extra`);
  - `schedule` (FK to `AffiliationSchedule`, null; required for `cancel`/`modify`, must be null for `extra`);
  - `start_time`, `end_time`, `max_patients` and `avg_consult_minutes` (all nullable; required for `extra`, optional overrides for `modify`);
  - `note` (CharField, blank), `created_at`.
  - Constraint: `UniqueConstraint(fields=['affiliation', 'date', 'schedule'], condition=Q(schedule__isnull=False), name='uniq_exception_per_session_date')`.

**P1.7.3 Model changes (`bookings`).** On `DoctorBooking`:
- Add `session_key` (CharField 64, null, db_index), `session_start` (TimeField, null), `session_end` (TimeField, null) and `estimated_time` (TimeField, null).
- Add `schedule` (FK `AffiliationSchedule`, SET_NULL, null) and `schedule_exception` (FK `ScheduleException`, SET_NULL, null).
- Replace the constraint `unique_doctor_date_serial` with `UniqueConstraint(fields=['affiliation', 'date', 'session_key', 'serial_number'], name='unique_serial_per_session')`.
- Data migration for existing rows:
  - parse `slot` (`%H:%M`, `%H:%M:%S`, `%I:%M %p`) into `estimated_time`;
  - find the affiliation's schedule for that weekday whose time range contains it, and set `schedule`, `session_key`, `session_start` and `session_end`;
  - leave the new fields null if there's no match.
- Then remove the `slot` field in a second migration.
- In `DoctorBooking.save()`, remove the serial assignment and the `full_clean()` call. The model's `clean()` no longer validates the slot. `services/scheduling.py::validate_slot_against_schedule` becomes unused; delete it and its imports.

**P1.7.4 Availability service.** Create `doctors/services/availability.py`:
- `resolve_sessions(affiliation, date, schedules, exceptions) -> list[Session]`. This is a pure function. It starts from the weekly schedules for that weekday, applies `cancel` / `modify`, and appends `extra`. `Session` is a dataclass with `key`, `start`, `end`, `capacity`, `avg_minutes`, `schedule_id`, `exception_id`, `cancelled` and `note`.
- `get_availability(affiliation, start_date, days) -> dict`:
  - one query each for schedules, exceptions in the range, and booked counts plus max serial grouped by `(date, session_key)`;
  - dates before today are skipped;
  - dates beyond `advance_booking_days` are excluded.
- **Session status:**
  - `closed`: cancelled by an exception;
  - `ended`: today, and now is at or after the end;
  - `full`: booked is at or above capacity;
  - otherwise `available`.
- `batch_next_available(affiliations, days=7) -> dict[affiliation_id, NextAvailable|None]`. This works for many affiliations with a constant number of queries (3), and is used by list endpoints.

**P1.7.5 Availability endpoint.** `GET /api/affiliations/{id}/availability/?from=YYYY-MM-DD&days=7`: an `@action(detail=True, permission_classes=[AllowAny])` on `DoctorAffiliationViewSet`.
- Resolve the affiliation without role scoping (a public read).
- `from` defaults to today and can't be in the past. `days` is 1–30.

Response:
```json
{
  "affiliation_id": "…", "doctor_id": "…", "facility": { FacilitySummary }, "fee": "800.00",
  "timezone": "Asia/Dhaka",
  "next_available": {"date":"2026-10-01","session_key":"s:…","session_start":"17:00","estimated_time":"18:40","remaining":12},
  "dates": [{
    "date": "2026-10-01", "weekday": "Thursday",
    "sessions": [{
      "session_key": "s:…", "session_start": "17:00", "session_end": "21:00",
      "capacity": 30, "booked": 18, "remaining": 12, "next_serial": 19,
      "estimated_time": "18:40", "status": "available", "note": ""
    }]
  }]
}
```
Dates with no sessions are included with `"sessions": []`, so the UI can show "No chamber".

**P1.7.6 Booking service.** Create `bookings/services.py` → `create_doctor_booking(validated, user)`, run inside `transaction.atomic()`:
1. `DoctorAffiliation.objects.select_for_update().get(pk=…)`.
2. The date must be at least today and within `advance_booking_days`. Resolve the session by `session_key` with `resolve_sessions`. If the key is unknown or the session is `closed`, `ended` or `full`, return 400 with a clear message.
3. Recount booked sessions, compute the serial and `estimated_time`, and snapshot `session_start`/`session_end`, `schedule` and `schedule_exception`.
4. Create the booking with `status='pending'` regardless of input.
5. Send the confirmation SMS through `transaction.on_commit`.

Keep the existing patient resolution and OTP handling exactly as they are now; that's Part 2 scope.

**P1.7.7 Booking serializer.** `DoctorBookingSerializer`:
- Write fields: `affiliation_id`, `date`, `session_key`, `patient_name`, `patient_phone`, `patient_age`, `gender`, `notes`, `otp_code`.
- Remove `slot` and the `appointment_time` / `appointment_date` / `affiliation` alias mapping from `to_internal_value`.
- `status` is read-only on create. Admin `PATCH` can still change it.
- Read fields add `session_key`, `session_start`, `session_end`, `estimated_time` and `serial_display`.
- `create()` calls the service.
- Update `services/sms.py` doctor-booking text to use the serial and the estimated time. Grep `\.slot` across the backend and fix every reader.

**P1.7.8 Schedule exceptions API.** `ScheduleExceptionViewSet` at `/api/schedule-exceptions/`:
- Filters `affiliation`, `date_from` and `date_to`.
- Permissions and scoping mirror `AffiliationScheduleViewSet` exactly: same `permission_classes`, `RoleScopedQuerysetMixin`, `scope_location_field='affiliation__location_id__in'`, `scope_doctor_field='affiliation__doctor__user'`, and the same `perform_create` role checks.

Serializer validation:
- `date` is at least today.
- The fields required for each `kind` are present.
- `start < end`.
- An `extra` session or a `modify` with new hours must not overlap any other session of the **same doctor** on that date across all affiliations. Reuse the interval logic from the existing schedule conflict check.

The response for `cancel` or `modify` includes `affected_bookings` (a count of non-cancelled bookings on that session and date). Existing bookings are not auto-cancelled in Part 1.

**P1.7.9 `next_available` on lists.** In `DoctorAffiliationSerializer`, add a `next_available` read field that comes from `self.context['next_available_map']` (default `None`). Populate the map with `batch_next_available` for the page's affiliations in:
- `DoctorViewSet.list` and `retrieve`;
- the Phase 6 facility doctors action.

**P1.7.10 Tests.** Create `tests/test_part1_availability.py`, using time-freezing via `unittest.mock.patch` on `django.utils.timezone.now`. Cover:
- a weekly session appears on the right weekday;
- a cancel exception → `closed`;
- a modify exception changes hours and capacity;
- an extra session appears;
- `advance_booking_days` enforced;
- a past date → 400;
- full capacity → booking 400;
- serials increment per session and restart per session;
- a cancelled booking frees capacity but its serial isn't reused;
- `estimated_time` math, including today's "not before now" rule;
- `status` in the payload is ignored (always `pending`);
- changing a weekly session's hours keeps existing bookings counted (same `session_key`);
- a status change on an old booking after a schedule change succeeds (regression);
- an exception overlapping another affiliation's session is rejected;
- anonymous availability → 200;
- `batch_next_available` uses at most 3 queries for 20 affiliations.

Concurrency: create two bookings for the last remaining place in separate transactions. Use `TransactionTestCase` and threads; if that's flaky on CI, mark it `@pytest.mark.slow` and document it. Exactly one succeeds.

### Frontend
**P1.7.11 Booking widget.** `DoctorProfile/components/DoctorBookingWidget.jsx`:
- Delete `generateSlotsForSchedule`, the fake `slotsLeft` values and the hard-coded fallback slot lists.
- Fetch `GET /affiliations/{id}/availability/?days=7` (add `getAffiliationAvailability` in `services/api/doctors.js`, not cached, or cached 30 s at most).
- Date chips come from `dates[]`, showing remaining capacity or status.
- Session cards come from `sessions[]` (start–end, "Serial #N · approx. HH:MM", disabled when not available).
- The selected value is `session_key`.
- Display times in 12-hour format with `formatDisplayTime` from `utils/scheduleUtils.js`; send nothing but `session_key`.

**P1.7.12 Booking modal.** `components/BookingModal.jsx`:
- Remove the `'05:15 PM'` default and the `doctor.slots` UI.
- Receive `affiliationId`, `date` and `sessionKey` from the widget.
- Submit `{affiliation_id, date, session_key, patient_*, otp_code}`.
- Show the returned `serial_display`, `estimated_time` and session window.
- Remove the `serialNum || 1` fallback: if the response has no serial, treat it as an error.

**P1.7.13 Cards.** `DoctorCard.jsx`, `DoctorChamberCard.jsx` and `HospitalDoctorsSection.jsx`:
- Replace `status_label` and "Available Today" text with `next_available`, rendered as "Next: Thu 1 Oct · 5:00 PM · 12 left", or "No sessions in the next 7 days" when it is null.
- Remove default schedule strings such as `'17:00'`–`'21:00'`.

**P1.7.14 Admin.**
- `DoctorScheduleManager.jsx`: add `max_patients` and `avg_consult_minutes` inputs to create and edit.
- New component `AdminDashboard/components/doctor/ScheduleExceptionsPanel.jsx`: lists the next 60 days of exceptions for an affiliation; creates cancel, modify or extra entries; deletes them; shows `affected_bookings` after save.
- In the affiliation editor, add `advance_booking_days`.
- `DoctorModal.jsx`: remove the `status_label` input.
- `BookingsTab.jsx`: show date, session window, serial and estimated time instead of `slot`.

**Gate:**
- `grep -rnE "slotsLeft|generateSlotsForSchedule|status_label|05:15 PM|Available Today" doctors_hub/src` returns nothing.
- `grep -rn "status_label\|validate_slot_against_schedule\|\.slot\b" doctors_hub_backend --include=*.py | grep -v migrations` returns nothing.
- Manual end-to-end check: an admin sets a Thursday session with capacity 2, then adds a cancel exception for the next Thursday. As a patient, book twice (serials 1 and 2), and the third attempt is blocked. The cancelled Thursday shows as closed.

---

## Phase 8 — Doctor onboarding duplicate protection

**Goal:** keep the two steps (a global doctor, then per-location affiliations) and prevent duplicate doctors and duplicate affiliations.

### Backend
**P1.8.1 Lookup filters.** In `DoctorFilter`, add `bmdc = CharFilter(field_name='bmdc_number', lookup_expr='iexact')`.

**P1.8.2 Unique affiliation.**
- First, run a check query for duplicate `(doctor, location)` pairs in `DoctorAffiliation`. If any exist, stop and report them; do not delete data.
- If there are none, add `UniqueConstraint(fields=['doctor', 'location'], name='unique_doctor_location')`.
- `DoctorAffiliationSerializer.validate` returns a clean 400 message ("This doctor is already affiliated with this facility") instead of an IntegrityError.

**P1.8.3 Tests.**
- `?bmdc=` finds a doctor case-insensitively.
- A duplicate affiliation → 400.
- Creating a doctor with an existing `bmdc_number` → 400 (already unique; assert the message is readable).

### Frontend
**P1.8.4 `AffiliateDoctorDrawer.jsx` as a two-step flow.**
- **Step 1, "Find existing doctor":** search by BMDC number (`?bmdc=`) or name (`?search=`, 300 ms debounce), with an "Attach" action on each result.
- **Step 2, "Create new doctor":** only offered when step 1 finds nothing.

**P1.8.5 Retry safety.** In `onboardFacilityDoctor`:
- Keep the created doctor's ID in component state as soon as `createDoctor` succeeds.
- If `createDoctorAffiliation` fails, show "Doctor profile created, but linking to this facility failed", with a **Retry link** button that calls only `createDoctorAffiliation` using the stored ID.
- Never call `createDoctor` twice in one drawer session.

**Gate:** Manual check.
1. Create a doctor through the drawer, then simulate an affiliation failure. The simplest way is to temporarily point the facility to an invalid ID in dev tools.
2. Retry. There should be exactly one doctor row.
3. Attaching the same doctor again shows the duplicate message.

---

## Phase 9 — Final sweep

**P1.9.1 Remeasure.** Re-run the Phase 0 measurements and append an after-column to `docs/part1-baseline.md`.

**P1.9.2 Full checks.** Run the full backend suite, `spectacular --validate`, `npm run build` and `npm test`.

**P1.9.3 Re-run all phase greps.** Every one must still return what its gate says.

**P1.9.4 Frontend status notes.** Write `docs/part1-api-changes.md` listing every endpoint added, changed or removed, and every removed field or param, so the Flutter patient app can follow the same contract.

**P1.9.5 Merge summary.** Open one merge summary in `docs/part1-agent-notes.md`: what was done, deviations and open questions.

---

## Explicitly out of scope for Part 1 (do not do)

Part 2 items not already folded into a phase above:
- the patient-record overwrite and phone normalization;
- price snapshots on bookings;
- silent geo fallback in the Location write path (`_resolve_legacy_geo`, `services/facilities._resolve_thana`);
- the 500-default test prices in `_attach_category_tests`;
- the role property bugs (`is_facility_staff`, `is_super_admin`);
- facet/list search mismatch beyond geo;
- cache invalidation;
- the synchronous SMS for test and hospital-service bookings.

All Part 3 redundancy cleanup:
- duplicate `/api/v1/` routes and duplicate booking routes;
- the `LabBooking` aliases;
- the one-off management commands;
- renaming the `tests` app.

Security, OTP and credentials.
