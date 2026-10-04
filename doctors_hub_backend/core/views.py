from rest_framework import permissions, status, exceptions, serializers
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db import models
from django.db.models import Count, Exists, OuterRef, Q
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiTypes

from core.cache_keys import public_cache_version

from accounts.serializers import UserProfileSerializer
from doctors.models import DoctorSpecialty, SpecialtyAlias, Doctor, DoctorAffiliation
from facilities.models import (
    Location, HospitalCategory, HospitalService, Hospital,
    DiagnosticCenterCategory, DiagnosticService, DiagnosticCenter, Chamber
)
from tests.models import TestCategory, Test, FacilityTest
from bookings.models import DoctorBooking, LabBooking

from doctors.serializers import DoctorSpecialtySerializer, DoctorSerializer
from facilities.serializers import (
    LocationSerializer,
    HospitalCategorySerializer, DiagnosticCenterCategorySerializer,
    HospitalServiceSerializer, DiagnosticServiceSerializer,
    HospitalSerializer, DiagnosticCenterSerializer
)
from tests.serializers import TestCategorySerializer, TestSerializer, FacilityTestSerializer
from bookings.serializers import DoctorBookingSerializer, LabBookingSerializer


class SearchMetadataResponseSerializer(serializers.Serializer):
    specialty_groups = serializers.ListField()
    popular_specialties = serializers.ListField()
    specialties_az = serializers.ListField()
    test_categories = TestCategorySerializer(many=True)
    hospital_categories = HospitalCategorySerializer(many=True)
    diagnostic_center_categories = DiagnosticCenterCategorySerializer(many=True)
    facilities = LocationSerializer(many=True, required=False)
    hospitals = LocationSerializer(many=True, required=False)
    diagnostic_centers = LocationSerializer(many=True, required=False)


class SearchFacetsResponseSerializer(serializers.Serializer):
    total_doctors = serializers.IntegerField()
    total_hospitals = serializers.IntegerField()
    total_diagnostic_centers = serializers.IntegerField()
    specialties = DoctorSpecialtySerializer(many=True)
    hospital_categories = HospitalCategorySerializer(many=True)
    diagnostic_center_categories = DiagnosticCenterCategorySerializer(many=True)
    test_categories = TestCategorySerializer(many=True)


class AdminDashboardInitResponseSerializer(serializers.Serializer):
    current_user = UserProfileSerializer()
    counts = serializers.DictField(child=serializers.IntegerField(), required=False)
    limit = serializers.IntegerField(required=False)
    hospitals = HospitalSerializer(many=True)
    diagnostic_centers = DiagnosticCenterSerializer(many=True)
    doctors = DoctorSerializer(many=True)
    tests = TestSerializer(many=True)
    branch_tests = FacilityTestSerializer(many=True)
    doctor_bookings = DoctorBookingSerializer(many=True)
    lab_bookings = LabBookingSerializer(many=True)
    doctor_specialties = DoctorSpecialtySerializer(many=True)
    hospital_categories = HospitalCategorySerializer(many=True)
    diagnostic_categories = DiagnosticCenterCategorySerializer(many=True)
    hospital_services = HospitalServiceSerializer(many=True)
    diagnostic_services = DiagnosticServiceSerializer(many=True)
    test_categories = TestCategorySerializer(many=True)


from django.core.cache import cache


