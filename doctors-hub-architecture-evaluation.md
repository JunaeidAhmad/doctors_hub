# doctors_hub architecture evaluation

Evaluated against the earlier implementation plan by reading the actual repo
(`JunaeidAhmad/doctors_hub`, `doctors_hub_backend/`). Organized by severity —
work top to bottom.

---

## ✅ Confirmed done correctly

- `Address`, `PracticeLocation`, and `Hospital`/`DiagnosticCenter`/`Chamber` as
  one-to-one detail tables — matches the plan exactly, including the
  `PracticeLocation.detail` property and `location_type`-based dispatch.
- `FacilityTest` (renamed from `DiagnosticCenterTest`) — single `location` FK,
  `UniqueConstraint(location, test)`, and `clean()` rejecting chambers. Correct.
- `BaseBooking` abstract model with `Status` choices, `notes`, `updated_at`;
  `DoctorBooking` has the `UniqueConstraint(affiliation, date, slot)`. Correct.
- App split into `accounts` / `facilities` / `doctors` / `tests` / `bookings` /
  `core` / `services`, with a clean, fresh migration history (no leftover
  pre-redesign migrations). Correct.
- Every serializer uses an explicit `fields` tuple — no `fields = '__all__'`
  anywhere in the four app `serializers.py` files. Done.
- `services/test_pricing.py` raises `ValidationError` on a missing price
  instead of generating a synthetic one. Done.

---

## 🔴 Bugs — will break in production, fix first

### 1. `Pillow` missing from `requirements.txt`
`PracticeLocation.logo`/`.image` are `ImageField`. `ImageField` requires
Pillow. Not present in `requirements.txt`.
```
pip install Pillow
# add to requirements.txt
```

### 2. No media configuration
No `MEDIA_ROOT`/`MEDIA_URL` in `core/settings.py`, no media serving in
`core/urls.py`. Uploaded images have no defined storage location or URL.
```python
# settings.py
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'
```
```python
# core/urls.py
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [...] 
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
```

### 3. Register/login throttle rates are configured but never applied
`DEFAULT_THROTTLE_RATES` defines `register: 10/hour` and `login: 20/hour`, but
no view sets `throttle_scope`. Currently both endpoints only get the blanket
anon rate (100/day) — 10x looser than intended.
```python
# accounts/views.py
from rest_framework.throttling import ScopedRateThrottle

class RegisterAPIView(generics.CreateAPIView):
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "register"
    ...

class LoginAPIView(APIView):
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "login"
    ...
```

### 4. `DoctorAffiliation.CONSULTATION_TYPES` lost `OPD`
Current: `[("In-patient", "In-patient"), ("Chamber", "Chamber"), ("Doctor", "Doctor")]`,
`default="Chamber"`. `"Doctor"` was a legacy query-param alias in the old
`views.py` filter logic (`if consultation_type in ['Doctor', 'OPD']`), not a
real consultation type — it shouldn't have ended up as a model choice.
```python
CONSULTATION_TYPES = [
    ("OPD", "OPD"),
    ("In-patient", "In-patient"),
    ("Chamber", "Chamber"),
]
```

### 5. `attach_tests_to_location` can't update an existing price
It always calls `FacilityTest.objects.bulk_create(objs_to_create)`. With
`UniqueConstraint(location, test)` in place, calling this a second time for a
test already offered at that location raises `IntegrityError` instead of
updating the price — breaks the normal "edit facility test pricing" flow.
```python
existing = {
    ft.test_id: ft
    for ft in FacilityTest.objects.filter(location=location, test__in=tests_to_attach)
}
to_create, to_update = [], []
for test in tests_to_attach:
    price_data = test_prices.get(str(test.id))
    if not price_data or 'price' not in price_data:
        raise ValidationError(f"Missing required price for test: {test.name}")
    if test.id in existing:
        ft = existing[test.id]
        ft.price = price_data['price']
        ft.original_price = price_data.get('original_price')
        to_update.append(ft)
    else:
        to_create.append(FacilityTest(location=location, test=test,
                                       price=price_data['price'],
                                       original_price=price_data.get('original_price')))
if to_create:
    FacilityTest.objects.bulk_create(to_create)
if to_update:
    FacilityTest.objects.bulk_update(to_update, ['price', 'original_price'])
```

