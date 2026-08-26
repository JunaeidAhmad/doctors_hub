from django.contrib import admin
from .models import User, Role, Permission, UserRole


class UserRoleInline(admin.TabularInline):
    model = UserRole
    extra = 1


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('id', 'phone_number', 'first_name', 'last_name', 'is_staff', 'is_superuser', 'is_active')
    list_filter = ('is_staff', 'is_superuser', 'is_active')
    search_fields = ('phone_number', 'first_name', 'last_name')
    inlines = [UserRoleInline]


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'scope_type', 'owner_facility', 'is_system', 'is_active')
    list_filter = ('scope_type', 'is_system', 'is_active')
    search_fields = ('name', 'description')
    filter_horizontal = ('permissions',)


@admin.register(Permission)
class PermissionAdmin(admin.ModelAdmin):
    list_display = ('id', 'codename', 'module', 'action', 'label', 'is_facility_grantable')
    list_filter = ('module', 'action', 'is_facility_grantable')
    search_fields = ('codename', 'label', 'module')


@admin.register(UserRole)
class UserRoleAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'role', 'facility')
    list_filter = ('role', 'facility')
    search_fields = ('user__phone_number', 'role__name', 'facility__name')
