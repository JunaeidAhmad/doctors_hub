import re
import difflib
from django.db import models
from django.db.models import Q
from django.utils.text import slugify

BENGALI_RE = re.compile(r'[\u0980-\u09FF]')
COMPOUND_DELIMITERS_RE = re.compile(
    r'\s*(?:,|\band\b|\bএবং\b|\bও\b|\bএন্ড\b|&|/|\+)\s*',
    re.IGNORECASE
)

# Bengali character transliteration table as robust fallback
BN_TO_EN_MAP = {
    'ক': 'k', 'খ': 'kh', 'গ': 'g', 'ঘ': 'gh', 'ঙ': 'ng',
    'চ': 'ch', 'ছ': 'chh', 'জ': 'j', 'ঝ': 'jh', 'ঞ': 'n',
    'ট': 't', 'ঠ': 'th', 'ড': 'd', 'ঢ': 'dh', 'ণ': 'n',
    'ত': 't', 'থ': 'th', 'দ': 'd', 'ধ': 'dh', 'ন': 'n',
    'প': 'p', 'ফ': 'f', 'ব': 'b', 'ভ': 'bh', 'ম': 'm',
    'য': 'j', 'র': 'r', 'ল': 'l', 'শ': 'sh', 'ষ': 'sh',
    'স': 's', 'হ': 'h', 'ড়': 'r', 'ঢ়': 'rh', 'য়': 'y',
    'ৎ': 't', 'ং': 'ng', 'ঃ': '', 'ঁ': '',
    'া': 'a', 'ি': 'i', 'ী': 'ee', 'ু': 'u', 'ূ': 'oo',
    'ৃ': 'ri', 'ে': 'e', 'ৈ': 'oi', 'ো': 'o', 'ৌ': 'ou',
    '্': '', 'অ': 'o', 'আ': 'a', 'ই': 'i', 'ঈ': 'ee',
    'উ': 'u', 'ঊ': 'oo', 'ঋ': 'ri', 'এ': 'e', 'ঐ': 'oi',
    'ও': 'o', 'ঔ': 'ou',
}


def normalize_text(text):
    """Normalize text: lowercase, collapse whitespace, strip."""
    if not text:
        return ""
    return re.sub(r'\s+', ' ', str(text).strip().lower())


def detect_language(text):
    """Return 'bn' if text contains Bengali Unicode, else 'en'."""
    return 'bn' if BENGALI_RE.search(str(text)) else 'en'


def transliterate_bn(text):
    """Transliterate Bengali to Latin letters with pyavrophonetic or phonetic fallback."""
    if not text:
        return None
    try:
        from pyavrophonetic import avro
        res = avro.parse(text)
        if res:
            return res
    except Exception:
        pass

    # Built-in phonetic transliteration
    norm = normalize_text(text)
    trans = []
    for ch in norm:
        trans.append(BN_TO_EN_MAP.get(ch, ch))
    result = "".join(trans).strip()
    return result if result else None


def fuzzy_match(query, cutoff=0.75):
    """difflib fuzzy match against canonical names and aliases vocabulary."""
    from doctors.models import DoctorSpecialty, SpecialtyAlias

    norm_query = normalize_text(query)
    if not norm_query or len(norm_query) < 3:
        return []

    # 1. Compare against canonical names & canonical keys
    canonicals = list(DoctorSpecialty.objects.all())
    canonical_map = {}
    for c in canonicals:
        if c.canonical_name:
            canonical_map[normalize_text(c.canonical_name)] = c.id
        if c.name:
            canonical_map[normalize_text(c.name)] = c.id
        if c.bn_name:
            canonical_map[normalize_text(c.bn_name)] = c.id

    matches = difflib.get_close_matches(norm_query, list(canonical_map.keys()), n=3, cutoff=cutoff)
    if matches:
        return [canonical_map[m] for m in matches]

    # 2. Compare against verified alias vocabulary
    aliases = list(SpecialtyAlias.objects.filter(is_verified=True).select_related('specialty'))
    alias_map = {a.normalized: a.specialty_id for a in aliases}
    alias_matches = difflib.get_close_matches(norm_query, list(alias_map.keys()), n=3, cutoff=cutoff)
    if alias_matches:
        seen = set()
        matched_ids = []
        for m in alias_matches:
            sid = alias_map[m]
            if sid not in seen:
                seen.add(sid)
                matched_ids.append(sid)
        return matched_ids

    return []


class UnresolvedSpecialty(Exception):
    """Raised when a specialty string cannot be resolved exactly."""
    def __init__(self, raw_text):
        super().__init__(f"Unresolved specialty: {raw_text}")
        self.raw_text = raw_text


