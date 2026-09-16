import pytest
from datetime import time, date
from rest_framework.test import APIClient
from django.test.utils import CaptureQueriesContext
from django.db import connection

from accounts.models import User
from doctors.models import Doctor, DoctorSpecialty, DoctorAffiliation, AffiliationSchedule
from facilities.models import Location, Hospital, HospitalCategory, HospitalService, DiagnosticCenter, DiagnosticCenterCategory, DiagnosticService
from tests.models import TestCategory, Test, FacilityTest
from bookings.models import DoctorBooking, LabBooking, TestBooking, HospitalServiceBooking


@pytest.mark.django_db
def test_doctors_list_no_n_plus_one():
    spec1 = DoctorSpecialty.objects.create(name="Cardiology")
    spec2 = DoctorSpecialty.objects.create(name="Neurology")
    
    for i in range(5):
        loc = Location.objects.create(
            name=f"Hospital {i}", location_type="hospital",
            address_line=f"{i} Street", district="Dhaka", division="Dhaka"
        )
        doc = Doctor.objects.create(name=f"Dr. Doctor {i}", qualification="MBBS", experience="5 yrs")
        doc.specialties.add(spec1, spec2)
        aff = DoctorAffiliation.objects.create(doctor=doc, location=loc, fee=500)
        AffiliationSchedule.objects.create(affiliation=aff, day_of_week="Monday", start_time=time(9, 0), end_time=time(17, 0))
        AffiliationSchedule.objects.create(affiliation=aff, day_of_week="Wednesday", start_time=time(9, 0), end_time=time(17, 0))

    client = APIClient()
    with CaptureQueriesContext(connection) as ctx:
        res = client.get("/api/doctors/")
        assert res.status_code == 200
        data = res.data.get("results", res.data)
        assert len(data) == 5

    # Should execute bounded number of queries (Count + Doctors + Specialties + Components + Affiliations + Locations + Thanas + Districts + Divisions + Schedules)
    # Regardless of whether there are 5 or 50 doctors, it must not execute per-doctor or per-affiliation queries
    assert len(ctx.captured_queries) <= 10


@pytest.mark.django_db
def test_doctor_affiliations_list_no_n_plus_one():
    spec = DoctorSpecialty.objects.create(name="Pediatrics")
    for i in range(5):
        loc = Location.objects.create(
            name=f"Clinic {i}", location_type="chamber",
            address_line=f"{i} Road", district="Dhaka", division="Dhaka"
        )
        doc = Doctor.objects.create(name=f"Dr. Specialist {i}", qualification="FCPS", experience="10 yrs")
        doc.specialties.add(spec)
        aff = DoctorAffiliation.objects.create(doctor=doc, location=loc, fee=600)
        AffiliationSchedule.objects.create(affiliation=aff, day_of_week="Sunday", start_time=time(10, 0), end_time=time(14, 0))

    client = APIClient()
    with CaptureQueriesContext(connection) as ctx:
        res = client.get("/api/affiliations/")
        assert res.status_code == 200
        data = res.data.get("results", res.data)
        assert len(data) == 5

    # Fixed number of queries: Count + Affiliations (with select_related doctor & location) + Schedules + Doctor Specialties
    assert len(ctx.captured_queries) <= 5


@pytest.mark.django_db
def test_doctor_bookings_list_no_n_plus_one():
    user = User.objects.create_superuser(phone_number="01711111111", password="password")
    spec = DoctorSpecialty.objects.create(name="Dermatology")
    loc = Location.objects.create(name="Skin Care Hospital", location_type="hospital", address_line="Banani", district="Dhaka", division="Dhaka")
    doc = Doctor.objects.create(name="Dr. Skin", qualification="MD", experience="8 yrs")
    doc.specialties.add(spec)
    aff = DoctorAffiliation.objects.create(doctor=doc, location=loc, fee=700)
    AffiliationSchedule.objects.create(affiliation=aff, day_of_week="Monday", start_time=time(9, 0), end_time=time(17, 0))

    for i in range(5):
        DoctorBooking.objects.create(
            user=user, affiliation=aff, date=date(2026, 8, 17), slot=f"{10 + i}:00", patient_name=f"Patient {i}"
        )

    client = APIClient()
    client.force_authenticate(user=user)
    with CaptureQueriesContext(connection) as ctx:
        res = client.get("/api/bookings/doctor/")
        assert res.status_code == 200
        data = res.data.get("results", res.data)
        assert len(data) == 5

    # 1 count query + 1 select_related query
    assert len(ctx.captured_queries) <= 3


