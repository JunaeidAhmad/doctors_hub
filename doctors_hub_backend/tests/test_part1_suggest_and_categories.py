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
from doctors.models import DoctorSpecialty, SpecialtyAlias, Doctor


@pytest.fixture(autouse=True)
def clear_django_cache():
    cache.clear()
    yield
    cache.clear()


@pytest.fixture
def geo_setup(db):
    division = Division.objects.create(name="Dhaka Division", bn_name="ঢাকা", slug="dhaka-div")
    district = District.objects.create(division=division, name="Dhaka District", bn_name="ঢাকা", slug="dhaka-dist")
    thana = Thana.objects.create(district=district, name="Dhanmondi", bn_name="ধানমন্ডি", slug="dhanmondi")
    return {"division": division, "district": district, "thana": thana}


@pytest.fixture
def client():
    return APIClient()


@pytest.mark.django_db
def test_suggest_anonymous_access_and_validation(client):
    res_no_q = client.get("/api/specialties/suggest/")
    assert res_no_q.status_code == 400
    assert "error" in res_no_q.data

    res_empty_q = client.get("/api/specialties/suggest/?q=   ")
    assert res_empty_q.status_code == 400

    res_long_q = client.get(f"/api/specialties/suggest/?q={'a' * 101}")
    assert res_long_q.status_code == 400

    res_valid = client.get("/api/specialties/suggest/?q=cardio")
    assert res_valid.status_code == 200
    assert isinstance(res_valid.data, list)


@pytest.mark.django_db
def test_suggest_ranking_exact_prefix_contains(client):
    spec_exact = DoctorSpecialty.objects.create(
        name="Exact Cardiology Match",
        canonical_name="Exact Cardiology Match",
        slug="exact-cardiology-match"
    )
    SpecialtyAlias.objects.create(
        specialty=spec_exact,
        name="cardio",
        normalized="cardio",
        language="en",
        is_verified=True
    )

    spec_prefix = DoctorSpecialty.objects.create(
        name="Cardiology Clinical",
        canonical_name="Cardiology Clinical",
        slug="cardiology-clinical"
    )

    spec_contains = DoctorSpecialty.objects.create(
        name="Pediatric Echocardiogram",
        canonical_name="Pediatric Echocardiogram",
        slug="pediatric-echocardiogram"
    )

    # Alias exact match (rank 0) beats prefix (rank 1), which beats contains (rank 2)
    res = client.get("/api/specialties/suggest/?q=cardio")
    assert res.status_code == 200
    items = res.data
    ids = [item["id"] for item in items]

    assert str(spec_exact.id) in ids
    assert str(spec_prefix.id) in ids
    assert str(spec_contains.id) in ids

    # Exact alias is rank 0, prefix name is rank 1, contains name is rank 2
    assert ids.index(str(spec_exact.id)) < ids.index(str(spec_prefix.id))
    assert ids.index(str(spec_prefix.id)) < ids.index(str(spec_contains.id))

    exact_item = next(it for it in items if it["id"] == str(spec_exact.id))
    assert exact_item["matched_term"] == "cardio"
    assert exact_item["match_language"] == "en"


@pytest.mark.django_db
def test_suggest_bangla_alias_match(client):
    spec = DoctorSpecialty.objects.create(
        name="Neurology",
        canonical_name="Neurology",
        bn_name="নিউরোলজি",
        slug="neurology"
    )
    SpecialtyAlias.objects.create(
        specialty=spec,
        name="মস্তিষ্ক বিশেষজ্ঞ",
        normalized="মস্তিষ্ক বিশেষজ্ঞ",
        language="bn",
        is_verified=True
    )

    res = client.get("/api/specialties/suggest/?q=মস্তিষ্ক বিশেষজ্ঞ")
    assert res.status_code == 200
    assert len(res.data) >= 1
    match = res.data[0]
    assert match["id"] == str(spec.id)
    assert match["matched_term"] == "মস্তিষ্ক বিশেষজ্ঞ"
    assert match["match_language"] == "bn"


