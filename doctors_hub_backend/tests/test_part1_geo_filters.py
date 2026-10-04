import pytest
from rest_framework.test import APIClient
from facilities.models import Location, Hospital, DiagnosticCenter, Division, District, Thana
from doctors.models import Doctor, DoctorAffiliation, AffiliationSchedule


@pytest.fixture
def client():
    return APIClient()


@pytest.fixture
def geo_data():
    div_dhaka, _ = Division.objects.get_or_create(name="Dhaka")
    dist_dhaka, _ = District.objects.get_or_create(name="Dhaka", division=div_dhaka)
    thana_dhanmondi, _ = Thana.objects.get_or_create(name="Dhanmondi", district=dist_dhaka)
    thana_gulshan, _ = Thana.objects.get_or_create(name="Gulshan", district=dist_dhaka)

    div_sylhet, _ = Division.objects.get_or_create(name="Sylhet")
    dist_sylhet, _ = District.objects.get_or_create(name="Sylhet", division=div_sylhet)
    thana_sylhet_sadar, _ = Thana.objects.get_or_create(name="Sylhet Sadar", district=dist_sylhet)

    return {
        "div_dhaka": div_dhaka,
        "dist_dhaka": dist_dhaka,
        "thana_dhanmondi": thana_dhanmondi,
        "thana_gulshan": thana_gulshan,
        "div_sylhet": div_sylhet,
        "dist_sylhet": dist_sylhet,
        "thana_sylhet_sadar": thana_sylhet_sadar,
    }


@pytest.mark.django_db
def test_multi_join_regression_doctor_chambers(client, geo_data):
    """
    A doctor with a Dhaka chamber (Monday) and a Sylhet chamber (Tuesday).
    district_id=<Dhaka>&day=Tuesday -> 0 results.
    district_id=<Sylhet>&day=Tuesday -> 1 result.
    """
    Doctor.objects.all().delete()
    doc = Doctor.objects.create(name="Dr. Dual Chamber")

    loc_dhaka = Location.objects.create(
        name="Dhaka Hospital",
        location_type=Location.LocationType.HOSPITAL,
        thana=geo_data["thana_dhanmondi"],
        is_active=True,
    )
    aff_dhaka = DoctorAffiliation.objects.create(doctor=doc, location=loc_dhaka, fee=1000)
    AffiliationSchedule.objects.create(
        affiliation=aff_dhaka, day_of_week="Monday", start_time="10:00", end_time="14:00"
    )

    loc_sylhet = Location.objects.create(
        name="Sylhet Clinic",
        location_type=Location.LocationType.CHAMBER,
        thana=geo_data["thana_sylhet_sadar"],
        is_active=True,
    )
    aff_sylhet = DoctorAffiliation.objects.create(doctor=doc, location=loc_sylhet, fee=300)
    AffiliationSchedule.objects.create(
        affiliation=aff_sylhet, day_of_week="Tuesday", start_time="10:00", end_time="14:00"
    )

    # Dhaka + day=Tuesday -> should not match (Dhaka chamber is Monday)
    res_dhaka = client.get(f"/api/doctors/?district_id={geo_data['dist_dhaka'].id}&day=Tuesday")
    assert res_dhaka.status_code == 200
    assert len(res_dhaka.json().get("results", [])) == 0

    # Sylhet + day=Tuesday -> matches Sylhet chamber (is Tuesday)
    res_sylhet = client.get(f"/api/doctors/?district_id={geo_data['dist_sylhet'].id}&day=Tuesday")
    assert res_sylhet.status_code == 200
    assert len(res_sylhet.json().get("results", [])) == 1
    assert res_sylhet.json()["results"][0]["id"] == str(doc.id)


