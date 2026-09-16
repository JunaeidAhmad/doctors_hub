import pytest
from rest_framework.test import APIClient
from django.db import IntegrityError, models
from django.db.models import ProtectedError

from django.core.management import call_command
from core.uuid7 import uuid7
from facilities.models import Division, District, Thana, Location, Hospital, DiagnosticCenter
from facilities.serializers import LocationSerializer
from doctors.models import Doctor, DoctorAffiliation


@pytest.fixture(autouse=True)
def seed_geo(db):
    if Division.objects.count() < 8:
        call_command('seed_bangladesh_geo')


@pytest.mark.django_db
class TestUUIDv7:
    def test_uuid7_specification(self):
        u1 = uuid7()
        assert u1.version == 7
        assert u1.variant == 'specified in RFC 4122'

        # Test chronological ordering
        ids = [uuid7() for _ in range(20)]
        assert ids == sorted(ids), "UUIDv7 should be monotonically increasing"

    def test_model_defaults_use_uuid7(self):
        div = Division.objects.first() or Division.objects.create(name="DivTest", slug="divtest")
        dist = District.objects.first() or District.objects.create(division=div, name="DistTest", slug="disttest")
        thana = Thana.objects.first() or Thana.objects.create(district=dist, name="ThanaTest", slug="thanatest")

        loc = Location.objects.create(name="UUID7 Hospital", location_type="hospital", address_line="Line 1", thana=thana)
        assert loc.id.version == 7

        doc = Doctor.objects.create(name="Dr. UUID7", qualification="MBBS")
        assert doc.id.version == 7


@pytest.mark.django_db
class TestGeoHierarchy:
    def test_same_name_thanas_in_different_districts_allowed(self):
        div = Division.objects.first() or Division.objects.create(name="TestDiv", slug="testdiv")
        dist1, _ = District.objects.get_or_create(division=div, name="District Alpha", defaults={"slug": "dist-alpha"})
        dist2, _ = District.objects.get_or_create(division=div, name="District Beta", defaults={"slug": "dist-beta"})

        # Same thana name "Kotwali" in two different districts must both exist without conflict
        t1, c1 = Thana.objects.get_or_create(district=dist1, name="Kotwali", defaults={"slug": "kotwali-alpha"})
        t2, c2 = Thana.objects.get_or_create(district=dist2, name="Kotwali", defaults={"slug": "kotwali-beta"})

        assert t1.district == dist1
        assert t2.district == dist2
        assert t1.id != t2.id

    def test_duplicate_thana_in_same_district_raises_integrity_error(self):
        div = Division.objects.first() or Division.objects.create(name="TestDiv", slug="testdiv")
        dist, _ = District.objects.get_or_create(division=div, name="District Unique", defaults={"slug": "dist-unique"})
        Thana.objects.get_or_create(district=dist, name="UniqueThana", defaults={"slug": "unique-thana-1"})

        with pytest.raises(IntegrityError):
            Thana.objects.create(district=dist, name="UniqueThana", slug="unique-thana-2")

    def test_thana_protect_constraint_prevents_accidental_delete(self):
        thana = Thana.objects.first()
        loc = Location.objects.create(name="Protected Clinic", location_type="hospital", address_line="Road 1", thana=thana)

        with pytest.raises(ProtectedError):
            thana.delete()

        loc.delete()


