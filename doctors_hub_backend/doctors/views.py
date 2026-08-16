from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
import django_filters
from core.mixins import SlugOrPkLookupMixin
from .models import DoctorSpecialty, Doctor, DoctorAffiliation, AffiliationSchedule
from .serializers import DoctorSpecialtySerializer, DoctorSerializer, DoctorAffiliationSerializer, AffiliationScheduleSerializer
from core.permissions import IsAdminUserOrReadOnly

class DoctorSpecialtyViewSet(viewsets.ModelViewSet):
    queryset = DoctorSpecialty.objects.all()
    serializer_class = DoctorSpecialtySerializer
    permission_classes = (IsAdminUserOrReadOnly,)

class DoctorFilter(django_filters.FilterSet):
    city = django_filters.CharFilter(field_name='affiliations__location__city', lookup_expr='exact')
    area = django_filters.CharFilter(field_name='affiliations__location__area', lookup_expr='exact')
    district = django_filters.CharFilter(field_name='affiliations__location__district', lookup_expr='exact')
    division = django_filters.CharFilter(field_name='affiliations__location__division', lookup_expr='exact')

    class Meta:
        model = Doctor
        fields = {
            'specialties': ['exact'],
            'affiliations__location': ['exact'],
            'affiliations__location__city': ['exact'],
            'affiliations__location__area': ['exact'],
            'affiliations__location__district': ['exact'],
            'affiliations__location__division': ['exact'],
            'affiliations__schedules__day_of_week': ['exact'],
            'affiliations__fee': ['lte'],
        }



class DoctorViewSet(SlugOrPkLookupMixin, viewsets.ModelViewSet):
    queryset = Doctor.objects.all()
    serializer_class = DoctorSerializer
    permission_classes = (IsAdminUserOrReadOnly,)
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_class = DoctorFilter
    search_fields = ['name', 'qualification']

class DoctorAffiliationViewSet(viewsets.ModelViewSet):
    queryset = DoctorAffiliation.objects.all()
    serializer_class = DoctorAffiliationSerializer
    permission_classes = (IsAdminUserOrReadOnly,)

class AffiliationScheduleViewSet(viewsets.ModelViewSet):
    queryset = AffiliationSchedule.objects.all()
    serializer_class = AffiliationScheduleSerializer
    permission_classes = (IsAdminUserOrReadOnly,)
