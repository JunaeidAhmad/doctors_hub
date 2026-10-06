# Doctors Hub — API Versioning Implementation Plan

Oct 5, 2026&#32;

## Summary

This plan makes `/api/v1/` the real, frozen contract for the Flutter patient app. It adds a way to force old app builds to upgrade, and a CI check that fails when a change would break phones already in the field. It does not change any existing response shape.

Repo: `https://github.com/JunaeidAhmad/doctors_hub` · Backend: `doctors_hub_backend/` (Django 5.2, DRF 3.17, drf-spectacular 0.30, Postgres) · Frontend: `doctors_hub/` (React + Vite).

**Why a new plan.** The previous draft was checked by applying it to a copy of the repo:

- **Captured `version` kwarg crashes handlers.** The `re_path(r'^api/(?P<version>v\d+)/')` mount passes `version=` to every view. 25 handlers don't accept it and raise `TypeError` (found by walking the URLconf; see V.0.2). With the draft applied, the unchanged suite had 7 failures and the suite run through `/api/v1/` had 64. Adding `**kwargs` to those handlers made all 326 tests pass through `/api/v1/`.
- **`SCHEMA_PATH_PREFIX` doesn't de-duplicate the schema.** It only controls tag generation; the schema still had 214 paths (107 legacy + 107 v1). A preprocessing hook brought it to 107.
- **Version-independent app-config.** App-config was versioned, so an app on a retired version could never learn it must update.
- **Contract gaps in the schema.** The OTP and patient-lookup endpoints have no request or response schema, and many `SerializerMethodField`s are typed as plain `string`. A schema-based contract check can't protect what the schema doesn't describe.

**Scope.** The versioning mechanism, the client-version gate, the contract check and the documentation. Part 4 bug fixes are separate. They can change v1 shapes freely until v1 is frozen on the day the first Flutter build ships (decision D7).

## 0. Rules for the agent (read first, apply always)

### 0.1 Working method (no git)

1. **Do not use git.** No branches, commits, stashes, resets or `git diff`. Edit files directly in the working copy. Where a check needs a before/after comparison, use the scripts this plan creates, not git.
2. **Change log instead of commits.** Before starting, copy any file you will rewrite heavily into `backups/versioning/<path>` (create the folder; keep it out of any deploy). After every numbered task, append to `docs/versioning-agent-notes.md`:
   - `### V.<phase>.<task>`;
   - files changed (paths);
   - a one-line summary;
   - commands run, with their result (pass/fail counts, not "OK").
3. **Honesty.** Describe only what you changed. A skipped or partial task is written down as skipped or partial, with the reason. A gate that fails is recorded as failed, with numbers. The final summary may only contain things traceable to the per-task entries.
4. **Read before editing.** Open and read each file in full first. Line numbers and counts in this plan are hints from a snapshot (commit `627dfd8`). If they don't match, find the code by name.
5. **Stop and report** (write to the notes, then stop) when:
   - a file, function, route or setting named here does not exist;
   - an instruction contradicts the code;
   - an existing test needs a changed expectation that this plan doesn't call for;
   - a gate fails twice after honest fix attempts.
6. Do not refactor, rename or reformat anything outside the current task.

### 0.2 Hard constraints

- **No response-shape changes.** This plan adds endpoints, headers and schema annotations. It must not add, remove, rename or retype any field in an existing response, or change any existing query param. Type annotations (`@extend_schema_field`, `extend_schema`) describe what is already returned; they never change it.
- **No database migrations.** Nothing in this plan needs one. If you think one is needed, stop and report.
- **No new dependencies.** PyYAML ships with drf-spectacular; everything else is the standard library.
- **Do not touch** OTP logic (including the `123`/`123456` bypass), JWT/auth flows, SMS credentials, or rating/review values.
- **The suite stays green after every task**, on Postgres.

### 0.3 Commands

```bash
cd doctors_hub_backend
python manage.py migrate
python -m pytest -q                                   # on Postgres
python manage.py spectacular --api-version v1 --file /tmp/schema.v1.yml --validate
python ../scripts/check_api_contract.py               # created in Phase 5
python manage.py check --deploy                       # with DEBUG=False

cd doctors_hub
npm run build
npm test
```

### 0.4 Gate template

Every phase gate means all of the following, recorded in the notes with numbers:

- `pytest` passes (count of passed tests);
- `spectacular --validate` exits 0;
- `npm run build` passes (from Phase 9 on);
- the phase's own checks return what they say;
- the manual checks are done and described (endpoint, status, the header or body value seen).

## Decisions already made (do not revisit)

