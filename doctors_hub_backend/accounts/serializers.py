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


class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    role_id = serializers.UUIDField(required=False, allow_null=True, write_only=True, default=None)
    facility_id = serializers.UUIDField(required=False, allow_null=True, write_only=True, default=None)

    class Meta:
        model = User
        fields = (
            'id', 'phone_number', 'password', 'first_name', 'last_name',
            'is_active', 'is_verified', 'is_staff', 'is_superuser',
            'role_id', 'facility_id'
        )
        read_only_fields = ('id',)

    def validate_phone_number(self, value):
        from core.validators import bangladesh_phone_validator
        from django.core.exceptions import ValidationError as DjangoValidationError
        phone = value.strip()
        try:
            bangladesh_phone_validator(phone)
        except DjangoValidationError as e:
            raise serializers.ValidationError(e.message)
        if User.objects.filter(phone_number=phone).exists():
            raise serializers.ValidationError("A user with this phone number already exists.")
        return phone

    def validate(self, attrs):
        request_user = self.context.get('request').user if self.context.get('request') else None
        is_creator_super = getattr(request_user, 'is_superuser', False) or getattr(request_user, 'is_super_admin', False)

        # Superuser and Staff privileges can only be set by Super Admins
        if attrs.get('is_superuser') and not is_creator_super:
            raise serializers.ValidationError({"is_superuser": "Only Super Admins can create superusers."})
        if attrs.get('is_staff') and not is_creator_super:
            attrs['is_staff'] = False

        role_id = attrs.get('role_id')
        facility_id = attrs.get('facility_id')

        if role_id:
            role = Role.objects.filter(id=role_id, is_active=True).first()
            if not role:
                raise serializers.ValidationError({"role_id": "Selected role does not exist or is inactive."})
            
            if role.scope_type == Role.ScopeType.GLOBAL and not is_creator_super:
                raise serializers.ValidationError({"role_id": "Only Super Admins can assign global roles."})

            if role.scope_type == Role.ScopeType.FACILITY:
                if not facility_id:
                    raise serializers.ValidationError({"facility_id": "A facility is required for facility-scoped roles."})
                from facilities.models import Location
                loc = Location.objects.filter(id=facility_id, is_active=True).first()
                if not loc:
                    raise serializers.ValidationError({"facility_id": "Selected facility does not exist."})
                if not is_creator_super and str(facility_id) not in [str(lid) for lid in getattr(request_user, 'managed_location_ids', [])]:
                    raise serializers.ValidationError({"facility_id": "You can only assign roles for facilities you manage."})

        return attrs

    def create(self, validated_data):
        password = validated_data.pop('password')
        role_id = validated_data.pop('role_id', None)
        facility_id = validated_data.pop('facility_id', None)

        user = User.objects.create(
            phone_number=validated_data.get('phone_number'),
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            is_active=validated_data.get('is_active', True),
            is_verified=validated_data.get('is_verified', True),
            is_staff=validated_data.get('is_staff', False),
            is_superuser=validated_data.get('is_superuser', False)
        )
        user.set_password(password)
        user.save()

        if role_id:
            from accounts.models import UserRole
            from facilities.models import Location
            role = Role.objects.get(id=role_id)
            facility = Location.objects.filter(id=facility_id).first() if facility_id else None
            UserRole.objects.create(user=user, role=role, facility=facility)

        return user

