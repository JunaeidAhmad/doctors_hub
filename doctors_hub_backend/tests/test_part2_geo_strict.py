import pytest
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework.exceptions import ValidationError
from django.core.management.base import CommandError

from accounts.models import User
from facilities.models import Location, Hospital, Division, District, Thana
from facilities.geo import get_thana_strict
from services.facilities import create_hospital


@pytest.fixture
def client():
    return APIClient()


@pytest.fixture
def super_admin():
    user, _ = User.objects.get_or_create(
        phone_number="01800000099",
        defaults={
            "is_staff": True,
            "is_superuser": True,
            "is_verified": True,
            "is_active": True,
        }
    )
    user.set_password("pass123456")
    user.save()
    return user


@pytest.fixture
def geo_data():
    div_dhaka, _ = Division.objects.get_or_create(name="Dhaka")
    dist_dhaka, _ = District.objects.get_or_create(name="Dhaka", division=div_dhaka)
    thana_dhanmondi, _ = Thana.objects.get_or_create(name="Dhanmondi", district=dist_dhaka)
    thana_gulshan, _ = Thana.objects.get_or_create(name="Gulshan", district=dist_dhaka)

    return {
        "div_dhaka": div_dhaka,
        "dist_dhaka": dist_dhaka,
        "thana_dhanmondi": thana_dhanmondi,
        "thana_gulshan": thana_gulshan,
    }


@pytest.mark.django_db
def test_create_facility_no_thana_fails(client, super_admin):
    """
    Creating a facility with no thana returns 400.
    """
    client.force_authenticate(user=super_admin)
    res = client.post('/api/v1/locations/', {
        "name": "No Thana Clinic",
        "location_type": "hospital",
        "address_line": "123 Test St",
    })
    assert res.status_code == status.HTTP_400_BAD_REQUEST
    assert 'thana' in res.data

    # Service layer also rejects
    with pytest.raises(ValidationError) as exc:
        create_hospital(
            validated_data={"bed_capacity": 50},
            location_data={"name": "No Thana Hospital", "address_line": "123 St"}
        )
    assert 'thana_id' in exc.value.detail


@pytest.mark.django_db
def test_create_facility_nonexistent_thana_fails(client, super_admin):
    """
    Creating a facility with a nonexistent thana ID returns 400.
    """
    client.force_authenticate(user=super_admin)
    res = client.post('/api/v1/locations/', {
        "name": "Invalid Thana Clinic",
        "location_type": "hospital",
        "address_line": "123 Test St",
        "thana": 999999
    })
    assert res.status_code == status.HTTP_400_BAD_REQUEST
    assert 'thana' in res.data


@pytest.mark.django_db
def test_create_facility_valid_thana_succeeds_and_counts_unchanged(client, super_admin, geo_data):
    """
    Creating with a valid thana returns 201 with correct district/division.
    No new Division/District/Thana rows are created by any facility write.
    """
    div_count = Division.objects.count()
    dist_count = District.objects.count()
    thana_count = Thana.objects.count()

    client.force_authenticate(user=super_admin)
    payload = {
        "name": "Strict Thana Hospital",
        "location_type": "hospital",
        "address_line": "Road 32",
        "thana": geo_data["thana_dhanmondi"].id,
    }
    res = client.post('/api/v1/locations/', payload)
    assert res.status_code == status.HTTP_201_CREATED

    data = res.data
    assert data["thana"] == geo_data["thana_dhanmondi"].id
    assert data["area"] == "Dhanmondi"
    assert data["district"] == "Dhaka"
    assert data["division"] == "Dhaka"

    # Assert no new geo entities were created
    assert Division.objects.count() == div_count
    assert District.objects.count() == dist_count
    assert Thana.objects.count() == thana_count


@pytest.mark.django_db
def test_get_thana_strict_resolution_and_exceptions(geo_data):
    """
    get_thana_strict resolves matching thana or raises CommandError.
    """
    # 1. Exact match
    thana = get_thana_strict("Dhaka", "Dhanmondi")
    assert thana.id == geo_data["thana_dhanmondi"].id

    # 2. Case-insensitive match
    thana_ci = get_thana_strict("dhaka", "gulshan")
    assert thana_ci.id == geo_data["thana_gulshan"].id

    # 3. Unknown district raises CommandError
    with pytest.raises(CommandError) as exc_dist:
        get_thana_strict("NonexistentDistrict", "Dhanmondi")
    assert "Unknown district" in str(exc_dist.value)

    # 4. Unknown thana raises CommandError
    with pytest.raises(CommandError) as exc_thana:
        get_thana_strict("Dhaka", "NonexistentThana")
    assert "Unknown thana" in str(exc_thana.value)

    # 5. Empty inputs raise CommandError
    with pytest.raises(CommandError):
        get_thana_strict("", "Dhanmondi")
    with pytest.raises(CommandError):
        get_thana_strict("Dhaka", "")
