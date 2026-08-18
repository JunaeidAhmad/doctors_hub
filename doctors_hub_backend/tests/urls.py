from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TestCategoryViewSet, TestViewSet, FacilityTestViewSet


router = DefaultRouter()
router.register(r'test-categories', TestCategoryViewSet, basename='test-category')
router.register(r'tests', TestViewSet, basename='test')
router.register(r'facility-tests', FacilityTestViewSet, basename='facility-test')

urlpatterns = [
    path('', include(router.urls)),
]
