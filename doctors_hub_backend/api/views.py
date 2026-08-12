from rest_framework import viewsets, generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.pagination import PageNumberPagination
from rest_framework_simplejwt.tokens import RefreshToken
from django.db.models import Q, Count
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


class StandardResultsSetPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100



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


import uuid
from rest_framework.exceptions import NotFound

def is_valid_uuid(val):
    try:
        uuid.UUID(str(val))
        return True
    except ValueError:
        return False

class HospitalViewSet(viewsets.ModelViewSet):
    queryset = Hospital.objects.all()
    serializer_class = HospitalSerializer
    permission_classes = (IsAdminUserOrReadOnly,)
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        queryset = Hospital.objects.prefetch_related(
            'categories',
            'services',
            'affiliated_doctors__schedules',
            'affiliated_doctors__doctor',
            'affiliated_doctors__hospital',
            'affiliated_doctors__diagnostic_center',
            'offered_tests__test',
            'offered_tests__test__category',
            'offered_tests__center',
            'offered_tests__hospital'
        )
        location = self.request.query_params.get('location', None)
        area = self.request.query_params.get('area', None)
        category = self.request.query_params.get('category', None)
        search = self.request.query_params.get('search', None)

        if location and location != 'All Bangladesh':
            queryset = queryset.filter(Q(city__icontains=location) | Q(district__icontains=location) | Q(division__icontains=location) | Q(address__icontains=location))
        if area and area != 'All Areas':
            queryset = queryset.filter(Q(address__icontains=area) | Q(city__icontains=area) | Q(district__icontains=area) | Q(name__icontains=area) | Q(branch__icontains=area))
        if category and category != 'all' and category != 'All Categories':
            cat_str = str(category).lower().strip()
            clean_cat = cat_str.replace('-', '').replace(' ', '')
            q = (
                Q(categories__slug=cat_str) | 
                Q(categories__slug__icontains=cat_str) | 
                Q(categories__name__icontains=cat_str)
            )
            if 'multispecialty' in clean_cat or 'multispeciality' in clean_cat:
                q |= Q(categories__slug__icontains='multi-specialty') | Q(categories__name__icontains='Multi-Specialty')
            elif 'cardiac' in clean_cat:
                q |= Q(categories__slug__icontains='cardiac') | Q(categories__name__icontains='Cardiac')
            elif 'eye' in clean_cat:
                q |= Q(categories__slug__icontains='eye') | Q(categories__name__icontains='Eye')

            if is_valid_uuid(category):
                q |= Q(categories__id=category)
            queryset = queryset.filter(q)
        if search:
            queryset = queryset.filter(Q(name__icontains=search) | Q(branch__icontains=search) | Q(address__icontains=search) | Q(tagline__icontains=search))
        return queryset.order_by('-created_at').distinct()

    def get_object(self):
        queryset = self.filter_queryset(self.get_queryset())
        lookup_url_kwarg = self.lookup_url_kwarg or self.lookup_field
        lookup_val = self.kwargs.get(lookup_url_kwarg, '')

        # 1. Try exact UUID pk lookup
        try:
            val_uuid = uuid.UUID(str(lookup_val))
            obj = queryset.filter(pk=val_uuid).first()
            if obj:
                self.check_object_permissions(self.request, obj)
                return obj
        except (ValueError, TypeError):
            pass

        # 2. Try slug lookup
        obj = queryset.filter(slug=lookup_val).first()
        if not obj:
            obj = queryset.filter(slug__icontains=lookup_val).first()

        if obj:
            self.check_object_permissions(self.request, obj)
            return obj

        raise NotFound(f"No Hospital found matching '{lookup_val}'")


