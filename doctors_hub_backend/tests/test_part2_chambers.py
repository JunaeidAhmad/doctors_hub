"""
P2.7.5 – Tests for Phase 7: Atomic chambers endpoint.
"""
import datetime
from decimal import Decimal

import pytest
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status as http_status

from doctors.models import Doctor, DoctorAffiliation, AffiliationSchedule
from bookings.models import DoctorBooking
from tests.factories import (
    UserFactory, LocationFactory, DoctorFactory,
    DoctorAffiliationFactory, AffiliationScheduleFactory,
)


@pytest.fixture
def superadmin(db):
    return UserFactory.create_super_admin(phone_number="01799880001")


@pytest.fixture
def admin_client(superadmin):
    client = APIClient()
    client.force_authenticate(user=superadmin)
    return client


@pytest.fixture
def doctor_with_two_chambers(db):
    doc = DoctorFactory.create(name="Dr. Chambers")
    loc1 = LocationFactory.create(name="Chamber A")
    loc2 = LocationFactory.create(name="Chamber B")
    aff1 = DoctorAffiliationFactory.create(doctor=doc, location=loc1, fee=500)
    aff2 = DoctorAffiliationFactory.create(doctor=doc, location=loc2, fee=800)
    AffiliationScheduleFactory.create(affiliation=aff1, day_of_week="Monday",
                                       start_time="09:00:00", end_time="12:00:00")
    AffiliationScheduleFactory.create(affiliation=aff2, day_of_week="Tuesday",
                                       start_time="14:00:00", end_time="17:00:00")
    return doc, aff1, aff2


