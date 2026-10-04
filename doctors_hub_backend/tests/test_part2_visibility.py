import pytest
from rest_framework.test import APIClient
from rest_framework import status
from django.utils.text import slugify

from accounts.models import User, Role, UserRole
from facilities.models import Location, Hospital, DiagnosticCenter, Division, District, Thana
from tests.models import TestCategory, Test, FacilityTest
from doctors.models import Doctor, DoctorSpecialty, DoctorAffiliation
from tests.factories import UserFactory, LocationFactory


@pytest.fixture
def geo_thana(db):
    div, _ = Division.objects.get_or_create(name="Dhaka", defaults={"slug": "dhaka-div-vis"})
    dist, _ = District.objects.get_or_create(division=div, name="Dhaka Dist", defaults={"slug": "dhaka-dist-vis"})
    thana, _ = Thana.objects.get_or_create(district=dist, name="Dhanmondi Vis", defaults={"slug": "dhanmondi-vis"})
    return thana


@pytest.fixture
def superadmin_user(db):
    return UserFactory.create_super_admin(phone_number="01799990001")


@pytest.fixture
def facility_admin_a(db, geo_thana):
    loc_a = Location.objects.create(name="Hospital Alpha", location_type=Location.LocationType.HOSPITAL, thana=geo_thana, is_active=False)
    user = UserFactory.create_facility_admin(location=loc_a, phone_number="01799990002")
    return user, loc_a


@pytest.mark.django_db
def test_hospital_visibility(geo_thana, superadmin_user, facility_admin_a):
    user_a, loc_a = facility_admin_a
    hosp_a = Hospital.objects.create(location=loc_a)

    loc_b = Location.objects.create(name="Hospital Beta", location_type=Location.LocationType.HOSPITAL, thana=geo_thana, is_active=False)
    hosp_b = Hospital.objects.create(location=loc_b)

    loc_active = Location.objects.create(name="Hospital Active", location_type=Location.LocationType.HOSPITAL, thana=geo_thana, is_active=True)
    hosp_active = Hospital.objects.create(location=loc_active)

    client = APIClient()

    # Anonymous user: sees only active hospital, 404 on inactive
    res = client.get("/api/hospitals/")
    assert res.status_code == 200
    names = [h["name"] for h in res.data["results"]]
    assert "Hospital Active" in names
    assert "Hospital Alpha" not in names
    assert "Hospital Beta" not in names

    assert client.get(f"/api/hospitals/{hosp_a.pk}/").status_code == 404
    assert client.get(f"/api/hospitals/{hosp_active.pk}/").status_code == 200

    # Super admin: sees all hospitals, including inactive
    client.force_authenticate(user=superadmin_user)
    res = client.get("/api/hospitals/")
    names = [h["name"] for h in res.data["results"]]
    assert "Hospital Alpha" in names
    assert "Hospital Beta" in names
    assert "Hospital Active" in names
    assert client.get(f"/api/hospitals/{hosp_a.pk}/").status_code == 200
    assert client.get(f"/api/hospitals/{hosp_b.pk}/").status_code == 200

    # Facility Admin A: sees active + their own inactive hospital A; 404 on hospital B
    client.force_authenticate(user=user_a)
    res = client.get("/api/hospitals/")
    names = [h["name"] for h in res.data["results"]]
    assert "Hospital Active" in names
    assert "Hospital Alpha" in names
    assert "Hospital Beta" not in names
    assert client.get(f"/api/hospitals/{hosp_a.pk}/").status_code == 200
    assert client.get(f"/api/hospitals/{hosp_b.pk}/").status_code == 404


