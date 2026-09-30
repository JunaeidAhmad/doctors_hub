# Doctors Hub — Part 1 Implementation Agent Notes & Architectural Decisions

This document details key engineering decisions, gotchas resolved, design trade-offs, and technical rationale established during the implementation of Part 1.

---

## 1. Session Key Architecture (`session_key`)

### Rationale & Design
During the redesign of doctor availability and appointments, we eliminated the legacy artificial 15-minute slot system (`slot: "05:15 PM"`). In Bangladesh hospital and chamber OPD workflows:
- Doctors visit for a block session (e.g., 5:00 PM – 9:00 PM).
- Patients receive an incremental serial number (e.g., Serial #1, Serial #2) within that session window.
- The estimated consultation time is calculated as `session_start + (serial_number - 1) * avg_consult_minutes`.

To uniquely identify which session a patient is booking when multiple schedules or ad-hoc sessions exist on the same date:
- For regular weekly schedules: `s:<schedule_uuid>` (e.g., `s:01912a3b-...`)
- For ad-hoc extra sessions (from `ScheduleException` of kind `'extra'`): `x:<exception_uuid>` (e.g., `x:01912a3c-...`)

### Benefits
1. **Collision Resistance**: Disambiguates between recurring schedule slots and ad-hoc / emergency visiting hours on the same date.
2. **Stateless Identification**: The booking engine immediately knows whether to look up `AffiliationSchedule` or `ScheduleException` without ambiguity or secondary queries.
3. **Database Portability**: The `session_key` is stored directly on `DoctorBooking.session_key` with a database index, allowing fast aggregation and seat reservation counts.

---

## 2. Dynamic Schedule Exceptions & Availability Engine

### The Exception Precedence Hierarchy
When calculating availability for an affiliation on a given date `D`:
1. Check for `ScheduleException` entries on date `D`:
   - If `kind == 'cancel'` for schedule `S`: That recurring schedule session is suppressed entirely (`status: 'cancelled'` or omitted).
   - If `kind == 'modify'` for schedule `S`: The recurring schedule hours, `max_patients`, and `avg_consult_minutes` are overridden by the exception's parameters.
   - If `kind == 'extra'`: A new distinct session is injected for that date with key `x:<exception_id>`.
2. Any regular schedule for that day of week that is neither cancelled nor modified is rendered with its standard parameters.

### Concurrency & Capacity Guard
- `select_for_update()` is utilized during `create_doctor_booking` within `transaction.atomic()` to guarantee serial numbers increment sequentially (1, 2, 3...) without gaps or race conditions under high concurrent booking loads.
- If `booked_count >= effective_capacity`, the booking is rejected with HTTP 400.

---

## 3. Two-Step Doctor Onboarding & Retry Safety

### Problem Solved
Previously, creating an affiliated doctor was a single-pass action where a doctor profile and an affiliation were created simultaneously. If the affiliation failed (e.g. facility permission error, duplicate location link, network timeout), retrying would create orphan duplicate `Doctor` rows in the platform database.

### Implementation Decision
1. **Explicit Two-Step UX Flow**:
   - **Step 1**: Search existing registered platform doctors by Name (`?search=`) or BMDC Registration Number (`?bmdc=`) with 300ms debounce.
   - If found, attach the existing doctor directly.
   - **Step 2**: Only offered if Step 1 yields 0 matching doctors.
2. **Stateful Retry Safety**:
   - The frontend `AffiliateDoctorDrawer` stores `createdDoctorId` in component state as soon as `createDoctor` returns 201.
   - If `createDoctorAffiliation` subsequently fails, a **Retry Link** button appears.
   - Clicking retry calls ONLY `createDoctorAffiliation` with `createdDoctorId`. `createDoctor` is never invoked twice in the same drawer session.
3. **Database Invariant**:
   - `UniqueConstraint(fields=['doctor', 'location'], name='unique_doctor_location')` strictly enforces at the PostgreSQL schema level that a doctor can only be affiliated with a specific facility once.

---

## 4. Query Bounds & Optimization

### N+1 Prevention & Batch Loading
- In `DoctorViewSet` and `DoctorAffiliationSerializer`, calculating `next_available` for a page of 20 doctors previously posed a high risk of N+1 queries.
- We implemented `batch_next_available(affiliation_ids, today)` in `AvailabilityService`, which:
  1. Loads all upcoming schedules and exceptions for the batch of affiliations in 2 queries.
  2. Loads active booking counts grouped by `(affiliation_id, date, session_key)` in 1 query.
  3. Computes the earliest available session per affiliation purely in Python memory.
  4. Passes `next_available_map` through serializer context.
- Query count on doctor search endpoints remained constant and well within bounds (tested ≤ 9–12 queries total).

---

## 5. Gotchas & Differences from Original Legacy Schema

1. **Django Test Server Host Header**:
   - In programmatic API calls via `rest_framework.test.APIClient` in standard scripts, Django enforces `ALLOWED_HOSTS`. Requests must include `HTTP_HOST='localhost'` or use test fixtures with `db` marker.
2. **Vite Build Asset Chunking**:
   - Vite builds with large admin panels generate vendor chunk warnings. We kept all components modular, clean, and tree-shakeable.
3. **PostgreSQL Unix Socket Requirement**:
   - As established in the workspace configuration, PostgreSQL runs on a local unix domain socket; subagent terminal commands interacting with the database must be executed with appropriate sandbox bypass permissions.
