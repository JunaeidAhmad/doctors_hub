from rest_framework import serializers
from .models import (
    DoctorSpecialty, SpecialtyAlias, Doctor, DoctorAffiliation, AffiliationSchedule
)
from facilities.models import Location
from facilities.serializers import LocationSerializer


class SpecialtyTagSerializer(serializers.ModelSerializer):
    class Meta:
        model = DoctorSpecialty
        fields = ('id', 'slug', 'name', 'bn_name', 'is_umbrella')


class DoctorSpecialtySerializer(serializers.ModelSerializer):
    doctor_count = serializers.IntegerField(read_only=True, required=False)
    alias_count = serializers.IntegerField(read_only=True, required=False)
    parents = serializers.SerializerMethodField(read_only=True)
    parent_ids = serializers.PrimaryKeyRelatedField(
        queryset=DoctorSpecialty.objects.all(), many=True, write_only=True, required=False
    )
    related_ids = serializers.PrimaryKeyRelatedField(
        queryset=DoctorSpecialty.objects.all(), many=True, required=False, source='related'
    )

    class Meta:
        model = DoctorSpecialty
        fields = (
            'id', 'name', 'canonical_name', 'bn_name', 'formal_name', 'slug',
            'icon', 'description', 'is_umbrella', 'is_popular',
            'doctor_count', 'alias_count', 'parents', 'parent_ids', 'related_ids'
        )

    def get_parents(self, obj):
        return [
            {"id": str(p.id), "slug": p.slug, "name": p.name}
            for p in obj.parent_categories.all()
        ]

    def create(self, validated_data):
        parent_ids = validated_data.pop('parent_ids', None)
        related_nodes = validated_data.pop('related', None)
        from doctors.services.specialty_resolver import resolve_or_create_specialty, UnresolvedSpecialty
        from doctors.services.specialty_relations import bump_taxonomy_version
        raw_name = validated_data.get('name', '')
        try:
            specialty = resolve_or_create_specialty(raw_name, is_verified=True)
            updated = False
            for field in ('canonical_name', 'bn_name', 'formal_name', 'icon', 'description', 'is_umbrella', 'provider_type', 'is_popular'):
                if field in validated_data and validated_data[field]:
                    setattr(specialty, field, validated_data[field])
                    updated = True
            if updated:
                specialty.save()
        except UnresolvedSpecialty:
            specialty = super().create(validated_data)

        if parent_ids is not None:
            specialty.parent_categories.set(parent_ids)
        if related_nodes is not None:
            specialty.related.set(related_nodes)
        bump_taxonomy_version()
        return specialty

    def update(self, instance, validated_data):
        parent_ids = validated_data.pop('parent_ids', None)
        related_nodes = validated_data.pop('related', None)
        from doctors.services.specialty_relations import bump_taxonomy_version
        for attr, val in validated_data.items():
            setattr(instance, attr, val)
        instance.save()
        if parent_ids is not None:
            instance.parent_categories.set(parent_ids)
        if related_nodes is not None:
            instance.related.set(related_nodes)
        bump_taxonomy_version()
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
        counts = self.context.get('doctor_counts')
        spec_id = getattr(obj, 'specialty_id', None) or getattr(obj, 'id', None)
        if counts is not None and spec_id:
            return counts.get(spec_id, 0)
        from doctors.services.specialty_relations import specialty_doctor_counts
        counts = specialty_doctor_counts()
        return counts.get(spec_id, 0) if spec_id else 0


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
            'doctor_name', 'doctor_bn_name', 'academic_title', 'institution', 'qualification', 'experience'
        )

    def to_internal_value(self, data):
        mutable_data = data.copy() if hasattr(data, 'copy') else dict(data)
        if 'location' in mutable_data and not mutable_data.get('location_id'):
            mutable_data['location_id'] = mutable_data['location']
        return super().to_internal_value(mutable_data)


