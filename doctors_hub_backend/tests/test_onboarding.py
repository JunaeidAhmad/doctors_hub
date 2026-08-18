import pytest
from rest_framework.test import APIClient
from accounts.models import User, Role
from facilities.models import Location, FacilityMembership, DiagnosticCenter
from doctors.models import Doctor, DoctorSpecialty
from tests.factories import DoctorSpecialtyFactory


@pytest.mark.django_db
class TestOnboardingRegistration:
    def setup_method(self):
        self.client = APIClient()

    def test_facility_registration_creates_full_graph_unverified(self):
        payload = {
            "facility_type": "diagnostic_center",
            "name": "Ibn Sina Diagnostic Center",
            "branch": "Dhanmondi Branch",
            "license_number": "DGHS-REG-9876",
            "division": "Dhaka",
            "district": "Dhaka",
            "area": "Dhanmondi",
            "address_line": "House 48, Road 9/A",
            "phone_number": "01755112233",
            "password": "securepassword123",
            "first_name": "Ibn Sina Admin",
            "email": "contact@ibnsina.com"
        }

        response = self.client.post("/api/v1/auth/register/facility/", payload, format="json")
        assert response.status_code == 201
        data = response.json()
        assert data["status"] == "success"
        assert "access" in data
        assert "refresh" in data

        # Verify User
        user = User.objects.get(phone_number="01755112233")
        assert user.role == Role.FACILITY_ADMIN
        assert user.is_verified is False
        assert user.is_active is True
        assert user.check_password("securepassword123")

        # Verify Location & Detail
        location = Location.objects.get(name="Ibn Sina Diagnostic Center", branch="Dhanmondi Branch")
        assert location.location_type == "diagnostic_center"
        assert location.division == "Dhaka"
        assert location.district == "Dhaka"
        assert location.area == "Dhanmondi"
        assert location.is_verified is False
        assert DiagnosticCenter.objects.filter(location=location).exists()

        # Verify Membership
        membership = FacilityMembership.objects.get(user=user, location=location)
        assert membership.role == FacilityMembership.MemberRole.ADMIN

    def test_doctor_registration_creates_user_and_doctor_with_bmdc(self):
        spec = DoctorSpecialtyFactory(name="Cardiology")

        payload = {
            "name": "Ahmad Abdullah",
            "phone_number": "01855112233",
            "password": "doctorpassword123",
            "bmdc_number": "BMDC-A-9988",
            "qualification": "MBBS, FCPS (Cardiology)",
            "experience": "12 years",
            "specialty_ids": [str(spec.id)],
            "email": "dr.ahmad@example.com"
        }

        response = self.client.post("/api/v1/auth/register/doctor/", payload, format="json")
        assert response.status_code == 201
        data = response.json()
        assert data["status"] == "success"

        # Verify User
        user = User.objects.get(phone_number="01855112233")
        assert user.role == Role.DOCTOR
        assert user.is_verified is False

        # Verify Doctor
        doctor = Doctor.objects.get(bmdc_number="BMDC-A-9988")
        assert doctor.user == user
        assert doctor.name == "Ahmad Abdullah"
        assert doctor.is_verified is False
        assert spec in doctor.specialties.all()

    def test_duplicate_registration_returns_400(self):
        payload = {
            "facility_type": "hospital",
            "name": "City Hospital",
            "division": "Dhaka",
            "district": "Dhaka",
            "address_line": "Main Road",
            "phone_number": "01955112233",
            "password": "password123"
        }

        res1 = self.client.post("/api/v1/auth/register/facility/", payload, format="json")
        assert res1.status_code == 201

        # Second attempt with same phone
        res2 = self.client.post("/api/v1/auth/register/facility/", payload, format="json")
        assert res2.status_code == 400
