import inspect
from django.urls import get_resolver, URLPattern, URLResolver

HTTP = ('get', 'post', 'put', 'patch', 'delete', 'head', 'options')
FRAMEWORK = ('rest_framework', 'django')

def _walk(patterns, prefix=''):
    for p in patterns:
        if isinstance(p, URLResolver):
            yield from _walk(p.url_patterns, prefix + str(p.pattern))
        elif isinstance(p, URLPattern):
            yield prefix + str(p.pattern), p.callback

def _original(fn):
    """DRF's @api_view wraps the user function in a closure named `func`."""
    code = getattr(fn, '__code__', None)
    if code and 'func' in code.co_freevars and fn.__closure__:
        return dict(zip(code.co_freevars, (c.cell_contents for c in fn.__closure__)))['func']
    return fn

def kwarg_unsafe_handlers(path_prefix='api/'):
    seen, bad = set(), []
    for route, cb in _walk(get_resolver().url_patterns):
        cls = getattr(cb, 'cls', None)
        if cls is None or not route.startswith(path_prefix):
            continue
        actions = getattr(cb, 'actions', None) or {}
        if actions:
            names = set(actions.values())
        else:
            names = {m for m in HTTP if any(m in b.__dict__ for b in cls.__mro__
                     if b.__module__.split('.')[0] not in FRAMEWORK)}
        for name in names:
            fn = getattr(cls, name, None)
            if fn is None:
                continue
            fn = _original(fn)
            key = (fn.__module__, fn.__qualname__)
            if key in seen or fn.__module__.split('.')[0] in FRAMEWORK:
                continue
            seen.add(key)
            if not any(p.kind is p.VAR_KEYWORD for p in inspect.signature(fn).parameters.values()):
                bad.append(f'{fn.__module__}.{fn.__qualname__}')
    return sorted(bad)
