# Versioning implementation — agent notes

Plan: `doctors_hub_backend/plan/Doctors Hub — API Versioning Implementation Plan.md`
Working method: no git; per-task entries below; backups of heavily rewritten files in `backups/versioning/`.

---

### V.0.1 — Baseline

- files changed: none (read-only).
- summary: recorded the pre-change suite and schema baseline.
- commands:
  - `venv/bin/python -m pytest -q` (doctors_hub_backend, Postgres) → **342 passed**, 50 warnings, 126s. One teardown warning (`database "test_doctors_hub" is being accessed by other users`) is pre-existing and non-fatal.
  - `venv/bin/python manage.py spectacular --file /tmp/schema.before.yml` → exit 0; **208 total paths**, **102** start with `/api/v1/` (matches the plan snapshot).

### V.0.2 — Handler inventory

- files changed: `doctors_hub_backend/core/devtools.py` (new; `kwarg_unsafe_handlers()` verbatim from plan V.1.2).
- summary: ran the inventory helper in `manage.py shell`; it found **25** kwarg-unsafe handlers, exactly the plan snapshot list:
  - `accounts.views`: `FacilityStaffDeleteAPIView.delete`, `FacilityStaffListCreateAPIView.get/.post`, `PlatformAdminListCreateAPIView.get/.post`, `VerificationApproveRejectAPIView.post`, `VerificationQueueAPIView.get`
  - `accounts.views_roles`: `UserRoleViewSet.search_users`, `UserRoleViewSet.user_permissions`, `my_permissions`
  - `bookings.views`: `DoctorBookingViewSet.transition`, `HospitalServiceBookingViewSet.transition`, `TestBookingViewSet.transition`, `patient_lookup`, `send_otp`, `verify_otp`
  - `doctors.views`: `DoctorAffiliationViewSet.availability`, `DoctorSpecialtyViewSet.suggest`, `DoctorViewSet.chambers`, `SpecialtyAliasViewSet.batch_verify/.counts/.verify`
  - `facilities.views_facility_actions`: `FacilityDetailActionsMixin.doctors/.tests`
  - `tests.views`: `FacilityTestViewSet.search`
- commands: `manage.py shell -c "from core.devtools import kwarg_unsafe_handlers; ..."` → count=25 (list above).

### V.0.3 — Cached responses

- files changed: none (read-only inventory).
- summary: response-body caches found (for Phase 8):
  1. `core/views.py` `SearchMetadataAPIView` — `cache.get/set` key `search_metadata:v{public_cache_version()}` (lines ~84/180).
  2. `core/views.py` `SearchFacetsAPIView` — `cache.get/set` key `search_facets:v{public_cache_version()}:…` (lines ~224/258).
  3. `facilities/views.py` — `@method_decorator(cache_page(60*60*24), name='list')` on `DivisionViewSet`, `DistrictViewSet`, `ThanaViewSet` (geo viewsets).
- Non-response caches (not in scope for Phase 8): `core/rbac.py` permission caches, `doctors/services/specialty_suggest.py` counts, `doctors/services/specialty_relations.py` taxonomy version, `core/cache_keys.py` version counter itself.
- commands: `rg "cache\\.(get|set|incr)|cache_page|@cache"` → 22 matches, classified above.

---

### V.1.1 — Fix handler signatures

- files changed: `doctors_hub_backend/accounts/views.py`, `accounts/views_roles.py`, `bookings/views.py`, `doctors/views.py`, `facilities/views_facility_actions.py`, `tests/views.py`.
- summary: added `**kwargs` to the 25 kwarg-unsafe handlers found in V.0.2 (7 in accounts/views.py — `def get(self, request)` matched 2 handlers via replaceAll; 3 in accounts/views_roles.py with `*args, **kwargs` on the `@api_view` function `my_permissions`; 4 in bookings/views.py (`transition` ×3 via replaceAll + `send_otp`/`verify_otp`/`patient_lookup` with `*args, **kwargs`); 6 in doctors/views.py; 2 in facilities/views_facility_actions.py; 1 in tests/views.py). No logic changed.
- commands: none (edits only).

### V.1.2 — Guard helper

- files changed: `doctors_hub_backend/core/devtools.py` (already created in V.0.2; function used as-is).
- summary: re-ran `kwarg_unsafe_handlers()` after the V.1.1 edits.
- commands: `manage.py shell -c "... kwarg_unsafe_handlers() ..."` → **count=0** (was 25).

### V.1.3 — Guard test

- files changed: `doctors_hub_backend/tests/test_api_versioning.py` (new) — `test_every_handler_accepts_version_kwarg` asserts `kwarg_unsafe_handlers() == []` with the list in the failure message.
- summary: guard test added.
- commands: `venv/bin/python -m pytest -q` → **343 passed** (342 baseline + 1 new), 50 warnings, 125s.

**Phase 1 gate:** guard passes (`kwarg_unsafe_handlers() == []`); full suite **343 passed** (same count as V.0.1 plus the new test). Gate: PASS.

---

### V.2.1 — DRF settings

- files changed: `doctors_hub_backend/core/settings.py`.
- summary: added `URLPathVersioning` config (`DEFAULT_VERSIONING_CLASS`, `DEFAULT_VERSION='v1'`, `ALLOWED_VERSIONS=('v1',)`, `VERSION_PARAM`) to `REST_FRAMEWORK`, and the plain constants `API_FROZEN_VERSIONS = ()` / `API_RETIRED_VERSIONS = ()` below it (D7 / Phase 7).
- commands: none (edits only).

