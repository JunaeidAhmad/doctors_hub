from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from core.mixins import SlugOrPkLookupMixin
from .models import (
    Address, PracticeLocation, HospitalCategory, HospitalService, Hospital,
    DiagnosticCenterCategory, DiagnosticService, DiagnosticCenter, Chamber
)
from .serializers import (
    AddressSerializer, PracticeLocationSerializer, HospitalCategorySerializer, HospitalServiceSerializer,
    HospitalSerializer, DiagnosticCenterCategorySerializer, DiagnosticServiceSerializer,
    DiagnosticCenterSerializer, ChamberSerializer
)
from core.permissions import IsAdminUserOrReadOnly

class AddressViewSet(viewsets.ModelViewSet):
    queryset = Address.objects.all()
    serializer_class = AddressSerializer
    permission_classes = (IsAdminUserOrReadOnly,)

class PracticeLocationViewSet(viewsets.ModelViewSet):
    queryset = PracticeLocation.objects.all()
    serializer_class = PracticeLocationSerializer
    permission_classes = (IsAdminUserOrReadOnly,)

class HospitalCategoryViewSet(viewsets.ModelViewSet):
    queryset = HospitalCategory.objects.all()
    serializer_class = HospitalCategorySerializer
    permission_classes = (IsAdminUserOrReadOnly,)

HospitalSpecialtyViewSet = HospitalCategoryViewSet

class HospitalServiceViewSet(viewsets.ModelViewSet):
    queryset = HospitalService.objects.all()
    serializer_class = HospitalServiceSerializer
    permission_classes = (IsAdminUserOrReadOnly,)

class HospitalViewSet(SlugOrPkLookupMixin, viewsets.ModelViewSet):
    queryset = Hospital.objects.all()
    serializer_class = HospitalSerializer
    permission_classes = (IsAdminUserOrReadOnly,)
    slug_field = 'location__slug'
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = {
        'location__city': ['exact'],
        'location__area': ['exact'],
        'categories': ['exact'],
    }
    search_fields = ['location__name', 'location__branch']

class DiagnosticCenterCategoryViewSet(viewsets.ModelViewSet):
    queryset = DiagnosticCenterCategory.objects.select_related('parent').all()
    serializer_class = DiagnosticCenterCategorySerializer
    permission_classes = (IsAdminUserOrReadOnly,)

class DiagnosticServiceViewSet(viewsets.ModelViewSet):
    queryset = DiagnosticService.objects.all()
    serializer_class = DiagnosticServiceSerializer
    permission_classes = (IsAdminUserOrReadOnly,)

class DiagnosticCenterViewSet(SlugOrPkLookupMixin, viewsets.ModelViewSet):
    queryset = DiagnosticCenter.objects.all()
    serializer_class = DiagnosticCenterSerializer
    permission_classes = (IsAdminUserOrReadOnly,)
    slug_field = 'location__slug'
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = {
        'location__city': ['exact'],
        'location__area': ['exact'],
        'categories': ['exact'],
    }
    search_fields = ['location__name', 'location__branch']

class ChamberViewSet(viewsets.ModelViewSet):
    queryset = Chamber.objects.all()
    serializer_class = ChamberSerializer
    permission_classes = (IsAdminUserOrReadOnly,)

BranchViewSet = DiagnosticCenterViewSet
