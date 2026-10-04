import pytest
from rest_framework import status
from rest_framework.test import APIClient
from django.core.management import call_command
from facilities.models import Location, Division, District, Thana
from doctors.models import Doctor, DoctorSpecialty, SpecialtyAlias, DoctorAffiliation, AffiliationSchedule
from doctors.services.specialty_resolver import resolve_specialty_exact
from tests.factories import DoctorFactory


@pytest.fixture
def client():
    return APIClient()


@pytest.fixture(autouse=True)
def ensure_taxonomy():
    if DoctorSpecialty.objects.filter(is_umbrella=True).count() < 24:
        call_command('load_taxonomy', file='doctors/fixtures/taxonomy_v3.yaml')


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
def test_location_search_fix(client, geo_data):
    """
    P2.1.1: LocationViewSet.search_fields searches thana__name, thana__bn_name, etc.
    GET /api/locations/?search=dhan -> 200 and matches Dhanmondi location without 500 error.
    """
    loc = Location.objects.create(
        name="Dhanmondi Care Hospital",
        location_type=Location.LocationType.HOSPITAL,
        thana=geo_data["thana_dhanmondi"],
        is_active=True,
    )
    res = client.get('/api/locations/?search=dhan')
    assert res.status_code == status.HTTP_200_OK
    results = res.data if isinstance(res.data, list) else res.data.get('results', [])
    loc_ids = [str(item['id']) for item in results]
    assert str(loc.id) in loc_ids


@pytest.mark.django_db
def test_fee_max_ignored(client, geo_data):
    """
    P2.1.2: fee_max filter was removed; passing fee_max=500 is ignored and does not crash.
    """
    Doctor.objects.all().delete()
    doc = Doctor.objects.create(name="Dr. Fee Test")
    loc = Location.objects.create(
        name="General Clinic",
        thana=geo_data["thana_dhanmondi"],
        is_active=True,
    )
    DoctorAffiliation.objects.create(doctor=doc, location=loc, fee=1000)

    res = client.get('/api/doctors/?fee_max=500')
    assert res.status_code == status.HTTP_200_OK
    results = res.data.get('results', res.data)
    doc_ids = [str(d['id']) for d in results]
    assert str(doc.id) in doc_ids


@pytest.mark.django_db
def test_day_exact_matching(client, geo_data):
    """
    P2.1.3:
    day=t -> 400 {'day': ['Unknown day.']}
    day=tue -> 200, matches Tuesday
    day=Tuesday -> 200, matches Tuesday
    day=wed -> 200, does not match Tuesday schedule
    """
    Doctor.objects.all().delete()
    doc = Doctor.objects.create(name="Dr. Tuesday Specialist")
    loc = Location.objects.create(
        name="Tuesday Clinic",
        thana=geo_data["thana_dhanmondi"],
        is_active=True,
    )
    aff = DoctorAffiliation.objects.create(doctor=doc, location=loc, fee=500)
    AffiliationSchedule.objects.create(
        affiliation=aff,
        day_of_week='Tuesday',
        start_time='09:00:00',
        end_time='13:00:00',
    )

    # Invalid day -> 400
    res_bad = client.get('/api/doctors/?day=t')
    assert res_bad.status_code == status.HTTP_400_BAD_REQUEST
    assert 'day' in res_bad.data

    res_bad2 = client.get('/api/doctors/?day=xyz')
    assert res_bad2.status_code == status.HTTP_400_BAD_REQUEST

    # Valid abbreviation -> 200, matches
    res_abbr = client.get('/api/doctors/?day=tue')
    assert res_abbr.status_code == status.HTTP_200_OK
    docs = [str(d['id']) for d in res_abbr.data.get('results', res_abbr.data)]
    assert str(doc.id) in docs

    # Valid full day name -> 200, matches
    res_full = client.get('/api/doctors/?day=Tuesday')
    assert res_full.status_code == status.HTTP_200_OK
    docs = [str(d['id']) for d in res_full.data.get('results', res_full.data)]
    assert str(doc.id) in docs

    # Different day -> 200, does not match
    res_other = client.get('/api/doctors/?day=wed')
    assert res_other.status_code == status.HTTP_200_OK
    docs = [str(d['id']) for d in res_other.data.get('results', res_other.data)]
    assert str(doc.id) not in docs


