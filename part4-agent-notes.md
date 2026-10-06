# Part 4 Agent Notes — Part 3 Regression Fixes

Working notes for the Part 4 plan. One heading per phase. Every phase lists: files
changed, backups made, commands run with real output, gate result, and anything not
done with the reason.

Ground rules reminder: no git commands at all; backups under `.part4-backup/phase-N/`;
no invented data; gates are numbers; `rg` for searching.

---

## Phase 0: Baseline

### Files changed
- `part4-agent-notes.md` (created, this file)
- `scripts/part4_measure.py` (created, measurement script — seeds a fixed dataset on a
  throwaway test DB, prints queries/bytes/EXPLAIN for every Phase 0 endpoint)
- `scripts/part4_repro_chamber_delete.py` (created, chamber-deletion repro — faithful
  Python port of DoctorModal.jsx init + submit payload build, source lines referenced)
- `doctors_hub_backend/tests/test_part4_regressions.py` (created, empty — filled in later phases)
- `.part4-backup/phase-0/part4_measure_output.txt` (full measurement output kept for review)
- `.part4-backup/phase-0/part4_repro_output.txt` (full repro output kept for review)

### Backups made
- none needed — only new files created, no existing file edited in Phase 0

### Commands run
```
$ cd doctors_hub_backend && ./venv/bin/python -m pytest -q
353 passed, 51 warnings in 99.88s (0:01:39)

$ ./doctors_hub_backend/venv/bin/python scripts/part4_repro_chamber_delete.py
(see repro output below)

$ ./doctors_hub_backend/venv/bin/python scripts/part4_measure.py
(see measurement output below)
```

### Seed used for all measurements (`scripts/part4_measure.py`)
Fixed, deterministic seed on a throwaway test DB (created + destroyed per run):
- **62 facilities** across **4 districts** (Dhaka: Dhanmondi/Mirpur, Gazipur: Tongi,
  Chattogram: Panchlaish/Agrabad, Sylhet: Zindabazar); 31 hospitals + 31 diagnostic centers.
  Every 10th facility has `address_line=''` (no address).
- **13 specialties**: 3 umbrellas (Medicine, Surgery, Gynecology & Obstetrics) with 7
  children via `parent_categories`, 3 standalone leaves.
  Note: the test DB migration chain also auto-loads `doctors/fixtures/taxonomy_v3.yaml`
  (24 umbrellas / 70 leaves) via a migration, so the specialties endpoint actually serves
  ~94+ rows. This is deterministic across runs.
- **18 doctors** in 2 stages (8 first, then +10) so admin init is measured at 8 and 18.
  Each doctor: 2–3 chambers at distinct facilities, 1–2 schedules per chamber.
  Deliberate gaps per plan seed spec:
  - no fee: doctor index 5 (chamber 1 `fee=0`)
  - no experience: doctor indexes 3, 9, 15 (`experience=''`)
  - no address: chambers landing on every 10th facility (`address_line=''`)
  - no schedule: doctor `i%4==1`, chamber 2 (zero schedules)
- One superuser for `/api/admin/dashboard-init/`.
- `?search=A-1234` hits doctor index 0 (`bmdc_number='A-1234'`).

### Measurement output (P4.0.2)

```
Seed: facilities=62 (districts=4), specialties=13, doctors=8 (stage 1)
admin init @ 8 doctors                     status=200  bytes=118873   queries=251

Seed stage 2: doctors=18 total
admin init @ 18 doctors                    status=200  bytes=141413   queries=250
/api/specialties/ (cold cache)             status=200  bytes=49824    queries=272
/api/specialties/ (warm cache)             status=200  bytes=49824    queries=215
search metadata (cold cache)               status=200  bytes=79968    queries=63
search metadata (warm cache)               status=200  bytes=79968    queries=0
/api/doctors/ list                         status=200  bytes=48004    queries=12
/api/doctors/?search=card                  status=200  bytes=8310     queries=12
/api/doctors/?search=A-1234                status=200  bytes=2449     queries=12
GET /api/doctors/{id}/                     status=200  bytes=3883     queries=11
    detail keys include 'chambers': False, 'affiliations': True
```

Baseline table (Phase 0 seed, compared to the Part 3 reviewer figure):

