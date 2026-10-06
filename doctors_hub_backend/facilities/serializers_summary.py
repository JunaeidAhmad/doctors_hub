from rest_framework import serializers
from drf_spectacular.utils import extend_schema_field
from .models import Location
from core.schema_serializers import NextAvailableSerializer


class FacilitySummarySerializer(serializers.ModelSerializer):
    """
    Display-ready summary for a facility (Location).
    Requires select_related('thana__district__division').
    """
    id = serializers.UUIDField(read_only=True)
    slug = serializers.CharField(read_only=True)
    location_type = serializers.CharField(read_only=True)
    ownership_type = serializers.CharField(read_only=True)
    name = serializers.CharField(read_only=True)
    branch = serializers.CharField(read_only=True)
    display_name = serializers.CharField(read_only=True)
    address = serializers.CharField(source='address_line', read_only=True)
    thana_id = serializers.IntegerField(source='thana.id', read_only=True, allow_null=True)
    area = serializers.CharField(source='thana.name', read_only=True, allow_null=True)
    area_bn = serializers.CharField(source='thana.bn_name', read_only=True, allow_null=True)
    district_id = serializers.IntegerField(source='thana.district.id', read_only=True, allow_null=True)
    district = serializers.CharField(source='thana.district.name', read_only=True, allow_null=True)
    district_bn = serializers.CharField(source='thana.district.bn_name', read_only=True, allow_null=True)
    division_id = serializers.IntegerField(source='thana.district.division.id', read_only=True, allow_null=True)
    division = serializers.CharField(source='thana.district.division.name', read_only=True, allow_null=True)
    division_bn = serializers.CharField(source='thana.district.division.bn_name', read_only=True, allow_null=True)
    phone = serializers.CharField(read_only=True)
    email = serializers.CharField(read_only=True)
    logo = serializers.SerializerMethodField()
    image = serializers.SerializerMethodField()
    rating = serializers.FloatField(read_only=True)
    reviews_count = serializers.IntegerField(read_only=True)
    is_verified = serializers.BooleanField(read_only=True)
    is_active = serializers.BooleanField(read_only=True)

    class Meta:
        model = Location
        fields = (
            'id', 'slug', 'location_type', 'ownership_type',
            'name', 'branch', 'display_name',
            'address', 'thana_id', 'area', 'area_bn',
            'district_id', 'district', 'district_bn',
            'division_id', 'division', 'division_bn',
            'phone', 'email', 'logo', 'image',
            'rating', 'reviews_count', 'is_verified', 'is_active'
        )
        read_only_fields = fields

    @extend_schema_field(serializers.URLField(allow_null=True))
    def get_logo(self, obj):
        if not obj or not getattr(obj, 'logo', None):
            return None
        val = str(obj.logo)
        if val.startswith('http://') or val.startswith('https://'):
            return val
        try:
            url = obj.logo.url
            request = self.context.get('request')
            if request is not None:
                return request.build_absolute_uri(url)
            return url
        except Exception:
            return val or None

    @extend_schema_field(serializers.URLField(allow_null=True))
    def get_image(self, obj):
        if not obj or not getattr(obj, 'image', None):
            return None
        val = str(obj.image)
        if val.startswith('http://') or val.startswith('https://'):
            return val
        try:
            url = obj.image.url
            request = self.context.get('request')
            if request is not None:
                return request.build_absolute_uri(url)
            return url
        except Exception:
            return val or None


class FacilityMiniSerializer(serializers.ModelSerializer):
    """Minimal facility shape for lean doctor payloads."""
    area = serializers.CharField(source='thana.name', read_only=True, allow_null=True)
    district = serializers.CharField(source='thana.district.name', read_only=True, allow_null=True)
    district_id = serializers.IntegerField(source='thana.district.id', read_only=True, allow_null=True)

    class Meta:
        model = Location
        fields = ('id', 'slug', 'display_name', 'location_type', 'area', 'district', 'district_id')
        read_only_fields = fields


class FacilityDoctorScheduleSerializer(serializers.Serializer):
    id = serializers.CharField()
    day_of_week = serializers.CharField()
    start_time = serializers.CharField()
    end_time = serializers.CharField()


class FacilityDoctorSpecialtyRefSerializer(serializers.Serializer):
    slug = serializers.CharField()
    name = serializers.CharField()
    bn_name = serializers.CharField()


class FacilityDoctorRefSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    slug = serializers.CharField()
    name = serializers.CharField()
    bn_name = serializers.CharField()
    academic_title = serializers.CharField()
    qualification = serializers.CharField()
    image = serializers.URLField(allow_null=True)
    gender = serializers.CharField()
    bmdc_number = serializers.CharField(allow_null=True)
    rating = serializers.CharField(allow_null=True)
    review_count = serializers.IntegerField()
    primary_specialty = FacilityDoctorSpecialtyRefSerializer(allow_null=True)


class FacilityDoctorEntrySerializer(serializers.Serializer):
    """One result row of GET /hospitals/{location}/doctors/."""
    affiliation_id = serializers.UUIDField()
    fee = serializers.CharField(allow_null=True)
    chamber_type = serializers.CharField()
    schedules = FacilityDoctorScheduleSerializer(many=True)
    next_available = NextAvailableSerializer(allow_null=True)
    doctor = FacilityDoctorRefSerializer()


class FacilityDoctorFacetSerializer(serializers.Serializer):
    slug = serializers.CharField()
    name = serializers.CharField()
    bn_name = serializers.CharField()
    count = serializers.IntegerField()


class FacilityDoctorFacetsSerializer(serializers.Serializer):
    specialties = FacilityDoctorFacetSerializer(many=True)


class FacilityDoctorListResponseSerializer(serializers.Serializer):
    """Paginated envelope (SearchPagination.get_paginated_response) for facility doctors."""
    count = serializers.IntegerField()
    total_pages = serializers.IntegerField()
    page = serializers.IntegerField()
    page_size = serializers.IntegerField()
    next = serializers.URLField(allow_null=True)
    previous = serializers.URLField(allow_null=True)
    facets = FacilityDoctorFacetsSerializer()
    results = FacilityDoctorEntrySerializer(many=True)
