import uuid
from django.db import models
from django.core.exceptions import ValidationError
from facilities.models import Location
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
    location = models.ForeignKey(Location, on_delete=models.CASCADE, related_name="offered_tests")
    test = models.ForeignKey(Test, on_delete=models.CASCADE, related_name="offered_at")
    price = models.DecimalField(max_digits=10, decimal_places=2)
    discount_percent = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, default=0.0)
    report_time = models.CharField(max_length=100, blank=True)
    is_available = models.BooleanField(default=True)
    home_sample_collection = models.BooleanField(default=False)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["location", "test"], name="unique_test_price_per_location"),
        ]

    @property
    def calculated_price(self):
        if self.discount_percent and self.discount_percent > 0:
            from decimal import Decimal
            discount_amount = (self.price * Decimal(str(self.discount_percent))) / Decimal("100")
            return (self.price - discount_amount).quantize(Decimal("0.01"))
        return self.price

    @property
    def discounted_price(self):
        return self.calculated_price

    def clean(self):
        if self.location.location_type == Location.LocationType.CHAMBER:
            raise ValidationError("Chambers cannot offer lab tests.")
