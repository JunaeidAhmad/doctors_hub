import pytest
from decimal import Decimal
from rest_framework.test import APIClient
from django.core.cache import cache
from core.uuid7 import uuid7
from facilities.models import Division, District, Thana, Location
from tests.models import TestCategory, Test, FacilityTest
from tests.pricing import net_price


@pytest.fixture(autouse=True)
def clear_django_cache():
    cache.clear()
    yield
    cache.clear()


@pytest.fixture
def client():
    return APIClient()


@pytest.fixture
def base_geo(db):
    div = Division.objects.create(name="Dhaka Division", bn_name="ঢাকা", slug="dhaka-div")
    dist = District.objects.create(division=div, name="Dhaka District", bn_name="ঢাকা", slug="dhaka-dist")
    thana1 = Thana.objects.create(district=dist, name="Dhanmondi", bn_name="ধানমন্ডি", slug="dhanmondi")
    thana2 = Thana.objects.create(district=dist, name="Gulshan", bn_name="গুলশান", slug="gulshan")
    return {"div": div, "dist": dist, "thana1": thana1, "thana2": thana2}


@pytest.mark.django_db
def test_pricing_net_price_expression_and_null_safety(base_geo):
    thana = base_geo["thana1"]
    loc = Location.objects.create(name="Lab Pricing", thana=thana, location_type="diagnostic_center")
    cat = TestCategory.objects.create(name="General Lab", slug="general-lab")
    test = Test.objects.create(name="Blood Test", slug="blood-test-pricing", category=cat)

    # Discounts: 0, 10, 12.5, 33.33, and NULL
    discounts = [Decimal("0.00"), Decimal("10.00"), Decimal("12.50"), Decimal("33.33"), None]
    base_price = Decimal("1000.00")

    ft_list = []
    for d in discounts:
        ft = FacilityTest.objects.create(
            location=loc,
            test=test,
            price=base_price,
            discount_percent=d
        )
        ft_list.append(ft)
        loc = Location.objects.create(name=f"Lab Pricing {d}", thana=thana, location_type="diagnostic_center")

    annotated = FacilityTest.objects.filter(id__in=[f.id for f in ft_list]).annotate(
        net=net_price()
    )
    for ft_ann in annotated:
        expected = ft_ann.calculated_price
        assert ft_ann.net == expected


@pytest.mark.django_db
def test_grouping_by_test_id_not_name(client, base_geo):
    thana = base_geo["thana1"]
    loc = Location.objects.create(name="City Lab", thana=thana, location_type="diagnostic_center")
    cat = TestCategory.objects.create(name="Hematology", slug="hematology")

    # Two tests with identical name 'CBC' but different IDs/slugs
    test1 = Test.objects.create(name="CBC", slug="cbc-standard", category=cat)
    test2 = Test.objects.create(name="CBC", slug="cbc-automated", category=cat)

    FacilityTest.objects.create(location=loc, test=test1, price=400)
    FacilityTest.objects.create(location=loc, test=test2, price=600)

    res = client.get("/api/v1/facility-tests/search/")
    assert res.status_code == 200
    results = res.data["results"]
    assert len(results) == 2
    res_ids = {r["id"] for r in results}
    assert res_ids == {str(test1.id), str(test2.id)}


@pytest.mark.django_db
def test_two_branches_same_lab_both_appear(client, base_geo):
    thana1 = base_geo["thana1"]
    thana2 = base_geo["thana2"]

    loc_branch1 = Location.objects.create(name="Popular Diagnostic", branch="Dhanmondi", thana=thana1, location_type="diagnostic_center")
    loc_branch2 = Location.objects.create(name="Popular Diagnostic", branch="Gulshan", thana=thana2, location_type="diagnostic_center")

    cat = TestCategory.objects.create(name="Imaging", slug="imaging")
    test = Test.objects.create(name="USG Whole Abdomen", slug="usg-whole-abdomen", category=cat)

    FacilityTest.objects.create(location=loc_branch1, test=test, price=1500)
    FacilityTest.objects.create(location=loc_branch2, test=test, price=1600)

    res = client.get("/api/v1/facility-tests/search/")
    assert res.status_code == 200
    assert len(res.data["results"]) == 1
    test_group = res.data["results"][0]
    assert test_group["id"] == str(test.id)
    assert len(test_group["offerings"]) == 2

    branch_names = [o["facility"]["branch"] for o in test_group["offerings"]]
    assert "Dhanmondi" in branch_names
    assert "Gulshan" in branch_names


