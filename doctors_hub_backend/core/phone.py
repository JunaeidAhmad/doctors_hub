import re
from rest_framework import serializers

PHONE_REGEX = re.compile(r'^01[3-9]\d{8}$')
PHONE_ERROR_MESSAGE = "Phone number must be a valid Bangladeshi number (e.g. '01712345678' or '+8801712345678')."


def canonical_bd_phone(raw) -> str:
    if raw is None:
        raise ValueError(PHONE_ERROR_MESSAGE)
    digits = re.sub(r'\D', '', str(raw).strip())
    if digits.startswith('8801') and len(digits) == 13:
        digits = digits[2:]
    elif len(digits) == 10 and digits.startswith('1'):
        digits = '0' + digits

    if not PHONE_REGEX.match(digits):
        raise ValueError(PHONE_ERROR_MESSAGE)
    return digits


class BDPhoneField(serializers.CharField):
    default_error_messages = {
        'invalid': PHONE_ERROR_MESSAGE
    }

    def __init__(self, **kwargs):
        kwargs.setdefault('max_length', 20)
        super().__init__(**kwargs)

    def to_internal_value(self, data):
        data = super().to_internal_value(data)
        try:
            return canonical_bd_phone(data)
        except ValueError:
            self.fail('invalid')