def resolve_specialty_exact(value):
    """
    Exact resolution only (no substring, no fuzzy).
    Tries, in order:
    1. UUID
    2. Node slug
    3. LegacySpecialtySlug (Phase 2 model)
    4. Normalized text of a verified alias
    5. None
    Must never use substring or fuzzy matching.
    """
    if not value:
        return None
    from doctors.models import DoctorSpecialty, SpecialtyAlias

    query_str = str(value).strip()

    # 1. UUID
    if len(query_str) == 36:
        obj = DoctorSpecialty.objects.filter(id=query_str).first()
        if obj:
            return obj

    # 2. Node slug
    node = DoctorSpecialty.objects.filter(slug__iexact=query_str).first()
    if node:
        return node


    # 4. Normalized text of a verified alias
    n = normalize_text(query_str)
    alias = SpecialtyAlias.objects.filter(normalized=n, is_verified=True).select_related('specialty').first()
    if alias:
        return alias.specialty

    # Exact canonical match on name/canonical_name/bn_name
    canonical = DoctorSpecialty.objects.filter(
        Q(name__iexact=query_str) | Q(canonical_name__iexact=query_str) | Q(bn_name__iexact=query_str)
    ).first()
    if canonical:
        return canonical

    return None


def resolve_specialty(query):
    """
    Resolve any specialty string, slug, or UUID to a single canonical DoctorSpecialty instance.
    Returns None if unresolved.
    """
    if not query:
        return None
    from doctors.models import DoctorSpecialty, SpecialtyAlias

    query_str = str(query).strip()

    # 0. Check UUID
    if len(query_str) == 36:
        obj = DoctorSpecialty.objects.filter(id=query_str).first()
        if obj:
            return obj

    # 1. Check exact slug
    slug_hit = DoctorSpecialty.objects.filter(slug__iexact=query_str).first()
    if slug_hit:
        return slug_hit

    n = normalize_text(query_str)

    # 2. Check exact alias hit
    alias = SpecialtyAlias.objects.filter(normalized=n).select_related('specialty').first()
    if alias:
        return alias.specialty

    # 3. Exact canonical match (name, canonical_name, bn_name)
    canonical = DoctorSpecialty.objects.filter(
        Q(canonical_name__iexact=query_str) |
        Q(name__iexact=query_str) |
        Q(bn_name__iexact=query_str)
    ).first()
    if canonical:
        return canonical

    # 4. Try resolve_specialty_ids
    ids = resolve_specialty_ids(query_str)
    if ids:
        return DoctorSpecialty.objects.filter(id=ids[0]).first()

    return None


def resolve_specialty_ids(query):
    """
    [SEARCH-ONLY] Used exclusively by free-text search endpoints to turn any
    query string into canonical specialty IDs. Never use for ingestion,
    data writes, or exact filtering.
    """
    if not query:
        return []
    from doctors.models import DoctorSpecialty, SpecialtyAlias

    query_str = str(query).strip()

    # 0. Check UUID
    if len(query_str) == 36:
        if DoctorSpecialty.objects.filter(id=query_str).exists():
            return [query_str]

    # Check slug
    slug_hit = list(DoctorSpecialty.objects.filter(slug__iexact=query_str).values_list('id', flat=True))
    if slug_hit:
        return slug_hit

    n = normalize_text(query_str)

    # 1. Exact alias hit
    hits = list(SpecialtyAlias.objects.filter(normalized=n).values_list('specialty_id', flat=True))
    if hits:
        return hits

    # 2. Exact match on canonical fields
    qs = list(DoctorSpecialty.objects.filter(
        Q(canonical_name__iexact=query_str) |
        Q(name__iexact=query_str) |
        Q(bn_name__iexact=query_str)
    ).values_list('id', flat=True))
    if qs:
        return qs

    # 3. Substring match on canonical fields
    qs = list(DoctorSpecialty.objects.filter(
        Q(canonical_name__icontains=query_str) |
        Q(name__icontains=query_str) |
        Q(bn_name__icontains=query_str)
    ).values_list('id', flat=True))
    if qs:
        return qs

    # 4. Transliterate Bengali query -> fuzzy Latin match
    latin = transliterate_bn(query_str)
    if latin and latin != query_str:
        fuzzy_hits = fuzzy_match(latin)
        if fuzzy_hits:
            return fuzzy_hits

    # 5. Last resort: fuzzy over vocabulary
    return fuzzy_match(query_str) or []


def parse_compound_components(raw_text):
    """
    Split a raw specialty string on compound delimiters (',', ' ও ', ' এবং ', '&', 'and', '+', '/')
    and resolve each fragment to its canonical specialty.
    Returns a list of resolved canonical DoctorSpecialty instances.
    """
    if not raw_text:
        return []

    fragments = [f.strip() for f in COMPOUND_DELIMITERS_RE.split(str(raw_text)) if f.strip()]
    if len(fragments) <= 1:
        # Simple specialty
        resolved = resolve_specialty(raw_text)
        return [resolved] if resolved else []

    resolved_components = []
    seen_ids = set()

    for frag in fragments:
        comp = resolve_specialty(frag)
        if comp and comp.id not in seen_ids:
            seen_ids.add(comp.id)
            resolved_components.append(comp)

    return resolved_components


def resolve_or_create_specialty(raw_text, is_verified=True):
    """
    Exact specialty resolver.
    Fuzzy/substring matching and auto-creation have been removed (Taxonomy v3 freeze).
    Raises UnresolvedSpecialty(raw_text) if the specialty cannot be resolved exactly.
    """
    if not raw_text or not str(raw_text).strip():
        return None

    spec = resolve_specialty_exact(raw_text)
    if spec:
        return spec

    raise UnresolvedSpecialty(raw_text)

