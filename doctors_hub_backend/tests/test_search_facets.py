import pytest
from rest_framework.test import APIClient
from rest_framework import status

from facilities.models import Location, Hospital, DiagnosticCenter
from doctors.models import Doctor, DoctorSpecialty, DoctorAffiliation, AffiliationSchedule
from tests.models import TestCategory, Test, FacilityTest

from .factories import (
    LocationFactory, DoctorFactory, DoctorSpecialtyFactory,
    DoctorAffiliationFactory, TestCategoryFactory, TestFactory,
    FacilityTestFactory
)


@pytest.fixture
def api_client():
    return APIClient()


@pytest.mark.django_db
def test_search_facets_endpoint_returns_aggregations(api_client):
    # Setup test entities
    spec_cardio = DoctorSpecialtyFactory(name="Cardiology")
    spec_neuro = DoctorSpecialtyFactory(name="Neurology")

    loc_dhaka = LocationFactory(name="Dhaka Medical", district="Dhaka", area="Dhanmondi")
    loc_ctg = LocationFactory(name="Chittagong Hospital", district="Chittagong", area="Agrabad")

    doc1 = DoctorFactory(name="Dr. Cardio Specialist")
    doc1.specialties.add(spec_cardio)
    DoctorAffiliationFactory(doctor=doc1, location=loc_dhaka)

    doc2 = DoctorFactory(name="Dr. Neuro Specialist")
    doc2.specialties.add(spec_neuro)
    DoctorAffiliationFactory(doctor=doc2, location=loc_ctg)

    # 1. Global facets (unfiltered)
    res_global = api_client.get("/api/search-facets/")
    assert res_global.status_code == status.HTTP_200_OK
    assert res_global.data["total_doctors"] >= 2
    assert "specialties" in res_global.data
    assert "districts" in res_global.data
    assert "Dhaka" in res_global.data["districts"]
    assert "Chittagong" in res_global.data["districts"]

    # 2. Location-filtered facets (location=Dhaka)
    res_filtered = api_client.get("/api/search-facets/?location=Dhaka")
    assert res_filtered.status_code == status.HTTP_200_OK
    assert res_filtered.data["total_doctors"] >= 1


@pytest.mark.django_db
def test_doctor_search_filters_by_specialty_and_location(api_client):
    spec = DoctorSpecialtyFactory(name="Orthopedics")
    loc = LocationFactory(name="Bone & Joint Hospital", district="Dhaka", area="Mirpur")
    doc = DoctorFactory(name="Dr. Bone Doctor")
    doc.specialties.add(spec)
    DoctorAffiliationFactory(doctor=doc, location=loc, fee=800)

    # Search with matching specialty
    res = api_client.get(f"/api/doctors/?specialty=Orthopedics")
    assert res.status_code == status.HTTP_200_OK
    results = res.data.get("results") if isinstance(res.data, dict) else res.data
    assert any(d["name"] == "Dr. Bone Doctor" for d in results)

    # Search with non-matching specialty
    res_empty = api_client.get(f"/api/doctors/?specialty=NonExistentSpecialty")
    assert res_empty.status_code == status.HTTP_200_OK
    results_empty = res_empty.data.get("results") if isinstance(res_empty.data, dict) else res_empty.data
    assert len(results_empty) == 0


@pytest.mark.django_db
def test_hospital_search_filters_by_location(api_client):
    loc_banani = LocationFactory(name="Banani General Hospital", district="Dhaka", area="Banani")
    hosp = Hospital.objects.create(location=loc_banani)

    res = api_client.get("/api/hospitals/?location=Dhaka&area=Banani")
    assert res.status_code == status.HTTP_200_OK
    results = res.data.get("results") if isinstance(res.data, dict) else res.data
    assert len(results) >= 1