@pytest.mark.django_db
def test_diagnostic_center_visibility(geo_thana, superadmin_user, facility_admin_a):
    user_a, loc_a = facility_admin_a
    diag_a = DiagnosticCenter.objects.create(location=loc_a)

    loc_b = Location.objects.create(name="Diag Center Beta", location_type=Location.LocationType.DIAGNOSTIC_CENTER, thana=geo_thana, is_active=False)
    diag_b = DiagnosticCenter.objects.create(location=loc_b)

    loc_active = Location.objects.create(name="Diag Center Active", location_type=Location.LocationType.DIAGNOSTIC_CENTER, thana=geo_thana, is_active=True)
    diag_active = DiagnosticCenter.objects.create(location=loc_active)

    client = APIClient()

    # Anonymous user: sees only active, 404 on inactive
    res = client.get("/api/diagnostic-centers/")
    names = [d["name"] for d in res.data["results"]]
    assert "Diag Center Active" in names
    assert "Hospital Alpha" not in names
    assert "Diag Center Beta" not in names
    assert client.get(f"/api/diagnostic-centers/{diag_a.pk}/").status_code == 404

    # Super admin: sees all
    client.force_authenticate(user=superadmin_user)
    assert client.get(f"/api/diagnostic-centers/{diag_a.pk}/").status_code == 200
    assert client.get(f"/api/diagnostic-centers/{diag_b.pk}/").status_code == 200

    # Facility Admin A: sees active + diag_a; 404 on diag_b
    client.force_authenticate(user=user_a)
    assert client.get(f"/api/diagnostic-centers/{diag_a.pk}/").status_code == 200
    assert client.get(f"/api/diagnostic-centers/{diag_b.pk}/").status_code == 404


@pytest.mark.django_db
def test_location_visibility(geo_thana, superadmin_user, facility_admin_a):
    user_a, loc_a = facility_admin_a
    loc_b = Location.objects.create(name="Loc Beta", location_type=Location.LocationType.HOSPITAL, thana=geo_thana, is_active=False)
    loc_active = Location.objects.create(name="Loc Active", location_type=Location.LocationType.HOSPITAL, thana=geo_thana, is_active=True)

    client = APIClient()

    # Anonymous user:
    res = client.get("/api/locations/")
    names = [loc["name"] for loc in res.data.get("results", res.data)]
    assert "Loc Active" in names
    assert "Hospital Alpha" not in names
    assert "Loc Beta" not in names
    assert client.get(f"/api/locations/{loc_a.id}/").status_code == 404

    # Super admin:
    client.force_authenticate(user=superadmin_user)
    assert client.get(f"/api/locations/{loc_a.id}/").status_code == 200
    assert client.get(f"/api/locations/{loc_b.id}/").status_code == 200

    # Facility admin:
    client.force_authenticate(user=user_a)
    assert client.get(f"/api/locations/{loc_a.id}/").status_code == 200
    assert client.get(f"/api/locations/{loc_b.id}/").status_code == 404


@pytest.mark.django_db
def test_test_and_category_visibility(superadmin_user, facility_admin_a):
    user_a, _ = facility_admin_a
    cat_active = TestCategory.objects.create(name="Biochemistry Active", is_active=True)
    cat_inactive = TestCategory.objects.create(name="Immunology Inactive", is_active=False)

    test_active = Test.objects.create(category=cat_active, name="Blood Sugar Active", is_active=True)
    test_inactive_self = Test.objects.create(category=cat_active, name="Lipid Profile Inactive", is_active=False)
    test_inactive_cat = Test.objects.create(category=cat_inactive, name="Thyroid Active In Inactive Cat", is_active=True)

    client = APIClient()

    # Anonymous user:
    res = client.get("/api/test-categories/")
    cat_names = [c["name"] for c in res.data["results"]]
    assert "Biochemistry Active" in cat_names
    assert "Immunology Inactive" not in cat_names
    assert client.get(f"/api/test-categories/{cat_inactive.id}/").status_code == 404

    res = client.get("/api/tests/")
    t_names = [t["name"] for t in res.data["results"]]
    assert "Blood Sugar Active" in t_names
    assert "Lipid Profile Inactive" not in t_names
    assert "Thyroid Active In Inactive Cat" not in t_names
    assert client.get(f"/api/tests/{test_inactive_self.id}/").status_code == 404
    assert client.get(f"/api/tests/{test_inactive_cat.id}/").status_code == 404

    # Super admin:
    client.force_authenticate(user=superadmin_user)
    assert client.get(f"/api/test-categories/{cat_inactive.id}/").status_code == 200
    assert client.get(f"/api/tests/{test_inactive_self.id}/").status_code == 200
    assert client.get(f"/api/tests/{test_inactive_cat.id}/").status_code == 200

    # Facility admin: global tests/categories are not in facility scope, so inactive are 404
    client.force_authenticate(user=user_a)
    assert client.get(f"/api/test-categories/{cat_inactive.id}/").status_code == 404
    assert client.get(f"/api/tests/{test_inactive_self.id}/").status_code == 404


