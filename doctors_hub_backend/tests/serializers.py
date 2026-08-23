from rest_framework import serializers
from .models import TestCategory, Test, FacilityTest
from facilities.models import Location
from facilities.serializers import LocationSerializer


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
    location_details = LocationSerializer(source='location', read_only=True)
    location_id = serializers.PrimaryKeyRelatedField(
        queryset=Location.objects.all(), write_only=True, source='location', required=False
    )
    facility_name = serializers.CharField(source='location.name', read_only=True, default='')
    facility_type = serializers.CharField(source='location.location_type', read_only=True, default='')

    calculated_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    discounted_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = FacilityTest
        fields = (
            'id', 'location_id', 'location_details', 'test_id', 'test_details', 'price',
            'discount_percent', 'calculated_price', 'discounted_price', 'report_time', 'is_available',
            'home_sample_collection', 'updated_at', 'facility_name', 'facility_type'
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
        if calc_price_val is not None and base_price_val is not None and not mutable_data.get('discount_percent'):
            try:
                from decimal import Decimal
                base = Decimal(str(base_price_val))
                final = Decimal(str(calc_price_val))
                if base > 0:
                    mutable_data['discount_percent'] = ((base - final) / base) * 100
            except Exception:
                pass

        return super().to_internal_value(mutable_data)
