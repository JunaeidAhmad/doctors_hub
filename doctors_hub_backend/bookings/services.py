import datetime
from django.db import transaction
from django.utils import timezone
from rest_framework import exceptions
from doctors.models import DoctorAffiliation, ScheduleException
from doctors.services.availability import (
    resolve_sessions,
    compute_estimated_time,
)
from services.sms import send_doctor_booking_confirmation_sms
from .models import DoctorBooking


@transaction.atomic
def create_doctor_booking(validated_data: dict, user=None) -> DoctorBooking:
    """
    Creates a DoctorBooking with atomic locking on DoctorAffiliation.
    1. Locks DoctorAffiliation row.
    2. Validates booking date (at least today, within advance_booking_days).
    3. Resolves sessions and checks target session status (not closed, ended, or full).
    4. Computes next serial number and estimated_time.
    5. Saves booking with status='pending'.
    6. Dispatches confirmation SMS on commit.
    """
    affiliation_obj = validated_data.get('affiliation')
    affiliation_id = getattr(affiliation_obj, 'id', affiliation_obj)
    if not affiliation_id:
        affiliation_id = validated_data.get('affiliation_id')

    try:
        affiliation = DoctorAffiliation.objects.select_for_update().get(pk=affiliation_id)
    except (DoctorAffiliation.DoesNotExist, ValueError):
        raise exceptions.ValidationError({'affiliation_id': 'Doctor affiliation does not exist.'})

    booking_date = validated_data.get('date')
    if isinstance(booking_date, str):
        try:
            booking_date = datetime.date.fromisoformat(booking_date)
        except ValueError:
            raise exceptions.ValidationError({'date': 'Invalid date format. Use YYYY-MM-DD.'})

    now = timezone.localtime()
    today = now.date()

    if booking_date < today:
        raise exceptions.ValidationError({'date': 'Booking date cannot be in the past.'})

    max_advance = affiliation.advance_booking_days or 14
    if (booking_date - today).days > max_advance:
        raise exceptions.ValidationError({'date': f'Booking date cannot be more than {max_advance} days in advance.'})

    session_key = validated_data.get('session_key')
    if not session_key:
        raise exceptions.ValidationError({'session_key': 'session_key is required.'})

    # Fetch weekly schedules and exceptions for this date
    schedules = list(affiliation.schedules.all())
    exceptions_list = list(
        ScheduleException.objects.filter(affiliation=affiliation, date=booking_date)
    )

    sessions = resolve_sessions(affiliation, booking_date, schedules, exceptions_list)
    target_session = next((s for s in sessions if s.key == session_key), None)
    if not target_session:
        raise exceptions.ValidationError({'session_key': f"Unknown or invalid session '{session_key}' for this date."})

    # Check session status
    if target_session.cancelled:
        raise exceptions.ValidationError({'session_key': 'This session has been cancelled.'})

    if booking_date == today and now.time() >= target_session.end:
        raise exceptions.ValidationError({'session_key': 'This session has already ended for today.'})

    # Recount booked sessions and max serial
    existing_bookings = (
        DoctorBooking.objects.filter(
            affiliation=affiliation,
            date=booking_date,
            session_key=session_key
        )
    )
    active_count = existing_bookings.exclude(status='cancelled').count()
    if active_count >= target_session.capacity:
        raise exceptions.ValidationError({'session_key': 'This session is fully booked.'})

    from django.db.models import Max
    max_serial = existing_bookings.aggregate(m=Max('serial_number'))['m'] or 0
    next_serial = max_serial + 1

    estimated_time = compute_estimated_time(
        target_session.start,
        active_count,
        target_session.avg_minutes,
        booking_date,
        now
    )

    # Resolve schedule and schedule_exception FKs
    schedule_fk = None
    if target_session.schedule_id:
        schedule_fk = next((s for s in schedules if str(s.id) == str(target_session.schedule_id)), None)

    exception_fk = None
    if target_session.exception_id:
        exception_fk = next((e for e in exceptions_list if str(e.id) == str(target_session.exception_id)), None)

    booked_by_user = user if (user and user.is_authenticated) else None

    booking = DoctorBooking(
        affiliation=affiliation,
        date=booking_date,
        session_key=session_key,
        session_start=target_session.start,
        session_end=target_session.end,
        schedule=schedule_fk,
        schedule_exception=exception_fk,
        serial_number=next_serial,
        estimated_time=estimated_time,
        patient=validated_data.get('patient'),
        patient_name=validated_data.get('patient_name', ''),
        patient_phone=validated_data.get('patient_phone', ''),
        notes=validated_data.get('notes', ''),
        status='pending',
        booked_by_user=booked_by_user
    )
    booking.save()

    # Confirmation SMS on transaction commit
    transaction.on_commit(lambda: send_doctor_booking_confirmation_sms(booking))

    return booking
