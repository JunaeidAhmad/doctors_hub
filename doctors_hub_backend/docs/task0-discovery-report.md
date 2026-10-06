# Task 0 — Backup and discovery report (2026-10-06)

No code changes. Read-only except backups.

## 1–3. Backups created under `backups/2026-10-06/` (paths relative to repo root)

| item | source | backup |
|---|---|---|
| taxonomy_v3.yaml | `doctors_hub_backend/doctors/fixtures/taxonomy_v3.yaml` | `backups/2026-10-06/doctors_hub_backend/doctors/fixtures/taxonomy_v3.yaml` |
| build_taxonomy.py | `doctors_hub_backend/doctors/fixtures/build_taxonomy.py` | `backups/2026-10-06/doctors_hub_backend/doctors/fixtures/build_taxonomy.py` |
| specialty_relations.py | `doctors_hub_backend/doctors/services/specialty_relations.py` | `backups/2026-10-06/doctors_hub_backend/doctors/services/specialty_relations.py` |
| file containing DoctorFilter | `doctors_hub_backend/doctors/views.py` (class at line 172) | `backups/2026-10-06/doctors_hub_backend/doctors/views.py` |
| models file containing DoctorSpecialty | `doctors_hub_backend/doctors/models.py` (class at line 12) | `backups/2026-10-06/doctors_hub_backend/doctors/models.py` |
| database dump | `python manage.py dumpdata` | `backups/2026-10-06/db.json` (6.7 MB, exit 0) |

## 4. Callers of the searched names (whole backend, excluding venv)

### related_node_ids / _cached_related_node_ids
- `doctors/services/specialty_relations.py:19` — `cache_clear()` inside `bump_taxonomy_version`
- `doctors/services/specialty_relations.py:48-67` — definitions (`_cached_related_node_ids`, `related_node_ids`)
- `doctors/views.py:23` — import
- `doctors/views.py:290` — call in `DoctorFilter.filter_specialty`
- `tests/test_specialty_taxonomy_v3.py:11-12` — imports
- `tests/test_specialty_taxonomy_v3.py:87` — `related_node_ids(leaf)` (asserts leaf not in related)

**Only one production caller of `related_node_ids`: `doctors/views.py:290`.**

### match_node_ids
- `doctors/services/specialty_relations.py:36-45` — definitions (`_cached_match_node_ids`, `match_node_ids`); `:18` cache_clear
- `doctors/views.py:23` — import; `:289` — call in `filter_specialty`
- `facilities/views_facility_actions.py:12` — import; `:127` — call (expands specialty param for facility doctor counts)
- `tests/test_specialty_taxonomy_v3.py:11` — import; `:83` — call; `:91-93,100` — `_cached_match_node_ids.cache_info()`

### resolve_specialty_exact
- `doctors/services/specialty_resolver.py:111` — definition; `:296` — internal use
- `doctors/views.py:24` — import; `:286` (`filter_specialty`); `:409` (list meta)
- `doctors/management/commands/seed_doctors.py:273,278,290`
- `facilities/views_facility_actions.py:11` — import; `:125` — call
- `tests/test_specialty_taxonomy_v3.py:14,106-109,171-175,244-245,265-266,311`
- `tests/test_part2_quick_fixes.py:7,169-172,257`

### related_overlap (rank-3 only annotation)
- `doctors/views.py:299,301,318` — build + annotate (only file)

### match_rank
- `doctors/serializers.py:414,426,466-467` (DoctorSerializer); `:576,584,609-610` (DoctorListSerializer)
- `doctors/views.py:320-326` (annotation + order_by); `:412` (meta rank_counts)
- `tests/test_specialty_taxonomy_v3.py:154-158,232-233`
- `tests/test_part2_quick_fixes.py:244,246,248`
- `tests/test_specialty_canonical.py:173-174`

### related_count
- `doctors/views.py:416,425` (meta)
- `tests/test_specialty_taxonomy_v3.py:164`

### match_count
- `doctors/views.py:417,426` (meta)
- `tests/test_specialty_taxonomy_v3.py:165,318`

## 5. How `DoctorViewSet.list` builds `response.data.meta`

`doctors/views.py:385-428`. After `filter_queryset`, pagination and serialization (default
`core.pagination.StandardResultsSetPagination`, PAGE_SIZE=20, so `response.data` is a dict):
if `?specialty=` is present and not `all`, `resolve_specialty_exact(spec_param)` resolves it,
then `rank_counts` groups the filtered queryset by `match_rank` (`values('match_rank').annotate(c=Count('id', distinct=True))`):
`primary_count` = rank 1, `secondary_count` = rank 2, `related_count` = rank 3,
`match_count` = primary + secondary. Keys written:
`specialty, specialty_bn, slug, is_umbrella, primary_count, secondary_count, related_count, match_count`.
Meta is only attached when `response.data` is a dict (paginated responses).

## 6. Tests

- Command: `cd doctors_hub_backend && ./venv/bin/python -m pytest` (pytest.ini: `DJANGO_SETTINGS_MODULE = core.settings`).
- No test references the `DoctorFilter` class by name. The specialty filter is covered indirectly
  through the list endpoint in `tests/test_specialty_taxonomy_v3.py`, `tests/test_part2_quick_fixes.py`,
  `tests/test_specialty_canonical.py`, `tests/test_search_facets.py:60`.
- Baseline note: taxonomy tests call `call_command('load_taxonomy', file='doctors/fixtures/taxonomy_v3.yaml')`
  (`tests/test_specialty_taxonomy_v3.py:27`) to populate the test DB.
