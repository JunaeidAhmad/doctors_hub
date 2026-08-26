import uuid
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.utils import timezone
from core.validators import bangladesh_phone_validator


class Permission(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    codename = models.CharField(max_length=100, unique=True, db_index=True)
    module = models.CharField(max_length=50)
    action = models.CharField(max_length=50)
    label = models.CharField(max_length=255)
    is_facility_grantable = models.BooleanField(default=False)

    class Meta:
        unique_together = ('module', 'action')

    def __str__(self):
        return f"{self.module}.{self.action}"


class Role(models.Model):
    class ScopeType(models.TextChoices):
        GLOBAL = "global", "Global"
        FACILITY = "facility", "Facility"
        SELF = "self", "Self"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    scope_type = models.CharField(max_length=20, choices=ScopeType.choices)
    owner_facility = models.ForeignKey(
        'facilities.Location', 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True,
        related_name="owned_roles",
        help_text="Null means platform role. Set means facility role."
    )
    is_system = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    permissions = models.ManyToManyField(Permission, related_name="roles", blank=True)

    def __str__(self):
        return self.name


class UserRole(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='user_roles')
    role = models.ForeignKey(Role, on_delete=models.CASCADE, related_name='user_assignments')
    facility = models.ForeignKey(
        'facilities.Location', 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True,
        related_name="user_role_assignments"
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["user", "role", "facility"], name="unique_user_role_facility")
        ]

    def __str__(self):
        fac = f" @ {self.facility.name}" if self.facility else ""
        return f"{self.user.phone_number} - {self.role.name}{fac}"


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
        extra_fields.setdefault('is_verified', True)
        user = self.create_user(phone_number, password, **extra_fields)
        
        # We don't automatically create the Super Admin role here, 
        # it should be seeded and assigned, but we rely on is_superuser for fallback.
        return user


class User(AbstractBaseUser, PermissionsMixin):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    phone_number = models.CharField(max_length=15, unique=True, validators=[bangladesh_phone_validator])
    first_name = models.CharField(max_length=50, blank=True)
    last_name = models.CharField(max_length=50, blank=True)
    is_active = models.BooleanField(default=True)
    is_verified = models.BooleanField(default=False)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)

    objects = UserManager()

    USERNAME_FIELD = 'phone_number'
    REQUIRED_FIELDS = []

    def __str__(self):
        return self.phone_number

    # Keeping legacy properties to prevent immediate breakage, 
    # but their logic now relies on user_roles.
    @property
    def is_super_admin(self):
        return self.is_superuser or self.user_roles.filter(role__is_system=True, role__scope_type=Role.ScopeType.GLOBAL, role__name="Super Admin").exists()

    @property
    def is_facility_admin(self):
        return self.user_roles.filter(role__scope_type=Role.ScopeType.FACILITY).exists()

    @property
    def is_facility_staff(self):
        return self.user_roles.filter(role__scope_type=Role.ScopeType.FACILITY).exists()

    @property
    def is_doctor_role(self):
        return self.user_roles.filter(role__name="Doctor").exists()

    @property
    def managed_location_ids(self):
        return list(self.user_roles.filter(facility__isnull=False).values_list("facility_id", flat=True))
