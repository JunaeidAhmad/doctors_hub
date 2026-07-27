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

class Specialty(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    name = models.CharField(max_length=100)
    icon = models.CharField(max_length=50)
    description = models.TextField(blank=True)
    
    def __str__(self):
        return self.name

class PathologyTest(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    name = models.CharField(max_length=150)
    category = models.CharField(max_length=100)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    original_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    discount = models.CharField(max_length=50, blank=True)
    fasting_required = models.BooleanField(default=False)
    report_time = models.CharField(max_length=100)
    description = models.TextField(blank=True)

    def __str__(self):
        return self.name

class Chamber(models.Model):
    id = models.CharField(max_length=100, primary_key=True)
    name = models.CharField(max_length=200)
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

    def __str__(self):
        return self.name

class Doctor(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    name = models.CharField(max_length=200)
    specialty = models.ForeignKey(Specialty, on_delete=models.SET_NULL, null=True, related_name='doctors')
    chamber = models.ForeignKey(Chamber, on_delete=models.CASCADE, related_name='doctors')
    qualification = models.TextField()
    experience = models.CharField(max_length=50)
    visit_days = models.CharField(max_length=100)
    visit_time = models.CharField(max_length=100)
    fee = models.DecimalField(max_digits=8, decimal_places=2)
    slots = models.JSONField(default=list)  # storing array of strings

    def __str__(self):
        return self.name

class DoctorBooking(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='doctor_bookings')
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE)
    chamber = models.ForeignKey(Chamber, on_delete=models.CASCADE)
    date = models.DateField()
    slot = models.CharField(max_length=50)
    patient_name = models.CharField(max_length=100)
    status = models.CharField(max_length=50, default='Confirmed')
    created_at = models.DateTimeField(auto_now_add=True)

class LabBooking(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='lab_bookings')
    test = models.ForeignKey(PathologyTest, on_delete=models.CASCADE)
    pickup_date = models.DateField()
    patient_name = models.CharField(max_length=100)
    patient_phone = models.CharField(max_length=20)
    address = models.TextField()
    status = models.CharField(max_length=50, default='Confirmed')
    created_at = models.DateTimeField(auto_now_add=True)
