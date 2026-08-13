from django.contrib import admin
from .models import (
    Address, PracticeLocation, HospitalCategory, HospitalService, Hospital,
    DiagnosticCenterCategory, DiagnosticService, DiagnosticCenter, Chamber
)

@admin.register(Address)
class AddressAdmin(admin.ModelAdmin):
    list_display = ('id', 'address_line', 'city', 'district', 'division')

@admin.register(PracticeLocation)
class PracticeLocationAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'location_type', 'branch', 'is_verified', 'is_active')
    list_filter = ('location_type', 'is_verified', 'is_active')
    search_fields = ('name', 'branch')

@admin.register(HospitalCategory)
class HospitalCategoryAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'slug', 'icon', 'count')
    search_fields = ('name', 'slug')

@admin.register(HospitalService)
class HospitalServiceAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'icon')
    search_fields = ('name',)

@admin.register(Hospital)
class HospitalAdmin(admin.ModelAdmin):
    list_display = ('location',)
    filter_horizontal = ('categories', 'services')

@admin.register(DiagnosticCenterCategory)
class DiagnosticCenterCategoryAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'parent', 'slug')
    list_filter = ('parent',)
    search_fields = ('name', 'slug')

@admin.register(DiagnosticService)
class DiagnosticServiceAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'icon')
    search_fields = ('name',)

@admin.register(DiagnosticCenter)
class DiagnosticCenterAdmin(admin.ModelAdmin):
    list_display = ('location',)
    filter_horizontal = ('categories', 'services')

@admin.register(Chamber)
class ChamberAdmin(admin.ModelAdmin):
    list_display = ('location', 'doctor', 'assistant_phone')
