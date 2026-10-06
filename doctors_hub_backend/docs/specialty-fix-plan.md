# Specialty Search Fix

Oct 6, 2026

## How to run this

Run Tasks 0–5 in order, one opencode session per task, and only move on when that task's "Done when" checks pass. Because this is development, there is no feature switch, no staged rollout and no waiting period: old code is replaced directly.

1. Export this doc as Markdown and save it in the backend project as docs/specialty-fix-plan.md, so the agent can read it.
2. Paste the Agent rules block once into AGENTS.md at the project root (or at the top of each session).
3. For each task, start a fresh session, review the agent's plan before letting it edit, then paste the task prompt.
4. Read the agent's final report. If a "Done when" check fails, paste the failure back into the same session and ask it to fix only that.
5. Tasks 0–3 and 6 run in the Django backend; Task 4 in the web frontend; Task 5 in the Flutter app.

Decisions already made: Allergy sits only under Skin & Sexual Health; the related block always shows on page 1 when the specialty has related specialists, capped at 6.

## Agent rules

Paste this once into AGENTS.md; every task assumes it.

```
# Rules for the specialty search fix

Context: Doctors Hub. Django REST backend, React web frontend, Flutter patient app.
Full plan: docs/specialty-fix-plan.md. Do only the task you are given.

- Do NOT run any git command. This project is not using git for this work.
- Before editing a file for the first time, copy it to backups/<today>/<same relative path>.
- Find files by searching; never assume a path. If a file named in the task does not exist, stop and report what you found instead.
- Change only what the task asks. No unrelated refactors, renames or formatting passes.
- Keep every existing API response key under /api/v1/. Adding keys is allowed; removing or renaming is not.
- Every new user-facing string needs both English and Bangla versions.
- After editing, run the project's tests and linters. Fix failures you caused.
- End with a report: files changed, commands run, test results, anything you could not do.
```

## Task 0 — Backup and discovery

Read-only except for backups; it maps the code so later tasks don't guess paths.

Task 0: backup and discovery. Make no code changes.

1. Create backups/<today>/ and copy into it: taxonomy_v3.yaml, build_taxonomy.py, specialty_relations.py, the file containing DoctorFilter, and the models file containing DoctorSpecialty.
2. Dump the database: python manage.py dumpdata > backups/<today>/db.json
3. Report the exact path of each file listed in step 1.
4. Search the whole backend for these names and list every file + line that uses them: related_node_ids, _cached_related_node_ids, match_node_ids, resolve_specialty_exact, related_overlap, match_rank, related_count, match_count.
5. Report how the doctors list view builds response.data.meta.
6. Report how tests are run in this project (command) and whether any tests exist for DoctorFilter.

Done when: backups folder exists with db.json, and you have the report. Keep the report; Task 2 needs the caller list from step 4.

## Task 1 — Taxonomy

Adds curated leaf-to-leaf links and moves Allergy to one umbrella.

Task 1: taxonomy. Follow docs/specialty-fix-plan.md.

1. taxonomy_v3.yaml: set allergy-immunologist to parents: [14].
2. Add a new key related_leaves (list of leaf slugs) to every leaf. Do not touch the existing related key (it holds umbrella IDs).
3. Use these values exactly:
   - allergy-immunologist: [dermatologist, chest-specialist, ent-specialist, pediatric-pulmonologist]
   - pediatric-oncologist: [hematologist, cancer-specialist, child-specialist]
   - pediatric-neurologist: [neurologist, child-specialist]
   - spine-surgeon: [neurosurgeon, orthopedic-surgeon, pain-specialist]
   - rheumatologist: [orthopedic-surgeon, medicine-specialist, physical-medicine-specialist]
   - andrologist: [urologist, sexologist, infertility-specialist]
   - sexologist: [andrologist, psychiatrist, urologist]
   - interventional-neurologist: [neurologist, neurosurgeon]
   - fetomaternal-medicine-specialist: [gynecologist-obstetrician, sonologist]
4. For every other leaf, propose at most 4 related leaves: only specialties a patient could reasonably see for the same problem. Never link across unrelated body systems. Use [] when nothing fits. Write your proposals to docs/related-leaves-review.md as a table (leaf | related_leaves | one-line reason) so a human can review them.
5. DoctorSpecialty model: add related_leaves = models.ManyToManyField('self', symmetrical=False, blank=True, related_name='related_from') then run makemigrations and migrate.
6. build_taxonomy.py: after all leaves exist, resolve related_leaves slugs and set() the M2M. Raise an error if a slug is unknown, a leaf links to itself, or a list has more than 6 items.
7. Run build_taxonomy.py and print allergy-immunologist's parents and related_leaves from the DB.

Done when: build runs clean; Allergy shows one parent and four related leaves; docs/related-leaves-review.md exists. Read that review file yourself (or with a doctor) and correct any odd pairing in the YAML before Task 3.

## Task 2 — Backend exact-only filter

Replaces the sibling logic outright; no legacy copy is kept.

Task 2: make the specialty filter exact-only. Follow docs/specialty-fix-plan.md.

1. specialty_relations.py: add curated_related_ids(node) returning the IDs of node.related_leaves, cached the same way _cached_related_node_ids was. Clear this cache at the end of build_taxonomy.py.
2. Replace DoctorFilter.filter_specialty with:

