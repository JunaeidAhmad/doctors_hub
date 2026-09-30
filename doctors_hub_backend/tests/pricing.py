from decimal import Decimal
from django.db.models import F, Value, DecimalField
from django.db.models.functions import Round, Coalesce


def net_price():
    """
    Django expression returning the calculated net price after discount.
    Round(price - price * Coalesce(discount_percent, 0) / 100, 2)
    """
    return Round(
        F('price') - F('price') * Coalesce(F('discount_percent'), Value(Decimal('0'))) / Value(Decimal('100')),
        2,
        output_field=DecimalField(max_digits=10, decimal_places=2)
    )
