from rest_framework import permissions, status, exceptions, serializers
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db import models
from django.db.models import Count
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiTypes

from accounts.serializers import UserProfileSerializer
from doctors.models import DoctorSpecialty, Doctor, DoctorAffiliation
from facilities.models import (
    Location, HospitalCategory, HospitalService, Hospital,
    DiagnosticCenterCategory, DiagnosticService, DiagnosticCenter, Chamber
)
from tests.models import TestCategory, Test, FacilityTest
from bookings.models import DoctorBooking, LabBooking

from doctors.serializers import DoctorSpecialtySerializer, DoctorSerializer
from facilities.serializers import (
    HospitalCategorySerializer, DiagnosticCenterCategorySerializer,
    HospitalServiceSerializer, DiagnosticServiceSerializer,
    HospitalSerializer, DiagnosticCenterSerializer
)
from tests.serializers import TestCategorySerializer, TestSerializer, FacilityTestSerializer
from bookings.serializers import DoctorBookingSerializer, LabBookingSerializer


class SearchMetadataResponseSerializer(serializers.Serializer):
    specialties = DoctorSpecialtySerializer(many=True)
    test_categories = TestCategorySerializer(many=True)
    hospital_categories = HospitalCategorySerializer(many=True)
    diagnostic_center_categories = DiagnosticCenterCategorySerializer(many=True)


