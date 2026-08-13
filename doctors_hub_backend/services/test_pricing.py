from django.core.exceptions import ValidationError
from tests.models import FacilityTest, Test
from facilities.models import PracticeLocation

def attach_tests_to_location(
    *,
    location: PracticeLocation,
    test_category_ids: list[str] = None,
    test_ids: list[str] = None,
    test_prices: dict # Expected format: {"test_uuid": {"price": 500, "original_price": 600}}
):
    if location.location_type == PracticeLocation.LocationType.CHAMBER:
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

    objs_to_create = []

    # 3. Create the links, enforcing strict pricing (No fake prices)
    for test in tests_to_attach:
        price_data = test_prices.get(str(test.id))
        
        if not price_data or 'price' not in price_data:
            raise ValidationError(f"Missing required price for test: {test.name} (ID: {test.id})")
            
        objs_to_create.append(
            FacilityTest(
                location=location,
                test=test,
                price=price_data['price'],
                original_price=price_data.get('original_price')
            )
        )

    # 4. Bulk insert for high performance
    if objs_to_create:
        FacilityTest.objects.bulk_create(objs_to_create)
