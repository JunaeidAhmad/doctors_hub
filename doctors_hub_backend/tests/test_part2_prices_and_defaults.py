"""
P2.6.6 – Tests for Phase 6: Optional test prices & honest hospital defaults.
"""
from decimal import Decimal

import pytest
from rest_framework.test import APIClient
from rest_framework import status as http_status

from tests.factories import (
    UserFactory, LocationFactory,
    TestCategoryFactory, TestFactory, FacilityTestFactory,
)
from facilities.models import Hospital, HospitalCategory
from tests.models import FacilityTest, TestCategory, Test
from tests.search import build_row_qs, build_grouped


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
# P2.6.1–P2.6.2 – optional price
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestOptionalPrice:
    def test_attach_without_price(self, db):
        loc = LocationFactory.create(name="P2 Priceless Lab", location_type="diagnostic_center")
        cat = TestCategoryFactory.create(name="P2 Priceless")
        t = TestFactory.create(name="P2 Priceless Test", category=cat)
        ft = FacilityTest.objects.create(location=loc, test=t, price=None)
        assert ft.price is None
        assert ft.calculated_price is None
        assert ft.discounted_price is None

    def test_price_at_counter_via_api(self, anon_client, db):
        loc = LocationFactory.create(name="P2 Counter Lab", location_type="diagnostic_center")
        cat = TestCategoryFactory.create(name="P2 Counter")
        t = TestFactory.create(name="P2 Counter Test", category=cat)
        ft = FacilityTest.objects.create(location=loc, test=t, price=None)
        import datetime
        from django.utils import timezone
        tomorrow = (timezone.localdate() + datetime.timedelta(days=1)).isoformat()
        resp = anon_client.post("/api/bookings/test/", {
            "facility_test_id": str(ft.pk),
            "pickup_date": tomorrow,
            "patient_name": "Counter",
            "patient_phone": "01712223333",
            "otp_code": "123",
        })
        assert resp.status_code == http_status.HTTP_201_CREATED, resp.data
        assert resp.data["price"] is None

    def test_search_min_price_ignores_nulls(self, db):
        loc = LocationFactory.create(name="P2 Search Lab", location_type="diagnostic_center")
        cat = TestCategoryFactory.create(name="P2 Search")
        t1 = TestFactory.create(name="P2 Priced", category=cat)
        t2 = TestFactory.create(name="P2 Unpriced", category=cat)
        FacilityTest.objects.create(location=loc, test=t1, price=100)
        FacilityTest.objects.create(location=loc, test=t2, price=None)
        params = {"q": "", "testcat": str(cat.slug), "page": 1, "page_size": 10,
                  "include_unavailable": False, "ordering": "price",
                  "fulfillment": "all", "ownership": "all", "location_type": "all"}
        row_qs = build_row_qs(params)
        grouped = build_grouped(row_qs, "price")
        results = {g["test_id"]: g for g in grouped}
        priced = results.get(t1.pk)
        unpriced = results.get(t2.pk)
        assert priced is not None
        assert priced["min_price"] == Decimal("100.00")
        assert unpriced is not None
        assert unpriced["min_price"] is None

    def test_null_price_sorts_last_both_directions(self, db):
        loc = LocationFactory.create(name="P2 Sort Lab", location_type="diagnostic_center")
        cat = TestCategoryFactory.create(name="P2 Sort")
        t1 = TestFactory.create(name="P2 Cheap", category=cat)
        t2 = TestFactory.create(name="P2 Expensive", category=cat)
        t3 = TestFactory.create(name="P2 Free", category=cat)
        FacilityTest.objects.create(location=loc, test=t1, price=100)
        FacilityTest.objects.create(location=loc, test=t2, price=500)
        FacilityTest.objects.create(location=loc, test=t3, price=None)
        params = {"q": "", "testcat": str(cat.slug), "page": 1, "page_size": 10,
                  "include_unavailable": False, "ordering": "price",
                  "fulfillment": "all", "ownership": "all", "location_type": "all"}
        row_qs = build_row_qs(params)

        asc = list(build_grouped(row_qs, "price"))
        assert asc[-1]["test_id"] == t3.pk
        assert asc[0]["test_id"] == t1.pk

        desc = list(build_grouped(row_qs, "-price"))
        assert desc[-1]["test_id"] == t3.pk
        assert desc[0]["test_id"] == t2.pk


# ---------------------------------------------------------------------------
# P2.6.5 – hospital defaults
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestHospitalDefaults:
    def test_new_hospital_empty_fields(self, db):
        from services.facilities import create_hospital
        from facilities.models import Thana, Division, District
        div, _ = Division.objects.get_or_create(name="P2 Div")
        dist, _ = District.objects.get_or_create(name="P2 Dist", division=div)
        thana, _ = Thana.objects.get_or_create(name="P2 Thana", district=dist)
        hosp = create_hospital(
            validated_data={},
            location_data={"name": "P2 New Hospital", "thana_id": thana.pk, "address_line": "123 Test St"},
        )
        assert hosp.bed_capacity is None
        assert hosp.icu_beds_total is None
        assert hosp.icu_beds_available is None
        assert hosp.ot_suites_count is None
        assert hosp.emergency_phone == ''
        assert hosp.ambulance_phone == ''
        assert hosp.accreditation == ''
        assert hosp.dghs_reg_no == ''
        assert hosp.parking_capacity == ''
        assert hosp.has_helipad is None

    def test_existing_hospital_values_unchanged(self, db):
        loc = LocationFactory.create(name="P2 Existing Hospital")
        hosp = Hospital.objects.create(
            location=loc,
            bed_capacity=200,
            icu_beds_total=10,
            icu_beds_available=2,
            ot_suites_count=3,
            emergency_phone="01700000000",
            ambulance_phone="01800000000",
            accreditation="ABC",
            dghs_reg_no="DH-123",
            parking_capacity="50 cars",
            has_helipad=True,
        )
        # Simulate what would happen after a migrate: values stay.
        hosp.refresh_from_db()
        assert hosp.bed_capacity == 200
        assert hosp.has_helipad is True


# ---------------------------------------------------------------------------
# P2.6.3 – priced_offering_count
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_priced_offering_count(db):
    loc = LocationFactory.create(name="P2 Count Lab", location_type="diagnostic_center")
    cat = TestCategoryFactory.create(name="P2 Count")
    t1 = TestFactory.create(name="P2 Count Priced", category=cat)
    t2 = TestFactory.create(name="P2 Count Unpriced", category=cat)
    FacilityTest.objects.create(location=loc, test=t1, price=100)
    FacilityTest.objects.create(location=loc, test=t2, price=None)
    loc2 = LocationFactory.create(name="P2 Count Lab 2", location_type="diagnostic_center")
    FacilityTest.objects.create(location=loc2, test=t1, price=None)
    params = {"q": "", "testcat": str(cat.slug), "page": 1, "page_size": 10,
              "include_unavailable": False, "ordering": "price",
              "fulfillment": "all", "ownership": "all", "location_type": "all"}
    row_qs = build_row_qs(params)
    grouped = {g["test_id"]: g for g in build_grouped(row_qs, "price")}
    g1 = grouped[t1.pk]
    assert g1["offering_count"] == 2
    assert g1["priced_offering_count"] == 1
