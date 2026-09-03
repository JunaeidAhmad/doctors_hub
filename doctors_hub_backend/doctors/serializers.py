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
    affiliation_id = serializers.PrimaryKeyRelatedField(
        queryset=DoctorAffiliation.objects.all(), write_only=True, source='affiliation', required=False
    )
    affiliation = serializers.PrimaryKeyRelatedField(
        queryset=DoctorAffiliation.objects.all(), required=False
    )

    class Meta:
        model = AffiliationSchedule
        fields = ('id', 'affiliation', 'affiliation_id', 'day_of_week', 'start_time', 'end_time')
        extra_kwargs = {
            'affiliation': {'required': False}
        }

    def to_internal_value(self, data):
        mutable_data = data.copy() if hasattr(data, 'copy') else dict(data)
        if 'affiliation_id' in mutable_data and not mutable_data.get('affiliation'):
            mutable_data['affiliation'] = mutable_data['affiliation_id']
        return super().to_internal_value(mutable_data)

    def validate(self, attrs):
        start_time = attrs.get('start_time') or (self.instance.start_time if self.instance else None)
        end_time = attrs.get('end_time') or (self.instance.end_time if self.instance else None)
        day_of_week = attrs.get('day_of_week') or (self.instance.day_of_week if self.instance else None)
        affiliation = attrs.get('affiliation') or (self.instance.affiliation if self.instance else None)

        if start_time and end_time and start_time >= end_time:
            raise serializers.ValidationError({
                "end_time": "End time must be after start time."
            })

        if affiliation and day_of_week and start_time and end_time:
            doctor = affiliation.doctor
            conflict_qs = AffiliationSchedule.objects.filter(
                affiliation__doctor=doctor,
                day_of_week=day_of_week,
                start_time__lt=end_time,
                end_time__gt=start_time
            )
            if self.instance and self.instance.pk:
                conflict_qs = conflict_qs.exclude(pk=self.instance.pk)

            conflict = conflict_qs.select_related('affiliation__location').first()
            if conflict:
                loc_name = (
                    conflict.affiliation.location.name
                    if conflict.affiliation and conflict.affiliation.location
                    else "another location"
                )
                start_str = conflict.start_time.strftime('%H:%M')
                end_str = conflict.end_time.strftime('%H:%M')
                raise serializers.ValidationError(
                    f"Schedule conflict on {day_of_week}: Doctor already has a visiting slot ({start_str} - {end_str}) at {loc_name}."
                )

        return attrs


class DoctorAffiliationSerializer(serializers.ModelSerializer):
    facility_name = serializers.CharField(source='location.name', read_only=True, default='')
    district = serializers.CharField(source='location.district', read_only=True, default='')
    division = serializers.CharField(source='location.division', read_only=True, default='')
    area = serializers.CharField(source='location.area', read_only=True, default='')
    schedules = AffiliationScheduleSerializer(many=True, required=False)

    doctor_name = serializers.CharField(source='doctor.name', read_only=True, default='')
    academic_title = serializers.CharField(source='doctor.academic_title', read_only=True, default='')
    institution = serializers.CharField(source='doctor.institution', read_only=True, default='')
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
            'id', 'doctor', 'location_id', 'location_details', 'fee',
            'facility_name', 'district', 'division', 'area', 'schedules',
            'doctor_name', 'academic_title', 'institution', 'qualification', 'experience', 'specialties'
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
        fields = (
            'id', 'name', 'slug', 'academic_title', 'institution',
            'specialties', 'specialty_ids', 'qualification', 'experience',
            'description', 'bmdc_number', 'is_verified', 'affiliations'
        )

    def create(self, validated_data):
        affiliations_data = validated_data.pop('affiliations', None)
        specialties_data = validated_data.pop('specialties', None)
        doctor = Doctor.objects.create(**validated_data)
        if specialties_data is not None:
            doctor.specialties.set(specialties_data)
        if affiliations_data:
            for aff_data in affiliations_data:
                schedules_data = aff_data.pop('schedules', [])
                aff = DoctorAffiliation.objects.create(doctor=doctor, **aff_data)
                for sched_data in schedules_data:
                    AffiliationSchedule.objects.create(affiliation=aff, **sched_data)
        return doctor

    def update(self, instance, validated_data):
        validated_data.pop('affiliations', None)
        specialties_data = validated_data.pop('specialties', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if specialties_data is not None:
            instance.specialties.set(specialties_data)
        return instance
