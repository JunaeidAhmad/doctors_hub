from datetime import datetime
from django.core.exceptions import ValidationError

def validate_slot_against_schedule(affiliation, date_obj, slot_str):
    """
    Validates that `slot_str` is a valid time slot according to the `affiliation`'s schedules
    on the day of the week for `date_obj`.
    """
    day_name = date_obj.strftime("%A")
    schedules = affiliation.schedules.filter(day_of_week=day_name)
    
    if not schedules.exists():
        raise ValidationError(f"Doctor is not scheduled for {day_name}s.")

    try:
        slot_time = datetime.strptime(slot_str, "%H:%M").time()
    except ValueError:
        try:
            slot_time = datetime.strptime(slot_str, "%H:%M:%S").time()
        except ValueError:
            raise ValidationError("Slot must be in HH:MM format.")

    for schedule in schedules:
        if schedule.start_time <= slot_time <= schedule.end_time:
            return True

    raise ValidationError(f"Slot {slot_str} is not within the doctor's scheduled hours on {day_name}.")