class DoctorSerializer(serializers.ModelSerializer):
    bn_name = serializers.CharField(required=False, allow_blank=True, default='')
    specialty_source = serializers.CharField(required=False, allow_blank=True, default='')
    specialty_source_bn = serializers.CharField(required=False, allow_blank=True, default='')
    specialty_display = serializers.SerializerMethodField()
    primary_specialty = SpecialtyTagSerializer(read_only=True)
    primary_specialty_id = serializers.PrimaryKeyRelatedField(
        queryset=DoctorSpecialty.objects.all(), source='primary_specialty', write_only=True, required=False, allow_null=True
    )
    specialty_tags = SpecialtyTagSerializer(source='specialties', many=True, read_only=True)
    specialties = DoctorSpecialtySerializer(many=True, read_only=True)
    specialty_ids = serializers.PrimaryKeyRelatedField(
        queryset=DoctorSpecialty.objects.all(), many=True, write_only=True, required=False
    )
    affiliations = DoctorAffiliationSerializer(many=True, required=False)
    description = serializers.CharField(source='about', required=False, allow_blank=True)
    match_rank = serializers.SerializerMethodField()
    match_tier = serializers.SerializerMethodField()
    is_primary_match = serializers.SerializerMethodField()

    class Meta:
        model = Doctor
        fields = (
            'id', 'name', 'bn_name', 'slug', 'old_slugs', 'academic_title', 'institution',
            'specialty_source', 'specialty_source_bn', 'specialty_display', 'primary_specialty', 'primary_specialty_id',
            'specialty_tags', 'specialties', 'specialty_ids', 'qualification', 'experience',
            'about', 'description', 'clinical_services', 'bmdc_number', 'is_verified', 'image',
            'gender', 'rating', 'review_count', 'status', 'affiliations',
            'match_rank', 'match_tier', 'is_primary_match'
        )
        read_only_fields = ('old_slugs',)

    def get_specialty_display(self, obj):
        en_str = (obj.specialty_source or "").strip()
        bn_str = (obj.specialty_source_bn or "").strip()
        if not en_str:
            specs = list(obj.specialties.all())
            en_str = " · ".join([s.name for s in specs if s.name]) or (obj.primary_specialty.name if obj.primary_specialty else "")
        if not bn_str:
            specs = list(obj.specialties.all())
            bn_str = " · ".join([s.bn_name or s.name for s in specs if (s.bn_name or s.name)]) or (obj.primary_specialty.bn_name if obj.primary_specialty else en_str)
        return {
            "en": en_str,
            "bn": bn_str or en_str
        }

    def get_match_rank(self, obj):
        return getattr(obj, 'match_rank', None)

    def get_match_tier(self, obj):
        return getattr(obj, 'match_tier', None)

    def get_is_primary_match(self, obj):
        return getattr(obj, 'is_primary_match', None)

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
        specialty_ids = validated_data.pop('specialties', None) or validated_data.pop('specialty_ids', None)
        primary_spec = validated_data.get('primary_specialty')
        affiliations_data = validated_data.pop('affiliations', None)

        doctor = Doctor.objects.create(**validated_data)

        if specialty_ids is not None:
            doctor.specialties.set(specialty_ids)
            if not primary_spec and specialty_ids:
                doctor.primary_specialty = specialty_ids[0]
                doctor.save(update_fields=['primary_specialty'])
        elif primary_spec and not doctor.specialties.exists():
            doctor.specialties.add(primary_spec)

        if affiliations_data:
            for aff_data in affiliations_data:
                schedules_data = aff_data.pop('schedules', [])
                aff = DoctorAffiliation.objects.create(doctor=doctor, **aff_data)
                for sched_data in schedules_data:
                    AffiliationSchedule.objects.create(affiliation=aff, **sched_data)
        return doctor

    def update(self, instance, validated_data):
        specialty_ids = validated_data.pop('specialties', None) or validated_data.pop('specialty_ids', None)
        validated_data.pop('affiliations', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if specialty_ids is not None:
            instance.specialties.set(specialty_ids)
            if not instance.primary_specialty and specialty_ids:
                instance.primary_specialty = specialty_ids[0]
                instance.save(update_fields=['primary_specialty'])
        elif instance.primary_specialty and not instance.specialties.filter(id=instance.primary_specialty.id).exists():
            instance.specialties.add(instance.primary_specialty)

        return instance
