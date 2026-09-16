import pytest
from rest_framework.test import APIClient
from rest_framework import status
from django.core.management import call_command

from doctors.models import Doctor, DoctorSpecialty, SpecialtyAlias
from doctors.services.specialty_resolver import (
    normalize_text,
    detect_language,
    transliterate_bn,
    resolve_specialty,
    resolve_specialty_ids,
    parse_compound_components,
    resolve_or_create_specialty
)
from accounts.models import User, Role, Permission, UserRole
from tests.factories import DoctorFactory, DoctorSpecialtyFactory, UserFactory


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def rbac_user_with_categories():
    user = UserFactory.create_facility_admin(phone_number="01799990001")
    role = Role.objects.create(name="Taxonomy Manager", scope_type=Role.ScopeType.GLOBAL)
    perm_view = Permission.objects.filter(module="categories", action="view").first()
    perm_edit = Permission.objects.filter(module="categories", action="edit").first()
    if perm_view:
        role.permissions.add(perm_view)
    if perm_edit:
        role.permissions.add(perm_edit)
    UserRole.objects.create(user=user, role=role)
    return user


@pytest.fixture
def rbac_user_read_only():
    user = UserFactory.create_facility_admin(phone_number="01799990002")
    role = Role.objects.create(name="Taxonomy Viewer", scope_type=Role.ScopeType.GLOBAL)
    perm_view = Permission.objects.filter(module="categories", action="view").first()
    if perm_view:
        role.permissions.add(perm_view)
    UserRole.objects.create(user=user, role=role)
    return user


@pytest.mark.django_db
class TestSpecialtyResolver:
    def test_normalization_and_language_detection(self):
        assert normalize_text("  Cardiology  \n  Heart  ") == "cardiology heart"
        assert normalize_text("হৃদরোগ   বিশেষজ্ঞ") == "হৃদরোগ বিশেষজ্ঞ"

        assert detect_language("Cardiology") == "en"
        assert detect_language("কার্ডিওলজি") == "bn"
        assert detect_language("হৃদরোগ") == "bn"

    def test_transliterate_bn_fallback(self):
        res = transliterate_bn("কার্ডিওলজি")
        assert res is not None
        assert len(res) > 0

    def test_resolve_exact_alias_and_canonical(self):
        # Create canonical
        cardio = DoctorSpecialty.objects.create(
            name="Cardiology",
            canonical_name="Cardiology",
            bn_name="হৃদরোগ ও কার্ডিওলজি"
        )
        cardio.components.set([cardio])

        # Create aliases
        SpecialtyAlias.objects.create(specialty=cardio, name="হৃদরোগ")
        SpecialtyAlias.objects.create(specialty=cardio, name="কার্ডিওলজি")

        # Resolution checks
        assert resolve_specialty("Cardiology") == cardio
        assert resolve_specialty("cardiology") == cardio
        assert resolve_specialty("হৃদরোগ") == cardio
        assert resolve_specialty("কার্ডিওলজি") == cardio
        assert resolve_specialty(str(cardio.id)) == cardio
        assert resolve_specialty(cardio.slug) == cardio

        ids = resolve_specialty_ids("হৃদরোগ")
        assert str(cardio.id) in [str(i) for i in ids]

    def test_compound_parsing_and_substring_trap_avoided(self):
        # Base canonical specialties
        med = DoctorSpecialty.objects.create(name="General Medicine", canonical_name="General Medicine", bn_name="মেডিসিন")
        med.components.set([med])
        SpecialtyAlias.objects.create(specialty=med, name="মেডিসিন")
        SpecialtyAlias.objects.create(specialty=med, name="Medicine")

        allergy = DoctorSpecialty.objects.create(name="Allergy & Immunology", canonical_name="Allergy & Immunology", bn_name="এলার্জি")
        allergy.components.set([allergy])
        SpecialtyAlias.objects.create(specialty=allergy, name="এলার্জি")
        SpecialtyAlias.objects.create(specialty=allergy, name="এ্যালার্জি")

        resp = DoctorSpecialty.objects.create(name="Respiratory Medicine", canonical_name="Respiratory Medicine", bn_name="বক্ষব্যাধি")
        resp.components.set([resp])
        SpecialtyAlias.objects.create(specialty=resp, name="বক্ষব্যাধি")

        neuro = DoctorSpecialty.objects.create(name="Neurology", canonical_name="Neurology", bn_name="নিউরোলজি")
        neuro.components.set([neuro])
        SpecialtyAlias.objects.create(specialty=neuro, name="নিউরোমেডিসিন")
        SpecialtyAlias.objects.create(specialty=neuro, name="Neurology")

        # 1. Compound parsing on delimited text
        compound_raw = "মেডিসিন, এলার্জি ও বক্ষব্যাধি"
        comps = parse_compound_components(compound_raw)
        comp_names = [c.name for c in comps]
        assert "General Medicine" in comp_names
        assert "Allergy & Immunology" in comp_names
        assert "Respiratory Medicine" in comp_names

        # 2. Substring trap test: নিউরোমেডিসিন contains মেডিসিন, but MUST resolve to Neurology only
        neuro_resolved = resolve_specialty("নিউরোমেডিসিন")
        assert neuro_resolved == neuro
        assert neuro_resolved != med

        # Check components of Neurology
        neuro_comps = list(neuro.components.all())
        assert med not in neuro_comps


