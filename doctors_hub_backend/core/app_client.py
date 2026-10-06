"""Mobile client identification from X-App-* headers (plan D6 / V.7.1).

A request without the headers (the web app) is never identified and never
gated. Invalid values are treated as absent, never as a 400.
"""
from dataclasses import dataclass

VALID_PLATFORMS = ('android', 'ios')


@dataclass(frozen=True)
class AppClient:
    platform: str | None = None
    build: int | None = None

    @classmethod
    def from_headers(cls, request) -> 'AppClient':
        platform = str(request.META.get('HTTP_X_APP_PLATFORM', '')).strip().lower()
        if platform not in VALID_PLATFORMS:
            platform = None
        raw_build = str(request.META.get('HTTP_X_APP_BUILD', '')).strip()
        build = int(raw_build) if raw_build.isdigit() and int(raw_build) > 0 else None
        return cls(platform=platform, build=build)

    @property
    def is_known(self) -> bool:
        return self.platform is not None and self.build is not None
