from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DoctorSpecialtyViewSet, DoctorViewSet, DoctorAffiliationViewSet, AffiliationScheduleViewSet


router = DefaultRouter()
router.register(r'specialties', DoctorSpecialtyViewSet, basename='specialty')
router.register(r'doctors', DoctorViewSet, basename='doctor')
router.register(r'affiliations', DoctorAffiliationViewSet, basename='affiliation')
router.register(r'schedules', AffiliationScheduleViewSet, basename='schedule')

urlpatterns = [
    path('', include(router.urls)),
]