@pytest.mark.django_db
class TestLocationBackwardCompatibility:
    def test_properties_derived_from_thana(self):
        thana = Thana.objects.filter(district__name="Dhaka", name="Dhanmondi").first()
        if not thana:
            div, _ = Division.objects.get_or_create(name="Dhaka", defaults={"slug": "dhaka"})
            dist, _ = District.objects.get_or_create(division=div, name="Dhaka", defaults={"slug": "dist-dhaka"})
            thana, _ = Thana.objects.get_or_create(district=dist, name="Dhanmondi", defaults={"slug": "dhanmondi"})

        loc = Location.objects.create(
            name="Dhanmondi Clinic",
            location_type="hospital",
            address_line="House 10, Road 4",
            thana=thana
        )

        assert loc.area == "Dhanmondi"
        assert loc.district == "Dhaka"
        assert loc.division == "Dhaka"
        assert "House 10, Road 4, Dhanmondi, Dhaka, Dhaka" in loc.full_address

    def test_legacy_kwargs_in_objects_create(self):
        loc = Location.objects.create(
            name="Legacy Params Clinic",
            location_type="hospital",
            address_line="Old Street",
            district="Dhaka",
            area="Dhanmondi",
            division="Dhaka"
        )
        assert loc.thana is not None
        assert loc.area == "Dhanmondi"
        assert loc.district == "Dhaka"

    def test_location_serializer_output_and_input(self):
        thana = Thana.objects.filter(district__name="Dhaka", name="Dhanmondi").first()
        loc = Location.objects.create(name="Serial Clinic", location_type="hospital", address_line="St 1", thana=thana)

        serializer = LocationSerializer(loc)
        data = serializer.data
        assert data["area"] == "Dhanmondi"
        assert data["district"] == "Dhaka"
        assert data["division"] == "Dhaka"
        assert data["thana"] == thana.id
        assert data["thana_details"]["name"] == "Dhanmondi"

        # Test creating through serializer with legacy district/area
        new_data = {
            "name": "Serializer Created Clinic",
            "location_type": "hospital",
            "address_line": "New Road",
            "district": "Dhaka",
            "area": "Dhanmondi",
        }
        in_serializer = LocationSerializer(data=new_data)
        assert in_serializer.is_valid(), in_serializer.errors
        saved_loc = in_serializer.save()
        assert saved_loc.thana == thana


@pytest.mark.django_db
class TestGeoAPIAndFilters:
    def test_geo_endpoints(self):
        client = APIClient()

        res_div = client.get("/api/divisions/")
        assert res_div.status_code == 200
        div_data = res_div.data.get("results", res_div.data) if isinstance(res_div.data, dict) else res_div.data
        assert len(div_data) >= 8

        res_dist = client.get("/api/districts/")
        assert res_dist.status_code == 200
        dist_data = res_dist.data.get("results", res_dist.data) if isinstance(res_dist.data, dict) else res_dist.data
        assert len(dist_data) >= 64

        dhaka_div = next(d for d in div_data if d["name"] == "Dhaka")
        res_dist_filtered = client.get(f"/api/districts/?division={dhaka_div['id']}")
        assert res_dist_filtered.status_code == 200

        res_thana = client.get("/api/thanas/")
        assert res_thana.status_code == 200

    def test_hospital_and_doctor_filters_by_district_and_alias(self):
        thana_dhan = Thana.objects.filter(district__name="Dhaka", name="Dhanmondi").first()
        loc_dhaka = Location.objects.create(name="Dhaka Care", location_type="hospital", address_line="Rd 1", thana=thana_dhan)
        Hospital.objects.create(location=loc_dhaka)

        thana_ctg = Thana.objects.filter(district__name="Chattogram", name="Panchlaish").first()
        if not thana_ctg:
            thana_ctg = Thana.objects.filter(district__name="Chattogram").first()
        loc_ctg = Location.objects.create(name="Ctg Care", location_type="hospital", address_line="Rd 2", thana=thana_ctg)
        Hospital.objects.create(location=loc_ctg)

        client = APIClient()

        # Filter by Dhaka
        res = client.get("/api/hospitals/?district=Dhaka")
        assert res.status_code == 200
        data = res.data.get("results", res.data) if isinstance(res.data, dict) else res.data
        names = [h["location_details"]["name"] for h in data]
        assert "Dhaka Care" in names
        assert "Ctg Care" not in names

        # Filter by alias Chittagong -> Chattogram
        res_alias = client.get("/api/hospitals/?district=Chittagong")
        assert res_alias.status_code == 200
        data_alias = res_alias.data.get("results", res_alias.data) if isinstance(res_alias.data, dict) else res_alias.data
        names_alias = [h["location_details"]["name"] for h in data_alias]
        assert "Ctg Care" in names_alias
        assert "Dhaka Care" not in names_alias

        # Filter by thana area
        res_area = client.get("/api/hospitals/?area=Dhanmondi")
        assert res_area.status_code == 200
        data_area = res_area.data.get("results", res_area.data) if isinstance(res_area.data, dict) else res_area.data
        names_area = [h["location_details"]["name"] for h in data_area]
        assert "Dhaka Care" in names_area

        # Filter Doctor by location
        doc = Doctor.objects.create(name="Dr. Filter Test", qualification="MBBS")
        DoctorAffiliation.objects.create(doctor=doc, location=loc_dhaka, fee=1000)

        res_doc = client.get("/api/doctors/?district=Dhaka")
        assert res_doc.status_code == 200
        doc_data = res_doc.data.get("results", res_doc.data)
        doc_names = [d["name"] for d in doc_data]
        assert "Dr. Filter Test" in doc_names
