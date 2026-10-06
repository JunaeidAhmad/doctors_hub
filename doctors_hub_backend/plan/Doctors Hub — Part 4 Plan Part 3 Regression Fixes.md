# Doctors Hub — Part 4 Plan: Part 3 Regression Fixes

Oct 5, 2026 

Part 4 fixes every regression and gap found in the Part 3 review, starting with the admin edit that deletes chambers. Phases 1 and 2 stop live data loss and fake addresses; nothing else ships until those two gates pass.

## Ground rules

These rules apply to every phase. Breaking one is a failed phase, even if the code works.

1. **No git, at all.** Do not run any git command: no `status`, `diff`, `add`, `commit`, `stash`, `checkout`, `restore`, `branch`, `log`, `blame` or `git grep`. Search with `rg` (or `grep -rn` if `rg` is missing).
2. **Back up before you edit.** Before changing a file, copy it to `.part4-backup/phase-N/<same relative path>`. To undo a change, copy the backup back. The folder `.part4-backup/` stays in place for review; do not delete it.
3. **No invented data.** When a value is missing, show nothing, hide the element, or show a neutral label such as "Not listed". Never show a plausible-looking number, name, address, credential, schedule or ID. Never save a default the user did not enter. Rating and review defaults are the only exception (static by product decision).
4. **Gates are numbers, not opinions.** Each phase ends with a gate: a command and a threshold. Record the exact command and its real output. If a gate fails, write "FAILED" with the numbers, stop, and report. Never round a failure into a pass (Part 3 reported 49.2% as meeting "≥50%").
5. **Report what you skipped.** Keep `part4-agent-notes.md` in the repo root. For every phase list: files changed, backups made, commands run with output, gate result, and anything not done with the reason. The final summary must repeat every skipped item.
6. **Measure the same way every time.** Query counts use Django's `CaptureQueriesContext` or `assertNumQueries` on the test client. Payload sizes use `len(response.content)`. Use the same seeded data for before and after.
7. **Don't trust old notes.** Part 3's notes are inaccurate. Check the code before assuming anything was done.
8. **Stay in scope.** Fix what this plan lists. If you find a new problem, log it under "Found, not fixed" in the notes instead of fixing it silently.

## Phase 0: Baseline

Record the numbers every later gate compares against, and turn the two known bugs into failing tests first.

- [ ] P4.0.1 Create `part4-agent-notes.md` with one heading per phase and a "Found, not fixed" section.
- [ ] P4.0.2 Write `scripts/part4_measure.py` (a Django management command is fine). It seeds a fixed dataset, then prints query count and response bytes for each endpoint below. Run it and paste the output into the notes.
- [ ] P4.0.3 Write `tests/test_part4_regressions.py` as an empty file for later phases. Then reproduce the chamber deletion the way the reviewer did: build the payload DoctorModal sends today for a doctor with two chambers, send it to the chamber sync endpoint on a test database, and paste the before/after chamber list. The automated test comes in Phase 1.
- [ ] P4.0.4 Run the full test suite and record pass/fail counts. Pre-existing failures are listed, not fixed.

Seed for all measurements: 18 doctors, 2+ chambers each, 60+ facilities across 3+ districts, 10+ specialties with umbrellas, some doctors with no fee, no experience and no address.

| Endpoint | What to record | Part 3 reviewer figure |
| --- | --- | --- |
| Admin init | queries at 8 and 18 doctors | 237 → 267 |
| `/api/specialties/` | queries | 270 |
| Search metadata | queries | 57 |
| `/api/doctors/` list | queries, bytes | 12 queries |
| `/api/doctors/?search=` | queries, `EXPLAIN ANALYZE` plan | full scan expected |
| `GET /api/doctors/{id}/` | queries, bytes, has `chambers` | — |

**Gate 0:** notes file exists, measurement output is pasted, the deletion repro output is pasted.

## Phase 1: Stop DoctorModal deleting chambers

Editing a doctor must save exactly what the admin sees, built from the full doctor record. This phase is the top priority; until its gate passes, tell the user that admin doctor edits are unsafe.

**Root cause.** Admin init now sends the lean doctor shape (chambers, no affiliations). DoctorModal reads `editingDoctor.affiliations`, finds nothing, opens with one blank chamber, and the sync endpoint then deletes every chamber not in the payload. Two more bugs in the same modal drop or alter chambers even once the key is fixed.

