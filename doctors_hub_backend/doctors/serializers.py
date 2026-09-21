from rest_framework import serializers
from .models import DoctorSpecialty, SpecialtyAlias, Doctor, DoctorAffiliation, AffiliationSchedule
from facilities.models import Location
from facilities.serializers import LocationSerializer


class DoctorSpecialtySerializer(serializers.ModelSerializer):
    doctor_count = serializers.IntegerField(read_only=True, required=False)
    alias_count = serializers.IntegerField(read_only=True, required=False)
    components = serializers.SerializerMethodField(read_only=True)
    component_ids = serializers.ListField(
        child=serializers.UUIDField(), write_only=True, required=False
    )

    class Meta:
        model = DoctorSpecialty
        fields = (
            'id', 'name', 'canonical_name', 'bn_name', 'slug',
            'icon', 'description', 'doctor_count', 'alias_count', 'components', 'component_ids'
        )

    def get_components(self, obj):
        return [
            {"id": str(c.id), "name": c.name, "canonical_name": c.canonical_name, "slug": c.slug}
            for c in obj.components.all()
        ]

    def create(self, validated_data):
        component_ids = validated_data.pop('component_ids', None)
        from doctors.services.specialty_resolver import resolve_or_create_specialty
        raw_name = validated_data.get('name', '')
        specialty = resolve_or_create_specialty(raw_name, is_verified=True)
        updated = False
        for field in ('canonical_name', 'bn_name', 'icon', 'description'):
            if field in validated_data and validated_data[field]:
                setattr(specialty, field, validated_data[field])
                updated = True
        if updated:
            specialty.save()
        if component_ids is not None:
            specialty.components.set(component_ids)
        return specialty

    def update(self, instance, validated_data):
        component_ids = validated_data.pop('component_ids', None)
        for attr, val in validated_data.items():
            setattr(instance, attr, val)
        instance.save()
        if component_ids is not None:
            instance.components.set(component_ids)
        return instance


class SpecialtyAliasSerializer(serializers.ModelSerializer):
    specialty_name = serializers.CharField(source='specialty.name', read_only=True)
    specialty_canonical = serializers.CharField(source='specialty.canonical_name', read_only=True)
    specialty_bn = serializers.CharField(source='specialty.bn_name', read_only=True)
    specialty = serializers.PrimaryKeyRelatedField(
        queryset=DoctorSpecialty.objects.all()
    )

    class Meta:
        model = SpecialtyAlias
        fields = (
            'id', 'specialty', 'specialty_name', 'specialty_canonical', 'specialty_bn',
            'name', 'normalized', 'language', 'is_verified', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'normalized', 'created_at', 'updated_at')

    def validate(self, attrs):
        from doctors.services.specialty_resolver import normalize_text, detect_language
        name = attrs.get('name')
        if name:
            attrs['normalized'] = normalize_text(name)
            if not attrs.get('language'):
                attrs['language'] = detect_language(name)
        return attrs

    def create(self, validated_data):
        from doctors.services.specialty_resolver import normalize_text, detect_language
        name = validated_data.get('name')
        if not validated_data.get('normalized'):
            validated_data['normalized'] = normalize_text(name)
        if not validated_data.get('language'):
            validated_data['language'] = detect_language(name)
        existing = SpecialtyAlias.objects.filter(normalized=validated_data['normalized']).first()
        if existing:
            for k, v in validated_data.items():
                setattr(existing, k, v)
            existing.save()
            return existing
        return super().create(validated_data)


class SpecialtyOptionSerializer(serializers.Serializer):
    id = serializers.UUIDField(source='specialty.id')
    alias_id = serializers.UUIDField(source='id')
    name = serializers.CharField()
    canonical_name = serializers.CharField(source='specialty.canonical_name')
    bn_name = serializers.CharField(source='specialty.bn_name')
    slug = serializers.CharField(source='specialty.slug')
    icon = serializers.CharField(source='specialty.icon')
    description = serializers.CharField(source='specialty.description')
    doctor_count = serializers.SerializerMethodField()

    def get_doctor_count(self, obj):
        return getattr(obj.specialty, 'cached_doctor_count', None) or obj.specialty.doctors.count()


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


