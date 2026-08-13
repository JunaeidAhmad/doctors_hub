from rest_framework import serializers
from .models import (
    Address, PracticeLocation, HospitalCategory, HospitalService, Hospital,
    DiagnosticCenterCategory, DiagnosticService, DiagnosticCenter, Chamber
)

class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = ('id', 'address_line', 'area', 'city', 'district', 'division', 'postal_code', 'latitude', 'longitude')


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


class PracticeLocationSerializer(serializers.ModelSerializer):
    address_details = AddressSerializer(source='address', read_only=True)
    address_id = serializers.PrimaryKeyRelatedField(
        queryset=Address.objects.all(), write_only=True, source='address'
    )

    class Meta:
        model = PracticeLocation
        fields = (
            'id', 'location_type', 'name', 'branch', 'slug', 'address_details', 'address_id',
            'phone', 'email', 'logo', 'image', 'description', 'tagline', 'badge',
            'rating', 'reviews_count', 'open_timing', 'is_verified', 'is_active', 'created_at'
        )


class HospitalSerializer(serializers.ModelSerializer):
    location_details = PracticeLocationSerializer(source='location', read_only=True)
    location_id = serializers.PrimaryKeyRelatedField(
        queryset=PracticeLocation.objects.all(), write_only=True, source='location'
    )
    categories = HospitalCategorySerializer(many=True, read_only=True)
    category_ids = serializers.PrimaryKeyRelatedField(
        queryset=HospitalCategory.objects.all(), many=True, write_only=True, source='categories', required=False
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
            'location_details', 'location_id', 'categories', 'category_ids',
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
    location_details = PracticeLocationSerializer(source='location', read_only=True)
    location_id = serializers.PrimaryKeyRelatedField(
        queryset=PracticeLocation.objects.all(), write_only=True, source='location'
    )
    categories = DiagnosticCenterCategorySerializer(many=True, read_only=True)
    category_ids = serializers.PrimaryKeyRelatedField(
        queryset=DiagnosticCenterCategory.objects.all(), many=True, write_only=True, source='categories', required=False
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
            'location_details', 'location_id', 'categories', 'category_ids',
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
    location_details = PracticeLocationSerializer(source='location', read_only=True)
    location_id = serializers.PrimaryKeyRelatedField(
        queryset=PracticeLocation.objects.all(), write_only=True, source='location'
    )
    
    class Meta:
        model = Chamber
        fields = ('location_details', 'location_id', 'doctor', 'assistant_phone')
