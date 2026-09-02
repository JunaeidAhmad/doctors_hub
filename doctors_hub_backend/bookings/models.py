import uuid
from django.db import models
from django.utils import timezone
from accounts.models import User
from doctors.models import DoctorAffiliation
from tests.models import FacilityTest
from facilities.models import Hospital, HospitalService
from services.scheduling import validate_slot_against_schedule
from core.validators import bangladesh_phone_validator


class Patient(models.Model):
    class Gender(models.TextChoices):
        MALE = "male", "Male"
        FEMALE = "female", "Female"
        OTHER = "other", "Other"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=150)
    phone = models.CharField(max_length=20, unique=True, validators=[bangladesh_phone_validator], db_index=True)
    age = models.PositiveIntegerField(null=True, blank=True)
    gender = models.CharField(max_length=10, choices=Gender.choices, blank=True)
    address = models.TextField(blank=True)
    blood_group = models.CharField(max_length=10, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} ({self.phone})"


class OTPVerification(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    phone = models.CharField(max_length=20, validators=[bangladesh_phone_validator], db_index=True)
    otp_code = models.CharField(max_length=6)
    purpose = models.CharField(max_length=50, default='booking')
    is_verified = models.BooleanField(default=False)
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    attempts = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['-created_at']

    def is_expired(self):
        return timezone.now() > self.expires_at

    def __str__(self):
        status = "Verified" if self.is_verified else ("Expired" if self.is_expired() else "Active")
        return f"{self.phone} - {self.otp_code} ({status})"


class BaseBooking(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        CONFIRMED = "confirmed", "Confirmed"
        CANCELLED = "cancelled", "Cancelled"
        COMPLETED = "completed", "Completed"
        NO_SHOW = "no_show", "No show"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name="%(class)ss", null=True, blank=True)
    booked_by_user = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name="booked_%(class)ss")
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True

    @property
    def user(self):
        return self.booked_by_user


class DoctorBooking(BaseBooking):
    affiliation = models.ForeignKey(DoctorAffiliation, on_delete=models.CASCADE, related_name="bookings")
    date = models.DateField()
    slot = models.CharField(max_length=50)
    serial_number = models.PositiveIntegerField(null=True, blank=True, db_index=True)
    patient_name = models.CharField(max_length=100, blank=True)
    patient_phone = models.CharField(max_length=20, blank=True, default="", validators=[bangladesh_phone_validator])

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["affiliation", "date", "serial_number"], name="unique_doctor_date_serial"),
        ]
        ordering = ["date", "serial_number", "-created_at"]

    @property
    def serial_display(self):
        if self.serial_number:
            return f"SL-{self.serial_number:03d}"
        return ""

    def clean(self):
        super().clean()
        if self.date and self.slot and getattr(self, 'affiliation', None):
            validate_slot_against_schedule(self.affiliation, self.date, self.slot)

    def save(self, *args, **kwargs):
        if not self.serial_number and self.affiliation_id and self.date:
            last_serial = DoctorBooking.objects.filter(
                affiliation_id=self.affiliation_id,
                date=self.date
            ).aggregate(models.Max('serial_number'))['serial_number__max']
            self.serial_number = (last_serial or 0) + 1

        if self.patient:
            if not self.patient_name:
                self.patient_name = self.patient.name
            if not self.patient_phone:
                self.patient_phone = self.patient.phone
        elif self.patient_phone and self.patient_name:
            patient_obj, _ = Patient.objects.get_or_create(
                phone=self.patient_phone,
                defaults={'name': self.patient_name}
            )
            self.patient = patient_obj

        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        doc_name = self.affiliation.doctor.name if self.affiliation and self.affiliation.doctor else "Doctor"
        return f"Serial #{self.serial_number} - {self.patient_name} with Dr. {doc_name} ({self.date})"


class TestBooking(BaseBooking):
    facility_test = models.ForeignKey(FacilityTest, on_delete=models.CASCADE, related_name="bookings")
    pickup_date = models.DateField()
    patient_name = models.CharField(max_length=100, blank=True)
    patient_phone = models.CharField(max_length=20, default="", validators=[bangladesh_phone_validator])
    pickup_address_line = models.CharField(max_length=300, default="")
    pickup_area = models.CharField(max_length=100, blank=True, default="")
    pickup_city = models.CharField(max_length=100, blank=True, default="")
    pickup_district = models.CharField(max_length=100, default="Dhaka")

    class Meta:
        ordering = ["-pickup_date", "-created_at"]

    @property
    def full_pickup_address(self):
        parts = [self.pickup_address_line, self.pickup_area, self.pickup_city, self.pickup_district]
        return ", ".join([p for p in parts if p])

    @property
    def address(self):
        return self.full_pickup_address

    def save(self, *args, **kwargs):
        if self.patient:
            if not self.patient_name:
                self.patient_name = self.patient.name
            if not self.patient_phone:
                self.patient_phone = self.patient.phone
        elif self.patient_phone and self.patient_name:
            patient_obj, _ = Patient.objects.get_or_create(
                phone=self.patient_phone,
                defaults={'name': self.patient_name}
            )
            self.patient = patient_obj
        super().save(*args, **kwargs)

    def __str__(self):
        test_name = self.facility_test.test.name if self.facility_test and self.facility_test.test else "Test"
        return f"Test Booking - {self.patient_name} ({test_name} on {self.pickup_date})"


class HospitalServiceBooking(BaseBooking):
    hospital = models.ForeignKey(Hospital, on_delete=models.CASCADE, related_name="service_bookings")
    service = models.ForeignKey(HospitalService, on_delete=models.CASCADE, related_name="bookings")
    booking_date = models.DateField()
    preferred_time = models.CharField(max_length=50, blank=True)
    patient_name = models.CharField(max_length=100, blank=True)
    patient_phone = models.CharField(max_length=20, default="", validators=[bangladesh_phone_validator])

    class Meta:
        ordering = ["-booking_date", "-created_at"]

    def clean(self):
        super().clean()
        if self.hospital_id and self.service_id:
            if not self.hospital.services.filter(pk=self.service_id).exists():
                from django.core.exceptions import ValidationError
                raise ValidationError({"service": f"Service '{self.service.name}' is not offered by {self.hospital.location.name}."})

    def save(self, *args, **kwargs):
        if self.patient:
            if not self.patient_name:
                self.patient_name = self.patient.name
            if not self.patient_phone:
                self.patient_phone = self.patient.phone
        elif self.patient_phone and self.patient_name:
            patient_obj, _ = Patient.objects.get_or_create(
                phone=self.patient_phone,
                defaults={'name': self.patient_name}
            )
            self.patient = patient_obj
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        hosp_name = self.hospital.location.name if self.hospital and self.hospital.location else "Hospital"
        svc_name = self.service.name if self.service else "Service"
        return f"{svc_name} @ {hosp_name} - {self.patient_name} ({self.booking_date})"


# Backward-compatible alias
LabBooking = TestBooking
