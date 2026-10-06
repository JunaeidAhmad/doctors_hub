"""System checks for versioning config (plan V.6.1)."""
import datetime
import re

from django.conf import settings
from django.core.checks import Error, register

VERSION_KEY_RE = re.compile(r'^(legacy|v\d+)$')


@register()
def check_deprecation_dates(app_configs, **kwargs):
    """core.E002: API_DEPRECATIONS/API_SUNSETS keys and dates must be well-formed."""
    errors = []
    for setting_name in ('API_DEPRECATIONS', 'API_SUNSETS'):
        entries = getattr(settings, setting_name, {}) or {}
        for key, value in entries.items():
            if not VERSION_KEY_RE.match(str(key)):
                errors.append(Error(
                    f'{setting_name} key {key!r} must be "legacy" or "vN".',
                    id='core.E002',
                ))
            try:
                datetime.date.fromisoformat(str(value))
            except ValueError:
                errors.append(Error(
                    f'{setting_name}[{key!r}] = {value!r} is not an ISO date (YYYY-MM-DD).',
                    id='core.E002',
                ))
    return errors
