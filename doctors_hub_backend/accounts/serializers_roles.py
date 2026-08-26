from rest_framework import serializers
from .models import Role, UserRole, Permission
from core.rbac import get_user_permissions

class PermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Permission
        fields = ('id', 'codename', 'module', 'action', 'label', 'is_facility_grantable')

class RoleSerializer(serializers.ModelSerializer):
    permissions = serializers.PrimaryKeyRelatedField(
        queryset=Permission.objects.all(), 
        many=True,
        required=False
    )
    
    class Meta:
        model = Role
        fields = ('id', 'name', 'description', 'scope_type', 'owner_facility', 'is_system', 'is_active', 'permissions')
        read_only_fields = ('id', 'is_system')

    def validate(self, data):
        user = self.context['request'].user
        
        # Super admins can do anything
        if getattr(user, 'is_superuser', False) or user.is_super_admin:
            return data
            
        # For Facility Admins, enforce §4: Subset of authority
        # Scope must be facility or self
        scope_type = data.get('scope_type', self.instance.scope_type if self.instance else None)
        if scope_type == Role.ScopeType.GLOBAL:
            raise serializers.ValidationError({"scope_type": "Facility admins cannot create global roles."})
            
        # Owner facility must be one of the admin's managed facilities
        owner_facility = data.get('owner_facility', self.instance.owner_facility if self.instance else None)
        if not owner_facility or str(owner_facility.id) not in [str(loc_id) for loc_id in user.managed_location_ids]:
            raise serializers.ValidationError({"owner_facility": "You must assign the role to a facility you manage."})
            
        # Permissions must be a subset of the creator's own effective permissions AND is_facility_grantable
        if 'permissions' in data:
            requested_perms = data['permissions']
            effective_perms = get_user_permissions(user)
            
            for p in requested_perms:
                if not p.is_facility_grantable:
                    raise serializers.ValidationError({"permissions": f"Permission {p.codename} is not facility-grantable."})
                if p.codename not in effective_perms:
                    raise serializers.ValidationError({"permissions": f"You cannot grant {p.codename} because you do not hold it."})
                    
        return data

class UserSimpleSerializer(serializers.ModelSerializer):
    class Meta:
        from .models import User
        model = User
        fields = ('id', 'phone_number', 'first_name', 'last_name', 'is_active', 'is_staff', 'is_superuser')

class RoleSimpleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ('id', 'name', 'scope_type', 'is_system', 'description')

class FacilitySimpleSerializer(serializers.ModelSerializer):
    class Meta:
        from facilities.models import Location
        model = Location
        fields = ('id', 'name', 'branch', 'location_type')

class UserRoleSerializer(serializers.ModelSerializer):
    from .models import User
    user = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), required=False)
    phone_number = serializers.CharField(write_only=True, required=False, allow_blank=True)
    user_details = UserSimpleSerializer(source='user', read_only=True)
    role_details = RoleSimpleSerializer(source='role', read_only=True)
    facility_details = FacilitySimpleSerializer(source='facility', read_only=True)

    class Meta:
        model = UserRole
        fields = ('id', 'user', 'phone_number', 'role', 'facility', 'user_details', 'role_details', 'facility_details')
        validators = []

    def validate(self, data):
        request_user = self.context['request'].user
        from .models import User
        
        # Resolve user by phone_number if user PK not provided
        if not data.get('user'):
            phone = data.get('phone_number', '').strip()
            if not phone:
                raise serializers.ValidationError({"user": "Either user ID or phone_number is required."})
            user_obj = User.objects.filter(phone_number=phone).first()
            if not user_obj:
                raise serializers.ValidationError({"phone_number": f"No user account found with phone number {phone}."})
            data['user'] = user_obj

        # Remove write_only phone_number from validated data
        data.pop('phone_number', None)

        role = data.get('role', getattr(self.instance, 'role', None))
        facility = data.get('facility', getattr(self.instance, 'facility', None))

        if role and role.scope_type == Role.ScopeType.GLOBAL:
            if facility:
                data['facility'] = None

        if role and role.scope_type == Role.ScopeType.FACILITY:
            if not facility:
                raise serializers.ValidationError({"facility": "A facility location is required for facility-scoped roles."})

        # Check duplicate
        target_user = data.get('user', getattr(self.instance, 'user', None))
        existing_qs = UserRole.objects.filter(user=target_user, role=role, facility=data.get('facility'))
        if self.instance:
            existing_qs = existing_qs.exclude(id=self.instance.id)
        if existing_qs.exists():
            raise serializers.ValidationError({"detail": f"This user already has the '{role.name}' role assigned."})

        # If not super admin, check facility admin delegation limits
        if not (getattr(request_user, 'is_superuser', False) or getattr(request_user, 'is_super_admin', False)):
            if role.scope_type == Role.ScopeType.GLOBAL:
                raise serializers.ValidationError({"role": "Only platform super admins can assign global roles."})
            if facility and str(facility.id) not in [str(loc_id) for loc_id in request_user.managed_location_ids]:
                raise serializers.ValidationError({"facility": "You can only assign roles within facilities you manage."})
            if role.owner_facility and role.owner_facility != facility:
                raise serializers.ValidationError({"role": "This role belongs to a different facility."})
                
        return data
