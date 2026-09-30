import datetime
import threading
from unittest.mock import patch
import pytest
from django.utils import timezone
from django.test import TransactionTestCase
from rest_framework.test import APIClient
from rest_framework import status

from facilities.models import Location, Division, District, Thana
from doctors.models import (
    Doctor, DoctorSpecialty, DoctorAffiliation, AffiliationSchedule, ScheduleException
)
from bookings.models import DoctorBooking, Patient
from doctors.services.availability import get_availability, batch_next_available


@pytest.fixture
def base_setup(db):
    div = Division.objects.create(name="Dhaka", bn_name="ঢাকা", slug="dhaka-div-avail")
    dist = District.objects.create(division=div, name="Dhaka Dist", bn_name="ঢাকা", slug="dhaka-dist-avail")
    thana = Thana.objects.create(district=dist, name="Dhanmondi Avail", bn_name="ধানমন্ডি", slug="dhanmondi-avail")
    loc = Location.objects.create(
        name="Dhaka Medical Centre",
        location_type=Location.LocationType.HOSPITAL,
        thana=thana,
        address_line="Road 2",
        slug="dhaka-med-avail"
    )
    spec = DoctorSpecialty.objects.create(name="Cardiology", slug="cardiology-avail")
    doc = Doctor.objects.create(name="Dr. Test Specialist", slug="dr-test-specialist", primary_specialty=spec)
    aff = DoctorAffiliation.objects.create(
        doctor=doc,
        location=loc,
        fee=1000.00,
        advance_booking_days=14
    )
    return {"loc": loc, "doc": doc, "aff": aff, "spec": spec}


@pytest.mark.django_db
def test_weekly_session_appears_on_right_weekday(client, base_setup):
    aff = base_setup["aff"]
    # Schedule on Wednesday only
    sched = AffiliationSchedule.objects.create(
        affiliation=aff,
        day_of_week="Wednesday",
        start_time=datetime.time(17, 0),
        end_time=datetime.time(20, 0),
        max_patients=20,
        avg_consult_minutes=10
    )

    # Freeze date to a Tuesday: 2026-10-06 (Tue)
    frozen_now = datetime.datetime(2026, 10, 6, 10, 0, tzinfo=timezone.get_current_timezone())
    with patch("django.utils.timezone.localtime", return_value=frozen_now):
        with patch("django.utils.timezone.localdate", return_value=frozen_now.date()):
            res = client.get(f"/api/affiliations/{aff.id}/availability/?days=3")
            assert res.status_code == 200
            data = res.data
            dates = data["dates"]
            assert len(dates) == 3
            # Day 0: Tue (2026-10-06) -> 0 sessions
            assert dates[0]["date"] == "2026-10-06"
            assert len(dates[0]["sessions"]) == 0
            # Day 1: Wed (2026-10-07) -> 1 session
            assert dates[1]["date"] == "2026-10-07"
            assert len(dates[1]["sessions"]) == 1
            s = dates[1]["sessions"][0]
            assert s["session_key"] == f"s:{sched.id}"
            assert s["session_start"] == "17:00"
            assert s["session_end"] == "20:00"
            assert s["capacity"] == 20
            assert s["remaining"] == 20
            assert s["status"] == "available"


@pytest.mark.django_db
def test_cancel_exception_closes_session(client, base_setup):
    aff = base_setup["aff"]
    sched = AffiliationSchedule.objects.create(
        affiliation=aff,
        day_of_week="Wednesday",
        start_time=datetime.time(17, 0),
        end_time=datetime.time(20, 0),
        max_patients=20
    )
    wed_date = datetime.date(2026, 10, 7)
    ScheduleException.objects.create(
        affiliation=aff,
        date=wed_date,
        kind="cancel",
        schedule=sched,
        note="Doctor attending conference"
    )

    frozen_now = datetime.datetime(2026, 10, 6, 10, 0, tzinfo=timezone.get_current_timezone())
    with patch("django.utils.timezone.localtime", return_value=frozen_now):
        with patch("django.utils.timezone.localdate", return_value=frozen_now.date()):
            res = client.get(f"/api/affiliations/{aff.id}/availability/?days=2")
            assert res.status_code == 200
            wed = res.data["dates"][1]
            assert len(wed["sessions"]) == 1
            assert wed["sessions"][0]["status"] == "closed"
            assert wed["sessions"][0]["note"] == "Doctor attending conference"


