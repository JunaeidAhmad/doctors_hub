from rest_framework import viewsets
from .models import DoctorSpecialty, Doctor, DoctorAffiliation, AffiliationSchedule
from .serializers import DoctorSpecialtySerializer, DoctorSerializer, DoctorAffiliationSerializer, AffiliationScheduleSerializer
from core.permissions import IsAdminUserOrReadOnly

class DoctorSpecialtyViewSet(viewsets.ModelViewSet):
    queryset = DoctorSpecialty.objects.all()
    serializer_class = DoctorSpecialtySerializer
    permission_classes = (IsAdminUserOrReadOnly,)

SpecialtyViewSet = DoctorSpecialtyViewSet

class DoctorViewSet(viewsets.ModelViewSet):
    queryset = Doctor.objects.all()
    serializer_class = DoctorSerializer
    permission_classes = (IsAdminUserOrReadOnly,)

class DoctorAffiliationViewSet(viewsets.ModelViewSet):
    queryset = DoctorAffiliation.objects.all()
    serializer_class = DoctorAffiliationSerializer
    permission_classes = (IsAdminUserOrReadOnly,)

class AffiliationScheduleViewSet(viewsets.ModelViewSet):
    queryset = AffiliationSchedule.objects.all()
    serializer_class = AffiliationScheduleSerializer
    permission_classes = (IsAdminUserOrReadOnly,)
