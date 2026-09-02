from django.contrib import admin
from .models import DoctorBooking, TestBooking, HospitalServiceBooking, Patient, OTPVerification


@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'phone', 'age', 'gender', 'blood_group', 'created_at')
    search_fields = ('name', 'phone')
    list_filter = ('gender', 'blood_group')


@admin.register(OTPVerification)
class OTPVerificationAdmin(admin.ModelAdmin):
    list_display = ('id', 'phone', 'otp_code', 'purpose', 'is_verified', 'expires_at', 'created_at')
    search_fields = ('phone', 'otp_code')
    list_filter = ('purpose', 'is_verified')


@admin.register(DoctorBooking)
class DoctorBookingAdmin(admin.ModelAdmin):
    list_display = ('id', 'serial_number', 'patient_name', 'patient_phone', 'affiliation', 'date', 'slot', 'status')
    list_filter = ('status', 'date')
    search_fields = ('patient_name', 'patient_phone')


@admin.register(TestBooking)
class TestBookingAdmin(admin.ModelAdmin):
    list_display = ('id', 'patient_name', 'patient_phone', 'facility_test', 'pickup_date', 'pickup_district', 'status')
    list_filter = ('status', 'pickup_date', 'pickup_district')
    search_fields = ('patient_name', 'patient_phone')


@admin.register(HospitalServiceBooking)
class HospitalServiceBookingAdmin(admin.ModelAdmin):
    list_display = ('id', 'patient_name', 'patient_phone', 'hospital', 'service', 'booking_date', 'status')
    list_filter = ('status', 'booking_date')
    search_fields = ('patient_name', 'patient_phone')


