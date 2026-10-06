import uuid
import datetime
import hashlib
import json
from django.utils import timezone
from django.core.cache import cache
from rest_framework import viewsets, filters, exceptions
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.db.models import (
    Count, Min, Case, When, Value, IntegerField, Exists, OuterRef, Q, Prefetch
)
from django_filters.rest_framework import DjangoFilterBackend
import django_filters
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiTypes
from core.mixins import SlugOrPkLookupMixin
from core.permissions import IsDoctorOwnerOrReadOnly, ScopedFacilityOrReadOnly, HasPagePermissionOrReadOnly
from core.rbac import has_permission
from core.scoping import RoleScopedQuerysetMixin
from core.visibility import PublicVisibilityMixin, is_admin_viewer
from .models import (
    DoctorSpecialty, SpecialtyAlias, Doctor, DoctorAffiliation, AffiliationSchedule, ScheduleException
)
from .services.specialty_relations import match_node_ids, curated_related_ids, curated_related_nodes
from .services.specialty_resolver import resolve_specialty_exact
from .services.specialty_suggest import suggest_specialties
from .services.availability import get_availability, batch_next_available
from .serializers import (
    DoctorSpecialtySerializer,
    SpecialtyAliasSerializer,
    DoctorSerializer,
    DoctorListSerializer,
    DoctorAffiliationSerializer,
    AffiliationScheduleSerializer,
    ScheduleExceptionSerializer,
    SpecialtySuggestionSerializer,
    AffiliationAvailabilitySerializer
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

    def get_serializer_context(self):
        context = super().get_serializer_context()
        from doctors.services.specialty_suggest import get_cached_specialty_doctor_counts
        context['doctor_counts'] = get_cached_specialty_doctor_counts()
        return context

    @extend_schema(
        responses={200: DoctorSpecialtySerializer(many=True)},
        description='Returns a plain array when the `page` query parameter is omitted; '
                    'a paginated envelope when `page` is provided.',
    )
    def list(self, request, *args, **kwargs):
        qs = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(qs) if 'page' in request.query_params else None
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

    @extend_schema(
        tags=['Doctors'],
        summary='Suggest specialties for a search query',
        parameters=[
            OpenApiParameter('q', OpenApiTypes.STR, OpenApiParameter.QUERY, description='Search query (1-100 chars)'),
            OpenApiParameter('limit', OpenApiTypes.INT, OpenApiParameter.QUERY, description='Max suggestions (1-20, default 8)'),
        ],
        responses={200: SpecialtySuggestionSerializer(many=True)},
    )
    @action(detail=False, methods=['get'], url_path='suggest', permission_classes=[AllowAny], pagination_class=None, filter_backends=[])
    def suggest(self, request, **kwargs):
        q = request.query_params.get('q', '')
        q_stripped = q.strip() if q else ''
        if not q_stripped or len(q_stripped) > 100:
            return Response({'error': 'Parameter "q" must be between 1 and 100 characters.'}, status=400)

        raw_limit = request.query_params.get('limit', 8)
        try:
            limit = int(raw_limit)
        except (ValueError, TypeError):
            limit = 8

        data = suggest_specialties(q_stripped, limit=limit)
        return Response(data)


# The custom list() above returns a plain array unless `page` is passed, so suppress
# drf-spectacular's auto paginated envelope for that operation. Schema-time only:
# method-level kwargs are not applied at runtime (only @action kwargs are).
DoctorSpecialtyViewSet.list.kwargs['schema'] = type(
    'UnpaginatedSpecialtyListSchema',
    (DoctorSpecialtyViewSet.list.kwargs['schema'],),
    {'_get_paginator': lambda self: None},
)


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
    def verify(self, request, pk=None, **kwargs):
        alias = self.get_object()
        alias.is_verified = True
        alias.save(update_fields=['is_verified', 'updated_at'])
        return Response(self.get_serializer(alias).data)

    @action(detail=False, methods=['post'], url_path='batch-verify')
    def batch_verify(self, request, **kwargs):
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
    def counts(self, request, **kwargs):
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
    bmdc = django_filters.CharFilter(field_name='bmdc_number', lookup_expr='iexact')
    specialty = django_filters.CharFilter(method='filter_specialty')
    specialties = django_filters.ModelMultipleChoiceFilter(queryset=DoctorSpecialty.objects.all())
    thana_id = django_filters.NumberFilter(method='noop_filter')
    district_id = django_filters.NumberFilter(method='noop_filter')
    division_id = django_filters.NumberFilter(method='noop_filter')
    day = django_filters.CharFilter(method='noop_filter')
    gender = django_filters.CharFilter(method='filter_gender')
    facility = django_filters.CharFilter(method='noop_filter')
    hospital = django_filters.UUIDFilter(method='noop_filter')
    diagnostic_center = django_filters.UUIDFilter(method='noop_filter')

    class Meta:
        model = Doctor
        fields = [
            'bmdc', 'specialty', 'specialties',
            'thana_id', 'district_id', 'division_id',
            'day', 'gender', 'facility', 'hospital', 'diagnostic_center'
        ]

    def noop_filter(self, queryset, name, value):
        return queryset

    def filter_gender(self, queryset, name, value):
        if not value or str(value).lower() in ['all', '']:
            return queryset
        return queryset.filter(gender__iexact=str(value).strip())

    def filter_queryset(self, queryset):
        queryset = super().filter_queryset(queryset)
        cleaned_data = getattr(self.form, 'cleaned_data', {})

        affil_q = Q(doctor=OuterRef('pk'))
        user = getattr(self.request, 'user', None)
        if not is_admin_viewer(user):
            affil_q &= Q(location__is_active=True, is_active=True)
        has_affil_filter = False

        thana_id = cleaned_data.get('thana_id')
        if thana_id:
            affil_q &= Q(location__thana_id=thana_id)
            has_affil_filter = True

        district_id = cleaned_data.get('district_id')
        if district_id:
            affil_q &= Q(location__thana__district_id=district_id)
            has_affil_filter = True

        division_id = cleaned_data.get('division_id')
        if division_id:
            affil_q &= Q(location__thana__district__division_id=division_id)
            has_affil_filter = True

        day = cleaned_data.get('day')
        if day and str(day).lower() not in ['all', 'all days', '']:
            day_str = str(day).strip()
            DAY_MAP = {
                'sat': 'Saturday',
                'sun': 'Sunday',
                'mon': 'Monday',
                'tue': 'Tuesday',
                'wed': 'Wednesday',
                'thu': 'Thursday',
                'fri': 'Friday',
            }
            day_lower = day_str.lower()
            valid_full_days = {d.lower(): d for d in DAY_MAP.values()}
            if day_lower in DAY_MAP:
                normalized_day = DAY_MAP[day_lower]
            elif day_lower in valid_full_days:
                normalized_day = valid_full_days[day_lower]
            else:
                from rest_framework.exceptions import ValidationError
                raise ValidationError({'day': ['Unknown day.']})

            affil_q &= Q(schedules__day_of_week__iexact=normalized_day)
            has_affil_filter = True

        hospital = cleaned_data.get('hospital')
        if hospital:
            affil_q &= Q(location=hospital)
            has_affil_filter = True

        diagnostic_center = cleaned_data.get('diagnostic_center')
        if diagnostic_center:
            affil_q &= Q(location=diagnostic_center)
            has_affil_filter = True

        facility = cleaned_data.get('facility')
        if facility and str(facility).lower() != 'all':
            fq = (
                Q(location__name__icontains=facility) |
                Q(location__branch__icontains=facility) |
                Q(location__slug__icontains=facility)
            )
            try:
                import uuid
                u = uuid.UUID(str(facility))
                fq |= Q(location__id=u)
            except (ValueError, TypeError, AttributeError):
                pass
            affil_q &= fq
            has_affil_filter = True

        if has_affil_filter:
            sub = DoctorAffiliation.objects.filter(affil_q)
            queryset = queryset.filter(Exists(sub))

        return queryset

    def filter_specialty(self, queryset, name, value):
        if not value or value.lower() == 'all':
            return queryset
        chosen = resolve_specialty_exact(value)
        if not chosen:
            return queryset.none()
        direct = list(match_node_ids(chosen))
        return (queryset
                .filter(Q(primary_specialty__in=direct) | Q(specialties__in=direct))
                .annotate(match_rank=Case(
                    When(primary_specialty__in=direct, then=Value(1)),
                    default=Value(2), output_field=IntegerField()))
                .order_by('match_rank', '-is_verified', 'name', 'id')
                .distinct())


@extend_schema(tags=['Doctors'])
class DoctorViewSet(SlugOrPkLookupMixin, RoleScopedQuerysetMixin, viewsets.ModelViewSet):
    parser_classes = (MultiPartParser, FormParser, JSONParser)
    queryset = Doctor.objects.all().select_related('primary_specialty').prefetch_related(
        'specialties__parent_categories',
        'specialties__related',
        'affiliations__location__thana__district__division',
        'affiliations__schedules',
        'affiliations__doctor__specialties',
    ).order_by('name', 'id').distinct()
    serializer_class = DoctorSerializer
    permission_classes = (IsDoctorOwnerOrReadOnly,)
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_class = DoctorFilter

    def get_serializer_class(self):
        if self.action == 'list':
            from .serializers import DoctorListSerializer
            return DoctorListSerializer
        return self.serializer_class
    search_fields = [
        'name', 'bn_name', 'bmdc_number', 'qualification', 'academic_title', 'institution',
        'specialties__name', 'specialties__bn_name', 'specialties__formal_name',
        'specialty_source', 'specialty_source_bn',
        'affiliations__location__name'
    ]
    scope_doctor_field = "user"
    scope_location_field = "affiliations__location__in"

    def get_queryset(self):
        user = getattr(self.request, 'user', None)
        if not is_admin_viewer(user):
            aff_qs = DoctorAffiliation.objects.filter(
                location__is_active=True, is_active=True
            ).select_related(
                'location__thana__district__division'
            ).prefetch_related(
                'schedules',
                'doctor__specialties',
            ).order_by('id')
        else:
            aff_qs = DoctorAffiliation.objects.all().select_related(
                'location__thana__district__division'
            ).prefetch_related(
                'schedules',
                'doctor__specialties',
            ).order_by('id')

        qs = Doctor.objects.all().select_related('primary_specialty').prefetch_related(
            'specialties__parent_categories',
            'specialties__related',
            Prefetch('affiliations', queryset=aff_qs),
        ).order_by('name', 'id').distinct()
        return self.get_scoped_queryset(qs)

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())

        page = self.paginate_queryset(queryset)
        instances = page if page is not None else list(queryset)

        # Batch compute next_available for affiliations of doctors on this page
        affiliations = []
        for doc in instances:
            affiliations.extend(doc.affiliations.all())
        next_map = batch_next_available(affiliations, days=7)

        context = self.get_serializer_context()
        context['next_available_map'] = next_map

        if page is not None:
            serializer = self.get_serializer(page, many=True, context=context)
            response = self.get_paginated_response(serializer.data)
        else:
            serializer = self.get_serializer(instances, many=True, context=context)
            response = Response(serializer.data)

        spec_param = request.query_params.get('specialty')
        if spec_param and spec_param.lower() != 'all':
            chosen = resolve_specialty_exact(spec_param)
            if chosen and isinstance(response.data, dict):
                rank_counts = dict(
                    queryset.order_by().values('match_rank').annotate(c=Count('id', distinct=True)).values_list('match_rank', 'c')
                )
                primary_count = rank_counts.get(1, 0)
                secondary_count = rank_counts.get(2, 0)
                match_count = primary_count + secondary_count
                response.data['meta'] = {
                    'specialty': chosen.name,
                    'specialty_bn': chosen.bn_name,
                    'slug': chosen.slug,
                    'is_umbrella': chosen.is_umbrella,
                    'primary_count': primary_count,
                    'secondary_count': secondary_count,
                    'related_count': 0,
                    'match_count': match_count,
                    'related_available': bool(curated_related_ids(chosen)),
                }
        return response

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        affiliations = list(instance.affiliations.all())
        next_map = batch_next_available(affiliations, days=7)
        context = self.get_serializer_context()
        context['next_available_map'] = next_map
        serializer = self.get_serializer(instance, context=context)
        return Response(serializer.data)

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
        elif getattr(user, "is_facility_staff", False):
            affs = self.request.data.get("affiliations") or []
            loc_ids = {str(a.get("location_id") or a.get("location")) for a in affs if a.get("location_id") or a.get("location")}
            managed_ids = set(map(str, getattr(user, "managed_location_ids", [])))
            if loc_ids and not loc_ids.issubset(managed_ids):
                raise exceptions.PermissionDenied("You can only onboard doctors into facilities you manage.")
            serializer.save()
        else:
            raise exceptions.PermissionDenied("Only super admins, facility admins, and doctors can create doctor profiles.")

    @action(detail=True, methods=['put'], url_path='chambers')
    def chambers(self, request, pk=None, **kwargs):
        from doctors.services.chambers import sync_chambers
        doctor = self.get_object()
        result = sync_chambers(doctor, request.data, request.user)
        return Response(result)

    @extend_schema(
        tags=['Doctors'],
        summary='Related specialists for a specialty',
        description='Doctors whose primary or secondary specialty is one of the curated related '
                    'leaves of the given specialty, excluding doctors who match it directly. '
                    'Ordered by the curated related_leaves order, then -is_verified, then name. '
                    'Accepts the same location / gender / day filters as the doctors list.',
        parameters=[
            OpenApiParameter('specialty', OpenApiTypes.STR, OpenApiParameter.QUERY,
                             required=True, description='Specialty name or slug'),
            OpenApiParameter('limit', OpenApiTypes.INT, OpenApiParameter.QUERY,
                             description='Max results (1-12, default 6)'),
        ],
    )
    @action(detail=False, methods=['get'], url_path='related', permission_classes=[AllowAny],
            pagination_class=None, filter_backends=[])
    def related(self, request, **kwargs):
        spec_param = (request.query_params.get('specialty') or '').strip()
        if not spec_param:
            return Response({
                'error': 'Query parameter "specialty" is required.',
                'error_bn': 'কোয়েরি প্যারামিটার "specialty" আবশ্যক।',
            }, status=400)
        chosen = resolve_specialty_exact(spec_param)
        if not chosen:
            return Response({
                'error': f'Unknown specialty: {spec_param}',
                'error_bn': f'অজানা বিশেষজ্ঞতা: {spec_param}',
            }, status=400)

        raw_limit = request.query_params.get('limit', 6)
        try:
            limit = int(raw_limit)
        except (TypeError, ValueError):
            limit = 6
        limit = max(1, min(limit, 12))

        cache_params = {k: v for k, v in request.query_params.items() if k not in ('specialty', 'limit')}
        cache_key = 'doctors:related:{}:{}:{}'.format(
            chosen.id,
            limit,
            hashlib.md5(json.dumps(cache_params, sort_keys=True, default=str).encode()).hexdigest(),
        )
        cached = cache.get(cache_key)
        if cached is not None:
            return Response(cached)

        related_nodes = curated_related_nodes(chosen)
        if not related_nodes:
            payload = {'specialty': chosen.slug, 'related': [], 'results': []}
            cache.set(cache_key, payload, 600)
            return Response(payload)

        direct_ids = match_node_ids(chosen)
        related_ids = [n.id for n in related_nodes]
        qs = self.get_queryset().filter(
            Q(primary_specialty__in=related_ids) | Q(specialties__in=related_ids)
        ).exclude(
            Q(primary_specialty__in=direct_ids) | Q(specialties__in=direct_ids)
        )

        filter_data = request.query_params.copy()
        filter_data.pop('specialty', None)
        filtered = DoctorFilter(data=filter_data, queryset=qs, request=request).qs

        results = []
        seen = set()
        for node in related_nodes:
            if len(results) >= limit:
                break
            node_qs = filtered.filter(
                Q(primary_specialty=node) | Q(specialties=node)
            ).order_by('-is_verified', 'name', 'id')
            for doc in node_qs:
                if len(results) >= limit:
                    break
                if doc.id in seen:
                    continue
                seen.add(doc.id)
                results.append((doc, node))

        affiliations = []
        for doc, _ in results:
            affiliations.extend(doc.affiliations.all())
        context = self.get_serializer_context()
        context['next_available_map'] = batch_next_available(affiliations, days=7)
        serialized = DoctorListSerializer([d for d, _ in results], many=True, context=context).data
        for item, (_, node) in zip(serialized, results):
            item['related_via'] = {'slug': node.slug, 'name': node.name, 'bn_name': node.bn_name}

        payload = {
            'specialty': chosen.slug,
            'related': [{'slug': n.slug, 'name': n.name, 'bn_name': n.bn_name} for n in related_nodes],
            'results': serialized,
        }
        cache.set(cache_key, payload, 600)
        return Response(payload)


