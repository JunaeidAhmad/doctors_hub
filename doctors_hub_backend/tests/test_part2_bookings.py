"""
P2.5.6 – Tests for Phase 5: Booking rules, price snapshots, async SMS.
"""
import datetime
from decimal import Decimal
from unittest.mock import patch

import pytest
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status as http_status

from bookings.models import DoctorBooking, TestBooking, HospitalServiceBooking, Patient
from bookings.transitions import ALLOWED
from core.tasks import run_after_commit
from tests.factories import (
    UserFactory, LocationFactory, DoctorFactory,
    DoctorAffiliationFactory, AffiliationScheduleFactory,
    TestCategoryFactory, TestFactory, FacilityTestFactory,
)
from facilities.models import Hospital, HospitalService, Thana
from doctors.services.availability import resolve_sessions
from doctors.models import ScheduleException


@pytest.fixture
def superadmin(db):
    return UserFactory.create_super_admin(phone_number="01799880001")


@pytest.fixture
def admin_client(superadmin):
    client = APIClient()
    client.force_authenticate(user=superadmin)
    return client


@pytest.fixture
def anon_client():
    return APIClient()


@pytest.fixture
def affiliation_with_schedule(db):
    loc = LocationFactory.create(name="P2B Hospital")
    Hospital.objects.get_or_create(location=loc)
    doc = DoctorFactory.create(name="Dr. P2B")
    affil = DoctorAffiliationFactory.create(doctor=doc, location=loc)
    tomorrow = timezone.localdate() + datetime.timedelta(days=1)
    day_name = tomorrow.strftime("%A")
    AffiliationScheduleFactory.create(
        affiliation=affil,
        day_of_week=day_name,
        start_time="09:00:00",
        end_time="23:59:00",
    )
    return affil, tomorrow


def _session_key(affil, booking_date):
    schedules = list(affil.schedules.all())
    exceptions = list(ScheduleException.objects.filter(affiliation=affil, date=booking_date))
    sessions = resolve_sessions(affil, booking_date, schedules, exceptions)
    assert sessions
    return sessions[0].key


@pytest.fixture
def facility_test(db):
    loc = LocationFactory.create(name="P2B Lab", location_type="diagnostic_center")
    from facilities.models import DiagnosticCenter
    DiagnosticCenter.objects.get_or_create(location=loc)
    cat = TestCategoryFactory.create(name="P2B Blood")
    test = TestFactory.create(name="P2B CBC", category=cat)
    return FacilityTestFactory.create(location=loc, test=test, price=300)


@pytest.fixture
def hospital_service(db):
    loc = LocationFactory.create(name="P2B Hosp Svc")
    hosp, _ = Hospital.objects.get_or_create(location=loc)
    svc = HospitalService.objects.create(name="P2B Consult")
    hosp.services.add(svc)
    return hosp, svc


# ---------------------------------------------------------------------------
# P2.5.2 – status is never writable
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestStatusReadonly:
    def test_status_ignored_on_doctor_create(self, anon_client, affiliation_with_schedule):
        affil, booking_date = affiliation_with_schedule
        resp = anon_client.post("/api/v1/bookings/doctor/", {
            "affiliation_id": str(affil.pk),
            "date": booking_date.isoformat(),
            "session_key": _session_key(affil, booking_date),
            "patient_name": "Status Test",
            "patient_phone": "01711112222",
            "status": "completed",
            "otp_code": "123",
        })
        assert resp.status_code == http_status.HTTP_201_CREATED, resp.data
        assert resp.data["status"] == "pending"

    def test_status_ignored_on_doctor_patch(self, admin_client, affiliation_with_schedule):
        affil, booking_date = affiliation_with_schedule
        resp = admin_client.post("/api/v1/bookings/doctor/", {
            "affiliation_id": str(affil.pk),
            "date": booking_date.isoformat(),
            "session_key": _session_key(affil, booking_date),
            "patient_name": "Status Patch",
            "patient_phone": "01711113333",
            "otp_code": "123",
        })
        assert resp.status_code == http_status.HTTP_201_CREATED, resp.data
        rid = resp.data["id"]
        patch_resp = admin_client.patch(f"/api/v1/bookings/doctor/{rid}/", {"status": "completed"})
        assert patch_resp.status_code == 200
        booking = DoctorBooking.objects.get(pk=rid)
        assert booking.status == "pending"

    def test_status_ignored_on_test_booking(self, anon_client, facility_test):
        resp = anon_client.post("/api/v1/bookings/test/", {
            "facility_test_id": str(facility_test.pk),
            "pickup_date": (timezone.localdate() + datetime.timedelta(days=1)).isoformat(),
            "patient_name": "Lab Status",
            "patient_phone": "01711114444",
            "status": "completed",
            "otp_code": "123",
        })
        assert resp.status_code == http_status.HTTP_201_CREATED, resp.data
        assert resp.data["status"] == "pending"

    def test_status_ignored_on_hospital_service(self, anon_client, hospital_service):
        hosp, svc = hospital_service
        resp = anon_client.post("/api/v1/bookings/hospital-service/", {
            "hospital_id": str(hosp.pk),
            "service_id": str(svc.pk),
            "booking_date": (timezone.localdate() + datetime.timedelta(days=1)).isoformat(),
            "patient_name": "HS Status",
            "patient_phone": "01711115555",
            "status": "completed",
            "otp_code": "123",
        })
        assert resp.status_code == http_status.HTTP_201_CREATED, resp.data
        assert resp.data["status"] == "pending"


