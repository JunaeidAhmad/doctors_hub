import pytest
from rest_framework.test import APIClient
from rest_framework import status

from accounts.models import User, Role, UserRole
from facilities.models import Location
from doctors.models import Doctor, DoctorAffiliation, AffiliationSchedule
from tests.models import TestCategory, Test, FacilityTest
from bookings.models import DoctorBooking, LabBooking

from .factories import (
    UserFactory, LocationFactory,
    DoctorFactory, DoctorAffiliationFactory, AffiliationScheduleFactory,
    TestCategoryFactory, TestFactory, FacilityTestFactory
)


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def super_admin_user():
    user = UserFactory.create_super_admin(phone_number="01700000001")
    user.set_password("AdminPass123!")
    user.save()
    return user


@pytest.fixture
def facility_admin_user():
    user = UserFactory.create_facility_admin(phone_number="01700000002")
    user.set_password("FacPass123!")
    user.save()
    return user


@pytest.fixture
def doctor_user():
    user = UserFactory.create_doctor_user(phone_number="01700000003")
    user.set_password("DocPass123!")
    user.save()
    return user


@pytest.fixture
def managed_location(facility_admin_user):
    loc = LocationFactory(name="Admin's Managed Hospital")
    role, _ = Role.objects.get_or_create(name="Facility Admin", defaults={"scope_type": Role.ScopeType.FACILITY, "is_system": True})
    UserRole.objects.filter(user=facility_admin_user).update(facility=loc)
    return loc


@pytest.fixture
def other_location():
    return LocationFactory(name="Another Hospital Unmanaged")


@pytest.fixture
def doctor_profile(doctor_user):
    doc = DoctorFactory(name="Dr. Assigned Doctor", user=doctor_user)
    return doc


@pytest.fixture
def other_doctor_profile():
    other_user = UserFactory.create_doctor_user(phone_number="01700000009")
    return DoctorFactory(name="Dr. Unaffiliated Doctor", user=other_user)


# =========================================================================
# 1. ANONYMOUS USERS (Public Catalog Reads & Public Booking Creation)
# =========================================================================

@pytest.mark.django_db
def test_anonymous_can_read_public_catalog(api_client, managed_location, doctor_profile):
    # Public catalog endpoints must be readable without authentication
    assert api_client.get("/api/locations/").status_code == status.HTTP_200_OK
    assert api_client.get("/api/hospitals/").status_code == status.HTTP_200_OK
    assert api_client.get("/api/doctors/").status_code == status.HTTP_200_OK
    assert api_client.get("/api/tests/").status_code == status.HTTP_200_OK
    assert api_client.get("/api/facility-tests/").status_code == status.HTTP_200_OK


@pytest.mark.django_db
def test_anonymous_cannot_write_catalog(api_client, managed_location):
    # Anonymous POST/PUT/DELETE to catalog must be denied (401)
    res = api_client.post("/api/locations/", {
        "name": "Hacker Location",
        "location_type": "hospital",
        "address_line": "Dark Alley",
        "district": "Dhaka",
        "division": "Dhaka"
    })
    assert res.status_code == status.HTTP_401_UNAUTHORIZED

    test_cat = TestCategoryFactory()
    res = api_client.post("/api/tests/", {"name": "Fake Test", "category": str(test_cat.id)})
    assert res.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
def test_anonymous_can_create_booking_publicly(api_client, managed_location, doctor_profile):
    # Public creation of doctor and lab bookings without an account
    affiliation = DoctorAffiliationFactory(doctor=doctor_profile, location=managed_location)
    # Tuesday schedule for 2026-09-01
    AffiliationScheduleFactory(affiliation=affiliation, day_of_week="Tuesday", start_time="09:00:00", end_time="17:00:00")
    test_obj = TestFactory()
    fac_test = FacilityTestFactory(location=managed_location, test=test_obj)

    # Doctor booking
    doc_res = api_client.post("/api/bookings/doctor/", {
        "affiliation": str(affiliation.id),
        "patient_name": "Rahim Ahmed",
        "patient_phone": "01711999888",
        "appointment_date": "2026-09-01",
        "appointment_time": "10:00:00"
    })
    assert doc_res.status_code == status.HTTP_201_CREATED
    assert doc_res.data["patient_name"] == "Rahim Ahmed"

    # Lab booking
    lab_res = api_client.post("/api/bookings/lab/", {
        "facility_test": str(fac_test.id),
        "patient_name": "Karim Mia",
        "patient_phone": "01811999777",
        "booking_date": "2026-09-02",
        "booking_time": "11:00:00"
    })
    assert lab_res.status_code == status.HTTP_201_CREATED
    assert lab_res.data["patient_name"] == "Karim Mia"


@pytest.mark.django_db
def test_anonymous_cannot_enumerate_bookings(api_client):
    # Anonymous users cannot view bookings list
    res_doc = api_client.get("/api/bookings/doctor/")
    assert res_doc.status_code in (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN)

    res_lab = api_client.get("/api/bookings/lab/")
    assert res_lab.status_code in (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN)