@pytest.mark.django_db
def test_testcat_exact_and_near_miss(client, base_geo):
    thana = base_geo["thana1"]
    loc = Location.objects.create(name="Scan Lab", thana=thana, location_type="diagnostic_center")
    cat = TestCategory.objects.create(name="CT Scan", slug="ct-scan")
    test = Test.objects.create(name="Brain CT", slug="brain-ct", category=cat)
    FacilityTest.objects.create(location=loc, test=test, price=4000)

    # Near-miss slug 'ct' must return 0
    res_near = client.get("/api/v1/facility-tests/search/?testcat=ct")
    assert res_near.status_code == 200
    assert len(res_near.data["results"]) == 0

    # Exact slug 'ct-scan' returns the test
    res_exact_slug = client.get("/api/v1/facility-tests/search/?testcat=ct-scan")
    assert res_exact_slug.status_code == 200
    assert len(res_exact_slug.data["results"]) == 1

    # Exact UUID returns the test
    res_exact_uuid = client.get(f"/api/v1/facility-tests/search/?testcat={cat.id}")
    assert res_exact_uuid.status_code == 200
    assert len(res_exact_uuid.data["results"]) == 1

    # Alias 'category' param works identically
    res_alias = client.get("/api/v1/facility-tests/search/?category=ct-scan")
    assert res_alias.status_code == 200
    assert len(res_alias.data["results"]) == 1


@pytest.mark.django_db
def test_geo_by_each_id_level(client, base_geo):
    div = base_geo["div"]
    dist = base_geo["dist"]
    thana1 = base_geo["thana1"]
    thana2 = base_geo["thana2"]

    loc1 = Location.objects.create(name="Loc One", thana=thana1, location_type="diagnostic_center")
    loc2 = Location.objects.create(name="Loc Two", thana=thana2, location_type="diagnostic_center")

    cat = TestCategory.objects.create(name="General", slug="general")
    t1 = Test.objects.create(name="Test One", slug="test-one", category=cat)
    t2 = Test.objects.create(name="Test Two", slug="test-two", category=cat)

    FacilityTest.objects.create(location=loc1, test=t1, price=100)
    FacilityTest.objects.create(location=loc2, test=t2, price=200)

    # Division ID
    res_div = client.get(f"/api/v1/facility-tests/search/?division_id={div.id}")
    assert res_div.status_code == 200
    assert len(res_div.data["results"]) == 2

    # District ID
    res_dist = client.get(f"/api/v1/facility-tests/search/?district_id={dist.id}")
    assert res_dist.status_code == 200
    assert len(res_dist.data["results"]) == 2

    # Thana ID
    res_thana1 = client.get(f"/api/v1/facility-tests/search/?thana_id={thana1.id}")
    assert res_thana1.status_code == 200
    assert len(res_thana1.data["results"]) == 1
    assert res_thana1.data["results"][0]["id"] == str(t1.id)

    # Location ID
    res_loc = client.get(f"/api/v1/facility-tests/search/?location_id={loc2.id}")
    assert res_loc.status_code == 200
    assert len(res_loc.data["results"]) == 1
    assert res_loc.data["results"][0]["id"] == str(t2.id)


@pytest.mark.django_db
def test_fulfillment_and_ownership(client, base_geo):
    thana = base_geo["thana1"]
    loc_priv = Location.objects.create(name="Private Lab", thana=thana, location_type="diagnostic_center", ownership_type="private")
    loc_gov = Location.objects.create(name="Gov Lab", thana=thana, location_type="diagnostic_center", ownership_type="government")

    cat = TestCategory.objects.create(name="Pathology", slug="pathology")
    test = Test.objects.create(name="Blood Sugar", slug="blood-sugar", category=cat)

    # Offering 1: home collection at private lab
    FacilityTest.objects.create(location=loc_priv, test=test, price=150, home_sample_collection=True)
    # Offering 2: center only at gov lab
    FacilityTest.objects.create(location=loc_gov, test=test, price=50, home_sample_collection=False)

    # Fulfillment: home
    res_home = client.get("/api/v1/facility-tests/search/?fulfillment=home")
    assert res_home.status_code == 200
    assert len(res_home.data["results"][0]["offerings"]) == 1
    assert res_home.data["results"][0]["offerings"][0]["home_sample_collection"] is True

    # Fulfillment: center
    res_center = client.get("/api/v1/facility-tests/search/?fulfillment=center")
    assert res_center.status_code == 200
    assert len(res_center.data["results"][0]["offerings"]) == 1
    assert res_center.data["results"][0]["offerings"][0]["home_sample_collection"] is False

    # Ownership: private
    res_priv = client.get("/api/v1/facility-tests/search/?ownership=private")
    assert res_priv.status_code == 200
    assert len(res_priv.data["results"][0]["offerings"]) == 1
    assert res_priv.data["results"][0]["offerings"][0]["facility"]["ownership_type"] == "private"

    # Ownership: government
    res_gov = client.get("/api/v1/facility-tests/search/?ownership=government")
    assert res_gov.status_code == 200
    assert len(res_gov.data["results"][0]["offerings"]) == 1
    assert res_gov.data["results"][0]["offerings"][0]["facility"]["ownership_type"] == "government"


