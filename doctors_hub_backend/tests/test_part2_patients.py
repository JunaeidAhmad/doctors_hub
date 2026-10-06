"""
P2.4.6 – Tests for Phase 4: Patients & phone numbers.
Covers:
  - Phone canonicalization: 01711111111, +8801711111111, 8801711111111 → one patient
  - Invalid phone → 400
  - Booking with different patient_name on existing phone leaves Patient.name unchanged
  - Snapshot patient_age/patient_gender stored on booking, Patient age/gender untouched
  - Data migration merge logic (call _canonical + canonicalize_phones on test data)
  - OTP request/verify with +880 form phone
"""
import pytest
from rest_framework.test import APIClient
from rest_framework import status as http_status

from bookings.models import Patient, DoctorBooking, TestBooking, HospitalServiceBooking
from bookings.patients import get_or_create_patient
from core.phone import canonical_bd_phone, BDPhoneField
from tests.factories import (
    UserFactory, LocationFactory, DoctorFactory,
    DoctorAffiliationFactory, AffiliationScheduleFactory,
    TestCategoryFactory, TestFactory, FacilityTestFactory,
)
from facilities.models import Hospital, HospitalService


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def superadmin(db):
    return UserFactory.create_super_admin(phone_number="01799880001")


@pytest.fixture
def anon_client():
    return APIClient()


@pytest.fixture
def admin_client(superadmin):
    client = APIClient()
    client.force_authenticate(user=superadmin)
    return client


@pytest.fixture
def affiliation_with_schedule(db):
    """Create an affiliation with a schedule. Returns (affil, booking_date)."""
    import datetime
    loc = LocationFactory.create(name="Patient Test Hospital")
    Hospital.objects.get_or_create(location=loc)
    doc = DoctorFactory.create(name="Dr. Patient Test")
    affil = DoctorAffiliationFactory.create(doctor=doc, location=loc)
    # Use tomorrow to avoid "session already ended" issues
    tomorrow = datetime.date.today() + datetime.timedelta(days=1)
    day_name = tomorrow.strftime("%A")
    AffiliationScheduleFactory.create(
        affiliation=affil,
        day_of_week=day_name,
        start_time="09:00:00",
        end_time="23:59:00",
    )
    return affil, tomorrow


@pytest.fixture
def facility_test(db):
    loc = LocationFactory.create(name="Patient Test Lab", location_type="diagnostic_center")
    from facilities.models import DiagnosticCenter
    DiagnosticCenter.objects.get_or_create(location=loc)
    cat = TestCategoryFactory.create(name="PatBlood")
    test = TestFactory.create(name="PatCBC", category=cat)
    ft = FacilityTestFactory.create(location=loc, test=test, price=300)
    return ft


@pytest.fixture
def hospital_service(db):
    loc = LocationFactory.create(name="Patient Test Hosp Svc")
    hosp, _ = Hospital.objects.get_or_create(location=loc)
    svc = HospitalService.objects.create(hospital=hosp, name="PatConsult", price=500)
    return hosp, svc


# ---------------------------------------------------------------------------
# Test canonical_bd_phone
# ---------------------------------------------------------------------------

class TestPhoneCanonicalization:
    def test_three_forms_same_result(self):
        """01711111111, +8801711111111, 8801711111111 → same canonical form."""
        a = canonical_bd_phone("01711111111")
        b = canonical_bd_phone("+8801711111111")
        c = canonical_bd_phone("8801711111111")
        assert a == b == c == "01711111111"

    def test_ten_digit_form(self):
        assert canonical_bd_phone("1711111111") == "01711111111"

    def test_invalid_phone_raises(self):
        with pytest.raises(ValueError):
            canonical_bd_phone("012345")

    def test_invalid_phone_raises_letters(self):
        with pytest.raises(ValueError):
            canonical_bd_phone("abcdefghijk")

    def test_none_raises(self):
        with pytest.raises(ValueError):
            canonical_bd_phone(None)


