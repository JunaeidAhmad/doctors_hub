from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    LoginAPIView,
    CookieTokenRefreshAPIView,
    LogoutAPIView,
    UserProfileAPIView,
    FacilityRegisterAPIView,
    DoctorRegisterAPIView,
    FacilityStaffListCreateAPIView,
    FacilityStaffDeleteAPIView,
    VerificationQueueAPIView,
    VerificationApproveRejectAPIView,
    PlatformAdminListCreateAPIView
)
from .views_roles import my_permissions, RoleViewSet, UserRoleViewSet, PermissionViewSet

router = DefaultRouter()
router.register(r'roles', RoleViewSet, basename='roles')
router.register(r'user-roles', UserRoleViewSet, basename='user-roles')
router.register(r'permissions-catalog', PermissionViewSet, basename='permissions-catalog')

urlpatterns = [
    # RBAC Routers
    path('', include(router.urls)),
    
    # Authentication & Profile
    path('auth/login/', LoginAPIView.as_view(), name='login'),
    path('auth/refresh/', CookieTokenRefreshAPIView.as_view(), name='token-refresh'),
    path('auth/logout/', LogoutAPIView.as_view(), name='logout'),
    path('auth/me/', UserProfileAPIView.as_view(), name='user-profile'),
    path('auth/me/permissions/', my_permissions, name='my-permissions'),

    # Self-Registration (Public)
    path('auth/register/facility/', FacilityRegisterAPIView.as_view(), name='register-facility'),
    path('auth/register/doctor/', DoctorRegisterAPIView.as_view(), name='register-doctor'),

    # Delegated Staff Management (Facility Admin / Super Admin)
    path('facilities/<uuid:location_id>/staff/', FacilityStaffListCreateAPIView.as_view(), name='facility-staff-list-create'),
    path('facilities/<uuid:location_id>/staff/<uuid:user_id>/', FacilityStaffDeleteAPIView.as_view(), name='facility-staff-delete'),

    # Super Admin Verification Queue
    path('admin/verifications/', VerificationQueueAPIView.as_view(), name='admin-verifications'),
    path('admin/verifications/<str:entity_type>/<uuid:entity_id>/', VerificationApproveRejectAPIView.as_view(), name='admin-verification-action'),

    # Super Admin Platform Management
    path('admin/platform-admins/', PlatformAdminListCreateAPIView.as_view(), name='platform-admins'),
]
