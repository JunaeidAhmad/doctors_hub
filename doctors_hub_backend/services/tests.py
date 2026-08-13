import pytest
from datetime import datetime
from django.core.exceptions import ValidationError
from services.scheduling import validate_slot_against_schedule

class MockSchedule:
    def __init__(self, day_of_week, start_time, end_time):
        self.day_of_week = day_of_week
        self.start_time = start_time
        self.end_time = end_time

class MockSchedules:
    def __init__(self, schedules):
        self._schedules = schedules

    def filter(self, day_of_week):
        filtered = [s for s in self._schedules if s.day_of_week == day_of_week]
        return MockSchedules(filtered)

    def exists(self):
        return len(self._schedules) > 0

    def __iter__(self):
        return iter(self._schedules)

class MockAffiliation:
    def __init__(self, schedules):
        self.schedules = MockSchedules(schedules)

def test_validate_slot_against_schedule_success():
    start_time = datetime.strptime("09:00", "%H:%M").time()
    end_time = datetime.strptime("17:00", "%H:%M").time()
    
    schedule = MockSchedule("Monday", start_time, end_time)
    affiliation = MockAffiliation([schedule])
    date_obj = datetime(2023, 10, 2) # A Monday
    
    assert validate_slot_against_schedule(affiliation, date_obj, "10:30") is True

def test_validate_slot_against_schedule_wrong_day():
    start_time = datetime.strptime("09:00", "%H:%M").time()
    end_time = datetime.strptime("17:00", "%H:%M").time()
    
    schedule = MockSchedule("Monday", start_time, end_time)
    affiliation = MockAffiliation([schedule])
    date_obj = datetime(2023, 10, 3) # A Tuesday
    
    with pytest.raises(ValidationError, match="Doctor is not scheduled for Tuesdays."):
        validate_slot_against_schedule(affiliation, date_obj, "10:30")

def test_validate_slot_against_schedule_out_of_hours():
    start_time = datetime.strptime("09:00", "%H:%M").time()
    end_time = datetime.strptime("17:00", "%H:%M").time()
    
    schedule = MockSchedule("Monday", start_time, end_time)
    affiliation = MockAffiliation([schedule])
    date_obj = datetime(2023, 10, 2) # A Monday
    
    with pytest.raises(ValidationError, match="not within the doctor's scheduled hours on Monday"):
        validate_slot_against_schedule(affiliation, date_obj, "18:00")
