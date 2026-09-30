import pytest
from rest_framework.test import APIClient
from django.core.cache import cache
from core.uuid7 import uuid7
from facilities.models import (
    Division, District, Thana, Location,
    HospitalCategory, Hospital,
    DiagnosticCenterCategory, DiagnosticCenter
)
from tests.models import TestCategory, Test, FacilityTest
from doctors.models import DoctorSpecialty, Doctor, DoctorAffiliation, AffiliationSchedule


@pytest.fixture(autouse=True)
def clear_django_cache():
    cache.clear()
    yield
    cache.clear()


@pytest.fixture
def geo_setup(db):
    division = Division.objects.create(name="Dhaka Division", bn_name="ঢাকা", slug="dhaka-div-actions")
    district = District.objects.create(division=division, name="Dhaka District", bn_name="ঢাকা", slug="dhaka-dist-actions")
    thana = Thana.objects.create(district=district, name="Dhanmondi Actions", bn_name="ধানমন্ডি", slug="dhanmondi-actions")
    return {"division": division, "district": district, "thana": thana}


@pytest.fixture
def hospital_setup(db, geo_setup):
    loc = Location.objects.create(
        name="Evercare Hospital Dhaka",
        branch="Bashundhara",
        location_type=Location.LocationType.HOSPITAL,
        thana=geo_setup["thana"],
        address_line="Plot 81, Block E, Bashundhara R/A",
        slug="evercare-hospital-dhaka"
    )
    hosp = Hospital.objects.create(
        location=loc,
        bed_capacity=425,
        details_reviewed=True
    )
    return {"location": loc, "hospital": hosp}


@pytest.fixture
def client():
    return APIClient()


@pytest.mark.django_db
def test_facility_doctors_pagination(client, hospital_setup):
    loc = hospital_setup["location"]
    spec = DoctorSpecialty.objects.create(name="General Medicine", slug="general-medicine")

    # Create 15 doctors and affiliations
    for i in range(15):
        doc = Doctor.objects.create(
            name=f"Dr. Test Doctor {i:02d}",
            slug=f"dr-test-doctor-{i:02d}",
            primary_specialty=spec,
            qualification="MBBS"
        )
        doc.specialties.add(spec)
        aff = DoctorAffiliation.objects.create(
            doctor=doc,
            location=loc,
            fee=1000.00,
            chamber_type="OPD Room 101"
        )
        AffiliationSchedule.objects.create(
            affiliation=aff,
            day_of_week="Monday",
            start_time="09:00",
            end_time="12:00"
        )

    # Page 1 (default page_size 12)
    res_p1 = client.get(f"/api/hospitals/{loc.slug}/doctors/?page=1&page_size=12")
    assert res_p1.status_code == 200
    assert res_p1.data["count"] == 15
    assert res_p1.data["total_pages"] == 2
    assert res_p1.data["page"] == 1
    assert len(res_p1.data["results"]) == 12

    # Verify item shape
    first_item = res_p1.data["results"][0]
    assert "affiliation_id" in first_item
    assert "fee" in first_item
    assert "chamber_type" in first_item
    assert "schedules" in first_item
    assert len(first_item["schedules"]) == 1
    assert first_item["schedules"][0]["day_of_week"] == "Monday"
    assert "doctor" in first_item
    assert first_item["doctor"]["primary_specialty"]["slug"] == "general-medicine"

    # Page 2
    res_p2 = client.get(f"/api/hospitals/{loc.slug}/doctors/?page=2&page_size=12")
    assert res_p2.status_code == 200
    assert len(res_p2.data["results"]) == 3


