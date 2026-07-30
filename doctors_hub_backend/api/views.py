from rest_framework import viewsets, generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from .models import (
    User, DoctorSpecialty, HospitalCategory, HospitalService, Hospital,
    TestCategory, Test, DiagnosticCenterCategory, DiagnosticService, DiagnosticCenter, DiagnosticCenterTest,
    Doctor, DoctorAffiliation, AffiliationSchedule, DoctorBooking, LabBooking
)
from .permissions import IsAdminUserOrReadOnly
from .serializers import (
    UserSerializer, UserProfileSerializer, RegisterSerializer, LoginSerializer,
    HospitalCategorySerializer, HospitalServiceSerializer, HospitalSerializer,
    DiagnosticCenterCategorySerializer, DiagnosticServiceSerializer, DiagnosticCenterSerializer, DiagnosticCenterTestSerializer,
    TestCategorySerializer, TestSerializer, DoctorSpecialtySerializer, DoctorSerializer,
    DoctorAffiliationSerializer, DoctorBookingSerializer, LabBookingSerializer
)


class RegisterAPIView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = (permissions.AllowAny,)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            "user": UserSerializer(user, context=self.get_serializer_context()).data,
            "refresh": str(refresh),
            "access": str(refresh.access_token),
        }, status=status.HTTP_201_CREATED)


class LoginAPIView(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request, *args, **kwargs):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data
        refresh = RefreshToken.for_user(user)
        return Response({
            "user": UserSerializer(user).data,
            "refresh": str(refresh),
            "access": str(refresh.access_token),
        }, status=status.HTTP_200_OK)


