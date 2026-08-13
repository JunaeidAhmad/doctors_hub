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

    class Meta:
        model = TestCategory
        fields = '__all__'


class TestSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_slug = serializers.CharField(source='category.slug', read_only=True)

    class Meta:
        model = Test
        fields = '__all__'



class DiagnosticCenterCategorySerializer(serializers.ModelSerializer):
    parent_name = serializers.CharField(source='parent.name', read_only=True, default='')

    class Meta:
        model = DiagnosticCenterCategory
        fields = '__all__'


class DiagnosticCenterTestSerializer(serializers.ModelSerializer):
    test_details = TestSerializer(source='test', read_only=True)
    center_name = serializers.CharField(source='center.name', read_only=True, default='')
    center_branch = serializers.CharField(source='center.branch', read_only=True, default='')
    center_district = serializers.CharField(source='center.district', read_only=True, default='')
    hospital_name = serializers.CharField(source='hospital.name', read_only=True, default='')
    hospital_branch = serializers.CharField(source='hospital.branch', read_only=True, default='')

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
    doctor_name = serializers.CharField(source='doctor.name', read_only=True, default='')
    qualification = serializers.CharField(source='doctor.qualification', read_only=True, default='')
    experience = serializers.CharField(source='doctor.experience', read_only=True, default='')
    specialties = DoctorSpecialtySerializer(source='doctor.specialties', many=True, read_only=True)

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
    offered_tests = DiagnosticCenterTestSerializer(many=True, read_only=True)
    test_prices = serializers.JSONField(write_only=True, required=False)

    class Meta:
        model = Hospital
        fields = '__all__'

    def _attach_tests(self, hospital, test_category_ids=None, test_ids=None, test_prices=None):
        tests_to_attach = set()
        if test_ids:
            tests_to_attach.update(Test.objects.filter(id__in=test_ids))
        if test_category_ids:
            cats = TestCategory.objects.filter(id__in=test_category_ids).prefetch_related('children')
            all_cat_ids = set()
            for cat in cats:
                all_cat_ids.add(cat.id)
                all_cat_ids.update(cat.children.values_list('id', flat=True))
            tests_to_attach.update(Test.objects.filter(category_id__in=all_cat_ids))

        prices_dict = {}
        if test_prices:
            if isinstance(test_prices, dict):
                prices_dict = test_prices
            elif isinstance(test_prices, list):
                for item in test_prices:
                    if isinstance(item, dict):
                        tid = item.get('test_id') or item.get('id') or item.get('test')
                        if tid:
                            prices_dict[str(tid)] = item
            if prices_dict:
                tests_to_attach.update(Test.objects.filter(id__in=list(prices_dict.keys())))

        if not tests_to_attach:
            return

        existing_tests = DiagnosticCenterTest.objects.filter(hospital=hospital, test__in=tests_to_attach)
        existing_test_map = {dct.test_id: dct for dct in existing_tests}

        new_objs = []
        updated_objs = []
        for idx, test in enumerate(tests_to_attach):
            price_val = None
            orig_price_val = None

            if prices_dict:
                raw_val = prices_dict.get(str(test.id))
                if raw_val is None:
                    raw_val = prices_dict.get(test.id)

                if raw_val is not None:
                    if isinstance(raw_val, dict):
                        price_val = raw_val.get('price')
                        orig_price_val = raw_val.get('original_price')
                    else:
                        price_val = raw_val

            if test.id in existing_test_map:
                if price_val is not None:
                    dct = existing_test_map[test.id]
                    dct.price = price_val
                    if orig_price_val is not None:
                        dct.original_price = orig_price_val
                    updated_objs.append(dct)
            else:
                if price_val is not None:
                    base_price = price_val
                    try:
                        orig_price = orig_price_val if orig_price_val is not None else (float(price_val) + 200)
                    except (ValueError, TypeError):
                        orig_price = base_price
                else:
                    base_price = 400 + (idx * 150) % 2500
                    orig_price = base_price + 200

                report_time_hours = getattr(test, 'report_time_hours', 24) or 24
                new_objs.append(
                    DiagnosticCenterTest(
                        hospital=hospital,
                        test=test,
                        price=base_price,
                        original_price=orig_price,
                        discount='20% OFF',
                        report_time=f"{report_time_hours} Hours",
                        is_available=True,
                        home_sample_collection=True
                    )
                )

        if new_objs:
            DiagnosticCenterTest.objects.bulk_create(new_objs)
        if updated_objs:
            DiagnosticCenterTest.objects.bulk_update(updated_objs, ['price', 'original_price'])

    def create(self, validated_data):
        categories = validated_data.pop('categories', [])
        services = validated_data.pop('services', [])
        test_cat_ids = validated_data.pop('test_category_ids', None)
        t_ids = validated_data.pop('test_ids', None)
        t_prices = validated_data.pop('test_prices', None)

        hospital = Hospital.objects.create(**validated_data)
        if categories:
            hospital.categories.set(categories)
        if services:
            hospital.services.set(services)
        self._attach_tests(hospital, test_category_ids=test_cat_ids, test_ids=t_ids, test_prices=t_prices)
        return hospital

    def update(self, instance, validated_data):
        categories = validated_data.pop('categories', None)
        services = validated_data.pop('services', None)
        test_cat_ids = validated_data.pop('test_category_ids', None)
        t_ids = validated_data.pop('test_ids', None)
        t_prices = validated_data.pop('test_prices', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if categories is not None:
            instance.categories.set(categories)
        if services is not None:
            instance.services.set(services)

        if test_cat_ids is not None or t_ids is not None or t_prices is not None:
            self._attach_tests(instance, test_category_ids=test_cat_ids, test_ids=t_ids, test_prices=t_prices)
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
    offered_tests = serializers.SerializerMethodField()
    affiliated_doctors = DoctorAffiliationSerializer(many=True, read_only=True)
    test_category_ids = serializers.ListField(
        child=serializers.UUIDField(), write_only=True, required=False
    )
    test_ids = serializers.ListField(
        child=serializers.UUIDField(), write_only=True, required=False
    )
    test_prices = serializers.JSONField(
        write_only=True, required=False
    )

    class Meta:
        model = DiagnosticCenter
        fields = '__all__'

    def get_offered_tests(self, obj):
        tests = obj.offered_tests.all()
        request = self.context.get('request')
        if request:
            testcat = request.query_params.get('testcat', None)
            search = request.query_params.get('search', None)
            
            if testcat and testcat != 'all':
                from django.db.models import Q
                from .views import is_valid_uuid
                q = Q(test__category__slug=testcat) | Q(test__category__name__icontains=testcat)
                if is_valid_uuid(testcat):
                    q |= Q(test__category_id=testcat)
                tests = tests.filter(q)
                
            if search:
                from django.db.models import Q
                filtered_tests = tests.filter(
                    Q(test__name__icontains=search) | 
                    Q(test__category__name__icontains=search)
                )
                if filtered_tests.exists():
                    tests = filtered_tests
                    
        return DiagnosticCenterTestSerializer(tests, many=True, context=self.context).data

    def _attach_tests(self, center, test_category_ids=None, test_ids=None, test_prices=None):
        tests_to_attach = set()
        if test_ids:
            tests_to_attach.update(Test.objects.filter(id__in=test_ids))
        if test_category_ids:
            tests_to_attach.update(Test.objects.filter(category_id__in=test_category_ids))

        prices_dict = {}
        if test_prices:
            if isinstance(test_prices, dict):
                prices_dict = test_prices
            elif isinstance(test_prices, list):
                for item in test_prices:
                    if isinstance(item, dict):
                        tid = item.get('test_id') or item.get('id') or item.get('test')
                        if tid:
                            prices_dict[str(tid)] = item
            if prices_dict:
                tests_to_attach.update(Test.objects.filter(id__in=list(prices_dict.keys())))

        if not tests_to_attach:
            return

        existing_tests = DiagnosticCenterTest.objects.filter(center=center, test__in=tests_to_attach)
        existing_test_map = {dct.test_id: dct for dct in existing_tests}

        new_objs = []
        updated_objs = []
        for idx, test in enumerate(tests_to_attach):
            price_val = None
            orig_price_val = None

            if prices_dict:
                raw_val = prices_dict.get(str(test.id))
                if raw_val is None:
                    raw_val = prices_dict.get(test.id)

                if raw_val is not None:
                    if isinstance(raw_val, dict):
                        price_val = raw_val.get('price')
                        orig_price_val = raw_val.get('original_price')
                    else:
                        price_val = raw_val

            if test.id in existing_test_map:
                if price_val is not None:
                    dct = existing_test_map[test.id]
                    dct.price = price_val
                    if orig_price_val is not None:
                        dct.original_price = orig_price_val
                    updated_objs.append(dct)
            else:
                if price_val is not None:
                    base_price = price_val
                    try:
                        orig_price = orig_price_val if orig_price_val is not None else (float(price_val) + 200)
                    except (ValueError, TypeError):
                        orig_price = base_price
                else:
                    base_price = 400 + (idx * 150) % 2500
                    orig_price = base_price + 200

                report_time_hours = getattr(test, 'report_time_hours', 24) or 24
                new_objs.append(
                    DiagnosticCenterTest(
                        center=center,
                        test=test,
                        price=base_price,
                        original_price=orig_price,
                        discount='20% OFF',
                        report_time=f"{report_time_hours} Hours",
                        is_available=True,
                        home_sample_collection=True
                    )
                )

        if new_objs:
            DiagnosticCenterTest.objects.bulk_create(new_objs)
        if updated_objs:
            DiagnosticCenterTest.objects.bulk_update(updated_objs, ['price', 'original_price'])

    def create(self, validated_data):
        categories = validated_data.pop('categories', [])
        services = validated_data.pop('services', [])
        test_cat_ids = validated_data.pop('test_category_ids', None)
        t_ids = validated_data.pop('test_ids', None)
        t_prices = validated_data.pop('test_prices', None)

        center = DiagnosticCenter.objects.create(**validated_data)
        if categories:
            center.categories.set(categories)
        if services:
            center.services.set(services)

        self._attach_tests(center, test_category_ids=test_cat_ids, test_ids=t_ids, test_prices=t_prices)
        return center

    def update(self, instance, validated_data):
        categories = validated_data.pop('categories', None)
        services = validated_data.pop('services', None)
        test_cat_ids = validated_data.pop('test_category_ids', None)
        t_ids = validated_data.pop('test_ids', None)
        t_prices = validated_data.pop('test_prices', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if categories is not None:
            instance.categories.set(categories)
        if services is not None:
            instance.services.set(services)

        if test_cat_ids is not None or t_ids is not None or t_prices is not None:
            self._attach_tests(instance, test_category_ids=test_cat_ids, test_ids=t_ids, test_prices=t_prices)
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