@pytest.mark.django_db
def test_modify_exception_changes_hours_and_capacity(client, base_setup):
    aff = base_setup["aff"]
    sched = AffiliationSchedule.objects.create(
        affiliation=aff,
        day_of_week="Wednesday",
        start_time=datetime.time(17, 0),
        end_time=datetime.time(20, 0),
        max_patients=20
    )
    wed_date = datetime.date(2026, 10, 7)
    ScheduleException.objects.create(
        affiliation=aff,
        date=wed_date,
        kind="modify",
        schedule=sched,
        start_time=datetime.time(18, 0),
        end_time=datetime.time(21, 30),
        max_patients=35
    )

    frozen_now = datetime.datetime(2026, 10, 6, 10, 0, tzinfo=timezone.get_current_timezone())
    with patch("django.utils.timezone.localtime", return_value=frozen_now):
        with patch("django.utils.timezone.localdate", return_value=frozen_now.date()):
            res = client.get(f"/api/affiliations/{aff.id}/availability/?days=2")
            assert res.status_code == 200
            session = res.data["dates"][1]["sessions"][0]
            assert session["session_start"] == "18:00"
            assert session["session_end"] == "21:30"
            assert session["capacity"] == 35


@pytest.mark.django_db
def test_extra_session_appears(client, base_setup):
    aff = base_setup["aff"]
    wed_date = datetime.date(2026, 10, 7)
    exc = ScheduleException.objects.create(
        affiliation=aff,
        date=wed_date,
        kind="extra",
        start_time=datetime.time(9, 0),
        end_time=datetime.time(12, 0),
        max_patients=15
    )

    frozen_now = datetime.datetime(2026, 10, 6, 10, 0, tzinfo=timezone.get_current_timezone())
    with patch("django.utils.timezone.localtime", return_value=frozen_now):
        with patch("django.utils.timezone.localdate", return_value=frozen_now.date()):
            res = client.get(f"/api/affiliations/{aff.id}/availability/?days=2")
            assert res.status_code == 200
            wed = res.data["dates"][1]
            assert len(wed["sessions"]) == 1
            assert wed["sessions"][0]["session_key"] == f"x:{exc.id}"
            assert wed["sessions"][0]["capacity"] == 15


@pytest.mark.django_db
def test_advance_booking_days_enforced(client, base_setup):
    aff = base_setup["aff"]
    aff.advance_booking_days = 3
    aff.save()

    AffiliationSchedule.objects.create(
        affiliation=aff,
        day_of_week="Friday",
        start_time=datetime.time(17, 0),
        end_time=datetime.time(20, 0),
        max_patients=10
    )

    frozen_now = datetime.datetime(2026, 10, 6, 10, 0, tzinfo=timezone.get_current_timezone()) # Tue
    with patch("django.utils.timezone.localtime", return_value=frozen_now):
        with patch("django.utils.timezone.localdate", return_value=frozen_now.date()):
            # Requesting 7 days, but advance_booking_days is 3
            res = client.get(f"/api/affiliations/{aff.id}/availability/?days=7")
            assert res.status_code == 200
            assert len(res.data["dates"]) == 3

            # Attempting to book on day 5 (Sunday) should fail 400
            sched = aff.schedules.first()
            booking_payload = {
                "affiliation_id": str(aff.id),
                "date": "2026-10-11",
                "session_key": f"s:{sched.id}",
                "patient_name": "Test User",
                "patient_phone": "01711112222",
                "otp_code": "123"
            }
            book_res = client.post("/api/bookings/doctor-bookings/", booking_payload, format="json")
            assert book_res.status_code == 400
            assert "advance" in str(book_res.data)


