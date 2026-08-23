from django.core.exceptions import ValidationError
from tests.models import FacilityTest, Test
from facilities.models import Location

def attach_tests_to_location(
    *,
    location: Location,
    test_category_ids: list[str] = None,
    test_ids: list[str] = None,
    test_prices: dict # Expected format: {"test_uuid": {"price": 500, "discount_percent": 10}}
):
    if location.location_type == Location.LocationType.CHAMBER:
        raise ValidationError("Chambers cannot offer lab tests.")

    tests_to_attach = set()

    # 1. Gather tests by individual IDs
    if test_ids:
        tests_to_attach.update(Test.objects.filter(id__in=test_ids))

    # 2. Gather all tests inside requested categories
    if test_category_ids:
        category_tests = Test.objects.filter(category_id__in=test_category_ids)
        tests_to_attach.update(category_tests)

    if not tests_to_attach:
        return

    existing = {
        ft.test_id: ft
        for ft in FacilityTest.objects.filter(location=location, test__in=tests_to_attach)
    }
    to_create, to_update = [], []

    # 3. Create or update the links, enforcing strict pricing (No fake prices)
    for test in tests_to_attach:
        price_data = test_prices.get(str(test.id))
        
        if not price_data or 'price' not in price_data:
            raise ValidationError(f"Missing required price for test: {test.name} (ID: {test.id})")
            
        discount_percent = price_data.get('discount_percent', 0.0)
        if test.id in existing:
            ft = existing[test.id]
            ft.price = price_data['price']
            ft.discount_percent = discount_percent
            to_update.append(ft)
        else:
            to_create.append(
                FacilityTest(
                    location=location,
                    test=test,
                    price=price_data['price'],
                    discount_percent=discount_percent
                )
            )

    # 4. Bulk insert/update for high performance
    if to_create:
        FacilityTest.objects.bulk_create(to_create)
    if to_update:
        FacilityTest.objects.bulk_update(to_update, ['price', 'discount_percent'])
