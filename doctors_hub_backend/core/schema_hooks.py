import re

# Keep the canonical /api/vN/ paths (or the {version} placeholder form) and the
# unversioned app-config; drop the legacy /api/ alias and docs endpoints.
_KEEP = re.compile(r'^/api/(v\d+|\{version\})/|^/api/app-config/$')


def only_versioned_paths(endpoints, **kwargs):
    """Drop the legacy /api/ alias; keep /api/vN/ and the unversioned app-config."""
    return [e for e in endpoints if _KEEP.match(e[0])]
