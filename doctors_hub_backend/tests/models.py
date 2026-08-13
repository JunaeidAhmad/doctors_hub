import uuid
from django.db import models
from django.core.exceptions import ValidationError
from facilities.models import PracticeLocation
from django.utils.text import slugify

class TestCategory(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=150)
    slug = models.SlugField(max_length=170, unique=True, blank=True)
    icon = models.CharField(max_length=100, blank=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order', 'name']

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

class Test(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    category = models.ForeignKey(TestCategory, related_name='tests', on_delete=models.CASCADE)
    name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=220, unique=True, blank=True)
    code = models.CharField(max_length=50, blank=True)
    description = models.TextField(blank=True)
    sample_type = models.CharField(max_length=100, blank=True)
    preparation_instructions = models.TextField(blank=True)
    fasting_required = models.BooleanField(default=False)
    report_time_hours = models.PositiveIntegerField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = f"{slugify(self.name)}-{uuid.uuid4().hex[:6]}"
        super().save(*args, **kwargs)

class FacilityTest(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    location = models.ForeignKey(PracticeLocation, on_delete=models.CASCADE, related_name="offered_tests")
    test = models.ForeignKey(Test, on_delete=models.CASCADE, related_name="offered_at")
    price = models.DecimalField(max_digits=10, decimal_places=2)
    discounted_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    original_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    discount = models.CharField(max_length=50, blank=True)
    report_time = models.CharField(max_length=100, blank=True)
    is_available = models.BooleanField(default=True)
    home_sample_collection = models.BooleanField(default=False)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["location", "test"], name="unique_test_price_per_location"),
        ]

    def clean(self):
        if self.location.location_type == PracticeLocation.LocationType.CHAMBER:
            raise ValidationError("Chambers cannot offer lab tests.")
