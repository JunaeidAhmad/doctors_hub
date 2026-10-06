"""Per-version serializer selection (plan V.8.2 / decision D11).

Ready for v2; intentionally not applied to any real view yet.

A view declares, for example:

    serializer_classes = {'v1': {'list': A, 'default': B}}

`get_serializer_class()` picks the entry for `request.version`; if that version
has no entry for the action, it falls back to the nearest lower version that
has one, then to `super()`.
"""


def _version_number(version) -> int:
    text = str(version)
    digits = text.lstrip('v')
    return int(digits) if digits.isdigit() else -1


class VersionedSerializerMixin:
    serializer_classes = {}

    def _entry_for(self, table, action):
        return table.get(action, table.get('default'))

    def get_serializer_class(self):
        version = getattr(self.request, 'version', None)
        tables = getattr(self, 'serializer_classes', None) or {}
        if version is None or not tables:
            return super().get_serializer_class()

        candidates = [v for v in tables if _version_number(v) <= _version_number(version)]
        candidates.sort(key=_version_number, reverse=True)
        for candidate in candidates:
            entry = self._entry_for(tables[candidate], self.action)
            if entry is not None:
                return entry
        return super().get_serializer_class()
