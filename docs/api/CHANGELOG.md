# API Contract Changelog

Newest first. Format: what changed in the v1 contract (see `VERSIONING.md` for
what counts as breaking).

---

## 2026-10-05 — v1 introduced

- **v1 is the canonical API version.** All patient-surface endpoints live under
  `/api/v1/` (URL-path versioning, `URLPathVersioning`).
- **Legacy alias**: the unversioned `/api/…` prefix still resolves to v1 and is
  deprecated; it will emit `Deprecation`/`Sunset`/`Link` headers once
  `API_DEPRECATE_LEGACY` is enabled, and will be removed later.
- **`GET /api/app-config/`** added — unversioned, permanent, additive-only.
  App builds read their update gate (`client.status`) and the platform build
  requirements from it.
- **Client gating**: requests carrying `X-App-Platform` / `X-App-Build` below
  the supported minimum receive `426 Upgrade Required`
  (`app_update_required`); requests to a retired version receive
  `426 api_version_retired`.
- **Contract tooling**: `docs/api/openapi.v1.json` snapshot +
  `scripts/check_api_contract.py` (fails on breaking patient-surface changes
  once v1 is frozen).
