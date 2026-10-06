import pytest
from rest_framework.test import APIClient
from accounts.models import User, Role, UserRole
from facilities.models import Location, DiagnosticCenter, Division, District, Thana
from doctors.models import Doctor, DoctorSpecialty
from tests.factories import DoctorSpecialtyFactory


@pytest.mark.django_db
class TestOnboardingRegistration:
    def setup_method(self):
        self.client = APIClient()
        # Create geo rows needed by strict geo resolution
        div, _ = Division.objects.get_or_create(name="Dhaka", defaults={"bn_name": "ঢাকা"})
        dist, _ = District.objects.get_or_create(name="Dhaka", division=div, defaults={"bn_name": "ঢাকা"})
        Thana.objects.get_or_create(name="Dhanmondi", district=dist, defaults={"bn_name": "ধানমন্ডি"})

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
        assert "refresh" not in data
        assert "refresh_token" in response.cookies

        # Verify User
        user = User.objects.get(phone_number="01755112233")
        assert user.is_facility_admin is True
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

        # Verify Role Assignment
        assert UserRole.objects.filter(user=user, facility=location, role__name="Facility Admin").exists()

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
        assert user.is_doctor_role is True
        assert user.is_verified is False

        # Verify Doctor
        doctor = Doctor.objects.get(bmdc_number="BMDC-A-9988")
        assert doctor.user == user
        assert doctor.name == "Ahmad Abdullah"
        assert doctor.is_verified is False
        assert spec in doctor.specialties.all()

    def test_duplicate_registration_returns_400(self):
        thana = Thana.objects.first()
        payload = {
            "facility_type": "hospital",
            "name": "City Hospital",
            "thana_id": thana.pk if thana else None,
            "address_line": "Main Road",
            "phone_number": "01955112233",
            "password": "password123"
        }

        res1 = self.client.post("/api/v1/auth/register/facility/", payload, format="json")
        assert res1.status_code == 201

        # Second attempt with same phone
        res2 = self.client.post("/api/v1/auth/register/facility/", payload, format="json")
        assert res2.status_code == 400


@pytest.mark.django_db
class TestDoctorOnboardingDuplicates:
    def setup_method(self):
        self.client = APIClient()
        from tests.factories import UserFactory, LocationFactory, DoctorFactory
        self.UserFactory = UserFactory
        self.LocationFactory = LocationFactory
        self.DoctorFactory = DoctorFactory
        self.admin = UserFactory.create_super_admin(phone_number="01711998877")
        self.client.force_authenticate(user=self.admin)

    def test_bmdc_filter_case_insensitive(self):
        doc = self.DoctorFactory.create(name="Dr. Unique BMDC", bmdc_number="BMDC-TEST-12345")
        
        # Test lowercase query
        res_lower = self.client.get("/api/v1/doctors/?bmdc=bmdc-test-12345")
        assert res_lower.status_code == 200
        data_lower = res_lower.json()
        results_lower = data_lower if isinstance(data_lower, list) else data_lower.get("results", [])
        assert any(d["id"] == str(doc.id) for d in results_lower)

        # Test uppercase query
        res_upper = self.client.get("/api/v1/doctors/?bmdc=BMDC-TEST-12345")
        assert res_upper.status_code == 200
        data_upper = res_upper.json()
        results_upper = data_upper if isinstance(data_upper, list) else data_upper.get("results", [])
        assert any(d["id"] == str(doc.id) for d in results_upper)

        # Test non-matching query
        res_none = self.client.get("/api/v1/doctors/?bmdc=BMDC-NONEXISTENT")
        assert res_none.status_code == 200
        data_none = res_none.json()
        results_none = data_none if isinstance(data_none, list) else data_none.get("results", [])
        assert not any(d["id"] == str(doc.id) for d in results_none)

    def test_duplicate_affiliation_returns_400(self):
        doc = self.DoctorFactory.create(name="Dr. Affiliation Test")
        loc = self.LocationFactory.create(name="Central Clinic")

        payload = {
            "doctor": str(doc.id),
            "location_id": str(loc.id),
            "fee": 1200,
        }

        # First affiliation succeeds
        res1 = self.client.post("/api/v1/affiliations/", payload, format="json")
        assert res1.status_code == 201

        # Second affiliation with same doctor and location returns 400
        res2 = self.client.post("/api/v1/affiliations/", payload, format="json")
        assert res2.status_code == 400
        assert "This doctor is already affiliated with this facility" in str(res2.data)

    def test_duplicate_bmdc_doctor_creation_returns_400(self):
        self.DoctorFactory.create(name="Dr. Original", bmdc_number="BMDC-DUP-999")

        payload = {
            "name": "Dr. Duplicate Clone",
            "bmdc_number": "BMDC-DUP-999",
            "qualification": "MBBS",
            "experience": "5 years",
        }

        res = self.client.post("/api/v1/doctors/", payload, format="json")
        assert res.status_code == 400
        assert "bmdc_number" in res.data or "already exists" in str(res.data)

