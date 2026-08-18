from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DoctorBookingViewSet, LabBookingViewSet


router = DefaultRouter()
router.register(r'doctor', DoctorBookingViewSet, basename='doctor-booking')
router.register(r'lab', LabBookingViewSet, basename='lab-booking')

urlpatterns = [
    path('', include(router.urls)),
]
