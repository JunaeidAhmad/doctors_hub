from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    RegisterAPIView, LoginAPIView, UserProfileAPIView,
    HospitalViewSet, HospitalCategoryViewSet, HospitalServiceViewSet,
    DiagnosticCenterCategoryViewSet, DiagnosticServiceViewSet, DiagnosticCenterViewSet, DiagnosticCenterTestViewSet,
    TestCategoryViewSet, TestViewSet, DoctorSpecialtyViewSet, DoctorViewSet, DoctorAffiliationViewSet,
    DoctorBookingViewSet, LabBookingViewSet
)

router = DefaultRouter()
router.register(r'hospitals', HospitalViewSet, basename='hospital')
router.register(r'hospital-categories', HospitalCategoryViewSet, basename='hospital-category')
router.register(r'hospital-specialties', HospitalCategoryViewSet, basename='hospital-specialty')
router.register(r'hospital-services', HospitalServiceViewSet, basename='hospital-service')

router.register(r'diagnostic-center-categories', DiagnosticCenterCategoryViewSet, basename='diagnostic-center-category')
router.register(r'diagnostic-services', DiagnosticServiceViewSet, basename='diagnostic-service')
router.register(r'diagnostic-centers', DiagnosticCenterViewSet, basename='diagnostic-center')
router.register(r'diagnostic-center-tests', DiagnosticCenterTestViewSet, basename='diagnostic-center-test')

# Backward compatibility aliases
router.register(r'branches', DiagnosticCenterViewSet, basename='branch')
router.register(r'chambers', DiagnosticCenterViewSet, basename='chamber')
router.register(r'branch-tests', DiagnosticCenterTestViewSet, basename='branch-test')

router.register(r'test-categories', TestCategoryViewSet, basename='test-category')
router.register(r'tests', TestViewSet, basename='test')

router.register(r'specialties', DoctorSpecialtyViewSet, basename='specialty')
router.register(r'doctor-specialties', DoctorSpecialtyViewSet, basename='doctor-specialty')
router.register(r'doctors', DoctorViewSet, basename='doctor')
router.register(r'affiliations', DoctorAffiliationViewSet, basename='affiliation')
router.register(r'bookings/doctor', DoctorBookingViewSet, basename='doctor-booking')
router.register(r'bookings/lab', LabBookingViewSet, basename='lab-booking')

urlpatterns = [
    path('auth/register/', RegisterAPIView.as_view(), name='register'),
    path('auth/login/', LoginAPIView.as_view(), name='login'),
    path('auth/me/', UserProfileAPIView.as_view(), name='user-profile'),
    path('', include(router.urls)),
]
