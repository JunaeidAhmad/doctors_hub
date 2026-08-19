import factory
from accounts.models import User, Role
from facilities.models import Location, Hospital, DiagnosticCenter, FacilityMembership
from doctors.models import Doctor, DoctorSpecialty, DoctorAffiliation, AffiliationSchedule
from tests.models import TestCategory, Test, FacilityTest
from bookings.models import DoctorBooking, LabBooking


class UserFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = User
        django_get_or_create = ('phone_number',)

    phone_number = factory.Sequence(lambda n: f"01710{n:06d}")
    first_name = factory.Faker("first_name")
    last_name = factory.Faker("last_name")
    role = ""
    is_active = True
    is_staff = False
    is_superuser = False

    @classmethod
    def create_super_admin(cls, **kwargs):
        return cls.create(
            role=Role.SUPER_ADMIN,
            is_staff=True,
            is_superuser=True,
            **kwargs
        )

    @classmethod
    def create_facility_admin(cls, **kwargs):
        return cls.create(
            role=Role.FACILITY_ADMIN,
            is_staff=False,
            is_superuser=False,
            **kwargs
        )

    @classmethod
    def create_doctor_user(cls, **kwargs):
        return cls.create(
            role=Role.DOCTOR,
            is_staff=False,
            is_superuser=False,
            **kwargs
        )


class LocationFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Location

    location_type = Location.LocationType.HOSPITAL
    name = factory.Sequence(lambda n: f"Hospital Location {n}")
    branch = factory.Sequence(lambda n: f"Branch {n}")
    address_line = "123 Health Ave"
    area = "Dhanmondi"
    district = "Dhaka"
    division = "Dhaka"
    is_active = True
    is_verified = True


class FacilityMembershipFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = FacilityMembership

    user = factory.SubFactory(UserFactory)
    location = factory.SubFactory(LocationFactory)
    role = FacilityMembership.MemberRole.ADMIN


class DoctorSpecialtyFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = DoctorSpecialty

    name = factory.Sequence(lambda n: f"Specialty {n}")
    icon = "Stethoscope"


class DoctorFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Doctor

    name = factory.Sequence(lambda n: f"Dr. Person {n}")
    qualification = "MBBS, FCPS"
    experience = "10 Years"
    user = None


class DoctorAffiliationFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = DoctorAffiliation

    doctor = factory.SubFactory(DoctorFactory)
    location = factory.SubFactory(LocationFactory)
    fee = 1000.00


class AffiliationScheduleFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = AffiliationSchedule

    affiliation = factory.SubFactory(DoctorAffiliationFactory)
    day_of_week = "Monday"
    start_time = "09:00:00"
    end_time = "13:00:00"


class TestCategoryFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = TestCategory

    name = factory.Sequence(lambda n: f"Test Category {n}")


class TestFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Test

    name = factory.Sequence(lambda n: f"Pathology Test {n}")
    category = factory.SubFactory(TestCategoryFactory)


class FacilityTestFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = FacilityTest

    location = factory.SubFactory(LocationFactory)
    test = factory.SubFactory(TestFactory)
    price = 500.00
    is_available = True