import re

HONORIFIC_PREFIX_RE = re.compile(r'^(?:Dr\.?|Dr\b|ডাক্তার|ডা[ঃ:\.]?)\s*', re.IGNORECASE)

def strip_doctor_honorific(name_str):
    if not name_str:
        return ""
    cleaned = str(name_str).strip()
    while True:
        subbed = HONORIFIC_PREFIX_RE.sub('', cleaned).strip()
        if subbed == cleaned:
            break
        cleaned = subbed
    return cleaned


class DoctorAffiliationSerializer(serializers.ModelSerializer):
    facility_name = serializers.CharField(source='location.name', read_only=True, default='')
    branch = serializers.CharField(source='location.branch', read_only=True, default='')
    district = serializers.CharField(source='location.district', read_only=True, default='')
    division = serializers.CharField(source='location.division', read_only=True, default='')
    area = serializers.CharField(source='location.area', read_only=True, default='')
    schedules = AffiliationScheduleSerializer(many=True, required=False)

    doctor_name = serializers.CharField(source='doctor.name', read_only=True, default='')
    doctor_bn_name = serializers.CharField(source='doctor.bn_name', read_only=True, default='')
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
            'facility_name', 'branch', 'district', 'division', 'area', 'schedules',
            'chamber_type', 'status_label',
            'doctor_name', 'doctor_bn_name', 'academic_title', 'institution', 'qualification', 'experience', 'specialties'
        )

    def to_internal_value(self, data):
        mutable_data = data.copy() if hasattr(data, 'copy') else dict(data)
        if 'location' in mutable_data and not mutable_data.get('location_id'):
            mutable_data['location_id'] = mutable_data['location']
        return super().to_internal_value(mutable_data)


class DoctorSerializer(serializers.ModelSerializer):
    bn_name = serializers.CharField(required=False, allow_blank=True, default='')
    specialties = DoctorSpecialtySerializer(many=True, read_only=True)
    specialty_ids = serializers.PrimaryKeyRelatedField(
        queryset=DoctorSpecialty.objects.all(), many=True, write_only=True, source='specialties', required=False
    )
    affiliations = DoctorAffiliationSerializer(many=True, required=False)
    description = serializers.CharField(source='about', required=False, allow_blank=True)
    match_tier = serializers.IntegerField(read_only=True, required=False, allow_null=True)

    class Meta:
        model = Doctor
        fields = (
            'id', 'name', 'bn_name', 'slug', 'old_slugs', 'academic_title', 'institution',
            'specialties', 'specialty_ids', 'qualification', 'experience',
            'about', 'description', 'clinical_services', 'bmdc_number', 'is_verified', 'image',
            'gender', 'rating', 'review_count', 'status', 'affiliations', 'match_tier'
        )
        read_only_fields = ('old_slugs',)

    def validate_name(self, value):
        from doctors.services.specialty_resolver import detect_language
        cleaned = strip_doctor_honorific(value)
        if not cleaned:
            raise serializers.ValidationError("Doctor name cannot be empty.")
        if detect_language(cleaned) == 'bn':
            raise serializers.ValidationError(
                "Doctor name must be in English. Please provide the Bangla name in the bn_name field."
            )
        return cleaned

    def validate_bn_name(self, value):
        from doctors.services.specialty_resolver import detect_language
        if not value:
            return ""
        cleaned = strip_doctor_honorific(value)
        if cleaned and detect_language(cleaned) != 'bn':
            raise serializers.ValidationError(
                "Bangla name must contain Bangla script."
            )
        return cleaned

    def validate_bmdc_number(self, value):
        if not value or not str(value).strip():
            return None
        return str(value).strip()

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
