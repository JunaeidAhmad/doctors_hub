import uuid
from django.db import transaction
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers
from accounts.models import User, Role
from facilities.models import Location, Hospital, DiagnosticCenter, HospitalCategory, DiagnosticCenterCategory, FacilityMembership
from doctors.models import Doctor, DoctorSpecialty
from core.validators import bangladesh_phone_validator


class FacilityRegistrationSerializer(serializers.Serializer):
    facility_type = serializers.ChoiceField(choices=["diagnostic_center", "hospital"])
    name = serializers.CharField(max_length=250)
    branch = serializers.CharField(max_length=200, required=False, allow_blank=True, default="")
    license_number = serializers.CharField(max_length=100, required=False, allow_blank=True, default="")
    division = serializers.CharField(max_length=100)
    district = serializers.CharField(max_length=100)
    area = serializers.CharField(max_length=100, required=False, allow_blank=True, default="")
    address_line = serializers.CharField(max_length=300)
    category_id = serializers.CharField(required=False, allow_blank=True, allow_null=True, default=None)
    phone_number = serializers.CharField(max_length=20)
    password = serializers.CharField(write_only=True, min_length=6)
    first_name = serializers.CharField(max_length=50, required=False, allow_blank=True, default="")
    last_name = serializers.CharField(max_length=50, required=False, allow_blank=True, default="")
    email = serializers.EmailField(required=False, allow_blank=True, default="")

    def validate_phone_number(self, value):
        phone = value.strip()
        try:
            bangladesh_phone_validator(phone)
        except DjangoValidationError as e:
            raise serializers.ValidationError(e.message)
        if User.objects.filter(phone_number=phone).exists():
            raise serializers.ValidationError("A user with this phone number already exists.")
        return phone

    @transaction.atomic
    def create(self, validated_data):
        phone = validated_data["phone_number"]
        password = validated_data["password"]
        fac_type = validated_data["facility_type"]
        name = validated_data["name"]
        branch = validated_data.get("branch", "")
        license_no = validated_data.get("license_number", "")
        division = validated_data["division"]
        district = validated_data["district"]
        area = validated_data.get("area", "")
        address = validated_data["address_line"]
        category_id = validated_data.get("category_id")
        first_name = validated_data.get("first_name", "") or name
        last_name = validated_data.get("last_name", "")
        email = validated_data.get("email", "")

        # 1. Create User
        user = User.objects.create(
            phone_number=phone,
            first_name=first_name,
            last_name=last_name,
            role=Role.FACILITY_ADMIN,
            is_verified=False,
            is_active=True
        )
        user.set_password(password)
        user.save()

        # 2. Create Location
        location = Location.objects.create(
            name=name,
            branch=branch,
            location_type=fac_type,
            division=division,
            district=district,
            area=area,
            address_line=address,
            phone=phone,
            email=email,
            badge=license_no or "Registered Partner",
            is_verified=False,
            is_active=True
        )

        # 3. Create detail entity
        if fac_type == "hospital":
            cat_obj = None
            if category_id:
                try:
                    cat_obj = HospitalCategory.objects.filter(id=category_id).first()
                except (ValueError, TypeError):
                    cat_obj = HospitalCategory.objects.filter(slug=category_id).first()
            Hospital.objects.create(location=location, category=cat_obj)
        else:
            cat_obj = None
            if category_id:
                try:
                    cat_obj = DiagnosticCenterCategory.objects.filter(id=category_id).first()
                except (ValueError, TypeError):
                    cat_obj = DiagnosticCenterCategory.objects.filter(slug=category_id).first()
            DiagnosticCenter.objects.create(location=location, category=cat_obj)

        # 4. Create FacilityMembership
        FacilityMembership.objects.create(
            user=user,
            location=location,
            role=FacilityMembership.MemberRole.ADMIN
        )

        return {
            "user": user,
            "location": location
        }


class DoctorRegistrationSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=200)
    phone_number = serializers.CharField(max_length=20)
    password = serializers.CharField(write_only=True, min_length=6)
    bmdc_number = serializers.CharField(max_length=50)
    qualification = serializers.CharField(max_length=500)
    experience = serializers.CharField(max_length=50, required=False, allow_blank=True, default="5+ years")
    specialty_ids = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        default=list
    )
    email = serializers.EmailField(required=False, allow_blank=True, default="")

    def validate_phone_number(self, value):
        phone = value.strip()
        try:
            bangladesh_phone_validator(phone)
        except DjangoValidationError as e:
            raise serializers.ValidationError(e.message)
        if User.objects.filter(phone_number=phone).exists():
            raise serializers.ValidationError("A user with this phone number already exists.")
        return phone

    def validate_bmdc_number(self, value):
        bmdc = value.strip()
        if Doctor.objects.filter(bmdc_number=bmdc).exists():
            raise serializers.ValidationError("A doctor with this BMDC number is already registered.")
        return bmdc

    @transaction.atomic
    def create(self, validated_data):
        phone = validated_data["phone_number"]
        password = validated_data["password"]
        name = validated_data["name"]
        bmdc = validated_data["bmdc_number"]
        qualification = validated_data["qualification"]
        experience = validated_data.get("experience", "5+ years") or "5+ years"
        specialty_ids = validated_data.get("specialty_ids", [])

        # 1. Create User
        user = User.objects.create(
            phone_number=phone,
            first_name=name,
            role=Role.DOCTOR,
            is_verified=False,
            is_active=True
        )
        user.set_password(password)
        user.save()

        # 2. Create Doctor
        doctor = Doctor.objects.create(
            user=user,
            name=name,
            bmdc_number=bmdc,
            qualification=qualification,
            experience=experience,
            is_verified=False
        )

        # 3. Associate Specialties
        if specialty_ids:
            specs = []
            for s_id in specialty_ids:
                try:
                    s = DoctorSpecialty.objects.filter(id=s_id).first()
                except (ValueError, TypeError):
                    s = DoctorSpecialty.objects.filter(slug=s_id).first() or DoctorSpecialty.objects.filter(name=s_id).first()
                if s:
                    specs.append(s)
            if specs:
                doctor.specialties.set(specs)

        return {
            "user": user,
            "doctor": doctor
        }


class StaffCreateSerializer(serializers.Serializer):
    phone_number = serializers.CharField(max_length=20)
    password = serializers.CharField(write_only=True, min_length=6)
    first_name = serializers.CharField(max_length=50)
    last_name = serializers.CharField(max_length=50, required=False, allow_blank=True, default="")
    role_title = serializers.CharField(max_length=50, required=False, default="Staff")

    def validate_phone_number(self, value):
        phone = value.strip()
        try:
            bangladesh_phone_validator(phone)
        except DjangoValidationError as e:
            raise serializers.ValidationError(e.message)
        return phone
