import uuid
from django.db import models
from core.uuid7 import uuid7
from facilities.models import Location
from django.utils.text import slugify


class DoctorSpecialty(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid7, editable=False)
    name = models.CharField(max_length=100, unique=True)
    canonical_name = models.CharField(max_length=100, unique=True, blank=True)
    bn_name = models.CharField(max_length=100, blank=True, default='')
    slug = models.SlugField(max_length=120, unique=True, blank=True)
    icon = models.CharField(max_length=50, default='Stethoscope')
    description = models.TextField(blank=True)
    components = models.ManyToManyField(
        "self",
        symmetrical=False,
        related_name="compound_specialties",
        blank=True,
        help_text="For compound specialties: the canonical specialties it covers. For simple ones: just itself."
    )

    def save(self, *args, **kwargs):
        if not self.canonical_name:
            self.canonical_name = self.name
        if not self.slug:
            base_slug = slugify(self.canonical_name) or slugify(self.name) or "specialty"
            slug = base_slug
            counter = 1
            while DoctorSpecialty.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class SpecialtyAlias(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid7, editable=False)
    specialty = models.ForeignKey(DoctorSpecialty, related_name='aliases', on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    normalized = models.CharField(max_length=100, db_index=True)
    language = models.CharField(max_length=2, choices=(('bn', 'Bengali'), ('en', 'English')), blank=True)
    is_verified = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Specialty Alias'
        verbose_name_plural = 'Specialty Aliases'
        constraints = [
            models.UniqueConstraint(fields=['normalized'], name='uniq_alias_global'),
        ]

    def save(self, *args, **kwargs):
        if not self.normalized:
            from doctors.services.specialty_resolver import normalize_text
            self.normalized = normalize_text(self.name)
        if not self.language:
            from doctors.services.specialty_resolver import detect_language
            self.language = detect_language(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} -> {self.specialty.name} ({'verified' if self.is_verified else 'unverified'})"


class Doctor(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid7, editable=False)
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
    academic_title = models.CharField(max_length=150, blank=True, default='')
    institution = models.CharField(max_length=250, blank=True, default='')
    specialties = models.ManyToManyField(DoctorSpecialty, related_name='doctors')
    qualification = models.TextField()
    experience = models.CharField(max_length=50, null=True, blank=True, default='')
    about = models.TextField(blank=True, default='')
    clinical_services = models.TextField(blank=True, default='', help_text="Clinical services offered by the doctor")
    is_verified = models.BooleanField(default=False, db_index=True)
    image = models.ImageField(upload_to="doctors/images/", blank=True, null=True)
    gender = models.CharField(
        max_length=20,
        choices=[('Male', 'Male'), ('Female', 'Female'), ('Other', 'Other')],
        default='Male',
        blank=True
    )
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=4.90, blank=True, null=True)
    review_count = models.PositiveIntegerField(default=120, blank=True)
    status = models.CharField(max_length=50, default='Active', blank=True)

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.name)
            slug = base_slug
            if Doctor.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base_slug}-{uuid7().hex[:6]}"
            self.slug = slug
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Dr. {self.name}"



class DoctorAffiliation(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid7, editable=False)
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name="affiliations")
    location = models.ForeignKey(Location, on_delete=models.CASCADE, related_name="affiliations")
    fee = models.DecimalField(max_digits=8, decimal_places=2)
    chamber_type = models.CharField(max_length=100, default='Primary Chamber', blank=True)
    status_label = models.CharField(max_length=100, default='Available Today', blank=True)

    def __str__(self):
        return f"{self.doctor.name} @ {self.location.name}"


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
    id = models.UUIDField(primary_key=True, default=uuid7, editable=False)
    affiliation = models.ForeignKey(DoctorAffiliation, on_delete=models.CASCADE, related_name='schedules')
    day_of_week = models.CharField(max_length=20, choices=DAY_CHOICES)
    start_time = models.TimeField()
    end_time = models.TimeField()

    def clean(self):
        from django.core.exceptions import ValidationError
        if self.start_time and self.end_time and self.start_time >= self.end_time:
            raise ValidationError({"end_time": "End time must be after start time."})

        aff = getattr(self, 'affiliation', None)
        if aff and self.day_of_week and self.start_time and self.end_time:
            doctor_id = aff.doctor_id
            conflict_qs = AffiliationSchedule.objects.filter(
                affiliation__doctor_id=doctor_id,
                day_of_week=self.day_of_week,
                start_time__lt=self.end_time,
                end_time__gt=self.start_time
            )
            if self.pk:
                conflict_qs = conflict_qs.exclude(pk=self.pk)
            if conflict_qs.exists():
                conflict = conflict_qs.select_related('affiliation__location').first()
                loc_name = conflict.affiliation.location.name if (conflict.affiliation and conflict.affiliation.location) else "another location"
                raise ValidationError(
                    f"Schedule conflict on {self.day_of_week}: Overlaps with existing slot ({conflict.start_time.strftime('%H:%M')} - {conflict.end_time.strftime('%H:%M')}) at {loc_name}."
                )

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.affiliation.doctor.name} - {self.day_of_week} ({self.start_time}-{self.end_time})"
