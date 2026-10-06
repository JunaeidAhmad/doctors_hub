import json
from pathlib import Path
from django.db import migrations


def backfill_specialty_data(apps, schema_editor):
    from django.core.management import call_command
    Doctor = apps.get_model('doctors', 'Doctor')
    DoctorSpecialty = apps.get_model('doctors', 'DoctorSpecialty')

    try:
        call_command('load_taxonomy')
    except Exception as e:
        print(f"Warning: load_taxonomy command returned: {e}")

    slug_to_spec = {s.slug: s for s in DoctorSpecialty.objects.all()}

    fixture_candidates = [
        Path(__file__).resolve().parent.parent / 'fixtures' / 'doctor_specialty_data.json',
        Path.cwd() / 'doctors_hub_backend' / 'doctors' / 'fixtures' / 'doctor_specialty_data.json',
        Path('/home/ltl/Tomal/project_doctors_hub/doctors_hub_backend/doctors/fixtures/doctor_specialty_data.json')
    ]
    fixture_path = None
    for c in fixture_candidates:
        if c.exists():
            fixture_path = c
            break

    if fixture_path and fixture_path.exists():
        with open(fixture_path, 'r', encoding='utf-8') as f:
            records = json.load(f)

        doctors_by_slug = {d.slug: d for d in Doctor.objects.all()}

        for rec in records:
            doc = doctors_by_slug.get(rec['slug'])
            if not doc:
                continue

            doc.specialty_source = rec.get('specialty_source', '') or ''
            doc.specialty_source_bn = rec.get('specialty_source_bn', '') or ''

            prim_slug = rec.get('primary_specialty_slug')
            prim_spec = slug_to_spec.get(prim_slug)
            if prim_spec:
                doc.primary_specialty = prim_spec

            doc.save(update_fields=['specialty_source', 'specialty_source_bn', 'primary_specialty'])

            tags = [slug_to_spec[s] for s in rec.get('specialties_slugs', []) if s in slug_to_spec]
            if tags:
                doc.specialties.set(tags)


class Migration(migrations.Migration):

    dependencies = [
        ('doctors', '0025_doctorspecialty_related_leaves'),
    ]

    operations = [
        migrations.RunPython(
            backfill_specialty_data,
            reverse_code=migrations.RunPython.noop,
        ),
    ]