@pytest.mark.django_db
def test_lab_bookings_list_no_n_plus_one():
    user = User.objects.create_superuser(phone_number="01722222222", password="password")
    cat = TestCategory.objects.create(name="Biochemistry")
    test_obj = Test.objects.create(name="Lipid Profile", category=cat)
    loc = Location.objects.create(name="Central Diagnostic", location_type="diagnostic_center", address_line="Dhanmondi", district="Dhaka", division="Dhaka")
    ft = FacilityTest.objects.create(location=loc, test=test_obj, price=1200)

    for i in range(5):
        LabBooking.objects.create(
            user=user, facility_test=ft, pickup_date=date(2026, 8, 20),
            patient_name=f"Lab Patient {i}", patient_phone="01700000000",
            pickup_address_line=f"House {i}"
        )

    client = APIClient()
    client.force_authenticate(user=user)
    with CaptureQueriesContext(connection) as ctx:
        res = client.get("/api/bookings/lab/")
        assert res.status_code == 200
        data = res.data.get("results", res.data)
        assert len(data) == 5

    # 1 count query + 1 select_related query
    assert len(ctx.captured_queries) <= 3



@pytest.mark.django_db
def test_hospitals_and_diagnostic_centers_no_n_plus_one():
    hcat = HospitalCategory.objects.create(name="General Hospital")
    dcat = DiagnosticCenterCategory.objects.create(name="Clinical Lab")
    hserv = HospitalService.objects.create(name="ICU")
    dserv = DiagnosticService.objects.create(name="MRI")

    for i in range(4):
        hloc = Location.objects.create(name=f"General Hospital {i}", location_type="hospital", address_line="Street", district="Dhaka", division="Dhaka")
        h = Hospital.objects.create(location=hloc, category=hcat)
        h.services.add(hserv)

        dloc = Location.objects.create(name=f"Imaging Center {i}", location_type="diagnostic_center", address_line="Road", district="Dhaka", division="Dhaka")
        d = DiagnosticCenter.objects.create(location=dloc, category=dcat)
        d.services.add(dserv)


    client = APIClient()
    with CaptureQueriesContext(connection) as ctx_h:
        res_h = client.get("/api/hospitals/")
        assert res_h.status_code == 200
        data_h = res_h.data.get("results", res_h.data)
        assert len(data_h) == 4

    assert len(ctx_h.captured_queries) <= 5

    with CaptureQueriesContext(connection) as ctx_d:
        res_d = client.get("/api/diagnostic-centers/")
        assert res_d.status_code == 200
        data_d = res_d.data.get("results", res_d.data)
        assert len(data_d) == 4

    assert len(ctx_d.captured_queries) <= 5


@pytest.mark.django_db
def test_facility_tests_list_no_n_plus_one():
    cat = TestCategory.objects.create(name="Hematology")
    test_obj = Test.objects.create(name="CBC", category=cat)

    for i in range(5):
        loc = Location.objects.create(
            name=f"Diagnostic Center {i}",
            branch=f"Branch {i}",
            location_type="diagnostic_center",
            address_line=f"{i} Street",
            district="Dhaka",
            division="Dhaka"
        )
        FacilityTest.objects.create(location=loc, test=test_obj, price=500 + i * 50)

    client = APIClient()
    with CaptureQueriesContext(connection) as ctx:
        res = client.get("/api/facility-tests/")
        assert res.status_code == 200
        data = res.data.get("results", res.data)
        assert len(data) == 5
        # Verify branch is present in each item
        for item in data:
            assert "branch" in item
            assert item["branch"].startswith("Branch ")

    # Bounded query count: count + select_related(location, test, test__category)
    assert len(ctx.captured_queries) <= 4


@pytest.mark.django_db
def test_hospital_service_bookings_list_no_n_plus_one():
    user = User.objects.create_superuser(phone_number="01733333333", password="password")
    hcat = HospitalCategory.objects.create(name="Specialized Hospital")
    hserv = HospitalService.objects.create(name="Ambulance Service")

    for i in range(5):
        hloc = Location.objects.create(
            name=f"Metro Hospital {i}",
            branch=f"Campus {i}",
            location_type="hospital",
            address_line=f"Road {i}",
            district="Dhaka",
            division="Dhaka"
        )
        h = Hospital.objects.create(location=hloc, category=hcat)
        h.services.add(hserv)
        HospitalServiceBooking.objects.create(
            user=user,
            hospital=h,
            service=hserv,
            booking_date=date(2026, 8, 25),
            patient_name=f"Patient {i}",
            patient_phone="01711111111"
        )

    client = APIClient()
    client.force_authenticate(user=user)
    with CaptureQueriesContext(connection) as ctx:
        res = client.get("/api/bookings/hospital-services/")
        assert res.status_code == 200
        data = res.data.get("results", res.data)
        assert len(data) == 5
        for item in data:
            assert "branch" in item
            assert item["branch"].startswith("Campus ")

    # Bounded query count: 1 count query + 1 select_related query
    assert len(ctx.captured_queries) <= 4

