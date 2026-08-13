from rest_framework import serializers
from .models import DoctorSpecialty, Doctor, DoctorAffiliation, AffiliationSchedule
from facilities.models import PracticeLocation
from facilities.serializers import PracticeLocationSerializer

class DoctorSpecialtySerializer(serializers.ModelSerializer):
    class Meta:
        model = DoctorSpecialty
        fields = ('id', 'name', 'slug', 'icon', 'description')

class AffiliationScheduleSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(required=False)

    class Meta:
        model = AffiliationSchedule
        fields = ('id', 'affiliation', 'day_of_week', 'start_time', 'end_time')
        extra_kwargs = {
            'affiliation': {'required': False}
        }

class DoctorAffiliationSerializer(serializers.ModelSerializer):
    facility_name = serializers.CharField(source='location.name', read_only=True, default='')
    city = serializers.CharField(source='location.address.city', read_only=True, default='')
    schedules = AffiliationScheduleSerializer(many=True, required=False)
    doctor_name = serializers.CharField(source='doctor.name', read_only=True, default='')
    qualification = serializers.CharField(source='doctor.qualification', read_only=True, default='')
    experience = serializers.CharField(source='doctor.experience', read_only=True, default='')
    specialties = DoctorSpecialtySerializer(source='doctor.specialties', many=True, read_only=True)
    location_details = PracticeLocationSerializer(source='location', read_only=True)
    location_id = serializers.PrimaryKeyRelatedField(
        queryset=PracticeLocation.objects.all(), write_only=True, source='location'
    )

    class Meta:
        model = DoctorAffiliation
        fields = (
            'id', 'doctor', 'location_id', 'location_details', 'consultation_type', 'fee',
            'facility_name', 'city', 'schedules', 'doctor_name', 'qualification', 'experience', 'specialties'
        )
        extra_kwargs = {
            'doctor': {'required': False}
        }

class DoctorSerializer(serializers.ModelSerializer):
    specialties = DoctorSpecialtySerializer(many=True, read_only=True)
    specialty_ids = serializers.PrimaryKeyRelatedField(
        queryset=DoctorSpecialty.objects.all(), many=True, write_only=True, source='specialties', required=False
    )
    affiliations = DoctorAffiliationSerializer(many=True, required=False)

    class Meta:
        model = Doctor
        fields = ('id', 'name', 'slug', 'specialties', 'specialty_ids', 'qualification', 'experience', 'affiliations')
