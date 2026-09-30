import uuid
from decimal import Decimal
from typing import Dict, Any, List, Optional, Sequence
from django.db.models import (
    Q, F, Min, Max, Count
)
from core.filters import exact_slug_or_id_q
from tests.pricing import net_price
from tests.models import FacilityTest, Test
from facilities.models import Location


def parse_params(query_params: Any) -> Dict[str, Any]:
    """
    Parse and validate query parameters for diagnostic search.
    Raises ValueError with param name on invalid value.
    """
    params: Dict[str, Any] = {}

    # 1. q
    q = query_params.get('q', '')
    if q is not None:
        params['q'] = str(q).strip()

    # 2. testcat / category
    testcat = query_params.get('testcat') or query_params.get('category')
    if testcat is not None:
        params['testcat'] = str(testcat).strip()

    # 3. Geo IDs
    for field in ('division_id', 'district_id', 'thana_id'):
        val = query_params.get(field)
        if val is not None and str(val).strip() != '' and str(val).strip().lower() != 'null':
            try:
                params[field] = int(val)
            except (ValueError, TypeError):
                raise ValueError(field)
        else:
            params[field] = None

    # 4. location_id
    loc_id = query_params.get('location_id')
    if loc_id is not None and str(loc_id).strip() != '' and str(loc_id).strip().lower() != 'null':
        try:
            params['location_id'] = uuid.UUID(str(loc_id).strip())
        except (ValueError, TypeError, AttributeError):
            raise ValueError('location_id')
    else:
        params['location_id'] = None

    # 5. fulfillment
    fulfillment = query_params.get('fulfillment')
    if fulfillment is not None and str(fulfillment).strip() != '':
        f_norm = str(fulfillment).strip().lower()
        if f_norm not in ('home', 'center', 'all'):
            raise ValueError('fulfillment')
        params['fulfillment'] = f_norm
    else:
        params['fulfillment'] = 'all'

    # 6. ownership
    ownership = query_params.get('ownership')
    if ownership is not None and str(ownership).strip() != '':
        o_norm = str(ownership).strip().lower()
        valid_ownerships = ('private', 'government', 'hospital_affiliated', 'ngo', 'all')
        if o_norm not in valid_ownerships:
            raise ValueError('ownership')
        params['ownership'] = o_norm
    else:
        params['ownership'] = 'all'

    # 7. location_type
    location_type = query_params.get('location_type')
    if location_type is not None and str(location_type).strip() != '':
        lt_norm = str(location_type).strip().lower()
        valid_lts = [t[0] for t in Location.LocationType.choices] + ['all']
        if lt_norm not in valid_lts:
            raise ValueError('location_type')
        params['location_type'] = lt_norm
    else:
        params['location_type'] = 'diagnostic_center'

    # 8. ordering
    ordering = query_params.get('ordering')
    if ordering is not None and str(ordering).strip() != '':
        ord_norm = str(ordering).strip()
        if ord_norm not in ('price', '-price', 'name', '-name'):
            raise ValueError('ordering')
        params['ordering'] = ord_norm
    else:
        params['ordering'] = 'price'

    # 9. page & page_size
    page = query_params.get('page')
    if page is not None and str(page).strip() != '':
        try:
            p_val = int(page)
            if p_val < 1:
                p_val = 1
            params['page'] = p_val
        except (ValueError, TypeError):
            raise ValueError('page')
    else:
        params['page'] = 1

    page_size = query_params.get('page_size')
    if page_size is not None and str(page_size).strip() != '':
        try:
            ps_val = int(page_size)
            if ps_val < 1:
                raise ValueError('page_size')
            params['page_size'] = min(ps_val, 50)
        except (ValueError, TypeError):
            raise ValueError('page_size')
    else:
        params['page_size'] = 4

    # 10. include_unavailable
    inc_unavail = query_params.get('include_unavailable')
    if inc_unavail is not None:
        if isinstance(inc_unavail, bool):
            params['include_unavailable'] = inc_unavail
        else:
            s_val = str(inc_unavail).strip().lower()
            if s_val in ('true', '1', 'yes'):
                params['include_unavailable'] = True
            elif s_val in ('false', '0', 'no', ''):
                params['include_unavailable'] = False
            else:
                raise ValueError('include_unavailable')
    else:
        params['include_unavailable'] = False

    # 11. offering_limit
    off_limit = query_params.get('offering_limit')
    if off_limit is not None and str(off_limit).strip() != '':
        try:
            ol_val = int(off_limit)
            if ol_val < 0:
                raise ValueError('offering_limit')
            params['offering_limit'] = ol_val
        except (ValueError, TypeError):
            raise ValueError('offering_limit')
    else:
        params['offering_limit'] = 0

    return params