@pytest.mark.django_db
def test_suggest_deduplication(client):
    spec = DoctorSpecialty.objects.create(
        name="Unique Test Specialty",
        canonical_name="Unique Test Specialty",
        bn_name="ইউনিক টেস্ট",
        slug="unique-test-specialty"
    )
    SpecialtyAlias.objects.create(
        specialty=spec,
        name="Unique Test Specialty",
        normalized="unique test specialty",
        language="en",
        is_verified=True
    )

    res = client.get("/api/specialties/suggest/?q=unique test specialty")
    assert res.status_code == 200
    matches = [it for it in res.data if it["id"] == str(spec.id)]
    assert len(matches) == 1


@pytest.mark.django_db
def test_category_exact_match_by_slug_and_uuid(client, geo_setup):
    thana = geo_setup["thana"]

    # 1. Hospital category test
    cat_gen = HospitalCategory.objects.create(name="General Hospital", slug="general-hospital")
    cat_spec = HospitalCategory.objects.create(name="Specialized Eye Care", slug="specialized-eye-care")

    loc1 = Location.objects.create(name="Dhaka General", thana=thana, location_type="hospital")
    Hospital.objects.create(location=loc1, category=cat_gen)

    loc2 = Location.objects.create(name="Dhaka Eye Care", thana=thana, location_type="hospital")
    Hospital.objects.create(location=loc2, category=cat_spec)

    # By slug
    res_slug = client.get("/api/hospitals/?category=general-hospital")
    assert res_slug.status_code == 200
    assert len(res_slug.data["results"]) == 1
    assert res_slug.data["results"][0]["id"] == str(loc1.id)

    # By UUID
    res_uuid = client.get(f"/api/hospitals/?category={cat_gen.id}")
    assert res_uuid.status_code == 200
    assert len(res_uuid.data["results"]) == 1
    assert res_uuid.data["results"][0]["id"] == str(loc1.id)

    # 2. Diagnostic center category test
    dcat1 = DiagnosticCenterCategory.objects.create(name="Pathology Lab", slug="pathology-lab")
    dcat2 = DiagnosticCenterCategory.objects.create(name="Imaging Center", slug="imaging-center")

    dloc1 = Location.objects.create(name="Lab One", thana=thana, location_type="diagnostic_center")
    DiagnosticCenter.objects.create(location=dloc1, category=dcat1)

    dloc2 = Location.objects.create(name="Lab Two", thana=thana, location_type="diagnostic_center")
    DiagnosticCenter.objects.create(location=dloc2, category=dcat2)

    res_diag_slug = client.get("/api/diagnostic-centers/?category=pathology-lab")
    assert res_diag_slug.status_code == 200
    assert len(res_diag_slug.data["results"]) == 1
    assert res_diag_slug.data["results"][0]["id"] == str(dloc1.id)

    res_diag_uuid = client.get(f"/api/diagnostic-centers/?category={dcat1.id}")
    assert res_diag_uuid.status_code == 200
    assert len(res_diag_uuid.data["results"]) == 1
    assert res_diag_uuid.data["results"][0]["id"] == str(dloc1.id)

    # 3. Test & FacilityTest category test
    tcat = TestCategory.objects.create(name="Radiology", slug="radiology")
    tcat_other = TestCategory.objects.create(name="Hematology", slug="hematology")

    test_rad = Test.objects.create(name="X-Ray Chest", slug="x-ray-chest", category=tcat)
    test_hema = Test.objects.create(name="CBC", slug="cbc", category=tcat_other)

    res_test_slug = client.get("/api/tests/?category=radiology")
    assert res_test_slug.status_code == 200
    assert len(res_test_slug.data["results"]) == 1
    assert res_test_slug.data["results"][0]["id"] == str(test_rad.id)

    res_test_uuid = client.get(f"/api/tests/?category={tcat.id}")
    assert res_test_uuid.status_code == 200
    assert len(res_test_uuid.data["results"]) == 1
    assert res_test_uuid.data["results"][0]["id"] == str(test_rad.id)

    ft_rad = FacilityTest.objects.create(location=dloc1, test=test_rad, price=500)
    ft_hema = FacilityTest.objects.create(location=dloc1, test=test_hema, price=300)

    res_ft_slug = client.get("/api/facility-tests/?category=radiology")
    assert res_ft_slug.status_code == 200
    assert len(res_ft_slug.data["results"]) == 1
    assert res_ft_slug.data["results"][0]["id"] == str(ft_rad.id)


