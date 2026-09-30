from datetime import datetime
from django.db import migrations


def forwards_func(apps, schema_editor):
    DoctorBooking = apps.get_model('bookings', 'DoctorBooking')
    AffiliationSchedule = apps.get_model('doctors', 'AffiliationSchedule')

    for booking in DoctorBooking.objects.all():
        if not getattr(booking, 'slot', None):
            continue
        parsed_time = None
        for fmt in ('%H:%M', '%H:%M:%S', '%I:%M %p', '%I:%M%p'):
            try:
                parsed_time = datetime.strptime(booking.slot.strip(), fmt).time()
                break
            except ValueError:
                continue

        if not parsed_time:
            continue

        booking.estimated_time = parsed_time

        if booking.date and booking.affiliation_id:
            weekday = booking.date.strftime('%A')
            sched = AffiliationSchedule.objects.filter(
                affiliation_id=booking.affiliation_id,
                day_of_week=weekday,
                start_time__lte=parsed_time,
                end_time__gte=parsed_time
            ).first()

            if sched:
                booking.schedule = sched
                booking.session_key = f"s:{sched.id}"
                booking.session_start = sched.start_time
                booking.session_end = sched.end_time

        booking.save(update_fields=['estimated_time', 'schedule', 'session_key', 'session_start', 'session_end'])


def backwards_func(apps, schema_editor):
    pass


class Migration(migrations.Migration):
    dependencies = [
        ('bookings', '0009_remove_doctorbooking_unique_doctor_date_serial_and_more'),
        ('doctors', '0022_remove_doctoraffiliation_status_label_and_more'),
    ]

    operations = [
        migrations.RunPython(forwards_func, backwards_func),
    ]
