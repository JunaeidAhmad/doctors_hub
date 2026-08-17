# Role-Based Access Control — Agentic Implementation Plan

**Repo:** `JunaeidAhmad/doctors_hub` · Django 5.2 + DRF + SimpleJWT backend (`doctors_hub_backend/`), React/Vite frontend (`doctors_hub/`)

This plan is written to be executed by a coding agent, phase by phase. Each phase lists the exact files to touch, what to change, the acceptance criteria, and a verification command. Do not start a phase until the previous phase's verification passes.

---

## 1. Current state (what the agent is working with)

- **User model** (`accounts/models.py`): custom `User(AbstractBaseUser, PermissionsMixin)`, `phone_number` is the username, UUID PK. It has `is_staff` and `is_superuser` (from `PermissionsMixin`) but **no role field and no link to a facility or a doctor record.**
- **Single permission class** (`core/permissions.py`): `IsAdminUserOrReadOnly` — public read for everyone, write for **any** `is_staff` user. It is applied identically across every facilities/doctors/tests viewset, so today *every staff user can edit every facility, doctor, test, and price.* There is no scoping.
- **Bookings** (`bookings/views.py`): **[updated]** no patient accounts — anyone may create a booking (patient identity is stored inline as `patient_name` / `patient_phone`); listing and managing bookings is staff-only for now and becomes role-scoped in Phase 3.
- **Domain graph:** `Location` (has `location_type`: hospital / diagnostic_center / chamber) ← one-to-one `Hospital` / `DiagnosticCenter` / `Chamber`. `Doctor` ← `DoctorAffiliation(doctor, location, fee)` ← `AffiliationSchedule`. `FacilityTest(location, test, price)`. `DoctorBooking → affiliation → location`; `LabBooking → facility_test → location`.
- **Admin surfaces:** Django admin (super-user gated by default) + `AdminInitAPIView` (`core/views.py`, currently `AllowAny`) feeding a React `AdminDashboard` that keys off `is_staff`/`is_superuser`.
- **Tests:** pytest + `APIClient` (`tests/`), `factory-boy` is already in `requirements.txt` but no factories/conftest exist yet.

### Known issues to fix along the way (security depends on these)
- `LoginSerializer` (`accounts/serializers.py`) contains a **hardcoded demo-admin bypass** (`01700000000` / `admin123456` / `Password123!`) that silently resets the password. RBAC is meaningless if this stays.
- `AdminInitAPIView` is `AllowAny` and branches on `is_staff` internally — it must move to authenticated + role-scoped.
- `CORS_ALLOW_ALL_ORIGINS = True` in `core/settings.py` — acceptable for dev, flag for prod.

---

## 1b. Already implemented (patient removal)

This pass removed patient accounts from the backend. All changes are committed and the test suite is green (17 passed, including 4 new tests in `tests/test_no_patient_accounts.py`).

- `bookings/models.py` — `BaseBooking.user` is now `null=True, blank=True, on_delete=SET_NULL` (no patient link; optionally records a staff/doctor owner). Added `patient_phone` (blank, optional) to `DoctorBooking` so patient contact lives on the booking row for both booking types.
- `bookings/views.py` — rewritten: a shared `BookingViewSetMixin` allows **anyone** to `POST` a booking, returns `none()` for non-staff on list/retrieve, and no longer forces `user=request.user` on create (records the staff/doctor account only if one is authenticated).
- `core/permissions.py` — added `PublicCreateAdminManage` (POST open to all; other methods staff-only) as the interim booking gate until role scoping lands in Phase 3.
- `bookings/serializers.py` — `patient_phone` added to `DoctorBookingSerializer`.
- `accounts/views.py`, `accounts/urls.py`, `accounts/serializers.py` — removed `RegisterAPIView`, the `auth/register/` route, and `RegisterSerializer`. **No public self-registration.** Login (`auth/login/`) and profile (`auth/me/`) remain for privileged roles.
- `bookings/migrations/0004_*` — adds `patient_phone`, makes both booking `user` FKs nullable.

