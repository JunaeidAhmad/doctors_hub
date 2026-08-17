import uuid
from rest_framework import permissions


def location_id_for(obj):
    """
    Extracts the Location UUID (as a string or UUID) from any domain model object.
    Supports Location, Hospital, DiagnosticCenter, Chamber, FacilityTest,
    DoctorAffiliation, AffiliationSchedule, DoctorBooking, LabBooking, FacilityMembership.
    """
    if obj is None:
        return None

    # If it's a Location object itself
    if hasattr(obj, "location_type") and hasattr(obj, "address_line"):
        return obj.id

    # If it has a direct location_id or location FK (e.g. Hospital, DiagnosticCenter, Chamber, FacilityTest, DoctorAffiliation, FacilityMembership)
    if hasattr(obj, "location_id") and obj.location_id:
        return obj.location_id
    if hasattr(obj, "location") and obj.location:
        return getattr(obj.location, "id", None)

    # AffiliationSchedule (via affiliation.location)
    if hasattr(obj, "affiliation") and obj.affiliation:
        return location_id_for(obj.affiliation)

    # DoctorBooking (via affiliation.location)
    if hasattr(obj, "affiliation_id") and obj.affiliation_id:
        if hasattr(obj, "affiliation") and obj.affiliation:
            return location_id_for(obj.affiliation)

    # LabBooking (via facility_test.location)
    if hasattr(obj, "facility_test_id") and obj.facility_test_id:
        if hasattr(obj, "facility_test") and obj.facility_test:
            return location_id_for(obj.facility_test)

    return None


def doctor_id_for(obj):
    """
    Extracts the Doctor UUID from any domain model object.
    Supports Doctor, DoctorAffiliation, AffiliationSchedule, DoctorBooking, Chamber.
    """
    if obj is None:
        return None

    # If it's a Doctor object itself
    if hasattr(obj, "qualification") and hasattr(obj, "specialties"):
        return obj.id

    # If it has a direct doctor_id or doctor FK (e.g. DoctorAffiliation, Chamber)
    if hasattr(obj, "doctor_id") and obj.doctor_id:
        return obj.doctor_id
    if hasattr(obj, "doctor") and obj.doctor:
        return getattr(obj.doctor, "id", None)

    # AffiliationSchedule / DoctorBooking (via affiliation.doctor)
    if hasattr(obj, "affiliation") and obj.affiliation:
        return doctor_id_for(obj.affiliation)

    return None


class RoleScopedQuerysetMixin:
    """
    ViewSet mixin that narrows querysets based on the authenticated user's role:
    - Super admins: full queryset.
    - Public catalog endpoints without ?scope=managed: full queryset (enforcement is handled via permission classes).
    - Private endpoints (always_scoped=True) or when ?scope=managed is set:
      - Facility admin: filtered to locations in managed_location_ids using `scope_location_field`.
      - Doctor: filtered to user's doctor profile using `scope_doctor_field`.
      - Non-privileged/Anonymous when private scope requested: qs.none().
    """
    scope_location_field = "location__in"
    scope_doctor_field = "doctor__user"
    always_scoped = False  # Set to True for private endpoints (e.g. bookings)

    def get_scoped_queryset(self, qs):
        user = self.request.user

        # 1. Super admin sees everything
        if user and user.is_authenticated and getattr(user, "is_super_admin", False):
            return qs

        # 2. Public catalog requests stay unscoped unless ?scope=managed or always_scoped is set
        is_managed_request = self.request.query_params.get("scope") == "managed"
        if not self.always_scoped and not is_managed_request:
            return qs

        # 3. Private / Managed Scoping
        if not user or not user.is_authenticated:
            return qs.none()

        if getattr(user, "is_facility_admin", False):
            managed_ids = user.managed_location_ids
            if not managed_ids:
                return qs.none()
            lookup = {self.scope_location_field: managed_ids}
            return qs.filter(**lookup).distinct()

        if getattr(user, "is_doctor_role", False):
            doctor_profile = getattr(user, "doctor_profile", None)
            if not doctor_profile:
                return qs.none()
            if self.scope_doctor_field in ("pk", "id"):
                return qs.filter(pk=doctor_profile.id)
            if self.scope_doctor_field.endswith("__user") or self.scope_doctor_field == "user":
                return qs.filter(**{self.scope_doctor_field: user})
            if self.scope_doctor_field.endswith("__doctor") or self.scope_doctor_field == "doctor":
                return qs.filter(**{self.scope_doctor_field: doctor_profile})
            lookup = {self.scope_doctor_field: doctor_profile.id}
            return qs.filter(**lookup).distinct()

        return qs.none()
