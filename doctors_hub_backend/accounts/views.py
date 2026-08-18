import uuid
from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.throttling import ScopedRateThrottle
from rest_framework_simplejwt.tokens import RefreshToken

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


class LoginAPIView(APIView):
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "login"
    permission_classes = (permissions.AllowAny,)

    def post(self, request, *args, **kwargs):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data
        refresh = RefreshToken.for_user(user)
        return Response({
            "user": UserSerializer(user).data,
            "refresh": str(refresh),
            "access": str(refresh.access_token),
        }, status=status.HTTP_200_OK)


class UserProfileAPIView(generics.RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_object(self):
        return self.request.user


class FacilityRegisterAPIView(APIView):
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "register"
    permission_classes = (permissions.AllowAny,)

    def post(self, request, *args, **kwargs):
        serializer = FacilityRegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = serializer.save()
        user = result["user"]
        location = result["location"]
        refresh = RefreshToken.for_user(user)

        return Response({
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
            "refresh": str(refresh),
            "access": str(refresh.access_token),
        }, status=status.HTTP_201_CREATED)


class DoctorRegisterAPIView(APIView):
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "register"
    permission_classes = (permissions.AllowAny,)

    def post(self, request, *args, **kwargs):
        serializer = DoctorRegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = serializer.save()
        user = result["user"]
        doctor = result["doctor"]
        refresh = RefreshToken.for_user(user)

        return Response({
            "status": "success",
            "message": "Doctor profile registered successfully. It will be live in public search once verified by Super Admin.",
            "user": UserSerializer(user).data,
            "doctor": {
                "id": str(doctor.id),
                "name": doctor.name,
                "bmdc_number": doctor.bmdc_number,
                "is_verified": doctor.is_verified
            },
            "refresh": str(refresh),
            "access": str(refresh.access_token),
        }, status=status.HTTP_201_CREATED)


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

    def post(self, request, entity_type, entity_id):
        action = request.data.get("action", "approve").lower()

        if entity_type in ["facility", "location", "diagnostic_center", "hospital"]:
            loc = get_object_or_404(Location, id=entity_id)
            if action == "approve":
                loc.is_verified = True
                loc.save()
                User.objects.filter(facility_memberships__location=loc).update(is_verified=True)
                return Response({"status": "success", "message": f"{loc.name} has been verified and is now live."})
            elif action == "reject":
                loc.is_active = False
                loc.save()
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
                return Response({"status": "success", "message": f"Dr. {doc.name} has been verified and is now live."})
            elif action == "reject":
                if doc.user:
                    doc.user.is_active = False
                    doc.user.save()
                return Response({"status": "success", "message": f"Dr. {doc.name} has been rejected."})
            return Response({"detail": "Invalid action. Choose 'approve' or 'reject'."}, status=status.HTTP_400_BAD_REQUEST)

        return Response({"detail": "Invalid entity_type. Choose 'facility' or 'doctor'."}, status=status.HTTP_400_BAD_REQUEST)


class PlatformAdminListCreateAPIView(APIView):
    permission_classes = (IsSuperAdmin,)

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

    def post(self, request):
        phone = request.data.get("phone_number", "").strip()
        pwd = request.data.get("password", "").strip()
        first_name = request.data.get("first_name", "").strip() or "Platform Admin"
        last_name = request.data.get("last_name", "").strip()

        if not phone or not pwd:
            return Response({"detail": "phone_number and password are required."}, status=status.HTTP_400_BAD_REQUEST)

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
