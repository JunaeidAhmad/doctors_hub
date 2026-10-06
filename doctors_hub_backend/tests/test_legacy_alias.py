import pytest
from django.core.cache import cache
from rest_framework.test import APIClient

from tests.factories import (
    LocationFactory, DoctorFactory, DoctorSpecialtyFactory,
    FacilityTestFactory, TestCategoryFactory, TestFactory,
)
from facilities.models import Hospital, Division


# (legacy, versioned) pairs — legacy lives only through the /api/ alias.
GET_CASES = [
    ('/api/doctors/', '/api/v1/doctors/'),
    ('/api/hospitals/', '/api/v1/hospitals/'),
    ('/api/specialties/', '/api/v1/specialties/'),
    ('/api/search-metadata/', '/api/v1/search-metadata/'),
    ('/api/divisions/', '/api/v1/divisions/'),
    ('/api/facility-tests/search/', '/api/v1/facility-tests/search/'),
]


@pytest.fixture
def sample_data(db):
    # geo list endpoints are cache_page'd by full URL; stale entries from earlier
    # tests would make the legacy and v1 responses differ spuriously
    cache.clear()
    Division.objects.get_or_create(name="Legacy Alias Division")
    spec = DoctorSpecialtyFactory.create(name="Legacy Alias Specialty")
    loc = LocationFactory.create(name="Legacy Alias Hospital")
    Hospital.objects.get_or_create(location=loc)
    doc = DoctorFactory.create(name="Dr. Legacy Alias")
    doc.specialties.add(spec)
    cat = TestCategoryFactory.create(name="Legacy Alias Category")
    test = TestFactory.create(name="Legacy Alias Test", category=cat)
    FacilityTestFactory.create(location=loc, test=test)


@pytest.mark.parametrize(('legacy_url', 'v1_url'), GET_CASES)
def test_legacy_alias_matches_v1(sample_data, legacy_url, v1_url):
    client = APIClient()
    legacy = client.get(legacy_url)
    v1 = client.get(v1_url)
    assert legacy.status_code == v1.status_code, (legacy_url, v1_url)

    legacy_data = legacy.json()
    v1_data = v1.json()
    if isinstance(legacy_data, dict) and 'results' in legacy_data:
        # paginated: compare data only (next/previous links contain the request path)
        assert legacy_data.get('count') == v1_data.get('count'), (legacy_url, v1_url)
        assert legacy_data['results'] == v1_data['results'], (legacy_url, v1_url)
    else:
        assert legacy_data == v1_data, (legacy_url, v1_url)