### 6. Seed script doesn't produce stable IDs across a drop + reseed
`seed_db.py` uses `Model.objects.get_or_create(name=...)` with every model's
default `uuid.uuid4()` — random per row, per run. This directly fails the
"frontend stays consistent after a full drop + reseed" requirement: the same
conceptual hospital/doctor/test gets a *different* UUID every time the DB is
rebuilt, breaking anything in the frontend that references an ID rather than
a slug.
```python
# seeding/ids.py
import uuid
SEED_NAMESPACE = uuid.UUID("6f6a9b2e-6f2b-4b7a-9b1e-6a1f7c2d9e10")

def seed_uuid(key: str) -> uuid.UUID:
    return uuid.uuid5(SEED_NAMESPACE, key)
```
Then in `seed_db.py`, replace `get_or_create(name=...)` with
`update_or_create(id=seed_uuid(f"doctor-specialty:{slug}"), defaults={...})`
for every model, keyed on the item's own slug/name from `mockData.json` so
the key is stable across runs.

---

## 🟠 Regressions — not asked for, worth a decision before moving on

### 7. All query filtering was removed
The original `HospitalViewSet` / `DiagnosticCenterViewSet` / `DoctorViewSet`
filtered by `location`, `area`, `category`, `specialty`, `search`, `fee_max`,
`day`. None of that exists in the current `get_queryset` — every ViewSet is a
bare `queryset = X.objects.all()`. If the frontend has search/filter UI, it's
currently calling endpoints that silently ignore every query param.

### 8. Slug-based object lookup was removed
No `get_object` override, no `lookup_field`, `django-filter` not installed —
everything is raw-UUID-only via `DefaultRouter`'s default `pk` lookup. Any
frontend route built on a slug URL now 404s.

**Recommendation:** confirm with whoever did this pass whether 7 and 8 were
deliberate scope cuts. If not, both are covered by Phase 4 of the
implementation plan (`django-filter` `FilterSet`s + `SlugOrPkLookupMixin`) and
weren't picked up.

---

## 🟡 Hygiene items from the plan, still outstanding

- **Legacy aliases** — deliberately kept as "backward compatibility" routes
  (`branches`, `diagnostic-center-tests`, `branch-tests`,
  `hospital-specialties`, `doctor-specialties`, `pathology-tests`, plus the
  matching serializer/viewset assignments). Reasonable as a transition
  measure — put a removal date on it rather than carrying both indefinitely.
- **`AffiliationSchedule.day_of_week`** is still `CharField(max_length=20)`
  with no `choices` — `"Mnday"` is still valid data.
- **`AdminInitAPIView`** still returns full unpaginated `hospitals`,
  `diagnostic_centers`, `doctors`, `tests`, `branch_tests` dumps.
- **No `services/scheduling.py`** — `DoctorBooking.slot` still isn't
  validated against `AffiliationSchedule`; the uniqueness constraint only
  stops an *exact duplicate* string, not an invalid one.
- **No test suite.** `pytest-django` + `factory_boy` not present anywhere in
  the repo — genuinely worth prioritizing given how much branching logic now
  sits in `attach_tests_to_location` and the booking constraints.

---

## Priority order

1. Bugs 1–6 (media/Pillow, throttle scopes, `OPD`, price-update path,
   deterministic seeding) — each is small, isolated, and currently either
   broken or silently wrong.
2. Decide on regressions 7–8 — filtering and slug lookup — before more
   frontend work builds on the current (filter-less) API surface.
3. Hygiene items — day-of-week choices and `AdminInitAPIView` trimming are
   cheap; the scheduling helper and test suite are the two genuinely
   worthwhile remaining investments.