@pytest.mark.django_db
def test_day_and_district_match_same_chamber(client, geo_data):
    """
    day=Monday combined with district_id has to match the SAME chamber.
    """
    Doctor.objects.all().delete()
    doc = Doctor.objects.create(name="Dr. Schedule Test")

    loc_dhaka = Location.objects.create(
        name="Dhaka Chamber",
        location_type=Location.LocationType.CHAMBER,
        thana=geo_data["thana_dhanmondi"],
        is_active=True,
    )
    aff_dhaka = DoctorAffiliation.objects.create(doctor=doc, location=loc_dhaka, fee=800)
    # Dhaka chamber is only on Tuesday
    AffiliationSchedule.objects.create(
        affiliation=aff_dhaka, day_of_week="Tuesday", start_time="10:00", end_time="14:00"
    )

    loc_sylhet = Location.objects.create(
        name="Sylhet Chamber",
        location_type=Location.LocationType.CHAMBER,
        thana=geo_data["thana_sylhet_sadar"],
        is_active=True,
    )
    aff_sylhet = DoctorAffiliation.objects.create(doctor=doc, location=loc_sylhet, fee=800)
    # Sylhet chamber is on Monday
    AffiliationSchedule.objects.create(
        affiliation=aff_sylhet, day_of_week="Monday", start_time="10:00", end_time="14:00"
    )

    # Monday + Dhaka -> 0 results (he is in Sylhet on Monday, not Dhaka)
    res_dhaka_mon = client.get(f"/api/doctors/?district_id={geo_data['dist_dhaka'].id}&day=Monday")
    assert res_dhaka_mon.status_code == 200
    assert len(res_dhaka_mon.json().get("results", [])) == 0

    # Monday + Sylhet -> 1 result
    res_sylhet_mon = client.get(f"/api/doctors/?district_id={geo_data['dist_sylhet'].id}&day=Monday")
    assert res_sylhet_mon.status_code == 200
    assert len(res_sylhet_mon.json().get("results", [])) == 1

    # Tuesday + Dhaka -> 1 result
    res_dhaka_tue = client.get(f"/api/doctors/?district_id={geo_data['dist_dhaka'].id}&day=Tuesday")
    assert res_dhaka_tue.status_code == 200
    assert len(res_dhaka_tue.json().get("results", [])) == 1


@pytest.mark.django_db
def test_thana_id_on_hospitals_and_diagnostic_centers(client, geo_data):
    Hospital.objects.all().delete()
    DiagnosticCenter.objects.all().delete()

    loc_hosp = Location.objects.create(
        name="Dhanmondi Hospital",
        location_type=Location.LocationType.HOSPITAL,
        thana=geo_data["thana_dhanmondi"],
        is_active=True,
    )
    hosp = Hospital.objects.create(location=loc_hosp)

    loc_diag = Location.objects.create(
        name="Gulshan Diagnostic",
        location_type=Location.LocationType.DIAGNOSTIC_CENTER,
        thana=geo_data["thana_gulshan"],
        is_active=True,
    )
    diag = DiagnosticCenter.objects.create(location=loc_diag)

    # Hospital by thana_id
    res_hosp = client.get(f"/api/hospitals/?thana_id={geo_data['thana_dhanmondi'].id}")
    assert res_hosp.status_code == 200
    assert res_hosp.json()["count"] == 1
    hosp_res = res_hosp.json()["results"][0]
    hosp_loc_id = hosp_res.get("location_details", {}).get("id") or hosp_res.get("id")
    assert hosp_loc_id == str(loc_hosp.id)

    res_hosp_none = client.get(f"/api/hospitals/?thana_id={geo_data['thana_gulshan'].id}")
    assert res_hosp_none.status_code == 200
    assert res_hosp_none.json()["count"] == 0

    # DiagnosticCenter by thana_id
    res_diag = client.get(f"/api/diagnostic-centers/?thana_id={geo_data['thana_gulshan'].id}")
    assert res_diag.status_code == 200
    assert res_diag.json()["count"] == 1
    diag_res = res_diag.json()["results"][0]
    diag_loc_id = diag_res.get("location_details", {}).get("id") or diag_res.get("id")
    assert diag_loc_id == str(loc_diag.id)


@pytest.mark.django_db
def test_facets_bad_division_id_returns_400(client):
    res = client.get("/api/search-facets/?division_id=abc")
    assert res.status_code == 400


@pytest.mark.django_db
def test_name_params_are_ignored(client, geo_data):
    """
    Name params such as district=Dhaka are ignored by django-filter and return unfiltered results.
    """
    res_unfiltered = client.get("/api/hospitals/")
    assert res_unfiltered.status_code == 200
    total = res_unfiltered.json()["count"]

    res_name = client.get("/api/hospitals/?district=Dhaka")
    assert res_name.status_code == 200
    assert res_name.json()["count"] == total


@pytest.mark.django_db
def test_facets_with_district_id(client, geo_data):
    res = client.get(f"/api/search-facets/?district_id={geo_data['dist_dhaka'].id}")
    assert res.status_code == 200
    data = res.json()
    # Slim facets contract (P2.9.2): only hospital_categories
    assert "hospital_categories" in data
    assert "districts" not in data
    assert "divisions" not in data
