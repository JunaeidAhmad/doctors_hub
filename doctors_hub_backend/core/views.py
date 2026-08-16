from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Count

from doctors.models import DoctorSpecialty, Doctor, DoctorAffiliation
from facilities.models import HospitalCategory, HospitalService, DiagnosticCenterCategory, DiagnosticService, Hospital, DiagnosticCenter
from tests.models import TestCategory, Test, FacilityTest
from bookings.models import DoctorBooking, LabBooking

from doctors.serializers import DoctorSpecialtySerializer, DoctorSerializer
from facilities.serializers import HospitalCategorySerializer, DiagnosticCenterCategorySerializer, HospitalServiceSerializer, DiagnosticServiceSerializer, HospitalSerializer, DiagnosticCenterSerializer
from tests.serializers import TestCategorySerializer, TestSerializer, FacilityTestSerializer
from bookings.serializers import DoctorBookingSerializer, LabBookingSerializer


class SearchMetadataAPIView(APIView):
    permission_classes = (permissions.AllowAny,)

    def get(self, request, *args, **kwargs):
        specialties = DoctorSpecialtySerializer(DoctorSpecialty.objects.all(), many=True, context={'request': request}).data
        test_categories = TestCategorySerializer(TestCategory.objects.all(), many=True, context={'request': request}).data
        hospital_categories = HospitalCategorySerializer(HospitalCategory.objects.all(), many=True, context={'request': request}).data
        diagnostic_center_categories = DiagnosticCenterCategorySerializer(DiagnosticCenterCategory.objects.all(), many=True, context={'request': request}).data

        return Response({
            'specialties': specialties,
            'test_categories': test_categories,
            'hospital_categories': hospital_categories,
            'diagnostic_center_categories': diagnostic_center_categories,
        })


class AdminInitAPIView(APIView):
    permission_classes = (permissions.AllowAny,)

    def get(self, request, *args, **kwargs):
        doctor_specialties = DoctorSpecialtySerializer(DoctorSpecialty.objects.all(), many=True, context={'request': request}).data
        hospital_categories = HospitalCategorySerializer(HospitalCategory.objects.all(), many=True, context={'request': request}).data
        diagnostic_categories = DiagnosticCenterCategorySerializer(DiagnosticCenterCategory.objects.all(), many=True, context={'request': request}).data
        hospital_services = HospitalServiceSerializer(HospitalService.objects.all(), many=True, context={'request': request}).data
        diagnostic_services = DiagnosticServiceSerializer(DiagnosticService.objects.all(), many=True, context={'request': request}).data

        
        # In old code: TestCategory.objects.select_related('parent').prefetch_related('children').annotate(children_count=Count('children')).all()
        # New model doesn't have parent/children.
        test_categories = TestCategorySerializer(TestCategory.objects.all(), many=True, context={'request': request}).data

        if request.user and request.user.is_authenticated:
            doc_qs = DoctorBooking.objects.select_related('affiliation__doctor', 'affiliation__location')
            lab_qs = LabBooking.objects.select_related('facility_test__test', 'facility_test__location')
            if request.user.is_staff:
                doc_bookings = DoctorBookingSerializer(doc_qs.all().order_by('-created_at'), many=True, context={'request': request}).data
                lab_bookings = LabBookingSerializer(lab_qs.all().order_by('-created_at'), many=True, context={'request': request}).data
            else:
                doc_bookings = DoctorBookingSerializer(doc_qs.filter(user=request.user).order_by('-created_at'), many=True, context={'request': request}).data
                lab_bookings = LabBookingSerializer(lab_qs.filter(user=request.user).order_by('-created_at'), many=True, context={'request': request}).data
        else:
            doc_bookings = []
            lab_bookings = []

        return Response({
            "doctor_specialties": doctor_specialties,
            "hospital_categories": hospital_categories,
            "diagnostic_categories": diagnostic_categories,
            "hospital_services": hospital_services,
            "diagnostic_services": diagnostic_services,
            "test_categories": test_categories,
            "doctor_bookings": doc_bookings,
            "lab_bookings": lab_bookings,
        }, status=status.HTTP_200_OK)
