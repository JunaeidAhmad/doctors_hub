# Phase 0 — Baseline State

**Date:** 2026-08-19  
**Repository:** JunaeidAhmad/doctors_hub  
**Branch:** feat/env-sep-p0-baseline  

## 1. Tracked Files Audit
Tracked `.env` files in git index (`git ls-files | grep '\.env'`):
- `doctors_hub_backend/.env` (**Tracked in Git - Defect E1**)
- `doctors_hub/.env.example`

Plainly stated: `doctors_hub_backend/.env` is tracked in the repository despite `.env` being present in `.gitignore`.

## 2. Git Ignore Check
- `git check-ignore -v doctors_hub_backend/.env`: Returns exit code 1 because the file is currently tracked in the Git index (gitignore rules do not apply to already-tracked files in the index).
- `git check-ignore --no-index -v doctors_hub_backend/.env`: Returns `.gitignore:5:.env doctors_hub_backend/.env`, confirming the pattern `.env` in root `.gitignore` will match once untracked from cache.

## 3. Health Checks
- **Django Backend:** `python manage.py check` → `System check identified no issues (0 silenced).` (PASS)
- **React Frontend:** `npm run build` → `✓ built in 723ms` (PASS)

## Conclusion & Next Phase
Baseline verified green. `doctors_hub_backend/.env` is tracked and contains sensitive credentials. Proceed to Phase 1 to untrack `doctors_hub_backend/.env` from the git index without deleting local files and hand off credential rotation instructions to the operator.
