"""
P3.2.3 – Tests for role call-site classification changes.
"""
import pytest
from rest_framework.test import APIClient
from rest_framework import status as http_status

from accounts.models import User, Role, UserRole, Permission
from tests.factories import UserFactory, LocationFactory
from facilities.models import Hospital


@pytest.fixture
def facility_location(db):
    return LocationFactory.create(name="RBAC Facility")


@pytest.fixture
def facility_staff_user(facility_location):
    user = UserFactory.create(phone_number="01711112222")
    role, _ = Role.objects.get_or_create(
        name="Facility Staff",
        defaults={"scope_type": Role.ScopeType.FACILITY, "is_system": True},
    )
    # NO roles.edit permission
    UserRole.objects.get_or_create(user=user, role=role, facility=facility_location)
    return user


@pytest.fixture
def facility_admin_user(facility_location):
    user = UserFactory.create(phone_number="01711113333")
    role, _ = Role.objects.get_or_create(
        name="Facility Admin",
        defaults={"scope_type": Role.ScopeType.FACILITY, "is_system": True},
    )
    perm, _ = Permission.objects.get_or_create(
        codename="roles.edit",
        defaults={"module": "roles", "action": "edit", "label": "Edit roles"},
    )
    role.permissions.add(perm)
    UserRole.objects.get_or_create(user=user, role=role, facility=facility_location)
    return user


@pytest.fixture
def global_role_user(db):
    user = UserFactory.create(phone_number="01711114444")
    role, _ = Role.objects.get_or_create(
        name="Content Editor",
        defaults={"scope_type": Role.ScopeType.GLOBAL, "is_system": False},
    )
    UserRole.objects.get_or_create(user=user, role=role)
    return user


@pytest.mark.django_db
class TestFacilityStaffRowScoping:
    def test_staff_can_list_own_facility_bookings(self, facility_staff_user, facility_location):
        client = APIClient()
        client.force_authenticate(user=facility_staff_user)
        resp = client.get("/api/bookings/doctor/")
        # Staff user should be able to access the endpoint (may return empty list)
        assert resp.status_code == 200

    def test_staff_without_roles_edit_is_not_facility_admin(self, facility_staff_user):
        assert facility_staff_user.is_facility_staff is True
        assert facility_staff_user.is_facility_admin is False

    def test_facility_admin_with_roles_edit(self, facility_admin_user):
        assert facility_admin_user.is_facility_staff is True
        assert facility_admin_user.is_facility_admin is True


@pytest.mark.django_db
class TestGlobalRoleUser:
    def test_non_system_global_role_not_super_admin(self, global_role_user):
        assert global_role_user.is_super_admin is False

    def test_non_system_global_role_not_facility_staff(self, global_role_user):
        assert global_role_user.is_facility_staff is False
        assert global_role_user.is_facility_admin is False


@pytest.mark.django_db
class TestVisibilityStaffVsAdmin:
    def test_is_admin_viewer_requires_staff_or_super(self, facility_staff_user, facility_admin_user, global_role_user):
        from core.visibility import is_admin_viewer
        # Staff user (no roles.edit) should still be admin viewer for row scoping
        assert is_admin_viewer(facility_staff_user) is True
        assert is_admin_viewer(facility_admin_user) is True
        assert is_admin_viewer(global_role_user) is False