- [ ] P4.1.1 **Fetch the full doctor on edit.** When the modal opens in edit mode, call `GET /api/doctors/{id}/`. Show a loading state and keep Save disabled until it returns. If the fetch fails, show an error and keep Save disabled. Never build the form from the admin-init list object.
- [ ] P4.1.2 **Read the right key.** Check what the detail endpoint actually returns for chambers (key name, facility fields, schedule fields) and write it down in the notes. Map the form from that. Remove every read of `affiliations` in DoctorModal.
- [ ] P4.1.3 **Pull the payload builder out.** Move "form state → sync payload" into a pure function (for example `buildChamberSyncPayload(form)`) in its own file so it can be tested.
- [ ] P4.1.4 **Remove the `allLocations` filter.** Existing chambers keep their facility whether or not it is among the 50 facilities admin init loads. Show the facility name from the chamber record itself. When the admin picks a facility for a new chamber, the picker must still show the current facility as selected even if it is not in the preloaded list.
- [ ] P4.1.5 **Remove the invented schedule.** Delete the code that adds Saturday 17:00–21:00 to a chamber with no schedule. A chamber with no schedule is saved with none and shown as "No schedule set". Check the backend sync too, and remove any default schedule there.
- [ ] P4.1.6 **Remove the experience default.** DoctorModal saves `'10+ Yrs Exp.'` when experience is empty. Save empty instead. (Listed again in Phase 8 so the sweep confirms it.)
- [ ] P4.1.7 **Don't block saving on blank chambers.** If the doctor has zero chambers, the form opens with zero chambers. An empty chamber row the admin added but did not fill is dropped with a warning, not sent.
- [ ] P4.1.8 **Tests.** In the frontend: a test of the payload builder with a full doctor that has two chambers at facilities outside the preloaded 50 and one chamber with no schedule. Edit only the name; assert the payload contains all chambers, the original schedules, and no added schedule. If the frontend has no test runner, use a plain Node script with `assert` and record how to run it. In the backend, add to `test_part4_regressions.py`: the detail endpoint returns every chamber with facility id, name and schedules.
- [ ] P4.1.9 **Find data already lost.** Part 3 has been live, so admins may already have deleted chambers. List doctors whose chambers were removed since Part 3 was deployed (use timestamps, admin logs or audit rows, whichever exist). Compare against the most recent database backup if one exists. Write the list in the notes. Do not restore anything without the user's approval.

**Gate 1:** the Phase 0 repro, run again with the new payload builder, deletes nothing. P4.1.8 tests pass. `rg -n "affiliations" <DoctorModal file>` and `rg -n "allLocations" <DoctorModal file>` return no matches. `rg -n "17:00|21:00|10\+ Yrs"` across the admin source returns no default-value matches. The lost-data list is in the notes, even if it is empty.

## Phase 2: Real addresses and fees on doctor cards

Search cards must show each chamber's real facility address, or no address, and the real fee, or no fee. Today every Dhaka-district chamber shows "Dhanmondi Branch, Road 2, Dhaka" and a missing fee shows ৳1,200.

- [ ] P4.2.1 **Add `address` to `FacilityMiniSerializer`.** Use the facility's own address field. Check that this adds no queries (the facility is already joined); if it does, fix the `select_related`. Record the payload size change for `/api/doctors/` in the notes. Phase 4's size gate is measured after this, so the address counts.
- [ ] P4.2.2 **DoctorChamberCard.** Delete the code that turns "Dhaka" into "Dhanmondi Branch, Road 2, Dhaka". Show `facility.address` when present. When absent, show the district name labelled as a district (for example "Dhaka district"), or nothing; never a street.
- [ ] P4.2.3 **DoctorChamberCard fee.** Delete the ৳1,200 fallback. No fee means the fee line is hidden or reads "Fee not listed".
- [ ] P4.2.4 **DoctorCard.** Use `facility.address` first, then the labelled district. Remove any other hard-coded place or fee fallback in the file.
- [ ] P4.2.5 **Other readers of the mini facility.** `rg -n "FacilityMini|facility\.(address|district)"` in the frontend; check each hit handles a missing address without inventing one. List the files in the notes.
- [ ] P4.2.6 **Tests.** Backend: `/api/doctors/` returns `address` for each chamber facility, and `null` (not a placeholder) when the facility has none. Frontend: render DoctorChamberCard with a Dhaka facility that has no address and no fee; assert neither "Dhanmondi" nor "1,200" appears.

