import pytest
from rest_framework.test import APIClient
from rest_framework import status

from accounts.models import User, Role, UserRole, Permission
from facilities.models import (
    Location, Hospital, DiagnosticCenter, HospitalCategory,
    DiagnosticCenterCategory, HospitalService, DiagnosticService
)
from doctors.models import (
    Doctor, DoctorSpecialty, SpecialtyAlias, DoctorAffiliation, AffiliationSchedule
)
from tests.models import TestCategory, Test, FacilityTest
from bookings.models import DoctorBooking, Patient

from .factories import (
    UserFactory, LocationFactory,
    DoctorFactory, DoctorAffiliationFactory, AffiliationScheduleFactory,
    TestCategoryFactory, TestFactory, FacilityTestFactory, RoleFactory
)


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def super_admin_user():
    user = UserFactory.create_super_admin(phone_number="01719999001")
    user.set_password("AdminPass123!")
    user.save()
    return user


@pytest.fixture
def facility_admin_user():
    user = UserFactory.create_facility_admin(phone_number="01719999002")
    user.set_password("FacPass123!")
    user.save()
    return user


@pytest.fixture
def doctor_user():
    user = UserFactory.create_doctor_user(phone_number="01719999003")
    user.set_password("DocPass123!")
    user.save()
    return user


@pytest.fixture
def regular_user():
    user = UserFactory(phone_number="01719999004", is_staff=False, is_superuser=False)
    user.set_password("UserPass123!")
    user.save()
    return user


# =========================================================================
# 1. DOCTOR DELETE
# =========================================================================

@pytest.mark.django_db
def test_delete_doctor_by_anonymous(api_client):
    doc = DoctorFactory()
    res = api_client.delete(f"/api/doctors/{doc.id}/")
    assert res.status_code == status.HTTP_401_UNAUTHORIZED
    assert Doctor.objects.filter(id=doc.id).exists()


@pytest.mark.django_db
def test_delete_doctor_by_regular_user(api_client, regular_user):
    api_client.force_authenticate(user=regular_user)
    doc = DoctorFactory()
    res = api_client.delete(f"/api/doctors/{doc.id}/")
    assert res.status_code == status.HTTP_403_FORBIDDEN
    assert Doctor.objects.filter(id=doc.id).exists()


@pytest.mark.django_db
def test_delete_doctor_by_super_admin(api_client, super_admin_user):
    api_client.force_authenticate(user=super_admin_user)
    doc = DoctorFactory()
    res = api_client.delete(f"/api/doctors/{doc.id}/")
    assert res.status_code in [status.HTTP_204_NO_CONTENT, status.HTTP_200_OK]
    assert not Doctor.objects.filter(id=doc.id).exists()


@pytest.mark.django_db
def test_delete_doctor_cascades_affiliations_and_bookings(api_client, super_admin_user):
    api_client.force_authenticate(user=super_admin_user)
    doc = DoctorFactory()
    loc = LocationFactory()
    aff = DoctorAffiliation.objects.create(doctor=doc, location=loc, fee=500)
    sched = AffiliationSchedule.objects.create(
        affiliation=aff, day_of_week="Monday", start_time="09:00:00", end_time="12:00:00"
    )
    patient = Patient.objects.create(name="Test Patient", phone="01711112222")
    booking = DoctorBooking.objects.create(
        affiliation=aff, date="2026-09-28", slot="09:00", patient=patient, serial_number=1
    )

    res = api_client.delete(f"/api/doctors/{doc.id}/")
    assert res.status_code in [status.HTTP_204_NO_CONTENT, status.HTTP_200_OK]
    assert not Doctor.objects.filter(id=doc.id).exists()
    assert not DoctorAffiliation.objects.filter(id=aff.id).exists()
    assert not AffiliationSchedule.objects.filter(id=sched.id).exists()
    assert not DoctorBooking.objects.filter(id=booking.id).exists()


# =========================================================================
# 2. DOCTOR AFFILIATION & SCHEDULE DELETE
# =========================================================================

@pytest.mark.django_db
def test_delete_doctor_affiliation(api_client, super_admin_user):
    api_client.force_authenticate(user=super_admin_user)
    aff = DoctorAffiliationFactory()
    res = api_client.delete(f"/api/affiliations/{aff.id}/")
    assert res.status_code in [status.HTTP_204_NO_CONTENT, status.HTTP_200_OK]
    assert not DoctorAffiliation.objects.filter(id=aff.id).exists()