| # | Topic | Decision |
| --- | --- | --- |
| D1 | Versioning style | URL path, via DRF `URLPathVersioning`. `ALLOWED_VERSIONS = ('v1',)`, `DEFAULT_VERSION = 'v1'`. Header, query-param and date-based versioning were rejected: harder to cache, debug and use from Flutter. |
| D2 | The `version` kwarg | Every API handler accepts it (`**kwargs`), enforced by a guard test. A custom versioning class that avoids capturing the kwarg was rejected, because drf-spectacular's per-version schema and DRF's versioned `reverse()` both rely on the captured kwarg. |
| D3 | Canonical path | `/api/v1/` is canonical. The bare `/api/` alias stays for now and resolves to v1. It is hidden from the schema and gets deprecation headers once enabled. Removing it is a later, separate decision. |
| D4 | App config | `GET /api/app-config/` is **unversioned and permanent**. It is never mounted under `/api/vN/`. Its contract is additive-only forever, because every app build ever shipped must be able to read it. |
| D5 | What is frozen | Only the **patient surface** (the endpoints the Flutter app calls, listed in Phase 4) is a frozen contract. Admin, staff and doctor-dashboard endpoints can still change in place, because the web app deploys with the backend. |
| D6 | Client identification | The Flutter app sends `X-App-Platform: android` or `ios` and `X-App-Build: <integer build number>` on every request. The web app sends neither. A request without these headers is never gated. |
| D7 | When v1 freezes | On the day the first Flutter build is published to a store, `'v1'` is added to `API_FROZEN_VERSIONS` (a one-line code change). Until then the v1 snapshot may be regenerated on purpose, so Part 4 can still fix v1 shapes. |
| D8 | Forcing upgrades | A mobile build below the minimum for its platform gets `426 Upgrade Required` with a JSON body on every API path except app-config, schema and docs. A request to a **retired** version also gets 426, not 404, so old apps can show an update screen. |
| D9 | What counts as breaking | Removing or renaming a path, method, field or enum value; changing a field's type; a response field becoming nullable or optional; a request field becoming required; adding an enum value to a response field; changing a default or meaning. Adding endpoints, response fields, or optional request fields is not breaking. |
| D10 | Where config lives | Environment variables, set in the Render dashboard; changes apply on restart. An admin-editable database table was rejected for now (needs a migration, and changes are rare). |
| D11 | How v2 will be built | Version-specific code lives only at the edge (serializers, filters, params). Models, services and permissions stay shared. Response caches include `request.version` in their keys. |
| D12 | Support window | At most two live versions. A version is retired no sooner than 6 months after its successor ships, and only after the usage logs show its traffic is negligible. |

## Phase overview

Phases run in order. Each ends with a gate that must pass before the next starts.

| Phase | Name | Depends on |
| --- | --- | --- |
| 0 | Baseline and inventories | — |
| 1 | Handler signatures and guard test | 0 |
| 2 | Settings and URL structure | 1 |
| 3 | Test suite on `/api/v1/` | 2 |
| 4 | Complete the v1 schema | 2 |
| 5 | Contract snapshot and breaking-change check | 4 |
| 6 | App-config endpoint | 2 |
| 7 | Client middleware (upgrade gate, retired versions, deprecation, usage log) | 6 |
| 8 | Version-aware cache keys and serializer switch | 2 |
| 9 | Web client and deploy config | 3, 7 |
| 10 | Documentation | all |
| 11 | Final sweep | all |

## Phase 0 — Baseline and inventories

**V.0.1 Baseline.** Run the full suite on Postgres and record the pass count. Generate the schema (`spectacular --file /tmp/schema.before.yml`) and record its total path count and how many start with `/api/v1/` (snapshot: 208 and 102).

**V.0.2 Handler inventory.** Create `core/devtools.py` with the `kwarg_unsafe_handlers()` function from V.1.2, then run it in `python manage.py shell` and paste its output into the notes. The snapshot found 25 handlers:

- `accounts.views`: `FacilityStaffDeleteAPIView.delete`, `FacilityStaffListCreateAPIView.get/.post`, `PlatformAdminListCreateAPIView.get/.post`, `VerificationApproveRejectAPIView.post`, `VerificationQueueAPIView.get`;
- `accounts.views_roles`: `UserRoleViewSet.search_users`, `UserRoleViewSet.user_permissions`, `my_permissions`;
- `bookings.views`: `DoctorBookingViewSet.transition`, `HospitalServiceBookingViewSet.transition`, `TestBookingViewSet.transition`, `patient_lookup`, `send_otp`, `verify_otp`;
- `doctors.views`: `DoctorAffiliationViewSet.availability`, `DoctorSpecialtyViewSet.suggest`, `DoctorViewSet.chambers`, `SpecialtyAliasViewSet.batch_verify/.counts/.verify`;
- `facilities.views_facility_actions`: `FacilityDetailActionsMixin.doctors/.tests`;
- `tests.views`: `FacilityTestViewSet.search`.

**V.0.3 Cached responses.** List every `cache.get`/`cache.set` and `cache_page` that stores a response body (snapshot: `search_metadata:v…` and `search_facets:v…` in `core/views.py`; `cache_page` on the geo viewsets). Record them for Phase 8.

