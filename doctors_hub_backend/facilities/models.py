import uuid
from django.db import models
from django.utils.text import slugify
from core.uuid7 import uuid7


# =====================================================================
# BANGLADESH GEOGRAPHIC HIERARCHY
# =====================================================================

class Division(models.Model):
    id = models.SmallAutoField(primary_key=True)
    name = models.CharField(max_length=50, unique=True, help_text="English name (e.g. Dhaka)")
    bn_name = models.CharField(max_length=100, blank=True, help_text="Bengali name (e.g. ঢাকা)")
    slug = models.SlugField(max_length=60, unique=True, blank=True)
    order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ['order', 'name']

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} ({self.bn_name})" if self.bn_name else self.name


class District(models.Model):
    id = models.SmallAutoField(primary_key=True)
    division = models.ForeignKey(Division, on_delete=models.CASCADE, related_name="districts")
    name = models.CharField(max_length=50, help_text="English name (e.g. Gazipur)")
    bn_name = models.CharField(max_length=100, blank=True, help_text="Bengali name (e.g. গাজীপুর)")
    slug = models.SlugField(max_length=60, blank=True)

    class Meta:
        unique_together = ('division', 'name')
        ordering = ['name']

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} - {self.division.name}"


class Thana(models.Model):
    id = models.SmallAutoField(primary_key=True)
    district = models.ForeignKey(District, on_delete=models.CASCADE, related_name="thanas")
    name = models.CharField(max_length=100, help_text="English name (e.g. Dhanmondi, Savar)")
    bn_name = models.CharField(max_length=150, blank=True, help_text="Bengali name (e.g. ধানমন্ডি)")
    slug = models.SlugField(max_length=120, blank=True)

    class Meta:
        verbose_name = "Thana / Upazila"
        verbose_name_plural = "Thanas / Upazilas"
        unique_together = ('district', 'name')
        ordering = ['name']

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name}, {self.district.name}"


# =====================================================================
# LOCATION (FACILITY ENTITY)
# =====================================================================

class Location(models.Model):
    class LocationType(models.TextChoices):
        HOSPITAL = "hospital", "Hospital"
        DIAGNOSTIC_CENTER = "diagnostic_center", "Diagnostic Center"
        CHAMBER = "chamber", "Chamber"

    class OwnershipType(models.TextChoices):
        PRIVATE = "private", "Private"
        GOVERNMENT = "government", "Government"
        HOSPITAL_AFFILIATED = "hospital_affiliated", "Hospital Affiliated Lab"
        NGO = "ngo", "NGO / Non-Profit Laboratory"

    id = models.UUIDField(primary_key=True, default=uuid7, editable=False)
    location_type = models.CharField(max_length=30, choices=LocationType.choices)
    ownership_type = models.CharField(max_length=20, choices=OwnershipType.choices, default=OwnershipType.PRIVATE)
    thana = models.ForeignKey(
        Thana,
        on_delete=models.PROTECT,
        null=False,
        related_name="locations",
        help_text="Canonical Thana/Upazila where this facility is located."
    )
    address_line = models.CharField(max_length=300)
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
    is_verified = models.BooleanField(default=False, db_index=True)
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["location_type"]),
            models.Index(fields=["thana"]),
        ]
        ordering = ["-created_at"]

    def save(self, *args, **kwargs):
        if self.location_type == self.LocationType.CHAMBER and not self.ownership_type:
            self.ownership_type = self.OwnershipType.PRIVATE
        if not self.slug:
            b = f"-{self.branch}" if self.branch else ""
            base_slug = slugify(f"{self.name}{b}")
            slug = base_slug
            if Location.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base_slug}-{uuid7().hex[:6]}"
            self.slug = slug
        super().save(*args, **kwargs)

    @property
    def area(self):
        return self.thana.name if self.thana_id else ""

    @property
    def district(self):
        return self.thana.district.name if (self.thana_id and self.thana.district_id) else ""

    @property
    def division(self):
        return self.thana.district.division.name if (self.thana_id and self.thana.district_id and self.thana.district.division_id) else ""

    @property
    def full_address(self):
        parts = [self.address_line, self.area, self.district, self.division]
        return ", ".join([p for p in parts if p])

    @property
    def detail(self):
        return getattr(self, f"{self.location_type}_detail", None)

    @property
    def display_name(self):
        from core.text import format_facility_name
        return format_facility_name(self.name, self.branch)

    def __str__(self):
        branch_str = f" ({self.branch})" if self.branch else ""
        return f"{self.name}{branch_str} - {self.location_type}"


class HospitalCategory(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid7, editable=False)
    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=120, unique=True, blank=True)
    icon = models.CharField(max_length=50, default='Building2')
    description = models.TextField(blank=True)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class HospitalService(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid7, editable=False)
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
    details_reviewed = models.BooleanField(default=False)
    bed_capacity = models.IntegerField(null=True, blank=True)
    icu_beds_total = models.IntegerField(null=True, blank=True)
    icu_beds_available = models.IntegerField(null=True, blank=True)
    emergency_phone = models.CharField(max_length=50, default='', blank=True)
    ambulance_phone = models.CharField(max_length=50, default='', blank=True)
    accreditation = models.CharField(max_length=150, default='', blank=True)
    dghs_reg_no = models.CharField(max_length=100, default='', blank=True)
    ot_suites_count = models.IntegerField(null=True, blank=True)
    has_helipad = models.BooleanField(null=True, blank=True)
    parking_capacity = models.CharField(max_length=100, default='', blank=True)

    def __str__(self):
        return f"Hospital: {self.location.name}"


class DiagnosticCenterCategory(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid7, editable=False)
    name = models.CharField(max_length=150)
    slug = models.SlugField(max_length=170, unique=True, blank=True)
    icon = models.CharField(max_length=100, blank=True)
    description = models.TextField(blank=True)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class DiagnosticService(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid7, editable=False)
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

    def save(self, *args, **kwargs):
        if self.location and self.location.location_type == Location.LocationType.CHAMBER:
            if self.location.ownership_type != Location.OwnershipType.PRIVATE:
                self.location.ownership_type = Location.OwnershipType.PRIVATE
                self.location.save(update_fields=['ownership_type'])
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Chamber: {self.location.name} (Dr. {self.doctor.name})"
