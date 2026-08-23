import uuid
from rest_framework import permissions
from .scoping import location_id_for, doctor_id_for


class IsSuperAdmin(permissions.BasePermission):
    """
    Allows access only to Platform Super Admins (role="super_admin" or is_superuser=True).
    """
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            getattr(request.user, "is_super_admin", False)
        )


class IsSuperAdminOrReadOnly(permissions.BasePermission):
    """
    Public read for anyone (SAFE_METHODS), write only for Super Admins.
    Used for global taxonomy/categories (DoctorSpecialty, HospitalCategory, TestCategory, Base Tests, Services).
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return bool(
            request.user and
            request.user.is_authenticated and
            getattr(request.user, "is_super_admin", False)
        )


class ScopedFacilityOrReadOnly(permissions.BasePermission):
    """
    Public read for everyone;
    Writes allowed if:
    - Caller is Super Admin, OR
    - Caller is Facility Admin and object's Location is in their managed_location_ids, OR
    - Caller is Doctor and object's Doctor is their doctor_profile.
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return bool(
            request.user and
            request.user.is_authenticated and (
                getattr(request.user, "is_super_admin", False) or
                getattr(request.user, "is_facility_admin", False) or
                getattr(request.user, "is_doctor_role", False)
            )
        )

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True

        user = request.user
        if not user or not user.is_authenticated:
            return False

        if getattr(user, "is_super_admin", False):
            return True

        if getattr(user, "is_facility_admin", False):
            loc_id = location_id_for(obj)
            if loc_id:
                try:
                    obj_loc_uuid = uuid.UUID(str(loc_id))
                    managed_uuids = [uuid.UUID(str(x)) for x in user.managed_location_ids]
                    if obj_loc_uuid in managed_uuids:
                        return True
                except (ValueError, TypeError):
                    pass

        if getattr(user, "is_doctor_role", False):
            doc_id = doctor_id_for(obj)
            doctor_profile = getattr(user, "doctor_profile", None)
            if doc_id and doctor_profile:
                try:
                    if uuid.UUID(str(doc_id)) == uuid.UUID(str(doctor_profile.id)):
                        return True
                except (ValueError, TypeError):
                    pass

        return False


class IsDoctorOwnerOrReadOnly(permissions.BasePermission):
    """
    Public read for everyone;
    Writes allowed if Super Admin or if caller is the Doctor whose doctor_profile matches the object.
    Facility admins can view but not edit core Doctor bio (affiliations are managed via ScopedFacilityOrReadOnly).
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return bool(
            request.user and
            request.user.is_authenticated and (
                getattr(request.user, "is_super_admin", False) or
                getattr(request.user, "is_doctor_role", False)
            )
        )

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True

        user = request.user
        if not user or not user.is_authenticated:
            return False

        if getattr(user, "is_super_admin", False):
            return True

        if getattr(user, "is_doctor_role", False):
            doc_id = doctor_id_for(obj)
            doctor_profile = getattr(user, "doctor_profile", None)
            if doc_id and doctor_profile:
                try:
                    if uuid.UUID(str(doc_id)) == uuid.UUID(str(doctor_profile.id)):
                        return True
                except (ValueError, TypeError):
                    pass

        return False


class PublicCreateAdminManage(permissions.BasePermission):
    """
    Allows public POST creation (for public bookings without accounts);
    All other actions require staff or authenticated role.
    """
    def has_permission(self, request, view):
        if request.method == "POST":
            return True
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        user = request.user
        if not user or not user.is_authenticated:
            return False

        if getattr(user, "is_super_admin", False):
            return True

        if getattr(user, "is_facility_admin", False):
            loc_id = location_id_for(obj)
            if loc_id:
                try:
                    obj_loc_uuid = uuid.UUID(str(loc_id))
                    managed_uuids = [uuid.UUID(str(x)) for x in user.managed_location_ids]
                    if obj_loc_uuid in managed_uuids:
                        return True
                except (ValueError, TypeError):
                    pass

        if getattr(user, "is_doctor_role", False):
            doc_id = doctor_id_for(obj)
            doctor_profile = getattr(user, "doctor_profile", None)
            if doc_id and doctor_profile:
                try:
                    if uuid.UUID(str(doc_id)) == uuid.UUID(str(doctor_profile.id)):
                        return True
                except (ValueError, TypeError):
                    pass

        return False


# Legacy alias for backward compatibility during phased cutover
IsAdminUserOrReadOnly = IsSuperAdminOrReadOnly


def check_location_write_permission(user, location=None, doctor=None, error_message="You do not have permission to perform this action."):
    from rest_framework import exceptions
    if not user or not user.is_authenticated:
        raise exceptions.NotAuthenticated()
    if getattr(user, "is_super_admin", False):
        return True

    loc_id = location.id if hasattr(location, 'id') else location
    is_loc_managed = False
    if loc_id and hasattr(user, 'managed_location_ids'):
        try:
            loc_uuid = uuid.UUID(str(loc_id))
            managed_uuids = [uuid.UUID(str(x)) for x in user.managed_location_ids]
            is_loc_managed = loc_uuid in managed_uuids
        except (ValueError, TypeError):
            pass

    is_doc_owned = False
    doc_id = doctor.id if hasattr(doctor, 'id') else doctor
    doctor_profile = getattr(user, "doctor_profile", None)
    if doc_id and doctor_profile:
        try:
            is_doc_owned = uuid.UUID(str(doc_id)) == uuid.UUID(str(doctor_profile.id))
        except (ValueError, TypeError):
            pass

    if is_loc_managed or is_doc_owned:
        return True

    raise exceptions.PermissionDenied(error_message)

