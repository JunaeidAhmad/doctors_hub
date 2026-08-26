import factory
from accounts.models import User, Role, UserRole, Permission
from facilities.models import Location, Hospital, DiagnosticCenter
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
    is_active = True
    is_staff = False
    is_superuser = False

    @classmethod
    def create_super_admin(cls, **kwargs):
        user = cls.create(
            is_staff=True,
            is_superuser=True,
            **kwargs
        )
        role, _ = Role.objects.get_or_create(
            name="Super Admin",
            defaults={"scope_type": Role.ScopeType.GLOBAL, "is_system": True}
        )
        UserRole.objects.get_or_create(user=user, role=role)
        return user

    @classmethod
    def create_facility_admin(cls, location=None, **kwargs):
        user = cls.create(
            is_staff=False,
            is_superuser=False,
            **kwargs
        )
        role, _ = Role.objects.get_or_create(
            name="Facility Admin",
            defaults={"scope_type": Role.ScopeType.FACILITY, "is_system": True}
        )
        UserRole.objects.get_or_create(user=user, role=role, facility=location)
        return user

    @classmethod
    def create_doctor_user(cls, **kwargs):
        user = cls.create(
            is_staff=False,
            is_superuser=False,
            **kwargs
        )
        role, _ = Role.objects.get_or_create(
            name="Doctor",
            defaults={"scope_type": Role.ScopeType.SELF, "is_system": True}
        )
        UserRole.objects.get_or_create(user=user, role=role)
        return user


class RoleFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Role

    name = factory.Sequence(lambda n: f"Role {n}")
    scope_type = Role.ScopeType.GLOBAL
    is_active = True
    is_system = False


class UserRoleFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = UserRole

    user = factory.SubFactory(UserFactory)
    role = factory.SubFactory(RoleFactory)


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
