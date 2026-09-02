from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    DoctorBookingViewSet, TestBookingViewSet, HospitalServiceBookingViewSet,
    PatientViewSet, send_otp, verify_otp, patient_lookup
)


router = DefaultRouter()
router.register(r'doctor', DoctorBookingViewSet, basename='doctor-booking')
router.register(r'doctor-bookings', DoctorBookingViewSet, basename='doctor-bookings')
router.register(r'test', TestBookingViewSet, basename='test-booking')
router.register(r'test-bookings', TestBookingViewSet, basename='test-bookings')
router.register(r'lab', TestBookingViewSet, basename='lab-booking')
router.register(r'lab-bookings', TestBookingViewSet, basename='lab-bookings')
router.register(r'hospital-service', HospitalServiceBookingViewSet, basename='hospital-service-booking')
router.register(r'hospital-services', HospitalServiceBookingViewSet, basename='hospital-services-booking')
router.register(r'patients', PatientViewSet, basename='patient')

urlpatterns = [
    path('otp/send/', send_otp, name='otp-send'),
    path('otp/verify/', verify_otp, name='otp-verify'),
    path('patients/lookup/', patient_lookup, name='patient-lookup'),
    path('', include(router.urls)),
]

