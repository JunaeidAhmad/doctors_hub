from django.contrib import admin
from .models import (
    Division, District, Thana,
    Location, HospitalCategory, HospitalService, Hospital,
    DiagnosticCenterCategory, DiagnosticService, DiagnosticCenter, Chamber
)


@admin.register(Division)
class DivisionAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'bn_name', 'slug', 'order')
    search_fields = ('name', 'bn_name')


@admin.register(District)
class DistrictAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'bn_name', 'division', 'slug')
    list_filter = ('division',)
    search_fields = ('name', 'bn_name', 'division__name')


@admin.register(Thana)
class ThanaAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'bn_name', 'district', 'slug')
    list_filter = ('district__division', 'district')
    search_fields = ('name', 'bn_name', 'district__name')


@admin.register(Location)
class LocationAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'location_type', 'branch', 'area', 'district', 'division', 'is_verified', 'is_active')
    list_filter = ('location_type', 'thana__district__division', 'thana__district', 'is_verified', 'is_active')
    search_fields = ('name', 'branch', 'address_line', 'thana__name', 'thana__district__name', 'thana__district__division__name')
    autocomplete_fields = ('thana',)


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
    list_display = ('location', 'category')
    list_filter = ('category',)
    filter_horizontal = ('services',)


@admin.register(DiagnosticCenterCategory)
class DiagnosticCenterCategoryAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'slug', 'icon')
    search_fields = ('name', 'slug')


@admin.register(DiagnosticService)
class DiagnosticServiceAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'icon')
    search_fields = ('name',)


@admin.register(DiagnosticCenter)
class DiagnosticCenterAdmin(admin.ModelAdmin):
    list_display = ('location', 'category')
    list_filter = ('category',)
    filter_horizontal = ('services',)


@admin.register(Chamber)
class ChamberAdmin(admin.ModelAdmin):
    list_display = ('location', 'doctor', 'assistant_phone')
