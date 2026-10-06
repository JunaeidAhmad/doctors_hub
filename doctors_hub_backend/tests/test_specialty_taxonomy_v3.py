import pytest
from rest_framework import status
from rest_framework.test import APIClient
from django.core.exceptions import ValidationError
from django.core.management import call_command
from django.db import transaction

from doctors.models import Doctor, DoctorSpecialty, SpecialtyAlias
from doctors.services.taxonomy_rules import validate_node_parents
from doctors.services.specialty_relations import (
    expand, match_node_ids, curated_related_ids, bump_taxonomy_version,
    get_taxonomy_version, specialty_doctor_counts, _cached_match_node_ids, _cached_curated_related_ids
)
from doctors.services.specialty_resolver import resolve_specialty_exact
from doctors.serializers import DoctorSerializer, DoctorSpecialtySerializer
from tests.factories import DoctorFactory


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture(autouse=True)
def ensure_taxonomy_loaded():
    if DoctorSpecialty.objects.filter(is_umbrella=True).count() < 24:
        call_command('load_taxonomy', file='doctors/fixtures/taxonomy_v3.yaml')


@pytest.mark.django_db
class TestTaxonomyStructure:
    def test_two_level_structure_and_constraints(self):
        # 1. Umbrella cannot have parents
        umb = DoctorSpecialty.objects.filter(is_umbrella=True).first()
        assert umb is not None
        assert umb.parent_categories.count() == 0

        # Attempting to assign a parent to an umbrella must raise ValidationError
        another_umb = DoctorSpecialty.objects.filter(is_umbrella=True).exclude(pk=umb.pk).first()
        with pytest.raises(ValidationError):
            with transaction.atomic():
                umb.parent_categories.add(another_umb)

        # 2. Leaf parents must all be umbrellas
        leaf = DoctorSpecialty.objects.filter(is_umbrella=False).first()
        assert leaf is not None
        for p in leaf.parent_categories.all():
            assert p.is_umbrella is True

        # Attempting to assign another leaf as parent must raise ValidationError
        another_leaf = DoctorSpecialty.objects.filter(is_umbrella=False).exclude(pk=leaf.pk).first()
        with pytest.raises(ValidationError):
            with transaction.atomic():
                leaf.parent_categories.add(another_leaf)

        # 3. Node cannot be its own parent
        with pytest.raises(ValidationError):
            with transaction.atomic():
                leaf.parent_categories.add(leaf)


@pytest.mark.django_db
class TestSpecialtyRelations:
    def test_expand(self):
        # Empty input
        assert expand([]) == set()
        assert expand(None) == set()

        # Leaf expands to itself
        leaf = DoctorSpecialty.objects.filter(is_umbrella=False).first()
        assert expand([leaf.id]) == {leaf.id}

        # Umbrella expands to itself + its child leaves
        umb = DoctorSpecialty.objects.filter(is_umbrella=True).first()
        expected = {umb.id} | set(umb.subspecialties.values_list('id', flat=True))
        assert expand([umb.id]) == expected

    def test_match_and_related_caching_and_invalidation(self):
        leaf = DoctorSpecialty.objects.filter(is_umbrella=False).first()
        assert leaf is not None

        # Direct match
        direct = match_node_ids(leaf)
        assert leaf.id in direct

        # Curated related leaves
        rel = curated_related_ids(leaf)
        assert leaf.id not in rel  # A leaf never relates to itself

        # Cache check
        info_match_before = _cached_match_node_ids.cache_info()
        _ = match_node_ids(leaf)
        info_match_after = _cached_match_node_ids.cache_info()
        assert info_match_after.hits > info_match_before.hits

        # Bump version invalidates cache
        old_v = get_taxonomy_version()
        bump_taxonomy_version()
        assert get_taxonomy_version() == old_v + 1
        assert _cached_match_node_ids.cache_info().currsize == 0


