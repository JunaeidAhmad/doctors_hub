# Doctors Hub — Part 3 API Changes

This document describes API changes made in Part 3. The Flutter patient app follows this document.

---

## Locations

- `/api/locations/` is now **paginated** (was unpaginated).
- New query param `view=picker` returns a lean shape: `id`, `slug`, `display_name`, `location_type`, `area`, `district`, `is_active`.
- `?search=` and `?location_type=` continue to work.

---

## Doctor List Item Shape

`/api/doctors/` list items now use a lean serializer:

- Fields: `id`, `slug`, `name`, `bn_name`, `academic_title`, `qualification`, `institution`, `experience`, `image`, `gender`, `bmdc_number`, `rating`, `review_count`, `is_verified`, `primary_specialty`, `specialties`, `chambers`, `match_rank`.
- **`chambers`** replaces `affiliations` in list contexts. Each chamber: `id`, `fee`, `chamber_type`, `is_active`, `facility` (mini), `schedules`, `next_available`.
- **`specialties`** is a list of `{id, slug, name, bn_name}`, ordered primary first. **`specialty_tags`** is removed.
- **`primary_specialty`** is `{id, slug, name, bn_name}` or `null`.
- `match_rank` is present only when the specialty filter annotates it.

### Detail (`/api/doctors/{id}/`)
- `specialty_tags` is removed.
- `specialties` uses the same lean shape as the list.
- `affiliations` (full shape) is kept for admin/detail contexts.

---

## Meta Keys

When `?specialty=` is given, the response includes `meta` with:
`specialty`, `specialty_bn`, `slug`, `is_umbrella`, `primary_count`, `secondary_count`, `related_count`, `match_count`.

**Removed:** `tier1_count`, `tier2_count`.

---

## Search Metadata

`/api/search-metadata/` now returns:
- **`facilities`**: a single list with mini shape (`id`, `slug`, `display_name`, `location_type`, `area`, `district`, `district_id`).
- **Removed:** `hospitals`, `diagnostic_centers` (filter `facilities` by `location_type` instead).

---

## Admin Init

- `doctors`: uses `DoctorListSerializer` (lean shape as above).
- `tests`: uses `TestOptionSerializer` — `id`, `name`, `code`, `category_id`, `category_name`, `is_active`.

---

## Doctor Search

- `about` is **removed** from doctor search fields. Searching by `?search=` no longer matches against the `about` text.

---

## Specialties

- No changes to `/api/specialties/` or `/api/specialty-aliases/`.