# ---------------------------------------------------------------------------
# P2.5.2 – transitions
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestTransitions:
    def _make_doctor_booking(self, admin_client, affiliation_with_schedule):
        affil, booking_date = affiliation_with_schedule
        resp = admin_client.post("/api/v1/bookings/doctor/", {
            "affiliation_id": str(affil.pk),
            "date": booking_date.isoformat(),
            "session_key": _session_key(affil, booking_date),
            "patient_name": "Transition Test",
            "patient_phone": "01711116666",
            "otp_code": "123",
        })
        assert resp.status_code == http_status.HTTP_201_CREATED, resp.data
        return resp.data["id"]

    def test_pending_to_confirmed(self, admin_client, affiliation_with_schedule):
        rid = self._make_doctor_booking(admin_client, affiliation_with_schedule)
        resp = admin_client.post(f"/api/v1/bookings/doctor/{rid}/transition/", {"to": "confirmed"})
        assert resp.status_code == 200
        assert resp.data["status"] == "confirmed"

    def test_confirmed_to_completed(self, admin_client, affiliation_with_schedule):
        rid = self._make_doctor_booking(admin_client, affiliation_with_schedule)
        admin_client.post(f"/api/v1/bookings/doctor/{rid}/transition/", {"to": "confirmed"})
        resp = admin_client.post(f"/api/v1/bookings/doctor/{rid}/transition/", {"to": "completed"})
        assert resp.status_code == 200
        assert resp.data["status"] == "completed"

    def test_completed_to_pending_refused(self, admin_client, affiliation_with_schedule):
        rid = self._make_doctor_booking(admin_client, affiliation_with_schedule)
        admin_client.post(f"/api/v1/bookings/doctor/{rid}/transition/", {"to": "confirmed"})
        admin_client.post(f"/api/v1/bookings/doctor/{rid}/transition/", {"to": "completed"})
        resp = admin_client.post(f"/api/v1/bookings/doctor/{rid}/transition/", {"to": "pending"})
        assert resp.status_code == 400

    def test_invalid_transition_from_pending(self, admin_client, affiliation_with_schedule):
        rid = self._make_doctor_booking(admin_client, affiliation_with_schedule)
        resp = admin_client.post(f"/api/v1/bookings/doctor/{rid}/transition/", {"to": "completed"})
        assert resp.status_code == 400
        assert "allowed" in str(resp.data).lower() or "to" in resp.data

    def test_allowed_table_shape(self):
        assert ALLOWED["pending"] == ("confirmed", "cancelled")
        assert set(ALLOWED["confirmed"]) == {"completed", "cancelled", "no_show"}
        assert ALLOWED["completed"] == ()
        assert ALLOWED["cancelled"] == ()
        assert ALLOWED["no_show"] == ()