Still outstanding from the login change: the hardcoded demo-admin bypass in `LoginSerializer` is flagged for removal in Phase 4.

---

## 2. Target role model

| Role | Source of truth | Django flags | Scope |
|---|---|---|---|
| **Platform Super Admin** | `role = "super_admin"` | `is_staff=True`, `is_superuser=True` | Everything. Django admin + full API. |
| **Facility Admin** | `role = "facility_admin"` + `FacilityMembership(role="admin")` rows | `is_staff=False` | Only the `Location`s they are a member of: that location's tests, prices, staff, affiliated doctors, and bookings. |
| **Doctor** | `role = "doctor"` + `Doctor.user` link | `is_staff=False` | Only their own `Doctor` record, its affiliations, schedules, and their own bookings. |

There are **no patient accounts on this platform at all** — no patient registration, no patient login. A patient's identity is captured only on the booking row (`patient_name` + `patient_phone`); bookings are created publicly without an account. The RBAC scheme therefore has exactly the three privileged roles above, and login exists only for them. *(This patient-removal step is already implemented — see "Already implemented" below.)*

Design decisions:
- **A `role` field is the single coarse-grained source of truth**, kept in sync with `is_staff`/`is_superuser` so Django admin access is only ever granted to super admins.
- **Facility scope is a many-to-many via `FacilityMembership`**, not a single FK — this supports one admin managing several branches, one facility having several admins, and the "staff" sub-scope the requirements mention (membership `role` covers both `admin` and `staff`).
- **Doctor scope is a `OneToOne` `Doctor.user`** so a logged-in doctor resolves to exactly one `Doctor` record.
- **Public catalog stays publicly readable.** Scoping restricts *writes* (object-level) and *private listings* (bookings, "my facilities" dashboard views). It must never hide public GET catalog data.

---

## Phase 0 — Baseline & guardrails

**Goal:** green starting point, isolated branch.

1. `git checkout -b feature/rbac`
2. Create `doctors_hub_backend/conftest.py` only if needed for path setup; otherwise skip.
3. Run the existing suite to record a baseline.

**Verify:**
```bash
cd doctors_hub_backend && pip install -r requirements.txt && pytest -q
```
**Acceptance:** existing tests pass (or pre-existing failures are documented and unrelated to RBAC).

---

## Phase 1 — Data model & migrations

**Files:** `accounts/models.py`, `facilities/models.py`, `doctors/models.py`, new migrations in each app.

1. **`accounts/models.py` — add role + helpers on `User`:**
   ```python
   class Role(models.TextChoices):
       SUPER_ADMIN = "super_admin", "Platform Super Admin"
       FACILITY_ADMIN = "facility_admin", "Facility Admin"
       DOCTOR = "doctor", "Doctor"

   role = models.CharField(max_length=20, choices=Role.choices, blank=True, default="")
   ```
   The default is blank — an ordinary authenticated user has no elevated role. Only the three privileged roles are ever assigned explicitly. Override `save()` to keep flags consistent: `super_admin → is_staff=is_superuser=True`; every other value (including blank) → `is_superuser=False` (leave `is_staff` False unless explicitly a super admin). Add convenience props:
   - `is_super_admin`, `is_facility_admin`, `is_doctor_role` (each a simple `role ==` check).
   - `managed_location_ids` → `Location` UUIDs from `facility_memberships` with membership role `admin` (empty for non-facility-admins; not used for super admins, who bypass scoping).
   - Keep `create_superuser` setting `role=SUPER_ADMIN`.

