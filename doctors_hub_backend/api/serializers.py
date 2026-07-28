from rest_framework import serializers
from .models import (
    User, Hospital, Branch, Specialty, HospitalSpecialty, TestCategory, PathologyTest, BranchTest,
    Doctor, DoctorAffiliation, AffiliationSchedule,
    DoctorBooking, LabBooking
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

class SpecialtySerializer(serializers.ModelSerializer):
    class Meta:
        model = Specialty
        fields = '__all__'

DoctorSpecialtySerializer = SpecialtySerializer

class HospitalSpecialtySerializer(serializers.ModelSerializer):
    class Meta:
        model = HospitalSpecialty
        fields = '__all__'

class TestCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = TestCategory
        fields = '__all__'

class PathologyTestSerializer(serializers.ModelSerializer):
    class Meta:
        model = PathologyTest
        fields = '__all__'

class BranchTestSerializer(serializers.ModelSerializer):
    test_details = PathologyTestSerializer(source='test', read_only=True)
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    hospital_name = serializers.CharField(source='branch.hospital_name', read_only=True, default='')

    class Meta:
        model = BranchTest
        fields = '__all__'

class AffiliationScheduleSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(required=False)

    class Meta:
        model = AffiliationSchedule
        fields = '__all__'
        extra_kwargs = {
            'affiliation': {'required': False}
        }

class DoctorAffiliationSerializer(serializers.ModelSerializer):
    branch_id = serializers.CharField(source='branch.id', read_only=True)
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    hospital_name = serializers.CharField(source='branch.hospital_name', read_only=True, default='')
    city = serializers.CharField(source='branch.city', read_only=True)
    schedules = AffiliationScheduleSerializer(many=True, required=False)
    doctor_name = serializers.CharField(source='doctor.name', read_only=True)

    class Meta:
        model = DoctorAffiliation
        fields = '__all__'
        extra_kwargs = {
            'doctor': {'required': False}
        }

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
    specialties = SpecialtySerializer(many=True, read_only=True)
    specialty_ids = serializers.PrimaryKeyRelatedField(
        queryset=Specialty.objects.all(), many=True, write_only=True, source='specialties', required=False
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

class BranchSerializer(serializers.ModelSerializer):
    offered_tests = BranchTestSerializer(many=True, read_only=True)
    affiliated_doctors = DoctorAffiliationSerializer(many=True, read_only=True)

    class Meta:
        model = Branch
        fields = '__all__'

class HospitalSerializer(serializers.ModelSerializer):
    branches = BranchSerializer(many=True, read_only=True)

    class Meta:
        model = Hospital
        fields = '__all__'

class DoctorBookingSerializer(serializers.ModelSerializer):
    doctor_name = serializers.CharField(source='affiliation.doctor.name', read_only=True)
    branch_name = serializers.CharField(source='affiliation.branch.name', read_only=True)
    consultation_type = serializers.CharField(source='affiliation.consultation_type', read_only=True)

    class Meta:
        model = DoctorBooking
        fields = '__all__'
        read_only_fields = ('user', 'created_at')

class LabBookingSerializer(serializers.ModelSerializer):
    test_name = serializers.CharField(source='branch_test.test.name', read_only=True)
    branch_name = serializers.CharField(source='branch_test.branch.name', read_only=True)
    price = serializers.DecimalField(source='branch_test.price', max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = LabBooking
        fields = '__all__'
        read_only_fields = ('user', 'created_at')
