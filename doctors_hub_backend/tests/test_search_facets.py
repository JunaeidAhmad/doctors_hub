import pytest
from rest_framework.test import APIClient
from rest_framework import status

from facilities.models import Location, Hospital, DiagnosticCenter, Division, District, Thana
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
    div_dhaka, _ = Division.objects.get_or_create(name="Dhaka")
    dist_dhaka, _ = District.objects.get_or_create(name="Dhaka", division=div_dhaka)
    thana_dhaka, _ = Thana.objects.get_or_create(name="Dhanmondi", district=dist_dhaka)

    div_ctg, _ = Division.objects.get_or_create(name="Chattogram")
    dist_ctg, _ = District.objects.get_or_create(name="Chattogram", division=div_ctg)
    thana_ctg, _ = Thana.objects.get_or_create(name="Agrabad", district=dist_ctg)

    spec_cardio = DoctorSpecialtyFactory(name="Cardiology")
    spec_neuro = DoctorSpecialtyFactory(name="Neurology")

    loc_dhaka = LocationFactory(name="Dhaka Medical", thana=thana_dhaka)
    loc_ctg = LocationFactory(name="Chittagong Hospital", thana=thana_ctg)

    doc1 = DoctorFactory(name="Dr. Cardio Specialist")
    doc1.specialties.add(spec_cardio)
    DoctorAffiliationFactory(doctor=doc1, location=loc_dhaka)

    doc2 = DoctorFactory(name="Dr. Neuro Specialist")
    doc2.specialties.add(spec_neuro)
    DoctorAffiliationFactory(doctor=doc2, location=loc_ctg)

    # 1. Global facets (unfiltered) – slim contract: only hospital_categories
    res_global = api_client.get("/api/search-facets/")
    assert res_global.status_code == status.HTTP_200_OK
    assert "hospital_categories" in res_global.data
    assert "specialties" not in res_global.data
    assert "total_doctors" not in res_global.data

    # 2. Location-filtered facets (district_id)
    res_filtered = api_client.get(f"/api/search-facets/?district_id={dist_dhaka.id}")
    assert res_filtered.status_code == status.HTTP_200_OK
    assert "hospital_categories" in res_filtered.data


@pytest.mark.django_db
def test_doctor_search_filters_by_specialty_and_location(api_client):
    spec = DoctorSpecialtyFactory(name="Orthopedics")
    loc = LocationFactory(name="Bone & Joint Hospital")
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
    div, _ = Division.objects.get_or_create(name="Dhaka")
    dist, _ = District.objects.get_or_create(name="Dhaka", division=div)
    thana, _ = Thana.objects.get_or_create(name="Banani", district=dist)

    loc_banani = LocationFactory(name="Banani General Hospital", thana=thana)
    hosp = Hospital.objects.create(location=loc_banani)

    res = api_client.get(f"/api/hospitals/?thana_id={thana.id}")
    assert res.status_code == status.HTTP_200_OK
    results = res.data.get("results") if isinstance(res.data, dict) else res.data
    assert len(results) >= 1
