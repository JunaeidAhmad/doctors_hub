"""
P2.10.2 – Regression tests for every Part 2 item (#1–#24).
Items fixed in Part 1 (#3, #4, #9, #10, #11, #21) get regression tests too.
"""
import datetime
from decimal import Decimal
from unittest.mock import patch

import pytest
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status as http_status

from tests.factories import (
    UserFactory, LocationFactory, DoctorFactory,
    DoctorAffiliationFactory, AffiliationScheduleFactory,
    TestCategoryFactory, TestFactory, FacilityTestFactory,
)
from facilities.models import Hospital, HospitalCategory, Division, District, Thana
from doctors.models import Doctor, DoctorAffiliation, AffiliationSchedule, DoctorSpecialty
from bookings.models import DoctorBooking, TestBooking, Patient
from tests.models import FacilityTest, TestCategory


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


@pytest.fixture
def geo(db):
    div, _ = Division.objects.get_or_create(name="Dhaka", defaults={"bn_name": "ঢাকা"})
    dist, _ = District.objects.get_or_create(name="Dhaka", division=div, defaults={"bn_name": "ঢাকা"})
    thana, _ = Thana.objects.get_or_create(name="Dhanmondi", district=dist, defaults={"bn_name": "ধানমন্ডি"})
    return {"div": div, "dist": dist, "thana": thana}


# ---------------------------------------------------------------------------
# #1 Location search 500
# ---------------------------------------------------------------------------
@pytest.mark.django_db
def test_item_1_location_search_works(anon_client, geo):
    loc = LocationFactory.create(name="Dhanmondi Hospital", thana=geo["thana"])
    resp = anon_client.get("/api/v1/locations/?search=dhan")
    assert resp.status_code == 200


# ---------------------------------------------------------------------------
# #2 fee_max removed
# ---------------------------------------------------------------------------
@pytest.mark.django_db
def test_item_2_fee_max_ignored(anon_client, db):
    resp = anon_client.get("/api/v1/doctors/?fee_max=500")
    assert resp.status_code == 200  # unknown param is ignored, not 500


# ---------------------------------------------------------------------------
# #3 (Part 1) Doctor sort removal
# ---------------------------------------------------------------------------
@pytest.mark.django_db
def test_item_3_doctor_ordering_stable(anon_client, db):
    DoctorFactory.create(name="Dr. Alpha")
    DoctorFactory.create(name="Dr. Beta")
    resp = anon_client.get("/api/v1/doctors/")
    assert resp.status_code == 200
    results = resp.data.get("results", resp.data)
    names = [d["name"] for d in results]
    assert names == sorted(names)


# ---------------------------------------------------------------------------
# #4 (Part 1) Hospital server-side ordering
# ---------------------------------------------------------------------------
@pytest.mark.django_db
def test_item_4_hospital_ordering(anon_client, geo):
    LocationFactory.create(name="Zeta Hospital", thana=geo["thana"])
    LocationFactory.create(name="Alpha Hospital", thana=geo["thana"])
    resp = anon_client.get("/api/v1/hospitals/?ordering=name")
    assert resp.status_code == 200


# ---------------------------------------------------------------------------
# #5 Public visibility
# ---------------------------------------------------------------------------
@pytest.mark.django_db
def test_item_5_inactive_hidden_from_public(anon_client, admin_client, geo):
    loc = LocationFactory.create(name="Inactive Hospital", thana=geo["thana"], is_active=False)
    Hospital.objects.create(location=loc)
    resp = anon_client.get(f"/api/v1/hospitals/{loc.pk}/")
    assert resp.status_code == 404
    resp_admin = admin_client.get(f"/api/v1/hospitals/{loc.pk}/")
    assert resp_admin.status_code == 200