class SearchMetadataAPIView(APIView):
    permission_classes = (permissions.AllowAny,)

    @extend_schema(
        tags=['Search & Discovery'],
        summary='Retrieve taxonomy metadata for search filters',
        description='Returns all available doctor specialties, test categories, hospital categories, and diagnostic center categories with counts for populating global search dropdowns.',
        responses={200: SearchMetadataResponseSerializer}
    )
    def get(self, request, *args, **kwargs):
        metadata_cache_key = f"search_metadata:v{public_cache_version()}"
        cached_data = cache.get(metadata_cache_key)
        if cached_data is not None:
            return Response(cached_data)

        from doctors.services.specialty_relations import specialty_doctor_counts

        counts = specialty_doctor_counts()

        all_specialties = list(
            DoctorSpecialty.objects.prefetch_related('subspecialties').all()
        )

        # 1. specialty_groups
        umbrellas = [s for s in all_specialties if s.is_umbrella]
        umbrellas.sort(key=lambda u: (u.display_order, u.name))

        specialty_groups = []
        for u in umbrellas:
            u_count = counts.get(u.id, 0)
            u_label = f"{u.name} · {u.bn_name}" if u.bn_name else u.name
            children_nodes = list(u.subspecialties.all())
            children = []
            for c in children_nodes:
                c_count = counts.get(c.id, 0)
                c_label = f"{c.name} · {c.bn_name}" if c.bn_name else c.name
                children.append({
                    'id': str(c.id),
                    'slug': c.slug,
                    'name': c.name,
                    'bn_name': c.bn_name,
                    'label': c_label,
                    'formal_name': c.formal_name,
                    'count': c_count,
                })
            children.sort(key=lambda x: (-x['count'], x['name']))

            specialty_groups.append({
                'id': str(u.id),
                'slug': u.slug,
                'name': u.name,
                'bn_name': u.bn_name,
                'label': u_label,
                'icon': u.icon,
                'count': u_count,
                'children': children,
            })

        # 2. popular_specialties
        popular_nodes = [s for s in all_specialties if s.is_popular]
        popular_specialties = [
            {
                'id': str(s.id),
                'slug': s.slug,
                'name': s.name,
                'bn_name': s.bn_name,
                'count': counts.get(s.id, 0),
            }
            for s in popular_nodes
        ]
        popular_specialties.sort(key=lambda x: (-x['count'], x['name']))

        # 3. specialties_az
        specialties_az = [
            {
                'id': str(s.id),
                'slug': s.slug,
                'name': s.name,
                'bn_name': s.bn_name,
                'label': f"{s.name} · {s.bn_name}" if s.bn_name else s.name,
                'is_umbrella': s.is_umbrella,
                'count': counts.get(s.id, 0),
            }
            for s in all_specialties
        ]
        specialties_az.sort(key=lambda x: x['name'].lower())

        test_categories = TestCategory.objects.filter(is_active=True).annotate(
            test_count=Count('tests', filter=Q(tests__is_active=True), distinct=True)
        ).order_by('name')
        hospital_categories = HospitalCategory.objects.annotate(hospital_count=Count('hospitals', distinct=True)).order_by('name')
        diagnostic_center_categories = DiagnosticCenterCategory.objects.annotate(center_count=Count('centers', distinct=True)).order_by('name')

        from facilities.serializers_summary import FacilitySummarySerializer

        locations = Location.objects.filter(is_active=True, location_type__in=['hospital', 'diagnostic_center']).select_related('thana__district__division').order_by('name', 'branch')
        facilities_data = FacilitySummarySerializer(locations, many=True, context={'request': request}).data

        response_data = {
            'specialty_groups': specialty_groups,
            'popular_specialties': popular_specialties,
            'specialties_az': specialties_az,
            'test_categories': TestCategorySerializer(test_categories, many=True, context={'request': request}).data,
            'hospital_categories': HospitalCategorySerializer(hospital_categories, many=True, context={'request': request}).data,
            'diagnostic_center_categories': DiagnosticCenterCategorySerializer(diagnostic_center_categories, many=True, context={'request': request}).data,
            'facilities': facilities_data,
            'hospitals': [f for f in facilities_data if f.get('location_type') == 'hospital'],
            'diagnostic_centers': [f for f in facilities_data if f.get('location_type') == 'diagnostic_center'],
        }
        cache.set(metadata_cache_key, response_data, timeout=300)
        return Response(response_data)


class SearchFacetsAPIView(APIView):
    """
    Returns real-time aggregated counts for specialties, hospital categories,
    diagnostic categories, and test categories matching the active search/location filters.
    """
    permission_classes = (permissions.AllowAny,)

    @extend_schema(
        tags=['Search & Discovery'],
        summary='Real-time faceted search counts and taxonomy aggregations',
        description='Returns dynamic counts of matching doctors, hospitals, diagnostic centers, specialties, and categories filtered by location IDs or keyword search query.',
        parameters=[
            OpenApiParameter('division_id', OpenApiTypes.INT, OpenApiParameter.QUERY, description='Division ID filter'),
            OpenApiParameter('district_id', OpenApiTypes.INT, OpenApiParameter.QUERY, description='District ID filter'),
            OpenApiParameter('thana_id', OpenApiTypes.INT, OpenApiParameter.QUERY, description='Thana ID filter'),
            OpenApiParameter('search', OpenApiTypes.STR, OpenApiParameter.QUERY, description='Search query text matching doctor name, hospital, category, or test'),
            OpenApiParameter('q', OpenApiTypes.STR, OpenApiParameter.QUERY, description='Alias for search parameter'),
        ],
        responses={200: SearchFacetsResponseSerializer}
    )
    def get(self, request, *args, **kwargs):
        division_id = request.query_params.get('division_id')
        district_id = request.query_params.get('district_id')
        thana_id = request.query_params.get('thana_id')
        search_query = request.query_params.get('search') or request.query_params.get('q')

        parsed_div_id = None
        parsed_dist_id = None
        parsed_thana_id = None
        try:
            if division_id is not None and division_id != '':
                parsed_div_id = int(division_id)
            if district_id is not None and district_id != '':
                parsed_dist_id = int(district_id)
            if thana_id is not None and thana_id != '':
                parsed_thana_id = int(thana_id)
        except (ValueError, TypeError):
            return Response({'error': 'Location filter IDs must be integers.'}, status=status.HTTP_400_BAD_REQUEST)

        cache_key = f"search_facets:v{public_cache_version()}:{parsed_div_id}:{parsed_dist_id}:{parsed_thana_id}:{search_query or ''}"
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return Response(cached_data, status=status.HTTP_200_OK)

        # Filtered base hospital queryset
        hosp_qs = Hospital.objects.filter(location__is_active=True)
        if parsed_div_id is not None:
            hosp_qs = hosp_qs.filter(location__thana__district__division_id=parsed_div_id)
        if parsed_dist_id is not None:
            hosp_qs = hosp_qs.filter(location__thana__district_id=parsed_dist_id)
        if parsed_thana_id is not None:
            hosp_qs = hosp_qs.filter(location__thana_id=parsed_thana_id)

        if search_query:
            hosp_qs = hosp_qs.filter(
                models.Q(location__name__icontains=search_query) |
                models.Q(location__branch__icontains=search_query)
            )

        hospital_categories = HospitalCategory.objects.annotate(
            hospital_count=Count('hospitals', filter=models.Q(hospitals__in=hosp_qs), distinct=True)
        ).order_by('-hospital_count', 'name')

        response_data = {
            'hospital_categories': [
                {
                    'id': str(cat.id),
                    'slug': cat.slug,
                    'name': cat.name,
                    'hospital_count': cat.hospital_count,
                }
                for cat in hospital_categories
            ],
        }
        cache.set(cache_key, response_data, timeout=60)

        return Response(response_data, status=status.HTTP_200_OK)