@pytest.mark.django_db
class TestTwoTierRanking:
    def test_two_tier_doctor_search_ranking(self, api_client):
        # 1. Setup base canonicals
        med = DoctorSpecialty.objects.create(name="General Medicine", canonical_name="General Medicine", bn_name="মেডিসিন")
        med.components.set([med])
        SpecialtyAlias.objects.create(specialty=med, name="মেডিসিন")

        allergy = DoctorSpecialty.objects.create(name="Allergy & Immunology", canonical_name="Allergy & Immunology", bn_name="এলার্জি")
        allergy.components.set([allergy])

        neuro = DoctorSpecialty.objects.create(name="Neurology", canonical_name="Neurology", bn_name="নিউরোলজি")
        neuro.components.set([neuro])
        SpecialtyAlias.objects.create(specialty=neuro, name="নিউরোমেডিসিন")

        # 2. Setup compound specialty
        compound_spec = DoctorSpecialty.objects.create(
            name="Medicine & Allergy Specialist",
            canonical_name="Medicine & Allergy Specialist"
        )
        compound_spec.components.set([med, allergy])

        # 3. Create Doctors
        # Doctor A: Pure Medicine (Tier 1)
        doc_pure_med = DoctorFactory(name="Dr. Pure Medicine")
        doc_pure_med.specialties.set([med])

        # Doctor B: Compound Medicine & Allergy (Tier 2)
        doc_compound = DoctorFactory(name="Dr. Medicine Allergy")
        doc_compound.specialties.set([compound_spec])

        # Doctor C: Neurology / Neuro-medicine (Should be excluded)
        doc_neuro = DoctorFactory(name="Dr. Neurologist")
        doc_neuro.specialties.set([neuro])

        # 4. Search for 'মেডিসিন'
        res = api_client.get("/api/doctors/?specialty=মেডিসিন")
        assert res.status_code == status.HTTP_200_OK

        data = res.data.get("results", res.data) if isinstance(res.data, dict) else res.data
        doc_names = [d["name"] for d in data]

        # Verify membership
        assert "Dr. Pure Medicine" in doc_names
        assert "Dr. Medicine Allergy" in doc_names
        assert "Dr. Neurologist" not in doc_names  # Substring trap successfully avoided!

        # Verify Tier 1 is returned before Tier 2
        pure_idx = doc_names.index("Dr. Pure Medicine")
        compound_idx = doc_names.index("Dr. Medicine Allergy")
        assert pure_idx < compound_idx

        # Check match_tier serialization
        pure_doc_data = next(d for d in data if d["name"] == "Dr. Pure Medicine")
        compound_doc_data = next(d for d in data if d["name"] == "Dr. Medicine Allergy")
        assert pure_doc_data.get("match_tier") == 1
        assert compound_doc_data.get("match_tier") == 2

        # Check meta in response
        if isinstance(res.data, dict) and "meta" in res.data:
            meta = res.data["meta"]
            assert meta["specialty"] == "General Medicine"
            assert meta["tier1_count"] >= 1
            assert meta["tier2_count"] >= 1


