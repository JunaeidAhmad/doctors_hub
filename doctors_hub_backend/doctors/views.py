from rest_framework import viewsets, filters, exceptions
from django_filters.rest_framework import DjangoFilterBackend
import django_filters
from core.mixins import SlugOrPkLookupMixin
from core.permissions import IsDoctorOwnerOrReadOnly, ScopedFacilityOrReadOnly, IsSuperAdminOrReadOnly
from core.scoping import RoleScopedQuerysetMixin
from .models import DoctorSpecialty, Doctor, DoctorAffiliation, AffiliationSchedule
from .serializers import DoctorSpecialtySerializer, DoctorSerializer, DoctorAffiliationSerializer, AffiliationScheduleSerializer


class DoctorSpecialtyViewSet(viewsets.ModelViewSet):
    queryset = DoctorSpecialty.objects.all().order_by('name')
    serializer_class = DoctorSpecialtySerializer
    permission_classes = (IsSuperAdminOrReadOnly,)


class DoctorFilter(django_filters.FilterSet):
    specialty = django_filters.CharFilter(method='filter_specialty')
    specialties = django_filters.ModelMultipleChoiceFilter(queryset=DoctorSpecialty.objects.all())
    area = django_filters.CharFilter(field_name='affiliations__location__area', lookup_expr='iexact')
    district = django_filters.CharFilter(field_name='affiliations__location__district', lookup_expr='iexact')
    division = django_filters.CharFilter(field_name='affiliations__location__division', lookup_expr='iexact')
    location = django_filters.CharFilter(method='filter_location')
    fee_max = django_filters.NumberFilter(field_name='affiliations__fee', lookup_expr='lte')
    day = django_filters.CharFilter(field_name='affiliations__schedules__day_of_week', lookup_expr='icontains')
    hospital = django_filters.UUIDFilter(field_name='affiliations__location')
    diagnostic_center = django_filters.UUIDFilter(field_name='affiliations__location')

    class Meta:
        model = Doctor
        fields = [
            'specialty', 'specialties', 'area', 'district', 'division',
            'location', 'fee_max', 'day', 'hospital', 'diagnostic_center'
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
            models.Q(affiliations__location__district__iexact=value) |
            models.Q(affiliations__location__division__iexact=value) |
            models.Q(affiliations__location__area__iexact=value)
        ).distinct()


class DoctorViewSet(SlugOrPkLookupMixin, RoleScopedQuerysetMixin, viewsets.ModelViewSet):
    queryset = Doctor.objects.all().prefetch_related(
        'specialties',
        'affiliations__location',
        'affiliations__schedules',
        'affiliations__doctor__specialties'
    ).order_by('name').distinct()
    serializer_class = DoctorSerializer
    permission_classes = (IsDoctorOwnerOrReadOnly,)
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_class = DoctorFilter
    search_fields = ['name', 'qualification', 'specialties__name', 'affiliations__location__name']
    scope_doctor_field = "user"
    scope_location_field = "affiliations__location__in"

    def get_queryset(self):
        qs = Doctor.objects.all().prefetch_related(
            'specialties',
            'affiliations__location',
            'affiliations__schedules',
            'affiliations__doctor__specialties'
        ).order_by('name').distinct()
        return self.get_scoped_queryset(qs)

    def perform_create(self, serializer):
        user = self.request.user
        if not user or not user.is_authenticated:
            raise exceptions.NotAuthenticated()

        if getattr(user, "is_super_admin", False):
            serializer.save()
        elif getattr(user, "is_doctor_role", False):
            # Check if doctor already has a profile
            if hasattr(user, "doctor_profile") and user.doctor_profile:
                raise exceptions.ValidationError("You already have a doctor profile.")
            serializer.save(user=user)
        elif getattr(user, "is_facility_admin", False):
            affs = self.request.data.get("affiliations") or []
            loc_ids = {str(a.get("location_id") or a.get("location")) for a in affs if a.get("location_id") or a.get("location")}
            managed_ids = set(map(str, getattr(user, "managed_location_ids", [])))
            if loc_ids and not loc_ids.issubset(managed_ids):
                raise exceptions.PermissionDenied("You can only onboard doctors into facilities you manage.")
            serializer.save()
        else:
            raise exceptions.PermissionDenied("Only super admins, facility admins, and doctors can create doctor profiles.")


class DoctorAffiliationViewSet(RoleScopedQuerysetMixin, viewsets.ModelViewSet):
    queryset = DoctorAffiliation.objects.all().select_related(
        'doctor',
        'location'
    ).prefetch_related(
        'schedules',
        'doctor__specialties'
    ).order_by('id')
    serializer_class = DoctorAffiliationSerializer
    permission_classes = (ScopedFacilityOrReadOnly,)
    scope_location_field = "location_id__in"
    scope_doctor_field = "doctor__user"

    def get_queryset(self):
        qs = DoctorAffiliation.objects.all().select_related(
            'doctor',
            'location'
        ).prefetch_related(
            'schedules',
            'doctor__specialties'
        ).order_by('id')
        return self.get_scoped_queryset(qs)

    def perform_create(self, serializer):
        user = self.request.user
        if not user or not user.is_authenticated:
            raise exceptions.NotAuthenticated()

        if getattr(user, "is_super_admin", False):
            serializer.save()
            return

        loc = serializer.validated_data.get("location")
        doc = serializer.validated_data.get("doctor")

        if getattr(user, "is_facility_admin", False):
            loc_id = loc.id if loc else None
            if not loc_id or loc_id not in user.managed_location_ids:
                raise exceptions.PermissionDenied("You can only create affiliations for locations you manage.")
            serializer.save()
            return

        if getattr(user, "is_doctor_role", False):
            doctor_profile = getattr(user, "doctor_profile", None)
            if not doctor_profile or (doc and doc.id != doctor_profile.id):
                raise exceptions.PermissionDenied("You can only create affiliations for your own doctor profile.")
            serializer.save(doctor=doctor_profile)
            return

        raise exceptions.PermissionDenied("You do not have permission to create doctor affiliations.")


class AffiliationScheduleViewSet(RoleScopedQuerysetMixin, viewsets.ModelViewSet):
    queryset = AffiliationSchedule.objects.all().select_related(
        'affiliation__doctor',
        'affiliation__location'
    ).order_by('id')
    serializer_class = AffiliationScheduleSerializer
    permission_classes = (ScopedFacilityOrReadOnly,)
    scope_location_field = "affiliation__location_id__in"
    scope_doctor_field = "affiliation__doctor__user"

    def get_queryset(self):
        qs = AffiliationSchedule.objects.all().select_related(
            'affiliation__doctor',
            'affiliation__location'
        ).order_by('id')
        return self.get_scoped_queryset(qs)

    def perform_create(self, serializer):
        user = self.request.user
        if not user or not user.is_authenticated:
            raise exceptions.NotAuthenticated()

        if getattr(user, "is_super_admin", False):
            serializer.save()
            return

        aff = serializer.validated_data.get("affiliation")
        if not aff:
            raise exceptions.ValidationError("Affiliation is required.")

        if getattr(user, "is_facility_admin", False):
            if aff.location_id not in user.managed_location_ids:
                raise exceptions.PermissionDenied("You can only create schedules for locations you manage.")
            serializer.save()
            return

        if getattr(user, "is_doctor_role", False):
            doctor_profile = getattr(user, "doctor_profile", None)
            if not doctor_profile or aff.doctor_id != doctor_profile.id:
                raise exceptions.PermissionDenied("You can only create schedules for your own affiliations.")
            serializer.save()
            return

        raise exceptions.PermissionDenied("You do not have permission to create affiliation schedules.")