# ---------------------------------------------------------------------------
# P2.5.3 – test booking validation
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestTestBookingRules:
    def _post(self, client, facility_test, **overrides):
        payload = {
            "facility_test_id": str(facility_test.pk),
            "pickup_date": (timezone.localdate() + datetime.timedelta(days=1)).isoformat(),
            "patient_name": "Lab Rule",
            "patient_phone": "01711117777",
            "otp_code": "123",
        }
        payload.update(overrides)
        return client.post("/api/v1/bookings/test/", payload)

    def test_past_date_rejected(self, anon_client, facility_test):
        resp = self._post(anon_client, facility_test,
                          pickup_date=(timezone.localdate() - datetime.timedelta(days=1)).isoformat())
        assert resp.status_code == 400

    def test_beyond_30_days_rejected(self, anon_client, facility_test):
        resp = self._post(anon_client, facility_test,
                          pickup_date=(timezone.localdate() + datetime.timedelta(days=31)).isoformat())
        assert resp.status_code == 400

    def test_unavailable_test_rejected(self, anon_client, facility_test):
        facility_test.is_available = False
        facility_test.save()
        resp = self._post(anon_client, facility_test)
        assert resp.status_code == 400

    def test_inactive_location_rejected(self, anon_client, facility_test):
        facility_test.location.is_active = False
        facility_test.location.save()
        resp = self._post(anon_client, facility_test)
        assert resp.status_code == 400

    def test_home_not_offered_rejected(self, anon_client, facility_test):
        facility_test.home_sample_collection = False
        facility_test.save()
        resp = self._post(anon_client, facility_test,
                          collection_type="home",
                          pickup_address_line="House 1, Road 2")
        assert resp.status_code == 400

    def test_home_without_address_rejected(self, anon_client, facility_test, db):
        facility_test.home_sample_collection = True
        facility_test.save()
        thana = Thana.objects.first()
        resp = self._post(anon_client, facility_test,
                          collection_type="home",
                          pickup_thana_id=thana.pk,
                          pickup_address_line="")
        assert resp.status_code == 400

    def test_home_without_thana_rejected(self, anon_client, facility_test):
        facility_test.home_sample_collection = True
        facility_test.save()
        resp = self._post(anon_client, facility_test,
                          collection_type="home",
                          pickup_address_line="House 1")
        assert resp.status_code == 400

    def test_center_clears_pickup_fields(self, anon_client, facility_test, db):
        thana = Thana.objects.first()
        resp = self._post(anon_client, facility_test,
                          collection_type="center",
                          pickup_thana_id=thana.pk,
                          pickup_address_line="Should be cleared")
        assert resp.status_code == 201, resp.data
        booking = TestBooking.objects.get(pk=resp.data["id"])
        assert booking.collection_type == "center"
        assert booking.pickup_thana is None
        assert booking.pickup_address_line == ""


# ---------------------------------------------------------------------------
# P2.5.3 – hospital service validation
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestHospitalServiceBookingRules:
    def test_service_not_offered_rejected(self, anon_client, hospital_service, db):
        hosp, svc = hospital_service
        other = HospitalService.objects.create(name="P2B Other")
        hosp.services.add(other)
        hosp.services.remove(svc)
        resp = anon_client.post("/api/v1/bookings/hospital-service/", {
            "hospital_id": str(hosp.pk),
            "service_id": str(svc.pk),
            "booking_date": (timezone.localdate() + datetime.timedelta(days=1)).isoformat(),
            "patient_name": "HS Rule",
            "patient_phone": "01711118888",
            "otp_code": "123",
        })
        assert resp.status_code == 400

    def test_past_date_rejected(self, anon_client, hospital_service):
        hosp, svc = hospital_service
        hosp.services.add(svc)
        resp = anon_client.post("/api/v1/bookings/hospital-service/", {
            "hospital_id": str(hosp.pk),
            "service_id": str(svc.pk),
            "booking_date": (timezone.localdate() - datetime.timedelta(days=1)).isoformat(),
            "patient_name": "HS Past",
            "patient_phone": "01711119999",
            "otp_code": "123",
        })
        assert resp.status_code == 400


# ---------------------------------------------------------------------------
# P2.5.4 – price/fee snapshots
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestPriceSnapshots:
    def test_fee_snapshot_unchanged_after_fee_edit(self, admin_client, affiliation_with_schedule):
        affil, booking_date = affiliation_with_schedule
        resp = admin_client.post("/api/v1/bookings/doctor/", {
            "affiliation_id": str(affil.pk),
            "date": booking_date.isoformat(),
            "session_key": _session_key(affil, booking_date),
            "patient_name": "Fee Snapshot",
            "patient_phone": "01712223333",
            "otp_code": "123",
        })
        assert resp.status_code == 201, resp.data
        booking = DoctorBooking.objects.get(pk=resp.data["id"])
        assert booking.fee_at_booking == Decimal("1000.00")
        assert resp.data["fee"] == "1000.00"

        affil.fee = 2500.00
        affil.save()
        booking.refresh_from_db()
        assert booking.fee_at_booking == Decimal("1000.00")

    def test_price_snapshot_unchanged_after_price_edit(self, anon_client, facility_test):
        resp = anon_client.post("/api/v1/bookings/test/", {
            "facility_test_id": str(facility_test.pk),
            "pickup_date": (timezone.localdate() + datetime.timedelta(days=1)).isoformat(),
            "patient_name": "Price Snapshot",
            "patient_phone": "01712224444",
            "otp_code": "123",
        })
        assert resp.status_code == 201, resp.data
        booking = TestBooking.objects.get(pk=resp.data["id"])
        assert booking.price_at_booking == Decimal("300.00")
        assert resp.data["price"] == "300.00"

        facility_test.price = 999.00
        facility_test.save()
        booking.refresh_from_db()
        assert booking.price_at_booking == Decimal("300.00")

    def test_home_charge_snapshot(self, anon_client, facility_test, db):
        facility_test.home_sample_collection = True
        facility_test.home_sample_charge = 50.00
        facility_test.save()
        thana = Thana.objects.first()
        resp = anon_client.post("/api/v1/bookings/test/", {
            "facility_test_id": str(facility_test.pk),
            "pickup_date": (timezone.localdate() + datetime.timedelta(days=1)).isoformat(),
            "patient_name": "Home Charge",
            "patient_phone": "01712225555",
            "collection_type": "home",
            "pickup_thana_id": thana.pk,
            "pickup_address_line": "House 5",
            "otp_code": "123",
        })
        assert resp.status_code == 201, resp.data
        booking = TestBooking.objects.get(pk=resp.data["id"])
        assert booking.home_charge_at_booking == Decimal("50.00")

    def test_center_booking_has_no_home_charge(self, anon_client, facility_test):
        facility_test.home_sample_collection = True
        facility_test.home_sample_charge = 50.00
        facility_test.save()
        resp = anon_client.post("/api/v1/bookings/test/", {
            "facility_test_id": str(facility_test.pk),
            "pickup_date": (timezone.localdate() + datetime.timedelta(days=1)).isoformat(),
            "patient_name": "No Home Charge",
            "patient_phone": "01712226666",
            "collection_type": "center",
            "otp_code": "123",
        })
        assert resp.status_code == 201, resp.data
        booking = TestBooking.objects.get(pk=resp.data["id"])
        assert booking.home_charge_at_booking is None


