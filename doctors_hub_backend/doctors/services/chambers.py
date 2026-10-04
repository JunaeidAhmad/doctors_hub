"""
P2.7.2 – Atomic chambers sync service.

PUT /api/doctors/{id}/chambers/ saves the complete desired set of chambers
that the requesting user may manage, under a single transaction.
"""
from decimal import Decimal, InvalidOperation

from django.db import transaction
from django.utils import timezone
from rest_framework import exceptions

from doctors.models import DoctorAffiliation, AffiliationSchedule
from facilities.models import Location


def _validate_fee(raw):
    if raw is None or raw == '':
        raise exceptions.ValidationError({'fee': 'Fee is required and must be greater than 0.'})
    try:
        fee = Decimal(str(raw))
    except (InvalidOperation, ValueError):
        raise exceptions.ValidationError({'fee': 'Invalid fee amount.'})
    if fee <= 0:
        raise exceptions.ValidationError({'fee': 'Fee must be greater than 0.'})
    return fee


def _validate_time(raw, field_name):
    import datetime
    if isinstance(raw, datetime.time):
        return raw
    try:
        parts = str(raw).split(':')
        return datetime.time(int(parts[0]), int(parts[1]))
    except (ValueError, IndexError):
        raise exceptions.ValidationError({field_name: 'Invalid time format. Use HH:MM.'})


@transaction.atomic
def sync_chambers(doctor, payload, user):
    """
    Sync chambers and schedules for a doctor.

    payload = {"chambers": [{"id", "location_id", "chamber_type", "fee",
                             "advance_booking_days",
                             "schedules": [{"id", "day_of_week", "start_time",
                                            "end_time", "max_patients",
                                            "avg_consult_minutes"}]}]}

    Returns {"chambers": [...], "deactivated": [...], "deleted": [...]}.
    """
    from core.permissions import check_location_write_permission

    chambers_payload = payload.get('chambers', [])
    if not isinstance(chambers_payload, list):
        raise exceptions.ValidationError({'chambers': 'Must be a list.'})

    # Determine scope
    is_super = getattr(user, 'is_super_admin', False) or getattr(user, 'is_superuser', False)
    is_doctor_self = getattr(user, 'is_doctor_role', False) and getattr(
        getattr(user, 'doctor_profile', None), 'id', None
    ) == doctor.id
    managed_ids = set()
    if not is_super and not is_doctor_self:
        managed_ids = set(map(str, getattr(user, 'managed_location_ids', [])))

    def in_scope(affiliation):
        if is_super or is_doctor_self:
            return True
        return str(affiliation.location_id) in managed_ids

    existing = {str(a.id): a for a in DoctorAffiliation.objects.filter(doctor=doctor)}
    payload_ids = {str(c.get('id')) for c in chambers_payload if c.get('id')}

    deactivated = []
    deleted = []

    # ---- Process incoming chambers ----
    for chamber_data in chambers_payload:
        chamber_id = chamber_data.get('id')
        if chamber_id:
            aff = existing.get(str(chamber_id))
            if aff is None:
                raise exceptions.ValidationError({'chambers': f'Chamber {chamber_id} not found for this doctor.'})
            if not in_scope(aff):
                raise exceptions.PermissionDenied(f'Chamber {chamber_id} is outside your scope.')
            # Update
            if 'location_id' in chamber_data:
                loc = Location.objects.filter(pk=chamber_data['location_id']).first()
                if not loc:
                    raise exceptions.ValidationError({'location_id': 'Invalid location.'})
                aff.location = loc
            aff.fee = _validate_fee(chamber_data.get('fee', aff.fee))
            aff.chamber_type = chamber_data.get('chamber_type', aff.chamber_type)
            if 'advance_booking_days' in chamber_data:
                aff.advance_booking_days = chamber_data.get('advance_booking_days', aff.advance_booking_days)
            aff.save()
            _sync_schedules(aff, chamber_data.get('schedules', []))
        else:
            # Create
            loc_id = chamber_data.get('location_id')
            if not loc_id:
                raise exceptions.ValidationError({'location_id': 'location_id is required for new chambers.'})
            loc = Location.objects.filter(pk=loc_id).first()
            if not loc:
                raise exceptions.ValidationError({'location_id': 'Invalid location.'})
            if not is_super and not is_doctor_self and str(loc.id) not in managed_ids:
                raise exceptions.PermissionDenied('Location is outside your scope.')
            fee = _validate_fee(chamber_data.get('fee'))
            aff = DoctorAffiliation.objects.create(
                doctor=doctor,
                location=loc,
                fee=fee,
                chamber_type=chamber_data.get('chamber_type', 'Primary Chamber'),
                advance_booking_days=chamber_data.get('advance_booking_days', 14),
            )
            _sync_schedules(aff, chamber_data.get('schedules', []))

    # ---- Process removals (in-scope chambers not in payload) ----
    for sid, aff in existing.items():
        if sid not in payload_ids:
            if not in_scope(aff):
                continue  # out-of-scope chambers are untouched
            has_bookings = aff.bookings.exists()
            if has_bookings:
                aff.is_active = False
                aff.save(update_fields=['is_active'])
                deactivated.append(sid)
            else:
                aff.delete()
                deleted.append(sid)

    # ---- Validate overlaps across ALL active chambers ----
    _validate_all_overlaps(doctor)

    # ---- Return full chamber list ----
    from doctors.serializers import DoctorAffiliationSerializer
    all_affs = DoctorAffiliation.objects.filter(doctor=doctor).order_by('id')
    serializer = DoctorAffiliationSerializer(all_affs, many=True)
    return {
        'chambers': serializer.data,
        'deactivated': deactivated,
        'deleted': deleted,
    }


