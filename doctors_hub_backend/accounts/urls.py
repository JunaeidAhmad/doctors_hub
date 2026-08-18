from django.urls import path
from .views import (
    LoginAPIView,
    UserProfileAPIView,
    FacilityRegisterAPIView,
    DoctorRegisterAPIView,
    FacilityStaffListCreateAPIView,
    FacilityStaffDeleteAPIView,
    VerificationQueueAPIView,
    VerificationApproveRejectAPIView,
    PlatformAdminListCreateAPIView
)


urlpatterns = [
    # Authentication & Profile
    path('auth/login/', LoginAPIView.as_view(), name='login'),
    path('auth/me/', UserProfileAPIView.as_view(), name='user-profile'),

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
