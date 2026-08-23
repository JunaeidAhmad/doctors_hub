import pytest
from datetime import time, date
from django.core.exceptions import ValidationError
from rest_framework.test import APIClient

from accounts.models import User
from doctors.models import Doctor, DoctorSpecialty, DoctorAffiliation, AffiliationSchedule
from doctors.serializers import DoctorSerializer
import doctors.views as doctor_views
import doctors.serializers as doctor_serializers
import facilities.views as facility_views
import facilities.serializers as facility_serializers
import tests.views as test_views
import tests.serializers as test_serializers

from facilities.models import Location, Hospital, DiagnosticCenter
from bookings.models import DoctorBooking
from bookings.serializers import DoctorBookingSerializer


@pytest.mark.django_db
def test_no_legacy_aliases_exist():
    # Verify legacy alias symbols are no longer defined in view/serializer modules
    assert not hasattr(doctor_views, 'SpecialtyViewSet')
    assert not hasattr(doctor_serializers, 'SpecialtySerializer')

    assert not hasattr(facility_views, 'HospitalSpecialtyViewSet')
    assert not hasattr(facility_views, 'BranchViewSet')
    assert not hasattr(facility_serializers, 'HospitalSpecialtySerializer')
    assert not hasattr(facility_serializers, 'BranchSerializer')

    assert not hasattr(test_views, 'DiagnosticCenterTestViewSet')
    assert not hasattr(test_views, 'BranchTestViewSet')
    assert not hasattr(test_views, 'PathologyTestViewSet')
    assert not hasattr(test_serializers, 'BranchTestSerializer')
    assert not hasattr(test_serializers, 'DiagnosticCenterTestSerializer')


@pytest.mark.django_db
def test_doctor_slug_and_lookup_mixin():
    doc = Doctor.objects.create(name="Dr. Alice Smith", qualification="FCPS", experience="10 yrs")
    assert doc.slug == "dr-alice-smith"

    serializer = DoctorSerializer(doc)
    assert "slug" in serializer.data
    assert serializer.data["slug"] == "dr-alice-smith"

    client = APIClient()
    # Test retrieving Doctor by UUID
    response_by_id = client.get(f"/api/doctors/{doc.id}/")
    assert response_by_id.status_code == 200
    assert response_by_id.data["id"] == str(doc.id)
    assert response_by_id.data["slug"] == "dr-alice-smith"

    # Test retrieving Doctor by slug using SlugOrPkLookupMixin
    response_by_slug = client.get("/api/doctors/dr-alice-smith/")
    assert response_by_slug.status_code == 200
    assert response_by_slug.data["id"] == str(doc.id)


@pytest.mark.django_db
def test_validate_slot_against_schedule_called_on_save_and_serializer():
    user = User.objects.create_user(phone_number="01700000000", password="password")
    loc = Location.objects.create(
        name="Health Care Center", location_type="hospital",
        address_line="123 St", district="Dhaka", division="Dhaka"
    )
    doc = Doctor.objects.create(name="Dr. Bob", qualification="MBBS", experience="5 yrs")
    aff = DoctorAffiliation.objects.create(doctor=doc, location=loc, fee=500)
    
    # Monday schedule from 09:00 to 17:00
    AffiliationSchedule.objects.create(
        affiliation=aff, day_of_week="Monday", start_time=time(9, 0), end_time=time(17, 0)
    )

    # 2026-08-17 is a Monday
    monday_date = date(2026, 8, 17)
    # 2026-08-18 is a Tuesday
    tuesday_date = date(2026, 8, 18)

    # Valid booking on Monday at 10:00
    booking = DoctorBooking(user=user, affiliation=aff, date=monday_date, slot="10:00", patient_name="Patient A")
    booking.save()
    assert booking.pk is not None

    # Invalid booking on Tuesday (no schedule for Tuesday) should raise ValidationError on save()
    invalid_booking = DoctorBooking(user=user, affiliation=aff, date=tuesday_date, slot="10:00", patient_name="Patient B")
    with pytest.raises(ValidationError):
        invalid_booking.save()

    # Invalid slot outside scheduled hours on Monday should raise ValidationError on save()
    out_of_hours_booking = DoctorBooking(user=user, affiliation=aff, date=monday_date, slot="18:00", patient_name="Patient C")
    with pytest.raises(ValidationError):
        out_of_hours_booking.save()

    # Test serializer validation
    serializer_invalid = DoctorBookingSerializer(data={
        'affiliation_id': str(aff.id),
        'date': tuesday_date.isoformat(),
        'slot': '10:00',
        'patient_name': 'Patient D'
    })
    assert not serializer_invalid.is_valid()
    assert 'non_field_errors' in serializer_invalid.errors


@pytest.mark.django_db
def test_filterset_fields_covers_district_and_division():
    loc_dhaka = Location.objects.create(
        name="Dhaka Hospital", location_type="hospital",
        address_line="Line 1", area="Dhanmondi", district="Dhaka", division="Dhaka"
    )
    hosp_dhaka = Hospital.objects.create(location=loc_dhaka)

    loc_ctg = Location.objects.create(
        name="Chittagong Hospital", location_type="hospital",
        address_line="Line 2", area="Agrabad", district="Chittagong", division="Chittagong"
    )
    hosp_ctg = Hospital.objects.create(location=loc_ctg)


    from facilities.views import HospitalFilter
    filter_district = HospitalFilter({'district': 'Chittagong'}, queryset=Hospital.objects.all())
    assert hosp_ctg in filter_district.qs
    assert hosp_dhaka not in filter_district.qs

    filter_division = HospitalFilter({'division': 'Dhaka'}, queryset=Hospital.objects.all())
    assert hosp_dhaka in filter_division.qs
    assert hosp_ctg not in filter_division.qs

    client = APIClient()
    res = client.get("/api/hospitals/?district=Chittagong")
    assert res.status_code == 200
    results = res.data.get("results", res.data)
    assert len(results) == 1
    assert results[0]["location_details"]["name"] == "Chittagong Hospital"




