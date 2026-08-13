import uuid
from django.db import models
from accounts.models import User
from doctors.models import DoctorAffiliation
from tests.models import FacilityTest
from services.scheduling import validate_slot_against_schedule

class BaseBooking(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        CONFIRMED = "confirmed", "Confirmed"
        CANCELLED = "cancelled", "Cancelled"
        COMPLETED = "completed", "Completed"
        NO_SHOW = "no_show", "No show"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="%(class)ss")
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True

class DoctorBooking(BaseBooking):
    affiliation = models.ForeignKey(DoctorAffiliation, on_delete=models.CASCADE, related_name="bookings")
    date = models.DateField()
    slot = models.CharField(max_length=50)
    patient_name = models.CharField(max_length=100)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["affiliation", "date", "slot"], name="unique_doctor_slot"),
        ]

    def clean(self):
        super().clean()
        if self.date and self.slot and getattr(self, 'affiliation', None):
            validate_slot_against_schedule(self.affiliation, self.date, self.slot)

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

class LabBooking(BaseBooking):
    facility_test = models.ForeignKey(FacilityTest, on_delete=models.CASCADE, related_name="bookings")
    pickup_date = models.DateField()
    patient_name = models.CharField(max_length=100)
    patient_phone = models.CharField(max_length=20)
    address = models.TextField()