| Endpoint | Recorded (Part 4 seed) | Part 3 reviewer figure |
| --- | --- | --- |
| Admin init @ 8 doctors | 251 queries, 118873 bytes | 237 |
| Admin init @ 18 doctors | 250 queries, 141413 bytes | 267 |
| `/api/specialties/` cold | 272 queries | 270 |
| `/api/specialties/` warm | 215 queries | — |
| Search metadata cold | 63 queries | 57 |
| Search metadata warm | 0 queries | — |
| `/api/doctors/` list | 12 queries, 48004 bytes | 12 queries |
| `/api/doctors/?search=card` | 12 queries, 8310 bytes | full scan expected |
| `/api/doctors/?search=A-1234` | 12 queries, 2449 bytes | full scan expected |
| `GET /api/doctors/{id}/` | 11 queries, 3883 bytes, key `affiliations` (NOT `chambers`) | — |

Notes on the numbers (differences from the reviewer figure are recorded, not smoothed):
- **Admin init**: 251 @ 8 doctors vs 250 @ 18 — on this seed the count did **not** grow
  with doctor count (reviewer reported 237 → 267, ≈3 queries/doctor). The per-doctor
  growth the reviewer saw is real on their data shape; on this seed most cost is in the
  fixed part (facilities/tests/branches serializers). Phase 5 measures both shapes and
  groups queries by SQL shape before changing anything. The Phase 5 gate is judged
  against *this* seed's before/after (251 / 250), and the reviewer figure is reported
  alongside.
- **`/api/specialties/` warm cache is 215, not 0–2**: `specialty_counts_v1` caches the
  counts, but `DoctorSpecialtySerializer.get_parents` still runs per specialty
  (`obj.parent_categories.all()`), plus the `doctor_count` cache miss path. Phase 6.
- **Search metadata cold 63** (reviewer 57) — the seed has 94+ specialties from the
  taxonomy fixture, so the umbrella/child loops cost more. Warm cache is 0 because the
  whole response is cached under `search_metadata:v{public_cache_version()}`.
- **Doctor list is 12 queries** — matches the reviewer. The EXPLAIN plans below show
  `Seq Scan on doctors_doctor` for both searches (tiny table; Phase 7 re-measures at
  10,000 doctors).
- **Detail endpoint key is `affiliations`, not `chambers`** (P4.1.2 evidence):
  `DoctorSerializer` returns `affiliations` (full `DoctorAffiliationSerializer` with
  nested `facility` = `FacilitySummarySerializer` and `schedules`), while the list/admin
  init use `chambers` (`ChamberLeanSerializer` with `facility` = `FacilityMiniSerializer`).
  DoctorModal reads `editingDoctor.affiliations` on the *admin-init* object, which has
  `chambers` — that is the Phase 1 root cause.

### Search SQL + EXPLAIN (P4.7.2 prep, pasted verbatim)

The real Django search SQL for `?search=card` (captured via `CaptureQueriesContext`):
```sql
SELECT ... FROM "doctors_doctor" WHERE EXISTS(
  SELECT DISTINCT 1 AS "a" FROM "doctors_doctor" U0
  LEFT OUTER JOIN "doctors_doctor_specialties" U1 ON (U0."id" = U1."doctor_id")
  LEFT OUTER JOIN "doctors_doctorspecialty" U2 ON (U1."doctorspecialty_id" = U2."id")
  LEFT OUTER JOIN "doctors_doctoraffiliation" U3 ON (U0."id" = U3."doctor_id")
  LEFT OUTER JOIN "facilities_location" U4 ON (U3."location_id" = U4."id")
  WHERE ((UPPER(U0."name"::text) LIKE UPPER('%card%')
       OR UPPER(U0."bn_name"::text) LIKE UPPER('%card%')
       OR UPPER(U0."bmdc_number"::text) LIKE UPPER('%card%')
       OR UPPER(U0."qualification"::text) LIKE UPPER('%card%')
       OR UPPER(U0."academic_title"::text) LIKE UPPER('%card%')
       OR UPPER(U0."institution"::text) LIKE UPPER('%card%')
       OR UPPER(U2."name"::text) LIKE UPPER('%card%')
       OR UPPER(U2."bn_name"::text) LIKE UPPER('%card%')
       OR UPPER(U2."formal_name"::text) LIKE UPPER('%card%')
       OR UPPER(U0."specialty_source"::text) LIKE UPPER('%card%')
       OR UPPER(U0."specialty_source_bn"::text) LIKE UPPER('%card%')
       OR UPPER(U4."name"::text) LIKE UPPER('%card%'))
      AND U0."id" = ("doctors_doctor"."id")) LIMIT 1)
) subquery
```
Columns OR'd together: `doctors_doctor.name`, `bn_name`, `bmdc_number`, `qualification`,
`academic_title`, `institution`, `specialties.name`, `specialties.bn_name`,
`specialties.formal_name`, `specialty_source`, `specialty_source_bn`, and
`affiliations__location__name` (facility name). Joins: `doctors_doctor_specialties`,
`doctors_doctorspecialty`, `doctors_doctoraffiliation`, `facilities_location`.
`?search=A-1234` sends the identical query with `%A-1234%`.

