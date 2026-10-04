from rest_framework import viewsets, filters, exceptions
from rest_framework.permissions import AllowAny
from django_filters.rest_framework import DjangoFilterBackend
import django_filters
from drf_spectacular.utils import extend_schema
from core.mixins import SlugOrPkLookupMixin
from core.permissions import ScopedFacilityOrReadOnly, IsSuperAdminOrReadOnly, check_location_write_permission
from core.scoping import RoleScopedQuerysetMixin
from core.visibility import PublicVisibilityMixin
from core.filters import exact_slug_or_id_q
from .models import (
    Division, District, Thana,
    Location, HospitalCategory, HospitalService, Hospital,
    DiagnosticCenterCategory, DiagnosticService, DiagnosticCenter, Chamber
)
from django.db.models import F, Subquery, OuterRef, Count, IntegerField, Value, Q
from django.db.models.functions import Coalesce
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from accounts.models import Role, UserRole
from doctors.models import DoctorAffiliation
from tests.models import FacilityTest
from .views_facility_actions import FacilityDetailActionsMixin
from .serializers import (
    DivisionSerializer, DistrictSerializer, ThanaSerializer,
    LocationSerializer, HospitalCategorySerializer, HospitalServiceSerializer,
    HospitalSerializer, DiagnosticCenterCategorySerializer, DiagnosticServiceSerializer,
    DiagnosticCenterSerializer, ChamberSerializer
)


def get_facility_counts_annotations():
    doctor_count_sub = DoctorAffiliation.objects.filter(
        location_id=OuterRef('location_id')
    ).values('location_id').annotate(c=Count('id')).values('c')

    test_count_sub = FacilityTest.objects.filter(
        location_id=OuterRef('location_id'),
        is_available=True
    ).values('location_id').annotate(c=Count('id')).values('c')

    return {
        'doctor_count': Coalesce(Subquery(doctor_count_sub, output_field=IntegerField()), Value(0)),
        'test_count': Coalesce(Subquery(test_count_sub, output_field=IntegerField()), Value(0)),
    }



@method_decorator(cache_page(60 * 60 * 24), name='list')
@extend_schema(tags=['Facilities - Geography'])
class DivisionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Division.objects.all().prefetch_related('districts').order_by('order', 'name')
    serializer_class = DivisionSerializer
    permission_classes = (AllowAny,)
    pagination_class = None
    filter_backends = (filters.SearchFilter,)
    search_fields = ('name', 'bn_name')


@method_decorator(cache_page(60 * 60 * 24), name='list')
@extend_schema(tags=['Facilities - Geography'])
class DistrictViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = District.objects.all().select_related('division').prefetch_related('thanas').order_by('name')
    serializer_class = DistrictSerializer
    permission_classes = (AllowAny,)
    pagination_class = None
    filter_backends = (DjangoFilterBackend, filters.SearchFilter)
    filterset_fields = ('division',)
    search_fields = ('name', 'bn_name')


@method_decorator(cache_page(60 * 60 * 24), name='list')
@extend_schema(tags=['Facilities - Geography'])
class ThanaViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Thana.objects.all().select_related('district__division').order_by('name')
    serializer_class = ThanaSerializer
    permission_classes = (AllowAny,)
    pagination_class = None
    filter_backends = (DjangoFilterBackend, filters.SearchFilter)
    filterset_fields = ('district', 'district__division')
    search_fields = ('name', 'bn_name')


