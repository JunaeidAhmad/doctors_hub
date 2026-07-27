from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    RegisterAPIView, LoginAPIView, UserProfileAPIView,
    HospitalViewSet, BranchViewSet, SpecialtyViewSet, PathologyTestViewSet,
    BranchTestViewSet, DoctorViewSet, DoctorAffiliationViewSet,
    DoctorBookingViewSet, LabBookingViewSet
)

router = DefaultRouter()
router.register(r'hospitals', HospitalViewSet)
router.register(r'branches', BranchViewSet, basename='branch')
router.register(r'chambers', BranchViewSet, basename='chamber')
router.register(r'specialties', SpecialtyViewSet)
router.register(r'tests', PathologyTestViewSet)
router.register(r'branch-tests', BranchTestViewSet)
router.register(r'doctors', DoctorViewSet)
router.register(r'affiliations', DoctorAffiliationViewSet)
router.register(r'bookings/doctor', DoctorBookingViewSet, basename='doctor-booking')
router.register(r'bookings/lab', LabBookingViewSet, basename='lab-booking')

urlpatterns = [
    path('auth/register/', RegisterAPIView.as_view(), name='register'),
    path('auth/login/', LoginAPIView.as_view(), name='login'),
    path('auth/me/', UserProfileAPIView.as_view(), name='user-profile'),
    path('', include(router.urls)),
]
