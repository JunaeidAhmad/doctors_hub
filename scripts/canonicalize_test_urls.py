#!/usr/bin/env python
"""Canonicalize test URL literals to /api/v1/ (plan V.3.1).

Re-runnable one-off: rewrites string literals in doctors_hub_backend/tests/test_*.py
and doctors_hub_backend/bookings/tests.py from /api/... to /api/v1/... so the suite
exercises the canonical versioned path. Skips tests/test_api_versioning.py and
tests/test_legacy_alias.py, which deliberately use legacy paths.
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BACKEND = ROOT / 'doctors_hub_backend'

SKIP = {'test_api_versioning.py', 'test_legacy_alias.py'}
PATTERN = re.compile(r"(?<=[\"'])/api/(?!v\d+/|schema/|docs/|redoc/|app-config/)")
REPLACEMENT = '/api/v1/'


def targets():
    for f in sorted((BACKEND / 'tests').glob('test_*.py')):
        if f.name in SKIP:
            continue
        yield f
    yield BACKEND / 'bookings' / 'tests.py'


def main():
    total_files = 0
    total_repls = 0
    for path in targets():
        if not path.exists():
            continue
        text = path.read_text(encoding='utf-8')
        new_text, n = PATTERN.subn(REPLACEMENT, text)
        if n:
            path.write_text(new_text, encoding='utf-8')
            total_files += 1
            total_repls += n
            print(f'{path.relative_to(ROOT)}: {n} replacements')
    print(f'TOTAL: {total_repls} replacements in {total_files} files')
    return 0


if __name__ == '__main__':
    sys.exit(main())
