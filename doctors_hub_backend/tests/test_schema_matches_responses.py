"""V.4.5 — schema matches reality.

For each GET in the patient surface, plus each POST with a valid payload, call
the endpoint through /api/v1/ using fixture data that includes the null cases
(a doctor with no primary specialty, a chamber with no upcoming session, a
facility with no logo) and validate the JSON against the operation's 2xx
response schema.

Before validating, OpenAPI 3.0 `nullable: true` is converted to a JSON Schema
null alternative and `$ref`s are resolved against components.schemas (with a
cycle guard). A failure means the annotation is wrong: fix the annotation,
never the response.
"""
import datetime
from copy import deepcopy
from unittest.mock import patch

import jsonschema
import pytest
from django.core.cache import cache
from django.utils import timezone
from drf_spectacular.generators import SchemaGenerator
from rest_framework.test import APIClient

from core.api_contract import PATIENT_SURFACE
from doctors.models import ScheduleException
from doctors.services.availability import resolve_sessions
from facilities.models import (
    Hospital, HospitalCategory, HospitalService,
    DiagnosticCenter, DiagnosticCenterCategory,
)
from tests.factories import (
    LocationFactory, DoctorFactory, DoctorSpecialtyFactory, DoctorAffiliationFactory,
    AffiliationScheduleFactory, TestCategoryFactory, TestFactory, FacilityTestFactory,
)


# --------------------------------------------------------------------------
# schema plumbing
# --------------------------------------------------------------------------

def convert_nullable(node):
    """OpenAPI 3.0 `nullable: true` -> JSON Schema null alternative."""
    if isinstance(node, list):
        return [convert_nullable(item) for item in node]
    if not isinstance(node, dict):
        return node
    out = {key: convert_nullable(value) for key, value in node.items()}
    if out.pop('nullable', False):
        if isinstance(out.get('type'), str):
            out['type'] = [out['type'], 'null']
        elif isinstance(out.get('type'), list):
            out['type'] = [*out['type'], 'null']
        else:
            out = {'oneOf': [out, {'type': 'null'}]}
    return out


def resolve_refs(node, components, stack=()):
    """Resolve #/components/schemas refs with a cycle guard."""
    if isinstance(node, list):
        return [resolve_refs(item, components, stack) for item in node]
    if not isinstance(node, dict):
        return node
    if '$ref' in node:
        name = node['$ref'].rsplit('/', 1)[-1]
        if name in stack:
            return {}  # cycle guard: permissive at the loop point
        return resolve_refs(deepcopy(components[name]), components, stack + (name,))
    return {key: resolve_refs(value, components, stack) for key, value in node.items()}


@pytest.fixture(scope='module')
def v1_schema():
    return SchemaGenerator(api_version='v1').get_schema(request=None, public=True)


@pytest.fixture(scope='module')
def response_validator(v1_schema):
    converted = convert_nullable(deepcopy(v1_schema))
    components = converted.get('components', {}).get('schemas', {})

    def _validator(method, schema_path):
        responses = converted['paths']['/api/v1' + schema_path][method]['responses']
        code = next(c for c in ('200', '201') if c in responses)
        content = responses[code]['content']
        body_schema = next(v['schema'] for k, v in content.items() if 'json' in k)
        return jsonschema.Draft202012Validator(resolve_refs(body_schema, components))

    return _validator


# --------------------------------------------------------------------------
# fixture data — includes the null cases
# --------------------------------------------------------------------------

def _session_key(affil, date):
    schedules = list(affil.schedules.all())
    exceptions = list(ScheduleException.objects.filter(affiliation=affil, date=date))
    sessions = resolve_sessions(affil, date, schedules, exceptions)
    assert sessions
    return sessions[0].key


