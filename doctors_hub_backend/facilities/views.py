from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
import django_filters
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

class HospitalServiceViewSet(viewsets.ModelViewSet):
    queryset = HospitalService.objects.all()
    serializer_class = HospitalServiceSerializer
    permission_classes = (IsAdminUserOrReadOnly,)

class HospitalFilter(django_filters.FilterSet):
    city = django_filters.CharFilter(field_name='location__address__city', lookup_expr='exact')
    area = django_filters.CharFilter(field_name='location__address__area', lookup_expr='exact')
    district = django_filters.CharFilter(field_name='location__address__district', lookup_expr='exact')
    division = django_filters.CharFilter(field_name='location__address__division', lookup_expr='exact')

    class Meta:
        model = Hospital
        fields = {
            'location__address__city': ['exact'],
            'location__address__area': ['exact'],
            'location__address__district': ['exact'],
            'location__address__division': ['exact'],
            'categories': ['exact'],
        }

class HospitalViewSet(SlugOrPkLookupMixin, viewsets.ModelViewSet):
    queryset = Hospital.objects.all()
    serializer_class = HospitalSerializer
    permission_classes = (IsAdminUserOrReadOnly,)
    slug_field = 'location__slug'
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_class = HospitalFilter
    search_fields = ['location__name', 'location__branch']

class DiagnosticCenterCategoryViewSet(viewsets.ModelViewSet):
    queryset = DiagnosticCenterCategory.objects.select_related('parent').all()
    serializer_class = DiagnosticCenterCategorySerializer
    permission_classes = (IsAdminUserOrReadOnly,)

class DiagnosticServiceViewSet(viewsets.ModelViewSet):
    queryset = DiagnosticService.objects.all()
    serializer_class = DiagnosticServiceSerializer
    permission_classes = (IsAdminUserOrReadOnly,)

class DiagnosticCenterFilter(django_filters.FilterSet):
    city = django_filters.CharFilter(field_name='location__address__city', lookup_expr='exact')
    area = django_filters.CharFilter(field_name='location__address__area', lookup_expr='exact')
    district = django_filters.CharFilter(field_name='location__address__district', lookup_expr='exact')
    division = django_filters.CharFilter(field_name='location__address__division', lookup_expr='exact')

    class Meta:
        model = DiagnosticCenter
        fields = {
            'location__address__city': ['exact'],
            'location__address__area': ['exact'],
            'location__address__district': ['exact'],
            'location__address__division': ['exact'],
            'categories': ['exact'],
        }

class DiagnosticCenterViewSet(SlugOrPkLookupMixin, viewsets.ModelViewSet):
    queryset = DiagnosticCenter.objects.all()
    serializer_class = DiagnosticCenterSerializer
    permission_classes = (IsAdminUserOrReadOnly,)
    slug_field = 'location__slug'
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_class = DiagnosticCenterFilter
    search_fields = ['location__name', 'location__branch']

class ChamberViewSet(viewsets.ModelViewSet):
    queryset = Chamber.objects.all()
    serializer_class = ChamberSerializer
    permission_classes = (IsAdminUserOrReadOnly,)