class SearchFacetsResponseSerializer(serializers.Serializer):
    total_doctors = serializers.IntegerField()
    total_hospitals = serializers.IntegerField()
    total_diagnostic_centers = serializers.IntegerField()
    specialties = DoctorSpecialtySerializer(many=True)
    hospital_categories = HospitalCategorySerializer(many=True)
    diagnostic_center_categories = DiagnosticCenterCategorySerializer(many=True)
    test_categories = TestCategorySerializer(many=True)
    districts = serializers.ListField(child=serializers.CharField())
    divisions = serializers.ListField(child=serializers.CharField())


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
        cached_data = cache.get('search_metadata_global')
        if cached_data is not None:
            return Response(cached_data)

        specialties = DoctorSpecialty.objects.annotate(doctor_count=Count('doctors', distinct=True)).order_by('name')
        test_categories = TestCategory.objects.annotate(test_count=Count('tests', distinct=True)).order_by('name')
        hospital_categories = HospitalCategory.objects.annotate(hospital_count=Count('hospitals', distinct=True)).order_by('name')
        diagnostic_center_categories = DiagnosticCenterCategory.objects.annotate(center_count=Count('centers', distinct=True)).order_by('name')

        response_data = {
            'specialties': DoctorSpecialtySerializer(specialties, many=True, context={'request': request}).data,
            'test_categories': TestCategorySerializer(test_categories, many=True, context={'request': request}).data,
            'hospital_categories': HospitalCategorySerializer(hospital_categories, many=True, context={'request': request}).data,
            'diagnostic_center_categories': DiagnosticCenterCategorySerializer(diagnostic_center_categories, many=True, context={'request': request}).data,
        }
        cache.set('search_metadata_global', response_data, timeout=300)
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
        description='Returns dynamic counts of matching doctors, hospitals, diagnostic centers, specialties, and categories filtered by location, area, or keyword search query.',
        parameters=[
            OpenApiParameter('location', OpenApiTypes.STR, OpenApiParameter.QUERY, description='District, division, or area name filter (e.g. Dhaka, Chittagong)'),
            OpenApiParameter('loc', OpenApiTypes.STR, OpenApiParameter.QUERY, description='Alias for location parameter'),
            OpenApiParameter('area', OpenApiTypes.STR, OpenApiParameter.QUERY, description='Specific area name filter (e.g. Dhanmondi, Banani, Mirpur)'),
            OpenApiParameter('search', OpenApiTypes.STR, OpenApiParameter.QUERY, description='Search query text matching doctor name, hospital, category, or test'),
            OpenApiParameter('q', OpenApiTypes.STR, OpenApiParameter.QUERY, description='Alias for search parameter'),
        ],
        responses={200: SearchFacetsResponseSerializer}
    )
    def get(self, request, *args, **kwargs):
        loc_filter = request.query_params.get('location') or request.query_params.get('loc')
        area_filter = request.query_params.get('area')
        search_query = request.query_params.get('search') or request.query_params.get('q')

        cache_key = f"search_facets:{loc_filter or ''}:{area_filter or ''}:{search_query or ''}"
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return Response(cached_data, status=status.HTTP_200_OK)

        # Filtered base doctor queryset
        doc_qs = Doctor.objects.all()
        if loc_filter and loc_filter not in ('All Bangladesh', 'all', ''):
            doc_qs = doc_qs.filter(
                models.Q(affiliations__location__district__iexact=loc_filter) |
                models.Q(affiliations__location__division__iexact=loc_filter) |
                models.Q(affiliations__location__area__iexact=loc_filter)
            )
        if area_filter and area_filter not in ('All Areas', 'all', ''):
            doc_qs = doc_qs.filter(affiliations__location__area__iexact=area_filter)
        if search_query:
            doc_qs = doc_qs.filter(
                models.Q(name__icontains=search_query) |
                models.Q(qualification__icontains=search_query) |
                models.Q(specialties__name__icontains=search_query)
            )

        # Annotated specialties with count of matching doctors
        specialties = DoctorSpecialty.objects.annotate(
            doctor_count=Count('doctors', filter=models.Q(doctors__in=doc_qs), distinct=True)
        ).order_by('-doctor_count', 'name')

        # Filtered base hospital queryset
        hosp_qs = Hospital.objects.all()
        if loc_filter and loc_filter not in ('All Bangladesh', 'all', ''):
            hosp_qs = hosp_qs.filter(
                models.Q(location__district__iexact=loc_filter) |
                models.Q(location__division__iexact=loc_filter) |
                models.Q(location__area__iexact=loc_filter)
            )
        if area_filter and area_filter not in ('All Areas', 'all', ''):
            hosp_qs = hosp_qs.filter(location__area__iexact=area_filter)
        if search_query:
            hosp_qs = hosp_qs.filter(
                models.Q(location__name__icontains=search_query) |
                models.Q(location__branch__icontains=search_query)
            )

        hospital_categories = HospitalCategory.objects.annotate(
            hospital_count=Count('hospitals', filter=models.Q(hospitals__in=hosp_qs), distinct=True)
        ).order_by('-hospital_count', 'name')

        # Filtered base diagnostic center queryset
        diag_qs = DiagnosticCenter.objects.all()
        if loc_filter and loc_filter not in ('All Bangladesh', 'all', ''):
            diag_qs = diag_qs.filter(
                models.Q(location__district__iexact=loc_filter) |
                models.Q(location__division__iexact=loc_filter) |
                models.Q(location__area__iexact=loc_filter)
            )
        if area_filter and area_filter not in ('All Areas', 'all', ''):
            diag_qs = diag_qs.filter(location__area__iexact=area_filter)
        if search_query:
            diag_qs = diag_qs.filter(
                models.Q(location__name__icontains=search_query) |
                models.Q(location__branch__icontains=search_query)
            )

        diagnostic_center_categories = DiagnosticCenterCategory.objects.annotate(
            center_count=Count('centers', filter=models.Q(centers__in=diag_qs), distinct=True)
        ).order_by('-center_count', 'name')

        test_categories = TestCategory.objects.annotate(
            test_count=Count('tests', distinct=True),
            center_count=Count('tests__offered_at__location', filter=models.Q(tests__offered_at__location__diagnostic_center_detail__in=diag_qs), distinct=True)
        ).order_by('-center_count', 'name')

        districts = list(Location.objects.values_list('district', flat=True).distinct().order_by('district'))
        divisions = list(Location.objects.values_list('division', flat=True).distinct().order_by('division'))

        response_data = {
            'total_doctors': doc_qs.distinct().count(),
            'total_hospitals': hosp_qs.distinct().count(),
            'total_diagnostic_centers': diag_qs.distinct().count(),
            'specialties': DoctorSpecialtySerializer(specialties, many=True, context={'request': request}).data,
            'hospital_categories': HospitalCategorySerializer(hospital_categories, many=True, context={'request': request}).data,
            'diagnostic_center_categories': DiagnosticCenterCategorySerializer(diagnostic_center_categories, many=True, context={'request': request}).data,
            'test_categories': TestCategorySerializer(test_categories, many=True, context={'request': request}).data,
            'districts': [d for d in districts if d],
            'divisions': [d for d in divisions if d],
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
        doctor_specialties = DoctorSpecialtySerializer(DoctorSpecialty.objects.all().order_by('name'), many=True, context={'request': request}).data
        hospital_categories = HospitalCategorySerializer(HospitalCategory.objects.all().order_by('name'), many=True, context={'request': request}).data
        diagnostic_categories = DiagnosticCenterCategorySerializer(DiagnosticCenterCategory.objects.all().order_by('name'), many=True, context={'request': request}).data
        hospital_services = HospitalServiceSerializer(HospitalService.objects.all().order_by('name'), many=True, context={'request': request}).data
        diagnostic_services = DiagnosticServiceSerializer(DiagnosticService.objects.all().order_by('name'), many=True, context={'request': request}).data
        test_categories = TestCategorySerializer(TestCategory.objects.all().order_by('name'), many=True, context={'request': request}).data

        # Scoped Domain Data
        hosp_base = Hospital.objects.select_related('location', 'category').prefetch_related('services')
        diag_base = DiagnosticCenter.objects.select_related('location', 'category').prefetch_related('services')
        doc_base = Doctor.objects.prefetch_related('specialties', 'affiliations__location', 'affiliations__schedules')
        test_base = Test.objects.select_related('category').order_by('name')
        branch_test_base = FacilityTest.objects.select_related('location', 'test', 'test__category').order_by('test__name')
        doc_booking_base = DoctorBooking.objects.select_related('affiliation__doctor', 'affiliation__location').order_by('-created_at')
        lab_booking_base = LabBooking.objects.select_related('facility_test__test', 'facility_test__location').order_by('-created_at')

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
            }
            hospitals_data = HospitalSerializer(hosp_base.all()[:INIT_LIMIT], many=True, context={'request': request}).data
            diagnostic_centers_data = DiagnosticCenterSerializer(diag_base.all()[:INIT_LIMIT], many=True, context={'request': request}).data
            doctors_data = DoctorSerializer(doc_base.all()[:INIT_LIMIT], many=True, context={'request': request}).data
            tests_data = TestSerializer(test_base.all()[:INIT_LIMIT], many=True, context={'request': request}).data
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
            tests_data = TestSerializer(test_base.all()[:INIT_LIMIT], many=True, context={'request': request}).data
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