@pytest.mark.django_db
class TestDropdownOptionsAndRBAC:
    def test_specialty_options_endpoint_returns_variations(self, api_client):
        cardio = DoctorSpecialty.objects.create(name="Cardiology", canonical_name="Cardiology")
        cardio.components.set([cardio])
        SpecialtyAlias.objects.create(specialty=cardio, name="হৃদরোগ")
        SpecialtyAlias.objects.create(specialty=cardio, name="কার্ডিওলজি")

        # GET /api/specialties/ (default public discovery) returns all verified options
        res = api_client.get("/api/specialties/")
        assert res.status_code == status.HTTP_200_OK
        data = res.data.get("results", res.data) if isinstance(res.data, dict) else res.data
        names = [item["name"] for item in data]
        assert "হৃদরোগ" in names or "কার্ডিওলজি" in names

    def test_rbac_permissions_on_specialties(self, api_client, rbac_user_with_categories, rbac_user_read_only):
        # Anonymous can read
        res_anon = api_client.get("/api/specialties/?canonical_only=true")
        assert res_anon.status_code == status.HTTP_200_OK

        # Anonymous cannot create
        res_anon_post = api_client.post("/api/specialties/", {"name": "New Specialty"})
        assert res_anon_post.status_code in (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN)

        # Read-only user cannot create
        api_client.force_authenticate(user=rbac_user_read_only)
        res_ro_post = api_client.post("/api/specialties/", {"name": "New Specialty"})
        assert res_ro_post.status_code == status.HTTP_403_FORBIDDEN

        # User with categories.edit / create can mutate
        from core.rbac import clear_user_permissions_cache
        role = rbac_user_with_categories.user_roles.first().role
        perm_create, _ = Permission.objects.get_or_create(module="categories", action="create", defaults={"codename": "categories.create", "label": "Create Categories"})
        role.permissions.add(perm_create)
        clear_user_permissions_cache(rbac_user_with_categories.id)

        api_client.force_authenticate(user=rbac_user_with_categories)
        res_auth_post = api_client.post("/api/specialties/", {"name": "Surgical Oncology", "canonical_name": "Surgical Oncology"})
        assert res_auth_post.status_code in (status.HTTP_200_OK, status.HTTP_201_CREATED)


@pytest.mark.django_db
class TestConsolidationCommand:
    def test_consolidation_command_execution_and_idempotency(self):
        # Create a doctor with a duplicate/alias specialty
        old_spec = DoctorSpecialty.objects.create(name="হৃদরোগ ক্লিনিক")
        doc = DoctorFactory(name="Dr. Heart Care")
        doc.specialties.set([old_spec])

        # Run consolidation command
        call_command("consolidate_specialties")

        # Verify old_spec was mapped to a canonical specialty
        doc.refresh_from_db()
        assert doc.specialties.count() >= 1
        spec_names = [s.name for s in doc.specialties.all()]
        assert "Cardiology" in spec_names or "General Medicine" in spec_names

        # Verify alias was preserved
        assert SpecialtyAlias.objects.filter(name="হৃদরোগ ক্লিনিক").exists()

        # Test idempotency
        call_command("consolidate_specialties")
        doc.refresh_from_db()
        assert doc.specialties.count() >= 1


@pytest.mark.django_db
class TestSpecialtyAliasEndpoints:
    def test_alias_crud_and_verify_actions(self, api_client, rbac_user_with_categories):
        cardio = DoctorSpecialty.objects.create(name="Cardiology", canonical_name="Cardiology", bn_name="হৃদরোগ")
        
        # 1. Unauthenticated can list aliases
        res_list = api_client.get("/api/specialty-aliases/")
        assert res_list.status_code == status.HTTP_200_OK

        # 2. Counts endpoint
        res_counts = api_client.get("/api/specialty-aliases/counts/")
        assert res_counts.status_code == status.HTTP_200_OK
        assert "total_aliases" in res_counts.data
        assert "unverified_aliases" in res_counts.data

        # 3. Create unverified alias with rbac user
        from core.rbac import clear_user_permissions_cache
        role = rbac_user_with_categories.user_roles.first().role
        perm_create, _ = Permission.objects.get_or_create(module="categories", action="create", defaults={"codename": "categories.create", "label": "Create Categories"})
        perm_edit, _ = Permission.objects.get_or_create(module="categories", action="edit", defaults={"codename": "categories.edit", "label": "Edit Categories"})
        role.permissions.add(perm_create, perm_edit)
        clear_user_permissions_cache(rbac_user_with_categories.id)

        api_client.force_authenticate(user=rbac_user_with_categories)
        res_create = api_client.post("/api/specialty-aliases/", {
            "specialty": str(cardio.id),
            "name": "হৃদরোগ বিশেষজ্ঞ ডাক্তার",
            "is_verified": False
        })
        assert res_create.status_code in (status.HTTP_200_OK, status.HTTP_201_CREATED)
        alias_id = res_create.data["id"]
        assert res_create.data["is_verified"] is False
        assert res_create.data["language"] == "bn"

        # 4. Verify action
        res_verify = api_client.post(f"/api/specialty-aliases/{alias_id}/verify/")
        assert res_verify.status_code == status.HTTP_200_OK
        assert res_verify.data["is_verified"] is True

        # 5. Batch verify
        alias2 = SpecialtyAlias.objects.create(specialty=cardio, name="Heart Doctor Clinic", is_verified=False)
        res_batch = api_client.post("/api/specialty-aliases/batch-verify/", {"alias_ids": [str(alias2.id)]}, format='json')
        assert res_batch.status_code == status.HTTP_200_OK
        assert res_batch.data["updated_count"] == 1
        alias2.refresh_from_db()
        assert alias2.is_verified is True

