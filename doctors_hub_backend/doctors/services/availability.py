import datetime
from dataclasses import dataclass
from typing import Optional, List, Dict, Any
from django.utils import timezone
from django.db.models import Count, Max, Q
from facilities.serializers_summary import FacilitySummarySerializer


@dataclass
class Session:
    key: str
    start: datetime.time
    end: datetime.time
    capacity: int
    avg_minutes: int
    schedule_id: Optional[str] = None
    exception_id: Optional[str] = None
    cancelled: bool = False
    note: str = ""


def round_up_time_to_5_minutes(t: datetime.time) -> datetime.time:
    """Rounds up a time to the nearest 5-minute increment."""
    extra_minutes = (5 - (t.minute % 5)) % 5
    if extra_minutes == 0 and t.second == 0 and t.microsecond == 0:
        return datetime.time(t.hour, t.minute)
    
    dt = datetime.datetime(2000, 1, 1, t.hour, t.minute, 0)
    dt += datetime.timedelta(minutes=extra_minutes if extra_minutes != 0 else 5)
    if dt.date() > datetime.date(2000, 1, 1):
        return datetime.time(23, 59)
    return dt.time()


def add_minutes_to_time(t: datetime.time, minutes: int) -> datetime.time:
    dt = datetime.datetime(2000, 1, 1, t.hour, t.minute, 0) + datetime.timedelta(minutes=minutes)
    if dt.date() > datetime.date(2000, 1, 1):
        return datetime.time(23, 59)
    return dt.time()


def resolve_sessions(
    affiliation,
    date: datetime.date,
    schedules: List[Any],
    exceptions: List[Any]
) -> List[Session]:
    """
    Pure function resolving all bookable sessions for an affiliation on a given date.
    Starts from weekly schedules for that weekday, applies cancel/modify exceptions,
    and appends extra exceptions.
    """
    weekday = date.strftime('%A')
    
    # 1. Weekly schedules for this weekday
    sessions_dict: Dict[str, Session] = {}
    for s in schedules:
        if s.day_of_week.strip().lower() == weekday.lower():
            key = f"s:{s.id}"
            sessions_dict[key] = Session(
                key=key,
                start=s.start_time,
                end=s.end_time,
                capacity=s.max_patients or 30,
                avg_minutes=s.avg_consult_minutes or 10,
                schedule_id=str(s.id),
                exception_id=None,
                cancelled=False,
                note=""
            )

    # 2. Exceptions for this date
    for exc in exceptions:
        if exc.date != date:
            continue

        if exc.kind == 'cancel' and exc.schedule_id:
            key = f"s:{exc.schedule_id}"
            if key in sessions_dict:
                sessions_dict[key].cancelled = True
                sessions_dict[key].exception_id = str(exc.id)
                if exc.note:
                    sessions_dict[key].note = exc.note
        elif exc.kind == 'modify' and exc.schedule_id:
            key = f"s:{exc.schedule_id}"
            if key in sessions_dict:
                session = sessions_dict[key]
                session.exception_id = str(exc.id)
                if exc.start_time:
                    session.start = exc.start_time
                if exc.end_time:
                    session.end = exc.end_time
                if exc.max_patients is not None:
                    session.capacity = exc.max_patients
                if exc.avg_consult_minutes is not None:
                    session.avg_minutes = exc.avg_consult_minutes
                if exc.note:
                    session.note = exc.note
        elif exc.kind == 'extra':
            key = f"x:{exc.id}"
            sessions_dict[key] = Session(
                key=key,
                start=exc.start_time,
                end=exc.end_time,
                capacity=exc.max_patients or 30,
                avg_minutes=exc.avg_consult_minutes or 10,
                schedule_id=None,
                exception_id=str(exc.id),
                cancelled=False,
                note=exc.note or ""
            )

    result = list(sessions_dict.values())
    result.sort(key=lambda s: s.start)
    return result


def compute_estimated_time(
    session_start: datetime.time,
    booked_count: int,
    avg_minutes: int,
    date: datetime.date,
    now: datetime.datetime
) -> datetime.time:
    """Computes estimated consult time for next serial in session."""
    raw_time = add_minutes_to_time(session_start, booked_count * avg_minutes)
    today = now.date()
    if date == today:
        now_time_rounded = round_up_time_to_5_minutes(now.time())
        if raw_time < now_time_rounded:
            return now_time_rounded
    return raw_time


