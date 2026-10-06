"""V.5.4 — contract diff unit tests (one per V.5.2 table row) plus snapshot
and check-script behavior."""
import copy
import importlib.util
import json
from pathlib import Path

import pytest
from django.test import override_settings

from core.contract_diff import breaking_changes

ROOT = Path(__file__).resolve().parent.parent.parent
SURFACE = [('GET', '/thing/')]


# --------------------------------------------------------------------------
# tiny schema builders
# --------------------------------------------------------------------------

def op_with(responses=None, parameters=None, request=None):
    op = {}
    if parameters is not None:
        op['parameters'] = parameters
    if request is not None:
        op['requestBody'] = {'content': {'application/json': {'schema': request}}}
    if responses is not None:
        op['responses'] = {
            code: {'content': {'application/json': {'schema': schema}}}
            for code, schema in responses.items()
        }
    return op


def schema_for(op, components=None):
    return {
        'openapi': '3.0.3',
        'paths': {'/api/v1/thing/': {'get': op}},
        'components': {'schemas': components or {}},
    }


def obj(properties, required=None):
    return {
        'type': 'object',
        'properties': properties,
        'required': list(properties) if required is None else required,
    }


def param(name, schema, required=False, location='query'):
    return {'name': name, 'in': location, 'required': required, 'schema': schema}


BASE = obj({'id': {'type': 'string'}, 'name': {'type': 'string'}})


# --------------------------------------------------------------------------
# operation level
# --------------------------------------------------------------------------

def test_operation_removed():
    old = schema_for(op_with(responses={'200': BASE}))
    new = schema_for({})  # operation gone entirely
    new['paths']['/api/v1/thing/'] = {}
    messages = breaking_changes(old, new, SURFACE)
    assert any('operation removed' in m for m in messages)


def test_success_status_code_changed():
    old = schema_for(op_with(responses={'200': BASE}))
    new = schema_for(op_with(responses={'201': BASE}))
    messages = breaking_changes(old, new, SURFACE)
    assert any('success status code changed' in m for m in messages)


# --------------------------------------------------------------------------
# query/path params
# --------------------------------------------------------------------------

def test_param_removed():
    old = schema_for(op_with(responses={'200': BASE}, parameters=[param('day', {'type': 'string'})]))
    new = schema_for(op_with(responses={'200': BASE}, parameters=[]))
    messages = breaking_changes(old, new, SURFACE)
    assert any("param 'day': removed" in m for m in messages)


def test_param_became_required():
    old = schema_for(op_with(responses={'200': BASE}, parameters=[param('day', {'type': 'string'})]))
    new = schema_for(op_with(responses={'200': BASE}, parameters=[param('day', {'type': 'string'}, required=True)]))
    messages = breaking_changes(old, new, SURFACE)
    assert any("param 'day': became required" in m for m in messages)


def test_new_required_param():
    old = schema_for(op_with(responses={'200': BASE}, parameters=[]))
    new = schema_for(op_with(responses={'200': BASE}, parameters=[param('day', {'type': 'string'}, required=True)]))
    messages = breaking_changes(old, new, SURFACE)
    assert any("param 'day': new required param" in m for m in messages)


def test_param_enum_value_removed():
    old_schema = {'type': 'string', 'enum': ['sat', 'sun']}
    new_schema = {'type': 'string', 'enum': ['sat']}
    old = schema_for(op_with(responses={'200': BASE}, parameters=[param('day', old_schema)]))
    new = schema_for(op_with(responses={'200': BASE}, parameters=[param('day', new_schema)]))
    messages = breaking_changes(old, new, SURFACE)
    assert any("param 'day': enum values removed" in m for m in messages)


# --------------------------------------------------------------------------
# request body
# --------------------------------------------------------------------------

def request_pair(old_props, new_props, old_required=None, new_required=None):
    old = schema_for(op_with(
        responses={'200': BASE},
        request=obj(old_props, old_required),
    ))
    new = schema_for(op_with(
        responses={'200': BASE},
        request=obj(new_props, new_required),
    ))
    return old, new


def test_request_new_required_property():
    old, new = request_pair({'a': {'type': 'string'}}, {'a': {'type': 'string'}, 'b': {'type': 'string'}})
    messages = breaking_changes(old, new, SURFACE)
    assert any('request b: new required property' in m for m in messages)


def test_request_property_removed():
    old, new = request_pair({'a': {'type': 'string'}, 'b': {'type': 'string'}}, {'a': {'type': 'string'}})
    messages = breaking_changes(old, new, SURFACE)
    assert any('request b: property removed' in m for m in messages)


def test_request_type_changed():
    old, new = request_pair({'a': {'type': 'string'}}, {'a': {'type': 'integer'}})
    messages = breaking_changes(old, new, SURFACE)
    assert any('request a: type changed string -> integer' in m for m in messages)


def test_request_format_changed():
    old, new = request_pair({'a': {'type': 'string', 'format': 'date'}}, {'a': {'type': 'string', 'format': 'date-time'}})
    messages = breaking_changes(old, new, SURFACE)
    assert any('request a: format changed date -> date-time' in m for m in messages)


def test_request_enum_value_removed():
    old, new = request_pair(
        {'a': {'type': 'string', 'enum': ['x', 'y']}},
        {'a': {'type': 'string', 'enum': ['x']}},
    )
    messages = breaking_changes(old, new, SURFACE)
    assert any('request a: enum values removed' in m for m in messages)


# --------------------------------------------------------------------------
# response body
# --------------------------------------------------------------------------