### V.2.2 — One route module

- files changed: `doctors_hub_backend/core/api_urls.py` (new).
- summary: all API routes moved from `core/urls.py` into `core/api_urls.py` with names unchanged (accounts/facilities/doctors/tests/bookings includes + `search-metadata`, `search/metadata` alias, `search-facets`, `admin/dashboard-init`).
- commands: none (edits only).

### V.2.3 — Root URLconf

- files changed: `doctors_hub_backend/core/urls.py` (backup at `backups/versioning/core/urls.py`).
- summary: rewrote API mounts in order: admin; schema/docs/redoc (unversioned); `re_path(r'^api/(?P<version>v\d+)/', include('core.api_urls'))` canonical; `path('api/', include('core.api_urls'))` legacy alias. Old double mount deleted. `re_path` used so `/api/doctors/` is not captured as version='doctors'.
- commands: none (edits only).

### V.2.4 — Versioning tests

- files changed: `doctors_hub_backend/tests/test_api_versioning.py` (4 new tests: legacy/v1 doctors parity on `count`+results ids; `request.version == 'v1'` on both mounts via `renderer_context`; `/api/v2/doctors/` 404; non-500 smoke on the 6 formerly kwarg-unsafe patient endpoints through `/api/v1/` — `specialties/suggest`, `facility-tests/search`, `affiliations/{id}/availability`, `hospitals/{slug}/doctors`, `bookings/patients/lookup`, `bookings/otp/send` with `send_sms_via_sms_bd` mocked to avoid a real HTTP call).
- summary: versioning behavior tests added.
- commands:
  - `pytest tests/test_api_versioning.py -q` → **5 passed**.
  - `pytest -q` → **347 passed** (343 + 4 new), 50 warnings, 132s.
  - `manage.py spectacular --api-version v1 --file /tmp/schema.v1.yml --validate` → **exit 0** (Warnings: 94 (61 unique), Errors: 42 (6 unique) — pre-existing annotation warnings, fixed in Phase 4).
  - manual `curl -i` (runserver 127.0.0.1:8765): `GET /api/v1/doctors/` → **200**; `GET /api/doctors/` → **200**; `GET /api/v2/doctors/` → **404** (server log confirms "Not Found: /api/v2/doctors/").

**Phase 2 gate:** suite **347 passed**; `spectacular --validate` exit 0; manual 200/200/404 observed. Gate: PASS.

---

### V.3.1 — Rewrite test URLs

- files changed: `scripts/canonicalize_test_urls.py` (new, re-runnable); 31 files under `doctors_hub_backend/tests/test_*.py` + `doctors_hub_backend/bookings/tests.py` (rewritten literals).
- summary: ran the script; **442 replacements in 32 files** (per-file counts in the script output; plan snapshot hinted at 34 files — actual is 32 with legacy literals + `test_api_versioning.py` skipped). Skips `tests/test_api_versioning.py` and `tests/test_legacy_alias.py`.
- commands: `python3 scripts/canonicalize_test_urls.py` → TOTAL: 442 replacements in 32 files.

### V.3.2 — Legacy alias test

- files changed: `doctors_hub_backend/tests/test_legacy_alias.py` (new).
- summary: 6 parametrized GETs (doctors, hospitals, specialties, search-metadata, divisions, facility-tests search) assert legacy `/api/…` and `/api/v1/…` return the same status and the same data (`results`+`count` when paginated). **Deviation/fix during gate:** the first full-suite run had **1 failure** — `test_legacy_alias_matches_v1[/api/divisions/]` failed because the geo viewsets are `cache_page`'d by full URL and an earlier test had left a stale `/api/v1/divisions/` cache entry (locmem cache persists across tests in one pytest process). Passed in isolation. Fixed by adding `cache.clear()` to the test fixture (test-side only); rerun green. This is a pre-existing cross-test cache hazard, not a product bug.
- commands:
  - `pytest -q` (before fix) → **1 failed, 352 passed** (divisions case).
  - `pytest "tests/test_legacy_alias.py::...divisions..."` in isolation → 1 passed (confirmed cross-test cache pollution).
  - `pytest -q` (after fixture fix) → **353 passed** (347 + 6), 51 warnings, 110s.
  - gate grep `grep -rnP "[\"']/api/(?!v1/|schema/|docs/|redoc/|app-config/)" doctors_hub_backend/tests doctors_hub_backend/bookings/tests.py` (after clearing stale `__pycache__/*.pyc`, which still contained old literals) → only lines in `tests/test_legacy_alias.py` and `tests/test_api_versioning.py` (the two skipped files). Gate condition met.

**Phase 3 gate:** suite **353 passed** (same count as Phase 2 + 6 new); grep shows legacy literals only in the two skipped files. Gate: PASS (after the one honest fixture fix above).

---

### V.4.1 — Schema shows versioned paths only

- files changed: `doctors_hub_backend/core/schema_hooks.py` (new — `only_versioned_paths` keeps `/api/vN/`/`{version}` + app-config, drops the legacy alias); `core/settings.py` (`SCHEMA_PATH_PREFIX` → `r'/api(?:/v\d+)?'`, `PREPROCESSING_HOOKS` registered).
- summary: preprocessing hook drops legacy alias paths from the schema.
- commands: `manage.py spectacular --api-version v1` → **106 paths, 0 legacy** (baseline v1 set: 102; +4 = the loose core endpoints `search-metadata`, `search/metadata`, `search-facets`, `admin/dashboard-init` which V.2.2 correctly moved into the versioned mount — "in old v1 not in new: []", nothing removed).

