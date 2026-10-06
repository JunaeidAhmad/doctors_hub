from rest_framework import serializers
from .models import TestCategory, Test, FacilityTest
from facilities.models import Location
from facilities.serializers_summary import FacilitySummarySerializer
from core.schema_serializers import SearchFacetsSerializer


class TestCategorySerializer(serializers.ModelSerializer):
    test_count = serializers.IntegerField(read_only=True, required=False)
    center_count = serializers.IntegerField(read_only=True, required=False)

    class Meta:
        model = TestCategory
        fields = ('id', 'name', 'slug', 'icon', 'description', 'is_active', 'order', 'test_count', 'center_count')


class TestSerializer(serializers.ModelSerializer):
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=TestCategory.objects.all(), source='category', required=False, allow_null=True
    )
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_slug = serializers.CharField(source='category.slug', read_only=True)

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
        queryset=Test.objects.all(), write_only=True, source='test', required=False
    )
    facility = FacilitySummarySerializer(source='location', read_only=True)
    location_id = serializers.PrimaryKeyRelatedField(
        queryset=Location.objects.all(), write_only=True, source='location', required=False
    )

    price = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, allow_null=True)
    calculated_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True, allow_null=True)
    discounted_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True, allow_null=True)

    class Meta:
        model = FacilityTest
        fields = (
            'id', 'location_id', 'facility', 'test_id', 'test_details', 'price',
            'discount_percent', 'calculated_price', 'discounted_price', 'report_time', 'is_available',
            'home_sample_collection', 'home_sample_charge', 'home_sample_note', 'updated_at'
        )

    def to_internal_value(self, data):
        mutable_data = data.copy() if hasattr(data, 'copy') else dict(data)
        if 'location' in mutable_data and not mutable_data.get('location_id'):
            mutable_data['location_id'] = mutable_data['location']
        if 'test' in mutable_data and not mutable_data.get('test_id'):
            mutable_data['test_id'] = mutable_data['test']
            
        # Parse discount_percent strings like "25% OFF" or "25%"
        if 'discount_percent' in mutable_data and isinstance(mutable_data['discount_percent'], str):
            import re
            cleaned = re.sub(r'[^\d.]', '', mutable_data['discount_percent'])
            mutable_data['discount_percent'] = cleaned if cleaned else 0
            
        # If frontend sent calculated_price but no explicit discount_percent, 
        # or if we want to infer the discount from the user's manual override of the final price.
        # We can calculate discount_percent = ((price - calculated_price) / price) * 100
        calc_price_val = data.get('calculated_price') or data.get('discounted_price')
        base_price_val = mutable_data.get('price')
        if calc_price_val is not None and base_price_val not in (None, '') and not mutable_data.get('discount_percent'):
            try:
                from decimal import Decimal
                base = Decimal(str(base_price_val))
                final = Decimal(str(calc_price_val))
                if base > 0:
                    mutable_data['discount_percent'] = ((base - final) / base) * 100
            except Exception:
                pass

        return super().to_internal_value(mutable_data)


class FacilityTestSearchOfferingSerializer(serializers.ModelSerializer):
    facility = FacilitySummarySerializer(source='location', read_only=True)
    price = serializers.DecimalField(max_digits=10, decimal_places=2, coerce_to_string=True, allow_null=True)
    discount_percent = serializers.DecimalField(max_digits=5, decimal_places=2, coerce_to_string=True, allow_null=True)
    calculated_price = serializers.DecimalField(max_digits=10, decimal_places=2, coerce_to_string=True, allow_null=True)
    home_sample_charge = serializers.DecimalField(max_digits=10, decimal_places=2, coerce_to_string=True, allow_null=True)

    class Meta:
        model = FacilityTest
        fields = (
            'id', 'facility', 'price', 'discount_percent', 'calculated_price',
            'report_time', 'is_available', 'home_sample_collection',
            'home_sample_charge', 'home_sample_note'
        )


class FacilityTestSearchGroupSerializer(serializers.ModelSerializer):
    category_id = serializers.UUIDField(source='category.id', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_slug = serializers.CharField(source='category.slug', read_only=True)
    min_price = serializers.CharField(read_only=True, allow_null=True)
    max_price = serializers.CharField(read_only=True, allow_null=True)
    offering_count = serializers.IntegerField(read_only=True)
    priced_offering_count = serializers.IntegerField(read_only=True)
    location_count = serializers.IntegerField(read_only=True)
    home_collection_count = serializers.IntegerField(read_only=True)
    offerings = FacilityTestSearchOfferingSerializer(source='matching_offerings', many=True, read_only=True)

    class Meta:
        model = Test
        fields = (
            'id', 'name', 'slug', 'code',
            'category_id', 'category_name', 'category_slug',
            'description', 'sample_type', 'preparation_instructions',
            'fasting_required', 'report_time_hours',
            'min_price', 'max_price',
            'offering_count', 'priced_offering_count', 'location_count', 'home_collection_count',
            'offerings'
        )


class TestOptionSerializer(serializers.ModelSerializer):
    """Lean test picker for admin init."""
    category_id = serializers.UUIDField(source='category.id', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = Test
        fields = ('id', 'name', 'code', 'category_id', 'category_name', 'is_active')
        read_only_fields = fields


class FacilityTestSearchResponseSerializer(serializers.Serializer):
    """Paginated envelope (SearchPagination.get_paginated_response) for facility test search."""
    count = serializers.IntegerField()
    total_pages = serializers.IntegerField()
    page = serializers.IntegerField()
    page_size = serializers.IntegerField()
    next = serializers.URLField(allow_null=True)
    previous = serializers.URLField(allow_null=True)
    facets = SearchFacetsSerializer()
    results = FacilityTestSearchGroupSerializer(many=True)