def response_pair(old_resp, new_resp):
    old = schema_for(op_with(responses={'200': old_resp}))
    new = schema_for(op_with(responses={'200': new_resp}))
    return old, new


def test_response_property_removed():
    old, new = response_pair(
        obj({'id': {'type': 'string'}, 'name': {'type': 'string'}}),
        obj({'id': {'type': 'string'}}),
    )
    messages = breaking_changes(old, new, SURFACE)
    assert any('200 name: property removed' in m for m in messages)


def test_response_no_longer_required():
    old, new = response_pair(
        obj({'id': {'type': 'string'}, 'name': {'type': 'string'}}),
        obj({'id': {'type': 'string'}, 'name': {'type': 'string'}}, required=['id']),
    )
    messages = breaking_changes(old, new, SURFACE)
    assert any('200 name: no longer required' in m for m in messages)


def test_response_became_nullable():
    old, new = response_pair(
        obj({'name': {'type': 'string'}}),
        obj({'name': {'type': 'string', 'nullable': True}}),
    )
    messages = breaking_changes(old, new, SURFACE)
    assert any('200 name: became nullable' in m for m in messages)


def test_response_type_changed():
    old, new = response_pair(
        obj({'count': {'type': 'integer'}}),
        obj({'count': {'type': 'string'}}),
    )
    messages = breaking_changes(old, new, SURFACE)
    assert any('200 count: type changed integer -> string' in m for m in messages)


def test_response_format_changed():
    old, new = response_pair(
        obj({'at': {'type': 'string', 'format': 'date'}}),
        obj({'at': {'type': 'string', 'format': 'date-time'}}),
    )
    messages = breaking_changes(old, new, SURFACE)
    assert any('200 at: format changed date -> date-time' in m for m in messages)


def test_response_enum_value_added():
    old, new = response_pair(
        obj({'status': {'type': 'string', 'enum': ['a', 'b']}}),
        obj({'status': {'type': 'string', 'enum': ['a', 'b', 'c']}}),
    )
    messages = breaking_changes(old, new, SURFACE)
    assert any('200 status: enum values added' in m for m in messages)


def test_array_item_property_removed():
    old, new = response_pair(
        {'type': 'array', 'items': obj({'id': {'type': 'string'}, 'name': {'type': 'string'}})},
        {'type': 'array', 'items': obj({'id': {'type': 'string'}})},
    )
    messages = breaking_changes(old, new, SURFACE)
    assert any('200 [].name: property removed' in m for m in messages)


# --------------------------------------------------------------------------
# non-breaking cases
# --------------------------------------------------------------------------

def test_additive_changes_are_not_reported():
    old = schema_for(
        op_with(responses={'200': obj({'id': {'type': 'string'}})}, parameters=[]),
    )
    new = schema_for(
        op_with(
            responses={'200': obj({'id': {'type': 'string'}, 'extra': {'type': 'string'}}, required=['id'])},
            parameters=[param('opt', {'type': 'string'})],
        ),
    )
    assert breaking_changes(old, new, SURFACE) == []


def test_new_endpoint_is_not_reported():
    old = schema_for(op_with(responses={'200': BASE}))
    new = schema_for(op_with(responses={'200': BASE}))
    new['paths']['/api/v1/other/'] = {'get': op_with(responses={'200': BASE})}
    assert breaking_changes(old, new, SURFACE) == []


def test_renamed_component_is_not_reported():
    shape = obj({'id': {'type': 'string'}, 'name': {'type': 'string'}})
    old = schema_for(
        op_with(responses={'200': {'$ref': '#/components/schemas/Thing'}}),
        components={'Thing': shape},
    )
    new = schema_for(
        op_with(responses={'200': {'$ref': '#/components/schemas/ThingV2'}}),
        components={'ThingV2': shape},
    )
    assert breaking_changes(old, new, SURFACE) == []


# --------------------------------------------------------------------------
# snapshot + check script
# --------------------------------------------------------------------------

def test_snapshot_is_up_to_date():
    from drf_spectacular.generators import SchemaGenerator
    snapshot = json.loads((ROOT / 'docs' / 'api' / 'openapi.v1.json').read_text())
    current = SchemaGenerator(api_version='v1').get_schema(request=None, public=True)
    assert current == snapshot, 'snapshot out of date, run scripts/check_api_contract.py --update'


def _load_check_script(tmp_path):
    spec = importlib.util.spec_from_file_location(
        'check_api_contract', ROOT / 'scripts' / 'check_api_contract.py')
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    module.DOCS = tmp_path  # never touch the real snapshot from tests
    return module


def test_check_script_fails_on_breaking_when_frozen(tmp_path, monkeypatch):
    module = _load_check_script(tmp_path)
    snapshot = json.loads((ROOT / 'docs' / 'api' / 'openapi.v1.json').read_text())
    (tmp_path / 'openapi.v1.json').write_text(json.dumps(snapshot, sort_keys=True, indent=2))

    broken = copy.deepcopy(snapshot)
    removed = sorted(broken['components']['schemas']['DoctorList']['properties'])[0]
    del broken['components']['schemas']['DoctorList']['properties'][removed]
    monkeypatch.setattr(module, 'generate', lambda version: copy.deepcopy(broken))

    with override_settings(API_FROZEN_VERSIONS=('v1',)):
        assert module.main([]) == 1
        assert module.main(['--update']) == 1  # --update must not override the freeze

    # the snapshot must be untouched
    after = json.loads((tmp_path / 'openapi.v1.json').read_text())
    assert after == snapshot