# =========================================================================
# 2. FACILITY ADMIN ROLE SCOPING
# =========================================================================

@pytest.mark.django_db
def test_facility_admin_can_manage_own_location_tests(api_client, facility_admin_user, managed_location):
    api_client.force_authenticate(user=facility_admin_user)
    test_obj = TestFactory(name="Blood Sugar Fasting")

    # 1. Create facility test for managed location -> 201 Created
    create_res = api_client.post("/api/facility-tests/", {
        "location": str(managed_location.id),
        "test": str(test_obj.id),
        "price": "350.00",
        "is_available": True
    })
    assert create_res.status_code == status.HTTP_201_CREATED
    fac_test_id = create_res.data["id"]

    # 2. Update own facility test price -> 200 OK
    update_res = api_client.patch(f"/api/facility-tests/{fac_test_id}/", {
        "price": "400.00"
    })
    assert update_res.status_code == status.HTTP_200_OK
    assert float(update_res.data["price"]) == 400.00


@pytest.mark.django_db
def test_facility_admin_cannot_manage_other_location_tests(api_client, facility_admin_user, other_location):
    api_client.force_authenticate(user=facility_admin_user)
    test_obj = TestFactory(name="Lipid Profile")

    # 1. Create test on unmanaged location -> 403 Forbidden
    create_res = api_client.post("/api/facility-tests/", {
        "location": str(other_location.id),
        "test": str(test_obj.id),
        "price": "1200.00"
    })
    assert create_res.status_code == status.HTTP_403_FORBIDDEN

    # 2. Update existing test on unmanaged location -> 403 Forbidden
    existing_other_test = FacilityTestFactory(location=other_location, test=test_obj, price=1000.00)
    update_res = api_client.patch(f"/api/facility-tests/{existing_other_test.id}/", {
        "price": "1500.00"
    })
    assert update_res.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
def test_facility_admin_cannot_edit_global_taxonomy(api_client, facility_admin_user):
    api_client.force_authenticate(user=facility_admin_user)
    # Global test categories and specialties are platform-owned
    res1 = api_client.post("/api/test-categories/", {"name": "New Global Cat"})
    assert res1.status_code == status.HTTP_403_FORBIDDEN

    res2 = api_client.post("/api/specialties/", {"name": "New Specialty"})
    assert res2.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
def test_facility_admin_sees_only_own_location_bookings(api_client, facility_admin_user, managed_location, other_location):
    api_client.force_authenticate(user=facility_admin_user)

    aff_managed = DoctorAffiliationFactory(location=managed_location)
    aff_other = DoctorAffiliationFactory(location=other_location)

    # 2026-09-01 is a Tuesday
    AffiliationScheduleFactory(affiliation=aff_managed, day_of_week="Tuesday", start_time="08:00:00", end_time="18:00:00")
    AffiliationScheduleFactory(affiliation=aff_other, day_of_week="Tuesday", start_time="08:00:00", end_time="18:00:00")

    b_managed = DoctorBooking.objects.create(
        affiliation=aff_managed, patient_name="Managed Patient", patient_phone="01711111111",
        date="2026-09-01", slot="10:00"
    )
    b_other = DoctorBooking.objects.create(
        affiliation=aff_other, patient_name="Other Patient", patient_phone="01722222222",
        date="2026-09-01", slot="10:00"
    )

    res = api_client.get("/api/bookings/doctor/")
    assert res.status_code == status.HTTP_200_OK
    booking_ids = [b["id"] for b in (res.data.get("results") if isinstance(res.data, dict) else res.data)]
    assert str(b_managed.id) in booking_ids
    assert str(b_other.id) not in booking_ids


# =========================================================================
# 3. DOCTOR ROLE SCOPING
# =========================================================================

@pytest.mark.django_db
def test_doctor_can_edit_own_profile(api_client, doctor_user, doctor_profile):
    api_client.force_authenticate(user=doctor_user)

    res = api_client.patch(f"/api/doctors/{doctor_profile.id}/", {
        "qualification": "MBBS, MD (Cardiology), FCPS"
    })
    assert res.status_code == status.HTTP_200_OK
    assert res.data["qualification"] == "MBBS, MD (Cardiology), FCPS"


@pytest.mark.django_db
def test_doctor_cannot_edit_other_doctor_profile(api_client, doctor_user, other_doctor_profile):
    api_client.force_authenticate(user=doctor_user)

    res = api_client.patch(f"/api/doctors/{other_doctor_profile.id}/", {
        "qualification": "Hacked Qualification"
    })
    assert res.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
def test_doctor_can_manage_own_affiliation_schedules(api_client, doctor_user, doctor_profile, managed_location):
    api_client.force_authenticate(user=doctor_user)

    aff = DoctorAffiliationFactory(doctor=doctor_profile, location=managed_location)
    schedule = AffiliationScheduleFactory(affiliation=aff, day_of_week="Monday")

    # Doctor updates own schedule -> 200 OK
    res = api_client.patch(f"/api/schedules/{schedule.id}/", {
        "start_time": "14:00:00",
        "end_time": "18:00:00"
    })
    assert res.status_code == status.HTTP_200_OK
    assert res.data["start_time"] == "14:00:00"