@pytest.mark.django_db
def test_facility_doctors_specialty_umbrella_expansion(client, hospital_setup):
    loc = hospital_setup["location"]

    # Umbrella parent specialty
    parent = DoctorSpecialty.objects.create(
        name="Cardiology",
        slug="cardiology",
        is_umbrella=True
    )
    # Child leaf specialty
    child = DoctorSpecialty.objects.create(
        name="Pediatric Cardiology",
        slug="pediatric-cardiology",
        is_umbrella=False
    )
    parent.subspecialties.add(child)

    other = DoctorSpecialty.objects.create(
        name="Dermatology",
        slug="dermatology"
    )

    doc_child = Doctor.objects.create(
        name="Dr. Child Specialist",
        slug="dr-child-spec",
        primary_specialty=child,
        qualification="MBBS, MD"
    )
    doc_child.specialties.add(child)
    DoctorAffiliation.objects.create(doctor=doc_child, location=loc, fee=1200)

    doc_other = Doctor.objects.create(
        name="Dr. Skin Specialist",
        slug="dr-skin-spec",
        primary_specialty=other,
        qualification="MBBS, DDV"
    )
    doc_other.specialties.add(other)
    DoctorAffiliation.objects.create(doctor=doc_other, location=loc, fee=800)

    # Filter by umbrella parent slug
    res = client.get(f"/api/hospitals/{loc.slug}/doctors/?specialty=cardiology")
    assert res.status_code == 200
    assert res.data["count"] == 1
    assert res.data["results"][0]["doctor"]["slug"] == "dr-child-spec"


@pytest.mark.django_db
def test_search_does_not_404_facility(client, hospital_setup):
    loc = hospital_setup["location"]
    doc = Doctor.objects.create(
        name="Dr. Kamrul Zaman",
        slug="dr-kamrul-zaman",
        qualification="FCPS"
    )
    DoctorAffiliation.objects.create(doctor=doc, location=loc, fee=1500)

    # Search query param that does NOT match the hospital name "Evercare"
    res = client.get(f"/api/hospitals/{loc.slug}/doctors/?search=Zaman")
    assert res.status_code == 200
    assert res.data["count"] == 1
    assert res.data["results"][0]["doctor"]["name"] == "Dr. Kamrul Zaman"


@pytest.mark.django_db
def test_facets_ignore_specialty_filter(client, hospital_setup):
    loc = hospital_setup["location"]

    cardio = DoctorSpecialty.objects.create(name="Cardiology", slug="cardiology")
    derm = DoctorSpecialty.objects.create(name="Dermatology", slug="dermatology")

    doc1 = Doctor.objects.create(name="Dr. Cardio", slug="dr-cardio", primary_specialty=cardio)
    doc1.specialties.add(cardio)
    DoctorAffiliation.objects.create(doctor=doc1, location=loc, fee=1000)

    doc2 = Doctor.objects.create(name="Dr. Derm", slug="dr-derm", primary_specialty=derm)
    doc2.specialties.add(derm)
    DoctorAffiliation.objects.create(doctor=doc2, location=loc, fee=1000)

    # Query with specialty=cardiology
    res = client.get(f"/api/hospitals/{loc.slug}/doctors/?specialty=cardiology")
    assert res.status_code == 200
    # Results only has 1 doctor
    assert res.data["count"] == 1
    assert res.data["results"][0]["doctor"]["slug"] == "dr-cardio"

    # Facets still contain BOTH specialties
    specialties_facet = res.data["facets"]["specialties"]
    facet_slugs = {s["slug"] for s in specialties_facet}
    assert "cardiology" in facet_slugs
    assert "dermatology" in facet_slugs


@pytest.mark.django_db
def test_bmdc_number_is_null_when_empty(client, hospital_setup):
    loc = hospital_setup["location"]

    doc_empty_bmdc = Doctor.objects.create(
        name="Dr. No BMDC",
        slug="dr-no-bmdc",
        bmdc_number=""
    )
    DoctorAffiliation.objects.create(doctor=doc_empty_bmdc, location=loc, fee=500)

    doc_with_bmdc = Doctor.objects.create(
        name="Dr. With BMDC",
        slug="dr-with-bmdc",
        bmdc_number="A-998877"
    )
    DoctorAffiliation.objects.create(doctor=doc_with_bmdc, location=loc, fee=500)

    res = client.get(f"/api/hospitals/{loc.slug}/doctors/")
    assert res.status_code == 200
    results_by_slug = {r["doctor"]["slug"]: r["doctor"] for r in res.data["results"]}

    assert results_by_slug["dr-no-bmdc"]["bmdc_number"] is None
    assert results_by_slug["dr-with-bmdc"]["bmdc_number"] == "A-998877"


