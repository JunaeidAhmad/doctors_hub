import pytest
from rest_framework.test import APIClient
from facilities.models import Location, Hospital


@pytest.mark.django_db
def test_hospital_ordering_alphabetical_pagination():
    client = APIClient()

    # Clear existing hospitals to test clean ordering
    Hospital.objects.all().delete()
    Location.objects.filter(location_type=Location.LocationType.HOSPITAL).delete()

    loc_c = Location.objects.create(
        name="C Care Hospital",
        location_type=Location.LocationType.HOSPITAL,
        address_line="Road 3",
        is_active=True,
    )
    hosp_c = Hospital.objects.create(location=loc_c)

    loc_a = Location.objects.create(
        name="A Apex Hospital",
        location_type=Location.LocationType.HOSPITAL,
        address_line="Road 1",
        is_active=True,
    )
    hosp_a = Hospital.objects.create(location=loc_a)

    loc_b = Location.objects.create(
        name="B Bridge Hospital",
        location_type=Location.LocationType.HOSPITAL,
        address_line="Road 2",
        is_active=True,
    )
    hosp_b = Hospital.objects.create(location=loc_b)

    # Ascending: ordering=name
    res_page1 = client.get("/api/hospitals/?ordering=name&page_size=2&page=1")
    assert res_page1.status_code == 200
    data_page1 = res_page1.json()
    assert data_page1["count"] == 3
    names_page1 = [item["location_details"]["name"] if "location_details" in item else item.get("name") for item in data_page1["results"]]
    assert names_page1 == ["A Apex Hospital", "B Bridge Hospital"]

    res_page2 = client.get("/api/hospitals/?ordering=name&page_size=2&page=2")
    assert res_page2.status_code == 200
    data_page2 = res_page2.json()
    names_page2 = [item["location_details"]["name"] if "location_details" in item else item.get("name") for item in data_page2["results"]]
    assert names_page2 == ["C Care Hospital"]

    # Descending: ordering=-name
    res_desc_page1 = client.get("/api/hospitals/?ordering=-name&page_size=2&page=1")
    assert res_desc_page1.status_code == 200
    data_desc_page1 = res_desc_page1.json()
    names_desc_page1 = [item["location_details"]["name"] if "location_details" in item else item.get("name") for item in data_desc_page1["results"]]
    assert names_desc_page1 == ["C Care Hospital", "B Bridge Hospital"]

    res_desc_page2 = client.get("/api/hospitals/?ordering=-name&page_size=2&page=2")
    assert res_desc_page2.status_code == 200
    data_desc_page2 = res_desc_page2.json()
    names_desc_page2 = [item["location_details"]["name"] if "location_details" in item else item.get("name") for item in data_desc_page2["results"]]
    assert names_desc_page2 == ["A Apex Hospital"]
