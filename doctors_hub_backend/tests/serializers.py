from rest_framework import serializers
from .models import TestCategory, Test, FacilityTest
from facilities.models import PracticeLocation
from facilities.serializers import PracticeLocationSerializer

class TestCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = TestCategory
        fields = ('id', 'name', 'slug', 'icon', 'description', 'is_active', 'order')

class TestSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_slug = serializers.CharField(source='category.slug', read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=TestCategory.objects.all(), write_only=True, source='category'
    )

    class Meta:
        model = Test
        fields = (
            'id', 'category_id', 'category_name', 'category_slug', 'name', 'slug', 'code',
            'description', 'sample_type', 'preparation_instructions', 'fasting_required',
            'report_time_hours', 'is_active'
        )

class FacilityTestSerializer(serializers.ModelSerializer):
    test_details = TestSerializer(source='test', read_only=True)
    test_id = serializers.PrimaryKeyRelatedField(
        queryset=Test.objects.all(), write_only=True, source='test'
    )
    location_details = PracticeLocationSerializer(source='location', read_only=True)
    location_id = serializers.PrimaryKeyRelatedField(
        queryset=PracticeLocation.objects.all(), write_only=True, source='location'
    )
    facility_name = serializers.CharField(source='location.name', read_only=True, default='')

    class Meta:
        model = FacilityTest
        fields = (
            'id', 'location_id', 'location_details', 'test_id', 'test_details', 'price',
            'discounted_price', 'original_price', 'discount', 'report_time', 'is_available',
            'home_sample_collection', 'updated_at', 'facility_name'
        )

BranchTestSerializer = FacilityTestSerializer
DiagnosticCenterTestSerializer = FacilityTestSerializer