@pytest.mark.django_db
def test_api_routes_work_without_aliases():
    client = APIClient()
    # Canonical endpoints return 200
    canonical_endpoints = [
        "/api/locations/",
        "/api/hospitals/",
        "/api/hospital-categories/",
        "/api/diagnostic-centers/",
        "/api/diagnostic-center-categories/",
        "/api/specialties/",
        "/api/doctors/",
        "/api/affiliations/",
        "/api/schedules/",
        "/api/tests/",
        "/api/facility-tests/",
        "/api/test-categories/",
    ]
    for endpoint in canonical_endpoints:
        res = client.get(endpoint)
        assert res.status_code == 200, f"Failed GET request to canonical {endpoint}"

    # Legacy alias routes return 404
    legacy_alias_endpoints = [
        "/api/branches/",
        "/api/practice-locations/",
        "/api/hospital-specialties/",
        "/api/doctor-specialties/",
        "/api/doctor-affiliations/",
        "/api/affiliation-schedules/",
        "/api/pathology-tests/",
        "/api/diagnostic-center-tests/",
        "/api/branch-tests/",
        "/api/doctor-bookings/",
        "/api/lab-bookings/",
    ]
    for endpoint in legacy_alias_endpoints:
        res = client.get(endpoint)
        assert res.status_code == 404, f"Legacy alias {endpoint} unexpectedly returned {res.status_code}"


@pytest.mark.django_db
def test_is_super_admin_separation_from_staff():
    staff_user = User.objects.create_user(phone_number="01811111111", password="password", is_staff=True)
    assert staff_user.is_staff is True
    assert staff_user.is_super_admin is False

    superuser = User.objects.create_superuser(phone_number="01822222222", password="password")
    assert superuser.is_super_admin is True


@pytest.mark.django_db
def test_facility_test_discount_and_calculated_price():
    from decimal import Decimal
    from tests.models import TestCategory, Test, FacilityTest
    cat = TestCategory.objects.create(name="Radiology")
    test_obj = Test.objects.create(name="X-Ray Chest", category=cat)
    loc = Location.objects.create(name="Medi Diagnostic", location_type="diagnostic_center", address_line="Gulshan", district="Dhaka", division="Dhaka")

    ft = FacilityTest.objects.create(
        location=loc, test=test_obj, price=Decimal("1000.00"), discount_percent=Decimal("15.00")
    )
    assert ft.calculated_price == Decimal("850.00")
    assert ft.discounted_price == Decimal("850.00")

    serializer = test_serializers.FacilityTestSerializer(ft)
    assert Decimal(str(serializer.data["calculated_price"])) == Decimal("850.00")
    assert Decimal(str(serializer.data["discount_percent"])) == Decimal("15.00")


@pytest.mark.django_db
def test_slug_collision_resolution():
    doc1 = Doctor.objects.create(name="Dr. Same Name", qualification="MBBS", experience="3 yrs")
    doc2 = Doctor.objects.create(name="Dr. Same Name", qualification="MBBS", experience="5 yrs")

    assert doc1.slug == "dr-same-name"
    assert doc2.slug.startswith("dr-same-name-")
    assert doc1.slug != doc2.slug

    loc1 = Location.objects.create(name="Same Hospital", location_type="hospital", address_line="Line 1", district="Dhaka", division="Dhaka")
    loc2 = Location.objects.create(name="Same Hospital", location_type="hospital", address_line="Line 2", district="Dhaka", division="Dhaka")

    assert loc1.slug == "same-hospital"
    assert loc2.slug.startswith("same-hospital-")
    assert loc1.slug != loc2.slug


@pytest.mark.django_db
def test_facility_service_orchestration():
    from services.facilities import create_hospital, update_hospital
    from facilities.models import Hospital
    from tests.models import TestCategory, Test, FacilityTest

    cat = TestCategory.objects.create(name="Microbiology")
    test_obj = Test.objects.create(name="Culture & Sensitivity", category=cat)

    location_data = {
        "name": "Service Hospital",
        "district": "Dhaka",
        "division": "Dhaka",
        "address_line": "Uttara",
    }
    hospital = create_hospital(
        validated_data={"has_diagnostic_center": True},
        location_data=location_data,
        test_cat_ids=[str(cat.id)],
        prices={str(test_obj.id): 650.00}
    )
    assert hospital.pk is not None
    assert hospital.location.name == "Service Hospital"
    assert FacilityTest.objects.filter(location=hospital.location, test=test_obj).exists()


@pytest.mark.django_db
def test_auth_refresh_and_logout_endpoints():
    user = User.objects.create_user(phone_number="01911111111", password="testpassword123")
    client = APIClient()

    # Login
    login_res = client.post("/api/auth/login/", {"phone_number": "01911111111", "password": "testpassword123"})
    assert login_res.status_code == 200
    assert "access" in login_res.data
    assert "refresh" in login_res.data
    assert "refresh_token" in login_res.cookies

    refresh_token = login_res.data["refresh"]

    # Refresh via body
    refresh_res = client.post("/api/auth/refresh/", {"refresh": refresh_token})
    assert refresh_res.status_code == 200
    assert "access" in refresh_res.data

    # Logout
    logout_res = client.post("/api/auth/logout/")
    assert logout_res.status_code == 200


