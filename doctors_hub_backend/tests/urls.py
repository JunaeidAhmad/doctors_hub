from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TestCategoryViewSet, TestViewSet, FacilityTestViewSet

app_name = 'tests'

router = DefaultRouter()
router.register(r'test-categories', TestCategoryViewSet, basename='test-category')
router.register(r'tests', TestViewSet, basename='test')
router.register(r'facility-tests', FacilityTestViewSet, basename='facility-test')
router.register(r'pathology-tests', TestViewSet, basename='pathology-test')
router.register(r'diagnostic-center-tests', FacilityTestViewSet, basename='diagnostic-center-test')
router.register(r'branch-tests', FacilityTestViewSet, basename='branch-test')

urlpatterns = [
    path('', include(router.urls)),
]