@extend_schema(tags=['Facilities'])
class LocationViewSet(PublicVisibilityMixin, RoleScopedQuerysetMixin, viewsets.ModelViewSet):
    queryset = Location.objects.all().order_by('name', 'branch')
    serializer_class = LocationSerializer
    permission_classes = (ScopedFacilityOrReadOnly,)
    scope_location_field = "pk__in"
    public_filter = Q(is_active=True)
    filter_backends = (DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter)
    filterset_fields = ('location_type', 'is_active', 'is_verified')
    search_fields = (
        'name', 'branch', 'address_line',
        'thana__name', 'thana__bn_name',
        'thana__district__name', 'thana__district__bn_name'
    )
    ordering_fields = ('name', 'branch', 'created_at')

    def get_serializer_class(self):
        if self.request.query_params.get('view') == 'picker':
            from .serializers import LocationPickerSerializer
            return LocationPickerSerializer
        return self.serializer_class

    def get_queryset(self):
        qs = self.get_scoped_queryset(
            Location.objects.select_related('thana__district__division').order_by('name', 'branch')
        )
        return self.apply_public_visibility(qs)

    def perform_create(self, serializer):
        user = self.request.user
        if not user or not user.is_authenticated:
            raise exceptions.NotAuthenticated()

        if getattr(user, "is_super_admin", False):
            serializer.save()
        elif getattr(user, "is_facility_admin", False):
            location = serializer.save()
            # Auto-grant facility admin role to the creator if available
            fac_admin_role = Role.objects.filter(name="Facility Admin", scope_type=Role.ScopeType.FACILITY).first()
            if fac_admin_role:
                UserRole.objects.get_or_create(
                    user=user,
                    role=fac_admin_role,
                    facility=location
                )
        else:
            raise exceptions.PermissionDenied("Only administrators can create new facility locations.")


@extend_schema(tags=['Facilities'])
class HospitalCategoryViewSet(viewsets.ModelViewSet):
    queryset = HospitalCategory.objects.all().order_by('name')
    serializer_class = HospitalCategorySerializer
    permission_classes = (IsSuperAdminOrReadOnly,)

    def get_queryset(self):
        return HospitalCategory.objects.annotate(
            hospital_count=Count(
                'hospitals',
                filter=Q(hospitals__location__is_active=True),
                distinct=True,
            )
        ).order_by('name')


@extend_schema(tags=['Facilities'])
class HospitalServiceViewSet(viewsets.ModelViewSet):
    queryset = HospitalService.objects.all().order_by('name')
    serializer_class = HospitalServiceSerializer
    permission_classes = (IsSuperAdminOrReadOnly,)


class HospitalFilter(django_filters.FilterSet):
    thana_id = django_filters.NumberFilter(field_name='location__thana_id')
    district_id = django_filters.NumberFilter(field_name='location__thana__district_id')
    division_id = django_filters.NumberFilter(field_name='location__thana__district__division_id')
    ownership_type = django_filters.CharFilter(field_name='location__ownership_type', lookup_expr='iexact')
    category = django_filters.CharFilter(method='filter_category')

    class Meta:
        model = Hospital
        fields = [
            'thana_id', 'district_id', 'division_id',
            'ownership_type', 'category', 'has_diagnostic_center'
        ]

    def filter_category(self, queryset, name, value):
        q = exact_slug_or_id_q('category__', value)
        if q is None:
            return queryset
        return queryset.filter(q)


@extend_schema(tags=['Facilities'])
class HospitalViewSet(PublicVisibilityMixin, FacilityDetailActionsMixin, SlugOrPkLookupMixin, RoleScopedQuerysetMixin, viewsets.ModelViewSet):
    queryset = Hospital.objects.all().select_related(
        'location__thana__district__division', 'category'
    ).prefetch_related(
        'services',
    ).annotate(
        name=F('location__name'),
        **get_facility_counts_annotations()
    ).order_by('name').distinct()
    serializer_class = HospitalSerializer
    permission_classes = (ScopedFacilityOrReadOnly,)
    public_filter = Q(location__is_active=True)
    slug_field = 'location__slug'
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = HospitalFilter
    ordering_fields = ['name']
    ordering = ['name']
    search_fields = [
        'location__name', 'location__branch', 'location__address_line',
        'location__thana__name', 'location__thana__district__name', 'location__thana__district__division__name',
        'category__name', 'services__name'
    ]
    scope_location_field = "location_id__in"

    def get_queryset(self):
        qs = Hospital.objects.all().select_related(
            'location__thana__district__division', 'category'
        ).prefetch_related(
            'services',
        ).annotate(
            name=F('location__name'),
            **get_facility_counts_annotations()
        ).order_by('name').distinct()
        qs = self.get_scoped_queryset(qs)
        return self.apply_public_visibility(qs)

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

    def get_queryset(self):
        return DiagnosticCenterCategory.objects.annotate(
            center_count=Count(
                'centers',
                filter=Q(centers__location__is_active=True),
                distinct=True,
            )
        ).order_by('name')


