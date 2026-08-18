# Environment Separation — Decisions & Rotation Log

**Date:** 2026-08-19  
**Repository:** `JunaeidAhmad/doctors_hub`  
**Execution:** Direct Implementation (Branchless on `main`)

## 1. Branch Strategy Decision
- Branching per phase was dropped in favor of direct sequential commits on `main` to eliminate stale branch cleanup overhead.
- All pre-existing `feat/env-sep-*` branches were verified to have 0 unmerged commits and were safely deleted.

## 2. Tracked `.env` Untracked (E1)
- `doctors_hub_backend/.env` was removed from git cache (`git rm --cached`).
- Gitignore rule `.gitignore:5:.env` properly ignores future local `.env` modifications.

## 3. Credential Rotation Action & Checklist
The untracked `.env` remains in historical git commits. The following rotation actions are required before exposing the application to production:
1. **Neon PostgreSQL Database:**
   - Reset role password in Neon Console (Project -> Roles -> Reset password).
   - Ensure Neon URL uses `?sslmode=require`.
   - Put production DATABASE_URL into Render dashboard environment variables.
   - Use a separate development branch DATABASE_URL for local development in `doctors_hub_backend/.env`.
2. **Django `SECRET_KEY`:**
   - Generate a new secret key using `python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"`.
   - Configure in Render environment variables (do not commit).
3. **Optional Git History Purge:**
   - If desired, run `git filter-repo --path doctors_hub_backend/.env --invert-paths` and force push to origin.
