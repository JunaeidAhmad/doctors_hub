import pytest
from rest_framework.test import APIClient
from accounts.models import User, Role
from facilities.models import Location, FacilityMembership
from tests.factories import UserFactory, LocationFactory, FacilityMembershipFactory


@pytest.mark.django_db
class TestStaffDelegation:
    def setup_method(self):
        self.client = APIClient()

        # Location A and Admin A
        self.loc_a = LocationFactory.create(name="Delta Hospital")
        self.admin_a = UserFactory.create_facility_admin()
        FacilityMembershipFactory.create(
            user=self.admin_a,
            location=self.loc_a,
            role=FacilityMembership.MemberRole.ADMIN
        )

        # Location B and Admin B
        self.loc_b = LocationFactory.create(name="Apex Diagnostic")
        self.admin_b = UserFactory.create_facility_admin()
        FacilityMembershipFactory.create(
            user=self.admin_b,
            location=self.loc_b,
            role=FacilityMembership.MemberRole.ADMIN
        )

        # Super Admin
        self.super_admin = UserFactory.create_super_admin()

    def test_facility_admin_can_add_and_list_staff_for_own_facility(self):
        self.client.force_authenticate(user=self.admin_a)

        payload = {
            "phone_number": "01611223344",
            "password": "staffpassword123",
            "first_name": "Rahim",
            "last_name": "Receptionist"
        }

        # Add staff
        res = self.client.post(f"/api/v1/facilities/{self.loc_a.id}/staff/", payload, format="json")
        assert res.status_code == 201
        data = res.json()
        assert data["status"] == "success"
        assert data["staff"]["first_name"] == "Rahim"

        # Verify database record
        staff_user = User.objects.get(phone_number="01611223344")
        assert staff_user.role == Role.STAFF
        assert FacilityMembership.objects.filter(user=staff_user, location=self.loc_a, role="staff").exists()

        # List staff
        list_res = self.client.get(f"/api/v1/facilities/{self.loc_a.id}/staff/")
        assert list_res.status_code == 200
        list_data = list_res.json()
        assert len(list_data) == 1
        assert list_data[0]["phone_number"] == "01611223344"

    def test_facility_admin_cannot_manage_foreign_facility_staff(self):
        # Admin A tries to add staff to Location B
        self.client.force_authenticate(user=self.admin_a)

        payload = {
            "phone_number": "01699887766",
            "password": "staffpassword123",
            "first_name": "Intruder"
        }

        res = self.client.post(f"/api/v1/facilities/{self.loc_b.id}/staff/", payload, format="json")
        assert res.status_code == 403

        # Admin A tries to list Location B's staff
        list_res = self.client.get(f"/api/v1/facilities/{self.loc_b.id}/staff/")
        assert list_res.status_code == 403

    def test_facility_admin_can_remove_staff(self):
        self.client.force_authenticate(user=self.admin_a)

        # Create staff
        staff = UserFactory.create(role=Role.STAFF)
        FacilityMembershipFactory.create(
            user=staff,
            location=self.loc_a,
            role=FacilityMembership.MemberRole.STAFF
        )

        del_res = self.client.delete(f"/api/v1/facilities/{self.loc_a.id}/staff/{staff.id}/")
        assert del_res.status_code == 204
        assert not FacilityMembership.objects.filter(user=staff, location=self.loc_a).exists()

    def test_super_admin_can_manage_any_facility_staff(self):
        self.client.force_authenticate(user=self.super_admin)

        payload = {
            "phone_number": "01677665544",
            "password": "staffpassword123",
            "first_name": "Global Staff"
        }

        res = self.client.post(f"/api/v1/facilities/{self.loc_a.id}/staff/", payload, format="json")
        assert res.status_code == 201

        list_res = self.client.get(f"/api/v1/facilities/{self.loc_a.id}/staff/")
        assert list_res.status_code == 200
