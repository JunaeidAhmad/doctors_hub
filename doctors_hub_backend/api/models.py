import uuid
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.utils import timezone
from django.utils.text import slugify


class UserManager(BaseUserManager):
    def create_user(self, phone_number, password=None, **extra_fields):
        if not phone_number:
            raise ValueError('The Phone Number must be set')
        user = self.model(phone_number=phone_number, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, phone_number, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(phone_number, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    phone_number = models.CharField(max_length=15, unique=True)
    first_name = models.CharField(max_length=50, blank=True)
    last_name = models.CharField(max_length=50, blank=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)

    objects = UserManager()

    USERNAME_FIELD = 'phone_number'
    REQUIRED_FIELDS = []

    def __str__(self):
        return self.phone_number


class DoctorSpecialty(models.Model):
    """Doctor Specialty"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=120, unique=True, blank=True)
    icon = models.CharField(max_length=50, default='Stethoscope')
    description = models.TextField(blank=True)

    class Meta:
        verbose_name_plural = "Doctor Specialties"

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class HospitalCategory(models.Model):
    """Hospital Category (formerly HospitalSpecialty)"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=120, unique=True, blank=True)
    icon = models.CharField(max_length=50, default='Building2')
    description = models.TextField(blank=True)
    count = models.IntegerField(default=0)

    class Meta:
        verbose_name_plural = "Hospital Categories"

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Hospital(models.Model):
    """Hospital model for In-patient and OPD Multi-Specialty Institutes"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=220, unique=True, blank=True)
    description = models.TextField(blank=True)
    logo = models.URLField(max_length=500, blank=True)
    image = models.URLField(max_length=500, blank=True)
    categories = models.ManyToManyField(HospitalCategory, related_name='hospitals', blank=True)
    address = models.CharField(max_length=300, blank=True)
    district = models.CharField(max_length=100, blank=True)
    division = models.CharField(max_length=100, blank=True)
    city = models.CharField(max_length=100, blank=True)
    phone = models.CharField(max_length=50, blank=True)
    email = models.EmailField(blank=True)
    rating = models.FloatField(default=0.0)
    reviews_count = models.IntegerField(default=0)
    open_timing = models.CharField(max_length=100, blank=True)
    tagline = models.CharField(max_length=255, blank=True)
    badge = models.CharField(max_length=50, blank=True)
    services = models.JSONField(default=list, blank=True)
    is_verified = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class TestCategory(models.Model):
    """
    Self-referencing category tree for LAB TESTS.
    Works for both top-level categories (Pathology) and 
    sub-categories (Hematology) — same model, parent=null vs parent=set.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=150)
    slug = models.SlugField(max_length=170, unique=True, blank=True)
    parent = models.ForeignKey(
        'self',
        null=True,
        blank=True,
        related_name='children',
        on_delete=models.CASCADE
    )
    icon = models.CharField(max_length=100, blank=True)  # optional, for UI
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    order = models.PositiveIntegerField(default=0)  # for display sorting

    class Meta:
        verbose_name_plural = "Test Categories"
        ordering = ['order', 'name']

    def __str__(self):
        return f"{self.parent.name} > {self.name}" if self.parent else self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    @property
    def is_leaf_level(self):
        """True if no children — meaning Tests attach directly here."""
        return not self.children.exists()


class Test(models.Model):
    """
    Individual test (CBC, ECG, MRI Brain, etc).
    Always belongs to a category — could be a top-level category 
    (if it has no subcategories) or a leaf subcategory.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    category = models.ForeignKey(
        TestCategory,
        related_name='tests',
        on_delete=models.CASCADE
    )
    name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=220, unique=True, blank=True)
    code = models.CharField(max_length=50, blank=True)  # internal/lab code
    description = models.TextField(blank=True)
    sample_type = models.CharField(max_length=100, blank=True)  # Blood, Urine, etc
    preparation_instructions = models.TextField(blank=True)  # "Fasting 8-12 hrs"
    fasting_required = models.BooleanField(default=False)
    report_time_hours = models.PositiveIntegerField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class DiagnosticCenterCategory(models.Model):
    """
    Separate tree for CENTER classification 
    (Government, Private Chain, Specialized-Cardiac, etc).
    Same self-referencing pattern, kept independent from TestCategory.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=150)
    slug = models.SlugField(max_length=170, unique=True, blank=True)
    parent = models.ForeignKey(
        'self', null=True, blank=True,
        related_name='children', on_delete=models.CASCADE
    )
    icon = models.CharField(max_length=100, blank=True)
    description = models.TextField(blank=True)

    class Meta:
        verbose_name_plural = "Diagnostic Center Categories"

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.parent.name} > {self.name}" if self.parent else self.name


