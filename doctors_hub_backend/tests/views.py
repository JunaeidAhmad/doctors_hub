import django_filters
from rest_framework import viewsets, filters
from .models import TestCategory, Test, FacilityTest
from .serializers import TestCategorySerializer, TestSerializer, FacilityTestSerializer
from core.permissions import IsAdminUserOrReadOnly

class TestCategoryViewSet(viewsets.ModelViewSet):
    queryset = TestCategory.objects.all().order_by('name')
    serializer_class = TestCategorySerializer
    permission_classes = (IsAdminUserOrReadOnly,)
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'description']

class TestFilter(django_filters.FilterSet):
    category = django_filters.CharFilter(method='filter_category')

    class Meta:
        model = Test
        fields = ['category']

    def filter_category(self, queryset, name, value):
        if not value or value.lower() in ['all', 'all categories']:
            return queryset
        from django.db import models
        return queryset.filter(
            models.Q(category__name__icontains=value) |
            models.Q(category__slug__icontains=value) |
            models.Q(category__id__iexact=value if len(value) == 36 else '00000000-0000-0000-0000-000000000000')
        ).distinct()

class TestViewSet(viewsets.ModelViewSet):
    queryset = Test.objects.all().select_related('category').order_by('name')
    serializer_class = TestSerializer
    permission_classes = (IsAdminUserOrReadOnly,)
    filter_backends = [django_filters.rest_framework.DjangoFilterBackend, filters.SearchFilter]
    filterset_class = TestFilter
    search_fields = ['name', 'code', 'sample_type', 'preparation_instructions']

class FacilityTestFilter(django_filters.FilterSet):
    category = django_filters.CharFilter(method='filter_category')
    location = django_filters.UUIDFilter(field_name='location')
    test = django_filters.UUIDFilter(field_name='test')

    class Meta:
        model = FacilityTest
        fields = ['location', 'test', 'category', 'is_available', 'home_sample_collection']

    def filter_category(self, queryset, name, value):
        if not value or value.lower() in ['all', 'all categories']:
            return queryset
        from django.db import models
        return queryset.filter(
            models.Q(test__category__name__icontains=value) |
            models.Q(test__category__slug__icontains=value) |
            models.Q(test__category__id__iexact=value if len(value) == 36 else '00000000-0000-0000-0000-000000000000')
        ).distinct()

class FacilityTestViewSet(viewsets.ModelViewSet):
    queryset = FacilityTest.objects.all().select_related('location', 'test', 'test__category').order_by('test__name')
    serializer_class = FacilityTestSerializer
    permission_classes = (IsAdminUserOrReadOnly,)
    filter_backends = [django_filters.rest_framework.DjangoFilterBackend, filters.SearchFilter]
    filterset_class = FacilityTestFilter
    search_fields = ['test__name', 'test__code', 'location__name', 'location__branch']
