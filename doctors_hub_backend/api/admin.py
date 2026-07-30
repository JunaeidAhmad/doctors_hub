from django.contrib import admin
from .models import (
    User, DoctorSpecialty, HospitalCategory, HospitalService, Hospital,
    TestCategory, Test, DiagnosticCenterCategory, DiagnosticService, DiagnosticCenter, DiagnosticCenterTest,
    Doctor, DoctorAffiliation, AffiliationSchedule, DoctorBooking, LabBooking
)


class AffiliationScheduleInline(admin.TabularInline):
    model = AffiliationSchedule
    extra = 1


class DoctorAffiliationInline(admin.TabularInline):
    model = DoctorAffiliation
    extra = 1


class DiagnosticCenterTestInline(admin.TabularInline):
    model = DiagnosticCenterTest
    extra = 1


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('id', 'phone_number', 'first_name', 'last_name', 'is_staff', 'is_active')
    search_fields = ('phone_number', 'first_name', 'last_name')


@admin.register(DoctorSpecialty)
class DoctorSpecialtyAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'slug', 'icon')
    search_fields = ('name', 'slug')


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
    list_display = ('id', 'name', 'branch', 'city', 'district', 'is_verified', 'rating')
    list_filter = ('city', 'is_verified', 'categories')
    search_fields = ('name', 'branch', 'city', 'district', 'address')
    inlines = [DoctorAffiliationInline]


@admin.register(TestCategory)
class TestCategoryAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'parent', 'slug', 'order', 'is_active', 'is_leaf_level')
    list_filter = ('is_active', 'parent')
    search_fields = ('name', 'slug')


@admin.register(Test)
class TestAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'category', 'code', 'sample_type', 'fasting_required', 'is_active')
    list_filter = ('category', 'fasting_required', 'is_active')
    search_fields = ('name', 'code', 'category__name')


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
    list_display = ('id', 'name', 'branch', 'district', 'division', 'is_verified', 'is_active', 'rating')
    list_filter = ('district', 'division', 'is_verified', 'is_active')
    search_fields = ('name', 'branch', 'district', 'division', 'address')
    inlines = [DiagnosticCenterTestInline, DoctorAffiliationInline]


@admin.register(DiagnosticCenterTest)
class DiagnosticCenterTestAdmin(admin.ModelAdmin):
    list_display = ('id', 'center', 'test', 'price', 'discounted_price', 'is_available', 'home_sample_collection')
    list_filter = ('center', 'test__category', 'is_available', 'home_sample_collection')
    search_fields = ('center__name', 'test__name')


@admin.register(Doctor)
class DoctorAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'qualification', 'experience')
    search_fields = ('name', 'qualification')
    inlines = [DoctorAffiliationInline]


@admin.register(DoctorAffiliation)
class DoctorAffiliationAdmin(admin.ModelAdmin):
    list_display = ('id', 'doctor', 'hospital', 'diagnostic_center', 'consultation_type', 'fee')
    list_filter = ('consultation_type',)
    search_fields = ('doctor__name', 'hospital__name', 'diagnostic_center__name')
    inlines = [AffiliationScheduleInline]


@admin.register(AffiliationSchedule)
class AffiliationScheduleAdmin(admin.ModelAdmin):
    list_display = ('id', 'affiliation', 'day_of_week', 'start_time', 'end_time')


@admin.register(DoctorBooking)
class DoctorBookingAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'affiliation', 'date', 'slot', 'patient_name', 'status')
    list_filter = ('status', 'date')


@admin.register(LabBooking)
class LabBookingAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'center_test', 'pickup_date', 'patient_name', 'status')
    list_filter = ('status', 'pickup_date')