class DiagnosticCenterCategoryViewSet(viewsets.ModelViewSet):
    queryset = DiagnosticCenterCategory.objects.select_related('parent').all()
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
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        queryset = DiagnosticCenter.objects.prefetch_related(
            'categories',
            'categories__parent',
            'services',
            'affiliated_doctors__schedules',
            'affiliated_doctors__doctor',
            'affiliated_doctors__hospital',
            'affiliated_doctors__diagnostic_center',
            'offered_tests__test',
            'offered_tests__test__category',
            'offered_tests__center',
            'offered_tests__hospital'
        )
        location = self.request.query_params.get('location', None)
        district = self.request.query_params.get('district', None)
        area = self.request.query_params.get('area', None)
        category = self.request.query_params.get('category', None)
        spec = self.request.query_params.get('spec', None)
        owner = self.request.query_params.get('owner', None)
        testcat = self.request.query_params.get('testcat', None)
        search = self.request.query_params.get('search', None)

        if location and location != 'All Bangladesh':
            queryset = queryset.filter(Q(district__icontains=location) | Q(address__icontains=location))
        if district:
            queryset = queryset.filter(district__icontains=district)
        if area and area != 'All Areas':
            queryset = queryset.filter(Q(address__icontains=area) | Q(district__icontains=area) | Q(name__icontains=area) | Q(branch__icontains=area))

        # Center categories (spec, owner, or category)
        cat_ids = []
        for c in [category, spec, owner]:
            if c and c != 'all':
                cat_ids.extend([item.strip() for item in str(c).split(',') if item.strip()])
        if cat_ids:
            for cat_val in cat_ids:
                q = Q(categories__slug=cat_val) | Q(categories__name__icontains=cat_val)
                if is_valid_uuid(cat_val):
                    q |= Q(categories__id=cat_val)
                queryset = queryset.filter(q)

        if testcat and testcat != 'all':
            q = Q(offered_tests__test__category__slug=testcat) | Q(offered_tests__test__category__name__icontains=testcat)
            if is_valid_uuid(testcat):
                q |= Q(offered_tests__test__category_id=testcat)
            queryset = queryset.filter(q)

        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | 
                Q(branch__icontains=search) | 
                Q(address__icontains=search) | 
                Q(tagline__icontains=search) |
                Q(offered_tests__test__name__icontains=search) |
                Q(offered_tests__test__category__name__icontains=search)
            )
        return queryset.order_by('-created_at').distinct()

    def get_object(self):
        queryset = self.filter_queryset(self.get_queryset())
        lookup_url_kwarg = self.lookup_url_kwarg or self.lookup_field
        lookup_val = self.kwargs.get(lookup_url_kwarg, '')

        # 1. Try exact UUID pk lookup
        try:
            val_uuid = uuid.UUID(str(lookup_val))
            obj = queryset.filter(pk=val_uuid).first()
            if obj:
                self.check_object_permissions(self.request, obj)
                return obj
        except (ValueError, TypeError):
            pass

        # 2. Try slug lookup
        obj = queryset.filter(slug=lookup_val).first()
        if not obj:
            obj = queryset.filter(slug__icontains=lookup_val).first()

        if obj:
            self.check_object_permissions(self.request, obj)
            return obj

        raise NotFound(f"No Diagnostic Center found matching '{lookup_val}'")


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
        queryset = Test.objects.select_related('category').all()
        category = self.request.query_params.get('category', None)
        search = self.request.query_params.get('search', None)

        if category and category != 'all':
            q = Q(category__slug=category)
            if is_valid_uuid(category):
                q |= Q(category_id=category)
            queryset = queryset.filter(q)
        if search:
            queryset = queryset.filter(name__icontains=search)
        return queryset.order_by('name')


PathologyTestViewSet = TestViewSet