def build_row_qs(params: Dict[str, Any], exclude: Optional[str] = None):
    qs = FacilityTest.objects.filter(
        location__is_active=True,
        test__is_active=True,
        test__category__is_active=True
    )
    if not params.get('include_unavailable', False):
        qs = qs.filter(is_available=True)

    qs = qs.annotate(calculated_net_price=net_price())

    # Text search
    q_val = (params.get('q') or '').strip()
    if q_val:
        qs = qs.filter(
            Q(test__name__icontains=q_val) |
            Q(test__code__icontains=q_val) |
            Q(test__sample_type__icontains=q_val) |
            Q(test__category__name__icontains=q_val) |
            Q(location__name__icontains=q_val) |
            Q(location__branch__icontains=q_val) |
            Q(location__address_line__icontains=q_val)
        )

    # Category
    if exclude != 'testcat':
        testcat = (params.get('testcat') or '').strip()
        if testcat:
            cat_q = exact_slug_or_id_q('test__category__', testcat)
            if cat_q is not None:
                qs = qs.filter(cat_q)

    # Geo filters
    if exclude != 'division_id' and params.get('division_id'):
        qs = qs.filter(location__thana__district__division_id=params['division_id'])
    if exclude != 'district_id' and params.get('district_id'):
        qs = qs.filter(location__thana__district_id=params['district_id'])
    if exclude != 'thana_id' and params.get('thana_id'):
        qs = qs.filter(location__thana_id=params['thana_id'])

    # Location ID
    if exclude != 'location_id' and params.get('location_id'):
        qs = qs.filter(location_id=params['location_id'])

    # Fulfillment
    if exclude != 'fulfillment':
        f_val = (params.get('fulfillment') or '').strip().lower()
        if f_val == 'home':
            qs = qs.filter(home_sample_collection=True)
        elif f_val == 'center':
            qs = qs.filter(home_sample_collection=False)

    # Ownership
    if exclude != 'ownership':
        o_val = (params.get('ownership') or '').strip().lower()
        if o_val and o_val != 'all':
            qs = qs.filter(location__ownership_type__iexact=o_val)

    # Location type
    if exclude != 'location_type':
        lt_val = (params.get('location_type') or 'diagnostic_center').strip().lower()
        if lt_val and lt_val != 'all':
            qs = qs.filter(location__location_type=lt_val)

    return qs


def build_grouped(row_qs, ordering: str = 'price'):
    ordering = (ordering or 'price').strip()

    grouped = row_qs.values('test_id').annotate(
        min_price=Min('calculated_net_price'),
        max_price=Max('calculated_net_price'),
        offering_count=Count('id'),
        location_count=Count('location_id', distinct=True),
        home_collection_count=Count('id', filter=Q(home_sample_collection=True)),
        test_name=F('test__name')
    )

    if ordering == 'price':
        grouped = grouped.order_by('min_price', 'test_name', 'test_id')
    elif ordering == '-price':
        grouped = grouped.order_by('-min_price', 'test_name', 'test_id')
    elif ordering == 'name':
        grouped = grouped.order_by('test_name', 'test_id')
    elif ordering == '-name':
        grouped = grouped.order_by('-test_name', 'test_id')
    else:
        grouped = grouped.order_by('min_price', 'test_name', 'test_id')

    return grouped


def hydrate(
    test_ids: Sequence[Any],
    row_qs,
    offering_limit: int = 0,
    grouped_stats: Optional[Dict[Any, Dict[str, Any]]] = None
) -> List[Test]:
    if not test_ids:
        return []

    facility_tests = (
        row_qs
        .filter(test_id__in=test_ids)
        .select_related('test__category', 'location__thana__district__division')
        .order_by('location__name', 'id')
    )

    test_map: Dict[Any, Test] = {}
    for ft in facility_tests:
        tid = ft.test_id
        if tid not in test_map:
            t = ft.test
            t.matching_offerings = []
            test_map[tid] = t
        test_map[tid].matching_offerings.append(ft)

    ordered_tests: List[Test] = []
    for tid in test_ids:
        if tid in test_map:
            t = test_map[tid]
            if offering_limit and offering_limit > 0:
                t.matching_offerings = t.matching_offerings[:offering_limit]

            if grouped_stats and tid in grouped_stats:
                st = grouped_stats[tid]
                t.min_price = f"{st.get('min_price', 0):.2f}"
                t.max_price = f"{st.get('max_price', 0):.2f}"
                t.offering_count = st.get('offering_count', 0)
                t.location_count = st.get('location_count', 0)
                t.home_collection_count = st.get('home_collection_count', 0)
            else:
                prices = [o.calculated_price for o in t.matching_offerings]
                min_p = min(prices) if prices else Decimal('0.00')
                max_p = max(prices) if prices else Decimal('0.00')
                t.min_price = f"{min_p:.2f}"
                t.max_price = f"{max_p:.2f}"
                t.offering_count = len(t.matching_offerings)
                t.location_count = len(set(o.location_id for o in t.matching_offerings))
                t.home_collection_count = sum(1 for o in t.matching_offerings if o.home_sample_collection)

            ordered_tests.append(t)

    return ordered_tests


def build_facets(params: Dict[str, Any]) -> Dict[str, Dict[str, int]]:
    # 1. Ownership facet (excludes 'ownership')
    ownership_qs = build_row_qs(params, exclude='ownership')
    ownership_rows = (
        ownership_qs
        .values('location__ownership_type')
        .annotate(location_count=Count('location_id', distinct=True))
    )
    ownership_facets = {
        'private': 0,
        'government': 0,
        'hospital_affiliated': 0,
        'ngo': 0,
    }
    for r in ownership_rows:
        otype = r['location__ownership_type']
        if otype:
            ownership_facets[otype] = r['location_count']

    # 2. Fulfillment facet (excludes 'fulfillment')
    fulfillment_qs = build_row_qs(params, exclude='fulfillment')
    fulfillment_agg = fulfillment_qs.aggregate(
        home=Count('location_id', filter=Q(home_sample_collection=True), distinct=True),
        center=Count('location_id', filter=Q(home_sample_collection=False), distinct=True)
    )
    fulfillment_facets = {
        'home': fulfillment_agg['home'] or 0,
        'center': fulfillment_agg['center'] or 0,
    }

    return {
        'ownership': ownership_facets,
        'fulfillment': fulfillment_facets,
    }