**Gate 2:** P4.2.6 tests pass. `rg -n "Dhanmondi|Road 2|1,?200"` in the frontend source returns no fallback matches (real seed or fixture data is fine; list any hits and why they are allowed).

## Phase 3: Admin doctor screens off `affiliations`

No admin component reads `affiliations` after this phase. The list screen uses the lean `chambers` from admin init; detail and edit screens load the full doctor.

| Component | Data source after fix | Invented values to remove here |
| --- | --- | --- |
| DoctorsTab | lean `chambers` from admin init | BMDC `'A-28490'`, fee `1500`, return-visit fee (60% of fee) |
| DoctorOverview | full doctor | `affiliations.length \|\| 2`, fee `1500` |
| DoctorScheduleManager | full doctor | fee `1500` |
| DoctorAffiliationsManager | full doctor | check during the work |

- [ ] P4.3.1 **One way to load a full doctor.** Add a shared hook or helper (for example `useFullDoctor(id)`) that calls `GET /api/doctors/{id}/` and returns loading, error and data. DoctorModal from Phase 1 uses it too.
- [ ] P4.3.2 **DoctorsTab.** Read chamber count and facility names from `chambers`. Missing BMDC shows "Not listed". Missing fee shows nothing. Remove the computed return-visit fee; show it only if the API returns a real value.
- [ ] P4.3.3 **DoctorOverview.** Load via P4.3.1. Chamber count is `chambers.length`, which may be 0. Remove the fee fallback.
- [ ] P4.3.4 **DoctorScheduleManager.** Load via P4.3.1. Remove the fee fallback.
- [ ] P4.3.5 **DoctorAffiliationsManager.** Load via P4.3.1. **If it saves through the chamber sync endpoint, it has the same deletion risk as DoctorModal.** It must send the full chamber list built from the full doctor, using the Phase 1 payload builder. Add a test like P4.1.8 for it.
- [ ] P4.3.6 **Any other caller of the sync endpoint.** `rg -n "chambers/"` in the frontend. Every caller that sends a PUT must start from the full doctor. List them in the notes.

**Gate 3:** `rg -n "affiliations"` across the admin frontend returns no reads of doctor data (backend-facing names in API paths are fine; list them). `rg -n "A-28490|1500|\* ?0\.6"` across the admin returns no fallbacks. P4.3.5 test passes. Manually open each of the four screens for a doctor with 0, 1 and 3 chambers, and record what each shows.

## Phase 4: Finish the doctor payload work

Part 3's payload gate failed (49.2% smaller, not ≥50%; queries 12 → 12) and the consumer inventory was never written. This phase writes the inventory first, then changes the payload only where the inventory says it is safe.

- [ ] P4.4.1 **Consumer inventory.** Write `docs/part4-doctor-payload-consumers.md`. One row per place that reads a doctor object: file, component or function, which endpoint it gets the doctor from (list, detail, admin init, search), and every field it reads. Cover the web frontend, the admin, and the Flutter patient app (`rg` the Flutter project for the same field names). Find candidates with `rg -n "\.(affiliations|chambers|fee|bmdc|experience|specialt|facility)"`.
- [ ] P4.4.2 **Check the inventory against the serializers.** For each lean serializer field, list who reads it. For each field a consumer reads, confirm the endpoint it uses still returns it. Any read with no matching field is a bug like the two in this review: fix it or log it.
- [ ] P4.4.3 **Reach the size target honestly.** With Phase 2's `address` included, measure `/api/doctors/` bytes on the Phase 0 seed. Compare with the pre-Part 3 size (the figure behind Part 3's 49.2%; if it was never recorded, measure the full serializer on the same seed and use that). If the new size is at most 50% of it, done. If not, remove fields that the inventory shows no list consumer reads. If it still misses, stop and report the real number; do not change the target.
- [ ] P4.4.4 **Cut list queries below 12.** Use `select_related` for one-to-one and foreign keys (primary specialty, facility) and `prefetch_related` with `Prefetch` querysets for chambers and schedules. The count must not grow with the number of doctors returned.
- [ ] P4.4.5 **Payload tests** in `tests/test_part4_payload.py`: the list response has the agreed keys and no `affiliations`; detail has full chambers with schedules; list queries are equal at 5 and 20 doctors; list query count is below 12.