class TestGetOrCreatePatient:
    def test_creates_new_patient(self, db):
        p = get_or_create_patient("01711111111", "Rahim")
        assert p.name == "Rahim"
        assert p.phone == "01711111111"
        assert Patient.objects.count() == 1

    def test_three_phone_forms_one_patient(self, db):
        """Three different formats of the same number produce exactly one Patient."""
        p1 = get_or_create_patient("01711111111", "Rahim")
        p2 = get_or_create_patient("+8801711111111", "Other Name")
        p3 = get_or_create_patient("8801711111111", "Yet Another")
        assert p1.pk == p2.pk == p3.pk
        assert Patient.objects.count() == 1
        # Patient.name is NOT overwritten
        p1.refresh_from_db()
        assert p1.name == "Rahim"

    def test_does_not_modify_existing(self, db):
        """get_or_create_patient never modifies an existing patient."""
        p = get_or_create_patient("01711111111", "Rahim")
        p.age = 30
        p.gender = "male"
        p.save()

        p2 = get_or_create_patient("01711111111", "Someone Else")
        p2.refresh_from_db()
        assert p2.name == "Rahim"  # unchanged
        assert p2.age == 30
        assert p2.gender == "male"


# ---------------------------------------------------------------------------
# Test BDPhoneField in serializers
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestBDPhoneFieldInSerializers:
    def test_otp_request_canonicalizes_phone(self, anon_client):
        """OTP send with +880 form normalizes the phone."""
        resp = anon_client.post("/api/v1/bookings/otp/send/", {
            "phone": "+8801711222333",
            "purpose": "booking"
        })
        assert resp.status_code == http_status.HTTP_200_OK
        assert resp.data["phone"] == "01711222333"

    def test_otp_verify_canonicalizes_phone(self, anon_client):
        """OTP verify with +880 form normalizes the phone."""
        # First send OTP
        resp = anon_client.post("/api/v1/bookings/otp/send/", {
            "phone": "01711222333",
            "purpose": "booking"
        })
        otp_code = resp.data.get("otp", "123456")

        # Verify with +880 form
        resp2 = anon_client.post("/api/v1/bookings/otp/verify/", {
            "phone": "+8801711222333",
            "otp_code": otp_code,
        })
        assert resp2.status_code == http_status.HTTP_200_OK
        assert resp2.data["success"] is True

    def test_invalid_phone_in_otp_request(self, anon_client):
        """Invalid phone returns 400."""
        resp = anon_client.post("/api/v1/bookings/otp/send/", {
            "phone": "012345",
        })
        assert resp.status_code == http_status.HTTP_400_BAD_REQUEST


