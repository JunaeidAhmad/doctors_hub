from rest_framework import viewsets, generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from .models import (
    User, Hospital, Branch, DoctorSpecialty, HospitalSpecialty, TestCategory, PathologyTest, BranchTest,
    Doctor, DoctorAffiliation, AffiliationSchedule,
    DoctorBooking, LabBooking
)
from .permissions import IsAdminUserOrReadOnly
from .serializers import (
    UserSerializer, UserProfileSerializer, RegisterSerializer, LoginSerializer,
    HospitalSerializer, BranchSerializer, DoctorSpecialtySerializer, HospitalSpecialtySerializer, TestCategorySerializer, PathologyTestSerializer,
    BranchTestSerializer, DoctorSerializer, DoctorAffiliationSerializer, AffiliationScheduleSerializer,
    DoctorBookingSerializer, LabBookingSerializer
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

class HospitalViewSet(viewsets.ModelViewSet):
    queryset = Hospital.objects.all()
    serializer_class = HospitalSerializer
    permission_classes = (IsAdminUserOrReadOnly,)

class BranchViewSet(viewsets.ModelViewSet):
    queryset = Branch.objects.all()
    serializer_class = BranchSerializer
    permission_classes = (IsAdminUserOrReadOnly,)

    def get_queryset(self):
        queryset = Branch.objects.all()
        location = self.request.query_params.get('location', None)
        hospital = self.request.query_params.get('hospital', None)
        facility_type = self.request.query_params.get('facility_type', None)

        if location and location != 'All Bangladesh':
            queryset = queryset.filter(city__icontains=location)
        if hospital:
            queryset = queryset.filter(hospital_id=hospital)
        if facility_type:
            queryset = queryset.filter(facility_types__contains=[facility_type])
        return queryset

class DoctorSpecialtyViewSet(viewsets.ModelViewSet):
    queryset = DoctorSpecialty.objects.all()
    serializer_class = DoctorSpecialtySerializer
    permission_classes = (IsAdminUserOrReadOnly,)

SpecialtyViewSet = DoctorSpecialtyViewSet

class HospitalSpecialtyViewSet(viewsets.ModelViewSet):
    queryset = HospitalSpecialty.objects.all()
    serializer_class = HospitalSpecialtySerializer
    permission_classes = (IsAdminUserOrReadOnly,)

class TestCategoryViewSet(viewsets.ModelViewSet):
    queryset = TestCategory.objects.all()
    serializer_class = TestCategorySerializer
    permission_classes = (IsAdminUserOrReadOnly,)

class PathologyTestViewSet(viewsets.ModelViewSet):
    queryset = PathologyTest.objects.all()
    serializer_class = PathologyTestSerializer
    permission_classes = (IsAdminUserOrReadOnly,)
    
    def get_queryset(self):
        queryset = PathologyTest.objects.all()
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(name__icontains=search)
        return queryset

class BranchTestViewSet(viewsets.ModelViewSet):
    queryset = BranchTest.objects.all()
    serializer_class = BranchTestSerializer
    permission_classes = (IsAdminUserOrReadOnly,)

    def get_queryset(self):
        queryset = BranchTest.objects.all()
        branch = self.request.query_params.get('branch', None)
        test = self.request.query_params.get('test', None)
        if branch:
            queryset = queryset.filter(branch_id=branch)
        if test:
            queryset = queryset.filter(test_id=test)
        return queryset

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
        
        if specialty:
            queryset = queryset.filter(specialties__id=specialty)
        if location and location != 'All Bangladesh':
            queryset = queryset.filter(affiliations__branch__city__icontains=location)
        if search:
            queryset = queryset.filter(name__icontains=search)
        if consultation_type:
            queryset = queryset.filter(affiliations__consultation_type=consultation_type)
        if hospital:
            queryset = queryset.filter(affiliations__branch__hospital_id=hospital)
            
        return queryset

class DoctorAffiliationViewSet(viewsets.ModelViewSet):
    queryset = DoctorAffiliation.objects.all()
    serializer_class = DoctorAffiliationSerializer
    permission_classes = (IsAdminUserOrReadOnly,)

    def get_queryset(self):
        queryset = DoctorAffiliation.objects.all()
        consultation_type = self.request.query_params.get('consultation_type', None)
        doctor = self.request.query_params.get('doctor', None)
        branch = self.request.query_params.get('branch', None)

        if consultation_type:
            queryset = queryset.filter(consultation_type=consultation_type)
        if doctor:
            queryset = queryset.filter(doctor_id=doctor)
        if branch:
            queryset = queryset.filter(branch_id=branch)
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
