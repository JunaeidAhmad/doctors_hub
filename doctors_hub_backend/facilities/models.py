import uuid
from django.db import models
from django.utils.text import slugify


class Location(models.Model):
    class LocationType(models.TextChoices):
        HOSPITAL = "hospital", "Hospital"
        DIAGNOSTIC_CENTER = "diagnostic_center", "Diagnostic Center"
        CHAMBER = "chamber", "Chamber"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    location_type = models.CharField(max_length=30, choices=LocationType.choices)
    address_line = models.CharField(max_length=300)
    area = models.CharField(max_length=100, blank=True) #thana
    district = models.CharField(max_length=100)
    division = models.CharField(max_length=100)
    name = models.CharField(max_length=250)
    branch = models.CharField(max_length=200, blank=True)
    slug = models.SlugField(max_length=280, unique=True, blank=True)
    phone = models.CharField(max_length=50, blank=True)
    email = models.EmailField(blank=True)
    logo = models.ImageField(upload_to="facilities/logos/", blank=True, null=True)
    image = models.ImageField(upload_to="facilities/images/", blank=True, null=True)
    description = models.TextField(blank=True)
    tagline = models.CharField(max_length=255, blank=True)
    badge = models.CharField(max_length=50, blank=True)
    rating = models.FloatField(default=0.0)
    reviews_count = models.IntegerField(default=0)
    open_timing = models.CharField(max_length=100, blank=True)
    is_verified = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [models.Index(fields=["location_type"])]
        ordering = ["-created_at"]

    def save(self, *args, **kwargs):
        if not self.slug:
            b = f"-{self.branch}" if self.branch else ""
            self.slug = slugify(f"{self.name}{b}")
        super().save(*args, **kwargs)

    @property
    def detail(self):
        return getattr(self, f"{self.location_type}_detail", None)

    def __str__(self):
        branch_str = f" ({self.branch})" if self.branch else ""
        return f"{self.name}{branch_str} - {self.location_type}"


class FacilityMembership(models.Model):
    class MemberRole(models.TextChoices):
        ADMIN = "admin", "Facility Admin"
        STAFF = "staff", "Facility Staff"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey("accounts.User", on_delete=models.CASCADE, related_name="facility_memberships")
    location = models.ForeignKey(Location, on_delete=models.CASCADE, related_name="memberships")
    role = models.CharField(max_length=20, choices=MemberRole.choices, default=MemberRole.ADMIN)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["user", "location"], name="unique_membership")
        ]

    def __str__(self):
        return f"{self.user.phone_number} - {self.location.name} ({self.role})"


class HospitalCategory(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=120, unique=True, blank=True)
    icon = models.CharField(max_length=50, default='Building2')
    description = models.TextField(blank=True)
    count = models.IntegerField(default=0)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class HospitalService(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=150)
    icon = models.CharField(max_length=50, default='Activity')
    description = models.TextField(blank=True)

    def __str__(self):
        return self.name


class Hospital(models.Model):
    location = models.OneToOneField(Location, primary_key=True, on_delete=models.CASCADE, related_name="hospital_detail")
    category = models.ForeignKey(HospitalCategory, on_delete=models.SET_NULL, null=True, blank=True, related_name="hospitals")
    services = models.ManyToManyField(HospitalService, related_name="hospitals", blank=True)
    has_diagnostic_center = models.BooleanField(default=True)

    def __str__(self):
        return f"Hospital: {self.location.name}"


class DiagnosticCenterCategory(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=150)
    slug = models.SlugField(max_length=170, unique=True, blank=True)
    parent = models.ForeignKey('self', null=True, blank=True, related_name='children', on_delete=models.CASCADE)
    icon = models.CharField(max_length=100, blank=True)
    description = models.TextField(blank=True)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class DiagnosticService(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=150)
    icon = models.CharField(max_length=50, default='FlaskConical')
    description = models.TextField(blank=True)

    def __str__(self):
        return self.name


class DiagnosticCenter(models.Model):
    location = models.OneToOneField(Location, primary_key=True, on_delete=models.CASCADE, related_name="diagnostic_center_detail")
    category = models.ForeignKey(DiagnosticCenterCategory, on_delete=models.SET_NULL, null=True, blank=True, related_name="centers")
    services = models.ManyToManyField(DiagnosticService, related_name="centers", blank=True)

    def __str__(self):
        return f"Diagnostic Center: {self.location.name}"


class Chamber(models.Model):
    location = models.OneToOneField(Location, primary_key=True, on_delete=models.CASCADE, related_name="chamber_detail")
    doctor = models.ForeignKey("doctors.Doctor", on_delete=models.CASCADE, related_name="chambers")
    assistant_phone = models.CharField(max_length=50, blank=True)

    def __str__(self):
        return f"Chamber: {self.location.name} (Dr. {self.doctor.name})"