class DiagnosticCenterTestViewSet(viewsets.ModelViewSet):
    queryset = DiagnosticCenterTest.objects.select_related('center', 'hospital', 'test', 'test__category').all()
    serializer_class = DiagnosticCenterTestSerializer
    permission_classes = (IsAdminUserOrReadOnly,)

    def create(self, request, *args, **kwargs):
        if isinstance(request.data, list):
            serializer = self.get_serializer(data=request.data, many=True)
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)
            headers = self.get_success_headers(serializer.data)
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
        return super().create(request, *args, **kwargs)

    def get_queryset(self):
        queryset = DiagnosticCenterTest.objects.select_related('center', 'hospital', 'test', 'test__category').all()
        center = self.request.query_params.get('center', None)
        hospital = self.request.query_params.get('hospital', None)
        branch = self.request.query_params.get('branch', None)
        test = self.request.query_params.get('test', None)

        center_id = center or branch
        if center_id:
            queryset = queryset.filter(center_id=center_id)
        if hospital:
            queryset = queryset.filter(hospital_id=hospital)
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
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        queryset = Doctor.objects.prefetch_related(
            'specialties',
            'affiliations__schedules',
            'affiliations__hospital',
            'affiliations__diagnostic_center',
            'affiliations__doctor'
        ).distinct()
        specialty = self.request.query_params.get('specialty', None)
        location = self.request.query_params.get('location', None)
        area = self.request.query_params.get('area', None)
        search = self.request.query_params.get('search', None)
        consultation_type = self.request.query_params.get('consultation_type', None)
        hospital = self.request.query_params.get('hospital', None)
        diagnostic_center = self.request.query_params.get('diagnostic_center', None)
        fee_max = self.request.query_params.get('fee_max', None) or self.request.query_params.get('max_fee', None)
        day = self.request.query_params.get('day', None)

        if specialty:
            q = Q(specialties__slug=specialty) | Q(specialties__name__icontains=specialty)
            if is_valid_uuid(specialty):
                q |= Q(specialties__id=specialty)
            queryset = queryset.filter(q)
        if location and location != 'All Bangladesh':
            queryset = queryset.filter(
                Q(affiliations__hospital__city__icontains=location) |
                Q(affiliations__hospital__district__icontains=location) |
                Q(affiliations__diagnostic_center__district__icontains=location)
            )
        if area and area != 'All Areas':
            queryset = queryset.filter(
                Q(affiliations__hospital__address__icontains=area) |
                Q(affiliations__hospital__district__icontains=area) |
                Q(affiliations__hospital__city__icontains=area) |
                Q(affiliations__hospital__name__icontains=area) |
                Q(affiliations__hospital__branch__icontains=area) |
                Q(affiliations__diagnostic_center__address__icontains=area) |
                Q(affiliations__diagnostic_center__district__icontains=area) |
                Q(affiliations__diagnostic_center__name__icontains=area) |
                Q(affiliations__diagnostic_center__branch__icontains=area)
            )
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(qualification__icontains=search) |
                Q(specialties__name__icontains=search) |
                Q(affiliations__hospital__name__icontains=search) |
                Q(affiliations__hospital__branch__icontains=search) |
                Q(affiliations__diagnostic_center__name__icontains=search) |
                Q(affiliations__diagnostic_center__branch__icontains=search)
            )
        if consultation_type:
            if consultation_type in ['Doctor', 'OPD']:
                queryset = queryset.filter(
                    Q(affiliations__consultation_type='OPD') | Q(affiliations__consultation_type='Doctor')
                )
            else:
                queryset = queryset.filter(affiliations__consultation_type=consultation_type)
        if hospital:
            queryset = queryset.filter(affiliations__hospital_id=hospital)
        if diagnostic_center:
            queryset = queryset.filter(affiliations__diagnostic_center_id=diagnostic_center)
        if fee_max:
            try:
                max_f = float(fee_max)
                queryset = queryset.filter(affiliations__fee__lte=max_f)
            except (ValueError, TypeError):
                pass
        if day and day != 'All':
            queryset = queryset.filter(affiliations__schedules__day_of_week__icontains=day)

        return queryset.order_by('name').distinct()


class SearchMetadataAPIView(APIView):
    permission_classes = (permissions.AllowAny,)

    def get(self, request, *args, **kwargs):
        specialties = DoctorSpecialtySerializer(DoctorSpecialty.objects.all(), many=True, context={'request': request}).data
        test_categories = TestCategorySerializer(TestCategory.objects.all(), many=True, context={'request': request}).data
        hospital_categories = HospitalCategorySerializer(HospitalCategory.objects.all(), many=True, context={'request': request}).data
        diagnostic_center_categories = DiagnosticCenterCategorySerializer(DiagnosticCenterCategory.objects.select_related('parent').all(), many=True, context={'request': request}).data

        return Response({
            'specialties': specialties,
            'test_categories': test_categories,
            'hospital_categories': hospital_categories,
            'diagnostic_center_categories': diagnostic_center_categories,
        })