@pytest.mark.django_db
def test_delete_affiliation_schedule(api_client, super_admin_user):
    api_client.force_authenticate(user=super_admin_user)
    sched = AffiliationScheduleFactory()
    res = api_client.delete(f"/api/schedules/{sched.id}/")
    assert res.status_code in [status.HTTP_204_NO_CONTENT, status.HTTP_200_OK]
    assert not AffiliationSchedule.objects.filter(id=sched.id).exists()


# =========================================================================
# 3. HOSPITAL & DIAGNOSTIC CENTER DELETE
# =========================================================================

@pytest.mark.django_db
def test_delete_hospital(api_client, super_admin_user):
    api_client.force_authenticate(user=super_admin_user)
    loc = LocationFactory(location_type=Location.LocationType.HOSPITAL)
    hosp = Hospital.objects.create(location=loc)
    res = api_client.delete(f"/api/hospitals/{loc.id}/")
    assert res.status_code in [status.HTTP_204_NO_CONTENT, status.HTTP_200_OK]
    assert not Hospital.objects.filter(location=loc).exists()


@pytest.mark.django_db
def test_delete_diagnostic_center(api_client, super_admin_user):
    api_client.force_authenticate(user=super_admin_user)
    loc = LocationFactory(location_type=Location.LocationType.DIAGNOSTIC_CENTER)
    dc = DiagnosticCenter.objects.create(location=loc)
    res = api_client.delete(f"/api/diagnostic-centers/{loc.id}/")
    assert res.status_code in [status.HTTP_204_NO_CONTENT, status.HTTP_200_OK]
    assert not DiagnosticCenter.objects.filter(location=loc).exists()


# =========================================================================
# 4. TESTS & FACILITY TESTS DELETE
# =========================================================================

@pytest.mark.django_db
def test_delete_test_category(api_client, super_admin_user):
    api_client.force_authenticate(user=super_admin_user)
    cat = TestCategoryFactory()
    res = api_client.delete(f"/api/test-categories/{cat.id}/")
    assert res.status_code in [status.HTTP_204_NO_CONTENT, status.HTTP_200_OK]
    assert not TestCategory.objects.filter(id=cat.id).exists()


@pytest.mark.django_db
def test_delete_base_test(api_client, super_admin_user):
    api_client.force_authenticate(user=super_admin_user)
    t = TestFactory()
    res = api_client.delete(f"/api/tests/{t.id}/")
    assert res.status_code in [status.HTTP_204_NO_CONTENT, status.HTTP_200_OK]
    assert not Test.objects.filter(id=t.id).exists()


@pytest.mark.django_db
def test_delete_facility_test(api_client, super_admin_user):
    api_client.force_authenticate(user=super_admin_user)
    ft = FacilityTestFactory()
    res = api_client.delete(f"/api/facility-tests/{ft.id}/")
    assert res.status_code in [status.HTTP_204_NO_CONTENT, status.HTTP_200_OK]
    assert not FacilityTest.objects.filter(id=ft.id).exists()


# =========================================================================
# 5. SPECIALTIES & ALIASES DELETE
# =========================================================================

@pytest.mark.django_db
def test_delete_specialty(api_client, super_admin_user):
    api_client.force_authenticate(user=super_admin_user)
    spec = DoctorSpecialty.objects.create(name="Cardiology Spec Test")
    res = api_client.delete(f"/api/specialties/{spec.id}/")
    assert res.status_code in [status.HTTP_204_NO_CONTENT, status.HTTP_200_OK]
    assert not DoctorSpecialty.objects.filter(id=spec.id).exists()


@pytest.mark.django_db
def test_delete_specialty_alias(api_client, super_admin_user):
    api_client.force_authenticate(user=super_admin_user)
    spec = DoctorSpecialty.objects.create(name="Neurology Spec Test")
    alias = SpecialtyAlias.objects.create(specialty=spec, name="Neuro Alias")
    res = api_client.delete(f"/api/specialty-aliases/{alias.id}/")
    assert res.status_code in [status.HTTP_204_NO_CONTENT, status.HTTP_200_OK]
    assert not SpecialtyAlias.objects.filter(id=alias.id).exists()


# =========================================================================
# 6. CATEGORIES & SERVICES DELETE
# =========================================================================

