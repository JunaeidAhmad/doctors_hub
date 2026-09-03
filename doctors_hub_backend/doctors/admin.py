from django.contrib import admin
from .models import DoctorSpecialty, Doctor, DoctorAffiliation, AffiliationSchedule


class AffiliationScheduleInline(admin.TabularInline):
    model = AffiliationSchedule
    extra = 1


class DoctorAffiliationInline(admin.TabularInline):
    model = DoctorAffiliation
    extra = 1


@admin.register(DoctorSpecialty)
class DoctorSpecialtyAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'slug', 'icon')
    search_fields = ('name', 'slug')


@admin.register(Doctor)
class DoctorAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'academic_title', 'institution', 'user', 'qualification', 'experience')
    search_fields = ('name', 'academic_title', 'institution', 'qualification', 'user__phone_number')
    inlines = [DoctorAffiliationInline]


@admin.register(DoctorAffiliation)
class DoctorAffiliationAdmin(admin.ModelAdmin):
    list_display = ('id', 'doctor', 'location', 'fee')
    search_fields = ('doctor__name', 'location__name')
    inlines = [AffiliationScheduleInline]


@admin.register(AffiliationSchedule)
class AffiliationScheduleAdmin(admin.ModelAdmin):
    list_display = ('id', 'affiliation', 'day_of_week', 'start_time', 'end_time')