@pytest.mark.django_db
class TestMultiRankFiltering:
    def test_multi_rank_ordering_and_tie_breaking(self, api_client):
        cardio = resolve_specialty_exact('cardiologist')
        ped_cardio = resolve_specialty_exact('pediatric-cardiologist')
        derm = resolve_specialty_exact('dermatologist')
        med = resolve_specialty_exact('medicine-specialist')

        assert cardio is not None
        assert ped_cardio is not None
        assert derm is not None

        # Doctor A: Primary specialty is cardio -> Rank 1
        doc_a = DoctorFactory(name="Dr. Aaron Primary Cardio", is_verified=True, primary_specialty=cardio, specialty_source="Cardiologist")
        doc_a.specialties.set([cardio])

        # Doctor B: Primary is Medicine, secondary specialty has cardio -> Rank 2
        doc_b = DoctorFactory(name="Dr. Brian Secondary Cardio", is_verified=True, primary_specialty=med, specialty_source="Medicine\nCardiologist")
        doc_b.specialties.set([cardio, med] if med else [cardio])

        # Doctor C: Primary is pediatric-cardiologist (related, not a direct match) -> Excluded
        doc_c = DoctorFactory(name="Dr. Cathy Pediatric Cardio", is_verified=True, primary_specialty=ped_cardio, specialty_source="Pediatric Cardiologist")
        doc_c.specialties.set([ped_cardio])

        # Doctor D: Dermatologist (Unrelated) -> Excluded
        doc_d = DoctorFactory(name="Dr. David Dermatologist", is_verified=True, primary_specialty=derm, specialty_source="Dermatologist")
        doc_d.specialties.set([derm])

        # Search for cardiologist
        res = api_client.get(f"/api/v1/doctors/?specialty={cardio.slug}")
        assert res.status_code == status.HTTP_200_OK
        data = res.data.get("results", res.data)
        doc_ids = [d["id"] for d in data]

        # Verify membership: only direct matches (exact-only filter)
        assert str(doc_a.id) in doc_ids
        assert str(doc_b.id) in doc_ids
        assert str(doc_c.id) not in doc_ids
        assert str(doc_d.id) not in doc_ids

        # Verify ordering: Rank 1 (A) before Rank 2 (B)
        idx_a = doc_ids.index(str(doc_a.id))
        idx_b = doc_ids.index(str(doc_b.id))
        assert idx_a < idx_b

        # Verify ranks returned
        doc_a_data = next(d for d in data if d["id"] == str(doc_a.id))
        doc_b_data = next(d for d in data if d["id"] == str(doc_b.id))

        assert doc_a_data["match_rank"] == 1
        assert doc_b_data["match_rank"] == 2

        # Verify metadata
        meta = res.data["meta"]
        assert meta["primary_count"] >= 1
        assert meta["secondary_count"] >= 1
        assert meta["related_count"] == 0
        assert meta["match_count"] == meta["primary_count"] + meta["secondary_count"]


@pytest.mark.django_db
class TestRehanaBegumAcceptance:
    def test_rehana_begum_profile_and_rankings(self, api_client):
        cancer_leaf = resolve_specialty_exact('cancer-specialist')
        breast_surg = resolve_specialty_exact('breast-surgeon')
        breast_health = resolve_specialty_exact('breast-health-specialist')
        weight_leaf = resolve_specialty_exact('weight-management-specialist')
        diet_leaf = resolve_specialty_exact('nutritionist-dietitian')

        assert all([cancer_leaf, breast_surg, breast_health, weight_leaf, diet_leaf])

        rehana = Doctor.objects.filter(name__icontains="Rehana Begum").first()
        if not rehana:
            rehana = Doctor.objects.create(
                name="Dr. Rehana Begum",
                bn_name="ডাঃ রেহানা বেগম",
                qualification="MBBS (Dhaka), LM (Dublin), DGO (Ireland)",
                experience="Consultant",
                institution="UN Physician / Physician In-charge (Women's Health & Breast Cancer Project, UNDP)",
                gender="Female",
                is_verified=True
            )

        rehana.specialty_source = "Breast Health & Breast Surgery / Oncology\nWeight Management & Dietetics"
        rehana.primary_specialty = cancer_leaf
        rehana.save()
        rehana.specialties.set([breast_health, breast_surg, cancer_leaf, weight_leaf, diet_leaf])
        rehana.refresh_from_db()

        # Verbatim text display
        serializer = DoctorSerializer(rehana)
        disp = serializer.data["specialty_display"]
        assert "Breast Health & Breast Surgery / Oncology" in disp["en"]
        assert "Weight Management & Dietetics" in disp["en"]
        assert serializer.data["primary_specialty"]["slug"] == "cancer-specialist"

        # Tags
        tag_slugs = {t["slug"] for t in serializer.data["specialties"]}
        assert {
            "breast-health-specialist", "breast-surgeon", "cancer-specialist",
            "nutritionist-dietitian", "weight-management-specialist"
        }.issubset(tag_slugs)

        # Test queries for rank matching (exact-only filter)
        spec_rank_expectations = [
            ("cancer-care", [1, 2]),
            ("cancer-specialist", [1]),
            ("breast-surgeon", [2]),
            ("breast-health-specialist", [2]),
            ("womens-health-pregnancy", [1, 2]),
            ("general-laparoscopic-surgery", [1, 2]),
            ("nutrition-diet", [1, 2]),
            ("weight-management-specialist", [2]),
            ("nutritionist-dietitian", [2]),
        ]

        for spec_param, expected_ranks in spec_rank_expectations:
            res = api_client.get(f"/api/v1/doctors/?specialty={spec_param}")
            assert res.status_code == status.HTTP_200_OK
            data = res.data.get("results", res.data)
            matching_doc = next((d for d in data if d["id"] == str(rehana.id)), None)
            assert matching_doc is not None, f"Dr. Rehana Begum not found for spec={spec_param}"
            assert matching_doc["match_rank"] in expected_ranks, (
                f"spec={spec_param} expected rank in {expected_ranks}, got {matching_doc['match_rank']}"
            )

        # Related-only specialties no longer return her (rank-3 sibling logic removed)
        for spec_param in ("diabetes-hormones", "endocrinologist"):
            res = api_client.get(f"/api/v1/doctors/?specialty={spec_param}")
            assert res.status_code == status.HTTP_200_OK
            data = res.data.get("results", res.data)
            assert all(d["id"] != str(rehana.id) for d in data), (
                f"Dr. Rehana Begum must not match spec={spec_param} under exact-only filtering"
            )

        # Check gender and institution
        assert rehana.gender == "Female"
        assert "UNDP" in rehana.institution