**Gate 4:** inventory doc exists and covers web, admin and Flutter. List payload is at least 50% smaller than the Part 3 baseline (report the exact percentage). List queries below 12 and flat from 5 to 20 doctors. P4.4.5 passes.

## Phase 5: Admin init queries

Admin init must run a fixed number of queries no matter how many doctors exist. Today it grows by about 3 queries per doctor (237 at 8 doctors, 267 at 18).

- [ ] P4.5.1 **Find all three per-doctor queries.** Run admin init at 8 and 18 doctors with query logging and group the queries by SQL shape. Write the repeated shapes in the notes. `select_related('primary_specialty')` covers one; find the other two before changing code.
- [ ] P4.5.2 **Fix them.** Add `select_related('primary_specialty')` and whatever `select_related` / `prefetch_related` the other two need. Watch for serializer methods (`SerializerMethodField`, properties) that query per object; replace them with annotated or prefetched values.
- [ ] P4.5.3 **Look at the fixed part too.** 237 queries for 8 doctors means about 210 queries that don't depend on doctors. List the biggest sources in the notes. Fix the ones that are plain N+1 loops over facilities or specialties; log the rest.
- [ ] P4.5.4 **Inventory doc.** Write `docs/part4-admin-init.md`: each key admin init returns, the serializer behind it, and which admin components read it.
- [ ] P4.5.5 **Tests** in `tests/test_part4_admin_init.py`: the query count is identical at 5 and 20 doctors; it is below a fixed ceiling (set it to the measured number after the fix, and write that number in the notes); doctors carry `chambers` and `primary_specialty`.

**Gate 5:** admin init queries identical at 8 and 18 doctors, and lower than 237. Report both numbers. P4.5.5 passes.

## Phase 6: Specialty counts and search metadata

Specialty and umbrella counts come from a fixed number of queries and live in one versioned cache that every relevant edit clears. This is Part 3's P3.4.2–4.4, which were never done.

- [ ] P4.6.1 **Map the current code.** In the notes, list every function that computes specialty or umbrella counts, every cache key it reads or writes (including `specialty_counts_v1`), and every endpoint that uses them (`/api/specialties/`, search metadata, any others).
- [ ] P4.6.2 **Remove the per-umbrella loop.** Compute specialty counts in one aggregate query: count distinct doctors per specialty, using the same visibility filter as doctor search (published, active, whatever search applies). Compute umbrella totals from that result in Python, or in one more grouped query. Count distinct doctors for umbrellas too, so a doctor with two specialties under one umbrella counts once.
- [ ] P4.6.3 **One versioned cache.** Store counts under one key that includes a version number, for example `search_meta:v{n}`. Keep `n` in the cache. Delete `specialty_counts_v1` and every read and write of it.
- [ ] P4.6.4 **Clear it on every edit that changes counts.** Bump the version from `post_save` and `post_delete` on Doctor, Specialty, umbrella, Facility and the chamber model, and from `m2m_changed` on doctor–specialty links. Bulk updates skip signals; call the same bump function in any admin action or management command that uses `.update()` or `bulk_create()`.
- [ ] P4.6.5 **Search metadata.** Make the search-metadata endpoint read counts from the P4.6.3 cache and load facilities once. Remove its remaining per-item queries.
- [ ] P4.6.6 **Tests** in `tests/test_part4_specialties.py`: `/api/specialties/` query count is the same with 5 and 25 specialties; search metadata likewise; editing a doctor's specialty changes the counts on the next request with no manual cache clear; a doctor with two specialties under one umbrella counts once; `rg -n "specialty_counts_v1"` finds nothing.

**Gate 6:** `/api/specialties/` queries fixed and far below 270 on a cold cache, and 0–2 on a warm cache. Search-metadata queries below 57 and fixed. Report all four numbers. P4.6.6 passes.

## Phase 7: Search that uses its indexes

`/api/doctors/?search=` must use an index for the real query Django sends, proven by `EXPLAIN ANALYZE`. Today it ORs many columns across joins, some unindexed (`bmdc_number`, `academic_title`, `institution`, `specialty_source`), so Postgres will almost certainly scan the whole table.

