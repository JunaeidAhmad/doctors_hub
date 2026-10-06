import pytest
from rest_framework.test import APIClient
from facilities.models import Location, Hospital, DiagnosticCenter, Division, District, Thana
from doctors.models import Doctor, DoctorAffiliation
from tests.models import TestCategory, Test, FacilityTest
from bookings.models import DoctorBooking, Patient
from accounts.models import User
import datetime


@pytest.fixture
def client():
    return APIClient()


@pytest.fixture
def geo_data():
    div, _ = Division.objects.get_or_create(name="Dhaka")
    dist, _ = District.objects.get_or_create(name="Dhaka", division=div)
    thana, _ = Thana.objects.get_or_create(name="Dhanmondi", district=dist)
    return {"division": div, "district": dist, "thana": thana}


@pytest.mark.django_db
def test_hospital_list_and_detail_flat_shape(client, geo_data):
    loc = Location.objects.create(
        name="Square Hospital",
        branch="Panthapath",
        address_line="18/F West Panthapath",
        thana=geo_data["thana"],
        location_type=Location.LocationType.HOSPITAL,
        is_active=True,
    )
    hospital = Hospital.objects.create(location=loc)

    # List endpoint
    res = client.get("/api/v1/hospitals/")
    assert res.status_code == 200
    results = res.data.get("results", res.data)
    hosp_data = next((h for h in results if str(h.get("id")) == str(loc.id)), None)
    assert hosp_data is not None
    assert "location_details" not in hosp_data
    assert hosp_data["display_name"] == "Square Hospital (Panthapath)"
    assert hosp_data["district_id"] == geo_data["district"].id
    assert hosp_data["district"] == "Dhaka"
    assert hosp_data["address"] == "18/F West Panthapath"

    # Detail endpoint
    res_detail = client.get(f"/api/v1/hospitals/{loc.slug}/")
    assert res_detail.status_code == 200
    assert "location_details" not in res_detail.data
    assert res_detail.data["display_name"] == "Square Hospital (Panthapath)"
    assert res_detail.data["district_id"] == geo_data["district"].id
    assert res_detail.data["address"] == "18/F West Panthapath"


@pytest.mark.django_db
def test_doctor_affiliation_facility_shape(client, geo_data):
    doc = Doctor.objects.create(name="Dr. Test Surgeon")
    loc = Location.objects.create(
        name="Apollo Hospitals",
        branch="Bashundhara",
        address_line="Plot 81, Block E",
        thana=geo_data["thana"],
        location_type=Location.LocationType.HOSPITAL,
        is_active=True,
    )
    aff = DoctorAffiliation.objects.create(doctor=doc, location=loc, fee=1200)

    # Fetch via doctor detail
    res = client.get(f"/api/v1/doctors/{doc.slug}/")
    assert res.status_code == 200
    affs = res.data.get("affiliations", [])
    assert len(affs) >= 1
    target_aff = affs[0]
    assert "location_details" not in target_aff
    assert "facility_name" not in target_aff
    assert "facility" in target_aff
    assert target_aff["facility"]["display_name"] == "Apollo Hospitals (Bashundhara)"
    assert target_aff["facility"]["district_id"] == geo_data["district"].id


@pytest.mark.django_db
def test_facility_test_facility_shape(client, geo_data):
    cat = TestCategory.objects.create(name="Biochemistry", slug="biochemistry")
    test = Test.objects.create(category=cat, name="Lipid Profile", slug="lipid-profile")
    loc = Location.objects.create(
        name="Popular Diagnostic",
        branch="Dhanmondi",
        address_line="House 16, Road 2",
        thana=geo_data["thana"],
        location_type=Location.LocationType.DIAGNOSTIC_CENTER,
        is_active=True,
    )
    ft = FacilityTest.objects.create(location=loc, test=test, price=1500)

    res = client.get("/api/v1/facility-tests/")
    assert res.status_code == 200
    results = res.data.get("results", res.data)
    ft_data = next((item for item in results if str(item.get("id")) == str(ft.id)), None)
    assert ft_data is not None
    assert "location_details" not in ft_data
    assert "facility_name" not in ft_data
    assert "facility_type" not in ft_data
    assert "facility" in ft_data
    assert ft_data["facility"]["district"] == "Dhaka"
    assert ft_data["facility"]["display_name"] == "Popular Diagnostic (Dhanmondi)"


