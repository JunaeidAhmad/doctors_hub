import pytest
from rest_framework import status
from rest_framework.test import APIClient
from django.core.cache import cache
from django.core.management import call_command

from doctors.models import DoctorSpecialty
from doctors.services.specialty_resolver import resolve_specialty_exact
from tests.factories import DoctorAffiliationFactory, DoctorFactory, LocationFactory


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture(autouse=True)
def _setup_taxonomy_and_cache():
    if DoctorSpecialty.objects.filter(is_umbrella=True).count() < 24:
        call_command('load_taxonomy', file='doctors/fixtures/taxonomy_v3.yaml')
    cache.clear()
    yield
    cache.clear()


def _make_doctor(name, primary, secondary=(), **kwargs):
    doc = DoctorFactory(name=name, primary_specialty=primary, **kwargs)
    doc.specialties.set([primary] + list(secondary))
    return doc


@pytest.mark.django_db
class TestRelatedSpecialistsEndpoint:
    URL = '/api/v1/doctors/related/'

    def test_excludes_direct_matches_of_the_chosen_specialty(self, api_client):
        allergy = resolve_specialty_exact('allergy-immunologist')
        derm = resolve_specialty_exact('dermatologist')
        assert allergy and derm

        doc_direct = _make_doctor("Dr. Direct Allergy", allergy, is_verified=True)
        doc_related = _make_doctor("Dr. Related Derma", derm, is_verified=True)

        res = api_client.get(self.URL, {'specialty': 'allergy-immunologist'})
        assert res.status_code == status.HTTP_200_OK
        related_ids = {r['id'] for r in res.data['results']}
        assert str(doc_related.id) in related_ids
        assert str(doc_direct.id) not in related_ids

        main = api_client.get('/api/v1/doctors/', {'specialty': 'allergy-immunologist'})
        main_ids = {r['id'] for r in main.data.get('results', main.data)}
        assert related_ids.isdisjoint(main_ids), "related block overlaps the main list"

    def test_limit_default_and_cap(self, api_client):
        derm = resolve_specialty_exact('dermatologist')
        assert derm
        for i in range(13):
            _make_doctor(f"Dr. Limit {i}", derm, is_verified=True)

        res_default = api_client.get(self.URL, {'specialty': 'allergy-immunologist'})
        assert res_default.status_code == status.HTTP_200_OK
        assert len(res_default.data['results']) == 6

        res_small = api_client.get(self.URL, {'specialty': 'allergy-immunologist', 'limit': 2})
        assert len(res_small.data['results']) == 2

        res_big = api_client.get(self.URL, {'specialty': 'allergy-immunologist', 'limit': 50})
        assert len(res_big.data['results']) == 12

    def test_empty_related_leaves_returns_empty_results(self, api_client):
        radiologist = resolve_specialty_exact('radiologist')
        assert radiologist
        res = api_client.get(self.URL, {'specialty': 'radiologist'})
        assert res.status_code == status.HTTP_200_OK
        assert res.data == {'specialty': 'radiologist', 'related': [], 'results': []}

    def test_location_filter_applied(self, api_client):
        derm = resolve_specialty_exact('dermatologist')
        assert derm
        loc_a = LocationFactory(name="Related Hospital A")
        loc_b = LocationFactory(name="Related Hospital B")
        doc_a = _make_doctor("Dr. Loc A", derm, is_verified=True)
        DoctorAffiliationFactory(doctor=doc_a, location=loc_a)
        doc_b = _make_doctor("Dr. Loc B", derm, is_verified=True)
        DoctorAffiliationFactory(doctor=doc_b, location=loc_b)

        res = api_client.get(self.URL, {'specialty': 'allergy-immunologist', 'hospital': str(loc_a.id)})
        assert res.status_code == status.HTTP_200_OK
        ids = {r['id'] for r in res.data['results']}
        assert str(doc_a.id) in ids
        assert str(doc_b.id) not in ids

    def test_unknown_and_missing_specialty_return_400(self, api_client):
        res = api_client.get(self.URL, {'specialty': 'no-such-specialty-xyz'})
        assert res.status_code == status.HTTP_400_BAD_REQUEST
        assert 'error' in res.data

        res2 = api_client.get(self.URL)
        assert res2.status_code == status.HTTP_400_BAD_REQUEST
        assert 'error' in res2.data

    def test_allergy_related_via_and_curated_order(self, api_client):
        allergy = resolve_specialty_exact('allergy-immunologist')
        derm = resolve_specialty_exact('dermatologist')
        chest = resolve_specialty_exact('chest-specialist')
        ent = resolve_specialty_exact('ent-specialist')
        peds_pulm = resolve_specialty_exact('pediatric-pulmonologist')
        assert all([allergy, derm, chest, ent, peds_pulm])

        _make_doctor("Dr. Chesty", chest, is_verified=True)
        _make_doctor("Dr. Entee", ent, is_verified=True)
        _make_doctor("Dr. Peds Pulm", peds_pulm, is_verified=True)
        _make_doctor("Dr. Skin First", derm, is_verified=True)
        both = _make_doctor("Dr. Skin And Chest", derm, secondary=[chest], is_verified=True)

        res = api_client.get(self.URL, {'specialty': 'allergy-immunologist'})
        assert res.status_code == status.HTTP_200_OK
        results = res.data['results']
        allowed = {'dermatologist', 'chest-specialist', 'ent-specialist', 'pediatric-pulmonologist'}
        vias = [r['related_via']['slug'] for r in results]
        assert set(vias) <= allowed

        order = {slug: i for i, slug in enumerate(
            ['dermatologist', 'chest-specialist', 'ent-specialist', 'pediatric-pulmonologist'])}
        assert vias == sorted(vias, key=lambda s: order[s]), f"related order broken: {vias}"

        both_item = next(r for r in results if r['id'] == str(both.id))
        assert both_item['related_via']['slug'] == 'dermatologist'

    def test_response_shape_list_fields_plus_related_via(self, api_client):
        derm = resolve_specialty_exact('dermatologist')
        assert derm
        _make_doctor("Dr. Shape Check", derm, is_verified=True)

        res = api_client.get(self.URL, {'specialty': 'allergy-immunologist'})
        assert res.status_code == status.HTTP_200_OK
        assert set(res.data.keys()) == {'specialty', 'related', 'results'}
        assert [r['slug'] for r in res.data['related']] == [
            'dermatologist', 'chest-specialist', 'ent-specialist', 'pediatric-pulmonologist'
        ]
        for rel in res.data['related']:
            assert set(rel.keys()) == {'slug', 'name', 'bn_name'}
        item = res.data['results'][0]
        for key in ('id', 'slug', 'name', 'bn_name', 'academic_title', 'qualification',
                    'institution', 'experience', 'image', 'gender', 'bmdc_number',
                    'rating', 'review_count', 'is_verified', 'primary_specialty',
                    'specialties', 'chambers', 'match_rank'):
            assert key in item, f"missing list field {key}"
        assert set(item['related_via'].keys()) == {'slug', 'name', 'bn_name'}
        assert item['related_via']['slug'] == 'dermatologist'
        assert item['related_via']['name'] == derm.name
        assert item['related_via']['bn_name'] == derm.bn_name
