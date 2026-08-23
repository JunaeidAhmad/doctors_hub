from django.db import transaction
from facilities.models import Location, Hospital, DiagnosticCenter
from tests.models import Test, FacilityTest


def _extract_or_create_location(location_data, default_type):
    if not location_data:
        return None
    loc_fields = {
        'name': location_data.get('name', 'Facility'),
        'branch': location_data.get('branch', ''),
        'location_type': location_data.get('location_type', default_type),
        'ownership_type': location_data.get('ownership_type', 'private'),
        'address_line': location_data.get('address_line', location_data.get('address', '')),
        'area': location_data.get('area', ''),
        'district': location_data.get('district', 'Dhaka'),
        'division': location_data.get('division', 'Dhaka'),
        'phone': location_data.get('phone', ''),
        'email': location_data.get('email', ''),
        'description': location_data.get('description', ''),
        'tagline': location_data.get('tagline', ''),
        'badge': location_data.get('badge', ''),
        'rating': float(location_data.get('rating', 0.0)) if location_data.get('rating') else 0.0,
        'reviews_count': int(location_data.get('reviews_count', 0)) if location_data.get('reviews_count') else 0,
        'open_timing': location_data.get('open_timing', ''),
        'is_verified': bool(location_data.get('is_verified', False)),
    }
    return Location.objects.create(**loc_fields)


def _update_location_fields(location, location_data):
    if not location or not location_data:
        return
    for field in ['name', 'branch', 'address_line', 'area', 'district', 'division', 'phone', 'email', 'description', 'tagline', 'badge', 'open_timing', 'ownership_type']:
        if field in location_data:
            setattr(location, field, location_data[field])
    if 'address' in location_data and 'address_line' not in location_data:
        location.address_line = location_data['address']
    if 'rating' in location_data:
        location.rating = float(location_data['rating'])
    if 'reviews_count' in location_data:
        location.reviews_count = int(location_data['reviews_count'])
    if 'is_verified' in location_data:
        location.is_verified = bool(location_data['is_verified'])
    location.save()


def _attach_category_tests(location, test_cat_ids, prices=None):
    if not test_cat_ids or not location:
        return
    prices = prices or {}
    tests = Test.objects.filter(category_id__in=test_cat_ids)
    for test in tests:
        price_val = prices.get(str(test.id), 500.00)
        if isinstance(price_val, dict):
            price = price_val.get('price', 500.00)
            discount_percent = price_val.get('discount_percent', 0.0)
        else:
            price = price_val
            discount_percent = 0.0
        FacilityTest.objects.get_or_create(
            location=location,
            test=test,
            defaults={'price': price, 'discount_percent': discount_percent, 'is_available': True}
        )


@transaction.atomic
def create_hospital(*, validated_data, location_data=None, services=None, test_cat_ids=None, prices=None):
    if 'location' not in validated_data and location_data:
        validated_data['location'] = _extract_or_create_location(location_data, Location.LocationType.HOSPITAL)

    hospital = Hospital.objects.create(**validated_data)
    if services:
        hospital.services.set(services)
    if test_cat_ids:
        _attach_category_tests(hospital.location, test_cat_ids, prices)
    return hospital


@transaction.atomic
def update_hospital(instance, *, validated_data, location_data=None, test_cat_ids=None, prices=None):
    if location_data and instance.location:
        _update_location_fields(instance.location, location_data)

    for attr, val in validated_data.items():
        if attr == 'services':
            instance.services.set(val)
        else:
            setattr(instance, attr, val)
    instance.save()

    if test_cat_ids:
        _attach_category_tests(instance.location, test_cat_ids, prices)
    return instance


@transaction.atomic
def create_diagnostic_center(*, validated_data, location_data=None, services=None, test_cat_ids=None, prices=None):
    if 'location' not in validated_data and location_data:
        validated_data['location'] = _extract_or_create_location(location_data, Location.LocationType.DIAGNOSTIC_CENTER)

    diagnostic = DiagnosticCenter.objects.create(**validated_data)
    if services:
        diagnostic.services.set(services)
    if test_cat_ids:
        _attach_category_tests(diagnostic.location, test_cat_ids, prices)
    return diagnostic


@transaction.atomic
def update_diagnostic_center(instance, *, validated_data, location_data=None, test_cat_ids=None, prices=None):
    if location_data and instance.location:
        _update_location_fields(instance.location, location_data)

    for attr, val in validated_data.items():
        if attr == 'services':
            instance.services.set(val)
        else:
            setattr(instance, attr, val)
    instance.save()

    if test_cat_ids:
        _attach_category_tests(instance.location, test_cat_ids, prices)
    return instance