**Gate:** the baseline, inventory and cache list are in the notes.

---

## Phase 1 — Handler signatures and guard test

**Goal:** every API handler accepts the `version` kwarg before any URL captures it. Doing this first means no task can leave the app broken.

**V.1.1 Fix the signatures.** In each handler from V.0.2, add `**kwargs` to the end of the parameter list. Use `*args, **kwargs` for `@api_view` functions. Change nothing else in those functions. Example: `def availability(self, request, pk=None):` becomes `def availability(self, request, pk=None, **kwargs):`.

**V.1.2 Guard helper.** `core/devtools.py` (tested against the snapshot; it found exactly the 25 above and none after the fix):

```python
import inspect
from django.urls import get_resolver, URLPattern, URLResolver

HTTP = ('get', 'post', 'put', 'patch', 'delete', 'head', 'options')
FRAMEWORK = ('rest_framework', 'django')

def _walk(patterns, prefix=''):
    for p in patterns:
        if isinstance(p, URLResolver):
            yield from _walk(p.url_patterns, prefix + str(p.pattern))
        elif isinstance(p, URLPattern):
            yield prefix + str(p.pattern), p.callback

def _original(fn):
    """DRF's @api_view wraps the user function in a closure named `func`."""
    code = getattr(fn, '__code__', None)
    if code and 'func' in code.co_freevars and fn.__closure__:
        return dict(zip(code.co_freevars, (c.cell_contents for c in fn.__closure__)))['func']
    return fn

def kwarg_unsafe_handlers(path_prefix='api/'):
    seen, bad = set(), []
    for route, cb in _walk(get_resolver().url_patterns):
        cls = getattr(cb, 'cls', None)
        if cls is None or not route.startswith(path_prefix):
            continue
        actions = getattr(cb, 'actions', None) or {}
        if actions:
            names = set(actions.values())
        else:
            names = {m for m in HTTP if any(m in b.__dict__ for b in cls.__mro__
                     if b.__module__.split('.')[0] not in FRAMEWORK)}
        for name in names:
            fn = getattr(cls, name, None)
            if fn is None:
                continue
            fn = _original(fn)
            key = (fn.__module__, fn.__qualname__)
            if key in seen or fn.__module__.split('.')[0] in FRAMEWORK:
                continue
            seen.add(key)
            if not any(p.kind is p.VAR_KEYWORD for p in inspect.signature(fn).parameters.values()):
                bad.append(f'{fn.__module__}.{fn.__qualname__}')
    return sorted(bad)
```

If the `_original` unwrapping finds no `func` in DRF 3.17's `api_view`, stop and report; do not guess another unwrapping.

**V.1.3 Guard test.** `tests/test_api_versioning.py::test_every_handler_accepts_version_kwarg` asserts `kwarg_unsafe_handlers() == []`, with the list in the failure message.

**Gate:** the guard test passes; the full suite passes with the same count as V.0.1 plus the new test.

---

## Phase 2 — Settings and URL structure

**V.2.1 DRF settings.** In `core/settings.py`, add to `REST_FRAMEWORK`:

```python
'DEFAULT_VERSIONING_CLASS': 'rest_framework.versioning.URLPathVersioning',
'DEFAULT_VERSION': 'v1',
'ALLOWED_VERSIONS': ('v1',),
'VERSION_PARAM': 'version',
```

And below it, as plain code constants (not env, so they're reviewed in code):

```python
API_FROZEN_VERSIONS = ()      # D7: becomes ('v1',) the day the first Flutter build ships
API_RETIRED_VERSIONS = ()     # versions answered with 426 (Phase 7)
```

**V.2.2 One route module.** Create `core/api_urls.py` holding every API route, moved from `core/urls.py` with names unchanged:

```python
from django.urls import path, include
from .views import SearchMetadataAPIView, SearchFacetsAPIView, AdminInitAPIView

urlpatterns = [
    path('', include('accounts.urls')),
    path('', include('facilities.urls')),
    path('', include('doctors.urls')),
    path('', include('tests.urls')),
    path('bookings/', include('bookings.urls')),
    path('search-metadata/', SearchMetadataAPIView.as_view(), name='search-metadata'),
    path('search/metadata/', SearchMetadataAPIView.as_view(), name='search-metadata-slash'),
    path('search-facets/', SearchFacetsAPIView.as_view(), name='search-facets'),
    path('admin/dashboard-init/', AdminInitAPIView.as_view(), name='admin-dashboard-init'),
]
```

**V.2.3 Root URLconf.** Rewrite the API part of `core/urls.py` in this order (order matters):

```python
path('admin/', admin.site.urls),
path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
# Phase 6 adds: path('api/app-config/', ...)  — unversioned, before the versioned mount
re_path(r'^api/(?P<version>v\d+)/', include('core.api_urls')),   # canonical
path('api/', include('core.api_urls')),                            # legacy alias → DEFAULT_VERSION
```

Delete the old double mount. Use `re_path` with `v\d+`, not `path('api/<str:version>/')`: the `str` converter would capture `/api/doctors/` as `version='doctors'` and 404 it.

**V.2.4 Tests** in `tests/test_api_versioning.py`:

- `/api/v1/doctors/` and `/api/doctors/` both return 200, with the same `count` and the same `results` ids. Compare `results`, not the whole body: pagination `next` links contain the request path.
- `request.version` is `'v1'` on both mounts. Read it from `response.renderer_context['request'].version`.
- `/api/v2/doctors/` returns 404 (version not allowed).
- One request per previously unsafe patient endpoint returns non-500 through `/api/v1/`: `specialties/suggest/?q=card`, `facility-tests/search/`, `affiliations/<id>/availability/`, `hospitals/<slug>/doctors/`, `bookings/otp/send/`, `bookings/patients/lookup/?phone=01711111111`.

**Gate:** suite passes; `spectacular --validate` exits 0; manual: `curl -i` on `/api/v1/doctors/`, `/api/doctors/`, `/api/v2/doctors/` (200, 200, 404).

---

## Phase 3 — Test suite on `/api/v1/`

**Goal:** the suite exercises the canonical path, so a versioning bug can't hide behind the legacy alias (the draft plan's main blind spot).