@pytest.mark.django_db
def test_facility_tests_endpoint_returns_only_facility_offerings(client, hospital_setup, geo_setup):
    loc1 = hospital_setup["location"]

    loc2 = Location.objects.create(
        name="Square Hospital Dhaka",
        branch="Panthapath",
        location_type=Location.LocationType.HOSPITAL,
        thana=geo_setup["thana"],
        address_line="18/F, Bir Uttam Qazi Nuruzzaman Sarak",
        slug="square-hospital-dhaka"
    )
    Hospital.objects.create(location=loc2)

    cat = TestCategory.objects.create(name="Biochemistry", slug="biochemistry")
    test_cbc = Test.objects.create(name="CBC", slug="cbc", category=cat)
    test_lipid = Test.objects.create(name="Lipid Profile", slug="lipid-profile", category=cat)
    test_xray = Test.objects.create(name="Chest X-Ray", slug="chest-xray", category=cat)

    # Loc 1 offers CBC and Lipid
    FacilityTest.objects.create(location=loc1, test=test_cbc, price=500)
    FacilityTest.objects.create(location=loc1, test=test_lipid, price=1200)

    # Loc 2 offers CBC and Chest X-Ray
    FacilityTest.objects.create(location=loc2, test=test_cbc, price=600)
    FacilityTest.objects.create(location=loc2, test=test_xray, price=800)

    res = client.get(f"/api/hospitals/{loc1.slug}/tests/")
    assert res.status_code == 200
    assert res.data["count"] == 2
    returned_slugs = {item["slug"] for item in res.data["results"]}
    assert returned_slugs == {"cbc", "lipid-profile"}

    # Confirm only loc1 offerings appear inside the tests
    for item in res.data["results"]:
        for offering in item["offerings"]:
            assert offering["facility"]["id"] == str(loc1.id)


@pytest.mark.django_db
def test_hospital_list_payload_no_embedded_lists_and_has_counts(client, hospital_setup):
    loc = hospital_setup["location"]

    doc = Doctor.objects.create(name="Dr. Count Test", slug="dr-count-test")
    DoctorAffiliation.objects.create(doctor=doc, location=loc, fee=1000)

    cat = TestCategory.objects.create(name="Pathology", slug="pathology")
    t = Test.objects.create(name="Blood Test", slug="blood-test", category=cat)
    FacilityTest.objects.create(location=loc, test=t, price=400, is_available=True)

    res = client.get("/api/hospitals/")
    assert res.status_code == 200
    results = res.data["results"] if isinstance(res.data, dict) and "results" in res.data else res.data
    hosp_data = next((h for h in results if h["id"] == str(loc.id) or h["slug"] == loc.slug), None)

    assert hosp_data is not None
    assert "affiliated_doctors" not in hosp_data
    assert "offered_tests" not in hosp_data
    assert hosp_data.get("doctor_count") == 1
    assert hosp_data.get("test_count") == 1
    assert hosp_data.get("details_reviewed") is True


@pytest.mark.django_db
def test_num_queries_bounds(client, hospital_setup, django_assert_num_queries):
    loc = hospital_setup["location"]
    spec = DoctorSpecialty.objects.create(name="Cardiology", slug="cardiology")

    for i in range(5):
        d = Doctor.objects.create(name=f"Doctor {i}", slug=f"doctor-{i}", primary_specialty=spec)
        d.specialties.add(spec)
        aff = DoctorAffiliation.objects.create(doctor=d, location=loc, fee=1000)
        AffiliationSchedule.objects.create(affiliation=aff, day_of_week="Monday", start_time="10:00", end_time="12:00")

    cat = TestCategory.objects.create(name="Pathology", slug="pathology-numq")
    for i in range(3):
        t = Test.objects.create(name=f"Test {i}", slug=f"test-{i}", category=cat)
        FacilityTest.objects.create(location=loc, test=t, price=500)

    # 1. Doctors endpoint should be <= 9 queries (base 6 queries + 3 for batch_next_available)
    with django_assert_num_queries(9):
        res_docs = client.get(f"/api/hospitals/{loc.slug}/doctors/")
        assert res_docs.status_code == 200

    # 2. Tests endpoint should be <= 6 queries
    with django_assert_num_queries(6):
        res_tests = client.get(f"/api/hospitals/{loc.slug}/tests/")
        assert res_tests.status_code == 200

    # 3. Hospital list endpoint should be <= 4 queries
    with django_assert_num_queries(3):
        res_list = client.get("/api/hospitals/")
        assert res_list.status_code == 200
