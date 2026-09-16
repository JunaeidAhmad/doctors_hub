from rest_framework import serializers
from drf_spectacular.utils import extend_schema_field
from .models import (
    Division, District, Thana,
    Location, HospitalCategory, HospitalService, Hospital,
    DiagnosticCenterCategory, DiagnosticService, DiagnosticCenter, Chamber
)

class DivisionSerializer(serializers.ModelSerializer):
    districts_count = serializers.IntegerField(source='districts.count', read_only=True)

    class Meta:
        model = Division
        fields = ('id', 'name', 'bn_name', 'slug', 'order', 'districts_count')


class DistrictSerializer(serializers.ModelSerializer):
    division_name = serializers.CharField(source='division.name', read_only=True)
    division_bn_name = serializers.CharField(source='division.bn_name', read_only=True)
    thanas_count = serializers.IntegerField(source='thanas.count', read_only=True)

    class Meta:
        model = District
        fields = ('id', 'division', 'division_name', 'division_bn_name', 'name', 'bn_name', 'slug', 'thanas_count')


class ThanaSerializer(serializers.ModelSerializer):
    district_name = serializers.CharField(source='district.name', read_only=True)
    district_bn_name = serializers.CharField(source='district.bn_name', read_only=True)
    division_id = serializers.IntegerField(source='district.division_id', read_only=True)
    division_name = serializers.CharField(source='district.division.name', read_only=True)
    division_bn_name = serializers.CharField(source='district.division.bn_name', read_only=True)

    class Meta:
        model = Thana
        fields = (
            'id', 'district', 'district_name', 'district_bn_name',
            'division_id', 'division_name', 'division_bn_name',
            'name', 'bn_name', 'slug'
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
    class Meta:
        model = HospitalService
        fields = ('id', 'name', 'icon', 'description')


class DiagnosticCenterCategorySerializer(serializers.ModelSerializer):
    center_count = serializers.IntegerField(read_only=True, required=False)

    class Meta:
        model = DiagnosticCenterCategory
        fields = ('id', 'name', 'slug', 'icon', 'description', 'center_count')


class LocationSerializer(serializers.ModelSerializer):
    thana = serializers.PrimaryKeyRelatedField(queryset=Thana.objects.all(), required=False, allow_null=True)
    thana_details = ThanaSerializer(source='thana', read_only=True)
    area = serializers.CharField(read_only=True)
    district = serializers.CharField(read_only=True)
    division = serializers.CharField(read_only=True)

    input_area = serializers.CharField(write_only=True, required=False, allow_blank=True)
    input_district = serializers.CharField(write_only=True, required=False, allow_blank=True)
    input_division = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = Location
        fields = (
            'id', 'location_type', 'ownership_type', 'name', 'branch', 'slug',
            'address_line', 'thana', 'thana_details', 'area', 'district', 'division',
            'input_area', 'input_district', 'input_division',
            'phone', 'email', 'logo', 'image', 'description', 'tagline', 'badge',
            'rating', 'reviews_count', 'open_timing', 'is_verified', 'is_active', 'created_at'
        )

    def to_internal_value(self, data):
        ret = super().to_internal_value(data)
        if 'thana' not in ret or ret.get('thana') is None:
            raw_dist = data.get('district', '')
            raw_area = data.get('area', '')
            if raw_dist or raw_area:
                ret['input_district'] = raw_dist
                ret['input_area'] = raw_area
        return ret

    def _resolve_thana(self, validated_data):
        thana = validated_data.get('thana')
        input_district = validated_data.pop('input_district', None)
        input_area = validated_data.pop('input_area', None)
        validated_data.pop('input_division', None)

        if not thana and (input_district or input_area):
            DIST_ALIASES = {
                'chittagong': 'Chattogram', 'comilla': 'Cumilla', 'bogra': 'Bogura',
                'jessore': 'Jashore', 'barisal': 'Barishal', 'ঢাকা': 'Dhaka',
                'চট্টগ্রাম': 'Chattogram', 'সিলেট': 'Sylhet'
            }
            norm_dist = DIST_ALIASES.get((input_district or '').strip().lower(), (input_district or '').strip())
            norm_area = (input_area or '').strip()

            qs = Thana.objects.filter(district__name__iexact=norm_dist) if norm_dist else Thana.objects.all()
            resolved = None
            if norm_area:
                resolved = qs.filter(name__iexact=norm_area).first() or qs.filter(bn_name__iexact=norm_area).first()
            if not resolved and norm_dist:
                resolved = qs.filter(name__icontains='Sadar').first() or qs.first()
            if resolved:
                validated_data['thana'] = resolved
        return validated_data

    def create(self, validated_data):
        validated_data = self._resolve_thana(validated_data)
        if 'thana' not in validated_data or not validated_data['thana']:
            validated_data['thana'] = Thana.objects.filter(district__name='Dhaka', name='Dhanmondi').first() or Thana.objects.first()
        return super().create(validated_data)

    def update(self, instance, validated_data):
        validated_data = self._resolve_thana(validated_data)
        return super().update(instance, validated_data)


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
    affiliated_doctors = serializers.SerializerMethodField()
    offered_tests = serializers.SerializerMethodField()

    class Meta:
        model = Hospital
        fields = (
            'location_details', 'location_id', 'category', 'category_id',
            'services', 'service_ids', 'has_diagnostic_center', 'test_category_ids',
            'bed_capacity', 'icu_beds_total', 'icu_beds_available',
            'emergency_phone', 'ambulance_phone', 'accreditation', 'dghs_reg_no',
            'ot_suites_count', 'has_helipad', 'parking_capacity',
            'affiliated_doctors', 'offered_tests'
        )

    def get_affiliated_doctors(self, obj):
        if not obj.location:
            return []
        try:
            from doctors.serializers import DoctorAffiliationSerializer
            affs = obj.location.affiliations.all()
            return DoctorAffiliationSerializer(affs, many=True).data
        except Exception:
            return []

    def get_offered_tests(self, obj):
        if not obj.location:
            return []
        try:
            from tests.serializers import FacilityTestSerializer
            fts = obj.location.offered_tests.all()
            return FacilityTestSerializer(fts, many=True).data
        except Exception:
            return []

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
