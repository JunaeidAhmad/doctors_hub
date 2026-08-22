import pytest
from django.core.exceptions import ValidationError
from rest_framework.test import APIClient
from core.validators import bangladesh_phone_validator
from accounts.models import User
from accounts.serializers_onboarding import FacilityRegistrationSerializer, DoctorRegistrationSerializer, StaffCreateSerializer


class TestBangladeshPhoneValidator:

    @pytest.mark.parametrize("valid_phone", [
        "01712345678",
        "+8801712345678",
        "8801712345678",
        "01811223344",
        "+8801811223344",
        "01911223344",
        "01311223344",
        "01411223344",
        "01511223344",
        "01611223344",
    ])
    def test_valid_bangladeshi_phones_pass(self, valid_phone):
        # Should not raise
        bangladesh_phone_validator(valid_phone)

    @pytest.mark.parametrize("invalid_phone", [
        "12345",
        "0171234567",       # 10 digits
        "017123456789",     # 12 digits
        "01212345678",      # 012 is invalid operator in BD
        "01012345678",      # 010 is invalid operator in BD
        "+14155552671",     # US number
        "phone123456",
        "",
    ])
    def test_invalid_bangladeshi_phones_fail(self, invalid_phone):
        with pytest.raises(ValidationError):
            bangladesh_phone_validator(invalid_phone)


@pytest.mark.django_db
class TestPhoneValidationInAPI:

    def setup_method(self):
        self.client = APIClient()

    def test_facility_registration_rejects_invalid_phone(self):
        payload = {
            "facility_type": "hospital",
            "name": "Test Hospital",
            "division": "Dhaka",
            "district": "Dhaka",
            "address_line": "123 Street",
            "phone_number": "12345678",  # Invalid
            "password": "securepassword123"
        }
        res = self.client.post("/api/v1/auth/register/facility/", payload, format="json")
        assert res.status_code == 400
        assert "phone_number" in res.json()

    def test_facility_registration_accepts_valid_phone(self):
        payload = {
            "facility_type": "hospital",
            "name": "Valid Phone Hospital",
            "division": "Dhaka",
            "district": "Dhaka",
            "address_line": "123 Street",
            "phone_number": "+8801799887766",  # Valid
            "password": "securepassword123"
        }
        res = self.client.post("/api/v1/auth/register/facility/", payload, format="json")
        assert res.status_code == 201