def _sync_schedules(affiliation, schedules_payload):
    """Sync schedules for one chamber. Deletes schedules not in payload."""
    existing = {str(s.id): s for s in affiliation.schedules.all()}
    payload_ids = set()

    for sched_data in schedules_payload:
        sched_id = sched_data.get('id')
        if sched_id:
            sched = existing.get(str(sched_id))
            if sched is None:
                raise exceptions.ValidationError({'schedules': f'Schedule {sched_id} not found.'})
            payload_ids.add(str(sched_id))
            sched.day_of_week = sched_data.get('day_of_week', sched.day_of_week)
            sched.start_time = _validate_time(sched_data.get('start_time', sched.start_time), 'start_time')
            sched.end_time = _validate_time(sched_data.get('end_time', sched.end_time), 'end_time')
            sched.max_patients = sched_data.get('max_patients', sched.max_patients)
            sched.avg_consult_minutes = sched_data.get('avg_consult_minutes', sched.avg_consult_minutes)
            sched.save()
        else:
            from django.core.exceptions import ValidationError as DjangoValidationError
            try:
                sched = AffiliationSchedule.objects.create(
                    affiliation=affiliation,
                    day_of_week=sched_data.get('day_of_week', 'Monday'),
                    start_time=_validate_time(sched_data.get('start_time', '09:00'), 'start_time'),
                    end_time=_validate_time(sched_data.get('end_time', '13:00'), 'end_time'),
                    max_patients=sched_data.get('max_patients', 30),
                    avg_consult_minutes=sched_data.get('avg_consult_minutes', 10),
                )
            except DjangoValidationError as e:
                raise exceptions.ValidationError({'schedules': e.messages})
            payload_ids.add(str(sched.id))

    # Remove schedules not in payload
    for sid, sched in existing.items():
        if sid not in payload_ids:
            from bookings.models import DoctorBooking
            today = timezone.localdate()
            future_bookings = DoctorBooking.objects.filter(
                schedule=sched, date__gte=today
            ).exclude(status='cancelled').count()
            if future_bookings > 0:
                raise exceptions.ValidationError({
                    'schedules': f'Schedule {sched.day_of_week} {sched.start_time}-{sched.end_time} '
                                 f'has {future_bookings} future booking(s). Cancel bookings first.'
                })
            sched.delete()


def _validate_all_overlaps(doctor):
    """Check schedule overlaps across all active chambers of the doctor."""
    active_schedules = AffiliationSchedule.objects.filter(
        affiliation__doctor=doctor,
        affiliation__is_active=True,
    ).select_related('affiliation__location')

    seen = {}
    for sched in active_schedules:
        key = (sched.day_of_week, sched.start_time, sched.end_time)
        for other_key, other_sched in seen.items():
            if (sched.day_of_week == other_key[0] and
                    sched.start_time < other_key[2] and
                    sched.end_time > other_key[1]):
                loc1 = sched.affiliation.location.display_name
                loc2 = other_sched.affiliation.location.display_name
                raise exceptions.ValidationError({
                    'schedules': f'Schedule overlap on {sched.day_of_week}: '
                                 f'{sched.start_time}-{sched.end_time} at {loc1} '
                                 f'conflicts with {other_key[1]}-{other_key[2]} at {loc2}.'
                })
        seen[key] = sched