@pytest.mark.django_db
def test_delete_hospital_category(api_client, super_admin_user):
    api_client.force_authenticate(user=super_admin_user)
    hc = HospitalCategory.objects.create(name="General Hosp Cat")
    res = api_client.delete(f"/api/hospital-categories/{hc.id}/")
    assert res.status_code in [status.HTTP_204_NO_CONTENT, status.HTTP_200_OK]
    assert not HospitalCategory.objects.filter(id=hc.id).exists()


@pytest.mark.django_db
def test_delete_diagnostic_category(api_client, super_admin_user):
    api_client.force_authenticate(user=super_admin_user)
    dc_cat = DiagnosticCenterCategory.objects.create(name="Radiology Cat")
    res = api_client.delete(f"/api/diagnostic-center-categories/{dc_cat.id}/")
    assert res.status_code in [status.HTTP_204_NO_CONTENT, status.HTTP_200_OK]
    assert not DiagnosticCenterCategory.objects.filter(id=dc_cat.id).exists()


@pytest.mark.django_db
def test_delete_hospital_service(api_client, super_admin_user):
    api_client.force_authenticate(user=super_admin_user)
    hs = HospitalService.objects.create(name="ICU Service")
    res = api_client.delete(f"/api/hospital-services/{hs.id}/")
    assert res.status_code in [status.HTTP_204_NO_CONTENT, status.HTTP_200_OK]
    assert not HospitalService.objects.filter(id=hs.id).exists()


@pytest.mark.django_db
def test_delete_diagnostic_service(api_client, super_admin_user):
    api_client.force_authenticate(user=super_admin_user)
    ds = DiagnosticService.objects.create(name="MRI Service")
    res = api_client.delete(f"/api/diagnostic-services/{ds.id}/")
    assert res.status_code in [status.HTTP_204_NO_CONTENT, status.HTTP_200_OK]
    assert not DiagnosticService.objects.filter(id=ds.id).exists()


# =========================================================================
# 7. ROLES & USER-ROLES DELETE
# =========================================================================

@pytest.mark.django_db
def test_delete_custom_role(api_client, super_admin_user):
    api_client.force_authenticate(user=super_admin_user)
    custom_role = Role.objects.create(name="Custom Auditor", scope_type=Role.ScopeType.GLOBAL, is_system=False)
    res = api_client.delete(f"/api/roles/{custom_role.id}/")
    assert res.status_code in [status.HTTP_204_NO_CONTENT, status.HTTP_200_OK]
    assert not Role.objects.filter(id=custom_role.id).exists()


@pytest.mark.django_db
def test_delete_system_role_blocked(api_client, super_admin_user):
    api_client.force_authenticate(user=super_admin_user)
    sys_role, _ = Role.objects.get_or_create(name="Super Admin", defaults={"scope_type": Role.ScopeType.GLOBAL, "is_system": True})
    res = api_client.delete(f"/api/roles/{sys_role.id}/")
    assert res.status_code in [status.HTTP_400_BAD_REQUEST, status.HTTP_403_FORBIDDEN]
    assert Role.objects.filter(id=sys_role.id).exists()


@pytest.mark.django_db
def test_delete_user_role(api_client, super_admin_user):
    api_client.force_authenticate(user=super_admin_user)
    target_user = UserFactory(phone_number="01719999055")
    role = Role.objects.create(name="Temp Role", scope_type=Role.ScopeType.GLOBAL)
    ur = UserRole.objects.create(user=target_user, role=role)
    res = api_client.delete(f"/api/user-roles/{ur.id}/")
    assert res.status_code in [status.HTTP_204_NO_CONTENT, status.HTTP_200_OK]
    assert not UserRole.objects.filter(id=ur.id).exists()


# =========================================================================
# 8. FACILITY STAFF DELETE
# =========================================================================

@pytest.mark.django_db
def test_delete_facility_staff(api_client, super_admin_user):
    api_client.force_authenticate(user=super_admin_user)
    loc = LocationFactory()
    staff_user = UserFactory(phone_number="01719999066")
    role, _ = Role.objects.get_or_create(name="Staff", defaults={"scope_type": Role.ScopeType.FACILITY, "is_system": True})
    UserRole.objects.create(user=staff_user, role=role, facility=loc)

    res = api_client.delete(f"/api/facilities/{loc.id}/staff/{staff_user.id}/")
    assert res.status_code in [status.HTTP_204_NO_CONTENT, status.HTTP_200_OK]
    assert not UserRole.objects.filter(user=staff_user, facility=loc).exists()
