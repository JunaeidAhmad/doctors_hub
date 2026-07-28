from django.contrib import admin
from .models import (
    User, Hospital, Branch, DoctorSpecialty, HospitalSpecialty, TestCategory, PathologyTest, BranchTest,
    Doctor, DoctorAffiliation, AffiliationSchedule,
    DoctorBooking, LabBooking
)

class AffiliationScheduleInline(admin.TabularInline):
    model = AffiliationSchedule
    extra = 1

class DoctorAffiliationInline(admin.TabularInline):
    model = DoctorAffiliation
    extra = 1

class BranchTestInline(admin.TabularInline):
    model = BranchTest
    extra = 1

@admin.register(Hospital)
class HospitalAdmin(admin.ModelAdmin):
    list_display = ('id', 'name')
    search_fields = ('name',)

@admin.register(Branch)
class BranchAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'hospital', 'city', 'verified', 'rating')
    list_filter = ('city', 'verified', 'hospital')
    search_fields = ('name', 'city', 'location')
    inlines = [BranchTestInline, DoctorAffiliationInline]

@admin.register(DoctorSpecialty)
class DoctorSpecialtyAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'icon')
    search_fields = ('name',)

@admin.register(HospitalSpecialty)
class HospitalSpecialtyAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'icon', 'count')
    search_fields = ('name',)

@admin.register(TestCategory)
class TestCategoryAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'icon', 'count')
    search_fields = ('name',)

@admin.register(PathologyTest)
class PathologyTestAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'category', 'test_category', 'fasting_required')
    list_filter = ('category', 'fasting_required')
    search_fields = ('name', 'category')

@admin.register(BranchTest)
class BranchTestAdmin(admin.ModelAdmin):
    list_display = ('id', 'branch', 'test', 'price', 'original_price', 'report_time')
    list_filter = ('branch', 'test__category')
    search_fields = ('branch__name', 'test__name')

@admin.register(Doctor)
class DoctorAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'qualification', 'experience')
    search_fields = ('name', 'qualification')
    inlines = [DoctorAffiliationInline]

@admin.register(DoctorAffiliation)
class DoctorAffiliationAdmin(admin.ModelAdmin):
    list_display = ('id', 'doctor', 'branch', 'consultation_type', 'fee')
    list_filter = ('consultation_type', 'branch')
    search_fields = ('doctor__name', 'branch__name')
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
    list_display = ('id', 'user', 'branch_test', 'pickup_date', 'patient_name', 'status')
    list_filter = ('status', 'pickup_date')

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('phone_number', 'first_name', 'last_name', 'is_staff', 'is_active')
