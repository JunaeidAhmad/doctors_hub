import uuid
from django.db import models
from facilities.models import PracticeLocation
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

class Doctor(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    specialties = models.ManyToManyField(DoctorSpecialty, related_name='doctors')
    qualification = models.TextField()
    experience = models.CharField(max_length=50)

class DoctorAffiliation(models.Model):
    CONSULTATION_TYPES = [
        ("In-patient", "In-patient"),
        ("Chamber", "Chamber"),
        ("Doctor", "Doctor")
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name="affiliations")
    location = models.ForeignKey(PracticeLocation, on_delete=models.CASCADE, related_name="affiliations")
    consultation_type = models.CharField(max_length=50, choices=CONSULTATION_TYPES, default="Chamber")
    fee = models.DecimalField(max_digits=8, decimal_places=2)

class AffiliationSchedule(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    affiliation = models.ForeignKey(DoctorAffiliation, on_delete=models.CASCADE, related_name='schedules')
    day_of_week = models.CharField(max_length=20)
    start_time = models.TimeField()
    end_time = models.TimeField()
