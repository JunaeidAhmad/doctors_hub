import uuid
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.utils import timezone


class Role(models.TextChoices):
    SUPER_ADMIN = "super_admin", "Platform Super Admin"
    FACILITY_ADMIN = "facility_admin", "Facility Admin"
    STAFF = "staff", "Facility Staff"
    DOCTOR = "doctor", "Doctor"


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
        extra_fields.setdefault('role', Role.SUPER_ADMIN)
        extra_fields.setdefault('is_verified', True)
        return self.create_user(phone_number, password, **extra_fields)


from core.validators import bangladesh_phone_validator


class User(AbstractBaseUser, PermissionsMixin):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    phone_number = models.CharField(max_length=15, unique=True, validators=[bangladesh_phone_validator])
    first_name = models.CharField(max_length=50, blank=True)
    last_name = models.CharField(max_length=50, blank=True)
    role = models.CharField(max_length=20, choices=Role.choices, blank=True, default="")
    is_active = models.BooleanField(default=True)
    is_verified = models.BooleanField(default=False)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)

    objects = UserManager()

    USERNAME_FIELD = 'phone_number'
    REQUIRED_FIELDS = []

    def __str__(self):
        return f"{self.phone_number} ({self.role or 'user'})"

    def save(self, *args, **kwargs):
        if self.role == Role.SUPER_ADMIN:
            self.is_staff = True
            self.is_superuser = True
            self.is_verified = True
        elif self.role in (Role.FACILITY_ADMIN, Role.STAFF, Role.DOCTOR, ""):
            if not self.is_staff:
                self.is_superuser = False
        super().save(*args, **kwargs)

    @property
    def is_super_admin(self):
        return self.role == Role.SUPER_ADMIN or bool(self.is_superuser) or bool(self.is_staff)

    @property
    def is_facility_admin(self):
        return self.role == Role.FACILITY_ADMIN

    @property
    def is_facility_staff(self):
        return self.role == Role.STAFF

    @property
    def is_doctor_role(self):
        return self.role == Role.DOCTOR

    @property
    def managed_location_ids(self):
        if not (self.is_facility_admin or self.is_facility_staff):
            return []
        return list(self.facility_memberships.values_list("location_id", flat=True))

