from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DoctorBookingViewSet, LabBookingViewSet

app_name = 'bookings'

router = DefaultRouter()
router.register(r'doctor', DoctorBookingViewSet, basename='doctor-booking')
router.register(r'doctor-bookings', DoctorBookingViewSet, basename='doctor-bookings')
router.register(r'lab', LabBookingViewSet, basename='lab-booking')
router.register(r'lab-bookings', LabBookingViewSet, basename='lab-bookings')

urlpatterns = [
    path('', include(router.urls)),
]
