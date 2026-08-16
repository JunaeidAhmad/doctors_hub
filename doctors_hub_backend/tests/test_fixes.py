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

from facilities.models import Address, Location, Hospital, DiagnosticCenter
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
    addr = Address.objects.create(address_line="123 St", district="Dhaka", division="Dhaka", postal_code="1200")
    loc = Location.objects.create(
        name="Health Care Center", location_type="hospital", address=addr
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
    addr_dhaka = Address.objects.create(
        address_line="Line 1", city="Dhaka", area="Dhanmondi", district="Dhaka", division="Dhaka", postal_code="1205"
    )
    loc_dhaka = Location.objects.create(
        name="Dhaka Hospital", location_type="hospital", address=addr_dhaka
    )
    hosp_dhaka = Hospital.objects.create(location=loc_dhaka)

    addr_ctg = Address.objects.create(
        address_line="Line 2", city="Chittagong", area="Agrabad", district="Chittagong", division="Chittagong", postal_code="4000"
    )
    loc_ctg = Location.objects.create(
        name="Chittagong Hospital", location_type="hospital", address=addr_ctg
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
    endpoints = [
        "/api/branches/",
        "/api/hospital-specialties/",
        "/api/doctor-specialties/",
        "/api/pathology-tests/",
        "/api/diagnostic-center-tests/",
        "/api/branch-tests/",
    ]
    for endpoint in endpoints:
        res = client.get(endpoint)
        assert res.status_code == 200, f"Failed GET request to {endpoint}"