def get_availability(affiliation, start_date: datetime.date, days: int = 7) -> Dict[str, Any]:
    """
    Returns full availability structure for an affiliation from start_date for N days.
    """
    from bookings.models import DoctorBooking
    from doctors.models import ScheduleException

    now = timezone.localtime()
    today = now.date()

    if start_date < today:
        start_date = today

    max_days = affiliation.advance_booking_days or 14
    effective_days = min(days, max_days)
    end_date = start_date + datetime.timedelta(days=effective_days - 1)

    # 1. Fetch weekly schedules
    schedules = list(affiliation.schedules.all())

    # 2. Fetch exceptions in range
    exceptions = list(
        ScheduleException.objects.filter(
            affiliation=affiliation,
            date__gte=start_date,
            date__lte=end_date
        )
    )

    # 3. Fetch booked counts and max serial grouped by (date, session_key)
    bookings_qs = (
        DoctorBooking.objects.filter(
            affiliation=affiliation,
            date__gte=start_date,
            date__lte=end_date
        )
        .exclude(status='cancelled')
        .values('date', 'session_key')
        .annotate(
            booked_count=Count('id'),
            max_serial=Max('serial_number')
        )
    )
    booking_map: Dict[tuple, Dict[str, int]] = {
        (b['date'], b['session_key']): {
            'booked': b['booked_count'],
            'max_serial': b['max_serial'] or 0
        }
        for b in bookings_qs
    }

    dates_list = []
    first_available = None

    for day_offset in range(effective_days):
        current_date = start_date + datetime.timedelta(days=day_offset)
        if current_date < today:
            continue
        if (current_date - today).days > max_days:
            break

        weekday_name = current_date.strftime('%A')
        sessions = resolve_sessions(affiliation, current_date, schedules, exceptions)

        session_items = []
        for s in sessions:
            b_info = booking_map.get((current_date, s.key), {'booked': 0, 'max_serial': 0})
            booked = b_info['booked']
            max_serial = b_info['max_serial']
            remaining = max(0, s.capacity - booked)
            next_serial = max_serial + 1

            # Status resolution
            if s.cancelled:
                status = 'closed'
            elif current_date == today and now.time() >= s.end:
                status = 'ended'
            elif booked >= s.capacity:
                status = 'full'
            else:
                status = 'available'

            est_time = compute_estimated_time(s.start, booked, s.avg_minutes, current_date, now)

            session_dict = {
                'session_key': s.key,
                'session_start': s.start.strftime('%H:%M'),
                'session_end': s.end.strftime('%H:%M'),
                'capacity': s.capacity,
                'booked': booked,
                'remaining': remaining,
                'next_serial': next_serial,
                'estimated_time': est_time.strftime('%H:%M'),
                'status': status,
                'note': s.note or ""
            }
            session_items.append(session_dict)

            if status == 'available' and first_available is None:
                first_available = {
                    'date': current_date.strftime('%Y-%m-%d'),
                    'session_key': s.key,
                    'session_start': s.start.strftime('%H:%M'),
                    'estimated_time': est_time.strftime('%H:%M'),
                    'remaining': remaining
                }

        dates_list.append({
            'date': current_date.strftime('%Y-%m-%d'),
            'weekday': weekday_name,
            'sessions': session_items
        })

    facility_summary = FacilitySummarySerializer(affiliation.location).data

    return {
        'affiliation_id': str(affiliation.id),
        'doctor_id': str(affiliation.doctor_id),
        'facility': facility_summary,
        'fee': f"{affiliation.fee:.2f}",
        'timezone': 'Asia/Dhaka',
        'next_available': first_available,
        'dates': dates_list
    }


def batch_next_available(affiliations: List[Any], days: int = 7) -> Dict[str, Optional[Dict[str, Any]]]:
    """
    Computes next_available for multiple affiliations with a constant number of queries (3).
    Used by list endpoints.
    """
    if not affiliations:
        return {}

    from bookings.models import DoctorBooking
    from doctors.models import AffiliationSchedule, ScheduleException

    now = timezone.localtime()
    today = now.date()
    end_date = today + datetime.timedelta(days=days - 1)

    affiliation_ids = [a.id for a in affiliations]
    advance_days_map = {str(a.id): (a.advance_booking_days or 14) for a in affiliations}

    # Query 1: All weekly schedules
    schedules = AffiliationSchedule.objects.filter(affiliation_id__in=affiliation_ids)
    sched_map: Dict[str, List[Any]] = {}
    for s in schedules:
        sched_map.setdefault(str(s.affiliation_id), []).append(s)

    # Query 2: All exceptions in range
    exceptions = ScheduleException.objects.filter(
        affiliation_id__in=affiliation_ids,
        date__gte=today,
        date__lte=end_date
    )
    exc_map: Dict[str, List[Any]] = {}
    for exc in exceptions:
        exc_map.setdefault(str(exc.affiliation_id), []).append(exc)

    # Query 3: All active bookings grouped
    bookings_qs = (
        DoctorBooking.objects.filter(
            affiliation_id__in=affiliation_ids,
            date__gte=today,
            date__lte=end_date
        )
        .exclude(status='cancelled')
        .values('affiliation_id', 'date', 'session_key')
        .annotate(
            booked_count=Count('id'),
            max_serial=Max('serial_number')
        )
    )
    booking_map: Dict[tuple, Dict[str, int]] = {
        (str(b['affiliation_id']), b['date'], b['session_key']): {
            'booked': b['booked_count'],
            'max_serial': b['max_serial'] or 0
        }
        for b in bookings_qs
    }

    result: Dict[str, Optional[Dict[str, Any]]] = {}

    for aff in affiliations:
        aff_id_str = str(aff.id)
        max_advance = advance_days_map.get(aff_id_str, 14)
        eff_days = min(days, max_advance)
        aff_scheds = sched_map.get(aff_id_str, [])
        aff_excs = exc_map.get(aff_id_str, [])

        next_avail = None

        for day_offset in range(eff_days):
            current_date = today + datetime.timedelta(days=day_offset)
            sessions = resolve_sessions(aff, current_date, aff_scheds, aff_excs)

            for s in sessions:
                b_info = booking_map.get((aff_id_str, current_date, s.key), {'booked': 0, 'max_serial': 0})
                booked = b_info['booked']
                remaining = max(0, s.capacity - booked)

                if s.cancelled:
                    status = 'closed'
                elif current_date == today and now.time() >= s.end:
                    status = 'ended'
                elif booked >= s.capacity:
                    status = 'full'
                else:
                    status = 'available'

                if status == 'available':
                    est_time = compute_estimated_time(s.start, booked, s.avg_minutes, current_date, now)
                    next_avail = {
                        'date': current_date.strftime('%Y-%m-%d'),
                        'session_key': s.key,
                        'session_start': s.start.strftime('%H:%M'),
                        'estimated_time': est_time.strftime('%H:%M'),
                        'remaining': remaining
                    }
                    break

            if next_avail:
                break

        result[aff_id_str] = next_avail

    return result
