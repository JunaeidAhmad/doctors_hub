import uuid
from django.conf import settings
from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, status, serializers
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.throttling import ScopedRateThrottle
from rest_framework_simplejwt.tokens import RefreshToken
from django.core.cache import cache
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiTypes

from .models import User, Role
from .serializers import UserSerializer, UserProfileSerializer, LoginSerializer
from .serializers_onboarding import (
    FacilityRegistrationSerializer,
    DoctorRegistrationSerializer,
    StaffCreateSerializer
)
from facilities.models import Location, FacilityMembership
from doctors.models import Doctor
from core.permissions import IsSuperAdmin


# Refresh cookie helpers for cross-site cookie hardening
REFRESH_COOKIE_NAME = "refresh_token"


def _refresh_cookie_kwargs():
    """Cross-site cookie requires SameSite=None + Secure in production."""
    cross_site = not getattr(settings, 'DEBUG', True)
    return {
        "httponly": True,
        "secure": True if cross_site else False,
        "samesite": "None" if cross_site else "Lax",
        "path": "/",
    }


def set_refresh_cookie(response, refresh):
    response.set_cookie(
        key=REFRESH_COOKIE_NAME,
        value=str(refresh),
        max_age=7 * 24 * 60 * 60,
        **_refresh_cookie_kwargs(),
    )
    return response


# Schema Support Serializers
class LoginResponseSerializer(serializers.Serializer):
    user = UserSerializer()
    access = serializers.CharField()


class RegisteredLocationSummarySerializer(serializers.Serializer):
    id = serializers.UUIDField()
    name = serializers.CharField()
    branch = serializers.CharField(allow_blank=True)
    location_type = serializers.CharField()
    is_verified = serializers.BooleanField()


class FacilityRegisterResponseSerializer(serializers.Serializer):
    status = serializers.CharField()
    message = serializers.CharField()
    user = UserSerializer()
    location = RegisteredLocationSummarySerializer()
    access = serializers.CharField()


class RegisteredDoctorSummarySerializer(serializers.Serializer):
    id = serializers.UUIDField()
    name = serializers.CharField()
    bmdc_number = serializers.CharField()
    is_verified = serializers.BooleanField()


class DoctorRegisterResponseSerializer(serializers.Serializer):
    status = serializers.CharField()
    message = serializers.CharField()
    user = UserSerializer()
    doctor = RegisteredDoctorSummarySerializer()
    access = serializers.CharField()


class FacilityStaffMemberSerializer(serializers.Serializer):
    user_id = serializers.UUIDField()
    membership_id = serializers.UUIDField()
    phone_number = serializers.CharField()
    first_name = serializers.CharField()
    last_name = serializers.CharField(allow_blank=True)
    role = serializers.CharField()
    is_active = serializers.BooleanField()
    created_at = serializers.DateTimeField()


class FacilityStaffSummarySerializer(serializers.Serializer):
    user_id = serializers.UUIDField()
    membership_id = serializers.UUIDField()
    phone_number = serializers.CharField()
    first_name = serializers.CharField()
    last_name = serializers.CharField(allow_blank=True)
    role = serializers.CharField()


class FacilityStaffCreateResponseSerializer(serializers.Serializer):
    status = serializers.CharField()
    message = serializers.CharField()
    staff = FacilityStaffSummarySerializer()


class VerificationQueueResponseSerializer(serializers.Serializer):
    pending_facilities = serializers.ListField(child=serializers.DictField())
    pending_doctors = serializers.ListField(child=serializers.DictField())
    total_pending = serializers.IntegerField()


class VerificationActionRequestSerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=["approve", "reject"], default="approve")


class VerificationActionResponseSerializer(serializers.Serializer):
    status = serializers.CharField()
    message = serializers.CharField()


class PlatformAdminItemSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    phone_number = serializers.CharField()
    first_name = serializers.CharField()
    last_name = serializers.CharField(allow_blank=True)
    is_active = serializers.BooleanField()
    date_joined = serializers.DateTimeField()


class PlatformAdminCreateRequestSerializer(serializers.Serializer):
    phone_number = serializers.CharField()
    password = serializers.CharField()
    first_name = serializers.CharField(required=False, allow_blank=True)
    last_name = serializers.CharField(required=False, allow_blank=True)


