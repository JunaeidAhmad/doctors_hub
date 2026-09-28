import functools
from django.core.cache import cache
from django.db.models import Count, Q
from doctors.models import DoctorSpecialty, Doctor

TAXONOMY_VERSION_KEY = 'taxonomy_v3_version'


def get_taxonomy_version():
    return cache.get(TAXONOMY_VERSION_KEY, 1)


def bump_taxonomy_version():
    try:
        cache.incr(TAXONOMY_VERSION_KEY)
    except Exception:
        cache.set(TAXONOMY_VERSION_KEY, get_taxonomy_version() + 1)
    _cached_match_node_ids.cache_clear()
    _cached_related_node_ids.cache_clear()


def expand(ids):
    """Replace umbrella ids by the umbrella plus its children; leaf ids stay as-is."""
    if not ids:
        return set()
    nodes = DoctorSpecialty.objects.filter(id__in=ids).prefetch_related('subspecialties')
    out = set()
    for n in nodes:
        out.add(n.id)
        if n.is_umbrella:
            out.update(c.id for c in n.subspecialties.all())
    return out


@functools.lru_cache(maxsize=512)
def _cached_match_node_ids(node_id, version):
    node = DoctorSpecialty.objects.get(id=node_id)
    return frozenset(expand([node.id]))


def match_node_ids(node):
    """Nodes whose doctors count as a direct match (ranks 1–2)."""
    if not node:
        return set()
    return set(_cached_match_node_ids(node.id, get_taxonomy_version()))


@functools.lru_cache(maxsize=512)
def _cached_related_node_ids(node_id, version):
    node = DoctorSpecialty.objects.prefetch_related('parent_categories', 'related').get(id=node_id)
    direct = expand([node.id])
    if node.is_umbrella:
        rel = expand(node.related.values_list('id', flat=True))
    else:
        parents = list(node.parent_categories.all())
        siblings = DoctorSpecialty.objects.filter(parent_categories__in=parents).values_list('id', flat=True)
        own_related = expand(node.related.values_list('id', flat=True))
        parents_related = expand(DoctorSpecialty.objects.filter(related__in=parents).values_list('id', flat=True))
        rel = set(siblings) | own_related | parents_related
    return frozenset(rel - direct)


def related_node_ids(node):
    """Nodes whose doctors appear as rank 3 'related'."""
    if not node:
        return set()
    return set(_cached_related_node_ids(node.id, get_taxonomy_version()))


def specialty_doctor_counts(doc_qs=None):
    """
    Returns {node_id: count} where:
    - for a leaf: the number of distinct doctors tagged with it directly;
    - for an umbrella: the number of distinct doctors tagged with the umbrella or any of its children.
    """
    if doc_qs is None:
        doc_qs = Doctor.objects.all()

    # Leaf counts: direct doctor associations
    leaf_counts = dict(
        DoctorSpecialty.objects.filter(is_umbrella=False)
        .annotate(
            doc_count=Count('doctors', filter=Q(doctors__in=doc_qs), distinct=True)
        )
        .values_list('id', 'doc_count')
    )

    # Umbrella counts: distinct doctors in umbrella or any of its child leaves
    umbrella_counts = {}
    umbrellas = DoctorSpecialty.objects.filter(is_umbrella=True).prefetch_related('subspecialties')
    for u in umbrellas:
        child_ids = list(u.subspecialties.values_list('id', flat=True))
        all_ids = [u.id] + child_ids
        count = doc_qs.filter(specialties__in=all_ids).distinct().count()
        umbrella_counts[u.id] = count

    counts = {}
    counts.update(leaf_counts)
    counts.update(umbrella_counts)
    return counts