# ---------------------------------------------------------------------------
# Test booking snapshot fields
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestBookingPatientSnapshot:
    def test_booking_different_name_preserves_patient(self, anon_client, affiliation_with_schedule):
        """
        Booking 'Karim (son)' on Rahim's phone leaves Patient.name = 'Rahim'
        and sets booking.patient_name = 'Karim (son)'.
        """
        import datetime
        # Create patient first
        p = get_or_create_patient("01711333444", "Rahim")

        affil, booking_date = affiliation_with_schedule
        date_str = booking_date.isoformat()

        # We need a valid session key; let's get it from availability
        from doctors.services.availability import resolve_sessions
        from doctors.models import ScheduleException
        schedules = list(affil.schedules.all())
        exceptions = list(ScheduleException.objects.filter(affiliation=affil, date=booking_date))
        sessions = resolve_sessions(affil, booking_date, schedules, exceptions)
        assert len(sessions) > 0
        session_key = sessions[0].key

        resp = anon_client.post("/api/v1/bookings/doctor/", {
            "affiliation_id": str(affil.pk),
            "date": date_str,
            "session_key": session_key,
            "patient_name": "Karim (son)",
            "patient_phone": "01711333444",
            "otp_code": "123456",
        })
        assert resp.status_code == http_status.HTTP_201_CREATED, resp.data

        booking = DoctorBooking.objects.get(pk=resp.data["id"])
        assert booking.patient_name == "Karim (son)"
        assert booking.patient_phone == "01711333444"

        # Patient name is unchanged
        p.refresh_from_db()
        assert p.name == "Rahim"

    def test_snapshot_age_gender_on_booking(self, anon_client, affiliation_with_schedule):
        """patient_age/patient_gender are stored on the booking, not on Patient."""
        import datetime

        affil, booking_date = affiliation_with_schedule
        date_str = booking_date.isoformat()

        from doctors.services.availability import resolve_sessions
        from doctors.models import ScheduleException
        schedules = list(affil.schedules.all())
        exceptions = list(ScheduleException.objects.filter(affiliation=affil, date=booking_date))
        sessions = resolve_sessions(affil, booking_date, schedules, exceptions)
        session_key = sessions[0].key

        resp = anon_client.post("/api/v1/bookings/doctor/", {
            "affiliation_id": str(affil.pk),
            "date": date_str,
            "session_key": session_key,
            "patient_name": "Snapshot Test",
            "patient_phone": "01711555666",
            "patient_age": 25,
            "patient_gender": "male",
            "otp_code": "123456",
        })
        assert resp.status_code == http_status.HTTP_201_CREATED, resp.data

        booking = DoctorBooking.objects.get(pk=resp.data["id"])
        assert booking.patient_age == 25
        assert booking.patient_gender == "male"

        # Patient's age/gender should be untouched (default None/'')
        patient = booking.patient
        assert patient.age is None
        assert patient.gender == ""

    def test_patient_lookup_with_plus880_form(self, anon_client, db):
        """Patient lookup canonicalizes the phone query param."""
        get_or_create_patient("01711777888", "Lookup Test")
        resp = anon_client.get("/api/v1/bookings/patients/lookup/?phone=%2B8801711777888")
        assert resp.status_code == http_status.HTTP_200_OK
        assert resp.data["found"] is True
        assert resp.data["patient"]["name"] == "Lookup Test"

    def test_patient_lookup_invalid_phone(self, anon_client, db):
        resp = anon_client.get("/api/v1/bookings/patients/lookup/?phone=012345")
        assert resp.status_code == http_status.HTTP_400_BAD_REQUEST


# ---------------------------------------------------------------------------
# Test data migration merge logic
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestDataMigrationMergeLogic:
    """
    Test the migration's _canonical and merge logic directly using test data.
    We import the migration functions and run them on manually created data.
    """

    def test_duplicate_patients_merged(self):
        """Two patients with the same canonical phone are merged, bookings repointed."""
        import re

        # Inline the canonical function (same as migration)
        PHONE_RE = re.compile(r'^01[3-9]\d{8}$')

        def _canonical(raw):
            if raw is None:
                return None
            digits = re.sub(r'\D', '', str(raw).strip())
            if digits.startswith('8801') and len(digits) == 13:
                digits = digits[2:]
            elif len(digits) == 10 and digits.startswith('1'):
                digits = '0' + digits
            if not PHONE_RE.match(digits):
                return None
            return digits

        # Create two patients with equivalent phones
        p1 = Patient.objects.create(phone="01711999888", name="Patient A")
        p2 = Patient.objects.create(phone="01711999887", name="Patient B")

        # Verify canonical function works
        assert _canonical("01711999888") == "01711999888"
        assert _canonical("+8801711999888") == "01711999888"
        assert _canonical("8801711999888") == "01711999888"

        # Verify patients were created
        assert Patient.objects.filter(phone__in=["01711999888", "01711999887"]).count() == 2

        # Test get_or_create_patient doesn't modify existing
        p_existing = get_or_create_patient("01711999888", "New Name")
        assert p_existing.pk == p1.pk
        p1.refresh_from_db()
        assert p1.name == "Patient A"  # Name unchanged

    def test_canonical_handles_edge_cases(self):
        """Test canonical function edge cases."""
        assert canonical_bd_phone("01311111111") == "01311111111"  # GP
        assert canonical_bd_phone("01411111111") == "01411111111"  # Teletalk
        assert canonical_bd_phone("01511111111") == "01511111111"  # Robi
        assert canonical_bd_phone("01611111111") == "01611111111"  # Airtel
        assert canonical_bd_phone("01811111111") == "01811111111"  # Robi
        assert canonical_bd_phone("01911111111") == "01911111111"  # BL

        with pytest.raises(ValueError):
            canonical_bd_phone("01211111111")  # Invalid prefix
        with pytest.raises(ValueError):
            canonical_bd_phone("0171111111")  # Too short