@extend_schema(tags=['Facilities'])
class DiagnosticServiceViewSet(viewsets.ModelViewSet):
    queryset = DiagnosticService.objects.all().order_by('name')
    serializer_class = DiagnosticServiceSerializer
    permission_classes = (IsSuperAdminOrReadOnly,)


class DiagnosticCenterFilter(django_filters.FilterSet):
    thana_id = django_filters.NumberFilter(field_name='location__thana_id')
    district_id = django_filters.NumberFilter(field_name='location__thana__district_id')
    division_id = django_filters.NumberFilter(field_name='location__thana__district__division_id')
    ownership_type = django_filters.CharFilter(field_name='location__ownership_type', lookup_expr='iexact')
    owner = django_filters.CharFilter(field_name='location__ownership_type', lookup_expr='iexact')
    category = django_filters.CharFilter(method='filter_category')
    testcat = django_filters.CharFilter(method='filter_testcat')

    class Meta:
        model = DiagnosticCenter
        fields = [
            'thana_id', 'district_id', 'division_id',
            'ownership_type', 'owner', 'category', 'testcat'
        ]

    def filter_category(self, queryset, name, value):
        q = exact_slug_or_id_q('category__', value)
        if q is None:
            return queryset
        return queryset.filter(q)

    def filter_testcat(self, queryset, name, value):
        q = exact_slug_or_id_q('location__offered_tests__test__category__', value)
        if q is None:
            return queryset
        return queryset.filter(q).distinct()


@extend_schema(tags=['Facilities'])
class DiagnosticCenterViewSet(PublicVisibilityMixin, FacilityDetailActionsMixin, SlugOrPkLookupMixin, RoleScopedQuerysetMixin, viewsets.ModelViewSet):
    queryset = DiagnosticCenter.objects.all().select_related(
        'location__thana__district__division', 'category'
    ).prefetch_related(
        'services',
    ).annotate(
        **get_facility_counts_annotations()
    ).order_by('location__name').distinct()

    serializer_class = DiagnosticCenterSerializer
    permission_classes = (ScopedFacilityOrReadOnly,)
    public_filter = Q(location__is_active=True)
    slug_field = 'location__slug'
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_class = DiagnosticCenterFilter
    search_fields = [
        'location__name', 'location__branch', 'location__address_line',
        'location__thana__name', 'location__thana__district__name', 'location__thana__district__division__name',
        'location__offered_tests__test__name',
        'location__offered_tests__test__code',
        'location__offered_tests__test__category__name',
    ]
    scope_location_field = "location_id__in"

    def get_queryset(self):
        qs = DiagnosticCenter.objects.all().select_related(
            'location__thana__district__division', 'category'
        ).prefetch_related(
            'services',
        ).annotate(
            **get_facility_counts_annotations()
        ).order_by('location__name').distinct()
        qs = self.get_scoped_queryset(qs)
        return self.apply_public_visibility(qs)

    def perform_create(self, serializer):
        check_location_write_permission(
            self.request.user,
            location=serializer.validated_data.get("location"),
            error_message="You do not have permission to create a diagnostic center for this location."
        )
        serializer.save()


@extend_schema(tags=['Facilities'])
class ChamberViewSet(RoleScopedQuerysetMixin, viewsets.ModelViewSet):
    queryset = Chamber.objects.all().select_related('location__thana__district__division', 'doctor').order_by('location__name')
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
