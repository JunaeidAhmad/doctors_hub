from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AddressViewSet, PracticeLocationViewSet, HospitalCategoryViewSet, HospitalServiceViewSet,
    HospitalViewSet, DiagnosticCenterCategoryViewSet, DiagnosticServiceViewSet,
    DiagnosticCenterViewSet, ChamberViewSet, BranchViewSet, HospitalSpecialtyViewSet
)

app_name = 'facilities'

router = DefaultRouter()
router.register(r'addresses', AddressViewSet, basename='address')
router.register(r'practice-locations', PracticeLocationViewSet, basename='practice-location')
router.register(r'hospitals', HospitalViewSet, basename='hospital')
router.register(r'hospital-categories', HospitalCategoryViewSet, basename='hospital-category')
router.register(r'hospital-specialties', HospitalSpecialtyViewSet, basename='hospital-specialty')
router.register(r'hospital-services', HospitalServiceViewSet, basename='hospital-service')

router.register(r'diagnostic-center-categories', DiagnosticCenterCategoryViewSet, basename='diagnostic-center-category')
router.register(r'diagnostic-services', DiagnosticServiceViewSet, basename='diagnostic-service')
router.register(r'diagnostic-centers', DiagnosticCenterViewSet, basename='diagnostic-center')
router.register(r'chambers', ChamberViewSet, basename='chamber')

# Backward compatibility aliases
router.register(r'branches', BranchViewSet, basename='branch')

urlpatterns = [
    path('', include(router.urls)),
]
