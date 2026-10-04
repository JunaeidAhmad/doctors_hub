from django.core.cache import cache

PUBLIC_CACHE_VERSION_KEY = 'public_cache_version'


def public_cache_version() -> int:
    return cache.get(PUBLIC_CACHE_VERSION_KEY, 1)


def bump_public_cache():
    try:
        cache.incr(PUBLIC_CACHE_VERSION_KEY)
    except ValueError:
        cache.set(PUBLIC_CACHE_VERSION_KEY, 2, None)
