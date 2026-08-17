from rest_framework import serializers
from .models import DoctorSpecialty, Doctor, DoctorAffiliation, AffiliationSchedule
from facilities.models import Location
from facilities.serializers import LocationSerializer


class DoctorSpecialtySerializer(serializers.ModelSerializer):
    doctor_count = serializers.IntegerField(read_only=True, required=False)

    class Meta:
        model = DoctorSpecialty
        fields = ('id', 'name', 'slug', 'icon', 'description', 'doctor_count')


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
    district = serializers.CharField(source='location.district', read_only=True, default='')
    division = serializers.CharField(source='location.division', read_only=True, default='')
    area = serializers.CharField(source='location.area', read_only=True, default='')
    schedules = AffiliationScheduleSerializer(many=True, required=False)

    doctor_name = serializers.CharField(source='doctor.name', read_only=True, default='')
    qualification = serializers.CharField(source='doctor.qualification', read_only=True, default='')
    experience = serializers.CharField(source='doctor.experience', read_only=True, default='')
    specialties = DoctorSpecialtySerializer(source='doctor.specialties', many=True, read_only=True)
    location_details = LocationSerializer(source='location', read_only=True)
    location_id = serializers.PrimaryKeyRelatedField(
        queryset=Location.objects.all(), write_only=True, source='location', required=False
    )
    doctor = serializers.PrimaryKeyRelatedField(
        queryset=Doctor.objects.all(), required=False
    )

    class Meta:
        model = DoctorAffiliation
        fields = (
            'id', 'doctor', 'location_id', 'location_details', 'consultation_type', 'fee',
            'facility_name', 'district', 'division', 'area', 'schedules', 'doctor_name', 'qualification', 'experience', 'specialties'
        )

    def to_internal_value(self, data):
        mutable_data = data.copy() if hasattr(data, 'copy') else dict(data)
        if 'location' in mutable_data and not mutable_data.get('location_id'):
            mutable_data['location_id'] = mutable_data['location']
        return super().to_internal_value(mutable_data)


class DoctorSerializer(serializers.ModelSerializer):
    specialties = DoctorSpecialtySerializer(many=True, read_only=True)
    specialty_ids = serializers.PrimaryKeyRelatedField(
        queryset=DoctorSpecialty.objects.all(), many=True, write_only=True, source='specialties', required=False
    )
    affiliations = DoctorAffiliationSerializer(many=True, required=False)

    class Meta:
        model = Doctor
        fields = ('id', 'name', 'slug', 'specialties', 'specialty_ids', 'qualification', 'experience', 'affiliations')