```python
chosen = resolve_specialty_exact(value)
if not chosen:
    return queryset.none()
direct = list(match_node_ids(chosen))
return (queryset
        .filter(Q(primary_specialty__in=direct) | Q(specialties__in=direct))
        .annotate(match_rank=Case(
            When(primary_specialty__in=direct, then=Value(1)),
            default=Value(2), output_field=IntegerField()))
        .order_by('match_rank', '-is_verified', 'name', 'id')
        .distinct())
```

3. Remove the related_overlap annotation and anything that only existed for rank 3.
4. Doctors list meta: keep match_count (= exact count) and related_count (always 0). Add related_available: true when the chosen specialty has at least one related leaf.
5. Every other caller of related_node_ids / _cached_related_node_ids found in Task 0: switch it to curated_related_ids. Then delete the old umbrella-sibling functions.
6. Add tests:
   - Allergist & Immunologist filter returns only doctors with it as primary or secondary.
   - For every leaf in the DB, every returned doctor has that leaf as primary or secondary.
   - All match_rank 1 rows come before match_rank 2 rows.
   - meta contains match_count, related_count and related_available.
   - Filtering by umbrella (e.g. Skin & Sexual Health) still returns all its leaves' doctors.
7. Run all tests. Then call the list endpoint with specialty=Allergist & Immunologist and report count and meta.

Done when: tests pass; the Allergy call reports a count close to 18 (it can differ if data changed) with related_count: 0 and related_available: true; no file references the old sibling functions.

## Task 3 — Related specialists endpoint

A new route serves the small related block; old app builds never call it, so it is safe on v1.

Task 3: add GET /api/v1/doctors/related/. Follow docs/specialty-fix-plan.md.

Query params: specialty (name or slug, required), limit (default 6, max 12), plus the same location / gender / fee filters the doctors list accepts. Reuse that filter code; do not copy it.

1. Resolve specialty with resolve_specialty_exact. Unknown -> 400 with a clear message.
2. related = curated_related_ids(chosen). Empty -> 200 with {"specialty": slug, "results": []}.
3. Doctors whose primary or secondary specialty is in related, EXCLUDING any doctor who matches the chosen specialty directly. Apply the shared filters.
4. Order by the position of their specialty in the YAML related_leaves list, then -is_verified, then name. Slice to limit. No pagination.
5. Each result = the normal doctor list serializer fields + related_via: {slug, name, bn_name} of the related specialty that caused the match.
6. Cache responses for 10 minutes keyed by specialty + filters + limit, using the project's existing cache backend.
7. Tests: exclusion (no overlap with the main list), limit cap, empty related_leaves returns [], location filter applied, unknown specialty returns 400.
8. Run tests and report a sample response for allergy-immunologist.

Done when: tests pass and the sample shows at most 6 doctors, each with a related_via of Dermatologist, Chest Specialist, ENT Specialist or Pediatric Pulmonologist.

## Task 4 — Web frontend

Run in the React project after Tasks 2–3 are working locally.

Task 4: web UI for the specialty fix. Follow docs/specialty-fix-plan.md (copy it into this project first if it is not here).

Backup DoctorSearchPage.jsx, DoctorActiveFiltersBar.jsx, DoctorCard.jsx and the English/Bangla string files before editing.

1. Counter: in DoctorSearchPage.jsx and DoctorActiveFiltersBar.jsx, when a specialty filter is active show "<count> <specialty plural>", e.g. "18 Allergists & Immunologists". Use data.count; it is already the exact count.
2. DoctorCard.jsx: when a specialty filter is active and doctor.match_rank === 2, show a chip under the primary specialty: "Also practices <specialty>". No chip for rank 1.
3. New RelatedSpecialists.jsx:
   - Render after the last result, on page 1 only, when meta.related_available is true.
   - Fetch /api/v1/doctors/related/ with the same specialty and active filters, limit 6.
   - Heading "Other specialists who may help".
   - Reuse DoctorCard, plus a badge "Related: <related_via.name>" (bn_name in Bangla mode).
   - One "See all <specialty>" link per related specialty that applies that filter.
   - Load after the main list; never block it. 3-card skeleton while loading; hide the whole block on error or empty results.
4. Zero results: show "No <specialty plural> match these filters" with a "Clear location filter" button, then the related block.
5. Add every new string in English and Bangla.
6. Run the build and lint. Report changed files.

Done when: build passes; locally, the Allergy filter shows the exact count, chips on secondary matches, and the related block on page 1 but not page 2, in both languages.

## Task 5 / 6 — Final verification

One backend session that checks every specialty, then a short manual pass.

Task 6: verification only. Make no code changes unless a check fails; if one fails, report it and stop.

1. Write scripts/specialty_counts.py that prints, for every leaf: slug, exact count (doctors list endpoint with that specialty), related_available, and related block size. Save the output to docs/specialty-counts.txt.
2. Flag every leaf with an exact count of 0 and list doctors whose stored specialty text looks similar (legacy names, typos) so a human can fix the data.
3. Confirm by search that no file references the deleted umbrella-sibling functions.
4. Run the full backend test suite and report results.
