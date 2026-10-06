#!/usr/bin/env python
"""API contract check (plan V.5.3).

Compares the currently generated schema for every version in ALLOWED_VERSIONS
against the committed snapshot in docs/api/openapi.<version>.json.

- versions in API_FROZEN_VERSIONS: any breaking change (decision D9) fails the
  check; --update never overrides this.
- unfrozen versions: breaking changes are printed as warnings.
- ANY difference to the snapshot fails the check ("snapshot out of date"), so
  every contract change shows up as a snapshot file change for review.
- --update rewrites the snapshot (except when frozen and breaking).

Run from doctors_hub_backend/ (or anywhere): python scripts/check_api_contract.py
"""
import argparse
import json
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BACKEND = ROOT / 'doctors_hub_backend'
DOCS = ROOT / 'docs' / 'api'

sys.path.insert(0, str(BACKEND))


def _ensure_deps():
    try:
        import django  # noqa: F401
        return
    except ImportError:
        pass
    for site in sorted((BACKEND / 'venv').glob('lib/python*/site-packages')):
        sys.path.insert(0, str(site))


_ensure_deps()
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

import django  # noqa: E402

django.setup()

from django.conf import settings  # noqa: E402
from drf_spectacular.generators import SchemaGenerator  # noqa: E402

from core.api_contract import PATIENT_SURFACE, UNVERSIONED_SURFACE  # noqa: E402
from core.contract_diff import breaking_changes  # noqa: E402

SURFACE = list(PATIENT_SURFACE) + list(UNVERSIONED_SURFACE)


def generate(version):
    return SchemaGenerator(api_version=version).get_schema(request=None, public=True)


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--update', action='store_true', help='rewrite the snapshot files')
    args = parser.parse_args(argv)

    exit_code = 0
    allowed_versions = [str(v) for v in (settings.REST_FRAMEWORK.get('ALLOWED_VERSIONS') or [])]
    for version in allowed_versions:
        version = str(version)
        frozen = version in settings.API_FROZEN_VERSIONS
        current = generate(version)
        snap_path = DOCS / f'openapi.{version}.json'

        if not snap_path.exists():
            print(f'{version}: no snapshot at {snap_path}, run with --update')
            exit_code = 1
            continue

        old = json.loads(snap_path.read_text())
        breaks = breaking_changes(old, current, SURFACE)

        if breaks:
            tag = 'BREAKING' if frozen else 'WARNING'
            for message in breaks:
                print(f'{tag} {message}')
            if frozen:
                exit_code = 1
                continue  # --update does not override a frozen contract

        if old != current:
            if args.update:
                snap_path.write_text(json.dumps(current, sort_keys=True, indent=2) + '\n')
                print(f'{version}: snapshot updated ({snap_path})')
            else:
                print(f'{version}: snapshot out of date, run with --update')
                exit_code = 1
        elif args.update:
            print(f'{version}: snapshot already up to date')

    return exit_code


if __name__ == '__main__':
    sys.exit(main())
