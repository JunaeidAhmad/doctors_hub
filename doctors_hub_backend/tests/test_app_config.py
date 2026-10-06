"""V.6.4 — app-config endpoint tests (plan V.6.2 contract)."""
from django.test import override_settings
from rest_framework.test import APIClient

from core.checks import check_deprecation_dates


def test_shape_matches_contract():
    resp = APIClient().get('/api/app-config/')
    assert resp.status_code == 200
    assert resp['Cache-Control'] == 'public, max-age=300'
    body = resp.json()
    assert body['api']['current_version'] == 'v1'
    assert body['api']['supported_versions'] == ['v1']
    assert body['api']['deprecations'] == {'v1': {'deprecated_on': None, 'sunset_on': None}}
    assert set(body['platforms']) == {'android', 'ios'}
    for block in body['platforms'].values():
        assert set(block) == {'min_supported_build', 'latest_build', 'store_url'}
    assert set(body['update_message']) == {'en', 'bn'}
    assert body['client'] is None
    assert body['server_time']


def test_garbage_auth_header_does_not_401():
    resp = APIClient().get('/api/app-config/', HTTP_AUTHORIZATION='Bearer garbage')
    assert resp.status_code == 200


def test_versioned_path_is_404():
    assert APIClient().get('/api/v1/app-config/').status_code == 404


@override_settings(APP_ANDROID_MIN_BUILD=10, APP_ANDROID_LATEST_BUILD=10)
def test_client_status_below_and_equal_to_min():
    client = APIClient()
    below = client.get('/api/app-config/', HTTP_X_APP_PLATFORM='android', HTTP_X_APP_BUILD='5')
    assert below.json()['client'] == {'platform': 'android', 'build': 5, 'status': 'update_required'}
    equal = client.get('/api/app-config/', HTTP_X_APP_PLATFORM='android', HTTP_X_APP_BUILD='10')
    assert equal.json()['client'] == {'platform': 'android', 'build': 10, 'status': 'ok'}


@override_settings(APP_ANDROID_MIN_BUILD=10, APP_ANDROID_LATEST_BUILD=20)
def test_client_status_below_and_equal_to_latest():
    client = APIClient()
    below = client.get('/api/app-config/', HTTP_X_APP_PLATFORM='android', HTTP_X_APP_BUILD='15')
    assert below.json()['client'] == {'platform': 'android', 'build': 15, 'status': 'update_available'}
    equal = client.get('/api/app-config/', HTTP_X_APP_PLATFORM='android', HTTP_X_APP_BUILD='20')
    assert equal.json()['client'] == {'platform': 'android', 'build': 20, 'status': 'ok'}


def test_invalid_headers_are_treated_as_absent():
    resp = APIClient().get('/api/app-config/', HTTP_X_APP_PLATFORM='web', HTTP_X_APP_BUILD='abc')
    assert resp.json()['client'] is None


def test_check_e002_fires_on_bad_date():
    with override_settings(API_DEPRECATIONS={'v1': 'not-a-date'}):
        errors = check_deprecation_dates(None)
    assert any(e.id == 'core.E002' and 'not an ISO date' in e.msg for e in errors)


def test_check_e002_fires_on_bad_key():
    with override_settings(API_SUNSETS={'banana': '2027-01-01'}):
        errors = check_deprecation_dates(None)
    assert any(e.id == 'core.E002' and 'banana' in e.msg for e in errors)


def test_check_e002_passes_on_wellformed_config():
    with override_settings(API_DEPRECATIONS={'legacy': '2026-12-01'}, API_SUNSETS={'v1': '2027-06-01'}):
        assert check_deprecation_dates(None) == []
