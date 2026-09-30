# Doctors Hub — Part 1 Baseline & After Measurements

Recorded on: 2026-09-29 (Baseline) → 2026-09-30 (After Part 1 Completion)

## Endpoint Measurements

| Endpoint | HTTP Status | Baseline Size | After Size | Reduction | Notes |
|---|---|---|---|---|---|
| `GET /api/diagnostic-centers/?page_size=50` | 200 | 5,762,347 B (~5.76 MB) | 18,434 B (~18.4 KB) | **-99.68%** | Nested tests/doctors removed from list shape |
| `GET /api/hospitals/` | 200 | 2,167,190 B (~2.17 MB) | 24,870 B (~24.9 KB) | **-98.85%** | Embedded tests & doctors replaced with dedicated sub-endpoints |
| `GET /api/hospitals/green-life-hospital-dhanmondi/` | 200 | 103,167 B (~103 KB) | 1,138 B (~1.1 KB) | **-98.90%** | Hospital detail shape streamlined |
| `GET /api/doctors/` | 200 | 99,098 B (~99 KB) | 97,790 B (~97.8 KB) | **-1.32%** | Paginated doctor list (page_size default 20) with lightweight next_available |
| `GET /api/search-metadata/` | 200 | 500,902 B (~501 KB) | 162,814 B (~163 KB) | **-67.50%** | Pruned taxonomy payload & search terms |
| `GET /api/search-facets/` | 200 | 60,624 B (~61 KB) | 60,479 B (~60.5 KB) | **-0.24%** | Facets payload |

## Database Row Counts

| Model | Baseline Count | After Count | Delta | Status |
|---|---|---|---|---|
| `FacilityTest` | 4,671 | 4,671 | 0 | 100% Preserved |
| `Test` | 368 | 368 | 0 | 100% Preserved |
| `TestCategory` | 54 | 54 | 0 | 100% Preserved |
| `Location` (chamber) | 7 | 7 | 0 | 100% Preserved |
| `Location` (diagnostic_center) | 19 | 19 | 0 | 100% Preserved |
| `Location` (hospital) | 43 | 43 | 0 | 100% Preserved |
| `Location` (Total) | 69 | 69 | 0 | 100% Preserved |
| `Doctor` | 1,581 | 1,581 | 0 | 100% Preserved |
| `DoctorAffiliation` | 1,684 | 1,684 | 0 | 100% Preserved |
| `AffiliationSchedule` | 5,299 | 5,299 | 0 | 100% Preserved |
| `DoctorBooking` | 14 | 14 | 0 | 100% Preserved |
| `Division` | 8 | 8 | 0 | 100% Preserved |
| `District` | 64 | 64 | 0 | 100% Preserved |
| `Thana` | 597 | 597 | 0 | 100% Preserved |
