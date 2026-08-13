from django.contrib import admin
from .models import TestCategory, Test, FacilityTest

@admin.register(TestCategory)
class TestCategoryAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'slug', 'order', 'is_active')
    list_filter = ('is_active',)
    search_fields = ('name', 'slug')

@admin.register(Test)
class TestAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'category', 'code', 'sample_type', 'fasting_required', 'is_active')
    list_filter = ('category', 'fasting_required', 'is_active')
    search_fields = ('name', 'code', 'category__name')

@admin.register(FacilityTest)
class FacilityTestAdmin(admin.ModelAdmin):
    list_display = ('id', 'location', 'test', 'price', 'discounted_price', 'is_available', 'home_sample_collection')
    list_filter = ('location', 'test__category', 'is_available', 'home_sample_collection')
    search_fields = ('location__name', 'test__name')
