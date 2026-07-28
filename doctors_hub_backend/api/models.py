from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.utils import timezone

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

class Hospital(models.Model):
    id = models.CharField(max_length=100, primary_key=True)
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    logo = models.URLField(max_length=500, blank=True)

    def __str__(self):
        return self.name

class Branch(models.Model):
    id = models.CharField(max_length=100, primary_key=True)
    hospital = models.ForeignKey(Hospital, on_delete=models.CASCADE, related_name='branches', null=True, blank=True)
    hospital_name = models.CharField(max_length=200, blank=True)
    name = models.CharField(max_length=200) # e.g. "Dhanmondi Branch"
    facility_types = models.JSONField(default=list) # e.g. ["Hospital", "Diagnostic Center"]
    location = models.CharField(max_length=255)
    city = models.CharField(max_length=100)
    verified = models.BooleanField(default=False)
    rating = models.FloatField(default=0.0)
    reviews_count = models.IntegerField(default=0)
    open_timing = models.CharField(max_length=100)
    contact_phone = models.CharField(max_length=100)
    tagline = models.CharField(max_length=255, blank=True)
    badge = models.CharField(max_length=50, blank=True)
    image = models.URLField(max_length=500, blank=True)
    services = models.JSONField(default=list)
    description = models.TextField(blank=True)
    specialty_category = models.CharField(max_length=100, blank=True)

    def __str__(self):
        h_prefix = f"{self.hospital_name} - " if self.hospital_name else ""
        return f"{h_prefix}{self.name} ({self.city})"

class Specialty(models.Model):
    """Doctor Specialty"""
    id = models.CharField(max_length=50, primary_key=True)
    name = models.CharField(max_length=100)
    icon = models.CharField(max_length=50, default='Stethoscope')
    description = models.TextField(blank=True)
    
    class Meta:
        verbose_name_plural = "Doctor Specialties"

    def __str__(self):
        return self.name

# Alias for clarity
DoctorSpecialty = Specialty

class HospitalSpecialty(models.Model):
    """Hospital Specialty / Category"""
    id = models.CharField(max_length=50, primary_key=True)
    name = models.CharField(max_length=100)
    icon = models.CharField(max_length=50, default='Building2')
    description = models.TextField(blank=True)
    count = models.IntegerField(default=0)

    class Meta:
        verbose_name_plural = "Hospital Specialties"

    def __str__(self):
        return self.name

class TestCategory(models.Model):
    """Pathology Test Category"""
    id = models.CharField(max_length=50, primary_key=True)
    name = models.CharField(max_length=100)
    icon = models.CharField(max_length=50, default='FlaskConical')
    description = models.TextField(blank=True)
    count = models.IntegerField(default=0)

    class Meta:
        verbose_name_plural = "Test Categories"

    def __str__(self):
        return self.name

class PathologyTest(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    name = models.CharField(max_length=150)
    category = models.CharField(max_length=100)
    test_category = models.ForeignKey(TestCategory, on_delete=models.SET_NULL, null=True, blank=True, related_name='tests')
    fasting_required = models.BooleanField(default=False)
    description = models.TextField(blank=True)

    def __str__(self):
        return self.name

class BranchTest(models.Model):
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='offered_tests')
    test = models.ForeignKey(PathologyTest, on_delete=models.CASCADE, related_name='offered_at')
    price = models.DecimalField(max_digits=10, decimal_places=2)
    original_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    discount = models.CharField(max_length=50, blank=True)
    report_time = models.CharField(max_length=100, blank=True)

    def __str__(self):
        return f"{self.test.name} @ {self.branch.name} - {self.price} BDT"

class Doctor(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    name = models.CharField(max_length=200)
    specialties = models.ManyToManyField(Specialty, related_name='doctors')
    qualification = models.TextField()
    experience = models.CharField(max_length=50)

    def __str__(self):
        return self.name

class DoctorAffiliation(models.Model):
    CONSULTATION_TYPES = [
        ('OPD', 'OPD'),
        ('In-patient', 'In-patient'),
    ]
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name='affiliations')
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='affiliated_doctors')
    consultation_type = models.CharField(max_length=50, choices=CONSULTATION_TYPES, default='OPD')
    fee = models.DecimalField(max_digits=8, decimal_places=2)

    def __str__(self):
        return f"{self.doctor.name} at {self.branch.name} ({self.consultation_type})"

class AffiliationSchedule(models.Model):
    affiliation = models.ForeignKey(DoctorAffiliation, on_delete=models.CASCADE, related_name='schedules')
    day_of_week = models.CharField(max_length=20) # e.g. "Sat", "Mon", "Everyday"
    start_time = models.TimeField()
    end_time = models.TimeField()

    def __str__(self):
        return f"{self.affiliation.doctor.name} - {self.day_of_week} ({self.start_time} - {self.end_time})"

class DoctorBooking(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='doctor_bookings')
    affiliation = models.ForeignKey(DoctorAffiliation, on_delete=models.CASCADE, related_name='bookings')
    date = models.DateField()
    slot = models.CharField(max_length=50)
    patient_name = models.CharField(max_length=100)
    status = models.CharField(max_length=50, default='Confirmed')
    created_at = models.DateTimeField(auto_now_add=True)

class LabBooking(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='lab_bookings')
    branch_test = models.ForeignKey(BranchTest, on_delete=models.CASCADE, related_name='bookings')
    pickup_date = models.DateField()
    patient_name = models.CharField(max_length=100)
    patient_phone = models.CharField(max_length=20)
    address = models.TextField()
    status = models.CharField(max_length=50, default='Confirmed')
    created_at = models.DateTimeField(auto_now_add=True)
