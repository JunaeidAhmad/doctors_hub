from django.contrib import admin
from .models import DoctorBooking, LabBooking

@admin.register(DoctorBooking)
class DoctorBookingAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'affiliation', 'date', 'slot', 'patient_name', 'status')
    list_filter = ('status', 'date')

@admin.register(LabBooking)
class LabBookingAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'facility_test', 'pickup_date', 'patient_name', 'pickup_district', 'status')
    list_filter = ('status', 'pickup_date', 'pickup_district')

