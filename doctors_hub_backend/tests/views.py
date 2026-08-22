import django_filters
from rest_framework import viewsets, filters, exceptions
from drf_spectacular.utils import extend_schema
from .models import TestCategory, Test, FacilityTest
from .serializers import TestCategorySerializer, TestSerializer, FacilityTestSerializer
from core.permissions import ScopedFacilityOrReadOnly, IsSuperAdminOrReadOnly
from core.scoping import RoleScopedQuerysetMixin


@extend_schema(tags=['Diagnostic Tests'])
class TestCategoryViewSet(viewsets.ModelViewSet):
    queryset = TestCategory.objects.all().order_by('name')
    serializer_class = TestCategorySerializer
    permission_classes = (IsSuperAdminOrReadOnly,)
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


@extend_schema(tags=['Diagnostic Tests'])
class TestViewSet(viewsets.ModelViewSet):
    queryset = Test.objects.all().select_related('category').order_by('name')
    serializer_class = TestSerializer
    permission_classes = (IsSuperAdminOrReadOnly,)
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


@extend_schema(tags=['Diagnostic Tests'])
class FacilityTestViewSet(RoleScopedQuerysetMixin, viewsets.ModelViewSet):
    queryset = FacilityTest.objects.all().select_related('location', 'test', 'test__category').order_by('test__name')
    serializer_class = FacilityTestSerializer
    permission_classes = (ScopedFacilityOrReadOnly,)
    filter_backends = [django_filters.rest_framework.DjangoFilterBackend, filters.SearchFilter]
    filterset_class = FacilityTestFilter
    search_fields = ['test__name', 'test__code', 'location__name', 'location__branch']
    scope_location_field = "location_id__in"

    def get_queryset(self):
        qs = FacilityTest.objects.all().select_related('location', 'test', 'test__category').order_by('test__name')
        return self.get_scoped_queryset(qs)

    def perform_create(self, serializer):
        user = self.request.user
        if not user or not user.is_authenticated:
            raise exceptions.NotAuthenticated()

        if not getattr(user, "is_super_admin", False):
            loc = serializer.validated_data.get("location")
            loc_id = loc.id if loc else None
            if not loc_id or loc_id not in user.managed_location_ids:
                raise exceptions.PermissionDenied("You do not have permission to manage tests for this location.")

        serializer.save()

    def perform_update(self, serializer):
        user = self.request.user
        if not user or not user.is_authenticated:
            raise exceptions.NotAuthenticated()

        if not getattr(user, "is_super_admin", False):
            loc = serializer.validated_data.get("location")
            # If location wasn't provided in the patch data, fallback to the instance's location
            if not loc:
                loc = serializer.instance.location
            loc_id = loc.id if loc else None
            if not loc_id or loc_id not in user.managed_location_ids:
                raise exceptions.PermissionDenied("You do not have permission to manage tests for this location.")

        serializer.save()
