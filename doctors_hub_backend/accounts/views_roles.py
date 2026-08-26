from rest_framework import viewsets, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from .models import Role, UserRole, Permission
from .serializers_roles import RoleSerializer, UserRoleSerializer, PermissionSerializer
from core.permissions import HasPagePermission
from core.rbac import get_user_permissions
from core.scoping import RoleScopedQuerysetMixin

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def my_permissions(request):
    """
    GET /api/auth/me/permissions/
    Returns the user's effective permissions and scope.
    """
    perms = get_user_permissions(request.user)
    scopes = set()
    for s_list in perms.values():
        for s in s_list:
            scopes.add(s)
            
    is_super = getattr(request.user, 'is_superuser', False) or getattr(request.user, 'is_super_admin', False)
    if is_super:
        scopes.add('global')
        
    return Response({
        "permissions": perms,
        "scopes": list(scopes),
        "is_super_admin": is_super,
        "is_facility_admin": getattr(request.user, 'is_facility_admin', False),
        "is_doctor": getattr(request.user, 'is_doctor_role', False),
    })

class RoleViewSet(RoleScopedQuerysetMixin, viewsets.ModelViewSet):
    """
    ViewSet for managing Roles.
    Uses HasPagePermission('roles') to enforce access.
    """
    permission_classes = [HasPagePermission]
    required_module = 'roles'
    serializer_class = RoleSerializer
    pagination_class = None
    
    # Scoping for roles: Super admin sees all, Facility admin sees roles for their facility
    scope_location_field = "owner_facility__in"
    always_scoped = True
    
    def get_queryset(self):
        qs = Role.objects.all().prefetch_related('permissions')
        return self.get_scoped_queryset(qs)

class UserRoleViewSet(RoleScopedQuerysetMixin, viewsets.ModelViewSet):
    """
    ViewSet for managing UserRole assignments.
    Uses HasPagePermission('users') to enforce access.
    """
    permission_classes = [HasPagePermission]
    required_module = 'users'
    serializer_class = UserRoleSerializer
    pagination_class = None
    
    scope_location_field = "facility__in"
    always_scoped = True
    
    def get_queryset(self):
        qs = UserRole.objects.all().select_related('user', 'role', 'facility')
        search_term = self.request.query_params.get('search', '').strip()
        if search_term:
            from django.db.models import Q
            qs = qs.filter(
                Q(user__phone_number__icontains=search_term) |
                Q(user__first_name__icontains=search_term) |
                Q(user__last_name__icontains=search_term) |
                Q(role__name__icontains=search_term) |
                Q(facility__name__icontains=search_term)
            )
        return self.get_scoped_queryset(qs)

    from rest_framework.decorators import action
    @action(detail=False, methods=['get'], url_path='search-users')
    def search_users(self, request):
        query = request.query_params.get('q', '').strip()
        from accounts.models import User
        from django.db.models import Q
        from .serializers_roles import UserSimpleSerializer
        
        if query:
            users = User.objects.filter(
                Q(phone_number__icontains=query) |
                Q(first_name__icontains=query) |
                Q(last_name__icontains=query)
            )[:20]
        else:
            users = User.objects.all().order_by('-date_joined')[:20]
            
        return Response(UserSimpleSerializer(users, many=True).data)

    @action(detail=False, methods=['get'], url_path='user-permissions/(?P<user_id>[^/.]+)')
    def user_permissions(self, request, user_id=None):
        from accounts.models import User
        from django.shortcuts import get_object_or_404
        target_user = get_object_or_404(User, id=user_id)
        perms = get_user_permissions(target_user)
        return Response({
            "user_id": str(target_user.id),
            "phone_number": target_user.phone_number,
            "permissions": perms
        })

class PermissionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read-only viewset for listing available permissions (the catalog).
    """
    permission_classes = [permissions.IsAuthenticated]
    queryset = Permission.objects.all()
    serializer_class = PermissionSerializer
    pagination_class = None
    
    def get_queryset(self):
        user = self.request.user
        qs = super().get_queryset()
        # Facility admins can only see facility-grantable permissions
        if not getattr(user, 'is_superuser', False) and not getattr(user, 'is_super_admin', False):
            qs = qs.filter(is_facility_grantable=True)
        return qs