@pytest.fixture
def surface_data(db):
    cache.clear()  # response caches are keyed by URL; keep runs deterministic

    loc_hosp = LocationFactory.create(name="Schema Hospital", branch="Main")  # no logo/image
    hospital, _ = Hospital.objects.get_or_create(location=loc_hosp)
    cat_hosp = HospitalCategory.objects.create(name="Schema General Hospital", slug="schema-general-hospital")
    hospital.category = cat_hosp
    hospital.save()
    service = HospitalService.objects.create(name="Schema Health Check")
    hospital.services.add(service)

    loc_diag = LocationFactory.create(name="Schema Diagnostic Center", location_type="diagnostic_center")
    diag, _ = DiagnosticCenter.objects.get_or_create(location=loc_diag)
    dcat = DiagnosticCenterCategory.objects.create(name="Schema Lab Category", slug="schema-lab-category")
    diag.category = dcat
    diag.save()

    spec_parent = DoctorSpecialtyFactory.create(name="Schema Medicine", is_umbrella=True)
    spec = DoctorSpecialtyFactory.create(name="Schema Cardiology")
    spec.parent_categories.add(spec_parent)

    doc_plain = DoctorFactory.create(name="Dr. Schema Plain", gender="Male")  # no primary specialty
    doc_full = DoctorFactory.create(name="Dr. Schema Full", gender="Female", primary_specialty=spec)
    doc_full.specialties.add(spec)

    affil_none = DoctorAffiliationFactory.create(doctor=doc_full, location=loc_hosp)  # no sessions
    affil_busy = DoctorAffiliationFactory.create(doctor=doc_plain, location=loc_hosp)
    affil_diag = DoctorAffiliationFactory.create(doctor=doc_full, location=loc_diag)

    tomorrow = timezone.localdate() + datetime.timedelta(days=1)
    for affil, start, end in ((affil_busy, "09:00:00", "13:00:00"), (affil_diag, "14:00:00", "17:00:00")):
        AffiliationScheduleFactory.create(
            affiliation=affil, day_of_week=tomorrow.strftime("%A"),
            start_time=start, end_time=end,
        )

    tcat = TestCategoryFactory.create(name="Schema Pathology")
    test_a = TestFactory.create(name="Schema CBC", category=tcat)
    test_b = TestFactory.create(name="Schema Glucose", category=tcat)
    ft_diag = FacilityTestFactory.create(location=loc_diag, test=test_a, price=300)
    FacilityTestFactory.create(location=loc_hosp, test=test_b, price=150)

    from bookings.models import Patient
    Patient.objects.create(name="Schema Patient", phone="01712345678", age=None, gender="")

    return {
        'loc_hosp': loc_hosp, 'loc_diag': loc_diag,
        'hospital': hospital, 'service': service,
        'doc_plain': doc_plain, 'doc_full': doc_full,
        'affil_none': affil_none, 'affil_busy': affil_busy,
        'ft_diag': ft_diag, 'tomorrow': tomorrow,
    }


# --------------------------------------------------------------------------
# cases — every PATIENT_SURFACE operation, plus extra null-case calls
# --------------------------------------------------------------------------