class DoctorAffiliationViewSet(viewsets.ModelViewSet):
    queryset = DoctorAffiliation.objects.select_related('doctor', 'hospital', 'diagnostic_center').prefetch_related('schedules').all()
    serializer_class = DoctorAffiliationSerializer
    permission_classes = (IsAdminUserOrReadOnly,)

    def get_queryset(self):
        queryset = DoctorAffiliation.objects.select_related('doctor', 'hospital', 'diagnostic_center').prefetch_related('schedules').all()
        consultation_type = self.request.query_params.get('consultation_type', None)
        doctor = self.request.query_params.get('doctor', None)
        hospital = self.request.query_params.get('hospital', None)
        diagnostic_center = self.request.query_params.get('diagnostic_center', None)
        branch = self.request.query_params.get('branch', None)

        if consultation_type:
            if consultation_type in ['Doctor', 'OPD']:
                queryset = queryset.filter(
                    Q(consultation_type='OPD') | Q(consultation_type='Doctor')
                )
            else:
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
        qs = DoctorBooking.objects.select_related('affiliation__doctor', 'affiliation__hospital', 'affiliation__diagnostic_center')
        if self.request.user.is_staff:
            return qs.all().order_by('-created_at')
        return qs.filter(user=self.request.user).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class LabBookingViewSet(viewsets.ModelViewSet):
    serializer_class = LabBookingSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        qs = LabBooking.objects.select_related('center_test__test', 'center_test__center')
        if self.request.user.is_staff:
            return qs.all().order_by('-created_at')
        return qs.filter(user=self.request.user).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class AdminInitAPIView(APIView):
    permission_classes = (permissions.AllowAny,)

    def get(self, request, *args, **kwargs):
        hospitals = HospitalSerializer(Hospital.objects.prefetch_related(
            'categories', 'services', 'affiliated_doctors__schedules', 'affiliated_doctors__doctor', 'affiliated_doctors__hospital', 'affiliated_doctors__diagnostic_center', 'offered_tests__test', 'offered_tests__test__category', 'offered_tests__center', 'offered_tests__hospital'
        ).all().distinct(), many=True, context={'request': request}).data

        diagnostic_centers = DiagnosticCenterSerializer(DiagnosticCenter.objects.prefetch_related(
            'categories', 'categories__parent', 'services', 'affiliated_doctors__schedules', 'affiliated_doctors__doctor', 'affiliated_doctors__hospital', 'affiliated_doctors__diagnostic_center', 'offered_tests__test', 'offered_tests__test__category', 'offered_tests__center', 'offered_tests__hospital'
        ).all().distinct(), many=True, context={'request': request}).data

        doctors = DoctorSerializer(Doctor.objects.prefetch_related(
            'specialties', 'affiliations__schedules', 'affiliations__hospital', 'affiliations__diagnostic_center', 'affiliations__doctor'
        ).all().distinct(), many=True, context={'request': request}).data

        tests = TestSerializer(Test.objects.select_related('category').all(), many=True, context={'request': request}).data
        branch_tests = DiagnosticCenterTestSerializer(DiagnosticCenterTest.objects.select_related('center', 'hospital', 'test', 'test__category').all(), many=True, context={'request': request}).data
        
        doctor_specialties = DoctorSpecialtySerializer(DoctorSpecialty.objects.all(), many=True, context={'request': request}).data
        hospital_categories = HospitalCategorySerializer(HospitalCategory.objects.all(), many=True, context={'request': request}).data
        diagnostic_categories = DiagnosticCenterCategorySerializer(DiagnosticCenterCategory.objects.select_related('parent').all(), many=True, context={'request': request}).data
        hospital_services = HospitalServiceSerializer(HospitalService.objects.all(), many=True, context={'request': request}).data
        diagnostic_services = DiagnosticServiceSerializer(DiagnosticService.objects.all(), many=True, context={'request': request}).data
        test_categories = TestCategorySerializer(TestCategory.objects.select_related('parent').prefetch_related('children').annotate(children_count=Count('children')).all(), many=True, context={'request': request}).data

        if request.user and request.user.is_authenticated:
            doc_qs = DoctorBooking.objects.select_related('affiliation__doctor', 'affiliation__hospital', 'affiliation__diagnostic_center')
            lab_qs = LabBooking.objects.select_related('center_test__test', 'center_test__center')
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
            "hospitals": hospitals,
            "diagnostic_centers": diagnostic_centers,
            "doctors": doctors,
            "tests": tests,
            "branch_tests": branch_tests,
            "doctor_specialties": doctor_specialties,
            "hospital_categories": hospital_categories,
            "diagnostic_categories": diagnostic_categories,
            "hospital_services": hospital_services,
            "diagnostic_services": diagnostic_services,
            "test_categories": test_categories,
            "doctor_bookings": doc_bookings,
            "lab_bookings": lab_bookings,
        }, status=status.HTTP_200_OK)