# ---------------------------------------------------------------------------
# #6 Status not writable
# ---------------------------------------------------------------------------
@pytest.mark.django_db
def test_item_6_status_readonly(anon_client, geo):
    loc = LocationFactory.create(name="Status Hosp", thana=geo["thana"])
    Hospital.objects.create(location=loc)
    doc = DoctorFactory.create(name="Dr. Status")
    aff = DoctorAffiliationFactory.create(doctor=doc, location=loc)
    sched = AffiliationScheduleFactory.create(
        affiliation=aff,
        day_of_week=(timezone.localdate() + datetime.timedelta(days=1)).strftime("%A"),
        start_time="09:00:00", end_time="12:00:00",
    )
    resp = anon_client.post("/api/v1/bookings/doctor/", {
        "affiliation_id": str(aff.pk),
        "date": (timezone.localdate() + datetime.timedelta(days=1)).isoformat(),
        "session_key": f"s:{sched.pk}",
        "patient_name": "Status Test",
        "patient_phone": "01711110001",
        "status": "completed",
        "otp_code": "123",
    })
    assert resp.status_code == 201, resp.data
    assert resp.data["status"] == "pending"


# ---------------------------------------------------------------------------
# #7 Patient snapshot
# ---------------------------------------------------------------------------
@pytest.mark.django_db
def test_item_7_patient_snapshot(anon_client, geo):
    p = Patient.objects.create(name="Rahim", phone="01711112222")
    loc = LocationFactory.create(name="Snapshot Hosp", thana=geo["thana"])
    doc = DoctorFactory.create(name="Dr. Snapshot")
    aff = DoctorAffiliationFactory.create(doctor=doc, location=loc)
    sched = AffiliationScheduleFactory.create(
        affiliation=aff,
        day_of_week=(timezone.localdate() + datetime.timedelta(days=1)).strftime("%A"),
        start_time="09:00:00", end_time="12:00:00",
    )
    resp = anon_client.post("/api/v1/bookings/doctor/", {
        "affiliation_id": str(aff.pk),
        "date": (timezone.localdate() + datetime.timedelta(days=1)).isoformat(),
        "session_key": f"s:{sched.pk}",
        "patient_name": "Karim (son)",
        "patient_phone": "01711112222",
        "patient_age": 30,
        "patient_gender": "male",
        "otp_code": "123",
    })
    assert resp.status_code == 201, resp.data
    booking = DoctorBooking.objects.get(pk=resp.data["id"])
    assert booking.patient_name == "Karim (son)"
    assert booking.patient_age == 30
    p.refresh_from_db()
    assert p.name == "Rahim"


# ---------------------------------------------------------------------------
# #8 Canonical phone
# ---------------------------------------------------------------------------
@pytest.mark.django_db
def test_item_8_canonical_phone(db):
    from core.phone import canonical_bd_phone
    assert canonical_bd_phone("01711111111") == "01711111111"
    assert canonical_bd_phone("+8801711111111") == "01711111111"
    assert canonical_bd_phone("8801711111111") == "01711111111"


# ---------------------------------------------------------------------------
# #9 (Part 1) Geo by ID
# ---------------------------------------------------------------------------
@pytest.mark.django_db
def test_item_9_geo_by_id(anon_client, geo):
    loc = LocationFactory.create(name="Geo Hospital", thana=geo["thana"])
    Hospital.objects.create(location=loc)
    resp = anon_client.get(f"/api/v1/hospitals/?thana_id={geo['thana'].pk}")
    assert resp.status_code == 200


# ---------------------------------------------------------------------------
# #10 (Part 1) Flat facility shape
# ---------------------------------------------------------------------------
@pytest.mark.django_db
def test_item_10_flat_facility_shape(anon_client, geo):
    loc = LocationFactory.create(name="Flat Hospital", thana=geo["thana"])
    Hospital.objects.create(location=loc)
    resp = anon_client.get(f"/api/v1/hospitals/{loc.pk}/")
    assert resp.status_code == 200
    assert "display_name" in resp.data


