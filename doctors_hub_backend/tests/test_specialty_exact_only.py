import pytest
from rest_framework import status
from rest_framework.test import APIClient
from django.core.management import call_command

from doctors.models import Doctor, DoctorSpecialty
from doctors.services.specialty_resolver import resolve_specialty_exact
from tests.factories import DoctorFactory


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture(autouse=True)
def ensure_taxonomy_loaded():
    if DoctorSpecialty.objects.filter(is_umbrella=True).count() < 24:
        call_command('load_taxonomy', file='doctors/fixtures/taxonomy_v3.yaml')


def _make_doctor(name, primary, secondary=(), **kwargs):
    doc = DoctorFactory(name=name, primary_specialty=primary, **kwargs)
    doc.specialties.set([primary] + list(secondary))
    return doc


@pytest.mark.django_db
class TestExactOnlySpecialtyFilter:
    def test_allergist_filter_returns_only_direct_matches(self, api_client):
        allergy = resolve_specialty_exact('allergy-immunologist')
        derm = resolve_specialty_exact('dermatologist')
        assert allergy and derm

        doc_primary = _make_doctor("Dr. Allergy Primary", allergy, is_verified=True)
        doc_secondary = _make_doctor("Dr. Allergy Secondary", derm, secondary=[allergy], is_verified=True)
        doc_unrelated = _make_doctor("Dr. Derma Only", derm, is_verified=True)

        res = api_client.get("/api/v1/doctors/", {'specialty': 'Allergist & Immunologist'})
        assert res.status_code == status.HTTP_200_OK
        ids = {d['id'] for d in res.data.get('results', res.data)}
        assert str(doc_primary.id) in ids
        assert str(doc_secondary.id) in ids
        assert str(doc_unrelated.id) not in ids

        for d in res.data.get('results', res.data):
            primary_slug = (d.get('primary_specialty') or {}).get('slug')
            secondary_slugs = {s['slug'] for s in d.get('specialties') or []}
            assert allergy.slug == primary_slug or allergy.slug in secondary_slugs

    def test_every_leaf_returns_only_direct_matches(self, api_client):
        leaves = list(DoctorSpecialty.objects.filter(is_umbrella=False).order_by('slug'))
        assert leaves, "taxonomy leaves must exist in the test DB"
        anchor = DoctorSpecialty.objects.filter(is_umbrella=True).first()
        assert anchor is not None

        docs_by_leaf = {}
        for leaf in leaves:
            d_primary = _make_doctor(f"Dr. P {leaf.slug}", leaf, is_verified=True)
            d_secondary = _make_doctor(f"Dr. S {leaf.slug}", anchor, secondary=[leaf], is_verified=True)
            docs_by_leaf[leaf.slug] = (d_primary, d_secondary)

        outsider = _make_doctor("Dr. Outsider", anchor, is_verified=True)

        for leaf in leaves:
            res = api_client.get("/api/v1/doctors/", {'specialty': leaf.slug})
            assert res.status_code == status.HTTP_200_OK
            data = res.data.get('results', res.data)
            ids = {d['id'] for d in data}
            d_primary, d_secondary = docs_by_leaf[leaf.slug]
            assert str(d_primary.id) in ids, f"primary match missing for {leaf.slug}"
            assert str(d_secondary.id) in ids, f"secondary match missing for {leaf.slug}"
            assert str(outsider.id) not in ids, f"unrelated doctor leaked into {leaf.slug}"
            for d in data:
                primary_slug = (d.get('primary_specialty') or {}).get('slug')
                secondary_slugs = {s['slug'] for s in d.get('specialties') or []}
                assert leaf.slug == primary_slug or leaf.slug in secondary_slugs, (
                    f"{d['name']} returned for {leaf.slug} without a direct match"
                )

    def test_match_rank_1_rows_come_before_match_rank_2(self, api_client):
        cardio = resolve_specialty_exact('cardiologist')
        med = resolve_specialty_exact('medicine-specialist')
        assert cardio and med

        for i in range(3):
            _make_doctor(f"Dr. Primary {i}", cardio, is_verified=True)
            _make_doctor(f"Dr. Secondary {i}", med, secondary=[cardio], is_verified=True)

        res = api_client.get("/api/v1/doctors/", {'specialty': cardio.slug})
        assert res.status_code == status.HTTP_200_OK
        data = res.data.get('results', res.data)
        ranks = [d['match_rank'] for d in data]
        assert set(ranks) == {1, 2}
        assert ranks == sorted(ranks), f"match_rank not ordered: {ranks}"
        for d in data:
            assert d['match_rank'] in (1, 2)

    def test_meta_contains_counts_and_related_available(self, api_client):
        allergy = resolve_specialty_exact('allergy-immunologist')
        radiologist = resolve_specialty_exact('radiologist')
        assert allergy and radiologist

        _make_doctor("Dr. Meta Primary", allergy, is_verified=True)
        _make_doctor("Dr. Meta Secondary", radiologist, secondary=[allergy], is_verified=True)

        res = api_client.get("/api/v1/doctors/", {'specialty': allergy.slug})
        assert res.status_code == status.HTTP_200_OK
        meta = res.data['meta']
        for key in ('match_count', 'related_count', 'related_available',
                    'specialty', 'specialty_bn', 'slug', 'is_umbrella',
                    'primary_count', 'secondary_count'):
            assert key in meta, f"meta missing {key}"
        assert meta['related_count'] == 0
        assert meta['related_available'] is True
        assert meta['match_count'] == meta['primary_count'] + meta['secondary_count']
        assert meta['match_count'] == 2

        # A leaf with an empty related_leaves list reports related_available False
        res2 = api_client.get("/api/v1/doctors/", {'specialty': radiologist.slug})
        assert res2.status_code == status.HTTP_200_OK
        assert res2.data['meta']['related_available'] is False

    def test_umbrella_filter_returns_all_its_leaves_doctors(self, api_client):
        derm = resolve_specialty_exact('dermatologist')
        sex = resolve_specialty_exact('sexologist')
        andro = resolve_specialty_exact('andrologist')
        allergy = resolve_specialty_exact('allergy-immunologist')
        cardio = resolve_specialty_exact('cardiologist')
        assert all([derm, sex, andro, allergy, cardio])

        docs = [
            _make_doctor("Dr. Skin Derma", derm, is_verified=True),
            _make_doctor("Dr. Skin Sex", sex, is_verified=True),
            _make_doctor("Dr. Skin Andro", andro, is_verified=True),
            _make_doctor("Dr. Skin Allergy", allergy, is_verified=True),
        ]
        outsider = _make_doctor("Dr. Heart Only", cardio, is_verified=True)

        res = api_client.get("/api/v1/doctors/", {'specialty': 'Skin & Sexual Health'})
        assert res.status_code == status.HTTP_200_OK
        data = res.data.get('results', res.data)
        ids = {d['id'] for d in data}
        for doc in docs:
            assert str(doc.id) in ids, f"{doc.name} missing from umbrella filter"
        assert str(outsider.id) not in ids
        assert res.data['meta']['is_umbrella'] is True
        assert res.data['meta']['related_available'] is False