2. **`facilities/models.py` — new `FacilityMembership`:**
   ```python
   class FacilityMembership(models.Model):
       class MemberRole(models.TextChoices):
           ADMIN = "admin", "Facility Admin"
           STAFF = "staff", "Facility Staff"
       id = UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
       user = FK("accounts.User", on_delete=CASCADE, related_name="facility_memberships")
       location = FK(Location, on_delete=CASCADE, related_name="memberships")
       role = CharField(choices=MemberRole.choices, default=ADMIN)
       created_at = DateTimeField(auto_now_add=True)
       class Meta:
           constraints = [UniqueConstraint(fields=["user", "location"], name="unique_membership")]
   ```

3. **`doctors/models.py` — link `Doctor` to `User`:**
   ```python
   user = models.OneToOneField(
       "accounts.User", null=True, blank=True,
       on_delete=models.SET_NULL, related_name="doctor_profile",
   )
   ```

4. Generate migrations per app. Add a **data migration** in `accounts` that sets `role="super_admin"` for existing `is_superuser=True` users and leaves the role blank for everyone else (existing plain `is_staff` users get flagged in the migration output for manual review — there is no automatic way to know which facility or doctor they map to). No patient rows exist to migrate.

**Verify:**
```bash
python manage.py makemigrations && python manage.py migrate && python manage.py check
```
**Acceptance:** migrations apply cleanly; `check` reports no issues.

---

## Phase 2 — Permission classes, scoping mixin, resolver helpers

**Files:** `core/permissions.py` (extend), new `core/scoping.py`.

1. **`core/scoping.py` — one place that maps any object → its owning `Location` / `Doctor`.** Provide two helpers used by both permissions and querysets so the mapping is never duplicated:
   - `location_id_for(obj)` → resolves the location UUID for `Location`, `Hospital`, `DiagnosticCenter`, `Chamber`, `FacilityTest`, `DoctorAffiliation`, `AffiliationSchedule` (via `affiliation.location`), `DoctorBooking` (via `affiliation.location`), `LabBooking` (via `facility_test.location`).
   - `doctor_id_for(obj)` → resolves the doctor UUID for `Doctor`, `DoctorAffiliation`, `AffiliationSchedule`, `DoctorBooking`.

2. **`core/permissions.py` — add role permission classes:**
   - `IsSuperAdmin` — `request.user.is_super_admin`.
   - `ScopedFacilityOrReadOnly` — public read; write allowed if super admin, **or** if `location_id_for(obj)` ∈ `request.user.managed_location_ids` (facility admin), **or** (for doctor-owned objects) `doctor_id_for(obj)` belongs to `request.user.doctor_profile`.
   - `IsDoctorOwnerOrReadOnly` — public read; write allowed if super admin or the object's doctor is the requester's `doctor_profile`.
   - Keep the old `IsAdminUserOrReadOnly` temporarily for a clean cutover, then delete in Phase 6.

   `has_permission` returns `True` for SAFE methods and for authenticated users with a write-capable role; the real enforcement is in `has_object_permission` (for updates/deletes) plus create-path validation (Phase 3).

3. **`RoleScopedQuerysetMixin`** in `core/scoping.py` — a viewset mixin exposing `scoped_queryset(qs)` that:
   - returns `qs` unchanged for super admins and for **SAFE public catalog reads** (so public browsing is never narrowed);
   - narrows to the caller's locations/doctor when the viewset opts into private scoping (bookings, dashboard, and any `?scope=managed` request).
   Each viewset declares how it reaches location/doctor via small attributes (e.g. `scope_location_field = "location__in"`, `scope_doctor_field = "doctor__user"`).

**Verify:** `python manage.py check` and a quick shell import test of the new classes.
**Acceptance:** modules import; no circular-import errors (resolvers use string/lazy lookups).

---

## Phase 3 — Wire the viewsets (the core of the work)

For every write endpoint, enforcement happens in **two** places — object-level permission (update/delete) **and** create-path validation (create has no object yet, so `has_object_permission` never fires). Missing the create path is the most common RBAC hole; do both.

