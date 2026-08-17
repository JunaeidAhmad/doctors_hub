from rest_framework import serializers
from .models import (
    Location, HospitalCategory, HospitalService, Hospital,
    DiagnosticCenterCategory, DiagnosticService, DiagnosticCenter, Chamber
)

class HospitalCategorySerializer(serializers.ModelSerializer):
    hospital_count = serializers.IntegerField(read_only=True, required=False)

    class Meta:
        model = HospitalCategory
        fields = ('id', 'name', 'slug', 'icon', 'description', 'count', 'hospital_count')


class HospitalServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = HospitalService
        fields = ('id', 'name', 'icon', 'description')


class DiagnosticServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = DiagnosticService
        fields = ('id', 'name', 'icon', 'description')


class DiagnosticCenterCategorySerializer(serializers.ModelSerializer):
    center_count = serializers.IntegerField(read_only=True, required=False)

    class Meta:
        model = DiagnosticCenterCategory
        fields = ('id', 'name', 'slug', 'icon', 'description', 'center_count')



class LocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Location
        fields = (
            'id', 'location_type', 'name', 'branch', 'slug',
            'address_line', 'area', 'district', 'division',
            'phone', 'email', 'logo', 'image', 'description', 'tagline', 'badge',
            'rating', 'reviews_count', 'open_timing', 'is_verified', 'is_active', 'created_at'
        )

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

    def create(self, validated_data):
        test_cat_ids = validated_data.pop('test_category_ids', None)
        services = validated_data.pop('services', [])
        if 'location' not in validated_data and hasattr(self, 'initial_data'):
            loc_data = {
                'name': self.initial_data.get('name', 'Hospital'),
                'branch': self.initial_data.get('branch', ''),
                'location_type': Location.LocationType.HOSPITAL,
                'address_line': self.initial_data.get('address_line', self.initial_data.get('address', '')),
                'area': self.initial_data.get('area', ''),
                'district': self.initial_data.get('district', self.initial_data.get('city', 'Dhaka')),
                'division': self.initial_data.get('division', self.initial_data.get('city', 'Dhaka')),
                'phone': self.initial_data.get('phone', ''),
                'email': self.initial_data.get('email', ''),
                'description': self.initial_data.get('description', ''),
                'tagline': self.initial_data.get('tagline', ''),
                'badge': self.initial_data.get('badge', ''),
                'rating': float(self.initial_data.get('rating', 0.0)) if self.initial_data.get('rating') else 0.0,
                'reviews_count': int(self.initial_data.get('reviews_count', 0)) if self.initial_data.get('reviews_count') else 0,
                'open_timing': self.initial_data.get('open_timing', ''),
                'is_verified': bool(self.initial_data.get('is_verified', False)),
            }
            validated_data['location'] = Location.objects.create(**loc_data)

        hospital = super().create(validated_data)
        if services:
            hospital.services.set(services)
        if test_cat_ids:
            from tests.models import Test, FacilityTest
            tests = Test.objects.filter(category_id__in=test_cat_ids)
            for test in tests:
                FacilityTest.objects.get_or_create(
                    location=hospital.location,
                    test=test,
                    defaults={'price': 500.00, 'is_available': True}
                )
        return hospital

    def update(self, instance, validated_data):
        test_cat_ids = validated_data.pop('test_category_ids', None)
        if hasattr(self, 'initial_data') and instance.location:
            loc = instance.location
            for field in ['name', 'branch', 'address_line', 'area', 'district', 'division', 'phone', 'email', 'description', 'tagline', 'badge', 'open_timing']:
                if field in self.initial_data:
                    setattr(loc, field, self.initial_data[field])
            if 'address' in self.initial_data and 'address_line' not in self.initial_data:
                loc.address_line = self.initial_data['address']
            if 'rating' in self.initial_data:
                loc.rating = float(self.initial_data['rating'])
            if 'reviews_count' in self.initial_data:
                loc.reviews_count = int(self.initial_data['reviews_count'])
            if 'is_verified' in self.initial_data:
                loc.is_verified = bool(self.initial_data['is_verified'])
            loc.save()

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

    def get_offered_tests(self, obj):
        if not obj.location:
            return []
        from tests.serializers import FacilityTestSerializer
        fts = obj.location.offered_tests.all()
        return FacilityTestSerializer(fts, many=True).data

    def create(self, validated_data):
        test_cat_ids = validated_data.pop('test_category_ids', None)
        services = validated_data.pop('services', [])
        if 'location' not in validated_data and hasattr(self, 'initial_data'):
            loc_data = {
                'name': self.initial_data.get('name', 'Diagnostic Center'),
                'branch': self.initial_data.get('branch', ''),
                'location_type': Location.LocationType.DIAGNOSTIC_CENTER,
                'address_line': self.initial_data.get('address_line', self.initial_data.get('address', '')),
                'area': self.initial_data.get('area', ''),
                'district': self.initial_data.get('district', self.initial_data.get('city', 'Dhaka')),
                'division': self.initial_data.get('division', self.initial_data.get('city', 'Dhaka')),
                'phone': self.initial_data.get('phone', ''),
                'email': self.initial_data.get('email', ''),
                'description': self.initial_data.get('description', ''),
                'tagline': self.initial_data.get('tagline', ''),
                'badge': self.initial_data.get('badge', ''),
                'rating': float(self.initial_data.get('rating', 0.0)) if self.initial_data.get('rating') else 0.0,
                'reviews_count': int(self.initial_data.get('reviews_count', 0)) if self.initial_data.get('reviews_count') else 0,
                'open_timing': self.initial_data.get('open_timing', ''),
                'is_verified': bool(self.initial_data.get('is_verified', False)),
            }
            validated_data['location'] = Location.objects.create(**loc_data)

        diagnostic = super().create(validated_data)
        if services:
            diagnostic.services.set(services)
        if test_cat_ids:
            from tests.models import Test, FacilityTest
            tests = Test.objects.filter(category_id__in=test_cat_ids)
            for test in tests:
                FacilityTest.objects.get_or_create(
                    location=diagnostic.location,
                    test=test,
                    defaults={'price': 500.00, 'is_available': True}
                )
        return diagnostic

    def update(self, instance, validated_data):
        test_cat_ids = validated_data.pop('test_category_ids', None)
        if hasattr(self, 'initial_data') and instance.location:
            loc = instance.location
            for field in ['name', 'branch', 'address_line', 'area', 'district', 'division', 'phone', 'email', 'description', 'tagline', 'badge', 'open_timing']:
                if field in self.initial_data:
                    setattr(loc, field, self.initial_data[field])
            if 'address' in self.initial_data and 'address_line' not in self.initial_data:
                loc.address_line = self.initial_data['address']
            if 'rating' in self.initial_data:
                loc.rating = float(self.initial_data['rating'])
            if 'reviews_count' in self.initial_data:
                loc.reviews_count = int(self.initial_data['reviews_count'])
            if 'is_verified' in self.initial_data:
                loc.is_verified = bool(self.initial_data['is_verified'])
            loc.save()


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