class AdminInitAPIView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    @extend_schema(
        tags=['Admin & Staff Management'],
        summary='Initialize Admin Dashboard scoped data',
        description='Returns dashboard reference taxonomies, profile details, and role-scoped facilities, doctors, bookings, and tests based on whether the authenticated user is Super Admin, Facility Admin, or Doctor.',
        responses={
            200: AdminDashboardInitResponseSerializer,
            403: OpenApiTypes.OBJECT
        }
    )
    def get(self, request, *args, **kwargs):
        user = request.user

        is_super = getattr(user, "is_super_admin", False)
        is_fac = getattr(user, "is_facility_admin", False)
        is_doc = getattr(user, "is_doctor_role", False)

        if not (is_super or is_fac or is_doc):
            return Response(
                {"detail": "You do not have administrative access."},
                status=status.HTTP_403_FORBIDDEN
            )

        # Reference Taxonomies
        doctor_specialties = DoctorSpecialtySerializer(
            DoctorSpecialty.objects.annotate(
                doctor_count=Count('doctors', distinct=True),
                alias_count=Count('aliases', distinct=True)
            ).order_by('name'),
            many=True,
            context={'request': request}
        ).data
        hospital_categories = HospitalCategorySerializer(HospitalCategory.objects.all().order_by('name'), many=True, context={'request': request}).data
        diagnostic_categories = DiagnosticCenterCategorySerializer(DiagnosticCenterCategory.objects.all().order_by('name'), many=True, context={'request': request}).data
        hospital_services = HospitalServiceSerializer(HospitalService.objects.all().order_by('name'), many=True, context={'request': request}).data
        diagnostic_services = DiagnosticServiceSerializer(DiagnosticService.objects.all().order_by('name'), many=True, context={'request': request}).data
        test_categories = TestCategorySerializer(TestCategory.objects.annotate(test_count=Count('tests', distinct=True)).order_by('name'), many=True, context={'request': request}).data

        # Scoped Domain Data
        from facilities.views import get_facility_counts_annotations
        facility_counts = get_facility_counts_annotations()
        hosp_base = Hospital.objects.select_related('location__thana__district__division', 'category').prefetch_related('services').annotate(**facility_counts)
        diag_base = DiagnosticCenter.objects.select_related('location__thana__district__division', 'category').prefetch_related('services').annotate(**facility_counts)
        doc_base = Doctor.objects.prefetch_related('specialties', 'affiliations__location__thana__district__division', 'affiliations__schedules')
        test_base = Test.objects.select_related('category').order_by('name')
        branch_test_base = FacilityTest.objects.select_related('location__thana__district__division', 'test', 'test__category').order_by('test__name')
        doc_booking_base = DoctorBooking.objects.select_related('affiliation__doctor', 'affiliation__location__thana__district__division').order_by('-created_at')
        lab_booking_base = LabBooking.objects.select_related('facility_test__test', 'facility_test__location__thana__district__division').order_by('-created_at')

        INIT_LIMIT = 50

        if is_super:
            counts = {
                "hospitals": hosp_base.count(),
                "diagnostic_centers": diag_base.count(),
                "doctors": doc_base.count(),
                "tests": test_base.count(),
                "branch_tests": branch_test_base.count(),
                "doctor_bookings": doc_booking_base.count(),
                "lab_bookings": lab_booking_base.count(),
                "unverified_aliases": SpecialtyAlias.objects.filter(is_verified=False).count(),
            }
            hospitals_data = HospitalSerializer(hosp_base.all()[:INIT_LIMIT], many=True, context={'request': request}).data
            diagnostic_centers_data = DiagnosticCenterSerializer(diag_base.all()[:INIT_LIMIT], many=True, context={'request': request}).data
            doctors_data = DoctorSerializer(doc_base.all()[:INIT_LIMIT], many=True, context={'request': request}).data
            tests_data = TestSerializer(test_base.all(), many=True, context={'request': request}).data
            branch_tests_data = FacilityTestSerializer(branch_test_base.all()[:INIT_LIMIT], many=True, context={'request': request}).data
            doc_bookings = DoctorBookingSerializer(doc_booking_base.all()[:INIT_LIMIT], many=True, context={'request': request}).data
            lab_bookings = LabBookingSerializer(lab_booking_base.all()[:INIT_LIMIT], many=True, context={'request': request}).data

        elif is_fac:
            managed_ids = user.managed_location_ids
            hosp_scoped = hosp_base.filter(location__in=managed_ids)
            diag_scoped = diag_base.filter(location__in=managed_ids)
            doc_scoped = doc_base.filter(affiliations__location__in=managed_ids).distinct()
            branch_test_scoped = branch_test_base.filter(location__in=managed_ids)
            doc_booking_scoped = doc_booking_base.filter(affiliation__location__in=managed_ids)
            lab_booking_scoped = lab_booking_base.filter(facility_test__location__in=managed_ids)

            counts = {
                "hospitals": hosp_scoped.count(),
                "diagnostic_centers": diag_scoped.count(),
                "doctors": doc_scoped.count(),
                "tests": test_base.count(),
                "branch_tests": branch_test_scoped.count(),
                "doctor_bookings": doc_booking_scoped.count(),
                "lab_bookings": lab_booking_scoped.count(),
            }

            hospitals_data = HospitalSerializer(hosp_scoped[:INIT_LIMIT], many=True, context={'request': request}).data
            diagnostic_centers_data = DiagnosticCenterSerializer(diag_scoped[:INIT_LIMIT], many=True, context={'request': request}).data
            doctors_data = DoctorSerializer(doc_scoped[:INIT_LIMIT], many=True, context={'request': request}).data
            tests_data = TestSerializer(test_base.all(), many=True, context={'request': request}).data
            branch_tests_data = FacilityTestSerializer(branch_test_scoped[:INIT_LIMIT], many=True, context={'request': request}).data
            doc_bookings = DoctorBookingSerializer(doc_booking_scoped[:INIT_LIMIT], many=True, context={'request': request}).data
            lab_bookings = LabBookingSerializer(lab_booking_scoped[:INIT_LIMIT], many=True, context={'request': request}).data

        elif is_doc:
            doc_scoped = doc_base.filter(user=user)
            doc_booking_scoped = doc_booking_base.filter(affiliation__doctor__user=user)
            counts = {
                "hospitals": 0,
                "diagnostic_centers": 0,
                "doctors": doc_scoped.count(),
                "tests": 0,
                "branch_tests": 0,
                "doctor_bookings": doc_booking_scoped.count(),
                "lab_bookings": 0,
            }
            hospitals_data = []
            diagnostic_centers_data = []
            doctors_data = DoctorSerializer(doc_scoped[:INIT_LIMIT], many=True, context={'request': request}).data
            tests_data = []
            branch_tests_data = []
            doc_bookings = DoctorBookingSerializer(doc_booking_scoped[:INIT_LIMIT], many=True, context={'request': request}).data
            lab_bookings = []

        else:
            counts = {}
            hospitals_data = []
            diagnostic_centers_data = []
            doctors_data = []
            tests_data = []
            branch_tests_data = []
            doc_bookings = []
            lab_bookings = []

        return Response({
            "current_user": UserProfileSerializer(user, context={'request': request}).data,
            "counts": counts,
            "limit": INIT_LIMIT,
            "hospitals": hospitals_data,
            "diagnostic_centers": diagnostic_centers_data,
            "doctors": doctors_data,
            "tests": tests_data,
            "branch_tests": branch_tests_data,
            "doctor_bookings": doc_bookings,
            "lab_bookings": lab_bookings,
            "doctor_specialties": doctor_specialties,
            "hospital_categories": hospital_categories,
            "diagnostic_categories": diagnostic_categories,
            "hospital_services": hospital_services,
            "diagnostic_services": diagnostic_services,
            "test_categories": test_categories,
        }, status=status.HTTP_200_OK)