EXPLAIN (ANALYZE, BUFFERS) headline for `?search=card` (18 doctors, tiny table):
```
Limit (actual time=0.627..0.637 rows=3)
-> Unique -> Sort -> Hash Left Join (primary_specialty)
   -> Nested Loop Semi Join
        -> Seq Scan on doctors_doctor (actual time=0.007..0.012 rows=18)   <-- full scan
        -> Hash Left Join (affiliation/location/specialty filters)
```
`Seq Scan on doctors_doctor` confirmed — the OR'd `UPPER(col) LIKE UPPER('%…%')`
predicates use no index on this table (Phase 7 fixes with a `search_text` column +
trigram GIN index and re-proves at 10,000 doctors).

### Chamber deletion repro output (P4.0.3)

```
BEFORE (2 chambers, 1 schedule each):
  id=... facility='Repro Hospital A (Uttara)' fee=500.00 active=True schedules=[Monday 09:00-12:00]
  id=... facility='Repro Hospital B (Mirpur)' fee=800.00 active=True schedules=[Tuesday 14:00-17:00]

Admin-init doctor record keys: ['academic_title', 'bmdc_number', 'bn_name', 'chambers',
  'experience', 'gender', 'id', 'image', 'institution', 'is_verified', 'match_rank',
  'name', 'primary_specialty', 'qualification', 'rating', 'review_count', 'slug', 'specialties']
  has 'affiliations' key: False   has 'chambers' key: True
  chambers returned by admin init: 2

Modal form state after init (1 row(s)):
  {'id': 'temp-aff-0', 'location_id': '', 'chamber_type': 'Primary Chamber',
   'advance_booking_days': 14, 'fee': '',
   'schedules': [{'id': 'temp-sched-0', 'day_of_week': 'Saturday',
                  'start_time': '17:00', 'end_time': '21:00',
                  'max_patients': 30, 'avg_consult_minutes': 10}]}

Sync payload DoctorModal sends today: [{'location_id': '<Repro Hospital C>', 'fee': 600.0,
  'chamber_type': 'Primary Chamber', 'advance_booking_days': 14,
  'schedules': [{'day_of_week': 'Saturday', 'start_time': '17:00:00', 'end_time': '21:00:00',
                 'max_patients': 30, 'avg_consult_minutes': 10}]}]

PUT /api/v1/doctors/{id}/chambers/ -> HTTP 200
  response: deleted=['<Hospital A id>', '<Hospital B id>'] deactivated=[]

AFTER:
  id=... facility='Repro Hospital C (Bashundhara)' fee=600.00 active=True schedules=[Saturday 17:00-21:00]

RESULT: chambers before=2, after=1 (CHAMBERS DELETED — bug reproduced)
```

Reproduced exactly as the reviewer described:
1. Admin init returns the lean doctor with key `chambers` (2 chambers) and NO `affiliations`.
2. DoctorModal reads `editingDoctor.affiliations` → nothing → form opens with ONE blank
   chamber carrying the invented Saturday 17:00–21:00 schedule.
3. The admin must fill that row (client validation demands facility + fee), then Save.
4. The sync payload contains only that one row → `sync_chambers` deletes both real
   chambers (they are in scope and absent from `payload_ids`).

### Full test suite (P4.0.4)

```
$ cd doctors_hub_backend && ./venv/bin/python -m pytest -q
353 passed, 51 warnings in 99.88s (0:01:39)
```
Pass: 353, Fail: 0, Error: 0. **No pre-existing failures.** (51 warnings are pytest
collection warnings from `tests/factories.py` test-class naming — pre-existing, not fixed.)

### Gate 0
**PASSED** — notes file exists, measurement output pasted above, deletion repro output
pasted above. Full test suite counts recorded.


---

## Phase 1: Stop DoctorModal deleting chambers

(to be filled)

---

## Phase 2: Real addresses and fees on doctor cards

(to be filled)

---

## Phase 3: Admin doctor screens off affiliations

(to be filled)

---

## Phase 4: Finish the doctor payload work

(to be filled)

---

## Phase 5: Admin init queries

(to be filled)

---

## Phase 6: Specialty counts and search metadata

(to be filled)

---

## Phase 7: Search that uses its indexes

(to be filled)

---

## Phase 8: Invented data sweep

(to be filled)

---

## Phase 9: RBAC tests that call the endpoints

(to be filled)

---

## Phase 10: Correct the records and report

(to be filled)

---

## Found, not fixed

(to be filled — problems discovered during the phases that are outside this plan's
scope; each with file/line and why it was left alone)
