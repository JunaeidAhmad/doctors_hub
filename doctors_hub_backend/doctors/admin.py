from django.contrib import admin
from core.rbac import has_permission
from .models import DoctorSpecialty, SpecialtyAlias, Doctor, DoctorAffiliation, AffiliationSchedule


class RBACAdminMixin:
    """Delegates Django Admin permissions to the system RBAC framework."""
    rbac_module = 'categories'

    def has_module_permission(self, request):
        if not request.user or not request.user.is_authenticated:
            return False
        return (
            getattr(request.user, 'is_superuser', False) or
            getattr(request.user, 'is_super_admin', False) or
            has_permission(request.user, self.rbac_module, 'view') or
            has_permission(request.user, 'doctors', 'view')
        )

    def has_view_permission(self, request, obj=None):
        if not request.user or not request.user.is_authenticated:
            return False
        return (
            getattr(request.user, 'is_superuser', False) or
            getattr(request.user, 'is_super_admin', False) or
            has_permission(request.user, self.rbac_module, 'view')
        )

    def has_add_permission(self, request):
        if not request.user or not request.user.is_authenticated:
            return False
        return (
            getattr(request.user, 'is_superuser', False) or
            getattr(request.user, 'is_super_admin', False) or
            has_permission(request.user, self.rbac_module, 'create')
        )

    def has_change_permission(self, request, obj=None):
        if not request.user or not request.user.is_authenticated:
            return False
        return (
            getattr(request.user, 'is_superuser', False) or
            getattr(request.user, 'is_super_admin', False) or
            has_permission(request.user, self.rbac_module, 'edit')
        )

    def has_delete_permission(self, request, obj=None):
        if not request.user or not request.user.is_authenticated:
            return False
        return (
            getattr(request.user, 'is_superuser', False) or
            getattr(request.user, 'is_super_admin', False) or
            has_permission(request.user, self.rbac_module, 'delete')
        )


class SpecialtyAliasInline(admin.TabularInline):
    model = SpecialtyAlias
    extra = 1
    fields = ('name', 'normalized', 'language', 'is_verified')
    readonly_fields = ('normalized', 'language')


@admin.register(DoctorSpecialty)
class DoctorSpecialtyAdmin(RBACAdminMixin, admin.ModelAdmin):
    list_display = ('name', 'canonical_name', 'bn_name', 'slug', 'icon', 'aliases_count', 'doctor_count')
    search_fields = ('name', 'canonical_name', 'bn_name', 'slug')
    filter_horizontal = ('components',)
    inlines = [SpecialtyAliasInline]

    def aliases_count(self, obj):
        return obj.aliases.count()
    aliases_count.short_description = "Aliases"

    def doctor_count(self, obj):
        return obj.doctors.count()
    doctor_count.short_description = "Doctors"


@admin.register(SpecialtyAlias)
class SpecialtyAliasAdmin(RBACAdminMixin, admin.ModelAdmin):
    list_display = ('name', 'specialty', 'normalized', 'language', 'is_verified')
    list_filter = ('is_verified', 'language', 'specialty')
    list_editable = ('specialty', 'is_verified')
    search_fields = ('name', 'normalized', 'specialty__name', 'specialty__canonical_name')
    readonly_fields = ('normalized', 'language')


class AffiliationScheduleInline(admin.TabularInline):
    model = AffiliationSchedule
    extra = 1


class DoctorAffiliationInline(admin.TabularInline):
    model = DoctorAffiliation
    extra = 1


@admin.register(Doctor)
class DoctorAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'academic_title', 'institution', 'gender', 'rating', 'status', 'is_verified')
    list_filter = ('gender', 'is_verified', 'status')
    search_fields = ('name', 'academic_title', 'institution', 'qualification', 'bmdc_number', 'user__phone_number')
    inlines = [DoctorAffiliationInline]


@admin.register(DoctorAffiliation)
class DoctorAffiliationAdmin(admin.ModelAdmin):
    list_display = ('id', 'doctor', 'location', 'chamber_type', 'fee', 'status_label')
    list_filter = ('chamber_type',)
    search_fields = ('doctor__name', 'location__name', 'chamber_type', 'status_label')
    inlines = [AffiliationScheduleInline]


@admin.register(AffiliationSchedule)
class AffiliationScheduleAdmin(admin.ModelAdmin):
    list_display = ('id', 'affiliation', 'day_of_week', 'start_time', 'end_time')