@pytest.mark.django_db
def test_facility_test_visibility(geo_thana, superadmin_user, facility_admin_a):
    user_a, loc_a = facility_admin_a
    cat = TestCategory.objects.create(name="Hematology", is_active=True)
    t = Test.objects.create(category=cat, name="CBC", is_active=True)

    loc_b = Location.objects.create(name="Loc Beta Test", location_type=Location.LocationType.HOSPITAL, thana=geo_thana, is_active=False)

    ft_a = FacilityTest.objects.create(location=loc_a, test=t, price=500.0, is_available=True)
    ft_b = FacilityTest.objects.create(location=loc_b, test=t, price=500.0, is_available=True)

    loc_act = Location.objects.create(name="Loc Act Test", location_type=Location.LocationType.HOSPITAL, thana=geo_thana, is_active=True)
    ft_act = FacilityTest.objects.create(location=loc_act, test=t, price=500.0, is_available=True)

    client = APIClient()

    # Anonymous:
    res = client.get("/api/facility-tests/")
    ids = [item["id"] for item in res.data["results"]]
    assert str(ft_act.id) in ids
    assert str(ft_a.id) not in ids
    assert str(ft_b.id) not in ids
    assert client.get(f"/api/facility-tests/{ft_a.id}/").status_code == 404

    # Super admin:
    client.force_authenticate(user=superadmin_user)
    assert client.get(f"/api/facility-tests/{ft_a.id}/").status_code == 200
    assert client.get(f"/api/facility-tests/{ft_b.id}/").status_code == 200

    # Facility Admin A: sees ft_a (their scope), but not ft_b
    client.force_authenticate(user=user_a)
    assert client.get(f"/api/facility-tests/{ft_a.id}/").status_code == 200
    assert client.get(f"/api/facility-tests/{ft_b.id}/").status_code == 404


@pytest.mark.django_db
def test_doctor_affiliations_and_chambers_visibility(geo_thana, superadmin_user, facility_admin_a):
    user_a, loc_a = facility_admin_a # inactive
    loc_active = Location.objects.create(name="Chamber Active", location_type=Location.LocationType.HOSPITAL, thana=geo_thana, is_active=True)

    doc = Doctor.objects.create(name="Dr. Dual Chamber")
    aff_inactive = DoctorAffiliation.objects.create(doctor=doc, location=loc_a, fee=1000)
    aff_active = DoctorAffiliation.objects.create(doctor=doc, location=loc_active, fee=1200)

    client = APIClient()

    # 1. DoctorAffiliationViewSet visibility:
    # Anonymous:
    res = client.get("/api/affiliations/")
    aff_ids = [a["id"] for a in res.data["results"]]
    assert str(aff_active.id) in aff_ids
    assert str(aff_inactive.id) not in aff_ids
    assert client.get(f"/api/affiliations/{aff_inactive.id}/").status_code == 404

    # Super admin:
    client.force_authenticate(user=superadmin_user)
    assert client.get(f"/api/affiliations/{aff_inactive.id}/").status_code == 200

    # Facility admin A: sees aff_inactive at loc_a
    client.force_authenticate(user=user_a)
    assert client.get(f"/api/affiliations/{aff_inactive.id}/").status_code == 200

    # 2. DoctorViewSet nested prefetch:
    # A doctor with one chamber at an inactive location shows only the active chamber publicly.
    client.logout()
    res = client.get(f"/api/doctors/{doc.id}/")
    assert res.status_code == 200
    public_chambers = res.data["affiliations"]
    assert len(public_chambers) == 1
    assert public_chambers[0]["id"] == str(aff_active.id)
