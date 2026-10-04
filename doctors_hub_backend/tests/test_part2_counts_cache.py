"""
P2.9.4 – Tests for Phase 9: Counts, facets & cache invalidation.
"""
import pytest
from django.core.cache import cache
from django.core.checks import run_checks
from rest_framework.test import APIClient
from rest_framework import status as http_status

from core.cache_keys import public_cache_version, bump_public_cache
from tests.factories import (
    UserFactory, LocationFactory,
    TestCategoryFactory, TestFactory, FacilityTestFactory,
)
from facilities.models import Hospital, HospitalCategory


@pytest.fixture
def superadmin(db):
    return UserFactory.create_super_admin(phone_number="01799880001")


@pytest.fixture
def admin_client(superadmin):
    client = APIClient()
    client.force_authenticate(user=superadmin)
    return client


@pytest.fixture
def anon_client():
    return APIClient()


# ---------------------------------------------------------------------------
# P2.9.1 – category counts on read
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestCategoryCounts:
    def test_hospital_category_count(self, anon_client, db):
        cat = HospitalCategory.objects.create(name="P2 General")
        loc1 = LocationFactory.create(name="P2 Hosp 1")
        loc2 = LocationFactory.create(name="P2 Hosp 2")
        loc_inactive = LocationFactory.create(name="P2 Hosp Inactive", is_active=False)
        Hospital.objects.create(location=loc1, category=cat)
        Hospital.objects.create(location=loc2, category=cat)
        Hospital.objects.create(location=loc_inactive, category=cat)

        resp = anon_client.get("/api/hospital-categories/")
        assert resp.status_code == 200
        data = resp.data.get("results", resp.data)
        cat_data = next(c for c in data if c["name"] == "P2 General")
        assert cat_data["hospital_count"] == 2  # inactive excluded

    def test_test_category_counts(self, anon_client, db):
        cat = TestCategoryFactory.create(name="P2 Cat Count")
        t1 = TestFactory.create(name="P2 T1", category=cat)
        t2 = TestFactory.create(name="P2 T2", category=cat, is_active=False)
        loc = LocationFactory.create(name="P2 Lab Count", location_type="diagnostic_center")
        FacilityTestFactory.create(location=loc, test=t1, price=100)
        FacilityTestFactory.create(location=loc, test=t2, price=100)

        resp = anon_client.get("/api/test-categories/")
        assert resp.status_code == 200
        data = resp.data.get("results", resp.data)
        cat_data = next(c for c in data if c["name"] == "P2 Cat Count")
        assert cat_data["test_count"] == 1  # inactive test excluded
        assert cat_data["center_count"] == 1


# ---------------------------------------------------------------------------
# P2.9.2 – slim facets
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestSlimFacets:
    def test_facets_only_hospital_categories(self, anon_client, db):
        resp = anon_client.get("/api/search-facets/")
        assert resp.status_code == 200
        assert "hospital_categories" in resp.data
        # No other sections
        assert "specialties" not in resp.data
        assert "diagnostic_center_categories" not in resp.data
        assert "test_categories" not in resp.data
        assert "total_doctors" not in resp.data

    def test_facets_payload_under_10kb(self, anon_client, db):
        resp = anon_client.get("/api/search-facets/")
        assert resp.status_code == 200
        import json
        payload_size = len(json.dumps(resp.data))
        assert payload_size < 10240  # 10 KB


# ---------------------------------------------------------------------------
# P2.9.3 – cache invalidation
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestCacheInvalidation:
    def test_bump_public_cache_increments(self, db):
        v1 = public_cache_version()
        bump_public_cache()
        v2 = public_cache_version()
        assert v2 > v1

    def test_metadata_cache_invalidated_on_write(self, db):
        from core.cache_keys import public_cache_version
        v1 = public_cache_version()
        loc = LocationFactory.create(name="P2 Cache Hosp")
        loc.name = "P2 Cache Hosp Renamed"
        loc.save()
        v2 = public_cache_version()
        assert v2 > v1

    def test_alias_bumps_taxonomy(self, db):
        from doctors.models import DoctorSpecialty, SpecialtyAlias
        v1 = public_cache_version()
        spec = DoctorSpecialty.objects.create(name="P2 Cache Spec")
        SpecialtyAlias.objects.create(specialty=spec, name="P2 Cache Alias", normalized="p2 cache alias")
        v2 = public_cache_version()
        assert v2 > v1


# ---------------------------------------------------------------------------
# System check
# ---------------------------------------------------------------------------

def test_system_check_warns_without_redis(settings):
    settings.DEBUG = False
    settings.REDIS_URL = ''
    from django.core.checks import run_checks
    warnings = run_checks()
    w001 = [w for w in warnings if getattr(w, 'id', '') == 'core.W001']
    assert len(w001) > 0