class UserProfileAPIView(generics.RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_object(self):
        return self.request.user


class HospitalCategoryViewSet(viewsets.ModelViewSet):
    queryset = HospitalCategory.objects.all()
    serializer_class = HospitalCategorySerializer
    permission_classes = (IsAdminUserOrReadOnly,)


HospitalSpecialtyViewSet = HospitalCategoryViewSet


class HospitalServiceViewSet(viewsets.ModelViewSet):
    queryset = HospitalService.objects.all()
    serializer_class = HospitalServiceSerializer
    permission_classes = (IsAdminUserOrReadOnly,)


class HospitalViewSet(viewsets.ModelViewSet):
    queryset = Hospital.objects.all()
    serializer_class = HospitalSerializer
    permission_classes = (IsAdminUserOrReadOnly,)

    def get_queryset(self):
        queryset = Hospital.objects.all()
        location = self.request.query_params.get('location', None)
        category = self.request.query_params.get('category', None)
        search = self.request.query_params.get('search', None)

        if location and location != 'All Bangladesh':
            queryset = queryset.filter(city__icontains=location) | queryset.filter(district__icontains=location)
        if category and category != 'all':
            queryset = queryset.filter(categories__id=category) | queryset.filter(categories__slug=category)
        if search:
            queryset = queryset.filter(name__icontains=search) | queryset.filter(branch__icontains=search)
        return queryset.distinct()


class DiagnosticCenterCategoryViewSet(viewsets.ModelViewSet):
    queryset = DiagnosticCenterCategory.objects.all()
    serializer_class = DiagnosticCenterCategorySerializer
    permission_classes = (IsAdminUserOrReadOnly,)


class DiagnosticServiceViewSet(viewsets.ModelViewSet):
    queryset = DiagnosticService.objects.all()
    serializer_class = DiagnosticServiceSerializer
    permission_classes = (IsAdminUserOrReadOnly,)


class DiagnosticCenterViewSet(viewsets.ModelViewSet):
    queryset = DiagnosticCenter.objects.all()
    serializer_class = DiagnosticCenterSerializer
    permission_classes = (IsAdminUserOrReadOnly,)

    def get_queryset(self):
        queryset = DiagnosticCenter.objects.all()
        location = self.request.query_params.get('location', None)
        district = self.request.query_params.get('district', None)
        category = self.request.query_params.get('category', None)
        search = self.request.query_params.get('search', None)

        if location and location != 'All Bangladesh':
            queryset = queryset.filter(district__icontains=location)
        if district:
            queryset = queryset.filter(district__icontains=district)
        if category and category != 'all':
            queryset = queryset.filter(categories__id=category) | queryset.filter(categories__slug=category)
        if search:
            queryset = queryset.filter(name__icontains=search) | queryset.filter(branch__icontains=search)
        return queryset.distinct()


BranchViewSet = DiagnosticCenterViewSet


class TestCategoryViewSet(viewsets.ModelViewSet):
    queryset = TestCategory.objects.all()
    serializer_class = TestCategorySerializer
    permission_classes = (IsAdminUserOrReadOnly,)


class TestViewSet(viewsets.ModelViewSet):
    queryset = Test.objects.all()
    serializer_class = TestSerializer
    permission_classes = (IsAdminUserOrReadOnly,)

    def get_queryset(self):
        queryset = Test.objects.all()
        category = self.request.query_params.get('category', None)
        search = self.request.query_params.get('search', None)

        if category and category != 'all':
            queryset = queryset.filter(category_id=category) | queryset.filter(category__slug=category)
        if search:
            queryset = queryset.filter(name__icontains=search)
        return queryset


PathologyTestViewSet = TestViewSet


class DiagnosticCenterTestViewSet(viewsets.ModelViewSet):
    queryset = DiagnosticCenterTest.objects.all()
    serializer_class = DiagnosticCenterTestSerializer
    permission_classes = (IsAdminUserOrReadOnly,)

    def get_queryset(self):
        queryset = DiagnosticCenterTest.objects.all()
        center = self.request.query_params.get('center', None)
        branch = self.request.query_params.get('branch', None)
        test = self.request.query_params.get('test', None)

        center_id = center or branch
        if center_id:
            queryset = queryset.filter(center_id=center_id)
        if test:
            queryset = queryset.filter(test_id=test)
        return queryset


BranchTestViewSet = DiagnosticCenterTestViewSet


class DoctorSpecialtyViewSet(viewsets.ModelViewSet):
    queryset = DoctorSpecialty.objects.all()
    serializer_class = DoctorSpecialtySerializer
    permission_classes = (IsAdminUserOrReadOnly,)


SpecialtyViewSet = DoctorSpecialtyViewSet


class DoctorViewSet(viewsets.ModelViewSet):
    queryset = Doctor.objects.all()
    serializer_class = DoctorSerializer
    permission_classes = (IsAdminUserOrReadOnly,)

    def get_queryset(self):
        queryset = Doctor.objects.all().distinct()
        specialty = self.request.query_params.get('specialty', None)
        location = self.request.query_params.get('location', None)
        search = self.request.query_params.get('search', None)
        consultation_type = self.request.query_params.get('consultation_type', None)
        hospital = self.request.query_params.get('hospital', None)
        diagnostic_center = self.request.query_params.get('diagnostic_center', None)

        if specialty:
            queryset = queryset.filter(specialties__id=specialty) | queryset.filter(specialties__slug=specialty)
        if location and location != 'All Bangladesh':
            queryset = (
                queryset.filter(affiliations__hospital__city__icontains=location) |
                queryset.filter(affiliations__hospital__district__icontains=location) |
                queryset.filter(affiliations__diagnostic_center__district__icontains=location)
            )
        if search:
            queryset = queryset.filter(name__icontains=search)
        if consultation_type:
            queryset = queryset.filter(affiliations__consultation_type=consultation_type)
        if hospital:
            queryset = queryset.filter(affiliations__hospital_id=hospital)
        if diagnostic_center:
            queryset = queryset.filter(affiliations__diagnostic_center_id=diagnostic_center)

        return queryset.distinct()


class DoctorAffiliationViewSet(viewsets.ModelViewSet):
    queryset = DoctorAffiliation.objects.all()
    serializer_class = DoctorAffiliationSerializer
    permission_classes = (IsAdminUserOrReadOnly,)

    def get_queryset(self):
        queryset = DoctorAffiliation.objects.all()
        consultation_type = self.request.query_params.get('consultation_type', None)
        doctor = self.request.query_params.get('doctor', None)
        hospital = self.request.query_params.get('hospital', None)
        diagnostic_center = self.request.query_params.get('diagnostic_center', None)
        branch = self.request.query_params.get('branch', None)

        if consultation_type:
            queryset = queryset.filter(consultation_type=consultation_type)
        if doctor:
            queryset = queryset.filter(doctor_id=doctor)
        if hospital:
            queryset = queryset.filter(hospital_id=hospital)
        if diagnostic_center or branch:
            dc_id = diagnostic_center or branch
            queryset = queryset.filter(diagnostic_center_id=dc_id)
        return queryset


class DoctorBookingViewSet(viewsets.ModelViewSet):
    serializer_class = DoctorBookingSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        if self.request.user.is_staff:
            return DoctorBooking.objects.all().order_by('-created_at')
        return DoctorBooking.objects.filter(user=self.request.user).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class LabBookingViewSet(viewsets.ModelViewSet):
    serializer_class = LabBookingSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        if self.request.user.is_staff:
            return LabBooking.objects.all().order_by('-created_at')
        return LabBooking.objects.filter(user=self.request.user).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