@pytest.mark.django_db
class TestSyncChambers:
    def test_create_two_chambers_with_schedules(self, admin_client, db):
        doc = DoctorFactory.create(name="Dr. New Chambers")
        loc1 = LocationFactory.create(name="New Chamber A")
        loc2 = LocationFactory.create(name="New Chamber B")
        payload = {
            "chambers": [
                {
                    "location_id": str(loc1.pk),
                    "fee": "500.00",
                    "chamber_type": "Primary Chamber",
                    "advance_booking_days": 14,
                    "schedules": [
                        {"day_of_week": "Monday", "start_time": "09:00", "end_time": "12:00",
                         "max_patients": 20, "avg_consult_minutes": 15}
                    ]
                },
                {
                    "location_id": str(loc2.pk),
                    "fee": "800.00",
                    "schedules": [
                        {"day_of_week": "Tuesday", "start_time": "14:00", "end_time": "17:00",
                         "max_patients": 10, "avg_consult_minutes": 10}
                    ]
                }
            ]
        }
        resp = admin_client.put(f"/api/v1/doctors/{doc.pk}/chambers/", payload, format="json")
        assert resp.status_code == 200, resp.data
        assert len(resp.data["chambers"]) == 2
        assert len(resp.data["deactivated"]) == 0
        assert len(resp.data["deleted"]) == 0

    def test_update_fee(self, admin_client, doctor_with_two_chambers):
        doc, aff1, aff2 = doctor_with_two_chambers
        payload = {
            "chambers": [
                {"id": str(aff1.pk), "location_id": str(aff1.location_id),
                 "fee": "1500.00", "schedules": [
                     {"id": str(aff1.schedules.first().pk),
                      "day_of_week": "Monday", "start_time": "09:00", "end_time": "12:00"}
                 ]},
                {"id": str(aff2.pk), "location_id": str(aff2.location_id),
                 "fee": "800.00", "schedules": [
                     {"id": str(aff2.schedules.first().pk),
                      "day_of_week": "Tuesday", "start_time": "14:00", "end_time": "17:00"}
                 ]},
            ]
        }
        resp = admin_client.put(f"/api/v1/doctors/{doc.pk}/chambers/", payload, format="json")
        assert resp.status_code == 200, resp.data
        aff1.refresh_from_db()
        assert aff1.fee == Decimal("1500.00")

    def test_remove_chamber_with_bookings_deactivates(self, admin_client, doctor_with_two_chambers):
        doc, aff1, aff2 = doctor_with_two_chambers
        # Create a booking on aff1
        DoctorBooking.objects.create(
            affiliation=aff1,
            date=timezone.localdate() + datetime.timedelta(days=3),
            session_key="s:test",
            patient_name="Booked",
            patient_phone="01711110000",
        )
        # Payload only has aff2 (aff1 is removed)
        payload = {
            "chambers": [
                {"id": str(aff2.pk), "location_id": str(aff2.location_id),
                 "fee": "800.00", "schedules": [
                     {"id": str(aff2.schedules.first().pk),
                      "day_of_week": "Tuesday", "start_time": "14:00", "end_time": "17:00"}
                 ]},
            ]
        }
        resp = admin_client.put(f"/api/v1/doctors/{doc.pk}/chambers/", payload, format="json")
        assert resp.status_code == 200, resp.data
        assert str(aff1.pk) in resp.data["deactivated"]
        aff1.refresh_from_db()
        assert aff1.is_active is False
        assert aff1.bookings.count() == 1  # bookings intact

    def test_remove_chamber_without_bookings_deletes(self, admin_client, doctor_with_two_chambers):
        doc, aff1, aff2 = doctor_with_two_chambers
        payload = {
            "chambers": [
                {"id": str(aff2.pk), "location_id": str(aff2.location_id),
                 "fee": "800.00", "schedules": [
                     {"id": str(aff2.schedules.first().pk),
                      "day_of_week": "Tuesday", "start_time": "14:00", "end_time": "17:00"}
                 ]},
            ]
        }
        resp = admin_client.put(f"/api/v1/doctors/{doc.pk}/chambers/", payload, format="json")
        assert resp.status_code == 200, resp.data
        assert str(aff1.pk) in resp.data["deleted"]
        assert not DoctorAffiliation.objects.filter(pk=aff1.pk).exists()

    def test_overlap_rolls_back_everything(self, admin_client, db):
        doc = DoctorFactory.create(name="Dr. Overlap")
        loc1 = LocationFactory.create(name="Overlap A")
        loc2 = LocationFactory.create(name="Overlap B")
        payload = {
            "chambers": [
                {"location_id": str(loc1.pk), "fee": "500.00",
                 "schedules": [{"day_of_week": "Monday", "start_time": "09:00", "end_time": "12:00"}]},
                {"location_id": str(loc2.pk), "fee": "800.00",
                 "schedules": [{"day_of_week": "Monday", "start_time": "10:00", "end_time": "13:00"}]},
            ]
        }
        resp = admin_client.put(f"/api/v1/doctors/{doc.pk}/chambers/", payload, format="json")
        assert resp.status_code == 400
        assert DoctorAffiliation.objects.filter(doctor=doc).count() == 0

    def test_nested_affiliations_rejected(self, admin_client, db):
        doc = DoctorFactory.create(name="Dr. Nested")
        loc = LocationFactory.create(name="Nested Loc")
        resp = admin_client.post("/api/v1/doctors/", {
            "name": "Dr. Nested Create",
            "qualification": "MBBS",
            "affiliations": [{"location_id": str(loc.pk), "fee": "500"}]
        }, format="json")
        assert resp.status_code == 400
        assert "chambers" in str(resp.data).lower() or "affiliations" in str(resp.data).lower()

    def test_inactive_chamber_refuses_booking(self, admin_client, doctor_with_two_chambers, db):
        doc, aff1, aff2 = doctor_with_two_chambers
        aff1.is_active = False
        aff1.save()
        from bookings.services import create_doctor_booking
        from rest_framework import exceptions
        with pytest.raises(exceptions.ValidationError):
            create_doctor_booking({
                "affiliation": aff1,
                "date": timezone.localdate() + datetime.timedelta(days=3),
                "session_key": "s:test",
                "patient_name": "Test",
                "patient_phone": "01711110001",
            })

    def test_remove_schedule_with_future_bookings_rejected(self, admin_client, doctor_with_two_chambers):
        doc, aff1, aff2 = doctor_with_two_chambers
        sched1 = aff1.schedules.first()
        DoctorBooking.objects.create(
            affiliation=aff1,
            date=timezone.localdate() + datetime.timedelta(days=5),
            session_key=f"s:{sched1.pk}",
            schedule=sched1,
            patient_name="Future",
            patient_phone="01711110002",
        )
        # Remove the schedule from aff1
        payload = {
            "chambers": [
                {"id": str(aff1.pk), "location_id": str(aff1.location_id),
                 "fee": "500.00", "schedules": []},  # empty = remove all schedules
                {"id": str(aff2.pk), "location_id": str(aff2.location_id),
                 "fee": "800.00", "schedules": [
                     {"id": str(aff2.schedules.first().pk),
                      "day_of_week": "Tuesday", "start_time": "14:00", "end_time": "17:00"}
                 ]},
            ]
        }
        resp = admin_client.put(f"/api/v1/doctors/{doc.pk}/chambers/", payload, format="json")
        assert resp.status_code == 400
