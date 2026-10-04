import datetime
from django.db import transaction
from django.utils import timezone
from rest_framework import exceptions
from doctors.models import DoctorAffiliation, ScheduleException
from doctors.services.availability import (
    resolve_sessions,
    compute_estimated_time,
)
from services.sms import (
    send_doctor_booking_confirmation_sms,
    send_test_booking_confirmation_sms,
    send_hospital_service_booking_confirmation_sms,
)
from .models import DoctorBooking, TestBooking, HospitalServiceBooking
from .patients import get_or_create_patient
from core.tasks import run_after_commit
from tests.models import FacilityTest
from facilities.models import Hospital


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

    if not affiliation.is_active:
        raise exceptions.ValidationError({'affiliation_id': 'This chamber is not accepting new bookings.'})

    booking_date = validated_data.get('date')
    if isinstance(booking_date, str):
        try:
            booking_date = datetime.date.fromisoformat(booking_date)
        except ValueError:
            raise exceptions.ValidationError({'date': 'Invalid date format. Use YYYY-MM-DD.'})

    now = timezone.localtime()
    today = timezone.localdate()

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
    patient = validated_data.get('patient')
    if not patient and validated_data.get('patient_phone'):
        patient = get_or_create_patient(validated_data['patient_phone'], validated_data.get('patient_name', ''))

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
        patient=patient,
        patient_name=validated_data.get('patient_name', ''),
        patient_phone=validated_data.get('patient_phone', ''),
        patient_age=validated_data.get('patient_age'),
        patient_gender=validated_data.get('patient_gender', ''),
        fee_at_booking=affiliation.fee,
        notes=validated_data.get('notes', ''),
        status='pending',
        booked_by_user=booked_by_user
    )
    booking.save()

    # Confirmation SMS on transaction commit
    run_after_commit(send_doctor_booking_confirmation_sms, booking)

    return booking


def _validate_booking_date(value, field_name):
    if isinstance(value, str):
        try:
            value = datetime.date.fromisoformat(value)
        except ValueError:
            raise exceptions.ValidationError({field_name: 'Invalid date format. Use YYYY-MM-DD.'})
    today = timezone.localdate()
    if value < today:
        raise exceptions.ValidationError({field_name: 'Booking date cannot be in the past.'})
    if value > today + datetime.timedelta(days=30):
        raise exceptions.ValidationError({field_name: 'Booking date cannot be more than 30 days in advance.'})
    return value


@transaction.atomic
def create_test_booking(validated_data: dict, user=None) -> TestBooking:
    facility_test_obj = validated_data.get('facility_test')
    try:
        facility_test = FacilityTest.objects.select_for_update().select_related(
            'location', 'test__category'
        ).get(pk=getattr(facility_test_obj, 'pk', facility_test_obj))
    except (FacilityTest.DoesNotExist, ValueError, TypeError):
        raise exceptions.ValidationError({'facility_test_id': 'Test offering does not exist.'})

    if not facility_test.is_available:
        raise exceptions.ValidationError({'facility_test_id': 'This test is currently unavailable.'})
    if not facility_test.location.is_active:
        raise exceptions.ValidationError({'facility_test_id': 'The diagnostic center is inactive.'})
    if not facility_test.test.is_active or not facility_test.test.category.is_active:
        raise exceptions.ValidationError({'facility_test_id': 'This test is currently unavailable.'})

    pickup_date = _validate_booking_date(validated_data.get('pickup_date'), 'pickup_date')
    collection_type = validated_data.get('collection_type', TestBooking.CollectionType.CENTER)
    if collection_type not in TestBooking.CollectionType.values:
        raise exceptions.ValidationError({'collection_type': 'Choose center or home collection.'})

    pickup_thana = validated_data.get('pickup_thana')
    address = (validated_data.get('pickup_address_line') or '').strip()
    if collection_type == TestBooking.CollectionType.HOME:
        if not facility_test.home_sample_collection:
            raise exceptions.ValidationError({'collection_type': 'Home collection is not available for this test.'})
        if not pickup_thana:
            raise exceptions.ValidationError({'pickup_thana_id': 'A pickup thana is required for home collection.'})
        if not address:
            raise exceptions.ValidationError({'pickup_address_line': 'A pickup address is required for home collection.'})
    else:
        pickup_thana = None
        address = ''

    patient = validated_data.get('patient')
    if not patient and validated_data.get('patient_phone'):
        patient = get_or_create_patient(validated_data['patient_phone'], validated_data.get('patient_name', ''))
    booked_by_user = user if user and user.is_authenticated else None
    booking = TestBooking.objects.create(
        facility_test=facility_test,
        pickup_date=pickup_date,
        collection_type=collection_type,
        pickup_thana=pickup_thana,
        pickup_address_line=address,
        patient=patient,
        patient_name=validated_data.get('patient_name', '') or (patient.name if patient else ''),
        patient_phone=validated_data.get('patient_phone', '') or (patient.phone if patient else ''),
        patient_age=validated_data.get('patient_age'),
        patient_gender=validated_data.get('patient_gender', ''),
        notes=validated_data.get('notes', ''),
        status='pending',
        booked_by_user=booked_by_user,
        price_at_booking=facility_test.calculated_price,
        home_charge_at_booking=facility_test.home_sample_charge if collection_type == TestBooking.CollectionType.HOME else None,
    )
    run_after_commit(send_test_booking_confirmation_sms, booking)
    return booking


@transaction.atomic
def create_hospital_service_booking(validated_data: dict, user=None) -> HospitalServiceBooking:
    hospital_obj = validated_data.get('hospital')
    try:
        hospital = Hospital.objects.select_for_update().select_related('location').get(
            pk=getattr(hospital_obj, 'pk', hospital_obj)
        )
    except (Hospital.DoesNotExist, ValueError, TypeError):
        raise exceptions.ValidationError({'hospital_id': 'Hospital does not exist.'})

    service = validated_data.get('service')
    if not hospital.location.is_active:
        raise exceptions.ValidationError({'hospital_id': 'The hospital is inactive.'})
    if not service or not hospital.services.filter(pk=service.pk).exists():
        raise exceptions.ValidationError({'service_id': 'This hospital does not offer the selected service.'})
    booking_date = _validate_booking_date(validated_data.get('booking_date'), 'booking_date')

    patient = validated_data.get('patient')
    if not patient and validated_data.get('patient_phone'):
        patient = get_or_create_patient(validated_data['patient_phone'], validated_data.get('patient_name', ''))
    booked_by_user = user if user and user.is_authenticated else None
    booking = HospitalServiceBooking.objects.create(
        hospital=hospital,
        service=service,
        booking_date=booking_date,
        preferred_time=validated_data.get('preferred_time', ''),
        patient=patient,
        patient_name=validated_data.get('patient_name', '') or (patient.name if patient else ''),
        patient_phone=validated_data.get('patient_phone', '') or (patient.phone if patient else ''),
        patient_age=validated_data.get('patient_age'),
        patient_gender=validated_data.get('patient_gender', ''),
        notes=validated_data.get('notes', ''),
        status='pending',
        booked_by_user=booked_by_user,
    )
    run_after_commit(send_hospital_service_booking_confirmation_sms, booking)
    return booking
