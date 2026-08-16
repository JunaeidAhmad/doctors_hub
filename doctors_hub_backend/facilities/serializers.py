from rest_framework import serializers
from .models import (
    Location, HospitalCategory, HospitalService, Hospital,
    DiagnosticCenterCategory, DiagnosticService, DiagnosticCenter, Chamber
)

class HospitalCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = HospitalCategory
        fields = ('id', 'name', 'slug', 'icon', 'description', 'count')


class HospitalServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = HospitalService
        fields = ('id', 'name', 'icon', 'description')


class DiagnosticServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = DiagnosticService
        fields = ('id', 'name', 'icon', 'description')


class DiagnosticCenterCategorySerializer(serializers.ModelSerializer):
    parent_name = serializers.CharField(source='parent.name', read_only=True, default='')

    class Meta:
        model = DiagnosticCenterCategory
        fields = ('id', 'name', 'slug', 'parent', 'parent_name', 'icon', 'description')


class LocationSerializer(serializers.ModelSerializer):
    address_details = serializers.SerializerMethodField()

    class Meta:
        model = Location
        fields = (
            'id', 'location_type', 'name', 'branch', 'slug',
            'address_line', 'area', 'city', 'district', 'division',
            'postal_code', 'latitude', 'longitude', 'address_details',
            'phone', 'email', 'logo', 'image', 'description', 'tagline', 'badge',
            'rating', 'reviews_count', 'open_timing', 'is_verified', 'is_active', 'created_at'
        )

    def get_address_details(self, obj):
        return {
            'address_line': obj.address_line,
            'area': obj.area,
            'city': obj.city,
            'district': obj.district,
            'division': obj.division,
            'postal_code': obj.postal_code,
            'latitude': str(obj.latitude) if obj.latitude is not None else None,
            'longitude': str(obj.longitude) if obj.longitude is not None else None,
        }

# Backward-compatibility alias
PracticeLocationSerializer = LocationSerializer




class HospitalSerializer(serializers.ModelSerializer):
    location_details = LocationSerializer(source='location', read_only=True)
    location_id = serializers.PrimaryKeyRelatedField(
        queryset=Location.objects.all(), write_only=True, source='location'
    )
    category = HospitalCategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=HospitalCategory.objects.all(), write_only=True, source='category', required=False, allow_null=True
    )
    services = HospitalServiceSerializer(many=True, read_only=True)
    service_ids = serializers.PrimaryKeyRelatedField(
        queryset=HospitalService.objects.all(), many=True, write_only=True, source='services', required=False
    )
    test_category_ids = serializers.ListField(
        child=serializers.UUIDField(), write_only=True, required=False
    )

    class Meta:
        model = Hospital
        fields = (
            'location_details', 'location_id', 'category', 'category_id',
            'services', 'service_ids', 'has_diagnostic_center', 'test_category_ids'
        )

    def update(self, instance, validated_data):
        test_cat_ids = validated_data.pop('test_category_ids', None)
        instance = super().update(instance, validated_data)
        
        if test_cat_ids:
            from tests.models import Test, FacilityTest
            tests = Test.objects.filter(category_id__in=test_cat_ids)
            for test in tests:
                FacilityTest.objects.get_or_create(
                    location=instance.location,
                    test=test,
                    defaults={'price': 500.00, 'is_available': True}
                )
        return instance


class DiagnosticCenterSerializer(serializers.ModelSerializer):
    location_details = LocationSerializer(source='location', read_only=True)
    location_id = serializers.PrimaryKeyRelatedField(
        queryset=Location.objects.all(), write_only=True, source='location'
    )
    category = DiagnosticCenterCategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=DiagnosticCenterCategory.objects.all(), write_only=True, source='category', required=False, allow_null=True
    )
    services = DiagnosticServiceSerializer(many=True, read_only=True)
    service_ids = serializers.PrimaryKeyRelatedField(
        queryset=DiagnosticService.objects.all(), many=True, write_only=True, source='services', required=False
    )
    test_category_ids = serializers.ListField(
        child=serializers.UUIDField(), write_only=True, required=False
    )

    class Meta:
        model = DiagnosticCenter
        fields = (
            'location_details', 'location_id', 'category', 'category_id',
            'services', 'service_ids', 'test_category_ids'
        )

    def update(self, instance, validated_data):
        test_cat_ids = validated_data.pop('test_category_ids', None)
        instance = super().update(instance, validated_data)
        
        if test_cat_ids:
            from tests.models import Test, FacilityTest
            tests = Test.objects.filter(category_id__in=test_cat_ids)
            for test in tests:
                FacilityTest.objects.get_or_create(
                    location=instance.location,
                    test=test,
                    defaults={'price': 500.00, 'is_available': True}
                )
        return instance


class ChamberSerializer(serializers.ModelSerializer):
    location_details = LocationSerializer(source='location', read_only=True)
    location_id = serializers.PrimaryKeyRelatedField(
        queryset=Location.objects.all(), write_only=True, source='location'
    )
    
    class Meta:
        model = Chamber
        fields = ('location_details', 'location_id', 'doctor', 'assistant_phone')
