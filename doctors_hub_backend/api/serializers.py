from rest_framework import serializers
from .models import (
    User, DoctorSpecialty, HospitalCategory, HospitalService, Hospital,
    TestCategory, Test, DiagnosticCenterCategory, DiagnosticService, DiagnosticCenter, DiagnosticCenterTest,
    Doctor, DoctorAffiliation, AffiliationSchedule, DoctorBooking, LabBooking
)
from django.contrib.auth import authenticate


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'phone_number', 'first_name', 'last_name', 'is_staff', 'is_superuser')


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'phone_number', 'first_name', 'last_name', 'is_staff', 'is_superuser')

    def validate_phone_number(self, value):
        user = self.instance
        if User.objects.filter(phone_number=value).exclude(pk=user.pk if user else None).exists():
            raise serializers.ValidationError("A user with this phone number already exists.")
        return value


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('phone_number', 'password', 'first_name', 'last_name')

    def create(self, validated_data):
        user = User.objects.create_user(
            phone_number=validated_data['phone_number'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )
        return user


class LoginSerializer(serializers.Serializer):
    phone_number = serializers.CharField()
    password = serializers.CharField()

    def validate(self, data):
        user = authenticate(phone_number=data.get('phone_number'), password=data.get('password'))
        if user and user.is_active:
            return user
        raise serializers.ValidationError("Incorrect Credentials")


class DoctorSpecialtySerializer(serializers.ModelSerializer):
    class Meta:
        model = DoctorSpecialty
        fields = '__all__'


SpecialtySerializer = DoctorSpecialtySerializer


class HospitalCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = HospitalCategory
        fields = '__all__'


HospitalSpecialtySerializer = HospitalCategorySerializer


class HospitalServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = HospitalService
        fields = '__all__'


class DiagnosticServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = DiagnosticService
        fields = '__all__'


class TestCategorySerializer(serializers.ModelSerializer):
    parent_name = serializers.CharField(source='parent.name', read_only=True, default='')
    is_leaf_level = serializers.BooleanField(read_only=True)

    class Meta:
        model = TestCategory
        fields = '__all__'


class TestSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_slug = serializers.CharField(source='category.slug', read_only=True)

    class Meta:
        model = Test
        fields = '__all__'


PathologyTestSerializer = TestSerializer


class DiagnosticCenterCategorySerializer(serializers.ModelSerializer):
    parent_name = serializers.CharField(source='parent.name', read_only=True, default='')

    class Meta:
        model = DiagnosticCenterCategory
        fields = '__all__'


class DiagnosticCenterTestSerializer(serializers.ModelSerializer):
    test_details = TestSerializer(source='test', read_only=True)
    center_name = serializers.CharField(source='center.name', read_only=True)
    center_branch = serializers.CharField(source='center.branch', read_only=True, default='')
    center_district = serializers.CharField(source='center.district', read_only=True, default='')

    class Meta:
        model = DiagnosticCenterTest
        fields = '__all__'


BranchTestSerializer = DiagnosticCenterTestSerializer


class AffiliationScheduleSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(required=False)

    class Meta:
        model = AffiliationSchedule
        fields = '__all__'
        extra_kwargs = {
            'affiliation': {'required': False}
        }


class DoctorAffiliationSerializer(serializers.ModelSerializer):
    hospital_name = serializers.CharField(source='hospital.name', read_only=True, default='')
    hospital_branch = serializers.CharField(source='hospital.branch', read_only=True, default='')
    diagnostic_center_name = serializers.CharField(source='diagnostic_center.name', read_only=True, default='')
    diagnostic_center_branch = serializers.CharField(source='diagnostic_center.branch', read_only=True, default='')
    facility_name = serializers.SerializerMethodField()
    city = serializers.SerializerMethodField()
    schedules = AffiliationScheduleSerializer(many=True, required=False)
    doctor_name = serializers.CharField(source='doctor.name', read_only=True)

    class Meta:
        model = DoctorAffiliation
        fields = '__all__'
        extra_kwargs = {
            'doctor': {'required': False}
        }

    def get_facility_name(self, obj):
        if obj.hospital:
            b_str = f" - {obj.hospital.branch}" if obj.hospital.branch else ""
            return f"{obj.hospital.name}{b_str}"
        if obj.diagnostic_center:
            b_str = f" - {obj.diagnostic_center.branch}" if obj.diagnostic_center.branch else ""
            return f"{obj.diagnostic_center.name}{b_str}"
        return ''

    def get_city(self, obj):
        if obj.hospital:
            return obj.hospital.city or obj.hospital.district
        if obj.diagnostic_center:
            return obj.diagnostic_center.district
        return ''

    def create(self, validated_data):
        schedules_data = validated_data.pop('schedules', [])
        affiliation = DoctorAffiliation.objects.create(**validated_data)
        for sch in schedules_data:
            AffiliationSchedule.objects.create(affiliation=affiliation, **sch)
        return affiliation

    def update(self, instance, validated_data):
        schedules_data = validated_data.pop('schedules', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if schedules_data is not None:
            instance.schedules.all().delete()
            for sch in schedules_data:
                AffiliationSchedule.objects.create(affiliation=instance, **sch)
        return instance


class DoctorSerializer(serializers.ModelSerializer):
    specialties = DoctorSpecialtySerializer(many=True, read_only=True)
    specialty_ids = serializers.PrimaryKeyRelatedField(
        queryset=DoctorSpecialty.objects.all(), many=True, write_only=True, source='specialties', required=False
    )
    affiliations = DoctorAffiliationSerializer(many=True, required=False)

    class Meta:
        model = Doctor
        fields = '__all__'

    def create(self, validated_data):
        specialties_data = validated_data.pop('specialties', [])
        affiliations_data = validated_data.pop('affiliations', [])
        doctor = Doctor.objects.create(**validated_data)
        if specialties_data:
            doctor.specialties.set(specialties_data)
        for aff_data in affiliations_data:
            schedules_data = aff_data.pop('schedules', [])
            affiliation = DoctorAffiliation.objects.create(doctor=doctor, **aff_data)
            for sch in schedules_data:
                AffiliationSchedule.objects.create(affiliation=affiliation, **sch)
        return doctor

    def update(self, instance, validated_data):
        specialties_data = validated_data.pop('specialties', None)
        affiliations_data = validated_data.pop('affiliations', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if specialties_data is not None:
            instance.specialties.set(specialties_data)

        if affiliations_data is not None:
            instance.affiliations.all().delete()
            for aff_data in affiliations_data:
                schedules_data = aff_data.pop('schedules', [])
                affiliation = DoctorAffiliation.objects.create(doctor=instance, **aff_data)
                for sch in schedules_data:
                    AffiliationSchedule.objects.create(affiliation=affiliation, **sch)

        return instance


class HospitalSerializer(serializers.ModelSerializer):
    categories = HospitalCategorySerializer(many=True, read_only=True)
    category_ids = serializers.PrimaryKeyRelatedField(
        queryset=HospitalCategory.objects.all(), many=True, write_only=True, source='categories', required=False
    )
    services = HospitalServiceSerializer(many=True, read_only=True)
    service_ids = serializers.PrimaryKeyRelatedField(
        queryset=HospitalService.objects.all(), many=True, write_only=True, source='services', required=False
    )
    affiliated_doctors = DoctorAffiliationSerializer(many=True, read_only=True)

    class Meta:
        model = Hospital
        fields = '__all__'

    def create(self, validated_data):
        categories = validated_data.pop('categories', [])
        services = validated_data.pop('services', [])
        hospital = Hospital.objects.create(**validated_data)
        if categories:
            hospital.categories.set(categories)
        if services:
            hospital.services.set(services)
        return hospital

    def update(self, instance, validated_data):
        categories = validated_data.pop('categories', None)
        services = validated_data.pop('services', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if categories is not None:
            instance.categories.set(categories)
        if services is not None:
            instance.services.set(services)
        return instance


class DiagnosticCenterSerializer(serializers.ModelSerializer):
    categories = DiagnosticCenterCategorySerializer(many=True, read_only=True)
    category_ids = serializers.PrimaryKeyRelatedField(
        queryset=DiagnosticCenterCategory.objects.all(), many=True, write_only=True, source='categories', required=False
    )
    services = DiagnosticServiceSerializer(many=True, read_only=True)
    service_ids = serializers.PrimaryKeyRelatedField(
        queryset=DiagnosticService.objects.all(), many=True, write_only=True, source='services', required=False
    )
    offered_tests = DiagnosticCenterTestSerializer(many=True, read_only=True)
    affiliated_doctors = DoctorAffiliationSerializer(many=True, read_only=True)

    class Meta:
        model = DiagnosticCenter
        fields = '__all__'

    def create(self, validated_data):
        categories = validated_data.pop('categories', [])
        services = validated_data.pop('services', [])
        center = DiagnosticCenter.objects.create(**validated_data)
        if categories:
            center.categories.set(categories)
        if services:
            center.services.set(services)
        return center

    def update(self, instance, validated_data):
        categories = validated_data.pop('categories', None)
        services = validated_data.pop('services', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if categories is not None:
            instance.categories.set(categories)
        if services is not None:
            instance.services.set(services)
        return instance


BranchSerializer = DiagnosticCenterSerializer


class DoctorBookingSerializer(serializers.ModelSerializer):
    doctor_name = serializers.CharField(source='affiliation.doctor.name', read_only=True)
    facility_name = serializers.SerializerMethodField()
    consultation_type = serializers.CharField(source='affiliation.consultation_type', read_only=True)

    class Meta:
        model = DoctorBooking
        fields = '__all__'
        read_only_fields = ('user', 'created_at')

    def get_facility_name(self, obj):
        if obj.affiliation and obj.affiliation.hospital:
            b_str = f" - {obj.affiliation.hospital.branch}" if obj.affiliation.hospital.branch else ""
            return f"{obj.affiliation.hospital.name}{b_str}"
        if obj.affiliation and obj.affiliation.diagnostic_center:
            b_str = f" - {obj.affiliation.diagnostic_center.branch}" if obj.affiliation.diagnostic_center.branch else ""
            return f"{obj.affiliation.diagnostic_center.name}{b_str}"
        return ''


class LabBookingSerializer(serializers.ModelSerializer):
    test_name = serializers.CharField(source='center_test.test.name', read_only=True, default='')
    center_name = serializers.CharField(source='center_test.center.name', read_only=True, default='')
    center_branch = serializers.CharField(source='center_test.center.branch', read_only=True, default='')
    price = serializers.DecimalField(source='center_test.price', max_digits=10, decimal_places=2, read_only=True, default=0)

    class Meta:
        model = LabBooking
        fields = '__all__'
        read_only_fields = ('user', 'created_at')
