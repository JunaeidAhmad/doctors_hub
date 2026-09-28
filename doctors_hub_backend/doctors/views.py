import uuid
from rest_framework import viewsets, filters, exceptions
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.db.models import (
    Count, Min, Case, When, Value, IntegerField, Exists, OuterRef, Q
)
from django_filters.rest_framework import DjangoFilterBackend
import django_filters
from drf_spectacular.utils import extend_schema
from core.mixins import SlugOrPkLookupMixin
from core.permissions import IsDoctorOwnerOrReadOnly, ScopedFacilityOrReadOnly, HasPagePermissionOrReadOnly
from core.rbac import has_permission
from core.scoping import RoleScopedQuerysetMixin
from .models import (
    DoctorSpecialty, SpecialtyAlias, Doctor, DoctorAffiliation, AffiliationSchedule
)
from .services.specialty_relations import match_node_ids, related_node_ids
from .services.specialty_resolver import resolve_specialty_exact
from .serializers import (
    DoctorSpecialtySerializer,
    SpecialtyAliasSerializer,
    SpecialtyOptionSerializer,
    DoctorSerializer,
    DoctorAffiliationSerializer,
    AffiliationScheduleSerializer
)


@extend_schema(tags=['Doctors'])
class DoctorSpecialtyViewSet(viewsets.ModelViewSet):
    queryset = DoctorSpecialty.objects.annotate(
        doctor_count=Count('doctors', distinct=True),
        alias_count=Count('aliases', distinct=True)
    ).order_by('name')
    serializer_class = DoctorSpecialtySerializer
    permission_classes = (HasPagePermissionOrReadOnly,)
    required_module = 'categories'
    filter_backends = (DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter)
    search_fields = ('name', 'canonical_name', 'bn_name')
    ordering_fields = ('name', 'canonical_name', 'doctor_count', 'alias_count')

    def list(self, request, *args, **kwargs):
        if request.query_params.get('canonical_only') == 'true' or request.query_params.get('all') == 'true':
            qs = self.filter_queryset(self.get_queryset())
            page = self.paginate_queryset(qs) if 'page' in request.query_params else None
            if page is not None:
                serializer = self.get_serializer(page, many=True)
                return self.get_paginated_response(serializer.data)
            serializer = self.get_serializer(qs, many=True)
            return Response(serializer.data)

        aliases = list(SpecialtyAlias.objects.filter(is_verified=True).select_related('specialty').order_by('name'))
        data = SpecialtyOptionSerializer(aliases, many=True).data
        return Response(data)


@extend_schema(tags=['Doctors'])
class SpecialtyAliasViewSet(viewsets.ModelViewSet):
    queryset = SpecialtyAlias.objects.select_related('specialty').order_by('name')
    serializer_class = SpecialtyAliasSerializer
    permission_classes = (HasPagePermissionOrReadOnly,)
    required_module = 'categories'
    page_action_map = {
        'verify': 'edit',
        'batch_verify': 'edit',
        'counts': 'view',
    }
    filter_backends = (DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter)
    filterset_fields = ('specialty', 'is_verified', 'language')
    search_fields = ('name', 'normalized', 'specialty__name', 'specialty__canonical_name')
    ordering_fields = ('name', 'created_at', 'is_verified', 'language')

    def list(self, request, *args, **kwargs):
        qs = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(qs) if 'page' in request.query_params else None
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def verify(self, request, pk=None):
        alias = self.get_object()
        alias.is_verified = True
        alias.save(update_fields=['is_verified', 'updated_at'])
        return Response(self.get_serializer(alias).data)

    @action(detail=False, methods=['post'], url_path='batch-verify')
    def batch_verify(self, request):
        alias_ids = request.data.get('alias_ids', [])
        if isinstance(alias_ids, str):
            alias_ids = [alias_ids]
        elif isinstance(alias_ids, dict):
            alias_ids = list(alias_ids.values())
        valid_uuids = []
        for a_id in alias_ids:
            try:
                valid_uuids.append(uuid.UUID(str(a_id)))
            except (ValueError, TypeError, AttributeError):
                continue
        if not valid_uuids:
            return Response({'error': 'No valid UUIDs provided in alias_ids'}, status=400)
        updated = SpecialtyAlias.objects.filter(id__in=valid_uuids).update(is_verified=True)
        return Response({'success': True, 'updated_count': updated})

    @action(detail=False, methods=['get'], url_path='counts')
    def counts(self, request):
        total = SpecialtyAlias.objects.count()
        verified = SpecialtyAlias.objects.filter(is_verified=True).count()
        unverified = total - verified
        canonical_count = DoctorSpecialty.objects.count()
        return Response({
            'total_aliases': total,
            'verified_aliases': verified,
            'unverified_aliases': unverified,
            'canonical_specialties': canonical_count
        })


