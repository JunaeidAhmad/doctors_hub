import uuid
from django.db import models
from facilities.models import Location
from django.utils.text import slugify


class DoctorSpecialty(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=120, unique=True, blank=True)
    icon = models.CharField(max_length=50, default='Stethoscope')
    description = models.TextField(blank=True)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Doctor(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        "accounts.User",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="doctor_profile",
    )
    bmdc_number = models.CharField(max_length=50, unique=True, null=True, blank=True)
    name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=250, unique=True, blank=True)
    specialties = models.ManyToManyField(DoctorSpecialty, related_name='doctors')
    qualification = models.TextField()
    experience = models.CharField(max_length=50)
    description = models.TextField(blank=True)
    is_verified = models.BooleanField(default=False)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Dr. {self.name}"



class DoctorAffiliation(models.Model):
    CONSULTATION_TYPES = [
        ("In-patient", "In-patient"),
        ("Chamber", "Chamber"),
        ("Doctor", "Doctor"),
        ("OPD", "OPD"),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name="affiliations")
    location = models.ForeignKey(Location, on_delete=models.CASCADE, related_name="affiliations")
    consultation_type = models.CharField(max_length=50, choices=CONSULTATION_TYPES, default="Chamber")
    fee = models.DecimalField(max_digits=8, decimal_places=2)

    def __str__(self):
        return f"{self.doctor.name} @ {self.location.name} ({self.consultation_type})"


class AffiliationSchedule(models.Model):
    DAY_CHOICES = [
        ('Monday', 'Monday'),
        ('Tuesday', 'Tuesday'),
        ('Wednesday', 'Wednesday'),
        ('Thursday', 'Thursday'),
        ('Friday', 'Friday'),
        ('Saturday', 'Saturday'),
        ('Sunday', 'Sunday'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    affiliation = models.ForeignKey(DoctorAffiliation, on_delete=models.CASCADE, related_name='schedules')
    day_of_week = models.CharField(max_length=20, choices=DAY_CHOICES)
    start_time = models.TimeField()
    end_time = models.TimeField()

    def __str__(self):
        return f"{self.affiliation.doctor.name} - {self.day_of_week} ({self.start_time}-{self.end_time})"
