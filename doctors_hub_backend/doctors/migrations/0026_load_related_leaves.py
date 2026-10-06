from pathlib import Path

import yaml
from django.db import migrations


def set_related_leaves(apps, schema_editor):
    DoctorSpecialty = apps.get_model('doctors', 'DoctorSpecialty')
    fixture = Path(__file__).resolve().parent.parent / 'fixtures' / 'taxonomy_v3.yaml'
    if not fixture.exists():
        return
    with open(fixture, 'r', encoding='utf-8') as f:
        tax = yaml.safe_load(f) or {}
    by_slug = {s.slug: s for s in DoctorSpecialty.objects.all()}
    for leaf in tax.get('leaves', []):
        obj = by_slug.get(leaf.get('slug'))
        if not obj:
            continue
        rel = [by_slug[s] for s in (leaf.get('related_leaves') or []) if s in by_slug]
        obj.related_leaves.set(rel)


class Migration(migrations.Migration):

    dependencies = [
        ('doctors', '0025_doctorspecialty_related_leaves'),
    ]

    operations = [
        migrations.RunPython(set_related_leaves, reverse_code=migrations.RunPython.noop),
    ]
