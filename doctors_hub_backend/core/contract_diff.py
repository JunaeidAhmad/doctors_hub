"""Contract diff (plan V.5.2).

Pure function `breaking_changes(old_schema, new_schema, surface)` comparing two
OpenAPI schemas according to decision D9. Schemas are compared in RESOLVED form
($ref is followed with a cycle guard, allOf is merged), never by component name,
so a renamed component with the same structure is not reported.

Breaking (surface operations only):

| Where | Breaking |
| --- | --- |
| Operation | Missing in new; its success status code changed |
| Query/path params | Removed; optional -> required; new required param; enum value removed |
| Request body | New required property; property removed; type or format changed; enum value removed |
| Response (success code) | Property removed; property no longer `required`; `nullable` false -> true; type or format changed; enum value **added**; array item schema changed by these same rules |
"""
from copy import deepcopy
import re


# --------------------------------------------------------------------------
# resolution
# --------------------------------------------------------------------------

def _merge(a, b):
    out = dict(a)
    for key, value in b.items():
        if key == 'properties' and isinstance(value, dict) and isinstance(out.get(key), dict):
            merged = dict(out[key])
            merged.update(value)
            out[key] = merged
        elif key == 'required' and isinstance(value, list) and isinstance(out.get(key), list):
            out[key] = sorted(set(out[key]) | set(value))
        else:
            out[key] = value
    return out


def resolve(node, components, stack=()):
    """Follow $ref and merge allOf; cycle-guarded (loops collapse to {})."""
    if isinstance(node, list):
        return [resolve(item, components, stack) for item in node]
    if not isinstance(node, dict):
        return node
    if '$ref' in node:
        name = node['$ref'].rsplit('/', 1)[-1]
        if name in stack:
            return {}
        base = resolve(deepcopy(components.get(name, {})), components, stack + (name,))
        rest = {k: resolve(v, components, stack) for k, v in node.items() if k != '$ref'}
        return _merge(base, rest)
    if 'allOf' in node:
        merged = {}
        for branch in node['allOf']:
            merged = _merge(merged, resolve(branch, components, stack))
        rest = {k: resolve(v, components, stack) for k, v in node.items() if k != 'allOf'}
        return _merge(merged, rest)
    return {k: resolve(v, components, stack) for k, v in node.items()}


# --------------------------------------------------------------------------
# node comparison
# --------------------------------------------------------------------------

def _enums(node):
    return set(node.get('enum') or [])


def _compare_nodes(old, new, where, out, direction, head):
    """Compare two resolved nodes. `where` is a JSON path ('' at the root).
    direction: 'request' or 'response'. Appends breaking messages to out."""
    if not isinstance(old, dict) or not isinstance(new, dict):
        return

    def label(message):
        return f'{head} {where}: {message}' if where else f'{head}: {message}'

    def child(name):
        return f'{where}.{name}' if where else name

    old_type, new_type = old.get('type'), new.get('type')
    if old_type and new_type and old_type != new_type:
        out.append(label(f'type changed {old_type} -> {new_type}'))
    old_fmt, new_fmt = old.get('format'), new.get('format')
    if old_fmt and new_fmt and old_fmt != new_fmt:
        out.append(label(f'format changed {old_fmt} -> {new_fmt}'))

    if direction == 'response' and not old.get('nullable') and new.get('nullable'):
        out.append(label('became nullable'))

    if old.get('enum') and new.get('enum'):
        if direction == 'request':
            removed = _enums(old) - _enums(new)
            if removed:
                out.append(label(f'enum values removed {sorted(map(str, removed))}'))
        else:
            added = _enums(new) - _enums(old)
            if added:
                out.append(label(f'enum values added {sorted(map(str, added))}'))

    old_props = old.get('properties') or {}
    new_props = new.get('properties') or {}
    old_req = set(old.get('required') or [])
    new_req = set(new.get('required') or [])

    for name, old_sub in old_props.items():
        if name not in new_props:
            out.append(f'{head} {child(name)}: property removed')
            continue
        _compare_nodes(old_sub, new_props[name], child(name), out, direction, head)

    if direction == 'request':
        for name in new_props:
            if name not in old_props and name in new_req:
                out.append(f'{head} {child(name)}: new required property')
            elif name in old_props and name not in old_req and name in new_req:
                out.append(f'{head} {child(name)}: became required')
    else:
        for name in old_props:
            if name in new_props and name in old_req and name not in new_req:
                out.append(f'{head} {child(name)}: no longer required')

    if 'items' in old and 'items' in new:
        items_where = f'{where}[]' if where else '[]'
        _compare_nodes(old['items'], new['items'], items_where, out, direction, head)
    elif bool(old.get('items')) != bool(new.get('items')):
        out.append(label('array item schema changed'))

    for combinator in ('oneOf', 'anyOf'):
        old_branches = old.get(combinator) or []
        new_branches = new.get(combinator) or []
        if old_branches and new_branches and len(old_branches) == len(new_branches):
            for i, (old_b, new_b) in enumerate(zip(old_branches, new_branches)):
                _compare_nodes(old_b, new_b, f'{where}.{combinator}[{i}]' if where else f'{combinator}[{i}]',
                               out, direction, head)
        elif old_branches != new_branches and bool(old_branches) != bool(new_branches):
            out.append(label(f'{combinator} schema changed'))


