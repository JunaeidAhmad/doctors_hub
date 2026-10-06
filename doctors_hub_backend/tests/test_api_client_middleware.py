"""V.7.2 — ApiClientMiddleware tests (plan V.7.1)."""
import logging

import pytest
from django.conf import settings
from django.test import override_settings
from django.utils.http import http_date
from rest_framework.test import APIClient

from tests.factories import DoctorFactory

DATE = '2027-06-01'


def _date_ts(value):
    import datetime
    dt = datetime.datetime.combine(
        datetime.date.fromisoformat(value), datetime.time(), tzinfo=datetime.timezone.utc)
    return int(dt.timestamp())


# ---- upgrade gate --------------------------------------------------------

@override_settings(APP_ANDROID_MIN_BUILD=10, APP_ANDROID_LATEST_BUILD=20, APP_ANDROID_STORE_URL='https://play/store')
def test_below_min_build_is_426():
    resp = APIClient().get('/api/v1/doctors/', HTTP_X_APP_PLATFORM='android', HTTP_X_APP_BUILD='5')
    assert resp.status_code == 426
    body = resp.json()
    assert body == {
        'code': 'app_update_required',
        'min_supported_build': 10,
        'store_url': 'https://play/store',
        'message': {'en': settings.APP_UPDATE_MESSAGE_EN, 'bn': settings.APP_UPDATE_MESSAGE_BN},
    }


@override_settings(APP_ANDROID_MIN_BUILD=10)
def test_equal_to_min_build_passes(db):
    resp = APIClient().get('/api/v1/doctors/', HTTP_X_APP_PLATFORM='android', HTTP_X_APP_BUILD='10')
    assert resp.status_code == 200


@override_settings(APP_ANDROID_MIN_BUILD=10)
def test_no_headers_and_invalid_headers_pass(db):
    client = APIClient()
    assert client.get('/api/v1/doctors/').status_code == 200
    assert client.get('/api/v1/doctors/', HTTP_X_APP_BUILD='abc').status_code == 200
    assert client.get('/api/v1/doctors/', HTTP_X_APP_PLATFORM='web', HTTP_X_APP_BUILD='5').status_code == 200


@override_settings(APP_ANDROID_MIN_BUILD=10)
def test_exempt_paths_are_never_gated():
    client = APIClient()
    headers = {'HTTP_X_APP_PLATFORM': 'android', 'HTTP_X_APP_BUILD': '5'}
    assert client.get('/api/app-config/', **headers).status_code == 200
    assert client.get('/api/schema/', **headers).status_code == 200
    assert client.get('/api/docs/', **headers).status_code == 200


# ---- retired versions ----------------------------------------------------

@override_settings(API_RETIRED_VERSIONS=('v1',))
def test_retired_version_is_426_on_both_mounts():
    client = APIClient()
    for url in ('/api/v1/doctors/', '/api/doctors/'):
        resp = client.get(url)
        assert resp.status_code == 426, url
        body = resp.json()
        assert body['code'] == 'api_version_retired'
        assert 'detail' in body
        assert 'update' in body
        assert 'message' in body


@override_settings(API_RETIRED_VERSIONS=('v1',))
def test_retired_includes_platform_block_when_headers_present():
    resp = APIClient().get('/api/v1/doctors/', HTTP_X_APP_PLATFORM='android', HTTP_X_APP_BUILD='5')
    assert resp.status_code == 426
    update = resp.json()['update']
    assert set(update) == {'min_supported_build', 'latest_build', 'store_url'}
    assert resp.json()['update'] is not None


# ---- deprecation headers -------------------------------------------------

@override_settings(
    API_DEPRECATE_LEGACY=True,
    API_DEPRECATIONS={'legacy': '2026-12-01', 'v1': DATE},
    API_SUNSETS={'legacy': '2027-03-01'},
)
def test_deprecation_headers_formats_and_legacy_link_keeps_query(db):
    client = APIClient()
    legacy = client.get('/api/doctors/?page=2')
    assert legacy['Deprecation'] == f'@{_date_ts("2026-12-01")}'
    assert legacy['Sunset'] == http_date(_date_ts('2027-03-01'))
    assert 'rel="successor-version"' in legacy['Link']
    assert '/api/v1/doctors/?page=2' in legacy['Link']

    v1 = client.get('/api/v1/doctors/')
    assert v1['Deprecation'] == f'@{_date_ts(DATE)}'
    assert 'Sunset' not in v1
    assert 'Link' not in v1  # v2 is not an allowed version


def test_deprecation_headers_absent_when_unconfigured(db):
    client = APIClient()
    for url in ('/api/doctors/', '/api/v1/doctors/'):
        resp = client.get(url)
        assert 'Deprecation' not in resp
        assert 'Sunset' not in resp
        assert 'Link' not in resp


@override_settings(API_DEPRECATIONS={'v1': DATE})
def test_version_link_only_when_successor_allowed(db):
    rf = {**settings.REST_FRAMEWORK, 'ALLOWED_VERSIONS': ('v1', 'v2')}
    with override_settings(REST_FRAMEWORK=rf):
        resp = APIClient().get('/api/v1/doctors/')
        assert '/api/v2/doctors/' in resp['Link']
        assert 'rel="successor-version"' in resp['Link']


# ---- CORS on 426 ---------------------------------------------------------

@override_settings(APP_ANDROID_MIN_BUILD=10)
def test_426_still_carries_cors_headers():
    resp = APIClient().get(
        '/api/v1/doctors/',
        HTTP_X_APP_PLATFORM='android', HTTP_X_APP_BUILD='5',
        HTTP_ORIGIN='http://localhost:5173',
    )
    assert resp.status_code == 426
    assert resp['Access-Control-Allow-Origin']


# ---- usage log -----------------------------------------------------------

def test_usage_log_uses_route_template_without_ids(db, caplog):
    caplog.set_level(logging.INFO, logger='api.usage')
    doctor = DoctorFactory.create()
    resp = APIClient().get(f'/api/v1/doctors/{doctor.id}/', HTTP_X_APP_PLATFORM='android', HTTP_X_APP_BUILD='5')
    assert resp.status_code == 200

    records = [r for r in caplog.records if r.name == 'api.usage']
    assert len(records) == 1
    line = records[0].getMessage()
    assert str(doctor.id) not in line
    assert 'doctors' in line
    assert 'v1' in line
    assert 'platform=android' in line
    assert 'build=5' in line
    assert 'status=200' in line
