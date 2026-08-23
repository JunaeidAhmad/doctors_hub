from rest_framework import viewsets, filters, exceptions
from django_filters.rest_framework import DjangoFilterBackend
import django_filters
from drf_spectacular.utils import extend_schema
from core.mixins import SlugOrPkLookupMixin
from core.permissions import ScopedFacilityOrReadOnly, IsSuperAdminOrReadOnly, check_location_write_permission
from core.scoping import RoleScopedQuerysetMixin
from .models import (
    Location, HospitalCategory, HospitalService, Hospital,
    DiagnosticCenterCategory, DiagnosticService, DiagnosticCenter, Chamber,
    FacilityMembership
)
from .serializers import (
    LocationSerializer, HospitalCategorySerializer, HospitalServiceSerializer,
    HospitalSerializer, DiagnosticCenterCategorySerializer, DiagnosticServiceSerializer,
    DiagnosticCenterSerializer, ChamberSerializer
)


@extend_schema(tags=['Facilities'])
class LocationViewSet(RoleScopedQuerysetMixin, viewsets.ModelViewSet):
    queryset = Location.objects.all()
    serializer_class = LocationSerializer
    permission_classes = (ScopedFacilityOrReadOnly,)
    scope_location_field = "pk__in"

    def get_queryset(self):
        return self.get_scoped_queryset(Location.objects.all())

    def perform_create(self, serializer):
        user = self.request.user
        if not user or not user.is_authenticated:
            raise exceptions.NotAuthenticated()

        if getattr(user, "is_super_admin", False):
            serializer.save()
        elif getattr(user, "is_facility_admin", False):
            location = serializer.save()
            # Auto-grant facility admin membership to the creator
            FacilityMembership.objects.get_or_create(
                user=user,
                location=location,
                defaults={"role": FacilityMembership.MemberRole.ADMIN}
            )
        else:
            raise exceptions.PermissionDenied("Only administrators can create new facility locations.")


@extend_schema(tags=['Facilities'])
class HospitalCategoryViewSet(viewsets.ModelViewSet):

    queryset = HospitalCategory.objects.all().order_by('name')
    serializer_class = HospitalCategorySerializer
    permission_classes = (IsSuperAdminOrReadOnly,)


@extend_schema(tags=['Facilities'])
class HospitalServiceViewSet(viewsets.ModelViewSet):
    queryset = HospitalService.objects.all().order_by('name')
    serializer_class = HospitalServiceSerializer
    permission_classes = (IsSuperAdminOrReadOnly,)


class HospitalFilter(django_filters.FilterSet):
    area = django_filters.CharFilter(field_name='location__area', lookup_expr='iexact')
    district = django_filters.CharFilter(field_name='location__district', lookup_expr='iexact')
    division = django_filters.CharFilter(field_name='location__division', lookup_expr='iexact')
    ownership_type = django_filters.CharFilter(field_name='location__ownership_type', lookup_expr='iexact')
    category = django_filters.CharFilter(method='filter_category')
    categories = django_filters.CharFilter(method='filter_category')
    location = django_filters.CharFilter(method='filter_location')

    class Meta:
        model = Hospital
        fields = [
            'location', 'area', 'district', 'division', 'ownership_type',
            'category', 'categories', 'has_diagnostic_center'
        ]

    def filter_category(self, queryset, name, value):
        if not value or value.lower() in ['all', 'all categories']:
            return queryset
        from django.db import models
        return queryset.filter(
            models.Q(category__name__icontains=value) |
            models.Q(category__slug__icontains=value) |
            models.Q(category__id__iexact=value if len(value) == 36 else '00000000-0000-0000-0000-000000000000')
        ).distinct()

    def filter_location(self, queryset, name, value):
        if not value or value == 'All Bangladesh':
            return queryset
        from django.db import models
        return queryset.filter(
            models.Q(location__district__iexact=value) |
            models.Q(location__division__iexact=value) |
            models.Q(location__area__iexact=value)
        ).distinct()


@extend_schema(tags=['Facilities'])
class HospitalViewSet(SlugOrPkLookupMixin, RoleScopedQuerysetMixin, viewsets.ModelViewSet):
    queryset = Hospital.objects.all().select_related('location', 'category').prefetch_related('services').order_by('location__name').distinct()
    serializer_class = HospitalSerializer
    permission_classes = (ScopedFacilityOrReadOnly,)
    slug_field = 'location__slug'
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_class = HospitalFilter
    search_fields = ['location__name', 'location__branch', 'location__address_line', 'location__area', 'location__district', 'location__division']
    scope_location_field = "location_id__in"

    def get_queryset(self):
        qs = Hospital.objects.all().select_related('location', 'category').prefetch_related('services').order_by('location__name').distinct()
        return self.get_scoped_queryset(qs)

    def perform_create(self, serializer):
        check_location_write_permission(
            self.request.user,
            location=serializer.validated_data.get("location"),
            error_message="You do not have permission to create a hospital for this location."
        )
        serializer.save()


@extend_schema(tags=['Facilities'])
class DiagnosticCenterCategoryViewSet(viewsets.ModelViewSet):
    queryset = DiagnosticCenterCategory.objects.all().order_by('name')
    serializer_class = DiagnosticCenterCategorySerializer
    permission_classes = (IsSuperAdminOrReadOnly,)