1. **Facilities** (`facilities/views.py`): swap `IsAdminUserOrReadOnly` → `ScopedFacilityOrReadOnly` on `LocationViewSet`, `HospitalViewSet`, `DiagnosticCenterViewSet`, `ChamberViewSet`, and the `FacilityTest` viewset in `tests/views.py`. Keep global catalog/category viewsets (`HospitalCategory`, `DoctorSpecialty`, `TestCategory`, `Test`, services) as **super-admin-write / public-read** (`IsSuperAdmin`-or-read-only) — taxonomy is platform-owned, not facility-owned. On create/update, validate in `perform_create`/serializer that the target `location` is in the caller's `managed_location_ids` (or caller is super admin).

2. **Doctors** (`doctors/views.py`):
   - `DoctorViewSet`: `IsDoctorOwnerOrReadOnly`. A doctor may edit only their own record. Facility admins may edit doctors **affiliated with their location** (resolve via `affiliations__location__in managed_location_ids`) — decide and document whether facility admins can edit core doctor bio or only affiliations; recommended: affiliations/schedules yes, core bio no.
   - `DoctorAffiliationViewSet` / `AffiliationScheduleViewSet`: `ScopedFacilityOrReadOnly` combined with doctor-ownership. On create, a doctor must set `doctor = request.user.doctor_profile`; a facility admin must set a `location` in their managed set. Enforce in `perform_create`.

3. **Bookings** (`bookings/views.py`): replace the `is_staff` branch in `get_queryset` with role scoping:
   - super admin → all;
   - facility admin → bookings whose location ∈ managed set (`affiliation__location__in` / `facility_test__location__in`);
   - doctor → `affiliation__doctor__user == request.user`;
   - anonymous / non-staff → `none()` (they can create a booking but never enumerate bookings; already the case after the patient-removal step).
   Status transitions (confirm/cancel/complete) should be writable by the owning facility admin, the owning doctor (doctor bookings), and super admin — enforce in `has_object_permission`.

