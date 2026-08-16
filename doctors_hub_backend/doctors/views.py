from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
import django_filters
from core.mixins import SlugOrPkLookupMixin
from .models import DoctorSpecialty, Doctor, DoctorAffiliation, AffiliationSchedule
from .serializers import DoctorSpecialtySerializer, DoctorSerializer, DoctorAffiliationSerializer, AffiliationScheduleSerializer
from core.permissions import IsAdminUserOrReadOnly

class DoctorSpecialtyViewSet(viewsets.ModelViewSet):
    queryset = DoctorSpecialty.objects.all().order_by('name')
    serializer_class = DoctorSpecialtySerializer
    permission_classes = (IsAdminUserOrReadOnly,)

class DoctorFilter(django_filters.FilterSet):
    specialty = django_filters.CharFilter(method='filter_specialty')
    specialties = django_filters.ModelMultipleChoiceFilter(queryset=DoctorSpecialty.objects.all())
    city = django_filters.CharFilter(field_name='affiliations__location__city', lookup_expr='iexact')
    area = django_filters.CharFilter(field_name='affiliations__location__area', lookup_expr='iexact')
    district = django_filters.CharFilter(field_name='affiliations__location__district', lookup_expr='iexact')
    division = django_filters.CharFilter(field_name='affiliations__location__division', lookup_expr='iexact')
    location = django_filters.CharFilter(method='filter_location')
    fee_max = django_filters.NumberFilter(field_name='affiliations__fee', lookup_expr='lte')
    day = django_filters.CharFilter(field_name='affiliations__schedules__day_of_week', lookup_expr='icontains')
    consultation_type = django_filters.CharFilter(field_name='affiliations__consultation_type', lookup_expr='iexact')
    hospital = django_filters.UUIDFilter(field_name='affiliations__location')
    diagnostic_center = django_filters.UUIDFilter(field_name='affiliations__location')

    class Meta:
        model = Doctor
        fields = [
            'specialty', 'specialties', 'city', 'area', 'district', 'division',
            'location', 'fee_max', 'day', 'consultation_type', 'hospital', 'diagnostic_center'
        ]

    def filter_specialty(self, queryset, name, value):
        if not value or value.lower() == 'all':
            return queryset
        from django.db import models
        return queryset.filter(
            models.Q(specialties__name__icontains=value) |
            models.Q(specialties__slug__icontains=value) |
            models.Q(specialties__id__iexact=value if len(value) == 36 else '00000000-0000-0000-0000-000000000000')
        ).distinct()


    def filter_location(self, queryset, name, value):
        if not value or value == 'All Bangladesh':
            return queryset
        from django.db import models
        return queryset.filter(
            models.Q(affiliations__location__city__iexact=value) |
            models.Q(affiliations__location__district__iexact=value) |
            models.Q(affiliations__location__division__iexact=value) |
            models.Q(affiliations__location__area__iexact=value)
        ).distinct()


class DoctorViewSet(SlugOrPkLookupMixin, viewsets.ModelViewSet):
    queryset = Doctor.objects.all().prefetch_related(
        'specialties',
        'affiliations__location',
        'affiliations__schedules',
        'affiliations__doctor__specialties'
    ).order_by('name').distinct()
    serializer_class = DoctorSerializer
    permission_classes = (IsAdminUserOrReadOnly,)
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_class = DoctorFilter
    search_fields = ['name', 'qualification', 'specialties__name', 'affiliations__location__name']

class DoctorAffiliationViewSet(viewsets.ModelViewSet):
    queryset = DoctorAffiliation.objects.all().select_related(
        'doctor',
        'location'
    ).prefetch_related(
        'schedules',
        'doctor__specialties'
    ).order_by('id')
    serializer_class = DoctorAffiliationSerializer
    permission_classes = (IsAdminUserOrReadOnly,)

class AffiliationScheduleViewSet(viewsets.ModelViewSet):
    queryset = AffiliationSchedule.objects.all().select_related(
        'affiliation__doctor',
        'affiliation__location'
    ).order_by('id')
    serializer_class = AffiliationScheduleSerializer
    permission_classes = (IsAdminUserOrReadOnly,)

