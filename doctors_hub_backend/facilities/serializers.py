from rest_framework import serializers
from drf_spectacular.utils import extend_schema_field
from .models import (
    Division, District, Thana,
    Location, HospitalCategory, HospitalService, Hospital,
    DiagnosticCenterCategory, DiagnosticService, DiagnosticCenter, Chamber
)
from .serializers_summary import FacilitySummarySerializer

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
        fields = ('id', 'name', 'slug', 'icon', 'description', 'hospital_count')


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
    thana = serializers.PrimaryKeyRelatedField(queryset=Thana.objects.all(), required=False)
    thana_details = ThanaSerializer(source='thana', read_only=True)
    area = serializers.CharField(read_only=True)
    district = serializers.CharField(read_only=True)
    division = serializers.CharField(read_only=True)

    class Meta:
        model = Location
        fields = (
            'id', 'location_type', 'ownership_type', 'name', 'branch', 'slug',
            'address_line', 'thana', 'thana_details', 'area', 'district', 'division',
            'phone', 'email', 'logo', 'image', 'description', 'tagline', 'badge',
            'rating', 'reviews_count', 'open_timing', 'is_verified', 'is_active', 'created_at'
        )

    def validate(self, attrs):
        if self.instance is None and not attrs.get('thana'):
            raise serializers.ValidationError({'thana': ['This field is required.']})
        return super().validate(attrs)


class HospitalSerializer(serializers.ModelSerializer):
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
    details_reviewed = serializers.BooleanField(required=False, default=False)
    doctor_count = serializers.IntegerField(read_only=True, default=0)
    test_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = Hospital
        fields = (
            'location_id', 'category', 'category_id',
            'services', 'service_ids', 'has_diagnostic_center', 'test_category_ids',
            'bed_capacity', 'icu_beds_total', 'icu_beds_available',
            'emergency_phone', 'ambulance_phone', 'accreditation', 'dghs_reg_no',
            'ot_suites_count', 'has_helipad', 'parking_capacity',
            'details_reviewed', 'doctor_count', 'test_count'
        )

    def to_representation(self, instance):
        from .serializers_summary import FacilitySummarySerializer
        data = FacilitySummarySerializer(instance.location, context=self.context).data if instance.location else {}
        loc = instance.location
        if loc:
            data['description'] = loc.description or ""
            data['tagline'] = loc.tagline or ""
            data['badge'] = loc.badge or ""
            data['open_timing'] = loc.open_timing or ""

        cat = instance.category
        if cat:
            data['category'] = {'id': str(cat.id), 'slug': cat.slug, 'name': cat.name}
            data['category_name'] = cat.name
        else:
            data['category'] = None
            data['category_name'] = None

        data['services'] = [{'id': str(s.id), 'name': s.name, 'icon': s.icon} for s in instance.services.all()]
        data['has_diagnostic_center'] = instance.has_diagnostic_center
        data['bed_capacity'] = instance.bed_capacity
        data['icu_beds_total'] = instance.icu_beds_total
        data['icu_beds_available'] = instance.icu_beds_available
        data['emergency_phone'] = instance.emergency_phone
        data['ambulance_phone'] = instance.ambulance_phone
        data['accreditation'] = instance.accreditation
        data['dghs_reg_no'] = instance.dghs_reg_no
        data['ot_suites_count'] = instance.ot_suites_count
        data['has_helipad'] = instance.has_helipad
        data['parking_capacity'] = instance.parking_capacity
        data['details_reviewed'] = getattr(instance, 'details_reviewed', False)

        data['doctor_count'] = getattr(instance, 'doctor_count', 0) or 0
        data['test_count'] = getattr(instance, 'test_count', 0) or 0

        return data

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


class DiagnosticCenterSerializer(serializers.ModelSerializer):
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
    doctor_count = serializers.IntegerField(read_only=True, default=0)
    test_count = serializers.IntegerField(read_only=True, default=0)
    test_category_ids = serializers.ListField(
        child=serializers.UUIDField(), write_only=True, required=False
    )

    class Meta:
        model = DiagnosticCenter
        fields = (
            'location_id', 'category', 'category_id',
            'services', 'service_ids', 'test_category_ids',
            'doctor_count', 'test_count'
        )

    def to_representation(self, instance):
        from .serializers_summary import FacilitySummarySerializer
        data = FacilitySummarySerializer(instance.location, context=self.context).data if instance.location else {}
        loc = instance.location
        if loc:
            data['description'] = loc.description or ""
            data['tagline'] = loc.tagline or ""
            data['badge'] = loc.badge or ""
            data['open_timing'] = loc.open_timing or ""

        cat = instance.category
        if cat:
            data['category'] = {'id': str(cat.id), 'slug': cat.slug, 'name': cat.name}
            data['category_name'] = cat.name
        else:
            data['category'] = None
            data['category_name'] = None

        data['services'] = [{'id': str(s.id), 'name': s.name, 'icon': s.icon} for s in instance.services.all()]

        data['doctor_count'] = getattr(instance, 'doctor_count', 0) or 0
        data['test_count'] = getattr(instance, 'test_count', 0) or 0

        return data

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
    facility = FacilitySummarySerializer(source='location', read_only=True)
    location_id = serializers.PrimaryKeyRelatedField(
        queryset=Location.objects.all(), write_only=True, source='location'
    )
    
    class Meta:
        model = Chamber
        fields = ('facility', 'location_id', 'doctor', 'assistant_phone')