@pytest.mark.django_db
def test_specialties_list_endpoint(client):
    """
    P2.1.4: /specialties/ returns one row per specialty with no alias_id,
    and list size equals DoctorSpecialty.objects.count().
    """
    total_specs = DoctorSpecialty.objects.count()
    assert total_specs > 0

    res = client.get('/api/specialties/')
    assert res.status_code == status.HTTP_200_OK
    data = res.data

    assert len(data) == total_specs
    for item in data:
        assert 'alias_id' not in item
        assert 'id' in item
        assert 'name' in item
        assert 'slug' in item
        assert 'doctor_count' in item

    # Verify canonical_only and all query params work and return same length
    res_canon = client.get('/api/specialties/?canonical_only=true')
    assert res_canon.status_code == status.HTTP_200_OK
    assert len(res_canon.data) == total_specs

    res_all = client.get('/api/specialties/?all=true')
    assert res_all.status_code == status.HTTP_200_OK
    assert len(res_all.data) == total_specs


@pytest.mark.django_db
def test_specialty_ranking_regression(client):
    """
    Ranking regression for /doctors/?specialty=:
    Set up 1 primary match, 1 secondary match, 1 related sibling, 1 unrelated doctor.
    Assert order is primary -> secondary -> sibling, and unrelated is excluded.
    Run with specialty slug, UUID, and verified alias text -> all three return same ordered list.
    """
    Doctor.objects.all().delete()

    cardio = resolve_specialty_exact('cardiologist')
    ped_cardio = resolve_specialty_exact('pediatric-cardiologist')
    med = resolve_specialty_exact('medicine-specialist')
    derm = resolve_specialty_exact('dermatologist')

    # Doctor 1: Primary match
    doc_primary = DoctorFactory(
        name="Dr. Aaron Primary",
        is_verified=True,
        primary_specialty=cardio,
        specialty_source="Cardiologist"
    )
    doc_primary.specialties.set([cardio])

    # Doctor 2: Secondary match
    doc_secondary = DoctorFactory(
        name="Dr. Brian Secondary",
        is_verified=True,
        primary_specialty=med,
        specialty_source="Medicine Specialist\nCardiologist"
    )
    doc_secondary.specialties.set([med, cardio])

    # Doctor 3: Related sibling
    doc_sibling = DoctorFactory(
        name="Dr. Cathy Sibling",
        is_verified=True,
        primary_specialty=ped_cardio,
        specialty_source="Pediatric Cardiologist"
    )
    doc_sibling.specialties.set([ped_cardio])

    # Doctor 4: Unrelated
    doc_unrelated = DoctorFactory(
        name="Dr. David Unrelated",
        is_verified=True,
        primary_specialty=derm,
        specialty_source="Dermatologist"
    )
    doc_unrelated.specialties.set([derm])

    # Verified alias
    alias, _ = SpecialtyAlias.objects.get_or_create(
        specialty=cardio,
        normalized="heart specialist",
        defaults={"name": "Heart Specialist", "is_verified": True}
    )
    if not alias.is_verified:
        alias.is_verified = True
        alias.save(update_fields=['is_verified'])

    # Test with slug, UUID, and alias
    queries = [
        f"/api/doctors/?specialty={cardio.slug}",
        f"/api/doctors/?specialty={cardio.id}",
        "/api/doctors/?specialty=Heart Specialist"
    ]

    expected_ids = [str(doc_primary.id), str(doc_secondary.id), str(doc_sibling.id)]

    for q in queries:
        res = client.get(q)
        assert res.status_code == status.HTTP_200_OK
        results = res.data.get('results', res.data)
        doc_ids = [d['id'] for d in results]

        # Verify exact membership & ordering
        assert doc_ids == expected_ids
        assert str(doc_unrelated.id) not in doc_ids

        # Verify ranks
        d_p = results[0]
        d_s = results[1]
        d_sib = results[2]

        assert d_p['match_rank'] == 1
        assert d_p['is_primary_match'] is True
        assert d_p['match_tier'] == 1

        assert d_s['match_rank'] == 2
        assert d_s['is_primary_match'] is False
        assert d_s['match_tier'] == 1

        assert d_sib['match_rank'] == 3
        assert d_sib['match_tier'] == 2


@pytest.mark.django_db
def test_specialty_suggest_alias(client):
    """
    /specialties/suggest/?q=<verified alias text> returns canonical specialty
    with matched_term set to the alias.
    """
    cardio = resolve_specialty_exact('cardiologist')
    alias, _ = SpecialtyAlias.objects.get_or_create(
        specialty=cardio,
        normalized="heart specialist",
        defaults={"name": "Heart Specialist", "is_verified": True}
    )
    if not alias.is_verified:
        alias.is_verified = True
        alias.save(update_fields=['is_verified'])

    res = client.get('/api/specialties/suggest/?q=heart specialist')
    assert res.status_code == status.HTTP_200_OK
    suggestions = res.data
    assert len(suggestions) > 0

    match = next((s for s in suggestions if s['id'] == str(cardio.id)), None)
    assert match is not None
    assert match['matched_term'].lower() == "heart specialist"
