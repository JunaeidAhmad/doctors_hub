import difflib
import os
import sys
from pathlib import Path

BACKEND = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

import django
django.setup()

from django.core.cache import cache
from rest_framework.test import APIClient

from doctors.models import Doctor, DoctorSpecialty


def norm(text):
    return ' '.join(str(text or '').lower().split())


def best_similarity(source, texts):
    src = norm(source)
    if not src:
        return 0.0, ''
    best = 0.0
    best_text = ''
    for text in texts:
        t = norm(text)
        if not t:
            continue
        if t in src:
            score = 1.0
        else:
            score = difflib.SequenceMatcher(None, t, src).ratio()
        if score > best:
            best = score
            best_text = text
    return best, best_text


def main():
    cache.clear()
    client = APIClient()
    leaves = list(DoctorSpecialty.objects.filter(is_umbrella=False).order_by('slug'))

    print('slug | exact_count | related_available | related_block_size')
    print('-' * 79)

    zero_rows = []
    for leaf in leaves:
        res = client.get('/api/v1/doctors/', {'specialty': leaf.slug}, HTTP_HOST='localhost')
        meta = res.data.get('meta', {}) if res.status_code == 200 else {}
        exact_count = meta.get('match_count', 0)
        related_available = meta.get('related_available', False)

        rel = client.get('/api/v1/doctors/related/', {'specialty': leaf.slug}, HTTP_HOST='localhost')
        block_size = len(rel.data.get('results', [])) if rel.status_code == 200 else 0

        print(f'{leaf.slug} | {exact_count} | {related_available} | {block_size}')

        if exact_count == 0:
            texts = [leaf.name, leaf.bn_name, leaf.formal_name]
            texts += list(leaf.aliases.values_list('name', flat=True))
            zero_rows.append((leaf, texts))

    if zero_rows:
        print()
        print('ZERO-COUNT LEAVES (exact count 0) — doctors whose stored specialty text looks similar')
        print('=' * 79)
        for leaf, texts in zero_rows:
            print()
            print(f'## {leaf.slug} ({leaf.name})')
            candidates = []
            for doc in Doctor.objects.exclude(specialty_source='').exclude(specialty_source=None):
                score, matched = best_similarity(f'{doc.specialty_source} {doc.specialty_source_bn}', texts)
                if score >= 0.8:
                    candidates.append((score, matched, doc))
            candidates.sort(key=lambda row: (-row[0], row[2].name))
            if not candidates:
                print('   (no similar specialty text found in doctor records)')
            for score, matched, doc in candidates[:5]:
                src = ' / '.join(part.strip() for part in (doc.specialty_source or '').splitlines() if part.strip())
                print(f'   - {doc.name} (id {doc.id})')
                print(f'     text: {src[:120]}')
                print(f'     similar to: {matched} (score {score:.2f})')


if __name__ == '__main__':
    main()