@pytest.mark.django_db
def test_past_date_booking_rejected(client, base_setup):
    aff = base_setup["aff"]
    sched = AffiliationSchedule.objects.create(
        affiliation=aff,
        day_of_week="Monday",
        start_time=datetime.time(17, 0),
        end_time=datetime.time(20, 0)
    )

    frozen_now = datetime.datetime(2026, 10, 6, 10, 0, tzinfo=timezone.get_current_timezone()) # Tue
    with patch("django.utils.timezone.localtime", return_value=frozen_now):
        with patch("django.utils.timezone.localdate", return_value=frozen_now.date()):
            booking_payload = {
                "affiliation_id": str(aff.id),
                "date": "2026-10-05", # yesterday
                "session_key": f"s:{sched.id}",
                "patient_name": "Test User",
                "patient_phone": "01711112222",
                "otp_code": "123"
            }
            res = client.post("/api/bookings/doctor-bookings/", booking_payload, format="json")
            assert res.status_code == 400
            assert "past" in str(res.data)


@pytest.mark.django_db
def test_full_capacity_booking_rejected(client, base_setup):
    aff = base_setup["aff"]
    sched = AffiliationSchedule.objects.create(
        affiliation=aff,
        day_of_week="Wednesday",
        start_time=datetime.time(17, 0),
        end_time=datetime.time(20, 0),
        max_patients=2
    )
    wed_date = "2026-10-07"

    frozen_now = datetime.datetime(2026, 10, 6, 10, 0, tzinfo=timezone.get_current_timezone())
    with patch("django.utils.timezone.localtime", return_value=frozen_now):
        with patch("django.utils.timezone.localdate", return_value=frozen_now.date()):
            # 1. First booking -> ok
            p1 = {
                "affiliation_id": str(aff.id),
                "date": wed_date,
                "session_key": f"s:{sched.id}",
                "patient_name": "Patient One",
                "patient_phone": "01711110001",
                "otp_code": "123"
            }
            res1 = client.post("/api/bookings/doctor-bookings/", p1, format="json")
            assert res1.status_code == 201

            # 2. Second booking -> ok
            p2 = {
                "affiliation_id": str(aff.id),
                "date": wed_date,
                "session_key": f"s:{sched.id}",
                "patient_name": "Patient Two",
                "patient_phone": "01711110002",
                "otp_code": "123"
            }
            res2 = client.post("/api/bookings/doctor-bookings/", p2, format="json")
            assert res2.status_code == 201

            # 3. Third booking -> rejected 400
            p3 = {
                "affiliation_id": str(aff.id),
                "date": wed_date,
                "session_key": f"s:{sched.id}",
                "patient_name": "Patient Three",
                "patient_phone": "01711110003",
                "otp_code": "123"
            }
            res3 = client.post("/api/bookings/doctor-bookings/", p3, format="json")
            assert res3.status_code == 400
            assert "fully booked" in str(res3.data)


