from rest_framework import serializers
from .models import User
from django.contrib.auth import authenticate


class UserSerializer(serializers.ModelSerializer):
    managed_locations = serializers.SerializerMethodField()
    doctor_id = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            'id', 'phone_number', 'first_name', 'last_name',
            'role', 'is_staff', 'is_superuser',
            'managed_locations', 'doctor_id'
        )

    def get_managed_locations(self, obj):
        if not getattr(obj, 'is_facility_admin', False):
            return []
        memberships = obj.facility_memberships.filter(role="admin").select_related('location')
        return [
            {
                "id": str(m.location.id),
                "name": m.location.name,
                "branch": m.location.branch,
                "location_type": m.location.location_type
            }
            for m in memberships
        ]

    def get_doctor_id(self, obj):
        profile = getattr(obj, 'doctor_profile', None)
        return str(profile.id) if profile else None


class UserProfileSerializer(serializers.ModelSerializer):
    managed_locations = serializers.SerializerMethodField()
    doctor_id = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            'id', 'phone_number', 'first_name', 'last_name',
            'role', 'is_staff', 'is_superuser',
            'managed_locations', 'doctor_id'
        )
        read_only_fields = ('id', 'phone_number', 'role', 'is_staff', 'is_superuser', 'managed_locations', 'doctor_id')

    def get_managed_locations(self, obj):
        if not getattr(obj, 'is_facility_admin', False):
            return []
        memberships = obj.facility_memberships.filter(role="admin").select_related('location')
        return [
            {
                "id": str(m.location.id),
                "name": m.location.name,
                "branch": m.location.branch,
                "location_type": m.location.location_type
            }
            for m in memberships
        ]

    def get_doctor_id(self, obj):
        profile = getattr(obj, 'doctor_profile', None)
        return str(profile.id) if profile else None


class LoginSerializer(serializers.Serializer):
    phone_number = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        phone = data.get('phone_number', '').strip()
        pwd = data.get('password', '')

        # Standard Django authentication
        user = authenticate(username=phone, password=pwd) or authenticate(phone_number=phone, password=pwd)

        # Direct lookup fallback
        if not user:
            try:
                u = User.objects.get(phone_number=phone)
                if u.check_password(pwd) and u.is_active:
                    user = u
            except User.DoesNotExist:
                pass

        if user and user.is_active:
            return user
        raise serializers.ValidationError("Incorrect Credentials")
