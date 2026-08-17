from django.contrib import admin
from .models import (
    Location, HospitalCategory, HospitalService, Hospital,
    DiagnosticCenterCategory, DiagnosticService, DiagnosticCenter, Chamber,
    FacilityMembership
)


class FacilityMembershipInline(admin.TabularInline):
    model = FacilityMembership
    extra = 1


@admin.register(Location)
class LocationAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'location_type', 'branch', 'area', 'district', 'division', 'is_verified', 'is_active')
    list_filter = ('location_type', 'district', 'division', 'is_verified', 'is_active')
    search_fields = ('name', 'branch', 'address_line', 'area', 'district', 'division')
    inlines = [FacilityMembershipInline]


@admin.register(FacilityMembership)
class FacilityMembershipAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'location', 'role', 'created_at')
    list_filter = ('role',)
    search_fields = ('user__phone_number', 'location__name')


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
