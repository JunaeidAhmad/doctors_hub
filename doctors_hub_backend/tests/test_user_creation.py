import pytest
from rest_framework.test import APIClient
from rest_framework import status

from accounts.models import User, Role, UserRole, Permission
from core.rbac import clear_user_permissions_cache
from facilities.models import Location
from .factories import UserFactory, LocationFactory


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

    # Ensure Facility Admin role has users.create and users.view permissions
    role = Role.objects.get(name="Facility Admin")
    perm_create, _ = Permission.objects.get_or_create(
        module="users",
        action="create",
        defaults={"codename": "users.create", "label": "Create Users", "is_facility_grantable": True}
    )
    perm_view, _ = Permission.objects.get_or_create(
        module="users",
        action="view",
        defaults={"codename": "users.view", "label": "View Users", "is_facility_grantable": True}
    )
    role.permissions.add(perm_create, perm_view)
    clear_user_permissions_cache(user.id)
    return user


@pytest.fixture
def managed_location(facility_admin_user):
    loc = LocationFactory(name="Admin's Managed Hospital")
    role, _ = Role.objects.get_or_create(
        name="Facility Admin",
        defaults={"scope_type": Role.ScopeType.FACILITY, "is_system": True}
    )
    UserRole.objects.filter(user=facility_admin_user).update(facility=loc)
    clear_user_permissions_cache(facility_admin_user.id)
    return loc


@pytest.fixture
def other_location():
    return LocationFactory(name="Another Hospital Unmanaged")


@pytest.fixture
def facility_staff_role():
    role, _ = Role.objects.get_or_create(
        name="Staff Member",
        defaults={
            "scope_type": Role.ScopeType.FACILITY,
            "is_system": False,
            "description": "General facility staff",
        }
    )
    return role


@pytest.mark.django_db
class TestUserCreationAPI:

    def test_superadmin_can_create_user_with_credentials_and_role(self, api_client, super_admin_user, facility_staff_role, managed_location):
        api_client.force_authenticate(user=super_admin_user)

        payload = {
            "phone_number": "01711223344",
            "password": "SecurePassword123!",
            "first_name": "Rahim",
            "last_name": "Uddin",
            "role_id": str(facility_staff_role.id),
            "facility_id": str(managed_location.id),
            "is_active": True,
            "is_verified": True,
            "is_staff": False,
            "is_superuser": False
        }

        response = api_client.post("/api/users/", data=payload, format="json")
        assert response.status_code == status.HTTP_201_CREATED

        data = response.data
        assert data["phone_number"] == "01711223344"
        assert data["first_name"] == "Rahim"
        assert data["last_name"] == "Uddin"
        assert "password" not in data

        # Verify password in DB is hashed and matches
        user = User.objects.get(phone_number="01711223344")
        assert user.check_password("SecurePassword123!")
        assert user.is_active is True
        assert user.is_verified is True
        assert user.is_staff is False
        assert user.is_superuser is False

        # Verify UserRole assignment
        assignment = UserRole.objects.filter(user=user, role=facility_staff_role, facility=managed_location).first()
        assert assignment is not None

    def test_user_creation_invalid_bangladesh_phone(self, api_client, super_admin_user):
        api_client.force_authenticate(user=super_admin_user)

        payload = {
            "phone_number": "123456",
            "password": "SecurePassword123!",
            "first_name": "Invalid",
            "last_name": "Phone"
        }

        response = api_client.post("/api/users/", data=payload, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "phone_number" in response.data

    def test_user_creation_duplicate_phone(self, api_client, super_admin_user):
        api_client.force_authenticate(user=super_admin_user)

        # Existing user
        UserFactory(phone_number="01755667788")

        payload = {
            "phone_number": "01755667788",
            "password": "SecurePassword123!",
            "first_name": "Duplicate",
            "last_name": "User"
        }

        response = api_client.post("/api/users/", data=payload, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "phone_number" in response.data

    def test_facility_admin_can_create_user_for_managed_facility(self, api_client, facility_admin_user, managed_location, facility_staff_role):
        api_client.force_authenticate(user=facility_admin_user)

        payload = {
            "phone_number": "01788776655",
            "password": "FacilityStaffPass123!",
            "first_name": "Karim",
            "last_name": "Staff",
            "role_id": str(facility_staff_role.id),
            "facility_id": str(managed_location.id)
        }

        response = api_client.post("/api/users/", data=payload, format="json")
        assert response.status_code == status.HTTP_201_CREATED

        user = User.objects.get(phone_number="01788776655")
        assert user.check_password("FacilityStaffPass123!")
        assert UserRole.objects.filter(user=user, role=facility_staff_role, facility=managed_location).exists()

    def test_facility_admin_cannot_grant_superuser_or_staff(self, api_client, facility_admin_user, managed_location):
        api_client.force_authenticate(user=facility_admin_user)

        payload = {
            "phone_number": "01799887766",
            "password": "SecurePassword123!",
            "first_name": "Hacker",
            "last_name": "Attempt",
            "is_superuser": True
        }

        response = api_client.post("/api/users/", data=payload, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_facility_admin_cannot_assign_unmanaged_facility(self, api_client, facility_admin_user, managed_location, other_location, facility_staff_role):
        api_client.force_authenticate(user=facility_admin_user)

        payload = {
            "phone_number": "01799887755",
            "password": "SecurePassword123!",
            "first_name": "Out of",
            "last_name": "Scope",
            "role_id": str(facility_staff_role.id),
            "facility_id": str(other_location.id)
        }

        response = api_client.post("/api/users/", data=payload, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "facility_id" in response.data

    def test_unauthorized_user_cannot_create_user(self, api_client):
        regular_user = UserFactory(phone_number="01711002200")
        api_client.force_authenticate(user=regular_user)

        payload = {
            "phone_number": "01711002233",
            "password": "SecurePassword123!",
            "first_name": "Blocked",
            "last_name": "User"
        }

        response = api_client.post("/api/users/", data=payload, format="json")
        assert response.status_code == status.HTTP_403_FORBIDDEN
