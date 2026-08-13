from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from core.mixins import SlugOrPkLookupMixin
from .models import DoctorSpecialty, Doctor, DoctorAffiliation, AffiliationSchedule
from .serializers import DoctorSpecialtySerializer, DoctorSerializer, DoctorAffiliationSerializer, AffiliationScheduleSerializer
from core.permissions import IsAdminUserOrReadOnly

class DoctorSpecialtyViewSet(viewsets.ModelViewSet):
    queryset = DoctorSpecialty.objects.all()
    serializer_class = DoctorSpecialtySerializer
    permission_classes = (IsAdminUserOrReadOnly,)

SpecialtyViewSet = DoctorSpecialtyViewSet

class DoctorViewSet(SlugOrPkLookupMixin, viewsets.ModelViewSet):
    queryset = Doctor.objects.all()
    serializer_class = DoctorSerializer
    permission_classes = (IsAdminUserOrReadOnly,)
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = {
        'specialties': ['exact'],
        'affiliations__location': ['exact'],
        'affiliations__location__area': ['exact'],
        'affiliations__schedules__day_of_week': ['exact'],
        'affiliations__fee': ['lte'],
    }
    search_fields = ['name', 'qualification']

class DoctorAffiliationViewSet(viewsets.ModelViewSet):
    queryset = DoctorAffiliation.objects.all()
    serializer_class = DoctorAffiliationSerializer
    permission_classes = (IsAdminUserOrReadOnly,)

class AffiliationScheduleViewSet(viewsets.ModelViewSet):
    queryset = AffiliationSchedule.objects.all()
    serializer_class = AffiliationScheduleSerializer
    permission_classes = (IsAdminUserOrReadOnly,)