@pytest.mark.django_db
def test_doctor_booking_facility_shape(client, geo_data):
    doc = Doctor.objects.create(name="Dr. Booking Specialist")
    loc = Location.objects.create(
        name="Labaid Specialized Hospital",
        branch="Dhanmondi",
        thana=geo_data["thana"],
        location_type=Location.LocationType.HOSPITAL,
        is_active=True,
    )
    aff = DoctorAffiliation.objects.create(doctor=doc, location=loc, fee=1000)
    admin_user = User.objects.create_superuser(
        phone_number="01999999999", password="adminpassword"
    )
    client.force_authenticate(user=admin_user)

    today_name = datetime.date.today().strftime("%A")
    from doctors.models import AffiliationSchedule
    AffiliationSchedule.objects.create(
        affiliation=aff,
        day_of_week=today_name,
        start_time=datetime.time(17, 0),
        end_time=datetime.time(21, 0),
    )

    patient = Patient.objects.create(name="Rahim Uddin", phone="01711112222")
    booking = DoctorBooking.objects.create(
        patient=patient,
        affiliation=aff,
        date=datetime.date.today(),
        session_key="17:00-21:00",
        session_start=datetime.time(17, 0),
        session_end=datetime.time(21, 0),
        serial_number=1,
        patient_name=patient.name,
        patient_phone=patient.phone,
    )

    res = client.get(f"/api/v1/bookings/doctor-bookings/{booking.id}/")
    assert res.status_code == 200
    assert "facility_name" not in res.data
    assert "branch" not in res.data
    assert "facility" in res.data
    assert res.data["facility"]["display_name"] == "Labaid Specialized Hospital (Dhanmondi)"


@pytest.mark.django_db
def test_display_name_property_and_deduping(geo_data):
    loc1 = Location(name="Square Hospital", branch="Dhanmondi", thana=geo_data["thana"])
    assert loc1.display_name == "Square Hospital (Dhanmondi)"

    loc2 = Location(name="Square Hospital - Dhanmondi", branch="Dhanmondi", thana=geo_data["thana"])
    assert loc2.display_name == "Square Hospital (Dhanmondi)"

    loc3 = Location(name="Dhanmondi", branch="Dhanmondi", thana=geo_data["thana"])
    assert loc3.display_name == "Dhanmondi"


@pytest.mark.django_db
def test_query_count_bounds(client, django_assert_num_queries, geo_data):
    # Seed 5 hospitals
    for i in range(5):
        loc = Location.objects.create(
            name=f"Hospital Query {i}",
            branch="Main",
            thana=geo_data["thana"],
            location_type=Location.LocationType.HOSPITAL,
            is_active=True,
        )
        Hospital.objects.create(location=loc)

    # Seed 5 doctors with affiliations
    for i in range(5):
        doc = Doctor.objects.create(name=f"Dr. Query {i}")
        loc = Location.objects.create(
            name=f"Chamber Query {i}",
            branch="Main",
            thana=geo_data["thana"],
            location_type=Location.LocationType.CHAMBER,
            is_active=True,
        )
        DoctorAffiliation.objects.create(doctor=doc, location=loc, fee=500)

    with django_assert_num_queries(3):
        res_h = client.get("/api/v1/hospitals/?page_size=20")
        assert res_h.status_code == 200

    # 7 queries base + 3 for batch_next_available = 10 (optimized prefetch)
    with django_assert_num_queries(10):
        res_d = client.get("/api/v1/doctors/?page_size=20")
        assert res_d.status_code == 200