@extend_schema(tags=['Doctors'])
class DoctorAffiliationViewSet(PublicVisibilityMixin, RoleScopedQuerysetMixin, viewsets.ModelViewSet):
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
    public_filter = Q(location__is_active=True, is_active=True)

    def get_queryset(self):
        qs = DoctorAffiliation.objects.all().select_related(
            'doctor',
            'location__thana__district__division'
        ).prefetch_related(
            'schedules',
            'doctor__specialties',
        ).order_by('id')
        qs = self.get_scoped_queryset(qs)
        return self.apply_public_visibility(qs)

    @extend_schema(
        tags=['Doctors'],
        summary='Get affiliation availability',
        parameters=[
            OpenApiParameter('from', OpenApiTypes.DATE, OpenApiParameter.QUERY, description='Start date (YYYY-MM-DD), defaults to today'),
            OpenApiParameter('days', OpenApiTypes.INT, OpenApiParameter.QUERY, description='Number of days (1-30), defaults to 7'),
        ],
        responses={200: AffiliationAvailabilitySerializer},
    )
    @action(detail=True, methods=['get'], url_path='availability', permission_classes=[AllowAny])
    def availability(self, request, pk=None, **kwargs):
        try:
            val_uuid = uuid.UUID(str(pk))
            affiliation = DoctorAffiliation.objects.select_related(
                'doctor',
                'location__thana__district__division'
            ).get(pk=val_uuid)
        except (DoctorAffiliation.DoesNotExist, ValueError, TypeError):
            raise exceptions.NotFound(f"DoctorAffiliation with ID '{pk}' not found.")

        today = timezone.localdate()
        from_str = request.query_params.get('from')
        if from_str:
            try:
                start_date = datetime.date.fromisoformat(from_str)
            except ValueError:
                return Response({'detail': 'Invalid from date format. Use YYYY-MM-DD.'}, status=400)
            if start_date < today:
                return Response({'detail': 'from date cannot be in the past.'}, status=400)
        else:
            start_date = today

        days_str = request.query_params.get('days', '7')
        try:
            days = int(days_str)
            if days < 1 or days > 30:
                raise ValueError()
        except (ValueError, TypeError):
            return Response({'detail': 'days must be an integer between 1 and 30.'}, status=400)

        data = get_availability(affiliation, start_date=start_date, days=days)
        return Response(data)

    def perform_create(self, serializer):
        user = self.request.user
        if not user or not user.is_authenticated:
            raise exceptions.NotAuthenticated()

        if getattr(user, "is_super_admin", False):
            serializer.save()
            return

        loc = serializer.validated_data.get("location")
        doc = serializer.validated_data.get("doctor")

        if getattr(user, "is_facility_staff", False):
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

        if getattr(user, "is_facility_staff", False):
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