@extend_schema(tags=['Facilities'])
class DiagnosticServiceViewSet(viewsets.ModelViewSet):
    queryset = DiagnosticService.objects.all().order_by('name')
    serializer_class = DiagnosticServiceSerializer
    permission_classes = (IsSuperAdminOrReadOnly,)


class DiagnosticCenterFilter(django_filters.FilterSet):
    area = django_filters.CharFilter(field_name='location__area', lookup_expr='iexact')
    district = django_filters.CharFilter(field_name='location__district', lookup_expr='iexact')
    division = django_filters.CharFilter(field_name='location__division', lookup_expr='iexact')
    ownership_type = django_filters.CharFilter(field_name='location__ownership_type', lookup_expr='iexact')
    category = django_filters.CharFilter(method='filter_category')
    categories = django_filters.CharFilter(method='filter_category')
    spec = django_filters.CharFilter(method='filter_category')
    owner = django_filters.CharFilter(method='filter_category')
    testcat = django_filters.CharFilter(method='filter_testcat')
    location = django_filters.CharFilter(method='filter_location')

    class Meta:
        model = DiagnosticCenter
        fields = [
            'location', 'area', 'district', 'division', 'ownership_type',
            'category', 'categories', 'spec', 'owner', 'testcat'
        ]

    def filter_category(self, queryset, name, value):
        if not value or value.lower() in ['all', 'all categories']:
            return queryset
        from django.db import models
        values = [v.strip() for v in value.split(',') if v.strip()]
        q = models.Q()
        for v in values:
            v_clean = v.replace('-', ' ').replace('_', ' ').strip()
            v_slug = v.replace(' ', '-').replace('_', '-').lower().strip()
            q |= (
                models.Q(category__name__icontains=v) |
                models.Q(category__name__icontains=v_clean) |
                models.Q(category__slug__icontains=v) |
                models.Q(category__slug__icontains=v_slug)
            )
            if len(v) == 36:
                q |= models.Q(category__id__iexact=v)
        return queryset.filter(q).distinct()

    def filter_testcat(self, queryset, name, value):
        if not value or value.lower() in ['all', 'all categories']:
            return queryset
        from django.db import models
        values = [v.strip() for v in value.split(',') if v.strip()]
        q = models.Q()
        for v in values:
            v_clean = v.replace('-', ' ').replace('_', ' ').strip()
            v_slug = v.replace(' ', '-').replace('_', '-').lower().strip()
            q |= (
                models.Q(location__offered_tests__test__category__name__icontains=v) |
                models.Q(location__offered_tests__test__category__name__icontains=v_clean) |
                models.Q(location__offered_tests__test__category__slug__icontains=v) |
                models.Q(location__offered_tests__test__category__slug__icontains=v_slug) |
                models.Q(location__offered_tests__test__name__icontains=v) |
                models.Q(location__offered_tests__test__name__icontains=v_clean)
            )
            if len(v) == 36:
                q |= models.Q(location__offered_tests__test__category__id__iexact=v)
        return queryset.filter(q).distinct()

    def filter_location(self, queryset, name, value):
        if not value or value == 'All Bangladesh':
            return queryset
        from django.db import models
        return queryset.filter(
            models.Q(location__district__iexact=value) |
            models.Q(location__division__iexact=value) |
            models.Q(location__area__iexact=value)
        ).distinct()


@extend_schema(tags=['Facilities'])
class DiagnosticCenterViewSet(SlugOrPkLookupMixin, RoleScopedQuerysetMixin, viewsets.ModelViewSet):
    queryset = DiagnosticCenter.objects.all().select_related(
        'location', 'category'
    ).prefetch_related(
        'services',
        'location__offered_tests__test__category'
    ).order_by('location__name').distinct()

    serializer_class = DiagnosticCenterSerializer
    permission_classes = (ScopedFacilityOrReadOnly,)
    slug_field = 'location__slug'
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_class = DiagnosticCenterFilter
    search_fields = ['location__name', 'location__branch', 'location__address_line', 'location__area', 'location__district', 'location__division']
    scope_location_field = "location_id__in"

    def get_queryset(self):
        qs = DiagnosticCenter.objects.all().select_related(
            'location', 'category'
        ).prefetch_related(
            'services',
            'location__offered_tests__test__category'
        ).order_by('location__name').distinct()
        return self.get_scoped_queryset(qs)

    def perform_create(self, serializer):
        check_location_write_permission(
            self.request.user,
            location=serializer.validated_data.get("location"),
            error_message="You do not have permission to create a diagnostic center for this location."
        )
        serializer.save()


@extend_schema(tags=['Facilities'])
class ChamberViewSet(RoleScopedQuerysetMixin, viewsets.ModelViewSet):
    queryset = Chamber.objects.all().select_related('location', 'doctor').order_by('location__name')
    serializer_class = ChamberSerializer
    permission_classes = (ScopedFacilityOrReadOnly,)
    scope_location_field = "location_id__in"
    scope_doctor_field = "doctor__user"

    def get_queryset(self):
        return self.get_scoped_queryset(Chamber.objects.all().select_related('location', 'doctor').order_by('location__name'))

    def perform_create(self, serializer):
        check_location_write_permission(
            self.request.user,
            location=serializer.validated_data.get("location"),
            doctor=serializer.validated_data.get("doctor"),
            error_message="You do not have permission to create a chamber at this location or for this doctor."
        )
        serializer.save()