def build_cases(d):
    tomorrow = d['tomorrow'].isoformat()
    hosp = d['loc_hosp'].slug
    diag = d['loc_diag'].slug
    cases = [
        ('get', '/search-metadata/', '/api/v1/search-metadata/', None),
        ('get', '/search-facets/', '/api/v1/search-facets/', None),
        ('get', '/divisions/', '/api/v1/divisions/', None),
        ('get', '/districts/', '/api/v1/districts/', None),
        ('get', '/thanas/', '/api/v1/thanas/', None),
        ('get', '/specialties/', '/api/v1/specialties/', None),
        ('get', '/specialties/suggest/', '/api/v1/specialties/suggest/?q=Schema', None),
        ('get', '/doctors/', '/api/v1/doctors/', None),
        ('get', '/doctors/{id}/', f"/api/v1/doctors/{d['doc_plain'].id}/", None),   # null primary_specialty
        ('get', '/doctors/{id}/', f"/api/v1/doctors/{d['doc_full'].id}/", None),
        ('get', '/affiliations/{id}/availability/', f"/api/v1/affiliations/{d['affil_none'].id}/availability/", None),  # null next_available
        ('get', '/affiliations/{id}/availability/', f"/api/v1/affiliations/{d['affil_busy'].id}/availability/", None),
        ('get', '/hospitals/', '/api/v1/hospitals/', None),
        ('get', '/hospitals/{location}/', f'/api/v1/hospitals/{hosp}/', None),
        ('get', '/hospitals/{location}/doctors/', f'/api/v1/hospitals/{hosp}/doctors/', None),
        ('get', '/hospitals/{location}/tests/', f'/api/v1/hospitals/{hosp}/tests/', None),
        ('get', '/diagnostic-centers/', '/api/v1/diagnostic-centers/', None),
        ('get', '/diagnostic-centers/{location}/', f'/api/v1/diagnostic-centers/{diag}/', None),
        ('get', '/diagnostic-centers/{location}/doctors/', f'/api/v1/diagnostic-centers/{diag}/doctors/', None),
        ('get', '/diagnostic-centers/{location}/tests/', f'/api/v1/diagnostic-centers/{diag}/tests/', None),
        ('get', '/hospital-categories/', '/api/v1/hospital-categories/', None),
        ('get', '/diagnostic-center-categories/', '/api/v1/diagnostic-center-categories/', None),
        ('get', '/test-categories/', '/api/v1/test-categories/', None),
        ('get', '/hospital-services/', '/api/v1/hospital-services/', None),
        ('get', '/facility-tests/search/', '/api/v1/facility-tests/search/', None),
        ('get', '/bookings/patients/lookup/', '/api/v1/bookings/patients/lookup/?phone=01712345678', None),
        ('get', '/bookings/patients/lookup/', '/api/v1/bookings/patients/lookup/?phone=01700000000', None),
    ]
    cases += [
        ('post', '/bookings/otp/send/', '/api/v1/bookings/otp/send/', {'phone': '01712345678'}),
        ('post', '/bookings/otp/verify/', '/api/v1/bookings/otp/verify/', {'phone': '01712345678', 'otp_code': '123'}),
        ('post', '/bookings/doctor/', '/api/v1/bookings/doctor/', {
            'affiliation_id': str(d['affil_busy'].id),
            'date': tomorrow,
            'session_key': _session_key(d['affil_busy'], d['tomorrow']),
            'patient_name': 'Schema Booking Patient',
            'patient_phone': '01712345699',
            'patient_age': 30,
            'otp_code': '123',
        }),
        ('post', '/bookings/test/', '/api/v1/bookings/test/', {
            'facility_test_id': str(d['ft_diag'].id),
            'pickup_date': tomorrow,
            'patient_name': 'Schema Lab Patient',
            'patient_phone': '01712345688',
            'otp_code': '123',
        }),
        ('post', '/bookings/hospital-service/', '/api/v1/bookings/hospital-service/', {
            'hospital_id': str(d['hospital'].pk),
            'service_id': str(d['service'].id),
            'booking_date': tomorrow,
            'patient_name': 'Schema Service Patient',
            'patient_phone': '01712345677',
            'otp_code': '123',
        }),
    ]
    return cases


def test_every_surface_operation_exists_in_schema(v1_schema):
    for method, path in PATIENT_SURFACE:
        full = '/api/v1' + path
        assert full in v1_schema['paths'], f'{method.upper()} {path} missing from schema paths'
        assert method.lower() in v1_schema['paths'][full], f'{method.upper()} {path} missing from schema'


def test_surface_responses_match_schema(surface_data, response_validator):
    client = APIClient()
    failures = []

    cases = build_cases(surface_data)
    covered = {(m.upper(), p) for m, p, _, _ in cases}
    for method, path in PATIENT_SURFACE:
        assert (method, path) in covered, f'{method.upper()} {path} has no test case'

    for method, schema_path, url, body in cases:
        if method == 'get':
            resp = client.get(url)
        else:
            with patch('bookings.views.send_sms_via_sms_bd', return_value={'status': 'success'}):
                resp = client.post(url, body, format='json')

        label = f'{method.upper()} {schema_path} ({url})'
        expected = 200 if method == 'get' else (200 if 'otp' in schema_path else 201)
        if resp.status_code != expected:
            failures.append(f'{label}: expected {expected}, got {resp.status_code}: {resp.content[:300]}')
            continue

        validator = response_validator(method, schema_path)
        errors = sorted(validator.iter_errors(resp.json()), key=lambda e: e.path)
        for error in errors:
            failures.append(f'{label}: {error.message} at {list(error.path)}')

    assert not failures, '\n'.join(failures)
