from types import SimpleNamespace
from unittest.mock import patch

import pytest
from django.core.cache import cache
from django.test import override_settings
from rest_framework import serializers, viewsets
from rest_framework.test import APIClient

from core.cache_keys import public_cache_version, versioned_key
from core.devtools import kwarg_unsafe_handlers
from core.versioning import VersionedSerializerMixin
from tests.factories import (
    LocationFactory, DoctorFactory, DoctorAffiliationFactory,
)
from facilities.models import Hospital


def test_every_handler_accepts_version_kwarg():
    bad = kwarg_unsafe_handlers()
    assert bad == [], f"handlers missing **kwargs (would crash when the version kwarg is captured): {bad}"


@pytest.fixture
def api():
    return APIClient()


@pytest.fixture
def sample_doctors(db):
    DoctorFactory.create(name="Alpha Doctor")
    DoctorFactory.create(name="Beta Doctor")


@pytest.fixture
def hospital_with_affiliation(db):
    loc = LocationFactory.create(name="Versioning Test Hospital")
    Hospital.objects.get_or_create(location=loc)
    doc = DoctorFactory.create(name="Dr. Versioning")
    affil = DoctorAffiliationFactory.create(doctor=doc, location=loc)
    return loc, affil


def _result_ids(resp):
    data = resp.json()
    return data['count'], [r['id'] for r in data['results']]


def test_v1_and_legacy_doctors_are_identical(api, sample_doctors):
    v1 = api.get('/api/v1/doctors/')
    legacy = api.get('/api/doctors/')
    assert v1.status_code == 200
    assert legacy.status_code == 200
    assert _result_ids(v1) == _result_ids(legacy)


def test_request_version_is_v1_on_both_mounts(api, sample_doctors):
    for url in ('/api/v1/doctors/', '/api/doctors/'):
        resp = api.get(url)
        assert resp.status_code == 200
        assert resp.renderer_context['request'].version == 'v1', url


def test_disallowed_version_is_404(api):
    assert api.get('/api/v2/doctors/').status_code == 404


def test_formerly_unsafe_patient_endpoints_survive_version_kwarg(api, hospital_with_affiliation):
    loc, affil = hospital_with_affiliation

    assert api.get('/api/v1/specialties/suggest/?q=card').status_code < 500
    assert api.get('/api/v1/facility-tests/search/').status_code < 500
    assert api.get(f'/api/v1/affiliations/{affil.id}/availability/').status_code < 500
    assert api.get(f'/api/v1/hospitals/{loc.slug}/doctors/').status_code < 500
    assert api.get('/api/v1/bookings/patients/lookup/?phone=01711111111').status_code < 500

    with patch('bookings.views.send_sms_via_sms_bd', return_value={'status': 'success'}):
        resp = api.post('/api/v1/bookings/otp/send/', {'phone': '01711111111'}, format='json')
    assert resp.status_code < 500


# ---- V.8.1 version-aware cache keys --------------------------------------

def test_v1_request_writes_versioned_cache_key(api, db):
    cache.clear()
    resp = api.get('/api/v1/search-metadata/')
    assert resp.status_code == 200
    key = versioned_key(SimpleNamespace(version='v1'), f"search_metadata:v{public_cache_version()}")
    assert ':v1' in key
    assert cache.get(key) is not None


# ---- V.8.2 VersionedSerializerMixin --------------------------------------

class _BaseSerializer(serializers.Serializer):
    pass


class _V1ListSerializer(serializers.Serializer):
    pass


class _V1DefaultSerializer(serializers.Serializer):
    pass


class _V2ListSerializer(serializers.Serializer):
    pass


class _DummyViewSet(VersionedSerializerMixin, viewsets.GenericViewSet):
    serializer_class = _BaseSerializer
    serializer_classes = {
        'v1': {'list': _V1ListSerializer, 'default': _V1DefaultSerializer},
        'v2': {'list': _V2ListSerializer},
    }


def _pick(version, action):
    view = _DummyViewSet()
    view.request = SimpleNamespace(version=version)
    view.action = action
    return view.get_serializer_class()


@override_settings(REST_FRAMEWORK={'DEFAULT_VERSIONING_CLASS': 'rest_framework.versioning.URLPathVersioning',
                                  'DEFAULT_VERSION': 'v1', 'ALLOWED_VERSIONS': ('v1', 'v2')})
def test_versioned_serializer_mixin_resolves_and_falls_back():
    assert _pick('v2', 'list') is _V2ListSerializer      # exact version + action
    assert _pick('v2', 'retrieve') is _V1DefaultSerializer  # nearest lower version's default
    assert _pick('v1', 'list') is _V1ListSerializer
    assert _pick('v1', 'retrieve') is _V1DefaultSerializer
    assert _pick('v3', 'list') is _V2ListSerializer       # above all tables -> nearest lower


def test_versioned_serializer_mixin_falls_back_to_super():
    class _Plain(VersionedSerializerMixin, viewsets.GenericViewSet):
        serializer_class = _BaseSerializer
        serializer_classes = {}

    view = _Plain()
    view.request = SimpleNamespace(version='v1')
    view.action = 'list'
    assert view.get_serializer_class() is _BaseSerializer