# ---------------------------------------------------------------------------
# #11 (Part 1) Exact categories
# ---------------------------------------------------------------------------
    @pytest.mark.django_db
    def test_item_11_exact_category(anon_client, db):
        cat = TestCategoryFactory.create(name="Exact Cat")
        resp = anon_client.get(f"/api/v1/test-categories/{cat.pk}/")
        assert resp.status_code == 200


# ---------------------------------------------------------------------------
# #12 Test booking rules
# ---------------------------------------------------------------------------
@pytest.mark.django_db
def test_item_12_test_booking_date_range(anon_client, db):
    loc = LocationFactory.create(name="Range Lab", location_type="diagnostic_center")
    cat = TestCategoryFactory.create(name="Range Cat")
    t = TestFactory.create(name="Range Test", category=cat)
    ft = FacilityTestFactory.create(location=loc, test=t, price=100)
    resp = anon_client.post("/api/v1/bookings/test/", {
        "facility_test_id": str(ft.pk),
        "pickup_date": (timezone.localdate() + datetime.timedelta(days=31)).isoformat(),
        "patient_name": "Range",
        "patient_phone": "01711113333",
        "otp_code": "123",
    })
    assert resp.status_code == 400


# ---------------------------------------------------------------------------
# #13 Price snapshot
# ---------------------------------------------------------------------------
@pytest.mark.django_db
def test_item_13_price_snapshot(anon_client, db):
    loc = LocationFactory.create(name="Snap Lab", location_type="diagnostic_center")
    cat = TestCategoryFactory.create(name="Snap Cat")
    t = TestFactory.create(name="Snap Test", category=cat)
    ft = FacilityTestFactory.create(location=loc, test=t, price=200)
    resp = anon_client.post("/api/v1/bookings/test/", {
        "facility_test_id": str(ft.pk),
        "pickup_date": (timezone.localdate() + datetime.timedelta(days=1)).isoformat(),
        "patient_name": "Snap",
        "patient_phone": "01711114444",
        "otp_code": "123",
    })
    assert resp.status_code == 201, resp.data
    assert resp.data["price"] == "200.00"


# ---------------------------------------------------------------------------
# #14 Strict geo
# ---------------------------------------------------------------------------
@pytest.mark.django_db
def test_item_14_strict_geo(anon_client, geo):
    from services.facilities import create_hospital
    from rest_framework.exceptions import ValidationError
    with pytest.raises(ValidationError):
        create_hospital(
            validated_data={},
            location_data={"name": "No Thana", "address_line": "X"},
        )


# ---------------------------------------------------------------------------
# #15 Optional test price
# ---------------------------------------------------------------------------
@pytest.mark.django_db
def test_item_15_null_price(anon_client, db):
    loc = LocationFactory.create(name="Null Price Lab", location_type="diagnostic_center")
    cat = TestCategoryFactory.create(name="Null Price Cat")
    t = TestFactory.create(name="Null Price Test", category=cat)
    ft = FacilityTestFactory.create(location=loc, test=t, price=None)
    assert ft.calculated_price is None


# ---------------------------------------------------------------------------
# #16 Hospital defaults
# ---------------------------------------------------------------------------
@pytest.mark.django_db
def test_item_16_hospital_defaults(geo):
    loc = LocationFactory.create(name="Defaults Hosp", thana=geo["thana"])
    hosp = Hospital.objects.create(location=loc)
    assert hosp.bed_capacity is None
    assert hosp.has_helipad is None


# ---------------------------------------------------------------------------
# #17 Role properties
# ---------------------------------------------------------------------------
@pytest.mark.django_db
def test_item_17_role_properties(db):
    user = UserFactory.create(phone_number="01711115555")
    assert user.is_super_admin is False
    assert user.is_facility_staff is False
    assert user.is_facility_admin is False


# ---------------------------------------------------------------------------
# #18 Atomic chambers
# ---------------------------------------------------------------------------
@pytest.mark.django_db
def test_item_18_nested_affiliations_rejected(admin_client, db):
    doc = DoctorFactory.create(name="Dr. Nested")
    resp = admin_client.post("/api/v1/doctors/", {
        "name": "Dr. Nested Create",
        "qualification": "MBBS",
        "affiliations": [{"location_id": "x", "fee": "500"}],
    }, format="json")
    assert resp.status_code == 400


