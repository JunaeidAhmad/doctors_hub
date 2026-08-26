import uuid
from django.db import models
from .rbac import get_scope_for_permission

def location_id_for(obj):
    if obj is None: return None
    if hasattr(obj, "location_type") and hasattr(obj, "address_line"): return obj.id
    if hasattr(obj, "location_id") and obj.location_id: return obj.location_id
    if hasattr(obj, "location") and obj.location: return getattr(obj.location, "id", None)
    if hasattr(obj, "affiliation") and obj.affiliation: return location_id_for(obj.affiliation)
    if hasattr(obj, "affiliation_id") and obj.affiliation_id:
        if hasattr(obj, "affiliation") and obj.affiliation: return location_id_for(obj.affiliation)
    if hasattr(obj, "facility_test_id") and obj.facility_test_id:
        if hasattr(obj, "facility_test") and obj.facility_test: return location_id_for(obj.facility_test)
    return None

def doctor_id_for(obj):
    if obj is None: return None
    if hasattr(obj, "qualification") and hasattr(obj, "specialties"): return obj.id
    if hasattr(obj, "doctor_id") and obj.doctor_id: return obj.doctor_id
    if hasattr(obj, "doctor") and obj.doctor: return getattr(obj.doctor, "id", None)
    if hasattr(obj, "affiliation") and obj.affiliation: return doctor_id_for(obj.affiliation)
    return None


class RoleScopedQuerySet(models.QuerySet):
    """
    Custom queryset to filter rows based on a user's RBAC scope for a given module and action.
    Usage: Model.objects = RoleScopedQuerySet.as_manager()
    """
    def for_user(self, user, module, action, location_field="location__in", doctor_field="doctor"):
        from accounts.models import Role
        
        if getattr(user, "is_superuser", False):
            return self
            
        if not user.is_authenticated:
            return self.none()
            
        scopes = get_scope_for_permission(user, module, action)
        if not scopes:
            return self.none()
            
        if Role.ScopeType.GLOBAL in scopes:
            return self
            
        q_filter = models.Q()
        if Role.ScopeType.FACILITY in scopes:
            managed_ids = user.managed_location_ids
            if managed_ids:
                q_filter |= models.Q(**{location_field: managed_ids})
                
        if Role.ScopeType.SELF in scopes:
            doctor_profile = getattr(user, "doctor_profile", None)
            if doctor_profile:
                if doctor_field in ("pk", "id"):
                    q_filter |= models.Q(pk=doctor_profile.id)
                elif doctor_field.endswith("__user") or doctor_field == "user":
                    q_filter |= models.Q(**{doctor_field: user})
                elif doctor_field.endswith("__doctor") or doctor_field == "doctor":
                    q_filter |= models.Q(**{doctor_field: doctor_profile})
                else:
                    q_filter |= models.Q(**{doctor_field: doctor_profile.id})
                    
        if not q_filter:
            return self.none()
            
        return self.filter(q_filter).distinct()


class RoleScopedQuerysetMixin:
    """
    ViewSet mixin that narrows querysets based on the authenticated user's role.
    Integrates with new RBAC system while keeping fallback legacy scoping.
    """
    scope_location_field = "location__in"
    scope_doctor_field = "doctor__user"
    always_scoped = False 

    def get_scoped_queryset(self, qs):
        user = self.request.user
        
        if user and getattr(user, "is_superuser", False):
            return qs

        required_module = getattr(self, 'required_module', None)
        action = 'view'
        if hasattr(self, 'action') and self.action:
            if self.action in ['update', 'partial_update']: action = 'edit'
            elif self.action == 'destroy': action = 'delete'
            elif self.action == 'create': action = 'create'
            elif self.action not in ['list', 'retrieve']: action = self.action
            
        if required_module:
            # New RBAC flow using .for_user if available, else manual fallback
            if hasattr(qs, 'for_user'):
                return qs.for_user(user, required_module, action, self.scope_location_field, self.scope_doctor_field)
            
            # Manual fallback logic identical to for_user
            from accounts.models import Role
            scopes = get_scope_for_permission(user, required_module, action)
            if not scopes: return qs.none()
            if Role.ScopeType.GLOBAL in scopes: return qs
            
            q_filter = models.Q()
            if Role.ScopeType.FACILITY in scopes:
                managed_ids = user.managed_location_ids
                if managed_ids: q_filter |= models.Q(**{self.scope_location_field: managed_ids})
            if Role.ScopeType.SELF in scopes:
                doctor_profile = getattr(user, "doctor_profile", None)
                if doctor_profile:
                    q_filter |= models.Q(**{self.scope_doctor_field: doctor_profile.id}) # Simplified fallback
            if not q_filter: return qs.none()
            return qs.filter(q_filter).distinct()
            

        # Legacy logic fallback
        is_managed_request = self.request.query_params.get("scope") == "managed"
        if not self.always_scoped and not is_managed_request:
            return qs

        if not user or not user.is_authenticated:
            return qs.none()

        if getattr(user, "is_facility_admin", False):
            managed_ids = user.managed_location_ids
            if not managed_ids: return qs.none()
            return qs.filter(**{self.scope_location_field: managed_ids}).distinct()

        if getattr(user, "is_doctor_role", False):
            doctor_profile = getattr(user, "doctor_profile", None)
            if not doctor_profile: return qs.none()
            return qs.filter(**{self.scope_doctor_field: doctor_profile.id}).distinct()

        return qs.none()