**V.3.1 Rewrite test URLs.** Write a one-off script `scripts/canonicalize_test_urls.py` (keep it; it's re-runnable). It rewrites string literals in `doctors_hub_backend/tests/test_*.py` and `bookings/tests.py` with this regex:

```python
re.sub(r"(?<=[\"'])/api/(?!v\d+/|schema/|docs/|redoc/|app-config/)", "/api/v1/", text)
```

It skips `tests/test_api_versioning.py` and `tests/test_legacy_alias.py`. It prints per-file replacement counts; paste the totals into the notes (snapshot: 34 files use `/api/`, 4 already use `/api/v1/`).

**V.3.2 Legacy alias test.** Create `tests/test_legacy_alias.py`, parametrized over 6 GET endpoints (doctors list, hospitals list, specialties, search-metadata, divisions, facility-tests search). For each, the legacy and `/api/v1/` responses have the same status and the same data (`results` when paginated).

**Gate:**

- the full suite passes with the same count as Phase 2;
- `grep -rnP "[\"']/api/(?!v1/|schema/|docs/|redoc/|app-config/)" doctors_hub_backend/tests doctors_hub_backend/bookings/tests.py` returns only lines in the two skipped files.

## Phase 4 — Complete the v1 schema

**Goal:** the schema describes the patient surface exactly, so the Phase 5 check protects what phones actually parse. Today the OTP and patient-lookup endpoints have no request/response schema, and many method fields are typed as plain `string`.

**V.4.1 Schema shows versioned paths only.** Create `core/schema_hooks.py` and register it in `SPECTACULAR_SETTINGS`. Also change `SCHEMA_PATH_PREFIX` to `r'/api(?:/v\d+)?'` so tags are derived after the version segment.

```python
import re
_KEEP = re.compile(r'^/api/(v\d+|\{version\})/|^/api/app-config/$')

def only_versioned_paths(endpoints, **kwargs):
    """Drop the legacy /api/ alias; keep /api/vN/ and the unversioned app-config."""
    return [e for e in endpoints if _KEEP.match(e[0])]
```

```python
'PREPROCESSING_HOOKS': ['core.schema_hooks.only_versioned_paths'],
```

Verified on the snapshot: 214 paths drop to 107, none legacy.

**V.4.2 Define the patient surface.** Create `core/api_contract.py` with two constants. Paths are version-relative and use the parameter names the schema uses. Check every entry against the generated schema; a missing one means stop and report.

```python
PATIENT_SURFACE = [
    ('GET', '/search-metadata/'), ('GET', '/search-facets/'),
    ('GET', '/divisions/'), ('GET', '/districts/'), ('GET', '/thanas/'),
    ('GET', '/specialties/'), ('GET', '/specialties/suggest/'),
    ('GET', '/doctors/'), ('GET', '/doctors/{id}/'),
    ('GET', '/affiliations/{id}/availability/'),
    ('GET', '/hospitals/'), ('GET', '/hospitals/{location}/'),
    ('GET', '/hospitals/{location}/doctors/'), ('GET', '/hospitals/{location}/tests/'),
    ('GET', '/diagnostic-centers/'), ('GET', '/diagnostic-centers/{location}/'),
    ('GET', '/diagnostic-centers/{location}/doctors/'), ('GET', '/diagnostic-centers/{location}/tests/'),
    ('GET', '/hospital-categories/'), ('GET', '/diagnostic-center-categories/'),
    ('GET', '/test-categories/'), ('GET', '/hospital-services/'),
    ('GET', '/facility-tests/search/'),
    ('POST', '/bookings/otp/send/'), ('POST', '/bookings/otp/verify/'),
    ('GET', '/bookings/patients/lookup/'),
    ('POST', '/bookings/doctor/'), ('POST', '/bookings/test/'), ('POST', '/bookings/hospital-service/'),
]
UNVERSIONED_SURFACE = [('GET', '/api/app-config/')]   # added in Phase 6
```

The booking routes are the ones the web app already uses. The duplicates (`doctor-bookings`, `test-bookings`, `lab`, `lab-bookings`, `hospital-services`) are deliberately outside the surface, so they can be removed later.

**V.4.3 Undocumented function views.** Add `@extend_schema(request=…, responses=…)` above `@api_view` on `send_otp`, `verify_otp` and `patient_lookup`. Write small request/response serializers in `bookings/schema_serializers.py` that mirror exactly what each view reads and returns today: read the view code, and check field names against a real response from the test suite. These serializers are for the schema only; the views must not start using them for validation.

**V.4.4 Typed method fields.** Run `spectacular` and collect every `unable to resolve type hint` and `unable to guess serializer` warning whose bracket starts with a view serving the patient surface. Fix each with `@extend_schema_field(<serializer or OpenApiTypes>)` describing the value actually returned, including `allow_null=True` where it can be `None`. Snapshot examples:

- `DoctorListSerializer.get_primary_specialty` (object or null), `.get_specialties` (list), `.get_match_rank` (integer or null);
- `ChamberLeanSerializer.get_next_available` and `DoctorAffiliationSerializer.get_next_available` (object or null);
- `FacilitySummarySerializer.get_logo` / `.get_image` (URI string or null);
- `FacilityMiniSerializer.display_name` (string);
- `DoctorSerializer` method fields, and `DoctorSpecialtySerializer.get_doctor_count` / `.get_parents`.

Also add `ENUM_NAME_OVERRIDES` for the `gender` choice collision, so enum component names stop carrying hash suffixes.

**V.4.5 Schema matches reality.** Create `tests/test_schema_matches_responses.py`. For each GET in the surface, plus each POST with a valid payload, call the endpoint through `/api/v1/` using fixture data that includes the null cases (a doctor with no primary specialty, a chamber with no upcoming session, a facility with no logo). Validate the JSON against the operation's 2xx response schema with `jsonschema` (already installed as a drf-spectacular dependency; not a new dependency).

Before validating, convert OpenAPI 3.0 `nullable: true` to a JSON Schema `null` alternative, and resolve `$ref` against `components.schemas`. A failure means the annotation is wrong: fix the annotation, never the response.

**Gate:**

- the schema has 0 legacy paths;
- 0 type-hint or guess-serializer warnings for surface views;
- `test_schema_matches_responses.py` passes for every surface operation;
- the full suite passes.

---

## Phase 5 — Contract snapshot and breaking-change check

**Goal:** a committed v1 schema snapshot, plus a check that fails when a change would break installed apps. Comparisons are done in code, never with git.

**V.5.1 Snapshot.** Generate with `SchemaGenerator(api_version='v1').get_schema(request=None, public=True)` (verified working on the snapshot). Write it to `docs/api/openapi.v1.json` with `sort_keys=True, indent=2`.

**V.5.2 Comparator.** `core/contract_diff.py`, with a pure function `breaking_changes(old_schema, new_schema, surface) -> list[str]`. It compares **resolved** schemas (follows `$ref`, with a cycle guard), never component names, so a renamed component isn't reported. It applies D9 to surface operations only:

| Where | Breaking |
| --- | --- |
| Operation | Missing in new; its success status code changed |
| Query/path params | Removed; optional → required; new required param; enum value removed |
| Request body | New required property; property removed; type or format changed; enum value removed |
| Response (success code) | Property removed; property no longer `required`; `nullable` false → true; type or format changed; enum value **added**; array item schema changed by these same rules |

Each message names the version, method, path and JSON path, e.g. `v1 GET /doctors/ 200 results[].primary_specialty: became nullable`.

**V.5.3 Script.** `scripts/check_api_contract.py` loops over `ALLOWED_VERSIONS`:

1. Generate the current schema. Load `docs/api/openapi.<v>.json`.
2. If the version is in `API_FROZEN_VERSIONS` and `breaking_changes()` is not empty: print them and exit 1. `--update` does not override this.
3. If the version is not frozen: print breaking changes as warnings.
4. If the snapshot differs from the current schema in any way: exit 1 with "snapshot out of date, run with --update". So every contract change, breaking or not, shows up as a snapshot file change for review.
5. `--update` rewrites the snapshot, unless step 2 failed.

**V.5.4 Tests.** Create `tests/test_api_contract.py`:

- one unit test per row of the V.5.2 table, using small hand-written old/new schema pairs;
- additive changes (new optional response field, new endpoint, new optional param) report nothing;
- a renamed component with the same structure reports nothing;
- the current tree matches `docs/api/openapi.v1.json` (the snapshot is up to date);
- with `override_settings(API_FROZEN_VERSIONS=('v1',))` and a monkeypatched generator that drops a field, the script's main function returns exit code 1.

**Gate:** `python scripts/check_api_contract.py` exits 0; the contract tests pass; the full suite passes.

---

## Phase 6 — App-config endpoint

**V.6.1 Settings.** In `core/settings.py`, using the existing `env(...)` pattern:

```python
APP_ANDROID_MIN_BUILD = env.int('APP_ANDROID_MIN_BUILD', default=0)     # 0 = no gate
APP_ANDROID_LATEST_BUILD = env.int('APP_ANDROID_LATEST_BUILD', default=0)
APP_ANDROID_STORE_URL = env('APP_ANDROID_STORE_URL', default='')
APP_IOS_MIN_BUILD = env.int('APP_IOS_MIN_BUILD', default=0)
APP_IOS_LATEST_BUILD = env.int('APP_IOS_LATEST_BUILD', default=0)
APP_IOS_STORE_URL = env('APP_IOS_STORE_URL', default='')
APP_UPDATE_MESSAGE_EN = env('APP_UPDATE_MESSAGE_EN', default='')
APP_UPDATE_MESSAGE_BN = env('APP_UPDATE_MESSAGE_BN', default='')
API_DEPRECATE_LEGACY = env.bool('API_DEPRECATE_LEGACY', default=False)
API_DEPRECATIONS = env.dict('API_DEPRECATIONS', default={})   # e.g. legacy=2026-12-01,v1=2027-06-01
API_SUNSETS = env.dict('API_SUNSETS', default={})             # same keys, ISO dates
API_USAGE_LOG = env.bool('API_USAGE_LOG', default=True)
```

Add a system check `core.E002`: every `API_DEPRECATIONS`/`API_SUNSETS` value parses as an ISO date, and every key is `legacy` or a `vN`.

**V.6.2 View.** Create `core/views_app_config.py` with `AppConfigAPIView`:

- `permission_classes = (AllowAny,)` and **`authentication_classes = ()`**. An expired JWT on the device must never stop the update check (DRF's JWT authentication returns 401 for a bad token even on `AllowAny` views).
- Response header: `Cache-Control: public, max-age=300`.
- Response body (additive-only forever, D4):

```json
{
  "api": {"current_version": "v1", "supported_versions": ["v1"],
          "deprecations": {"v1": {"deprecated_on": null, "sunset_on": null}}},
  "platforms": {
    "android": {"min_supported_build": 0, "latest_build": 0, "store_url": ""},
    "ios":     {"min_supported_build": 0, "latest_build": 0, "store_url": ""}
  },
  "update_message": {"en": "", "bn": ""},
  "client": {"platform": "android", "build": 42, "status": "ok"},
  "server_time": "2026-10-05T10:00:00+06:00"
}
```

`current_version` is the highest entry in `ALLOWED_VERSIONS`. `client` is filled from the Phase 7 headers when they are present, otherwise `null`. `status` is `update_required` when the build is below the minimum, `update_available` when it is below the latest, otherwise `ok`.

**V.6.3 Routing and schema.** Add `path('api/app-config/', AppConfigAPIView.as_view(), name='app-config')` in `core/urls.py`, before the versioned mount. It is not in `core/api_urls.py`. Add `extend_schema` with a response serializer and the tag `App`, and add the view to `UNVERSIONED_SURFACE`. Run `check_api_contract.py --update` (additive change).

**V.6.4 Tests** in `tests/test_app_config.py`:

- the shape matches the contract above;
- a request with `Authorization: Bearer garbage` returns 200, not 401;
- `/api/v1/app-config/` returns 404 (unversioned only);
- `client.status` is right for builds below min, equal to min, below latest, and equal to latest;
- with no headers, `client` is `null`;
- the `core.E002` check fires on a bad date.

**Gate:** tests pass; the contract check exits 0; manual: `curl -i /api/app-config/` and `curl -i -H 'X-App-Platform: android' -H 'X-App-Build: 1' /api/app-config/`.

## Phase 7 — Client middleware

**Goal:** one middleware handles client identification, the upgrade gate, retired versions, deprecation headers and usage logging. It only touches paths starting with `/api/`. It never touches `/api/app-config/`, `/api/schema/`, `/api/docs/` or `/api/redoc/`.

**V.7.1 Create `core/middleware.py` → `ApiClientMiddleware`.** Insert it in `MIDDLEWARE` directly after `django.middleware.common.CommonMiddleware`. Being inside `CorsMiddleware` means its 426 responses still get CORS headers.

On request, in this order:

1. **Identify the client.** Read `X-App-Platform` (lower-cased; only `android` or `ios` count) and `X-App-Build` (a positive integer). Invalid values are treated as absent, never as a 400. Store the result as `request.app_client = AppClient(platform, build)`, a small frozen dataclass in `core/app_client.py` that Phase 6's view also uses.
2. **Work out the version key.** `vN` from `^/api/(v\d+)/`; otherwise `legacy`, which means `DEFAULT_VERSION` for gating.
3. **Retired version.** If the effective version is in `API_RETIRED_VERSIONS`, return 426: `{"code": "api_version_retired", "detail": "…", "update": <platform block or null>, "message": {"en", "bn"}}`.
4. **Upgrade gate.** If the platform and build are known, the platform's `*_MIN_BUILD` is above 0 and the build is below it, return 426: `{"code": "app_update_required", "min_supported_build": n, "store_url": "…", "message": {"en", "bn"}}`. Requests without headers (the web app) pass through.

On response:

5. **Deprecation headers.** If the version key is in `API_DEPRECATIONS` (for `legacy`, also require `API_DEPRECATE_LEGACY=True`), set `Deprecation: @<unix seconds of that date>` (RFC 9745 format). If it's in `API_SUNSETS`, set `Sunset: <HTTP-date>` using `django.utils.http.http_date`. For legacy, also set `Link: <same path under /api/v1/, query string kept>; rel="successor-version"`. For `vN`, set the same link pointing to `vN+1` only when that version is allowed.
6. **Usage log.** When `API_USAGE_LOG` is on, log one line to the `api.usage` logger at INFO: method, version key, `resolver_match.route` (the route template, not the raw path, so IDs and phone numbers never reach the logs), platform, build, status code. Add the `api.usage` logger at INFO to `LOGGING`.

Retiring a version later means: remove it from `ALLOWED_VERSIONS`, add it to `API_RETIRED_VERSIONS`. The middleware answers before DRF would 404.

**V.7.2 Tests** in `tests/test_api_client_middleware.py`:

- below min → 426 with the body above; equal to min → normal response; no headers → normal; `X-App-Build: abc` → treated as absent;
- app-config, schema and docs are never gated, even below min;
- `override_settings(API_RETIRED_VERSIONS=('v1',))` → `/api/v1/doctors/` and legacy `/api/doctors/` both return 426 `api_version_retired`;
- deprecation headers appear only when configured, with the right formats; the legacy `Link` keeps the query string;
- a 426 sent with an `Origin` header from an allowed origin still carries `Access-Control-Allow-Origin`;
- `caplog` shows one `api.usage` line with the route template and no raw IDs.

**Gate:** tests pass; the full suite passes (the suite sends no app headers, so nothing is gated); manual `curl -i` checks with and without headers.

---

## Phase 8 — Version-aware cache keys and serializer switch

**V.8.1 Cache keys.** Add `versioned_key(request, base)` to `core/cache_keys.py`, returning `f"{base}:{request.version}"`. Use it for every response cache found in V.0.3; the snapshot has `search_metadata` and `search_facets` in `core/views.py`. `cache_page` already keys on the full URL, so it needs no change. Test that a v1 request writes a key containing `:v1`.

**V.8.2 Serializer switch (ready for v2, unused now).** Add `VersionedSerializerMixin` to `core/versioning.py`. A view declares, for example, `serializer_classes = {'v1': {'list': A, 'default': B}}`. `get_serializer_class()` picks the entry for `request.version`; if that version has no entry for the action, it falls back to the nearest **lower** version that has one, then to `super()`. Unit-test it with a dummy viewset and two fake versions (`override_settings` on `ALLOWED_VERSIONS` inside the test only). Do not apply it to any real view in this plan.

**Gate:** tests pass; the contract check exits 0 (nothing in the contract changed).

---

## Phase 9 — Web client and deploy config

**V.9.1 Web base URL.**

- `doctors_hub/src/services/api/core.js`: the fallback becomes `'http://localhost:8000/api/v1'`.
- `doctors_hub/.env.example`: both `VITE_API_BASE_URL` lines (local and the Vercel comment) end in `/api/v1`.
- Check the two places that prefix `http://localhost:8000` to a relative `BASE_URL` (`services/api/hospitals.js`, `services/api/tests.js`) still produce `/api/v1/...`.
- The web app sends no `X-App-*` headers.

**V.9.2 CORS.** In `core/settings.py`, set `CORS_EXPOSE_HEADERS = ['Deprecation', 'Sunset', 'Link']` so browser code can read them.

**V.9.3 Deploy config.**

- `doctors_hub_backend/.env.example`: add every Phase 6 key with a one-line comment and its safe default.
- `render.yaml`: add them under `envVars`. Build numbers get `value: "0"`, `API_DEPRECATE_LEGACY` gets `"False"`, `API_USAGE_LOG` gets `"True"`, and store URLs and messages get `sync: false`.
- Do not edit `doctors_hub_backend/.env`: it's gitignored and local only.

**V.9.4 Owner actions.** List these in the notes for the project owner; the agent cannot do them:

- set `VITE_API_BASE_URL` in Vercel to the `/api/v1` URL and redeploy;
- set the new variables in the Render dashboard.

**Gate:**

- `npm run build` and `npm test` pass;
- `grep -rn "localhost:8000/api'" doctors_hub/src doctors_hub/.env.example` returns nothing;
- manual: run the web app against the local backend and open home, doctor search, a doctor profile (with availability), diagnostics search and the booking modal up to OTP send. The `api.usage` log shows `v1` for every request and no `legacy`.

---

## Phase 10 — Documentation

**V.10.1 `docs/api/VERSIONING.md`, written for the Flutter developer:**

- **Base URL:** `/api/v1`. The headers to send on every request.
- **App start:** call `/api/app-config/` before anything else, and what to do for each `client.status`.
- **426 handling:** both `code` values, and which screen each shows.
- **Patient surface:** the endpoint list, generated from `core/api_contract.py` by a small script, not typed by hand.
- **Tolerant parsing rules:** ignore unknown fields; every enum needs an `unknown` fallback; treat only `required` fields as non-nullable.
- **The schema file:** `docs/api/openapi.v1.json` is the source of truth, and Dart models may be generated from it.

**V.10.2 Backend section of the same file:**

- the D9 list of breaking changes;
- **the freeze-day checklist (D7):** add `'v1'` to `API_FROZEN_VERSIONS`, run the contract check, set `APP_ANDROID_MIN_BUILD` to the first store build;
- **the v2 playbook:** add `'v2'` to `ALLOWED_VERSIONS`, use `VersionedSerializerMixin` for changed endpoints only, generate `openapi.v2.json`, follow the expand-then-contract database rule;
- **retiring a version:** deprecation date, then sunset date, then retired (D12).

**V.10.3 `docs/api/CHANGELOG.md`.** Newest first. The first entry records that v1 was introduced, the legacy alias, and `app-config`.

**V.10.4** Update the base-path mentions in `docs/API_REFERENCE.md` to `/api/v1/`.

**Gate:** the docs exist; the endpoint list in `VERSIONING.md` matches `core/api_contract.py` exactly (the generator script re-run produces no change).

## Phase 11 — Final sweep

**V.11.1 Full checks.** Run every command in 0.3, record pass counts, and re-run each phase's gate check.

**V.11.2 Schema numbers.** Record the v1 schema's path count (expected 108: 107 plus app-config) and the legacy path count (expected 0), next to the V.0.1 baseline.

**V.11.3 End-to-end manual script.** Run these against the local server and record status and headers for each:

1. `GET /api/v1/doctors/` → 200, no deprecation headers.
2. `GET /api/doctors/` → 200; with `API_DEPRECATE_LEGACY=True` and dates in `API_DEPRECATIONS`/`API_SUNSETS`, it carries `Deprecation`, `Sunset` and `Link`.
3. `GET /api/v2/doctors/` → 404.
4. `GET /api/app-config/` with `X-App-Platform: android`, `X-App-Build: 5` and `APP_ANDROID_MIN_BUILD=10` → 200, `client.status = update_required`.
5. Same headers on `GET /api/v1/doctors/` → 426 `app_update_required`.
6. `API_RETIRED_VERSIONS=('v1',)` in a local settings override → `GET /api/v1/doctors/` → 426 `api_version_retired`. Revert afterwards.
7. `python scripts/check_api_contract.py` → exit 0. Temporarily set `API_FROZEN_VERSIONS=('v1',)` and remove one field from `FacilityMiniSerializer` → exit 1 naming that field. Revert both and confirm exit 0 again.

**V.11.4 Summary.** End `docs/versioning-agent-notes.md` with what changed per phase, deviations from this plan, skipped or partial tasks with reasons, open questions, and the owner actions from V.9.4. Everything must be traceable to the per-task entries.

---

## Out of scope (do not do)

- Removing the legacy `/api/` alias (D3; a later decision once Vercel points at `/api/v1`).
- Removing the duplicate booking routes (`doctor-bookings`, `test-bookings`, `lab`, `lab-bookings`, `hospital-services`).
- Any v2 endpoint, and any change to an existing response shape (Part 4 owns those, before the freeze).
- OTP logic and its bypass codes, JWT/auth flows, SMS credentials.
- Flutter app code. This plan only defines the contract the app follows.

## Open questions (for the owner, not the agent)

- **Patient sign-in on mobile.** `auth/refresh/` uses an HttpOnly cookie, which suits the browser but is awkward on Flutter. Decide whether patients log in at all in v1 and, if so, how the app refreshes tokens, before the freeze. The answer may add auth endpoints to the patient surface.
- **Support window.** D12 says at least 6 months between a successor shipping and retirement. Confirm this fits how quickly your users update.
- **iOS at launch.** If the first release is Android-only, keep the iOS settings at 0 and leave `store_url` empty until there's an iOS build.