### V.4.2 — Patient surface defined

- files changed: `doctors_hub_backend/core/api_contract.py` (new — `PATIENT_SURFACE` (29 ops) and `UNVERSIONED_SURFACE = [('GET', '/api/app-config/')]` per plan).
- summary: every PATIENT_SURFACE entry checked against the generated schema (paths use `{id}`/`{location}` exactly as listed in the plan) — **all present, no stop-and-report condition**.

### V.4.3 — Undocumented function views

- files changed: `doctors_hub_backend/bookings/schema_serializers.py` (new — `SendOtpRequest/ResponseSerializer`, `VerifyOtpRequest/Success/FailureSerializer`, `PatientLookupQuery/ResponseSerializer`, mirroring exactly what the views read/return today, schema-only); `bookings/views.py` (extend_schema request/responses/parameters on `send_otp`, `verify_otp`, `patient_lookup`).
- summary: the 3 "unable to guess serializer" errors for surface views are gone (remaining 3 are non-surface: `CookieTokenRefreshAPIView`, `LogoutAPIView`, `my_permissions`). Views were NOT switched to these serializers for validation.

### V.4.4 — Typed method fields + enum naming

- files changed: `core/schema_serializers.py` (new — shared leaves: `SpecialtyRef/ParentRef/Display`, `NextAvailable`, `SearchFacets`+ownership/fulfillment); `doctors/serializers.py` (+`SpecialtySuggestionSerializer`, `AvailabilitySession/DateSerializer`, `AffiliationAvailabilitySerializer`; `@extend_schema_field` on 13 methods: `get_doctor_count`, `get_parents`, DoctorSerializer `get_specialty_display/get_primary_specialty/get_specialties/get_match_rank/get_match_tier/get_is_primary_match`, `DoctorAffiliationSerializer.get_next_available`, `ChamberLeanSerializer.get_next_available`, DoctorListSerializer `get_primary_specialty/get_specialties/get_match_rank`); `facilities/serializers_summary.py` (`get_logo`/`get_image` → `URLField(allow_null=True)`; +`FacilityDoctor*` response shapes for the facility doctors action); `facilities/models.py` (`Location.display_name` property decorated `@extend_schema_field(serializers.CharField())`); `tests/serializers.py` (+`FacilityTestSearchResponseSerializer` envelope); `doctors/views.py` (`suggest` + `availability` response schemas); `facilities/views_facility_actions.py` (doctors/tests action response schemas); `tests/views.py` (search action response schema); `doctors/models.py` (inline gender choices extracted to `GENDER_CHOICES` so they are addressable); `core/settings.py` (`ENUM_NAME_OVERRIDES`: `DoctorGenderEnum` → `doctors.models.GENDER_CHOICES`, `PatientGenderEnum` → `bookings.models.Patient.Gender`).
- summary: all 16 surface-view type-hint warnings fixed with `@extend_schema_field` describing the values actually returned (incl. `allow_null=True` where None is possible); gender enum collision resolved — components are now `DoctorGenderEnum`/`PatientGenderEnum` with no hash suffixes. Custom-shape actions (suggest/availability/facility doctors/tests/search) previously advertised WRONG inferred response schemas (`DoctorSpecialty`, `DoctorAffiliation`, `Hospital`, `DiagnosticCenter`, `FacilityTest`); they now mirror the real payloads.
- commands: `manage.py spectacular --validate` → exit 0; surface-view warnings **0** (all remaining warnings are non-surface admin/RBAC views).

### V.4.5 — Schema matches reality