# --------------------------------------------------------------------------
# operation comparison
# --------------------------------------------------------------------------

def _success_codes(op):
    return sorted(c for c in (op.get('responses') or {}) if c.startswith('2'))


def _response_schema(op, code):
    content = (op.get('responses') or {}).get(code, {}).get('content') or {}
    for media in content.values():
        return media.get('schema') or {}
    return {}


def _request_schema(op):
    body = op.get('requestBody') or {}
    content = body.get('content') or {}
    for media in content.values():
        return media.get('schema') or {}
    return {}


def _find_operation(schemas, method, path):
    """Locate (path_key, operation) for a surface entry; path may be version-relative."""
    paths = schemas.get('paths', {})
    if path.startswith('/api/'):
        candidates = [path]
    else:
        candidates = [p for p in paths if re.fullmatch(r'/api/v\d+' + re.escape(path), p)]
    for candidate in candidates:
        op = (paths.get(candidate) or {}).get(method)
        if op is not None:
            return candidate, op
    return None, None


def _display_version(path_key):
    parts = path_key.strip('/').split('/')
    return parts[1] if len(parts) > 1 and parts[0] == 'api' and parts[1].startswith('v') else 'unversioned'


def breaking_changes(old_schema, new_schema, surface):
    """Return a sorted list of breaking-change messages for surface operations."""
    old_components = (old_schema.get('components') or {}).get('schemas') or {}
    new_components = (new_schema.get('components') or {}).get('schemas') or {}
    out = []

    for method, path in surface:
        method = method.lower()
        old_key, old_op = _find_operation(old_schema, method, path)
        new_key, new_op = _find_operation(new_schema, method, path)
        label = path

        if old_op is None:
            continue  # not in the old contract: nothing to break
        version = _display_version(old_key)

        if new_op is None:
            out.append(f'{version} {method.upper()} {label}: operation removed')
            continue

        old_codes, new_codes = _success_codes(old_op), _success_codes(new_op)
        if set(old_codes) - set(new_codes):
            out.append(
                f'{version} {method.upper()} {label}: success status code changed '
                f'{old_codes} -> {new_codes}'
            )

        prefix = f'{version} {method.upper()} {label}'

        # query/path parameters
        old_params = {p.get('name'): p for p in (old_op.get('parameters') or [])}
        new_params = {p.get('name'): p for p in (new_op.get('parameters') or [])}
        for name, old_param in old_params.items():
            where = f'{prefix} {old_param.get("in", "query")} param {name!r}'
            new_param = new_params.get(name)
            if new_param is None:
                out.append(f'{where}: removed')
                continue
            if not old_param.get('required') and new_param.get('required'):
                out.append(f'{where}: became required')
            _compare_nodes(
                resolve(old_param.get('schema') or {}, old_components),
                resolve(new_param.get('schema') or {}, new_components),
                '', out, 'request', where,
            )
        for name, new_param in new_params.items():
            if name not in old_params and new_param.get('required'):
                out.append(f'{prefix} {new_param.get("in", "query")} param {name!r}: new required param')

        # request body
        old_body = resolve(_request_schema(old_op), old_components)
        new_body = resolve(_request_schema(new_op), new_components)
        if old_body or new_body:
            _compare_nodes(old_body, new_body, '', out, 'request', f'{prefix} request')

        # success responses
        for code in old_codes:
            if code not in new_codes:
                continue
            old_resp = resolve(_response_schema(old_op, code), old_components)
            new_resp = resolve(_response_schema(new_op, code), new_components)
            _compare_nodes(old_resp, new_resp, '', out, 'response', f'{prefix} {code}')

    return sorted(set(out))
