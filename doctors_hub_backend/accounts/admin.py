from django.contrib import admin
from .models import User
from facilities.models import FacilityMembership


class FacilityMembershipInline(admin.TabularInline):
    model = FacilityMembership
    extra = 1


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('id', 'phone_number', 'first_name', 'last_name', 'role', 'is_staff', 'is_superuser', 'is_active')
    list_filter = ('role', 'is_staff', 'is_superuser', 'is_active')
    search_fields = ('phone_number', 'first_name', 'last_name')
    inlines = [FacilityMembershipInline]