# ---------------------------------------------------------------------------
# #19 Slim facets
# ---------------------------------------------------------------------------
@pytest.mark.django_db
def test_item_19_slim_facets(anon_client, db):
    resp = anon_client.get("/api/v1/search-facets/")
    assert resp.status_code == 200
    assert "hospital_categories" in resp.data
    assert "specialties" not in resp.data


# ---------------------------------------------------------------------------
# #20 Cache invalidation
# ---------------------------------------------------------------------------
@pytest.mark.django_db
def test_item_20_cache_invalidation(db):
    from core.cache_keys import public_cache_version, bump_public_cache
    v1 = public_cache_version()
    bump_public_cache()
    v2 = public_cache_version()
    assert v2 > v1


# ---------------------------------------------------------------------------
# #21 (Part 1) Timezone regression
# ---------------------------------------------------------------------------
@pytest.mark.django_db
def test_item_21_timezone_regression(admin_client, db):
    loc = LocationFactory.create(name="TZ Hosp")
    doc = DoctorFactory.create(name="Dr. TZ")
    aff = DoctorAffiliationFactory.create(doctor=doc, location=loc)
    today = timezone.localdate()
    tuesday = today
    while tuesday.strftime("%A") != "Tuesday":
        tuesday += datetime.timedelta(days=1)
    monday = tuesday - datetime.timedelta(days=1)
    sched_mon = AffiliationScheduleFactory.create(
        affiliation=aff, day_of_week="Monday",
        start_time="17:00:00", end_time="21:00:00",
    )
    frozen = datetime.datetime.combine(tuesday, datetime.time(0, 30),
                                       tzinfo=timezone.get_current_timezone())
    with patch("django.utils.timezone.localtime", return_value=frozen):
        with patch("django.utils.timezone.localdate", return_value=tuesday):
            resp = admin_client.post("/api/v1/bookings/doctor/", {
                "affiliation_id": str(aff.pk),
                "date": monday.isoformat(),
                "session_key": f"s:{sched_mon.pk}",
                "patient_name": "TZ",
                "patient_phone": "01711116666",
                "otp_code": "123",
            })
            assert resp.status_code == 400


# ---------------------------------------------------------------------------
# #22 Category counts on read
# ---------------------------------------------------------------------------
@pytest.mark.django_db
def test_item_22_category_counts(anon_client, db):
    cat = HospitalCategory.objects.create(name="P2 Regression Cat")
    loc = LocationFactory.create(name="Count Hosp")
    Hospital.objects.create(location=loc, category=cat)
    resp = anon_client.get("/api/v1/hospital-categories/")
    assert resp.status_code == 200
    data = resp.data.get("results", resp.data)
    cat_data = next(c for c in data if c["name"] == "P2 Regression Cat")
    assert cat_data["hospital_count"] == 1


# ---------------------------------------------------------------------------
# #23 Specialties returns specialties
# ---------------------------------------------------------------------------
    @pytest.mark.django_db
    def test_item_23_specialties_not_aliases(anon_client, db):
        DoctorSpecialty.objects.create(name="P2 Regression Spec")
        resp = anon_client.get("/api/v1/specialties/")
        assert resp.status_code == 200
        data = resp.data if isinstance(resp.data, list) else resp.data.get("results", resp.data)
        names = [s["name"] for s in data]
        assert "P2 Regression Spec" in names


# ---------------------------------------------------------------------------
# #24 Async SMS
# ---------------------------------------------------------------------------
@pytest.mark.django_db(transaction=True)
def test_item_24_run_after_commit(settings):
    settings.SMS_ASYNC = False
    from core.tasks import run_after_commit
    from django.db import transaction
    calls = []
    with transaction.atomic():
        run_after_commit(lambda: calls.append(1))
    assert calls == [1]