@pytest.mark.django_db
def test_inactive_and_unavailable_excluded(client, base_geo):
    thana = base_geo["thana1"]
    cat_active = TestCategory.objects.create(name="Active Cat", slug="active-cat", is_active=True)
    cat_inactive = TestCategory.objects.create(name="Inactive Cat", slug="inactive-cat", is_active=False)

    loc_active = Location.objects.create(name="Active Lab 1", thana=thana, location_type="diagnostic_center", is_active=True)
    loc_active2 = Location.objects.create(name="Active Lab 2", thana=thana, location_type="diagnostic_center", is_active=True)
    loc_inactive = Location.objects.create(name="Inactive Lab", thana=thana, location_type="diagnostic_center", is_active=False)

    t_active = Test.objects.create(name="Active Test", slug="active-test", category=cat_active, is_active=True)
    t_inactive = Test.objects.create(name="Inactive Test", slug="inactive-test", category=cat_active, is_active=False)
    t_cat_inactive = Test.objects.create(name="Under Inactive Cat", slug="under-inactive-cat", category=cat_inactive, is_active=True)

    # Normal available offering
    ft1 = FacilityTest.objects.create(location=loc_active, test=t_active, price=100, is_available=True)
    # Unavailable offering at loc_active2
    ft_unavail = FacilityTest.objects.create(location=loc_active2, test=t_active, price=80, is_available=False)
    # Offering with inactive location
    FacilityTest.objects.create(location=loc_inactive, test=t_active, price=90, is_available=True)
    # Offering with inactive test
    FacilityTest.objects.create(location=loc_active, test=t_inactive, price=100, is_available=True)
    # Offering under inactive category
    FacilityTest.objects.create(location=loc_active, test=t_cat_inactive, price=100, is_available=True)

    res = client.get("/api/v1/facility-tests/search/")
    assert res.status_code == 200
    assert len(res.data["results"]) == 1
    # Only active, available offering at active location with active test & category is returned
    offerings = res.data["results"][0]["offerings"]
    assert len(offerings) == 1
    assert offerings[0]["id"] == str(ft1.id)

    # When include_unavailable=true
    res_all = client.get("/api/v1/facility-tests/search/?include_unavailable=true")
    assert res_all.status_code == 200
    all_offerings = res_all.data["results"][0]["offerings"]
    assert len(all_offerings) == 2
    offering_ids = {o["id"] for o in all_offerings}
    assert str(ft1.id) in offering_ids
    assert str(ft_unavail.id) in offering_ids


@pytest.mark.django_db
def test_ordering_and_stable_tiebreak(client, base_geo):
    thana = base_geo["thana1"]
    loc = Location.objects.create(name="Sort Lab", thana=thana, location_type="diagnostic_center")
    cat = TestCategory.objects.create(name="Sort Cat", slug="sort-cat")

    t_b = Test.objects.create(name="B Test", slug="b-test", category=cat)
    t_a = Test.objects.create(name="A Test", slug="a-test", category=cat)
    t_c = Test.objects.create(name="C Test", slug="c-test", category=cat)

    # t_b min price: 200
    FacilityTest.objects.create(location=loc, test=t_b, price=200)
    # t_a min price: 100
    FacilityTest.objects.create(location=loc, test=t_a, price=100)
    # t_c min price: 300
    FacilityTest.objects.create(location=loc, test=t_c, price=300)

    # ordering=price (default)
    res_price = client.get("/api/v1/facility-tests/search/?ordering=price")
    assert res_price.status_code == 200
    ids = [r["id"] for r in res_price.data["results"]]
    assert ids == [str(t_a.id), str(t_b.id), str(t_c.id)]

    # ordering=-price
    res_price_desc = client.get("/api/v1/facility-tests/search/?ordering=-price")
    assert res_price_desc.status_code == 200
    ids_desc = [r["id"] for r in res_price_desc.data["results"]]
    assert ids_desc == [str(t_c.id), str(t_b.id), str(t_a.id)]

    # ordering=name
    res_name = client.get("/api/v1/facility-tests/search/?ordering=name")
    assert res_name.status_code == 200
    ids_name = [r["id"] for r in res_name.data["results"]]
    assert ids_name == [str(t_a.id), str(t_b.id), str(t_c.id)]

    # ordering=-name
    res_name_desc = client.get("/api/v1/facility-tests/search/?ordering=-name")
    assert res_name_desc.status_code == 200
    ids_name_desc = [r["id"] for r in res_name_desc.data["results"]]
    assert ids_name_desc == [str(t_c.id), str(t_b.id), str(t_a.id)]


