import tempfile
import csv
from pathlib import Path
import pytest
from rest_framework.test import APIClient
from rest_framework.exceptions import ValidationError
from django.core.management import call_command
from django.utils.text import slugify

from doctors.models import Doctor, DoctorSpecialty
from doctors.serializers import DoctorSerializer, strip_doctor_honorific
from core.uuid7 import uuid7


@pytest.fixture
def api_client():
    return APIClient()


@pytest.mark.django_db
class TestDoctorBilingualNames:
    def test_strip_honorifics(self):
        assert strip_doctor_honorific("Dr. Sarah Ahmed") == "Sarah Ahmed"
        assert strip_doctor_honorific("Dr Sarah Ahmed") == "Sarah Ahmed"
        assert strip_doctor_honorific("ডাঃ মোঃ রফিকুল ইসলাম") == "মোঃ রফিকুল ইসলাম"
        assert strip_doctor_honorific("ডা. মোঃ রফিকুল ইসলাম") == "মোঃ রফিকুল ইসলাম"
        assert strip_doctor_honorific("ডাক্তার মোঃ রফিকুল ইসলাম") == "মোঃ রফিকুল ইসলাম"
        assert strip_doctor_honorific("Dr. ডাঃ মোঃ রফিকুল ইসলাম") == "মোঃ রফিকুল ইসলাম"

    def test_bangla_only_name_rejected_in_serializer(self):
        serializer = DoctorSerializer(data={
            "name": "ডাঃ মোঃ রফিকুল ইসলাম",
            "qualification": "MBBS, FCPS",
        })
        assert not serializer.is_valid()
        assert "name" in serializer.errors
        assert "English" in str(serializer.errors["name"])

    def test_english_in_bn_name_rejected_in_serializer(self):
        serializer = DoctorSerializer(data={
            "name": "Md. Rafiqul Islam",
            "bn_name": "Dr. Rafiqul Islam",
            "qualification": "MBBS, FCPS",
        })
        assert not serializer.is_valid()
        assert "bn_name" in serializer.errors
        assert "Bangla" in str(serializer.errors["bn_name"])

    def test_valid_bilingual_doctor_creation(self):
        serializer = DoctorSerializer(data={
            "name": "Dr. Md. Rafiqul Islam",
            "bn_name": "ডাঃ মোঃ রফিকুল ইসলাম",
            "qualification": "MBBS, FCPS",
        })
        assert serializer.is_valid(), serializer.errors
        doc = serializer.save()
        # Ensure honorifics are stripped
        assert doc.name == "Md. Rafiqul Islam"
        assert doc.bn_name == "মোঃ রফিকুল ইসলাম"
        assert doc.slug.startswith("md-rafiqul-islam")

    def test_slug_fallback_never_empty(self):
        # Case 1: Pure Bangla name directly on model
        doc1 = Doctor.objects.create(
            name="ডাঃ মোঃ রফিকুল ইসলাম",
            qualification="MBBS",
        )
        assert doc1.slug
        assert doc1.slug.startswith("doctor-")

        # Case 2: Special symbols only
        doc2 = Doctor.objects.create(
            name="--- @@@ ---",
            qualification="MBBS",
        )
        assert doc2.slug
        assert doc2.slug.startswith("doctor-")

        # Case 3: Empty string
        doc3 = Doctor.objects.create(
            name="",
            qualification="MBBS",
        )
        assert doc3.slug
        assert doc3.slug.startswith("doctor-")

    def test_search_matches_both_english_and_bangla(self, api_client):
        doc = Doctor.objects.create(
            name="Abdur Rahman",
            bn_name="আব্দুর রহমান",
            qualification="MBBS, FCPS (Cardiology)",
            is_verified=True,
        )

        # 1. Search in English
        res_en = api_client.get("/api/doctors/?search=Rahman")
        assert res_en.status_code == 200
        results_en = res_en.data.get("results", res_en.data)
        assert any(d["id"] == str(doc.id) for d in results_en)

        # 2. Search in Bangla
        res_bn = api_client.get("/api/doctors/?search=রহমান")
        assert res_bn.status_code == 200
        results_bn = res_bn.data.get("results", res_bn.data)
        assert any(d["id"] == str(doc.id) for d in results_bn)

    def test_import_dry_run_makes_no_changes(self):
        doc = Doctor.objects.create(
            name="Original Name",
            bn_name="",
            slug="original-name",
            qualification="MBBS",
        )

        with tempfile.NamedTemporaryFile(mode="w+", delete=False, suffix=".csv") as f:
            writer = csv.writer(f)
            writer.writerow(["id", "name_en", "name_bn"])
            writer.writerow([str(doc.id), "New Name", "নতুন নাম"])
            temp_csv = f.name

        try:
            call_command("import_doctor_names", temp_csv, "--dry-run")
            doc.refresh_from_db()
            # Assert no changes persisted
            assert doc.name == "Original Name"
            assert doc.bn_name == ""
        finally:
            Path(temp_csv).unlink(missing_ok=True)

    def test_import_regenerates_only_broken_slugs_and_saves_old_slugs(self, api_client):
        # Doctor 1: Good slug, should NOT regenerate
        doc_good = Doctor.objects.create(
            name="Good Doctor",
            bn_name="",
            slug="good-doctor",
            qualification="MBBS",
        )
        # Doctor 2: Broken slug (doctor- prefix), should regenerate
        doc_broken = Doctor.objects.create(
            name="Broken Doctor",
            bn_name="",
            slug="doctor-12345678",
            qualification="MBBS",
        )

        with tempfile.NamedTemporaryFile(mode="w+", delete=False, suffix=".csv") as f:
            writer = csv.writer(f)
            writer.writerow(["id", "name_en", "name_bn"])
            writer.writerow([str(doc_good.id), "Good Doctor", "ভালো ডাক্তার"])
            writer.writerow([str(doc_broken.id), "Tanvir Ahmed", "তানভীর আহমেদ"])
            temp_csv = f.name

        try:
            call_command("import_doctor_names", temp_csv)
            doc_good.refresh_from_db()
            doc_broken.refresh_from_db()

            # Good slug kept
            assert doc_good.slug == "good-doctor"
            assert doc_good.bn_name == "ভালো ডাক্তার"
            assert doc_good.old_slugs == []

            # Broken slug regenerated and old slug recorded
            assert doc_broken.slug.startswith("tanvir-ahmed")
            assert "doctor-12345678" in doc_broken.old_slugs
            assert doc_broken.bn_name == "তানভীর আহমেদ"

            # Test SlugOrPkLookupMixin backwards compatibility with old slug
            res = api_client.get("/api/doctors/doctor-12345678/")
            assert res.status_code == 200
            assert res.data["id"] == str(doc_broken.id)

        finally:
            Path(temp_csv).unlink(missing_ok=True)
