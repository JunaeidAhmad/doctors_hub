from django.db.models import Q
from accounts.models import Role


def is_admin_viewer(user) -> bool:
    """
    Returns True for an authenticated user who is super admin or has any active facility-scoped role.
    """
    if not user or not user.is_authenticated:
        return False
    if getattr(user, "is_superuser", False) or getattr(user, "is_super_admin", False):
        return True
    if hasattr(user, "user_roles"):
        return user.user_roles.filter(role__is_active=True, role__scope_type=Role.ScopeType.FACILITY).exists()
    if getattr(user, "is_facility_staff", False):
        return True
    return False


class PublicVisibilityMixin:
    """
    ViewSet mixin that enforces public visibility rules via `public_filter`.
    - Super admins bypass the filter and see all rows.
    - Public / unauthenticated viewers only see rows matching `public_filter`.
    - Facility-scoped admins see rows matching `public_filter` plus rows within their managed scope.
    """
    public_filter = None

    def get_public_filter(self):
        pf = self.public_filter
        if callable(pf):
            import inspect
            sig = inspect.signature(pf)
            return pf(self) if len(sig.parameters) > 0 else pf()
        return pf

    def apply_public_visibility(self, qs):
        user = getattr(self.request, "user", None)
        if user and (getattr(user, "is_superuser", False) or getattr(user, "is_super_admin", False)):
            return qs

        pf = self.get_public_filter()
        if pf is None:
            return qs

        if user and user.is_authenticated and is_admin_viewer(user):
            managed_ids = getattr(user, "managed_location_ids", [])
            scope_field = getattr(self, "scope_location_field", None)
            if managed_ids and scope_field:
                return qs.filter(pf | Q(**{scope_field: managed_ids})).distinct()
            return qs.filter(pf)

        return qs.filter(pf)

    def get_queryset(self):
        qs = super().get_queryset()
        return self.apply_public_visibility(qs)