class DoctorFilter(django_filters.FilterSet):
    specialty = django_filters.CharFilter(method='filter_specialty')
    specialties = django_filters.ModelMultipleChoiceFilter(queryset=DoctorSpecialty.objects.all())
    area = django_filters.CharFilter(method='filter_area')
    district = django_filters.CharFilter(method='filter_district')
    division = django_filters.CharFilter(method='filter_division')
    thana_id = django_filters.NumberFilter(field_name='affiliations__location__thana_id')
    district_id = django_filters.NumberFilter(field_name='affiliations__location__thana__district_id')
    division_id = django_filters.NumberFilter(field_name='affiliations__location__thana__district__division_id')
    location = django_filters.CharFilter(method='filter_location')
    fee_max = django_filters.NumberFilter(field_name='affiliations__fee', lookup_expr='lte')
    day = django_filters.CharFilter(field_name='affiliations__schedules__day_of_week', lookup_expr='icontains')
    gender = django_filters.CharFilter(field_name='gender', lookup_expr='iexact')
    facility = django_filters.CharFilter(method='filter_facility')
    hospital = django_filters.UUIDFilter(field_name='affiliations__location')
    diagnostic_center = django_filters.UUIDFilter(field_name='affiliations__location')

    class Meta:
        model = Doctor
        fields = [
            'specialty', 'specialties', 'area', 'district', 'division',
            'thana_id', 'district_id', 'division_id',
            'location', 'fee_max', 'day', 'gender', 'facility', 'hospital', 'diagnostic_center'
        ]

    def filter_area(self, queryset, name, value):
        if not value or value.lower() in ['all', 'all areas']:
            return queryset
        from django.db import models
        return queryset.filter(
            models.Q(affiliations__location__thana__name__iexact=value) |
            models.Q(affiliations__location__thana__bn_name__iexact=value)
        ).distinct()

    def filter_district(self, queryset, name, value):
        if not value or value.lower() in ['all', 'all districts']:
            return queryset
        from django.db import models
        DIST_ALIASES = {
            'chittagong': 'Chattogram', 'comilla': 'Cumilla', 'bogra': 'Bogura',
            'jessore': 'Jashore', 'barisal': 'Barishal', 'ঢাকা': 'Dhaka',
            'চট্টগ্রাম': 'Chattogram', 'সিলেট': 'Sylhet'
        }
        val = DIST_ALIASES.get(value.lower(), value)
        return queryset.filter(
            models.Q(affiliations__location__thana__district__name__iexact=val) |
            models.Q(affiliations__location__thana__district__bn_name__iexact=value)
        ).distinct()

    def filter_division(self, queryset, name, value):
        if not value or value.lower() in ['all', 'all bangladesh']:
            return queryset
        from django.db import models
        return queryset.filter(
            models.Q(affiliations__location__thana__district__division__name__iexact=value) |
            models.Q(affiliations__location__thana__district__division__bn_name__iexact=value)
        ).distinct()

    def filter_location(self, queryset, name, value):
        if not value or value.lower() in ['all', 'all bangladesh', 'all districts', 'all areas']:
            return queryset
        from django.db import models
        DIST_ALIASES = {
            'chittagong': 'Chattogram', 'comilla': 'Cumilla', 'bogra': 'Bogura',
            'jessore': 'Jashore', 'barisal': 'Barishal', 'ঢাকা': 'Dhaka',
            'চট্টগ্রাম': 'Chattogram', 'সিলেট': 'Sylhet'
        }
        val = DIST_ALIASES.get(value.lower(), value)
        return queryset.filter(
            models.Q(affiliations__location__thana__district__name__iexact=val) |
            models.Q(affiliations__location__thana__district__bn_name__iexact=value) |
            models.Q(affiliations__location__thana__district__division__name__iexact=val) |
            models.Q(affiliations__location__thana__district__division__bn_name__iexact=value) |
            models.Q(affiliations__location__thana__name__iexact=value) |
            models.Q(affiliations__location__thana__bn_name__iexact=value)
        ).distinct()

    def filter_specialty(self, queryset, name, value):
        if not value or value.lower() == 'all':
            return queryset
        chosen = resolve_specialty_exact(value)
        if not chosen:
            return queryset.none()
        direct = list(match_node_ids(chosen))
        related = list(related_node_ids(chosen))
        self.request._specialty_chosen = chosen
        self.request._specialty_sets = (direct, related)

        from django.db import models
        return (queryset
                .filter(models.Q(primary_specialty__in=direct) | models.Q(specialties__in=direct + related))
                .annotate(
                    is_primary_match=Case(
                        When(primary_specialty__in=direct, then=Value(True)),
                        default=Value(False),
                        output_field=models.BooleanField()
                    ),
                    match_tier=Case(
                        When(primary_specialty__in=direct, then=Value(1)),
                        When(specialties__in=direct, then=Value(1)),
                        default=Value(2),
                        output_field=IntegerField()
                    ),
                    related_overlap=Count('specialties', filter=Q(specialties__in=related), distinct=True)
                )
                .annotate(match_rank=Case(
                    When(is_primary_match=True, then=Value(1)),
                    When(match_tier=1, then=Value(2)),
                    default=Value(3),
                    output_field=IntegerField()
                ))
                .order_by('match_rank', '-is_verified', '-related_overlap', 'name', 'id')
                .distinct())

    def filter_facility(self, queryset, name, value):
        if not value or value.lower() == 'all':
            return queryset
        from django.db import models
        return queryset.filter(
            models.Q(affiliations__location__name__icontains=value) |
            models.Q(affiliations__location__branch__icontains=value) |
            models.Q(affiliations__location__slug__icontains=value) |
            models.Q(affiliations__location__id__iexact=value if len(value) == 36 else '00000000-0000-0000-0000-000000000000')
        ).distinct()


