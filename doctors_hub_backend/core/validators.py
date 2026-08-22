from django.core.validators import RegexValidator

bangladesh_phone_validator = RegexValidator(
    regex=r'^(?:\+8801|8801|01)[3-9]\d{8}$',
    message="Phone number must be a valid Bangladeshi number (e.g. '01712345678' or '+8801712345678')."
)
