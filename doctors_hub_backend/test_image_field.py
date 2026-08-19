import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")
django.setup()

from facilities.serializers import LocationSerializer

data = {
    "name": "Test Location",
    "location_type": "hospital",
    "address_line": "123 Main St",
    "district": "Dhaka",
    "division": "Dhaka",
    "logo": "https://example.com/logo.png"
}
serializer = LocationSerializer(data=data)
print("Is Valid?", serializer.is_valid())
print("Errors:", serializer.errors)