@pytest.mark.django_db
def test_serials_increment_per_session_and_restart(client, base_setup):
    aff = base_setup["aff"]
    sched1 = AffiliationSchedule.objects.create(
        affiliation=aff,
        day_of_week="Wednesday",
        start_time=datetime.time(10, 0),
        end_time=datetime.time(13, 0),
        max_patients=10
    )
    sched2 = AffiliationSchedule.objects.create(
        affiliation=aff,
        day_of_week="Wednesday",
        start_time=datetime.time(17, 0),
        end_time=datetime.time(20, 0),
        max_patients=10
    )
    wed_date = "2026-10-07"

    frozen_now = datetime.datetime(2026, 10, 6, 10, 0, tzinfo=timezone.get_current_timezone())
    with patch("django.utils.timezone.localtime", return_value=frozen_now):
        with patch("django.utils.timezone.localdate", return_value=frozen_now.date()):
            # Booking 1 in morning session -> serial 1
            r1 = client.post("/api/bookings/doctor-bookings/", {
                "affiliation_id": str(aff.id),
                "date": wed_date,
                "session_key": f"s:{sched1.id}",
                "patient_name": "P1",
                "patient_phone": "01711110001",
                "otp_code": "123"
            }, format="json")
            assert r1.status_code == 201
            assert r1.data["serial_number"] == 1
            assert r1.data["serial_display"] == "SL-001"

            # Booking 2 in morning session -> serial 2
            r2 = client.post("/api/bookings/doctor-bookings/", {
                "affiliation_id": str(aff.id),
                "date": wed_date,
                "session_key": f"s:{sched1.id}",
                "patient_name": "P2",
                "patient_phone": "01711110002",
                "otp_code": "123"
            }, format="json")
            assert r2.status_code == 201
            assert r2.data["serial_number"] == 2
            assert r2.data["serial_display"] == "SL-002"

            # Booking in evening session -> serial 1 (restarts per session)
            r3 = client.post("/api/bookings/doctor-bookings/", {
                "affiliation_id": str(aff.id),
                "date": wed_date,
                "session_key": f"s:{sched2.id}",
                "patient_name": "P3",
                "patient_phone": "01711110003",
                "otp_code": "123"
            }, format="json")
            assert r3.status_code == 201
            assert r3.data["serial_number"] == 1
            assert r3.data["serial_display"] == "SL-001"


@pytest.mark.django_db
def test_cancelled_booking_frees_capacity_serial_not_reused(client, base_setup):
    aff = base_setup["aff"]
    sched = AffiliationSchedule.objects.create(
        affiliation=aff,
        day_of_week="Wednesday",
        start_time=datetime.time(17, 0),
        end_time=datetime.time(20, 0),
        max_patients=2
    )
    wed_date = "2026-10-07"

    frozen_now = datetime.datetime(2026, 10, 6, 10, 0, tzinfo=timezone.get_current_timezone())
    with patch("django.utils.timezone.localtime", return_value=frozen_now):
        with patch("django.utils.timezone.localdate", return_value=frozen_now.date()):
            r1 = client.post("/api/bookings/doctor-bookings/", {
                "affiliation_id": str(aff.id),
                "date": wed_date,
                "session_key": f"s:{sched.id}",
                "patient_name": "P1",
                "patient_phone": "01711110001",
                "otp_code": "123"
            }, format="json")
            r2 = client.post("/api/bookings/doctor-bookings/", {
                "affiliation_id": str(aff.id),
                "date": wed_date,
                "session_key": f"s:{sched.id}",
                "patient_name": "P2",
                "patient_phone": "01711110002",
                "otp_code": "123"
            }, format="json")

            # Cancel first booking
            b1 = DoctorBooking.objects.get(pk=r1.data["id"])
            b1.status = "cancelled"
            b1.save()

            # Now active booking count is 1 out of capacity 2. A 3rd booking succeeds!
            r3 = client.post("/api/bookings/doctor-bookings/", {
                "affiliation_id": str(aff.id),
                "date": wed_date,
                "session_key": f"s:{sched.id}",
                "patient_name": "P3",
                "patient_phone": "01711110003",
                "otp_code": "123"
            }, format="json")
            assert r3.status_code == 201
            # Serial is not reused: max_serial was 2, next is 3!
            assert r3.data["serial_number"] == 3
            assert r3.data["serial_display"] == "SL-003"


@pytest.mark.django_db
def test_estimated_time_today_not_before_now(client, base_setup):
    aff = base_setup["aff"]
    sched = AffiliationSchedule.objects.create(
        affiliation=aff,
        day_of_week="Wednesday",
        start_time=datetime.time(10, 0),
        end_time=datetime.time(14, 0),
        avg_consult_minutes=10
    )
    # Today is Wednesday: 11:23 AM.
    # Raw estimated time for first patient (booked=0) would be 10:00 AM,
    # but since it's today and now is 11:23, it must round up to 11:25.
    frozen_now = datetime.datetime(2026, 10, 7, 11, 23, tzinfo=timezone.get_current_timezone())
    with patch("django.utils.timezone.localtime", return_value=frozen_now):
        with patch("django.utils.timezone.localdate", return_value=frozen_now.date()):
            res = client.get(f"/api/affiliations/{aff.id}/availability/?days=1")
            assert res.status_code == 200
            session = res.data["dates"][0]["sessions"][0]
            assert session["estimated_time"] == "11:25"


