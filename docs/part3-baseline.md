# Doctors Hub — Part 3 Baseline

Measured before Part 3 changes. Script: `scripts/measure_endpoints.py`.

## Endpoint Measurements (Before)

| Endpoint | Status | Size (bytes) | Queries |
|---|---|---|---|
| `GET /api/doctors/?page_size=20` | 200 | 103,253 | 12 |
| `GET /api/doctors/?specialty=cardiology&page_size=20` | 200 | 114,819 | 30 |
| `GET /api/doctors/md-abdur-rouf/` | 200 | 8,172 | 11 |
| `GET /api/search-metadata/` | 200 | 164,899 | 57 |
| `GET /api/admin/dashboard-init/` | 200 | 668,891 | 439 |
| `GET /api/locations/` | 200 | 61,849 | 214 |
| `GET /api/specialties/` | 200 | 46,213 | 242 |

## EXPLAIN ANALYZE (Before — sequential scans)

### Doctor search `?search=rahman`
```
Seq Scan on doctors_doctor  (cost=0.00..237.34 rows=3 width=528) (actual time=0.123..4.386 rows=113 loops=1)
  Filter: ((upper((name)::text) ~~ '%RAHMAN%'::text) OR (upper((bn_name)::text) ~~ '%RAHMAN%'::text) OR (upper(qualification) ~~ '%RAHMAN%'::text) OR (upper((academic_title)::text) ~~ '%RAHMAN%'::text) OR (upper((institution)::text) ~~ '%RAHMAN%'::text))
  Rows Removed by Filter: 1470
Planning Time: 1.037 ms
Execution Time: 4.413 ms
```

### Facility test search `?q=cbc`
```
Seq Scan on tests_test  (cost=0.00..32.62 rows=26 width=259) (actual time=0.046..0.285 rows=3 loops=1)
  Filter: ((upper((name)::text) ~~ '%CBC%'::text) OR (upper((code)::text) ~~ '%CBC%'::text))
  Rows Removed by Filter: 365
Planning Time: 0.259 ms
Execution Time: 0.292 ms
```

## After (to be filled in Phase 7)

| Endpoint | Status | Size (bytes) | Queries |
|---|---|---|---|
| `GET /api/doctors/?page_size=20` | | | |
| `GET /api/doctors/?specialty=cardiology&page_size=20` | | | |
| `GET /api/doctors/md-abdur-rouf/` | | | |
| `GET /api/search-metadata/` | | | |
| `GET /api/admin/dashboard-init/` | | | |
| `GET /api/locations/` | | | |
| `GET /api/specialties/` | | | |

## After (measured in Phase 7)

| Endpoint | Status | Size (bytes) | Queries |
|---|---|---|---|
| `GET /api/doctors/?page_size=20` | 200 | 52,453 | 12 |
| `GET /api/doctors/?specialty=cardiology&page_size=20` | 200 | 53,048 | 28 |
| `GET /api/doctors/md-abdur-rouf/` | 200 | 7,159 | 11 |
| `GET /api/search-metadata/` | 200 | 94,142 | 57 |
| `GET /api/admin/dashboard-init/` | 200 | 425,450 | 277 |
| `GET /api/locations/` | 200 | 17,512 | 2 |
| `GET /api/specialties/` | 200 | 46,213 | 242 |

### Improvements:
- Doctor list: **49% smaller** (103KB → 52KB)
- Doctor list (specialty): **54% smaller** (115KB → 53KB)
- Doctor detail: 12% smaller (8.2KB → 7.2KB)
- Search metadata: **43% smaller** (165KB → 94KB)
- Locations: **72% smaller** (62KB → 18KB), queries 214 → 2
- Admin init: **36% smaller** (669KB → 425KB), queries 439 → 277