class DiagnosticCenter(models.Model):
    """Diagnostic Center model separate from Hospitals"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=250)
    slug = models.SlugField(max_length=270, unique=True, blank=True)
    categories = models.ManyToManyField(
        DiagnosticCenterCategory,
        related_name='centers',
        blank=True
    )
    address = models.CharField(max_length=300)
    district = models.CharField(max_length=100)
    division = models.CharField(max_length=100)
    phone = models.CharField(max_length=50, blank=True)
    email = models.EmailField(blank=True)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    logo = models.URLField(max_length=500, blank=True)
    image = models.URLField(max_length=500, blank=True)
    tagline = models.CharField(max_length=255, blank=True)
    badge = models.CharField(max_length=50, blank=True)
    rating = models.FloatField(default=0.0)
    reviews_count = models.IntegerField(default=0)
    open_timing = models.CharField(max_length=100, blank=True)
    services = models.JSONField(default=list, blank=True)
    description = models.TextField(blank=True)
    is_verified = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    tests = models.ManyToManyField(
        Test,
        through='DiagnosticCenterTest',
        related_name='centers'
    )

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class DiagnosticCenterTest(models.Model):
    """
    THROUGH model — this is the key piece.
    Same test costs differently at different centers, 
    and not every center offers every test.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    center = models.ForeignKey(DiagnosticCenter, on_delete=models.CASCADE, related_name='offered_tests')
    test = models.ForeignKey(Test, on_delete=models.CASCADE, related_name='offered_at')
    price = models.DecimalField(max_digits=10, decimal_places=2)
    discounted_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    original_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    discount = models.CharField(max_length=50, blank=True)
    report_time = models.CharField(max_length=100, blank=True)
    is_available = models.BooleanField(default=True)
    home_sample_collection = models.BooleanField(default=False)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('center', 'test')

    def __str__(self):
        return f"{self.test.name} @ {self.center.name} — ৳{self.price}"


class Doctor(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    specialties = models.ManyToManyField(DoctorSpecialty, related_name='doctors')
    qualification = models.TextField()
    experience = models.CharField(max_length=50)

    def __str__(self):
        return self.name


class DoctorAffiliation(models.Model):
    CONSULTATION_TYPES = [
        ('OPD', 'OPD'),
        ('In-patient', 'In-patient'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name='affiliations')
    hospital = models.ForeignKey(Hospital, on_delete=models.CASCADE, related_name='affiliated_doctors', null=True, blank=True)
    diagnostic_center = models.ForeignKey(DiagnosticCenter, on_delete=models.CASCADE, related_name='affiliated_doctors', null=True, blank=True)
    consultation_type = models.CharField(max_length=50, choices=CONSULTATION_TYPES, default='OPD')
    fee = models.DecimalField(max_digits=8, decimal_places=2)

    def __str__(self):
        facility = self.hospital.name if self.hospital else (self.diagnostic_center.name if self.diagnostic_center else "Facility")
        return f"{self.doctor.name} at {facility} ({self.consultation_type})"


class AffiliationSchedule(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    affiliation = models.ForeignKey(DoctorAffiliation, on_delete=models.CASCADE, related_name='schedules')
    day_of_week = models.CharField(max_length=20)  # e.g. "Sat", "Mon", "Everyday"
    start_time = models.TimeField()
    end_time = models.TimeField()

    def __str__(self):
        return f"{self.affiliation.doctor.name} - {self.day_of_week} ({self.start_time} - {self.end_time})"


class DoctorBooking(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='doctor_bookings')
    affiliation = models.ForeignKey(DoctorAffiliation, on_delete=models.CASCADE, related_name='bookings')
    date = models.DateField()
    slot = models.CharField(max_length=50)
    patient_name = models.CharField(max_length=100)
    status = models.CharField(max_length=50, default='Confirmed')
    created_at = models.DateTimeField(auto_now_add=True)


class LabBooking(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='lab_bookings')
    center_test = models.ForeignKey(DiagnosticCenterTest, on_delete=models.CASCADE, related_name='bookings', null=True, blank=True)
    pickup_date = models.DateField()
    patient_name = models.CharField(max_length=100)
    patient_phone = models.CharField(max_length=20)
    address = models.TextField()
    status = models.CharField(max_length=50, default='Confirmed')
    created_at = models.DateTimeField(auto_now_add=True)