@extend_schema(tags=['Doctors'])
class DoctorViewSet(SlugOrPkLookupMixin, RoleScopedQuerysetMixin, viewsets.ModelViewSet):
    parser_classes = (MultiPartParser, FormParser, JSONParser)
    queryset = Doctor.objects.all().select_related('primary_specialty').prefetch_related(
        'specialties__parent_categories',
        'specialties__related',
        'affiliations__location__thana__district__division',
        'affiliations__schedules',
        'affiliations__doctor__specialties',
    ).order_by('name').distinct()
    serializer_class = DoctorSerializer
    permission_classes = (IsDoctorOwnerOrReadOnly,)
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_class = DoctorFilter
    search_fields = [
        'name', 'bn_name', 'qualification', 'academic_title', 'institution',
        'specialties__name', 'specialties__bn_name', 'specialties__formal_name',
        'specialty_source', 'specialty_source_bn',
        'affiliations__location__name', 'about'
    ]
    scope_doctor_field = "user"
    scope_location_field = "affiliations__location__in"

    def get_queryset(self):
        qs = Doctor.objects.all().select_related('primary_specialty').prefetch_related(
            'specialties__parent_categories',
            'specialties__related',
            'affiliations__location__thana__district__division',
            'affiliations__schedules',
            'affiliations__doctor__specialties',
        ).order_by('name').distinct()
        return self.get_scoped_queryset(qs)

    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        spec_param = request.query_params.get('specialty')
        if spec_param and spec_param.lower() != 'all':
            chosen = resolve_specialty_exact(spec_param)
            if chosen and isinstance(response.data, dict):
                filtered_qs = self.filter_queryset(self.get_queryset())
                rank_counts = dict(
                    filtered_qs.order_by().values('match_rank').annotate(c=Count('id', distinct=True)).values_list('match_rank', 'c')
                )
                primary_count = rank_counts.get(1, 0)
                secondary_count = rank_counts.get(2, 0)
                related_count = rank_counts.get(3, 0)
                match_count = primary_count + secondary_count
                response.data['meta'] = {
                    'specialty': chosen.name,
                    'specialty_bn': chosen.bn_name,
                    'slug': chosen.slug,
                    'is_umbrella': chosen.is_umbrella,
                    'primary_count': primary_count,
                    'secondary_count': secondary_count,
                    'related_count': related_count,
                    'match_count': match_count,
                    'tier1_count': match_count,
                    'tier2_count': related_count,
                }
        return response

    def perform_create(self, serializer):
        user = self.request.user
        if not user or not user.is_authenticated:
            raise exceptions.NotAuthenticated()

        if getattr(user, "is_superuser", False) or getattr(user, "is_super_admin", False) or has_permission(user, "doctors", "create"):
            serializer.save()
        elif getattr(user, "is_doctor_role", False):
            # Check if doctor already has a profile
            if hasattr(user, "doctor_profile") and user.doctor_profile:
                raise exceptions.ValidationError("You already have a doctor profile.")
            serializer.save(user=user)
        elif getattr(user, "is_facility_admin", False):
            affs = self.request.data.get("affiliations") or []
            loc_ids = {str(a.get("location_id") or a.get("location")) for a in affs if a.get("location_id") or a.get("location")}
            managed_ids = set(map(str, getattr(user, "managed_location_ids", [])))
            if loc_ids and not loc_ids.issubset(managed_ids):
                raise exceptions.PermissionDenied("You can only onboard doctors into facilities you manage.")
            serializer.save()
        else:
            raise exceptions.PermissionDenied("Only super admins, facility admins, and doctors can create doctor profiles.")


