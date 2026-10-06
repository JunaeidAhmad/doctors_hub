import uuid
from django.db.models import Q, Count
from django.http import Http404
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiTypes

from core.pagination import SearchPagination, FacilityDoctorPagination
from doctors.models import DoctorAffiliation, DoctorSpecialty
from doctors.services.specialty_resolver import resolve_specialty_exact
from doctors.services.specialty_relations import match_node_ids
from doctors.services.availability import batch_next_available
from tests.search import (
    parse_params,
    build_row_qs,
    build_grouped,
    hydrate,
    build_facets,
)
from tests.serializers import FacilityTestSearchGroupSerializer, FacilityTestSearchResponseSerializer
from .serializers_summary import FacilityDoctorListResponseSerializer


class FacilityDetailActionsMixin:
    """
    Mixin providing facility-scoped doctors and tests actions for HospitalViewSet
    and DiagnosticCenterViewSet.
    """

    def _get_facility_location(self, pk_or_slug):
        model = self.queryset.model
        base_qs = self.apply_public_visibility(model.objects.select_related('location'))

        obj = None
        try:
            val_uuid = uuid.UUID(str(pk_or_slug))
            obj = base_qs.filter(pk=val_uuid).first()
            if not obj:
                obj = base_qs.filter(location_id=val_uuid).first()
        except (ValueError, TypeError, AttributeError):
            pass

        if not obj:
            obj = base_qs.filter(location__slug=str(pk_or_slug)).first()

        if not obj:
            raise Http404(f"No {model._meta.object_name} found matching '{pk_or_slug}'.")

        return obj.location

    @extend_schema(
        tags=['Facilities'],
        summary='List doctors affiliated with this facility',
        description='Paginated list of doctors and affiliations for a specific facility with specialty facets.',
        parameters=[
            OpenApiParameter('specialty', OpenApiTypes.STR, OpenApiParameter.QUERY, description='Specialty slug or UUID'),
            OpenApiParameter('search', OpenApiTypes.STR, OpenApiParameter.QUERY, description='Search by doctor name, qualification, or specialty'),
            OpenApiParameter('page', OpenApiTypes.INT, OpenApiParameter.QUERY, description='Page number'),
            OpenApiParameter('page_size', OpenApiTypes.INT, OpenApiParameter.QUERY, description='Page size (default 12)'),
        ],
        responses={200: FacilityDoctorListResponseSerializer},
    )
    @action(detail=True, methods=['get'], url_path='doctors', permission_classes=[AllowAny])
    def doctors(self, request, pk=None, **kwargs):
        location = self._get_facility_location(pk or self.kwargs.get(self.lookup_field) or self.kwargs.get('pk'))

        base_aff_qs = DoctorAffiliation.objects.filter(
            location_id=location.id,
            doctor__isnull=False
        )

        search_term = request.query_params.get('search', '').strip()
        search_q = None
        if search_term:
            search_q = (
                Q(doctor__name__icontains=search_term) |
                Q(doctor__bn_name__icontains=search_term) |
                Q(doctor__qualification__icontains=search_term) |
                Q(doctor__specialties__name__icontains=search_term) |
                Q(doctor__specialties__canonical_name__icontains=search_term) |
                Q(doctor__specialties__bn_name__icontains=search_term)
            )

        # Facets: distinct doctors per specialty among this location's affiliations,
        # filtered by search but NOT by specialty, sorted by count descending.
        facet_aff_qs = base_aff_qs
        if search_q:
            facet_aff_qs = facet_aff_qs.filter(search_q).distinct()

        matching_doctor_ids = list(facet_aff_qs.values_list('doctor_id', flat=True).distinct())

        if matching_doctor_ids:
            specialty_counts = (
                DoctorSpecialty.objects.filter(doctors__id__in=matching_doctor_ids)
                .annotate(
                    doctor_count=Count('doctors', filter=Q(doctors__id__in=matching_doctor_ids), distinct=True)
                )
                .values('slug', 'name', 'bn_name', 'doctor_count')
                .order_by('-doctor_count', 'name')
            )
            specialty_facets = [
                {
                    'slug': item['slug'],
                    'name': item['name'],
                    'bn_name': item['bn_name'] or '',
                    'count': item['doctor_count']
                }
                for item in specialty_counts
            ]
        else:
            specialty_facets = []

        facets = {
            'specialties': specialty_facets
        }

        # Main queryset: apply search and specialty
        aff_qs = base_aff_qs
        if search_q:
            aff_qs = aff_qs.filter(search_q).distinct()

        spec_param = request.query_params.get('specialty')
        if spec_param and spec_param.strip() and spec_param.strip().lower() != 'all':
            spec_node = resolve_specialty_exact(spec_param.strip())
            if spec_node:
                expanded_ids = match_node_ids(spec_node)
                aff_qs = aff_qs.filter(
                    Q(doctor__primary_specialty_id__in=expanded_ids) |
                    Q(doctor__specialties__id__in=expanded_ids)
                ).distinct()
            else:
                aff_qs = aff_qs.none()

        aff_qs = aff_qs.select_related(
            'doctor', 'doctor__primary_specialty'
        ).prefetch_related('schedules').order_by('doctor__name', 'id')

        paginator = FacilityDoctorPagination()
        page_affs = paginator.paginate_queryset(aff_qs, request, view=self)
        next_map = batch_next_available(page_affs, days=7)

        results = []
        for aff in page_affs:
            doc = aff.doctor
            scheds = [
                {
                    'id': str(s.id),
                    'day_of_week': s.day_of_week,
                    'start_time': str(s.start_time),
                    'end_time': str(s.end_time),
                }
                for s in aff.schedules.all()
            ]
            primary_spec = None
            if doc.primary_specialty:
                primary_spec = {
                    'slug': doc.primary_specialty.slug,
                    'name': doc.primary_specialty.name,
                    'bn_name': doc.primary_specialty.bn_name or '',
                }

            results.append({
                'affiliation_id': str(aff.id),
                'fee': str(aff.fee) if aff.fee is not None else None,
                'chamber_type': aff.chamber_type or '',
                'schedules': scheds,
                'next_available': next_map.get(str(aff.id)),
                'doctor': {
                    'id': str(doc.id),
                    'slug': doc.slug,
                    'name': doc.name,
                    'bn_name': doc.bn_name or '',
                    'academic_title': doc.academic_title or '',
                    'qualification': doc.qualification or '',
                    'image': request.build_absolute_uri(doc.image.url) if (doc.image and hasattr(doc.image, 'url')) else None,
                    'gender': doc.gender or '',
                    'bmdc_number': doc.bmdc_number if doc.bmdc_number else None,
                    'rating': str(doc.rating) if doc.rating is not None else None,
                    'review_count': doc.review_count,
                    'primary_specialty': primary_spec,
                }
            })

        return paginator.get_paginated_response(results, facets=facets)

    @extend_schema(
        tags=['Facilities'],
        summary='List tests offered at this facility',
        description='Paginated list of diagnostic tests offered by this facility with facets.',
        parameters=[
            OpenApiParameter('q', OpenApiTypes.STR, OpenApiParameter.QUERY, description='Free-text search'),
            OpenApiParameter('testcat', OpenApiTypes.STR, OpenApiParameter.QUERY, description='Category slug or UUID'),
            OpenApiParameter('fulfillment', OpenApiTypes.STR, OpenApiParameter.QUERY, description='home | center | all'),
            OpenApiParameter('ordering', OpenApiTypes.STR, OpenApiParameter.QUERY, description='price | -price | name | -name'),
            OpenApiParameter('page', OpenApiTypes.INT, OpenApiParameter.QUERY, description='Page number'),
            OpenApiParameter('page_size', OpenApiTypes.INT, OpenApiParameter.QUERY, description='Page size'),
        ],
        responses={200: FacilityTestSearchResponseSerializer},
    )
    @action(detail=True, methods=['get'], url_path='tests', permission_classes=[AllowAny])
    def tests(self, request, pk=None, **kwargs):
        location = self._get_facility_location(pk or self.kwargs.get(self.lookup_field) or self.kwargs.get('pk'))

        raw_params = request.query_params.copy()
        raw_params['location_id'] = str(location.id)
        raw_params['location_type'] = 'all'

        try:
            params = parse_params(raw_params)
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