@pytest.mark.django_db
def test_status_payload_ignored_always_pending(client, base_setup):
    aff = base_setup["aff"]
    sched = AffiliationSchedule.objects.create(
        affiliation=aff,
        day_of_week="Wednesday",
        start_time=datetime.time(17, 0),
        end_time=datetime.time(20, 0)
    )

    frozen_now = datetime.datetime(2026, 10, 6, 10, 0, tzinfo=timezone.get_current_timezone())
    with patch("django.utils.timezone.localtime", return_value=frozen_now):
        with patch("django.utils.timezone.localdate", return_value=frozen_now.date()):
            res = client.post("/api/bookings/doctor-bookings/", {
                "affiliation_id": str(aff.id),
                "date": "2026-10-07",
                "session_key": f"s:{sched.id}",
                "patient_name": "P1",
                "patient_phone": "01711110001",
                "status": "confirmed", # injected
                "otp_code": "123"
            }, format="json")
            assert res.status_code == 201
            assert res.data["status"] == "pending"


@pytest.mark.django_db
def test_weekly_session_change_retains_booking_counts(client, base_setup):
    aff = base_setup["aff"]
    sched = AffiliationSchedule.objects.create(
        affiliation=aff,
        day_of_week="Wednesday",
        start_time=datetime.time(17, 0),
        end_time=datetime.time(20, 0),
        max_patients=5
    )
    wed_date = "2026-10-07"

    frozen_now = datetime.datetime(2026, 10, 6, 10, 0, tzinfo=timezone.get_current_timezone())
    with patch("django.utils.timezone.localtime", return_value=frozen_now):
        with patch("django.utils.timezone.localdate", return_value=frozen_now.date()):
            client.post("/api/bookings/doctor-bookings/", {
                "affiliation_id": str(aff.id),
                "date": wed_date,
                "session_key": f"s:{sched.id}",
                "patient_name": "P1",
                "patient_phone": "01711110001",
                "otp_code": "123"
            }, format="json")

            # Admin modifies schedule hours
            sched.start_time = datetime.time(18, 0)
            sched.end_time = datetime.time(21, 0)
            sched.save()

            # Check availability: booked is still 1, remaining is 4
            res = client.get(f"/api/affiliations/{aff.id}/availability/?days=2")
            assert res.status_code == 200
            session = res.data["dates"][1]["sessions"][0]
            assert session["booked"] == 1
            assert session["remaining"] == 4
            assert session["session_start"] == "18:00"


@pytest.mark.django_db
def test_status_change_on_old_booking_succeeds(client, base_setup):
    aff = base_setup["aff"]
    sched = AffiliationSchedule.objects.create(
        affiliation=aff,
        day_of_week="Wednesday",
        start_time=datetime.time(17, 0),
        end_time=datetime.time(20, 0)
    )
    b = DoctorBooking.objects.create(
        affiliation=aff,
        date=datetime.date(2026, 10, 7),
        session_key=f"s:{sched.id}",
        serial_number=1,
        patient_name="P1",
        patient_phone="01711110001",
        status="pending"
    )

    # Change schedule completely
    sched.day_of_week = "Thursday"
    sched.save()

    # Update status via serializer/view
    from accounts.models import User
    admin_user = User.objects.create_superuser(phone_number="01799990000", password="pass")
    api_client = APIClient()
    api_client.force_authenticate(user=admin_user)

    res = api_client.patch(f"/api/bookings/doctor-bookings/{b.id}/", {"status": "completed"}, format="json")
    assert res.status_code == 200
    b.refresh_from_db()
    assert b.status == "completed"