- files changed: `doctors_hub_backend/tests/test_schema_matches_responses.py` (new — `convert_nullable` + cycle-guarded `resolve_refs`, then every PATIENT_SURFACE GET + each POST with a valid payload called through `/api/v1/` and validated against the operation's 2xx schema with `jsonschema`; fixture data includes the null cases: doctor with no primary specialty, chamber with no upcoming session, facility with no logo).
- **Annotation bugs found by the checker and fixed (per "fix the annotation, never the response"):**
  1. `core/views.py` `SearchFacetsResponseSerializer` declared 7 fields the view never returns — the existing test asserts the "slim contract: only hospital_categories". Slimmed the serializer to the real shape (`hospital_categories: [{id, slug, name, hospital_count}]`).
  2. Conditional count fields (`test_count`/`center_count`/`hospital_count`) are declared `required=False` but responses omit them when the queryset is not annotated — drf-spectacular's readOnly→required rule made them required in the schema. Set `COMPONENT_NO_READ_ONLY_REQUIRED: True` (read-only ≠ guaranteed present); the new response-only shape serializers were declared without `read_only` to stay fully required.
  3. `bookings/serializers.py` ×3: `user` (FK `booked_by_user`) and `patient` (FK) are `null=True` but annotated non-nullable — anonymous bookings return `"user": null`. Added `allow_null=True` (read-only fields; zero behavior change).
  4. `GET /specialties/` returns a plain array (custom `list()` paginates only when `page` is passed) but the schema auto-generated a paginated envelope. Annotated `responses={200: DoctorSpecialtySerializer(many=True)}` and suppressed the schema-time paginator via a schema-class subclass (`_get_paginator -> None`; method-level kwargs are not applied at runtime — verified in DRF routers: only `@action` kwargs merge into initkwargs). The `?page=1` paginated variant is noted in the operation description but is outside the documented contract.
  5. Test-side only: hospital-service booking requires `hospital.services.add(service)` (400 otherwise) — fixture fix.
- summary: both tests pass — every surface operation's live response validates against its schema.
- commands: `pytest tests/test_schema_matches_responses.py -q` → **2 passed**.

**Phase 4 gate:** schema **106 paths / 0 legacy**; **0** type-hint or guess-serializer warnings for surface views; `test_schema_matches_responses.py` passes for every surface operation; full suite **355 passed** (353 + 2). `spectacular --validate` exit 0 (3 unique non-surface errors remain: CookieTokenRefresh/Logout/my_permissions — intentionally out of D5 scope). Gate: PASS.

---

### V.5.1 — Snapshot

- files changed: `docs/api/openapi.v1.json` (new — generated with `SchemaGenerator(api_version='v1').get_schema(request=None, public=True)`, written `sort_keys=True, indent=2`).
- summary: committed v1 contract snapshot, **106 paths**.
- commands: `manage.py shell` (json.dump) → paths: 106.

### V.5.2 — Comparator

- files changed: `doctors_hub_backend/core/contract_diff.py` (new — pure `breaking_changes(old_schema, new_schema, surface)`; resolves `$ref` with a cycle guard and merges `allOf` before comparing so renamed components are never reported; applies D9: operation removed / success code changed; param removed / became required / new required param / enum value removed; request new required property / property removed / type or format changed / enum value removed; response property removed / no longer required / became nullable / type or format changed / enum value added; array items recurse with the same rules).
- summary: message format matches the plan example — `v1 GET /doctors/ 200 results[].primary_specialty: became nullable` (version + method + surface path + status + JSON path). **Deviation caught during tests:** suffix-based path lookup was ambiguous (`/doctors/` also matched `/hospitals/{location}/doctors/`); replaced with exact `re.fullmatch(r'/api/v\d+' + path)`.
- commands: none (pure module, exercised by V.5.4).

### V.5.3 — Check script

- files changed: `scripts/check_api_contract.py` (new — loops `REST_FRAMEWORK['ALLOWED_VERSIONS']`; frozen versions: breaking changes print as `BREAKING` and exit 1 (`--update` cannot override); unfrozen: printed as `WARNING`; any snapshot difference exits 1 with "snapshot out of date, run with --update"; `--update` rewrites the snapshot. Bootstraps `doctors_hub_backend/venv` site-packages when run with a bare `python3`.)
- summary: check implemented per plan steps 1-5.
- commands: `python3 scripts/check_api_contract.py` → **exit 0** (first run exposed `ALLOWED_VERSIONS` living inside `REST_FRAMEWORK` — fixed; and a `Path.relative_to` crash in the `--update` log line — fixed).

### V.5.4 — Contract tests

- files changed: `doctors_hub_backend/tests/test_api_contract.py` (new — 23 tests: one unit test per V.5.2 table row incl. request format change and array-item recursion; additive changes / new endpoint / new optional param report nothing; renamed component with the same structure reports nothing; the current tree matches `docs/api/openapi.v1.json`; with `override_settings(API_FROZEN_VERSIONS=('v1',))` and a monkeypatched generator dropping a `DoctorList` property, `main([]) == 1` AND `main(['--update']) == 1` with the snapshot left untouched (the script's DOCS dir is redirected to a tmp_path so tests can never corrupt the real snapshot)).
- summary: full table coverage; fixes during bring-up were message-format alignment (`200 jsonpath` spacing per the plan example) and a bad test kwarg.
- commands: `pytest tests/test_api_contract.py -q` → **23 passed**.

**Phase 5 gate:** `python scripts/check_api_contract.py` → **exit 0**; contract tests **23 passed**; full suite **378 passed** (355 + 23). Gate: PASS.

---

### V.6.1 — Settings and system check

- files changed: `doctors_hub_backend/core/settings.py` (14 new env-driven settings per plan: `APP_{ANDROID,IOS}_{MIN_BUILD,LATEST_BUILD,STORE_URL}`, `APP_UPDATE_MESSAGE_{EN,BN}`, `API_DEPRECATE_LEGACY`, `API_DEPRECATIONS`, `API_SUNSETS`, `API_USAGE_LOG`; plus explicit import registering `core.checks` since `core` is not an installed app); `core/checks.py` (new — system check `core.E002`: `API_DEPRECATIONS`/`API_SUNSETS` keys must be `legacy` or `vN`, values must parse as ISO dates).
- summary: config surface + validation in place, all defaults safe (no gate, no deprecation).

### V.6.2 — View

- files changed: `doctors_hub_backend/core/app_client.py` (new — frozen `AppClient` dataclass with `from_headers()`; only `android`/`ios` and positive-integer builds count, invalid values are absent, never 400 — also used by Phase 7); `core/views_app_config.py` (new — `AppConfigAPIView` with `AllowAny` **and empty `authentication_classes`** (expired JWT must not block the update check), `Cache-Control: public, max-age=300`, and the exact plan body: `api.{current_version,supported_versions,deprecations}`, `platforms.{android,ios}.{min_supported_build,latest_build,store_url}`, `update_message.{en,bn}`, `client` (null without headers; `status` = `update_required` below min / `update_available` below latest / `ok`), `server_time` (localtime ISO). `api.deprecations` keys = supported ∪ retired ∪ configured `vN` keys (the `legacy` key is server-alias config, not app contract; values from `API_DEPRECATIONS`/`API_SUNSETS`). Response schema serializers declared alongside, tag `App`).
- summary: endpoint implemented; contract additive-only by construction.

### V.6.3 — Routing and schema

- files changed: `doctors_hub_backend/core/urls.py` (`path('api/app-config/', …)` mounted unversioned BEFORE the versioned mount, not in `core/api_urls.py` — so `/api/v1/app-config/` 404s); `docs/api/openapi.v1.json` (regenerated via `check_api_contract.py --update`, additive).
- summary: endpoint reachable at `/api/app-config/` only; in `UNVERSIONED_SURFACE` (already declared in V.4.2).
- commands: `python3 scripts/check_api_contract.py` → 1 "snapshot out of date" (expected, additive); `--update` → exit 0; re-check → **exit 0**.

### V.6.4 — Tests

- files changed: `doctors_hub_backend/tests/test_app_config.py` (new — 9 tests: body shape matches the plan contract; `Authorization: Bearer garbage` → 200 not 401; `/api/v1/app-config/` → 404; `client.status` below/equal to min and below/equal to latest (two override blocks); invalid `X-App-*` values → `client: null`; `core.E002` fires on bad date and bad key and passes on well-formed config).
- summary: all app-config behaviors pinned.
- commands:
  - `pytest tests/test_app_config.py -q` → **9 passed**.
  - `pytest -q` → **387 passed** (378 + 9), 130s.
  - manual `curl -i /api/app-config/` → **200** with `Cache-Control: public, max-age=300`; with `X-App-Platform: android` + `X-App-Build: 1` → body shows `client: {platform: android, build: 1, status: ok}` (min build 0 = no gate); `curl /api/v1/app-config/` → **404**.

**Phase 6 gate:** tests pass (**387 passed** total); contract check **exit 0**; manual curl confirms the contract, the cache header and the 404 on the versioned path. Gate: PASS.

---

### V.7.1 — Client middleware

- files changed: `doctors_hub_backend/core/middleware.py` (new — `ApiClientMiddleware`, registered in `MIDDLEWARE` directly after `CommonMiddleware` (inside `CorsMiddleware`, so 426s keep CORS headers); `core/settings.py` (MIDDLEWARE entry + `api.usage` logger at INFO in LOGGING).
- summary: request side identifies the client (`request.app_client = AppClient.from_headers`), derives the version key (`vN` from `^/api/(v\d+)`, else `legacy` = `DEFAULT_VERSION` for gating), answers **426 `api_version_retired`** (`{code, detail, update: <platform block or null>, message: {en, bn}}`) for retired versions before DRF can 404, and **426 `app_update_required`** (`{code, min_supported_build, store_url, message: {en, bn}}`) when the build is below the platform minimum. No headers → never gated. Response side sets `Deprecation: @<unix>` (RFC 9745), `Sunset: <HTTP-date>` (`django.utils.http.http_date`), a `Link: <…>; rel="successor-version"` for legacy (same path under `/api/v1/`, query string kept) or for `vN`→`vN+1` only when allowed, and logs one `api.usage` INFO line with `resolver_match.route` (template only — never the raw path), platform, build and status. Never touches `/api/app-config/`, `/api/schema/`, `/api/docs/`, `/api/redoc/`. **Bug found in bring-up:** `date.replace(tzinfo=…)` raised `TypeError` (needs `datetime.combine`); fixed in middleware and test helper.
- commands: none (edits only).

### V.7.2 — Middleware tests

- files changed: `doctors_hub_backend/tests/test_api_client_middleware.py` (new — 11 tests: below-min 426 body equals the plan contract; equal-to-min 200; no headers / `X-App-Build: abc` / wrong platform pass; app-config, schema, docs never gated; retired v1 → 426 `api_version_retired` on BOTH mounts with platform block when headers present; deprecation header formats (`@<unix>`, HTTP-date) and the legacy Link keeping `?page=2`; headers absent when unconfigured; `vN`→`vN+1` Link only when the successor is in `ALLOWED_VERSIONS`; 426 with `Origin` still carries `Access-Control-Allow-Origin`; one `api.usage` line with the route template and no raw IDs).
- summary: all plan behaviors pinned. **Test-technique note:** the usage-log test originally monkeypatched `propagate=True`, which double-captured records (pytest attaches its capture handler to root *and* every non-propagating logger — see `_pytest/logging.py catching_logs`); dropping the monkeypatch gives exactly one record per emission.
- commands:
  - `pytest tests/test_api_client_middleware.py -q` → **11 passed**.
  - `pytest -q` → **398 passed** (387 + 11), 109s — the suite sends no app headers, so nothing is gated, exactly as planned.
  - manual curl (runserver with `APP_ANDROID_MIN_BUILD=10`, `APP_ANDROID_LATEST_BUILD=20`, store URL, messages, `API_DEPRECATE_LEGACY=True`, `API_DEPRECATIONS='legacy=2026-12-01'`, `API_SUNSETS='legacy=2027-03-01'`):
    - `GET /api/v1/doctors/` with `X-App-Build: 5` → **426 Upgrade Required**, body `{"code": "app_update_required", "min_supported_build": 10, "store_url": "https://play/store", "message": {"en": "Please update", "bn": "আপডেট করুন"}}`;
    - `X-App-Build: 10` → **200**; no headers → **200**;
    - `GET /api/doctors/?page=2` → `Deprecation: @1796083200`, `Sunset: Mon, 01 Mar 2027 00:00:00 GMT`, `Link: <http://127.0.0.1:8767/api/v1/doctors/?page=2>; rel="successor-version"`;
    - `GET /api/v1/doctors/` → **0** deprecation headers (v1 unconfigured);
    - usage log lines show route templates (`api/doctors/$`, `^api/(?P<version>v\d+)/doctors/$`) with no raw IDs.

**Phase 7 gate:** tests pass (**398 passed** total, suite ungated as expected); manual curl confirms 426 gating, header formats and usage logging. Gate: PASS.

---

### V.8.1 — Version-aware cache keys

- files changed: `doctors_hub_backend/core/cache_keys.py` (+`versioned_key(request, base)` → `f"{base}:{request.version}"`); `core/views.py` (both response caches from V.0.3 now go through it: `search_metadata:v{cache_version}` and `search_facets:v{cache_version}:…` become `…:v1`). `cache_page` on the geo viewsets already keys on the full URL — no change needed.
- summary: response caches are namespaced per API version (D11).

### V.8.2 — Serializer switch (ready for v2, unused)

- files changed: `doctors_hub_backend/core/versioning.py` (new — `VersionedSerializerMixin` with `serializer_classes = {'v1': {'list': A, 'default': B}}`; `get_serializer_class()` resolves the action (or `default`) for `request.version`, falls back to the nearest **lower** version that has an entry, then `super()`); `tests/test_api_versioning.py` (+3 tests: a v1 request writes a cache key containing `:v1` and caches the body; the mixin resolves exact/nearest-lower/super with two fake versions under `override_settings` on `ALLOWED_VERSIONS`; unused `serializer_classes` falls back to super).
- summary: mixin implemented and unit-tested with a dummy viewset; NOT applied to any real view (per plan).
- commands:
  - `pytest tests/test_api_versioning.py -q` → **8 passed**.
  - `pytest -q` → **401 passed** (398 + 3).
  - `python3 scripts/check_api_contract.py` → **exit 0** (contract unchanged).

**Phase 8 gate:** tests pass (**401 passed**); contract check **exit 0**. Gate: PASS.

---

### V.9.1 — Web base URL

- files changed: `doctors_hub/src/services/api/core.js` (fallback default → `'http://localhost:8000/api/v1'`); `doctors_hub/.env.example` (both `VITE_API_BASE_URL` lines — local and the Vercel comment — now end in `/api/v1`).
- summary: verified the two `http://localhost:8000` prefix sites (`services/api/hospitals.js`, `services/api/tests.js`): they only prefix when `BASE_URL` is relative; with the http(s) default they use `BASE_URL` directly, producing `/api/v1/...` ✓. The web app sends no `X-App-*` headers (correct per D6).

### V.9.2 — CORS

- files changed: `doctors_hub_backend/core/settings.py` (`CORS_EXPOSE_HEADERS = ['Deprecation', 'Sunset', 'Link']` so browser code can read them).

### V.9.3 — Deploy config

- files changed: `doctors_hub_backend/.env.example` (all Phase 6/7 keys with one-line comments and safe defaults); `render.yaml` (build numbers `value: "0"`, `API_DEPRECATE_LEGACY` `"False"`, `API_USAGE_LOG` `"True"`, store URLs / messages / `API_DEPRECATIONS` / `API_SUNSETS` `sync: false`).
- summary: config surface documented for both environments. `doctors_hub_backend/.env` untouched (gitignored, local only).

### V.9.4 — Owner actions (agent cannot do these)

1. Set `VITE_API_BASE_URL` in the **Vercel** project settings to the `/api/v1` URL and redeploy.
2. Set the new variables in the **Render** dashboard (store URLs, update messages, and later `API_DEPRECATIONS`/`API_SUNSETS`/`API_DEPRECATE_LEGACY` when a sunset is announced).

**Phase 9 gate:**
- `npm run build` → **pass** (pre-existing chunk-size warning only); `npm test` → **23 pass / 0 fail**.
- `grep -rn "localhost:8000/api'" doctors_hub/src doctors_hub/.env.example` → **no matches** (exit 1, expected).
- manual (API-level equivalent of the UI walkthrough, since a browser click-through is not possible for the agent): against a live backend via the web app's `/api/v1` base — home (`search-metadata`, `search-facets`, `doctors`, `hospitals` → 200/200/200/200), doctor search (`doctors/?search=` → 200), doctor profile + availability (200/200), diagnostics search (`facility-tests/search/` → 200), booking modal (`patients/lookup/` → 200, `otp/send/` with an intentionally invalid body → 400 to avoid a real SMS side effect). `api.usage` log: **12 lines, all `v1`, 0 `legacy`** ✓. **Owner please click through the actual UI once** (home → doctor search → profile → diagnostics → booking modal to OTP send) for visual confirmation.

**Phase 9 gate:** build+test pass, grep clean, manual API-level walkthrough shows `v1` everywhere. Gate: PASS (with the browser click-through noted as owner verification).

---

### V.10.1 — VERSIONING.md (Flutter half)

- files changed: `docs/api/VERSIONING.md` (new); `scripts/generate_surface_list.py` (new — renders the endpoint list from `core/api_contract.py` between marker comments in VERSIONING.md; `core/api_contract.py` is pure data so the script needs no Django).
- summary: base URL + per-request headers (`X-App-Platform`, `X-App-Build`, `Authorization`); app-start flow with the `client.status` decision table (`ok` / `update_available` / `update_required`); 426 handling for both `code` values with the screen each shows; the patient-surface list **generated, not typed**; tolerant-parsing rules (ignore unknown fields, enum `unknown` fallback, only `required` fields non-nullable); `docs/api/openapi.v1.json` as source of truth for Dart codegen.

### V.10.2 — VERSIONING.md (backend half)

- files changed: `docs/api/VERSIONING.md` (same file).
- summary: D9 breaking-change list (mirrors `core/contract_diff.py`); freeze-day checklist (D7: add `'v1'` to `API_FROZEN_VERSIONS`, run the contract check, set `APP_ANDROID_MIN_BUILD` to the first store build); the v2 playbook (D11: add to `ALLOWED_VERSIONS`, change only the edge via `VersionedSerializerMixin`, generate `openapi.v2.json`, expand-then-contract DB rule); retiring a version (D12: deprecate → sunset → retire, 6-month minimum, usage logs).

### V.10.3 — CHANGELOG.md

- files changed: `docs/api/CHANGELOG.md` (new — newest first; first entry records v1 introduction, the legacy alias, app-config, client gating and the contract tooling).

### V.10.4 — API_REFERENCE.md base paths

- files changed: `docs/API_REFERENCE.md`.
- summary: all endpoint mentions rewritten to `/api/v1/…`; docs endpoints (`/api/docs/`, `/api/redoc/`, `/api/schema/`) kept unversioned; the "Base URLs & Versioning" section now states `/api/v1/` is canonical and the `/api/` alias is deprecated; added the `426 Upgrade Required` row to the error table. **Pre-existing staleness flagged for the owner (outside V.10.4 scope, not touched):** the `search-facets` section still shows an aspirational response example and old query params — the real slim contract is in `docs/api/openapi.v1.json` (the source of truth).

**Phase 10 gate:** `docs/api/VERSIONING.md`, `docs/api/CHANGELOG.md` exist and `docs/API_REFERENCE.md` is updated; `python3 scripts/generate_surface_list.py` re-run → "already up to date" (endpoint list matches `core/api_contract.py` exactly). Gate: PASS.

---

### V.11.1 — Full checks (plan section 0.3)

- files changed: none.
- summary: all commands re-run on the final tree.
- commands:
  - `python manage.py migrate` → "No migrations to apply" (zero migrations in this plan ✓).
  - `python -m pytest -q` → **401 passed**, 53 warnings, 109s.
  - `manage.py spectacular --api-version v1 --file /tmp/schema.v1.yml --validate` → **exit 0**.
  - `python ../scripts/check_api_contract.py` → **exit 0**.
  - `manage.py check --deploy` (DEBUG=False) → 28 issues, **0 errors** (all pre-existing W-level deploy-hardening warnings: SSL redirect/HSTS/cookie/referrer flags from the `if not DEBUG` block and the synthetic test SECRET_KEY). Not introduced by this plan.
  - `npm run build` → pass (pre-existing chunk-size warning); `npm test` → **23 pass / 0 fail**.
- Phase gate checks re-verified: guard `kwarg_unsafe_handlers() == []`; legacy-alias grep clean; schema-matches-reality 2 passed; contract table 23 passed; app-config 9 passed; middleware 11 passed.

### V.11.2 — Schema numbers

- files changed: none.
- summary: v1 schema **107 paths** = **106** under `/api/v1/` + **1** unversioned `/api/app-config/` (D4). **Legacy alias paths in the schema: 0.** Against the plan's expected hint (108 = 107 + app-config) we are 1 path short; the difference traces to the V.4.1 diff — the hint's snapshot had 107 v1 paths, this tree has 106, with zero paths missing relative to the v1 baseline ("in old v1 not in new: []") and every PATIENT_SURFACE operation present (asserted by `test_every_surface_operation_exists_in_schema`). Baseline for comparison (V.0.1): 208 total / 102 v1 / 106 unversioned-mixed.

### V.11.3 — End-to-end manual script

- files changed: none (temporary drill edits to `core/settings.py` and `facilities/serializers_summary.py` were made and fully reverted — verified by the contract check returning to exit 0 and by re-grepping the reverted lines).
- summary and observed values (runserver 127.0.0.1:8770 with `API_DEPRECATE_LEGACY=True`, `API_DEPRECATIONS='legacy=2026-12-01'`, `API_SUNSETS='legacy=2027-03-01'`, `APP_ANDROID_MIN_BUILD=10`, messages set):
  1. `GET /api/v1/doctors/` → **200**, no `Deprecation`/`Sunset`/`Link` headers.
  2. `GET /api/doctors/?page=2` → **200**, `Deprecation: @1796083200`, `Sunset: Mon, 01 Mar 2027 00:00:00 GMT`, `Link: <http://127.0.0.1:8770/api/v1/doctors/?page=2>; rel="successor-version"`.
  3. `GET /api/v2/doctors/` → **404**.
  4. `GET /api/app-config/` with `X-App-Platform: android`, `X-App-Build: 5` → **200**, `client = {platform: android, build: 5, status: update_required}`.
  5. Same headers on `GET /api/v1/doctors/` → **426** `app_update_required`.
  6. `override_settings(API_RETIRED_VERSIONS=('v1',))` (local, via `manage.py shell`) → `GET /api/v1/doctors/` and `GET /api/doctors/` both **426 `api_version_retired`**; after the override exits, the same request is 200 again (settings auto-reverted). *Note:* the shell test client needed `HTTP_HOST=localhost` (local `ALLOWED_HOSTS` has no `testserver`).
  7. `check_api_contract.py` → exit 0 (baseline); with `API_FROZEN_VERSIONS=('v1',)` temporarily set and `district_id` temporarily removed from `FacilityMiniSerializer` → **exit 1** with `BREAKING v1 GET /doctors/ 200 results[].chambers[].facility.district_id: property removed` (naming the field); after reverting both → **exit 0** again. *Note:* the first drill attempt only removed the field from `Meta.fields` while keeping its declaration, which raises `AssertionError` at serializer build — the drill is done by removing declaration + fields entry.

### V.11.4 — Summary

**What changed per phase** (detail in the per-task entries above):

- **Phase 0–1**: baseline (342 tests, 208/102 schema paths); 25 kwarg-unsafe handlers inventoried and fixed; permanent guard test.
- **Phase 2**: `URLPathVersioning` settings (`v1` allowed, `DEFAULT_VERSION=v1`); routes moved to `core/api_urls.py`; root URLconf mounts `re_path('^api/(?P<version>v\d+)/')` canonical + `/api/` legacy alias; `/api/v2/` 404s. Suite now runs on `/api/v1/` (442 literals rewritten in 32 files, re-runnable script).
- **Phase 3**: legacy-alias parity test (6 endpoints).
- **Phase 4**: schema hooks (0 legacy paths), `core/api_contract.py`, schema-only serializers for OTP/patient-lookup + custom-shape actions, 13 `@extend_schema_field` annotations, gender enum naming fixed, and `tests/test_schema_matches_responses.py` validating live responses against the schema (found and fixed 5 real annotation bugs — see V.4.5).
- **Phase 5**: `docs/api/openapi.v1.json` snapshot, `core/contract_diff.py` (D9 table as code), `scripts/check_api_contract.py`, 23 contract tests.
- **Phase 6**: `GET /api/app-config/` (unversioned, permanent, auth-tolerant) + `core.E002` config check + 9 tests.
- **Phase 7**: `core.middleware.ApiClientMiddleware` (client identification, 426 upgrade gate, 426 retired versions, RFC 9745 `Deprecation`/`Sunset`/`Link` headers, `api.usage` logging) + 11 tests.
- **Phase 8**: version-namespaced response cache keys; `VersionedSerializerMixin` ready for v2 (not applied).
- **Phase 9**: web base URL → `/api/v1`, `CORS_EXPOSE_HEADERS`, `.env.example` + `render.yaml` config.
- **Phase 10**: `docs/api/VERSIONING.md` (Flutter + backend halves), generated surface list, `docs/api/CHANGELOG.md`, `API_REFERENCE.md` base paths.
- **Phase 11**: full green sweep + end-to-end manual script.

**Deviations from the plan** (all recorded inline above):

1. Phase 3: `cache.clear()` added to the legacy-alias test fixture (stale `cache_page` entries from earlier tests made parity flaky) — test-side only.
2. Phase 4: annotation fixes driven by the new reality-checker (slim `SearchFacetsResponseSerializer`, `COMPONENT_NO_READ_ONLY_REQUIRED`, `allow_null` on booking `user`/`patient`, unpaginated `/specialties/` array schema + schema-time paginator suppression). Each is a schema-annotation change only — no response shape changed.
3. Phase 5: path lookup made exact (`re.fullmatch`) after suffix matching proved ambiguous; message format aligned to the plan's `200 jsonpath` spacing.
4. Phase 7: `date.replace(tzinfo=…)` TypeError fixed (needs `datetime.combine`); test used pytest's auto-attachment to non-propagating loggers instead of a `propagate` monkeypatch.
5. Phase 6: `api.deprecations` keys include retired and configured `vN` keys (not `legacy`), so old apps keep seeing dates for their version.
6. Phase 11.3: the frozen-contract drill needed declaration + `Meta.fields` removal together.
7. V.11.2: schema has 107 paths vs the plan's expected-108 hint (see above; nothing missing).

**Skipped / partial:**

- Phase 9's manual gate is partially owner-side: the API-level equivalent of the UI walkthrough was executed (12 screen-equivalent calls, all `v1`, 0 `legacy`), but an actual browser click-through is left to the owner (recorded in V.9.4).
- Non-surface schema warnings (`UserSerializer`/`UserProfileSerializer`/`ScheduleExceptionSerializer` method fields) and 3 "unable to guess serializer" errors (`CookieTokenRefreshAPIView`, `LogoutAPIView`, `my_permissions`) remain — outside the frozen surface (D5) and out of this plan's scope.

**Open questions** (unchanged from the plan, for the owner): patient sign-in/refresh on mobile (cookie-based `auth/refresh/` is browser-shaped); the 6-month support window (D12); whether iOS ships at launch.

**Owner actions (V.9.4):**

1. Set `VITE_API_BASE_URL` in **Vercel** to the `/api/v1` URL and redeploy.
2. Set the new variables in the **Render** dashboard (store URLs, update messages; later `API_DEPRECATE_LEGACY`/`API_DEPRECATIONS`/`API_SUNSETS` when a sunset is announced).
3. Click through the web app UI once (home → doctor search → profile → diagnostics → booking modal to OTP send) for visual confirmation of V.9.1.
4. Review the stale `search-facets` example in `docs/API_REFERENCE.md` (pre-existing; out of V.10.4 scope).

**Final state:** `pytest` **401 passed**; contract check **exit 0**; schema **107 paths / 0 legacy alias paths**; `npm run build` + `npm test` (23) green.
