from rest_framework import serializers
from drf_spectacular.utils import extend_schema_field
from .models import (
    Location, HospitalCategory, HospitalService, Hospital,
    DiagnosticCenterCategory, DiagnosticService, DiagnosticCenter, Chamber
)

class HospitalCategorySerializer(serializers.ModelSerializer):
    hospital_count = serializers.IntegerField(read_only=True, required=False)

    class Meta:
        model = HospitalCategory
        fields = ('id', 'name', 'slug', 'icon', 'description', 'count', 'hospital_count')


class DiagnosticServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = DiagnosticService
        fields = ('id', 'name', 'icon', 'description')


class HospitalServiceSerializer(serializers.ModelSerializer):
    diagnostic_services = DiagnosticServiceSerializer(many=True, read_only=True)
    diagnostic_service_ids = serializers.PrimaryKeyRelatedField(
        queryset=DiagnosticService.objects.all(),
        many=True,
        write_only=True,
        source='diagnostic_services',
        required=False
    )

    class Meta:
        model = HospitalService
        fields = ('id', 'name', 'icon', 'description', 'diagnostic_services', 'diagnostic_service_ids')


class DiagnosticCenterCategorySerializer(serializers.ModelSerializer):
    center_count = serializers.IntegerField(read_only=True, required=False)

    class Meta:
        model = DiagnosticCenterCategory
        fields = ('id', 'name', 'slug', 'icon', 'description', 'center_count')



class LocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Location
        fields = (
            'id', 'location_type', 'ownership_type', 'name', 'branch', 'slug',
            'address_line', 'area', 'district', 'division',
            'phone', 'email', 'logo', 'image', 'description', 'tagline', 'badge',
            'rating', 'reviews_count', 'open_timing', 'is_verified', 'is_active', 'created_at'
        )


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

    def create(self, validated_data):
        from services.facilities import create_hospital
        test_cat_ids = validated_data.pop('test_category_ids', None)
        services = validated_data.pop('services', [])
        initial_data = getattr(self, 'initial_data', {})
        prices = initial_data.get('prices', {}) if isinstance(initial_data, dict) else {}
        return create_hospital(
            validated_data=validated_data,
            location_data=initial_data if 'location' not in validated_data and isinstance(initial_data, dict) else None,
            services=services,
            test_cat_ids=test_cat_ids,
            prices=prices,
        )

    def update(self, instance, validated_data):
        from services.facilities import update_hospital
        test_cat_ids = validated_data.pop('test_category_ids', None)
        initial_data = getattr(self, 'initial_data', {})
        prices = initial_data.get('prices', {}) if isinstance(initial_data, dict) else {}
        return update_hospital(
            instance,
            validated_data=validated_data,
            location_data=initial_data if isinstance(initial_data, dict) else None,
            test_cat_ids=test_cat_ids,
            prices=prices,
        )


class DiagnosticCenterOfferedTestSummarySerializer(serializers.Serializer):
    id = serializers.UUIDField()
    price = serializers.DecimalField(max_digits=10, decimal_places=2)
    discounted_price = serializers.DecimalField(max_digits=10, decimal_places=2, allow_null=True, required=False)
    calculated_price = serializers.DecimalField(max_digits=10, decimal_places=2, allow_null=True, required=False)
    discount_percent = serializers.DecimalField(max_digits=5, decimal_places=2, allow_null=True, required=False)
    report_time = serializers.CharField(allow_blank=True, required=False)
    is_available = serializers.BooleanField(default=True)
    home_sample_collection = serializers.BooleanField(default=False)
    facility_name = serializers.CharField(allow_blank=True, required=False)
    facility_type = serializers.CharField(allow_blank=True, required=False)


class DiagnosticCenterSerializer(serializers.ModelSerializer):
    location_details = LocationSerializer(source='location', read_only=True)
    location_id = serializers.PrimaryKeyRelatedField(
        queryset=Location.objects.all(), write_only=True, source='location', required=False
    )
    category = DiagnosticCenterCategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=DiagnosticCenterCategory.objects.all(), write_only=True, source='category', required=False, allow_null=True
    )
    services = DiagnosticServiceSerializer(many=True, read_only=True)
    service_ids = serializers.PrimaryKeyRelatedField(
        queryset=DiagnosticService.objects.all(), many=True, write_only=True, source='services', required=False
    )
    offered_tests = serializers.SerializerMethodField()
    test_category_ids = serializers.ListField(
        child=serializers.UUIDField(), write_only=True, required=False
    )

    class Meta:
        model = DiagnosticCenter
        fields = (
            'location_details', 'location_id', 'category', 'category_id',
            'services', 'service_ids', 'offered_tests', 'test_category_ids'
        )

    @extend_schema_field(DiagnosticCenterOfferedTestSummarySerializer(many=True))
    def get_offered_tests(self, obj):
        if not obj.location:
            return []
        from tests.serializers import FacilityTestSerializer
        fts = obj.location.offered_tests.all()
        return FacilityTestSerializer(fts, many=True).data

    def create(self, validated_data):
        from services.facilities import create_diagnostic_center
        test_cat_ids = validated_data.pop('test_category_ids', None)
        services = validated_data.pop('services', [])
        initial_data = getattr(self, 'initial_data', {})
        prices = initial_data.get('prices', {}) if isinstance(initial_data, dict) else {}
        return create_diagnostic_center(
            validated_data=validated_data,
            location_data=initial_data if 'location' not in validated_data and isinstance(initial_data, dict) else None,
            services=services,
            test_cat_ids=test_cat_ids,
            prices=prices,
        )

    def update(self, instance, validated_data):
        from services.facilities import update_diagnostic_center
        test_cat_ids = validated_data.pop('test_category_ids', None)
        initial_data = getattr(self, 'initial_data', {})
        prices = initial_data.get('prices', {}) if isinstance(initial_data, dict) else {}
        return update_diagnostic_center(
            instance,
            validated_data=validated_data,
            location_data=initial_data if isinstance(initial_data, dict) else None,
            test_cat_ids=test_cat_ids,
            prices=prices,
        )


class ChamberSerializer(serializers.ModelSerializer):
    location_details = LocationSerializer(source='location', read_only=True)
    location_id = serializers.PrimaryKeyRelatedField(
        queryset=Location.objects.all(), write_only=True, source='location'
    )
    
    class Meta:
        model = Chamber
        fields = ('location_details', 'location_id', 'doctor', 'assistant_phone')