class PlatformAdminCreateResponseSerializer(serializers.Serializer):
    status = serializers.CharField()
    message = serializers.CharField()
    user = UserSerializer()



class RefreshResponseSerializer(serializers.Serializer):
    access = serializers.CharField()


class LoginAPIView(APIView):
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "login"
    permission_classes = (permissions.AllowAny,)

    @extend_schema(
        tags=["Authentication & Profile"],
        summary="User login with credentials",
        description="Authenticates a user via phone number and password, returning JWT access and refresh tokens along with user profile metadata.",
        request=LoginSerializer,
        responses={
            200: LoginResponseSerializer,
            400: OpenApiTypes.OBJECT
        }
    )
    def post(self, request, *args, **kwargs):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data
        refresh = RefreshToken.for_user(user)
        response = Response({
            "user": UserSerializer(user).data,
            "access": str(refresh.access_token),
        }, status=status.HTTP_200_OK)
        return set_refresh_cookie(response, refresh)


class CookieTokenRefreshAPIView(APIView):
    permission_classes = (permissions.AllowAny,)

    @extend_schema(
        tags=["Authentication & Profile"],
        summary="Refresh JWT access token",
        description="Exchanges a valid refresh token (from body or httpOnly cookie) for a new access token.",
        responses={200: RefreshResponseSerializer}
    )
    def post(self, request, *args, **kwargs):
        refresh_token = request.data.get("refresh") or request.COOKIES.get(REFRESH_COOKIE_NAME)
        if not refresh_token:
            return Response({"detail": "Refresh token is required."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            refresh = RefreshToken(refresh_token)
            return Response({"access": str(refresh.access_token)}, status=status.HTTP_200_OK)
        except Exception:
            return Response({"detail": "Invalid or expired refresh token."}, status=status.HTTP_401_UNAUTHORIZED)


class LogoutAPIView(APIView):
    permission_classes = (permissions.AllowAny,)

    @extend_schema(
        tags=["Authentication & Profile"],
        summary="User logout",
        description="Clears authentication cookies and logs out the user.",
    )
    def post(self, request, *args, **kwargs):
        response = Response({"detail": "Successfully logged out."}, status=status.HTTP_200_OK)
        kwargs_cookie = _refresh_cookie_kwargs()
        response.delete_cookie(
            REFRESH_COOKIE_NAME,
            path=kwargs_cookie["path"],
            samesite=kwargs_cookie["samesite"],
        )
        return response


@extend_schema(
    tags=["Authentication & Profile"],
    summary="Retrieve or update authenticated user profile",
    description="Fetches current user details, role, and managed facility permissions, or updates profile fields (first name, last name)."
)
class UserProfileAPIView(generics.RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_object(self):
        return self.request.user


class FacilityRegisterAPIView(APIView):
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "register"
    permission_classes = (permissions.AllowAny,)

    @extend_schema(
        tags=["Authentication & Profile"],
        summary="Self-register a new facility admin and facility location",
        description="Public registration endpoint for new hospital or diagnostic facility admins. Creates user account and location pending Super Admin verification.",
        request=FacilityRegistrationSerializer,
        responses={
            201: FacilityRegisterResponseSerializer,
            400: OpenApiTypes.OBJECT
        }
    )
    def post(self, request, *args, **kwargs):
        serializer = FacilityRegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = serializer.save()
        user = result["user"]
        location = result["location"]
        refresh = RefreshToken.for_user(user)

        response = Response({
            "status": "success",
            "message": "Facility registered successfully. It will be live in public search once verified by Super Admin.",
            "user": UserSerializer(user).data,
            "location": {
                "id": str(location.id),
                "name": location.name,
                "branch": location.branch,
                "location_type": location.location_type,
                "is_verified": location.is_verified
            },
            "access": str(refresh.access_token),
        }, status=status.HTTP_201_CREATED)
        return set_refresh_cookie(response, refresh)


class DoctorRegisterAPIView(APIView):
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "register"
    permission_classes = (permissions.AllowAny,)

    @extend_schema(
        tags=["Authentication & Profile"],
        summary="Self-register a new doctor profile and user account",
        description="Public registration endpoint for medical doctors with BMDC number and specialties. Account remains unverified until reviewed by Super Admin.",
        request=DoctorRegistrationSerializer,
        responses={
            201: DoctorRegisterResponseSerializer,
            400: OpenApiTypes.OBJECT
        }
    )
    def post(self, request, *args, **kwargs):
        serializer = DoctorRegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = serializer.save()
        user = result["user"]
        doctor = result["doctor"]
        refresh = RefreshToken.for_user(user)

        response = Response({
            "status": "success",
            "message": "Doctor profile registered successfully. It will be live in public search once verified by Super Admin.",
            "user": UserSerializer(user).data,
            "doctor": {
                "id": str(doctor.id),
                "name": doctor.name,
                "bmdc_number": doctor.bmdc_number,
                "is_verified": doctor.is_verified
            },
            "access": str(refresh.access_token),
        }, status=status.HTTP_201_CREATED)
        return set_refresh_cookie(response, refresh)


class FacilityStaffListCreateAPIView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def _check_facility_admin_permission(self, user, location_id):
        if getattr(user, "is_super_admin", False):
            return True
        try:
            loc_uuid = uuid.UUID(str(location_id))
            return FacilityMembership.objects.filter(
                user=user, location_id=loc_uuid, role=FacilityMembership.MemberRole.ADMIN
            ).exists()
        except (ValueError, TypeError):
            return False

    @extend_schema(
        tags=["Admin & Staff Management"],
        summary="List staff members for a facility location",
        description="Returns all staff assigned to a specific facility location. Requires Facility Admin membership or Super Admin role.",
        parameters=[
            OpenApiParameter("location_id", OpenApiTypes.UUID, OpenApiParameter.PATH, description="UUID of the facility location")
        ],
        responses={
            200: FacilityStaffMemberSerializer(many=True),
            403: OpenApiTypes.OBJECT
        }
    )
    def get(self, request, location_id):
        if not self._check_facility_admin_permission(request.user, location_id):
            return Response({"detail": "You do not have permission to manage staff for this facility."}, status=status.HTTP_403_FORBIDDEN)

        memberships = FacilityMembership.objects.filter(
            location_id=location_id, role=FacilityMembership.MemberRole.STAFF
        ).select_related("user")

        staff_data = [
            {
                "user_id": str(m.user.id),
                "membership_id": str(m.id),
                "phone_number": m.user.phone_number,
                "first_name": m.user.first_name,
                "last_name": m.user.last_name,
                "role": m.role,
                "is_active": m.user.is_active,
                "created_at": m.created_at
            }
            for m in memberships
        ]
        return Response(staff_data, status=status.HTTP_200_OK)

    @extend_schema(
        tags=["Admin & Staff Management"],
        summary="Add a staff member to a facility location",
        description="Creates or assigns a user as staff to the specified facility location.",
        parameters=[
            OpenApiParameter("location_id", OpenApiTypes.UUID, OpenApiParameter.PATH, description="UUID of the facility location")
        ],
        request=StaffCreateSerializer,
        responses={
            201: FacilityStaffCreateResponseSerializer,
            400: OpenApiTypes.OBJECT,
            403: OpenApiTypes.OBJECT
        }
    )
    def post(self, request, location_id):
        if not self._check_facility_admin_permission(request.user, location_id):
            return Response({"detail": "You do not have permission to add staff to this facility."}, status=status.HTTP_403_FORBIDDEN)

        location = get_object_or_404(Location, id=location_id)
        serializer = StaffCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        phone = serializer.validated_data["phone_number"]
        password = serializer.validated_data["password"]
        first_name = serializer.validated_data["first_name"]
        last_name = serializer.validated_data.get("last_name", "")

        user = User.objects.filter(phone_number=phone).first()
        if user:
            if FacilityMembership.objects.filter(user=user, location=location).exists():
                return Response({"detail": "This staff member is already assigned to this facility."}, status=status.HTTP_400_BAD_REQUEST)
        else:
            user = User.objects.create(
                phone_number=phone,
                first_name=first_name,
                last_name=last_name,
                role=Role.STAFF,
                is_verified=True,
                is_active=True
            )
            user.set_password(password)
            user.save()

        membership = FacilityMembership.objects.create(
            user=user,
            location=location,
            role=FacilityMembership.MemberRole.STAFF
        )

        return Response({
            "status": "success",
            "message": f"Staff member {first_name} added to {location.name}.",
            "staff": {
                "user_id": str(user.id),
                "membership_id": str(membership.id),
                "phone_number": user.phone_number,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "role": membership.role
            }
        }, status=status.HTTP_201_CREATED)


class FacilityStaffDeleteAPIView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    @extend_schema(
        tags=["Admin & Staff Management"],
        summary="Remove a staff member from a facility location",
        description="Revokes staff membership of a user from the specified facility location.",
        parameters=[
            OpenApiParameter("location_id", OpenApiTypes.UUID, OpenApiParameter.PATH, description="UUID of the facility location"),
            OpenApiParameter("user_id", OpenApiTypes.UUID, OpenApiParameter.PATH, description="UUID of the user to remove")
        ],
        responses={
            204: None,
            403: OpenApiTypes.OBJECT,
            404: OpenApiTypes.OBJECT
        }
    )
    def delete(self, request, location_id, user_id):
        if not (request.user.is_super_admin or FacilityMembership.objects.filter(
            user=request.user, location_id=location_id, role=FacilityMembership.MemberRole.ADMIN
        ).exists()):
            return Response({"detail": "You do not have permission to remove staff from this facility."}, status=status.HTTP_403_FORBIDDEN)

        deleted_count, _ = FacilityMembership.objects.filter(
            location_id=location_id, user_id=user_id, role=FacilityMembership.MemberRole.STAFF
        ).delete()

        if deleted_count == 0:
            return Response({"detail": "Staff membership not found."}, status=status.HTTP_404_NOT_FOUND)

        return Response(status=status.HTTP_204_NO_CONTENT)


class VerificationQueueAPIView(APIView):
    permission_classes = (IsSuperAdmin,)

    @extend_schema(
        tags=["Admin & Staff Management"],
        summary="List pending facility and doctor verifications",
        description="Returns all self-registered facilities and doctors awaiting Super Admin verification.",
        responses={
            200: VerificationQueueResponseSerializer,
            403: OpenApiTypes.OBJECT
        }
    )
    def get(self, request):
        pending_locations = Location.objects.filter(is_verified=False).select_related(
            "hospital_detail", "diagnostic_center_detail"
        )
        pending_doctors = Doctor.objects.filter(is_verified=False).prefetch_related("specialties")

        facilities_data = [
            {
                "id": str(loc.id),
                "name": loc.name,
                "branch": loc.branch,
                "location_type": loc.location_type,
                "phone": loc.phone,
                "email": loc.email,
                "division": loc.division,
                "district": loc.district,
                "area": loc.area,
                "address_line": loc.address_line,
                "badge": loc.badge,
                "is_verified": loc.is_verified,
                "created_at": loc.created_at
            }
            for loc in pending_locations
        ]

        doctors_data = [
            {
                "id": str(doc.id),
                "name": doc.name,
                "bmdc_number": doc.bmdc_number,
                "qualification": doc.qualification,
                "experience": doc.experience,
                "phone": doc.user.phone_number if doc.user else "",
                "specialties": [s.name for s in doc.specialties.all()],
                "is_verified": doc.is_verified
            }
            for doc in pending_doctors
        ]

        return Response({
            "pending_facilities": facilities_data,
            "pending_doctors": doctors_data,
            "total_pending": len(facilities_data) + len(doctors_data)
        }, status=status.HTTP_200_OK)


class VerificationApproveRejectAPIView(APIView):
    permission_classes = (IsSuperAdmin,)

    @extend_schema(
        tags=["Admin & Staff Management"],
        summary="Approve or reject a pending facility or doctor verification",
        description="Allows Super Admin to approve (marking verified and live) or reject (deactivating) a pending registration.",
        parameters=[
            OpenApiParameter("entity_type", OpenApiTypes.STR, OpenApiParameter.PATH, description="Entity type: 'facility' or 'doctor'"),
            OpenApiParameter("entity_id", OpenApiTypes.UUID, OpenApiParameter.PATH, description="UUID of the facility location or doctor")
        ],
        request=VerificationActionRequestSerializer,
        responses={
            200: VerificationActionResponseSerializer,
            400: OpenApiTypes.OBJECT,
            403: OpenApiTypes.OBJECT,
            404: OpenApiTypes.OBJECT
        }
    )
    def post(self, request, entity_type, entity_id):
        action = request.data.get("action", "approve").lower()

        if entity_type in ["facility", "location", "diagnostic_center", "hospital"]:
            loc = get_object_or_404(Location, id=entity_id)
            if action == "approve":
                loc.is_verified = True
                loc.save()
                User.objects.filter(facility_memberships__location=loc).update(is_verified=True)
                cache.delete('search_metadata_global')
                return Response({"status": "success", "message": f"{loc.name} has been verified and is now live."})
            elif action == "reject":
                loc.is_active = False
                loc.save()
                cache.delete('search_metadata_global')
                return Response({"status": "success", "message": f"{loc.name} has been rejected."})
            return Response({"detail": "Invalid action. Choose 'approve' or 'reject'."}, status=status.HTTP_400_BAD_REQUEST)

        elif entity_type == "doctor":
            doc = get_object_or_404(Doctor, id=entity_id)
            if action == "approve":
                doc.is_verified = True
                doc.save()
                if doc.user:
                    doc.user.is_verified = True
                    doc.user.save()
                cache.delete('search_metadata_global')
                return Response({"status": "success", "message": f"Dr. {doc.name} has been verified and is now live."})
            elif action == "reject":
                if doc.user:
                    doc.user.is_active = False
                    doc.user.save()
                cache.delete('search_metadata_global')
                return Response({"status": "success", "message": f"Dr. {doc.name} has been rejected."})
            return Response({"detail": "Invalid action. Choose 'approve' or 'reject'."}, status=status.HTTP_400_BAD_REQUEST)

        return Response({"detail": "Invalid entity_type. Choose 'facility' or 'doctor'."}, status=status.HTTP_400_BAD_REQUEST)


class PlatformAdminListCreateAPIView(APIView):
    permission_classes = (IsSuperAdmin,)

    @extend_schema(
        tags=["Admin & Staff Management"],
        summary="List all Platform Super Admins",
        description="Returns a list of all users with the Super Admin role. Accessible only by Super Admins.",
        responses={
            200: PlatformAdminItemSerializer(many=True),
            403: OpenApiTypes.OBJECT
        }
    )
    def get(self, request):
        super_admins = User.objects.filter(role=Role.SUPER_ADMIN)
        data = [
            {
                "id": str(u.id),
                "phone_number": u.phone_number,
                "first_name": u.first_name,
                "last_name": u.last_name,
                "is_active": u.is_active,
                "date_joined": u.date_joined
            }
            for u in super_admins
        ]
        return Response(data, status=status.HTTP_200_OK)

    @extend_schema(
        tags=["Admin & Staff Management"],
        summary="Create or promote a Platform Super Admin",
        description="Creates a new super admin user or promotes an existing user account to Super Admin.",
        request=PlatformAdminCreateRequestSerializer,
        responses={
            201: PlatformAdminCreateResponseSerializer,
            400: OpenApiTypes.OBJECT,
            403: OpenApiTypes.OBJECT
        }
    )
    def post(self, request):
        phone = request.data.get("phone_number", "").strip()
        pwd = request.data.get("password", "").strip()
        first_name = request.data.get("first_name", "").strip() or "Platform Admin"
        last_name = request.data.get("last_name", "").strip()

        if not phone or not pwd:
            return Response({"detail": "phone_number and password are required."}, status=status.HTTP_400_BAD_REQUEST)

        from core.validators import bangladesh_phone_validator
        from django.core.exceptions import ValidationError as DjangoValidationError
        try:
            bangladesh_phone_validator(phone)
        except DjangoValidationError as e:
            return Response({"detail": e.message}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(phone_number=phone).exists():
            u = User.objects.get(phone_number=phone)
            u.role = Role.SUPER_ADMIN
            u.is_staff = True
            u.is_superuser = True
            u.is_verified = True
            u.set_password(pwd)
            u.save()
            msg = f"Existing user {phone} promoted to Platform Super Admin."
        else:
            u = User.objects.create_superuser(
                phone_number=phone,
                password=pwd,
                first_name=first_name,
                last_name=last_name
            )
            msg = f"New Platform Super Admin {phone} created successfully."

        return Response({
            "status": "success",
            "message": msg,
            "user": UserSerializer(u).data
        }, status=status.HTTP_201_CREATED)