- [ ] P4.7.1 **Fix migration 0022 first.** Add `dependencies` on the latest migrations of the doctors and tests apps that create the indexed tables, and on the migration that enables `pg_trgm`. Run `migrate` on an empty database to prove the order works. For production, consider `AddIndexConcurrently` in a non-atomic migration so the tables aren't locked; note the choice.
- [ ] P4.7.2 **Capture the real SQL.** Log the exact query for `?search=card` and `?search=A-1234`. Write down every column and join it ORs together.
- [ ] P4.7.3 **Check the index matches the operator.** Django's `icontains` on Postgres emits `UPPER(col) LIKE UPPER('%…%')`. A trigram index on the plain column is not used for that. Either index the expression (`OpClass(Upper('col'), name='gin_trgm_ops')`) or change the lookup to match the index. Prove it with `EXPLAIN` on one column.
- [ ] P4.7.4 **Make the combined query indexable.** Recommended: add a `search_text` column on Doctor that concatenates every searched value, including specialty names, chamber facility names, `bmdc_number`, `academic_title`, `institution` and `specialty_source`. Put one trigram GIN index on it, keep it updated from the same signals as Phase 6, backfill it in a data migration, and search only that column. Alternative: run one indexed subquery per column or table and combine the doctor ids with `UNION`. Record which you chose and why.
- [ ] P4.7.5 **Prove it on realistic data.** On tiny tables Postgres scans anyway, so seed at least 10,000 doctors for this check. Paste `EXPLAIN (ANALYZE, BUFFERS)` before and after for both P4.7.2 searches. The after-plan must show a Bitmap Index Scan on the new index, with no Seq Scan on the doctors table.
- [ ] P4.7.6 **Tests** in `tests/test_part4_search.py`: a search by each searched field finds the right doctor (including BMDC number and a facility name); a doctor edit updates `search_text`; results match the old search on the Phase 0 seed (same doctor ids). Mark the plan check Postgres-only.

**Gate 7:** `migrate` from empty passes. Before and after `EXPLAIN` output is in the notes and the after-plan uses the index. P4.7.6 passes.

## Phase 8: Invented data sweep

No screen shows, and no form saves, a value that didn't come from the database or the user. Part 3's gate greps passed only because they searched for specific strings; this phase uses broad patterns and triages every hit.

| Location | Invented value | Fix | Phase |
| --- | --- | --- | --- |
| DoctorQualificationsTimeline | `'MBBS, FCPS'`, BSMMU institution | Show real qualifications; hide the section if none | 8 |
| DoctorProfileHero | `'15+ Years'` | Hide the experience stat when missing | 8 |
| DoctorServicesSection | `specialties[0] \|\| 'Clinical Specialty'` | Hide the label when there is no specialty | 8 |
| HospitalServiceBookingModal | random `HSB-######` booking ID | See P4.8.2 | 8 |
| DoctorChamberCard | fake address, ৳1,200 fee | Done in Phase 2; confirm | 2 |
| DoctorsTab, DoctorOverview, DoctorScheduleManager | BMDC, fee 1500, 60% return fee, `\|\| 2` | Done in Phase 3; confirm | 3 |
| DoctorModal (saved) | `'10+ Yrs Exp.'` | Done in Phase 1; confirm | 1 |
| Hospital modal, diagnostic modal, FacilityProfile (saved) | default `open_timing` | Start empty; save only what the user enters | 8 |

- [ ] P4.8.1 **Public pages.** Fix the first three rows. A missing value hides its element; it never shows a placeholder that looks like data.
- [ ] P4.8.2 **Booking ID.** Check what the booking API actually returns and the field name the modal reads; a mismatch is the likely cause. Show the real ID. If the response truly has none, show "Booking received" with no reference number, and log it to the console as an error. Never generate an ID on the client.
- [ ] P4.8.3 **Saved `open_timing` defaults.** In the hospital modal, diagnostic modal and FacilityProfile, start with empty timings. Saving with no timings sends none. Check the backend serializers and models for `default=` values that do the same, and remove them in a migration if found.
- [ ] P4.8.4 **Broad sweep.** Run these over the web and admin frontend, and paste the hit counts in the notes:
  - `rg -nP "(\|\||\?\?) *'?[0-9]{3,}"` (numeric fallbacks)
  - `rg -nP "(\|\||\?\?) *['\"\x60][A-Z]"` (capitalised text fallbacks)
  - `rg -n "Math\.random|Date\.now\(\)"` (generated IDs)
  - `rg -nP "(useState|defaultValue|initialValues?)\b.*['\"][A-Z0-9]"` (prefilled form values)