@pytest.mark.django_db
class TestSerializersReadWrite:
    def test_doctor_serializer_write_and_direct_specialties(self):
        cardio = resolve_specialty_exact('cardiologist')
        ped_cardio = resolve_specialty_exact('pediatric-cardiologist')

        payload = {
            "name": "Dr. John Test",
            "bn_name": "ডাঃ জন টেস্ট",
            "qualification": "BDS (Dhaka)",
            "experience": "Senior Dental Surgeon",
            "specialty_source": "Cardiologist\nPediatric Cardiologist",
            "specialty_ids": [str(cardio.id), str(ped_cardio.id)]
        }
        ser = DoctorSerializer(data=payload)
        assert ser.is_valid(), ser.errors
        doc = ser.save()

        # Primary specialty defaulted to first specialty in specialty_ids
        assert doc.primary_specialty == cardio
        assert set(doc.specialties.all()) == {cardio, ped_cardio}
        assert doc.specialty_source == "Cardiologist\nPediatric Cardiologist"

    def test_explicit_primary_specialty_write(self):
        cardio = resolve_specialty_exact('cardiologist')
        ped_cardio = resolve_specialty_exact('pediatric-cardiologist')

        payload = {
            "name": "Dr. Explicit Primary",
            "qualification": "MBBS",
            "primary_specialty_id": str(ped_cardio.id),
            "specialty_ids": [str(cardio.id), str(ped_cardio.id)]
        }
        ser = DoctorSerializer(data=payload)
        assert ser.is_valid(), ser.errors
        doc = ser.save()

        assert doc.primary_specialty == ped_cardio
        assert set(doc.specialties.all()) == {cardio, ped_cardio}


@pytest.mark.django_db
class TestSearchMetadataAndFacets:
    def test_search_metadata_endpoint_contract(self, api_client):
        res = api_client.get("/api/v1/search/metadata/")
        assert res.status_code == status.HTTP_200_OK

        data = res.data
        assert "specialty_groups" in data
        assert "popular_specialties" in data
        assert "specialties_az" in data
        assert "provider_types" not in data
        assert "specialties" not in data

        # All 24 umbrellas must be present
        groups = data["specialty_groups"]
        assert len(groups) == 24

        for g in groups:
            assert "search_terms" not in g
            assert "label" in g
            assert "icon" in g
            for c in g["children"]:
                assert "search_terms" not in c
                assert "label" in c
                assert "formal_name" in c

    def test_zero_count_leaf_filtering(self, api_client):
        leaf = DoctorSpecialty.objects.filter(is_umbrella=False, doctors=None).first()
        if not leaf:
            leaf = resolve_specialty_exact('geneticist') or resolve_specialty_exact('occupational-therapist')

        assert leaf is not None
        res = api_client.get(f"/api/v1/doctors/?specialty={leaf.slug}")
        assert res.status_code == status.HTTP_200_OK
        meta = res.data.get("meta", {})
        assert meta.get("primary_count") == 0
        assert meta.get("match_count") == 0