4. **Dashboard** (`core/views.py`): `AdminInitAPIView` → `IsAuthenticated`, and every queryset inside it runs through the same role scoping (super admin sees all; facility admin sees only their locations' bookings/tests; doctor sees own). Remove the `AllowAny` + `is_staff` branch.

5. **Managed-listing UX:** add an optional `?scope=managed` query param on catalog viewsets so the React dashboard can request "only what I manage" while public browse stays unscoped. Public list (no param) must return the full catalog.

**Verify:** targeted pytest (written in Phase 6) plus manual `curl`/`APIClient` spot checks for cross-facility denial.
**Acceptance:** a facility admin gets `403` writing another facility's test; a doctor gets `403` editing another doctor's schedule; a patient gets `403` on any catalog write; anonymous users still read the catalog `200`.

---

## Phase 4 — Serializers, JWT, `/auth/me/`, admin registration

**Files:** `accounts/serializers.py`, `accounts/views.py`, `core/settings.py`, `accounts/admin.py`, `facilities/admin.py`, `doctors/admin.py`.

1. **`UserSerializer` / `UserProfileSerializer`:** add `role`, `managed_locations` (id + name list), and `doctor_id` so the frontend can pick the right dashboard scope without extra calls.
2. **JWT claims (optional but recommended):** add a custom `TokenObtainPairSerializer` embedding `role`; wire via `SIMPLE_JWT` / a token view. Keeps middleware/permission checks cheap.
3. **Login only (registration already removed):** public self-registration is gone; privileged accounts are provisioned by a super admin (Django admin or a dedicated endpoint). Login stays for the three roles. **Remove the hardcoded demo-admin bypass** from `LoginSerializer` and replace the demo account with a seeded, properly-hashed super admin (Phase 6 seed).
4. **Django admin:** register `FacilityMembership`, `Doctor.user`, and ensure admin access remains super-admin-only (default `is_staff`+`is_superuser`). Add inlines (e.g. `FacilityMembership` inline on `User` and on `Location`) so super admins can assign facility admins from the "advanced dashboard" (Django admin satisfies the Super Admin requirement out of the box).

**Verify:** `GET /api/auth/me/` returns `role` + scope for each role; login no longer accepts the old demo bypass.
**Acceptance:** `/auth/me/` payload drives the frontend; removed bypass has a regression test.

---

## Phase 5 — Frontend role branching (optional in this pass, but specified)

**Files:** `src/views/AdminDashboard/context/AdminContext.jsx`, `src/services/api.js`, dashboard tabs.

- `AdminContext` currently branches on `is_staff || is_superuser`. Branch on `role` instead: super admin → all tabs; facility admin → tabs scoped to their locations (hide platform taxonomy tabs, call catalog endpoints with `?scope=managed`); doctor → a "My Profile / Affiliations / Schedules / My Bookings" view only.
- `api.js` already attaches the JWT; add `scope=managed` on dashboard list calls and read `role`/`managed_locations` from the stored user.

**Acceptance:** each role sees only the tabs/data it may act on; writes outside scope surface the backend `403` cleanly.

---

## Phase 6 — Tests, seed, cleanup, hardening

**Files:** new `tests/factories.py` + `tests/test_rbac.py`, `seed_*.py`, delete legacy permission class.

1. **Factories** (`factory-boy`, already installed): `UserFactory` (per role), `LocationFactory`, `FacilityMembershipFactory`, `DoctorFactory(+user)`, `FacilityTestFactory`, `DoctorAffiliationFactory`, booking factories.
2. **RBAC test matrix** (`tests/test_rbac.py`) — role × resource × action. Minimum boundary cases:
   - anonymous: catalog read `200`; catalog write `401/403`; **booking create `201`** (no account needed); booking list `none()`;
   - facility admin: write own-location test/price/affiliation `200`; **other** location `403`; sees only own bookings in dashboard;
   - doctor: edit own profile/affiliation/schedule `200`; another doctor's `403`; sees only own bookings;
   - super admin: all `200`; Django admin reachable;
   - regression: old demo-admin login bypass now `400`.
3. **Seed** a super admin + one sample facility admin (with membership) + one doctor-linked user, using hashed passwords via `create_user`.
4. **Cleanup:** remove `IsAdminUserOrReadOnly` once nothing imports it; ensure no viewset still uses it.
5. **Hardening notes** to include in the PR description: rotate `SECRET_KEY` for prod, set `CORS_ALLOW_ALL_ORIGINS=False` with an allow-list, confirm `DEBUG=False` path.

**Verify:**
```bash
pytest -q            # full suite incl. test_rbac.py
python manage.py check --deploy
```
**Acceptance:** full suite green; RBAC matrix passes; no import of the deleted permission class remains.

---

## 3. Execution order & dependencies

```
Phase 0 ─▶ Phase 1 ─▶ Phase 2 ─▶ Phase 3 ─▶ Phase 4 ─▶ Phase 6
                                    └────────▶ Phase 5 (parallel, needs Phase 4 /auth/me)
```

Each phase is a self-contained commit. Do not merge until Phase 6 is green. The two highest-risk, most-forgotten items are: **(a)** create-path validation in Phase 3 (object-level perms don't cover `create`), and **(b)** keeping the public catalog unscoped while scoping writes and private listings. Give both explicit tests.

## 4. Definition of done

- Super admin: unrestricted API + Django admin; can assign facility admins and doctor links from admin.
- Facility admin: full CRUD on their location(s)' tests, prices, affiliations, staff memberships, and bookings — and nothing outside their location(s).
- Doctor: full CRUD on their own profile, affiliations, schedules, and own bookings — and nothing else.
- Public catalog reads unchanged; bookings are publicly creatable with patient identity stored inline; no patient accounts exist.
- Demo-admin bypass removed; RBAC test matrix passing; deploy checklist noted.
