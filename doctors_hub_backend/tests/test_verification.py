import pytest
from rest_framework.test import APIClient
from accounts.models import User, Role
from facilities.models import Location
from doctors.models import Doctor
from tests.factories import UserFactory, LocationFactory, DoctorFactory


@pytest.mark.django_db
class TestVerificationQueue:
    def setup_method(self):
        self.client = APIClient()
        self.super_admin = UserFactory.create_super_admin()
        self.facility_admin = UserFactory.create_facility_admin()

        # Unverified facility and doctor
        self.unverified_loc = LocationFactory.create(name="Pending Hospital", is_verified=False)
        self.unverified_doc = DoctorFactory.create(name="Pending Doctor", is_verified=False, bmdc_number="BMDC-TEST-1")

    def test_super_admin_can_view_queue_and_approve_facility(self):
        self.client.force_authenticate(user=self.super_admin)

        # 1. View queue
        res = self.client.get("/api/v1/admin/verifications/")
        assert res.status_code == 200
        data = res.json()
        assert data["total_pending"] >= 2
        fac_ids = [f["id"] for f in data["pending_facilities"]]
        assert str(self.unverified_loc.id) in fac_ids

        # 2. Approve facility
        approve_res = self.client.post(
            f"/api/v1/admin/verifications/facility/{self.unverified_loc.id}/",
            {"action": "approve"},
            format="json"
        )
        assert approve_res.status_code == 200

        self.unverified_loc.refresh_from_db()
        assert self.unverified_loc.is_verified is True

    def test_super_admin_can_approve_doctor(self):
        self.client.force_authenticate(user=self.super_admin)

        approve_res = self.client.post(
            f"/api/v1/admin/verifications/doctor/{self.unverified_doc.id}/",
            {"action": "approve"},
            format="json"
        )
        assert approve_res.status_code == 200

        self.unverified_doc.refresh_from_db()
        assert self.unverified_doc.is_verified is True

    def test_non_super_admin_forbidden_from_verification_queue(self):
        self.client.force_authenticate(user=self.facility_admin)

        res = self.client.get("/api/v1/admin/verifications/")
        assert res.status_code == 403

        approve_res = self.client.post(
            f"/api/v1/admin/verifications/facility/{self.unverified_loc.id}/",
            {"action": "approve"},
            format="json"
        )
        assert approve_res.status_code == 403

    def test_super_admin_can_create_platform_admin(self):
        self.client.force_authenticate(user=self.super_admin)

        payload = {
            "phone_number": "01799001122",
            "password": "platformpassword123",
            "first_name": "New Super Admin"
        }

        res = self.client.post("/api/v1/admin/platform-admins/", payload, format="json")
        assert res.status_code == 201

        new_admin = User.objects.get(phone_number="01799001122")
        assert new_admin.is_super_admin is True
        assert new_admin.is_superuser is True
        assert new_admin.is_staff is True