@pytest.mark.django_db
def test_pagination_and_page_past_end(client, base_geo):
    thana = base_geo["thana1"]
    loc = Location.objects.create(name="Page Lab", thana=thana, location_type="diagnostic_center")
    cat = TestCategory.objects.create(name="Page Cat", slug="page-cat")

    for i in range(10):
        t = Test.objects.create(name=f"Page Test {i:02d}", slug=f"page-test-{i:02d}", category=cat)
        FacilityTest.objects.create(location=loc, test=t, price=100 + i)

    # Page 1, page_size 4 -> 4 results, total_pages 3
    res_p1 = client.get("/api/v1/facility-tests/search/?page=1&page_size=4")
    assert res_p1.status_code == 200
    assert res_p1.data["count"] == 10
    assert res_p1.data["total_pages"] == 3
    assert res_p1.data["page"] == 1
    assert len(res_p1.data["results"]) == 4

    # Page 99 past end -> 200 OK, empty results, count preserved
    res_past = client.get("/api/v1/facility-tests/search/?page=99&page_size=4")
    assert res_past.status_code == 200
    assert res_past.data["count"] == 10
    assert res_past.data["total_pages"] == 3
    assert len(res_past.data["results"]) == 0


@pytest.mark.django_db
def test_facets_exclude_own_dimension(client, base_geo):
    thana = base_geo["thana1"]
    loc_priv1 = Location.objects.create(name="Priv 1", thana=thana, location_type="diagnostic_center", ownership_type="private")
    loc_priv2 = Location.objects.create(name="Priv 2", thana=thana, location_type="diagnostic_center", ownership_type="private")
    loc_gov = Location.objects.create(name="Gov 1", thana=thana, location_type="diagnostic_center", ownership_type="government")

    cat = TestCategory.objects.create(name="Facet Cat", slug="facet-cat")
    t = Test.objects.create(name="Facet Test", slug="facet-test", category=cat)

    # Priv 1: home collection
    FacilityTest.objects.create(location=loc_priv1, test=t, price=100, home_sample_collection=True)
    # Priv 2: center only
    FacilityTest.objects.create(location=loc_priv2, test=t, price=100, home_sample_collection=False)
    # Gov: center only
    FacilityTest.objects.create(location=loc_gov, test=t, price=50, home_sample_collection=False)

    # Filter ownership=private:
    # Results only show private offerings (2 offerings at 2 locations).
    # Ownership facet must NOT exclude government (it must show private: 2, government: 1)!
    res_priv = client.get("/api/v1/facility-tests/search/?ownership=private")
    assert res_priv.status_code == 200
    facets = res_priv.data["facets"]
    assert facets["ownership"]["private"] == 2
    assert facets["ownership"]["government"] == 1

    # Filter fulfillment=home:
    # Results only show home offerings (1 offering at priv1).
    # Fulfillment facet must NOT exclude center (it must show home: 1, center: 2)!
    res_home = client.get("/api/v1/facility-tests/search/?fulfillment=home")
    assert res_home.status_code == 200
    facets_home = res_home.data["facets"]
    assert facets_home["fulfillment"]["home"] == 1
    assert facets_home["fulfillment"]["center"] == 2


@pytest.mark.django_db
def test_offering_at_60th_location_is_reachable(client, base_geo):
    thana = base_geo["thana1"]
    cat = TestCategory.objects.create(name="Scale Cat", slug="scale-cat")
    t = Test.objects.create(name="Scalable Test", slug="scalable-test", category=cat)

    # Create 60 locations offering this test
    for i in range(60):
        loc = Location.objects.create(name=f"Lab #{i:03d}", thana=thana, location_type="diagnostic_center")
        FacilityTest.objects.create(location=loc, test=t, price=100 + i)

    res = client.get("/api/v1/facility-tests/search/?page=1&page_size=10")
    assert res.status_code == 200
    assert res.data["count"] == 1
    test_result = res.data["results"][0]
    assert test_result["location_count"] == 60
    assert test_result["offering_count"] == 60
    # All 60 offerings are attached
    assert len(test_result["offerings"]) == 60


@pytest.mark.django_db
def test_assert_num_queries_bounds(client, base_geo, django_assert_num_queries):
    thana = base_geo["thana1"]
    cat = TestCategory.objects.create(name="Perf Cat", slug="perf-cat")

    for i in range(10):
        loc = Location.objects.create(name=f"Perf Lab {i}", thana=thana, location_type="diagnostic_center", ownership_type="private")
        t = Test.objects.create(name=f"Perf Test {i}", slug=f"perf-test-{i}", category=cat)
        FacilityTest.objects.create(location=loc, test=t, price=100, home_sample_collection=(i % 2 == 0))

    # Assert queries for 1 page is <= 5 queries
    with django_assert_num_queries(5):
        res = client.get("/api/v1/facility-tests/search/?page_size=4")
        assert res.status_code == 200
        assert len(res.data["results"]) == 4
