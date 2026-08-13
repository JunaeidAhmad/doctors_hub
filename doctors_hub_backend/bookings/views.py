from rest_framework import viewsets, permissions
from .models import DoctorBooking, LabBooking
from .serializers import DoctorBookingSerializer, LabBookingSerializer

class DoctorBookingViewSet(viewsets.ModelViewSet):
    queryset = DoctorBooking.objects.all()
    serializer_class = DoctorBookingSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        qs = super().get_queryset()
        if self.request.user.is_staff:
            return qs.order_by('-created_at')
        return qs.filter(user=self.request.user).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class LabBookingViewSet(viewsets.ModelViewSet):
    queryset = LabBooking.objects.all()
    serializer_class = LabBookingSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        qs = super().get_queryset()
        if self.request.user.is_staff:
            return qs.order_by('-created_at')
        return qs.filter(user=self.request.user).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