@extend_schema(tags=['Doctors'])
class DoctorAffiliationViewSet(RoleScopedQuerysetMixin, viewsets.ModelViewSet):
    queryset = DoctorAffiliation.objects.all().select_related(
        'doctor',
        'location__thana__district__division'
    ).prefetch_related(
        'schedules',
        'doctor__specialties',
    ).order_by('id')
    serializer_class = DoctorAffiliationSerializer
    permission_classes = (ScopedFacilityOrReadOnly,)
    scope_location_field = "location_id__in"
    scope_doctor_field = "doctor__user"

    def get_queryset(self):
        qs = DoctorAffiliation.objects.all().select_related(
            'doctor',
            'location__thana__district__division'
        ).prefetch_related(
            'schedules',
            'doctor__specialties',
        ).order_by('id')
        return self.get_scoped_queryset(qs)

    def perform_create(self, serializer):
        user = self.request.user
        if not user or not user.is_authenticated:
            raise exceptions.NotAuthenticated()

        if getattr(user, "is_super_admin", False):
            serializer.save()
            return

        loc = serializer.validated_data.get("location")
        doc = serializer.validated_data.get("doctor")

        if getattr(user, "is_facility_admin", False):
            loc_id = loc.id if loc else None
            if not loc_id or loc_id not in user.managed_location_ids:
                raise exceptions.PermissionDenied("You can only create affiliations for locations you manage.")
            serializer.save()
            return

        if getattr(user, "is_doctor_role", False):
            doctor_profile = getattr(user, "doctor_profile", None)
            if not doctor_profile or (doc and doc.id != doctor_profile.id):
                raise exceptions.PermissionDenied("You can only create affiliations for your own doctor profile.")
            serializer.save(doctor=doctor_profile)
            return

        raise exceptions.PermissionDenied("You do not have permission to create doctor affiliations.")


@extend_schema(tags=['Doctors'])
class AffiliationScheduleViewSet(RoleScopedQuerysetMixin, viewsets.ModelViewSet):
    queryset = AffiliationSchedule.objects.all().select_related(
        'affiliation__doctor',
        'affiliation__location'
    ).order_by('id')
    serializer_class = AffiliationScheduleSerializer
    permission_classes = (ScopedFacilityOrReadOnly,)
    scope_location_field = "affiliation__location_id__in"
    scope_doctor_field = "affiliation__doctor__user"

    def get_queryset(self):
        qs = AffiliationSchedule.objects.all().select_related(
            'affiliation__doctor',
            'affiliation__location'
        ).order_by('id')
        return self.get_scoped_queryset(qs)

    def perform_create(self, serializer):
        user = self.request.user
        if not user or not user.is_authenticated:
            raise exceptions.NotAuthenticated()

        if getattr(user, "is_super_admin", False):
            serializer.save()
            return

        aff = serializer.validated_data.get("affiliation")
        if not aff:
            raise exceptions.ValidationError("Affiliation is required.")

        if getattr(user, "is_facility_admin", False):
            if aff.location_id not in user.managed_location_ids:
                raise exceptions.PermissionDenied("You can only create schedules for locations you manage.")
            serializer.save()
            return

        if getattr(user, "is_doctor_role", False):
            doctor_profile = getattr(user, "doctor_profile", None)
            if not doctor_profile or aff.doctor_id != doctor_profile.id:
                raise exceptions.PermissionDenied("You can only create schedules for your own affiliations.")
            serializer.save()
            return

        raise exceptions.PermissionDenied("You do not have permission to create affiliation schedules.")