@pytest.mark.django_db
def test_exception_overlapping_doctor_rejected(base_setup):
    from doctors.serializers import ScheduleExceptionSerializer
    aff = base_setup["aff"]
    # Schedule on Wednesday 17:00 - 20:00
    AffiliationSchedule.objects.create(
        affiliation=aff,
        day_of_week="Wednesday",
        start_time=datetime.time(17, 0),
        end_time=datetime.time(20, 0)
    )

    # Second affiliation for same doctor at different location
    loc2 = Location.objects.create(name="Second Hospital", location_type=Location.LocationType.HOSPITAL)
    aff2 = DoctorAffiliation.objects.create(doctor=base_setup["doc"], location=loc2, fee=800)

    # Attempt to create an extra session on Wed 18:00 - 21:00 on aff2 (overlaps 17:00-20:00 on aff1)
    data = {
        "affiliation_id": str(aff2.id),
        "date": "2026-10-07",
        "kind": "extra",
        "start_time": "18:00",
        "end_time": "21:00",
        "max_patients": 10
    }
    ser = ScheduleExceptionSerializer(data=data)
    assert not ser.is_valid()
    assert "overlap" in str(ser.errors).lower()


@pytest.mark.django_db
def test_anonymous_availability_allowed(client, base_setup):
    aff = base_setup["aff"]
    res = client.get(f"/api/affiliations/{aff.id}/availability/")
    assert res.status_code == 200
    assert "dates" in res.data
    assert res.data["affiliation_id"] == str(aff.id)


@pytest.mark.django_db
def test_batch_next_available_constant_queries(django_assert_num_queries, base_setup):
    loc = base_setup["loc"]
    spec = base_setup["spec"]
    affiliations = []

    for i in range(20):
        d = Doctor.objects.create(name=f"Batch Doctor {i}", primary_specialty=spec)
        aff = DoctorAffiliation.objects.create(doctor=d, location=loc, fee=500)
        AffiliationSchedule.objects.create(
            affiliation=aff,
            day_of_week="Monday",
            start_time=datetime.time(10, 0),
            end_time=datetime.time(13, 0)
        )
        affiliations.append(aff)

    # Exactly 3 queries: schedules, exceptions, bookings
    with django_assert_num_queries(3):
        results = batch_next_available(affiliations, days=7)
        assert len(results) == 20


class DoctorBookingConcurrencyTestCase(TransactionTestCase):
    def test_concurrency_last_slot_race(self):
        """Two concurrent bookings for the last remaining slot: exactly one succeeds."""
        loc = Location.objects.create(name="Race Hospital", location_type=Location.LocationType.HOSPITAL)
        doc = Doctor.objects.create(name="Dr. Race Specialist")
        aff = DoctorAffiliation.objects.create(doctor=doc, location=loc, fee=1000, advance_booking_days=14)
        target_date = timezone.localdate() + datetime.timedelta(days=2)
        sched = AffiliationSchedule.objects.create(
            affiliation=aff,
            day_of_week=target_date.strftime("%A"),
            start_time=datetime.time(17, 0),
            end_time=datetime.time(20, 0),
            max_patients=1 # Only 1 slot!
        )

        results = []
        errors = []

        def attempt_booking(phone, name):
            client = APIClient()
            try:
                res = client.post("/api/bookings/doctor-bookings/", {
                    "affiliation_id": str(aff.id),
                    "date": target_date.isoformat(),
                    "session_key": f"s:{sched.id}",
                    "patient_name": name,
                    "patient_phone": phone,
                    "otp_code": "123"
                }, format="json")
                results.append(res.status_code)
            except Exception as e:
                errors.append(e)

        t1 = threading.Thread(target=attempt_booking, args=("01711119991", "Patient A"))
        t2 = threading.Thread(target=attempt_booking, args=("01711119992", "Patient B"))

        t1.start()
        t2.start()
        t1.join()
        t2.join()

        # Exactly one 201 and one 400
        assert 201 in results
        assert 400 in results
        assert results.count(201) == 1
        assert results.count(400) == 1