@pytest.mark.django_db
def test_category_near_miss_slug_returns_zero(client, geo_setup):
    thana = geo_setup["thana"]

    # Category with slug "ct-scan"
    tcat = TestCategory.objects.create(name="CT Scan", slug="ct-scan")
    test_ct = Test.objects.create(name="Brain CT", slug="brain-ct", category=tcat)

    dloc = Location.objects.create(name="Scan Diagnostic", thana=thana, location_type="diagnostic_center")
    diag = DiagnosticCenter.objects.create(location=dloc)
    FacilityTest.objects.create(location=dloc, test=test_ct, price=3000)

    # Substring 'ct' must NOT match 'ct-scan'
    res_near_miss_test = client.get("/api/tests/?category=ct")
    assert res_near_miss_test.status_code == 200
    assert len(res_near_miss_test.data["results"]) == 0

    res_near_miss_diag = client.get("/api/diagnostic-centers/?testcat=ct")
    assert res_near_miss_diag.status_code == 200
    assert len(res_near_miss_diag.data["results"]) == 0

    # Exact slug 'ct-scan' matches
    res_exact_diag = client.get("/api/diagnostic-centers/?testcat=ct-scan")
    assert res_exact_diag.status_code == 200
    assert len(res_exact_diag.data["results"]) == 1
    assert res_exact_diag.data["results"][0]["id"] == str(dloc.id)


@pytest.mark.django_db
def test_category_comma_separated_multi_value(client, geo_setup):
    thana = geo_setup["thana"]

    cat1 = HospitalCategory.objects.create(name="Eye Hospital", slug="eye-hospital")
    cat2 = HospitalCategory.objects.create(name="Dental Clinic", slug="dental-clinic")
    cat3 = HospitalCategory.objects.create(name="Cardiology Hospital", slug="cardiology-hospital")

    loc1 = Location.objects.create(name="Eye Center", thana=thana, location_type="hospital")
    Hospital.objects.create(location=loc1, category=cat1)

    loc2 = Location.objects.create(name="Dental Care", thana=thana, location_type="hospital")
    Hospital.objects.create(location=loc2, category=cat2)

    loc3 = Location.objects.create(name="Heart Institute", thana=thana, location_type="hospital")
    Hospital.objects.create(location=loc3, category=cat3)

    # Multi-value filter
    res_multi = client.get("/api/hospitals/?category=eye-hospital,dental-clinic")
    assert res_multi.status_code == 200
    res_ids = [h["id"] for h in res_multi.data["results"]]
    assert str(loc1.id) in res_ids
    assert str(loc2.id) in res_ids
    assert str(loc3.id) not in res_ids

    # Ignoring 'all' in multi-value
    res_with_all = client.get("/api/hospitals/?category=eye-hospital,all")
    assert res_with_all.status_code == 200
    res_all_ids = [h["id"] for h in res_with_all.data["results"]]
    assert str(loc1.id) in res_all_ids
    assert str(loc2.id) not in res_all_ids
    assert str(loc3.id) not in res_all_ids

    # Single 'all' returns all
    res_only_all = client.get("/api/hospitals/?category=all")
    assert res_only_all.status_code == 200
    assert len(res_only_all.data["results"]) == 3