@pytest.mark.django_db
def test_doctor_cannot_edit_other_doctor_schedules(api_client, doctor_user, other_doctor_profile, managed_location):
    api_client.force_authenticate(user=doctor_user)

    aff_other = DoctorAffiliationFactory(doctor=other_doctor_profile, location=managed_location)
    schedule_other = AffiliationScheduleFactory(affiliation=aff_other, day_of_week="Tuesday")

    res = api_client.patch(f"/api/schedules/{schedule_other.id}/", {
        "start_time": "15:00:00"
    })
    assert res.status_code == status.HTTP_403_FORBIDDEN



# =========================================================================
# 4. SUPER ADMIN ROLE UNRESTRICTED ACCESS
# =========================================================================

@pytest.mark.django_db
def test_super_admin_has_full_access(api_client, super_admin_user, other_location, doctor_profile):
    api_client.force_authenticate(user=super_admin_user)

    # Super admin can create global taxonomy
    cat_res = api_client.post("/api/test-categories/", {"name": "Genomics"})
    assert cat_res.status_code == status.HTTP_201_CREATED

    # Super admin can create test at any location
    test_obj = TestFactory()
    fac_res = api_client.post("/api/facility-tests/", {
        "location": str(other_location.id),
        "test": str(test_obj.id),
        "price": "999.00"
    })
    assert fac_res.status_code == status.HTTP_201_CREATED

    # Super admin can access /api/admin/dashboard-init/
    dash_res = api_client.get("/api/admin/dashboard-init/")
    assert dash_res.status_code == status.HTTP_200_OK


# =========================================================================
# 5. SECURITY & REGRESSION TESTS
# =========================================================================

@pytest.mark.django_db
def test_login_demo_bypass_removed(api_client):
    # Ensure invalid password for any account is strictly 400 Bad Request
    user = UserFactory(phone_number="01700000000")
    user.set_password("RealSecretPassword123!")
    user.save()

    res = api_client.post("/api/auth/login/", {
        "phone_number": "01700000000",
        "password": "WrongPasswordAttempt"
    })
    assert res.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
def test_auth_me_returns_role_and_scope(api_client, facility_admin_user, managed_location, doctor_user, doctor_profile):
    # Facility Admin /auth/me/
    api_client.force_authenticate(user=facility_admin_user)
    res_fac = api_client.get("/api/auth/me/")
    assert res_fac.status_code == status.HTTP_200_OK
    assert res_fac.data["role"] == "facility_admin"
    assert len(res_fac.data["managed_locations"]) == 1
    assert res_fac.data["managed_locations"][0]["id"] == str(managed_location.id)

    # Doctor /auth/me/
    api_client.force_authenticate(user=doctor_user)
    res_doc = api_client.get("/api/auth/me/")
    assert res_doc.status_code == status.HTTP_200_OK
    assert res_doc.data["role"] == "doctor"
    assert res_doc.data["doctor_id"] == str(doctor_profile.id)


@pytest.mark.django_db
def test_user_role_assignment_and_search(api_client, super_admin_user, managed_location):
    api_client.force_authenticate(user=super_admin_user)

    target_user = UserFactory(phone_number="01712345678", first_name="Rahim", last_name="Khan")
    role, _ = Role.objects.get_or_create(
        name="Custom Manager",
        defaults={"scope_type": Role.ScopeType.FACILITY, "is_system": False}
    )

    # 1. Search user
    search_res = api_client.get("/api/user-roles/search-users/?q=0171234")
    assert search_res.status_code == status.HTTP_200_OK
    results = search_res.data
    assert any(u["phone_number"] == "01712345678" for u in results)

    # 2. Assign role by phone number and facility
    assign_res = api_client.post("/api/user-roles/", {
        "phone_number": "01712345678",
        "role": str(role.id),
        "facility": str(managed_location.id)
    }, format="json")
    assert assign_res.status_code == status.HTTP_201_CREATED
    assignment_id = assign_res.data["id"]
    assert assign_res.data["user_details"]["phone_number"] == "01712345678"
    assert assign_res.data["role_details"]["name"] == "Custom Manager"
    assert assign_res.data["facility_details"]["name"] == managed_location.name

    # 3. Search user roles
    list_res = api_client.get("/api/user-roles/?search=Rahim")
    assert list_res.status_code == status.HTTP_200_OK
    assert any(a["id"] == assignment_id for a in list_res.data)

    # 4. Revoke assignment
    del_res = api_client.delete(f"/api/user-roles/{assignment_id}/")
    assert del_res.status_code == status.HTTP_204_NO_CONTENT
    assert not UserRole.objects.filter(id=assignment_id).exists()
