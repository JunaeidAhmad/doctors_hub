from rest_framework import viewsets, permissions, exceptions
from drf_spectacular.utils import extend_schema
from .models import DoctorBooking, LabBooking
from .serializers import DoctorBookingSerializer, LabBookingSerializer
from core.permissions import PublicCreateAdminManage


@extend_schema(tags=['Bookings'])
class DoctorBookingViewSet(viewsets.ModelViewSet):
    queryset = DoctorBooking.objects.all().select_related(
        'user',
        'affiliation__doctor',
        'affiliation__location'
    )
    serializer_class = DoctorBookingSerializer
    permission_classes = (PublicCreateAdminManage,)

    def get_queryset(self):
        user = self.request.user
        if not user or not user.is_authenticated:
            return DoctorBooking.objects.none()

        qs = DoctorBooking.objects.all().select_related(
            'user',
            'affiliation__doctor',
            'affiliation__location'
        )

        if getattr(user, "is_super_admin", False):
            return qs.order_by('-created_at')

        if getattr(user, "is_facility_admin", False):
            managed_ids = user.managed_location_ids
            return qs.filter(affiliation__location__in=managed_ids).order_by('-created_at')

        if getattr(user, "is_doctor_role", False):
            return qs.filter(affiliation__doctor__user=user).order_by('-created_at')

        return qs.none()

    def perform_create(self, serializer):
        if self.request.user and self.request.user.is_authenticated:
            serializer.save(user=self.request.user)
        else:
            serializer.save()


@extend_schema(tags=['Bookings'])
class LabBookingViewSet(viewsets.ModelViewSet):
    queryset = LabBooking.objects.all().select_related(
        'user',
        'facility_test__test',
        'facility_test__location'
    )
    serializer_class = LabBookingSerializer
    permission_classes = (PublicCreateAdminManage,)

    def get_queryset(self):
        user = self.request.user
        if not user or not user.is_authenticated:
            return LabBooking.objects.none()

        qs = LabBooking.objects.all().select_related(
            'user',
            'facility_test__test',
            'facility_test__location'
        )

        if getattr(user, "is_super_admin", False):
            return qs.order_by('-created_at')

        if getattr(user, "is_facility_admin", False):
            managed_ids = user.managed_location_ids
            return qs.filter(facility_test__location__in=managed_ids).order_by('-created_at')

        return qs.none()

    def perform_create(self, serializer):
        if self.request.user and self.request.user.is_authenticated:
            serializer.save(user=self.request.user)
        else:
            serializer.save()