class ScheduleExceptionFilter(django_filters.FilterSet):
    affiliation = django_filters.UUIDFilter(field_name='affiliation_id')
    date_from = django_filters.DateFilter(field_name='date', lookup_expr='gte')
    date_to = django_filters.DateFilter(field_name='date', lookup_expr='lte')

    class Meta:
        model = ScheduleException
        fields = ['affiliation', 'date_from', 'date_to']


@extend_schema(tags=['Doctors'])
class ScheduleExceptionViewSet(RoleScopedQuerysetMixin, viewsets.ModelViewSet):
    queryset = ScheduleException.objects.all().select_related(
        'affiliation__doctor',
        'affiliation__location',
        'schedule'
    ).order_by('date', 'id')
    serializer_class = ScheduleExceptionSerializer
    permission_classes = (ScopedFacilityOrReadOnly,)
    filter_backends = (DjangoFilterBackend,)
    filterset_class = ScheduleExceptionFilter
    scope_location_field = "affiliation__location_id__in"
    scope_doctor_field = "affiliation__doctor__user"

    def get_queryset(self):
        qs = ScheduleException.objects.all().select_related(
            'affiliation__doctor',
            'affiliation__location',
            'schedule'
        ).order_by('date', 'id')
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

        if getattr(user, "is_facility_staff", False):
            if aff.location_id not in user.managed_location_ids:
                raise exceptions.PermissionDenied("You can only create schedule exceptions for locations you manage.")
            serializer.save()
            return

        if getattr(user, "is_doctor_role", False):
            doctor_profile = getattr(user, "doctor_profile", None)
            if not doctor_profile or aff.doctor_id != doctor_profile.id:
                raise exceptions.PermissionDenied("You can only create schedule exceptions for your own affiliations.")
            serializer.save()
            return

        raise exceptions.PermissionDenied("You do not have permission to create schedule exceptions.")
