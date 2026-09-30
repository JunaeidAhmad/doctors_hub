import django_filters
from rest_framework import viewsets, filters, exceptions
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiTypes
from .models import TestCategory, Test, FacilityTest
from .serializers import (
    TestCategorySerializer, TestSerializer, FacilityTestSerializer,
    FacilityTestSearchGroupSerializer
)
from core.permissions import ScopedFacilityOrReadOnly, IsSuperAdminOrReadOnly
from core.scoping import RoleScopedQuerysetMixin
from core.filters import exact_slug_or_id_q
from core.pagination import SearchPagination
from .search import parse_params, build_row_qs, build_grouped, hydrate, build_facets


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
        q = exact_slug_or_id_q('category__', value)
        if q is None:
            return queryset
        return queryset.filter(q)


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
        q = exact_slug_or_id_q('test__category__', value)
        if q is None:
            return queryset
        return queryset.filter(q)


@extend_schema(tags=['Diagnostic Tests'])
class FacilityTestViewSet(RoleScopedQuerysetMixin, viewsets.ModelViewSet):
    queryset = FacilityTest.objects.all().select_related('location__thana__district__division', 'test', 'test__category').order_by('test__name')
    serializer_class = FacilityTestSerializer
    permission_classes = (ScopedFacilityOrReadOnly,)
    filter_backends = [django_filters.rest_framework.DjangoFilterBackend, filters.SearchFilter]
    filterset_class = FacilityTestFilter
    search_fields = ['test__name', 'test__code', 'location__name', 'location__branch']
    scope_location_field = "location_id__in"

    def get_queryset(self):
        qs = FacilityTest.objects.all().select_related('location__thana__district__division', 'test', 'test__category').order_by('test__name')
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

    @extend_schema(
        tags=['Diagnostic Tests'],
        summary='Search diagnostic tests grouped by test',
        description='Public aggregated search of diagnostic tests and lab offerings across facilities.',
        parameters=[
            OpenApiParameter('q', OpenApiTypes.STR, OpenApiParameter.QUERY, description='Free-text search'),
            OpenApiParameter('testcat', OpenApiTypes.STR, OpenApiParameter.QUERY, description='Category slug or UUID (alias category)'),
            OpenApiParameter('category', OpenApiTypes.STR, OpenApiParameter.QUERY, description='Category slug or UUID'),
            OpenApiParameter('division_id', OpenApiTypes.INT, OpenApiParameter.QUERY, description='Division ID'),
            OpenApiParameter('district_id', OpenApiTypes.INT, OpenApiParameter.QUERY, description='District ID'),
            OpenApiParameter('thana_id', OpenApiTypes.INT, OpenApiParameter.QUERY, description='Thana ID'),
            OpenApiParameter('location_id', OpenApiTypes.UUID, OpenApiParameter.QUERY, description='Location UUID'),
            OpenApiParameter('fulfillment', OpenApiTypes.STR, OpenApiParameter.QUERY, description='home | center | all'),
            OpenApiParameter('ownership', OpenApiTypes.STR, OpenApiParameter.QUERY, description='private | government | hospital_affiliated | ngo | all'),
            OpenApiParameter('location_type', OpenApiTypes.STR, OpenApiParameter.QUERY, description='diagnostic_center | all'),
            OpenApiParameter('ordering', OpenApiTypes.STR, OpenApiParameter.QUERY, description='price | -price | name | -name'),
            OpenApiParameter('page', OpenApiTypes.INT, OpenApiParameter.QUERY, description='Page number'),
            OpenApiParameter('page_size', OpenApiTypes.INT, OpenApiParameter.QUERY, description='Page size (max 50)'),
            OpenApiParameter('include_unavailable', OpenApiTypes.BOOL, OpenApiParameter.QUERY, description='Include unavailable tests'),
            OpenApiParameter('offering_limit', OpenApiTypes.INT, OpenApiParameter.QUERY, description='Limit offerings per test (0=all)'),
        ],
    )
    @action(detail=False, methods=['get'], url_path='search', permission_classes=[AllowAny], filter_backends=[])
    def search(self, request):
        try:
            params = parse_params(request.query_params)
        except ValueError as e:
            return Response({'error': f'Invalid value for parameter: {e}'}, status=400)

        row_qs = build_row_qs(params)
        grouped_qs = build_grouped(row_qs, ordering=params.get('ordering', 'price'))

        paginator = SearchPagination()
        page_grouped = paginator.paginate_queryset(grouped_qs, request, view=self)

        facets = build_facets(params)

        if not page_grouped:
            return paginator.get_paginated_response([], facets=facets)

        test_ids = [item['test_id'] for item in page_grouped]
        stats_map = {item['test_id']: item for item in page_grouped}

        hydrated_tests = hydrate(
            test_ids,
            row_qs,
            offering_limit=params.get('offering_limit', 0),
            grouped_stats=stats_map
        )

        serializer = FacilityTestSearchGroupSerializer(hydrated_tests, many=True)
        return paginator.get_paginated_response(serializer.data, facets=facets)
