from typing import List, Dict, Any, Optional
from django.core.cache import cache
from django.db.models import Q
from doctors.models import DoctorSpecialty, SpecialtyAlias
from doctors.services.specialty_resolver import normalize_text, detect_language


def get_cached_specialty_doctor_counts() -> Dict[Any, int]:
    cache_key = 'specialty_counts_v1'
    counts = cache.get(cache_key)
    if counts is None:
        from doctors.services.specialty_relations import specialty_doctor_counts
        counts = specialty_doctor_counts()
        cache.set(cache_key, counts, 300)
    return counts


def suggest_specialties(q: str, limit: int = 8) -> List[Dict[str, Any]]:
    """
    Suggest specialties matching `q`, ranked by:
    0: exact match
    1: starts with
    2: contains

    Ordered by (rank, -doctor_count, name).
    Deduplicated per specialty.
    """
    if not q or not q.strip():
        return []

    limit = max(1, min(int(limit), 20))
    norm_q = normalize_text(q.strip())
    if not norm_q:
        return []

    is_bn = detect_language(q) == 'bn'

    candidates: Dict[Any, Dict[str, Any]] = {}

    def consider_candidate(specialty: DoctorSpecialty, rank: int, term: str, lang: str):
        sid = specialty.id
        if sid not in candidates:
            candidates[sid] = {
                'specialty': specialty,
                'rank': rank,
                'matched_term': term,
                'match_language': lang,
            }
        else:
            if rank < candidates[sid]['rank']:
                candidates[sid]['rank'] = rank
                candidates[sid]['matched_term'] = term
                candidates[sid]['match_language'] = lang

    # 1. Exact matches (rank 0)
    aliases_exact = SpecialtyAlias.objects.filter(
        is_verified=True, normalized__iexact=norm_q
    ).select_related('specialty')[:50]
    for a in aliases_exact:
        term = a.name or a.normalized
        lang = a.language or detect_language(term)
        consider_candidate(a.specialty, 0, term, lang)

    specs_exact = DoctorSpecialty.objects.filter(
        Q(name__iexact=norm_q) |
        Q(canonical_name__iexact=norm_q) |
        Q(bn_name__iexact=norm_q) |
        Q(formal_name__iexact=norm_q)
    )[:50]
    for s in specs_exact:
        fields = [(s.bn_name, 'bn'), (s.name, 'en'), (s.canonical_name, 'en'), (s.formal_name, detect_language(s.formal_name) if s.formal_name else 'en')] if is_bn else [
            (s.name, 'en'), (s.canonical_name, 'en'), (s.formal_name, detect_language(s.formal_name) if s.formal_name else 'en'), (s.bn_name, 'bn')
        ]
        matched_term = s.name
        matched_lang = 'en'
        for val, lang in fields:
            if val and normalize_text(val) == norm_q:
                matched_term = val
                matched_lang = lang
                break
        consider_candidate(s, 0, matched_term, matched_lang)

    # 2. Starts with matches (rank 1)
    aliases_sw = SpecialtyAlias.objects.filter(
        is_verified=True, normalized__istartswith=norm_q
    ).select_related('specialty')[:50]
    for a in aliases_sw:
        term = a.name or a.normalized
        lang = a.language or detect_language(term)
        rank = 0 if normalize_text(term) == norm_q else 1
        consider_candidate(a.specialty, rank, term, lang)

    specs_sw = DoctorSpecialty.objects.filter(
        Q(name__istartswith=norm_q) |
        Q(canonical_name__istartswith=norm_q) |
        Q(bn_name__istartswith=norm_q) |
        Q(formal_name__istartswith=norm_q)
    )[:50]
    for s in specs_sw:
        fields = [(s.bn_name, 'bn'), (s.name, 'en'), (s.canonical_name, 'en'), (s.formal_name, detect_language(s.formal_name) if s.formal_name else 'en')] if is_bn else [
            (s.name, 'en'), (s.canonical_name, 'en'), (s.formal_name, detect_language(s.formal_name) if s.formal_name else 'en'), (s.bn_name, 'bn')
        ]
        matched_term = s.name
        matched_lang = 'en'
        best_r = 1
        for val, lang in fields:
            if not val:
                continue
            v_norm = normalize_text(val)
            if v_norm == norm_q:
                best_r = 0
                matched_term = val
                matched_lang = lang
                break
            elif v_norm.startswith(norm_q):
                if best_r > 1:
                    best_r = 1
                    matched_term = val
                    matched_lang = lang
        consider_candidate(s, best_r, matched_term, matched_lang)

    # 3. Contains matches (rank 2)
    aliases_co = SpecialtyAlias.objects.filter(
        is_verified=True, normalized__icontains=norm_q
    ).select_related('specialty')[:50]
    for a in aliases_co:
        term = a.name or a.normalized
        lang = a.language or detect_language(term)
        t_norm = normalize_text(term)
        rank = 0 if t_norm == norm_q else (1 if t_norm.startswith(norm_q) else 2)
        consider_candidate(a.specialty, rank, term, lang)

    specs_co = DoctorSpecialty.objects.filter(
        Q(name__icontains=norm_q) |
        Q(canonical_name__icontains=norm_q) |
        Q(bn_name__icontains=norm_q) |
        Q(formal_name__icontains=norm_q)
    )[:50]
    for s in specs_co:
        fields = [(s.bn_name, 'bn'), (s.name, 'en'), (s.canonical_name, 'en'), (s.formal_name, detect_language(s.formal_name) if s.formal_name else 'en')] if is_bn else [
            (s.name, 'en'), (s.canonical_name, 'en'), (s.formal_name, detect_language(s.formal_name) if s.formal_name else 'en'), (s.bn_name, 'bn')
        ]
        matched_term = s.name
        matched_lang = 'en'
        best_r = 2
        for val, lang in fields:
            if not val:
                continue
            v_norm = normalize_text(val)
            if v_norm == norm_q:
                best_r = 0
                matched_term = val
                matched_lang = lang
                break
            elif v_norm.startswith(norm_q):
                if best_r > 1:
                    best_r = 1
                    matched_term = val
                    matched_lang = lang
            elif norm_q in v_norm:
                if best_r > 2:
                    best_r = 2
                    matched_term = val
                    matched_lang = lang
        consider_candidate(s, best_r, matched_term, matched_lang)

    # Doctor counts from cache
    counts = get_cached_specialty_doctor_counts()

    results = []
    for sid, c in candidates.items():
        s = c['specialty']
        doc_count = counts.get(s.id, 0)
        results.append({
            'id': str(s.id),
            'slug': s.slug,
            'name': s.name,
            'bn_name': s.bn_name or '',
            'is_umbrella': bool(s.is_umbrella),
            'matched_term': c['matched_term'],
            'match_language': c['match_language'],
            'doctor_count': doc_count,
            'rank': c['rank'],
        })

    # Order by rank, -doctor_count, name
    results.sort(key=lambda x: (x['rank'], -x['doctor_count'], x['name'].lower()))

    # Remove internal rank field from output
    output = []
    for r in results[:limit]:
        item = dict(r)
        item.pop('rank', None)
        output.append(item)

    return output