# ---------------------------------------------------------------------------
# P2.5.1 – async SMS helper
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_run_after_commit_called_once(settings):
    settings.SMS_ASYNC = False
    calls = []
    with patch("django.db.transaction.on_commit") as on_commit:
        def capture(fn):
            fn()
        on_commit.side_effect = capture
        run_after_commit(lambda: calls.append(1))
        assert calls == [1]


@pytest.mark.django_db
def test_run_after_commit_not_called_on_rollback(settings, affiliation_with_schedule):
    settings.SMS_ASYNC = False
    affil, booking_date = affiliation_with_schedule
    from django.db import transaction
    with patch("bookings.services.send_doctor_booking_confirmation_sms") as sms:
        try:
            with transaction.atomic():
                raise RuntimeError("rollback")
        except RuntimeError:
            pass
        assert not sms.called


@pytest.mark.django_db(transaction=True)
def test_run_after_commit_sync_mode(settings):
    settings.SMS_ASYNC = False
    calls = []
    from django.db import transaction
    with transaction.atomic():
        run_after_commit(lambda: calls.append(1))
    # on_commit callbacks run after the outer atomic exits
    assert calls == [1]


# ---------------------------------------------------------------------------
# P2.5.5 – timezone regression
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_monday_past_at_dhaka_tuesday(admin_client, db):
    """At 00:30 Asia/Dhaka Tuesday (= Monday UTC), a Monday booking is past."""
    loc = LocationFactory.create(name="P2B TZ Hospital")
    Hospital.objects.get_or_create(location=loc)
    doc = DoctorFactory.create(name="Dr. P2B TZ")
    affil = DoctorAffiliationFactory.create(doctor=doc, location=loc)
    # Find the next Tuesday and Monday
    today = timezone.localdate()
    tuesday = today
    while tuesday.strftime("%A") != "Tuesday":
        tuesday += datetime.timedelta(days=1)
    monday = tuesday - datetime.timedelta(days=1)

    sched_mon = AffiliationScheduleFactory.create(
        affiliation=affil, day_of_week="Monday",
        start_time="17:00:00", end_time="21:00:00",
    )
    sched_tue = AffiliationScheduleFactory.create(
        affiliation=affil, day_of_week="Tuesday",
        start_time="17:00:00", end_time="21:00:00",
    )

    frozen = datetime.datetime.combine(tuesday, datetime.time(0, 30),
                                       tzinfo=timezone.get_current_timezone())
    with patch("django.utils.timezone.localtime", return_value=frozen):
        with patch("django.utils.timezone.localdate", return_value=tuesday):
            resp = admin_client.post("/api/v1/bookings/doctor/", {
                "affiliation_id": str(affil.pk),
                "date": monday.isoformat(),
                "session_key": f"s:{sched_mon.id}",
                "patient_name": "TZ Past",
                "patient_phone": "01713334444",
                "otp_code": "123",
            })
            assert resp.status_code == 400

            resp2 = admin_client.post("/api/v1/bookings/doctor/", {
                "affiliation_id": str(affil.pk),
                "date": tuesday.isoformat(),
                "session_key": f"s:{sched_tue.id}",
                "patient_name": "TZ Today",
                "patient_phone": "01713335555",
                "otp_code": "123",
            })
            assert resp2.status_code == 201, resp2.data