- [ ] P4.8.5 **Triage every hit** in a notes table: file, line, value, decision (removed / kept), reason. Allowed to keep: rating and review defaults, UI copy such as button labels, and genuine empty-state text like "Not listed".
- [ ] P4.8.6 **Data already saved.** Count records in the database that hold the old defaults (`'10+ Yrs Exp.'`, the default `open_timing`, the auto-added Saturday 17:00–21:00 schedule). Write the counts in the notes. Do not change them without the user's approval; propose a cleanup script.
- [ ] P4.8.7 **Tests.** Render each public component in the table with an empty doctor and assert none of the removed strings appear. Add the four sweep commands to a check script so they can be rerun.

**Gate 8:** every sweep hit is triaged with no unexplained keeps. P4.8.7 passes. Saved-default counts are in the notes.

## Phase 9: RBAC tests that call the endpoints

Every row of the 72-row RBAC inventory gets a test that sends a real request as each role and checks the status code. Today the tests only check role properties, and the gate names `test_part2_roles.py`, which doesn't exist.

- [ ] P4.9.1 **Drive the tests from the inventory.** Load the inventory (or a machine-readable copy of it: method, path, allowed roles) and generate one parametrized test per row × role. Store the copy next to the inventory so the two can't drift; add a check that both have 72 rows.
- [ ] P4.9.2 **Assert real responses.** Disallowed role → 403 (or 401 when anonymous). Allowed role → not 401/403. Use fixtures that make every path resolvable (real ids), so a 404 isn't mistaken for a pass; fail the test on 404.
- [ ] P4.9.3 **Fix the gate command.** Point it at the real test file name. Write the exact command in the notes.
- [ ] P4.9.4 **Report mismatches, don't hide them.** If an endpoint's behaviour disagrees with the inventory, the test fails. Decide with the user whether the code or the inventory is wrong; don't edit the inventory to make tests pass.

**Gate 9:** the RBAC suite runs 72 rows × every role, the gate command runs as written, and all tests pass or each failure is listed with the user's decision.

## Phase 10: Correct the records and report

The Part 3 notes and baseline doc must say what actually happened, and the Part 4 summary must list every gate number and every skipped item.

- [ ] P4.10.1 **Fix `part3-agent-notes.md`.** Add a "Corrections (Part 4)" section. For each Part 3 phase, state what was not done or failed, using the review: no consumer inventory, payload tests or full-doctor fetch; payload gate failed (49.2%, queries 12 → 12); P3.4.2–4.4 not done; no `select_related`, inventory or tests for admin init; no after-EXPLAIN or `test_part3_search.py`; RBAC tests didn't hit endpoints; wrong gate file name. Don't delete the original text; mark it as superseded.
- [ ] P4.10.2 **Fill the Part 3 baseline doc.** Replace the empty "to be filled" table with the real pre-Part 3 numbers if they exist. If they don't, say so in the table and point to the Phase 0 numbers.
- [ ] P4.10.3 **Final run.** Run the full test suite and `scripts/part4_measure.py` once more. Paste both.
- [ ] P4.10.4 **Summary** at the top of `part4-agent-notes.md`, in this shape:

| Phase | Gate | Before | After | Result |
| --- | --- | --- | --- | --- |
| 1 DoctorModal | chambers deleted on name-only edit | 2 | 0 |  |
| 2 Doctor cards | fake address or fee shown | yes | no |  |
| 3 Admin screens | `affiliations` reads in admin | 5+ files | 0 |  |
| 4 Doctor payload | list size vs original; list queries | 49.2%; 12 |  |  |
| 5 Admin init | queries at 8 / 18 doctors | 237 / 267 |  |  |
| 6 Specialties | `/api/specialties/`; search metadata queries | 270; 57 |  |  |
| 7 Search | after-plan uses index | no |  |  |
| 8 Invented data | untriaged sweep hits | — | 0 |  |
| 9 RBAC | endpoint-level tests | 0 of 72 |  |  |

Under the table, list every skipped or failed item with its reason, every "Found, not fixed" item, and the open user decisions (data restore from P4.1.9, saved-default cleanup from P4.8.6, RBAC mismatches from P4.9.4).

**Gate 10:** the summary table has a real number in every After cell and a Result for every row. Every skipped item from every phase appears in the summary.
