from rest_framework import serializers
from drf_spectacular.utils import extend_schema_field
from .models import User, Role
from django.contrib.auth import authenticate


class ManagedLocationSummarySerializer(serializers.Serializer):
    id = serializers.UUIDField()
    name = serializers.CharField()
    branch = serializers.CharField(allow_blank=True)
    location_type = serializers.CharField()


class UserSerializer(serializers.ModelSerializer):
    managed_locations = serializers.SerializerMethodField()
    doctor_id = serializers.SerializerMethodField()
    role = serializers.SerializerMethodField()
    roles = serializers.SerializerMethodField()
    is_super_admin = serializers.SerializerMethodField()
    is_facility_admin = serializers.SerializerMethodField()
    is_doctor = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            'id', 'phone_number', 'first_name', 'last_name',
            'is_staff', 'is_superuser',
            'role', 'roles', 'is_super_admin', 'is_facility_admin', 'is_doctor',
            'managed_locations', 'doctor_id'
        )

    def get_role(self, obj):
        if getattr(obj, 'is_superuser', False) or getattr(obj, 'is_super_admin', False):
            return 'super_admin'
        if getattr(obj, 'is_facility_admin', False):
            return 'facility_admin'
        if getattr(obj, 'is_doctor_role', False):
            return 'doctor'
        if obj.user_roles.filter(role__name='Staff').exists():
            return 'staff'
        if obj.is_staff:
            return 'staff'
        return 'user'

    def get_roles(self, obj):
        return list(obj.user_roles.values_list('role__name', flat=True))

    def get_is_super_admin(self, obj):
        return getattr(obj, 'is_superuser', False) or getattr(obj, 'is_super_admin', False)

    def get_is_facility_admin(self, obj):
        return getattr(obj, 'is_facility_admin', False)

    def get_is_doctor(self, obj):
        return getattr(obj, 'is_doctor_role', False)

    @extend_schema_field(ManagedLocationSummarySerializer(many=True))
    def get_managed_locations(self, obj):
        if not getattr(obj, 'is_facility_admin', False):
            return []
        
        roles = obj.user_roles.filter(role__scope_type=Role.ScopeType.FACILITY, facility__isnull=False).select_related('facility')
        locations = {}
        for r in roles:
            if r.facility:
                locations[r.facility.id] = r.facility
                
        return [
            {
                "id": str(loc.id),
                "name": loc.name,
                "branch": loc.branch,
                "location_type": loc.location_type
            }
            for loc in locations.values()
        ]

    @extend_schema_field(serializers.CharField(allow_null=True))
    def get_doctor_id(self, obj):
        profile = getattr(obj, 'doctor_profile', None)
        return str(profile.id) if profile else None


class UserProfileSerializer(serializers.ModelSerializer):
    managed_locations = serializers.SerializerMethodField()
    doctor_id = serializers.SerializerMethodField()
    role = serializers.SerializerMethodField()
    roles = serializers.SerializerMethodField()
    is_super_admin = serializers.SerializerMethodField()
    is_facility_admin = serializers.SerializerMethodField()
    is_doctor = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            'id', 'phone_number', 'first_name', 'last_name',
            'is_staff', 'is_superuser',
            'role', 'roles', 'is_super_admin', 'is_facility_admin', 'is_doctor',
            'managed_locations', 'doctor_id'
        )
        read_only_fields = (
            'id', 'phone_number', 'is_staff', 'is_superuser',
            'role', 'roles', 'is_super_admin', 'is_facility_admin', 'is_doctor',
            'managed_locations', 'doctor_id'
        )

    def get_role(self, obj):
        if getattr(obj, 'is_superuser', False) or getattr(obj, 'is_super_admin', False):
            return 'super_admin'
        if getattr(obj, 'is_facility_admin', False):
            return 'facility_admin'
        if getattr(obj, 'is_doctor_role', False):
            return 'doctor'
        if obj.user_roles.filter(role__name='Staff').exists():
            return 'staff'
        if obj.is_staff:
            return 'staff'
        return 'user'

    def get_roles(self, obj):
        return list(obj.user_roles.values_list('role__name', flat=True))

    def get_is_super_admin(self, obj):
        return getattr(obj, 'is_superuser', False) or getattr(obj, 'is_super_admin', False)

    def get_is_facility_admin(self, obj):
        return getattr(obj, 'is_facility_admin', False)

    def get_is_doctor(self, obj):
        return getattr(obj, 'is_doctor_role', False)

    @extend_schema_field(ManagedLocationSummarySerializer(many=True))
    def get_managed_locations(self, obj):
        if not getattr(obj, 'is_facility_admin', False):
            return []
        
        roles = obj.user_roles.filter(role__scope_type=Role.ScopeType.FACILITY, facility__isnull=False).select_related('facility')
        locations = {}
        for r in roles:
            if r.facility:
                locations[r.facility.id] = r.facility
                
        return [
            {
                "id": str(loc.id),
                "name": loc.name,
                "branch": loc.branch,
                "location_type": loc.location_type
            }
            for loc in locations.values()
        ]

    @extend_schema_field(serializers.CharField(allow_null=True))
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
