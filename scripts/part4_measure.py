#!/usr/bin/env python3
"""
P4.0.2 — Part 4 baseline measurement.

Seeds a fixed dataset on a throwaway test database, then prints query counts,
response bytes and (for search) the EXPLAIN ANALYZE plan for every endpoint
named in the Part 4 plan, Phase 0 table.

Usage:
    python scripts/part4_measure.py

Notes:
- Runs against a freshly created test database (never the dev database).
- The seed is deterministic so every later run measures the same data.
- Query counts use django.test.utils.CaptureQueriesContext.
- Payload sizes use len(response.content).
"""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'doctors_hub_backend'))
os.chdir(os.path.join(os.path.dirname(__file__), '..', 'doctors_hub_backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

import django
django.setup()

from django.core.cache import cache
from django.db import connection
from django.test.utils import CaptureQueriesContext, setup_test_environment
from rest_framework.test import APIClient

# ---------------------------------------------------------------------------
# Seed — fixed, deterministic. Plan spec: 18 doctors, 2+ chambers each,
# 60+ facilities across 3+ districts, 10+ specialties with umbrellas, some
# doctors with no fee, no experience and no address.
# ---------------------------------------------------------------------------

DIVISIONS = {
    'Dhaka': {'Dhaka': ['Dhanmondi', 'Mirpur'], 'Gazipur': ['Tongi']},
    'Chattogram': {'Chattogram': ['Panchlaish', 'Agrabad']},
    'Sylhet': {'Sylhet': ['Zindabazar']},
}

# 12 specialties: 3 umbrellas with children + 3 standalone.
SPECIALTIES = [
    ('Medicine', True), ('Cardiology', False), ('Neurology', False),
    ('Gastroenterology', False),
    ('Surgery', True), ('Orthopedics', False), ('Pediatric Surgery', False),
    ('Urology', False),
    ('Gynecology & Obstetrics', True), ('Obstetrics', False),
    ('Dermatology', False), ('Psychiatry', False), ('Pediatrics', False),
]
UMBRELLA_CHILDREN = {
    'Medicine': ['Cardiology', 'Neurology', 'Gastroenterology'],
    'Surgery': ['Orthopedics', 'Pediatric Surgery', 'Urology'],
    'Gynecology & Obstetrics': ['Obstetrics'],
}

N_FACILITIES = 62
N_DOCTORS = 18
N_DOCTORS_STAGE1 = 8


def seed_base():
    """Districts, thanas, facilities, specialties. Returns helper dicts."""
    from facilities.models import Division, District, Thana, Location, Hospital, DiagnosticCenter
    from doctors.models import DoctorSpecialty

    thanas = {}
    for div_name, districts in DIVISIONS.items():
        div, _ = Division.objects.get_or_create(name=div_name)
        for dist_name, thana_names in districts.items():
            dist, _ = District.objects.get_or_create(name=dist_name, division=div)
            for thana_name in thana_names:
                thana, _ = Thana.objects.get_or_create(name=thana_name, district=dist)
                thanas[thana_name] = thana

    thana_list = list(thanas.values())
    facilities = []
    for i in range(N_FACILITIES):
        thana = thana_list[i % len(thana_list)]
        is_hospital = (i % 2 == 0)
        loc = Location.objects.create(
            location_type=Location.LocationType.HOSPITAL if is_hospital
            else Location.LocationType.DIAGNOSTIC_CENTER,
            name=f"{'Seed Hospital' if is_hospital else 'Seed Diagnostic'} {i + 1:02d}",
            branch=f"Branch {chr(65 + (i % 4))}",
            # Every 10th facility has no address (exercises the "no address" path).
            address_line='' if (i % 10 == 9) else f"House {i + 1}, Road {i + 2}, {thana.name}",
            thana=thana,
            is_verified=True,
            is_active=True,
        )
        if is_hospital:
            Hospital.objects.create(location=loc)
        else:
            DiagnosticCenter.objects.create(location=loc)
        facilities.append(loc)

    specs = {}
    for name, is_umbrella in SPECIALTIES:
        specs[name], _ = DoctorSpecialty.objects.get_or_create(
            name=name, defaults={'is_umbrella': is_umbrella, 'bn_name': ''}
        )
    for umbrella, children in UMBRELLA_CHILDREN.items():
        for child in children:
            specs[child].parent_categories.add(specs[umbrella])

    return {'thanas': thanas, 'facilities': facilities, 'specs': specs}


def seed_doctors(base, start, count):
    """Seed doctors start..start+count-1 (0-based index) with 2-3 chambers each."""
    from doctors.models import Doctor, DoctorAffiliation, AffiliationSchedule
    from django.db.models import Q

    facilities = base['facilities']
    specs = base['specs']
    spec_names = [n for n, _ in SPECIALTIES]

    for i in range(start, start + count):
        # no experience for every 6th doctor
        experience = '' if (i % 6 == 3) else f"{(i % 15) + 2} Years"
        doc = Doctor.objects.create(
            name=f"Dr. Seed Doctor {i + 1:02d}",
            bn_name=f"ডা. সিড ডাক্তার {i + 1:02d}",
            academic_title='Prof.' if i % 4 == 0 else ('Dr.' if i % 4 == 1 else ''),
            institution=f"Seed Medical College {(i % 5) + 1}" if i % 3 != 2 else '',
            qualification='MBBS, FCPS' if i % 3 != 2 else '',
            experience=experience,
            bmdc_number='A-1234' if i == 0 else f"A-{2000 + i}",
            gender='Female' if i % 3 == 0 else 'Male',
            is_verified=True,
            status='Active',
        )
        # 2-3 chambers at distinct facilities, spread over the facility list
        n_chambers = 2 + (i % 2)
        for c in range(n_chambers):
            fac = facilities[(i * 3 + c * 7) % len(facilities)]
            # no fee for every 7th doctor's first chamber
            fee = 0 if (i % 7 == 5 and c == 0) else 300 + ((i + c) % 8) * 100
            aff = DoctorAffiliation.objects.create(
                doctor=doc, location=fac, fee=fee,
                chamber_type='Primary Chamber' if c == 0 else 'Visiting Chamber',
                advance_booking_days=14,
            )
            if c == 1 and i % 4 == 1:
                # some chambers carry no schedule at all
                continue
            AffiliationSchedule.objects.create(
                affiliation=aff,
                day_of_week=['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday'][(i + c) % 5],
                start_time='09:00:00' if c == 0 else '16:00:00',
                end_time='12:00:00' if c == 0 else '19:00:00',
                max_patients=25,
                avg_consult_minutes=10,
            )
            if c == 0:
                AffiliationSchedule.objects.create(
                    affiliation=aff,
                    day_of_week='Thursday',
                    start_time='17:00:00',
                    end_time='20:00:00',
                    max_patients=20,
                    avg_consult_minutes=10,
                )

        # primary + one extra specialty (deterministic)
        primary = specs[spec_names[i % len(spec_names)]]
        doc.primary_specialty = primary
        doc.specialties.add(primary)
        extra = specs[spec_names[(i + 3) % len(spec_names)]]
        doc.specialties.add(extra)


# ---------------------------------------------------------------------------
# Measurement helpers
# ---------------------------------------------------------------------------

def measure(client, url, label, note=''):
    cache.clear()
    with CaptureQueriesContext(connection) as ctx:
        resp = client.get(url)
    return {
        'label': label, 'url': url, 'status': resp.status_code,
        'bytes': len(resp.content), 'queries': len(ctx.captured_queries),
        'captured': list(ctx.captured_queries), 'note': note,
    }


def explain_for(captured, keyword='doctors_doctor'):
    """Return EXPLAIN (ANALYZE, BUFFERS) for the captured search SELECT.

    Picks the SELECT on doctors_doctor that carries the LIKE search filter
    (Django's SearchFilter emits UPPER(col) LIKE UPPER('%term%')), preferring the
    row-returning statement over the pagination COUNT wrapper.
    """
    candidates = [
        q['sql'] for q in captured
        if keyword in q['sql'] and q['sql'].strip().upper().startswith('SELECT')
        and 'LIKE' in q['sql'].upper()
    ]
    plain = [s for s in candidates if not s.strip().upper().startswith('SELECT COUNT')]
    chosen = (plain or candidates)
    if not chosen:
        return None, []
    sql = chosen[-1]
    with connection.cursor() as cursor:
        cursor.execute('EXPLAIN (ANALYZE, BUFFERS) ' + sql)
        return sql, [row[0] for row in cursor.fetchall()]


def print_result(r, show_extra=0):
    extra = f"  {r['note']}" if r.get('note') else ''
    print(f"{r['label']:<42} status={r['status']:<4} bytes={r['bytes']:<8} queries={r['queries']}{extra}")
    for line in show_extra and r.get('plans', []) or []:
        print(f"    {line}")


def main():
    setup_test_environment()
    old_config = connection.creation.create_test_db(verbosity=0, serialize=False)
    try:
        run()
    finally:
        try:
            connection.creation.destroy_test_db(old_config, verbosity=0)
        except Exception as exc:  # noqa: BLE001 — teardown must never mask measurements
            print(f"\n[teardown warning] destroy_test_db failed: {exc}")


def run():
    from django.contrib.auth import get_user_model
    from doctors.models import Doctor

    User = get_user_model()
    admin = User.objects.create_superuser(phone_number='01700000001', password='part4-measure')
    client = APIClient()
    client.force_authenticate(user=admin)

    print('=' * 100)
    print('PART 4 BASELINE MEASUREMENT (P4.0.2)')
    print('=' * 100)

    base = seed_base()
    seed_doctors(base, 0, N_DOCTORS_STAGE1)

    n_fac = len(base['facilities'])
    n_dist = sum(len(d) for d in DIVISIONS.values())
    print(f"\nSeed: facilities={n_fac} (districts={n_dist}), "
          f"specialties={len(SPECIALTIES)}, doctors={N_DOCTORS_STAGE1} (stage 1)")
    print(f"Doctors with no fee: indexes 5 (fee=0 on chamber 1)")
    print(f"Doctors with no experience: indexes 3, 9, 15")
    print(f"Facilities with no address: every 10th (i % 10 == 9)")
    print(f"Chambers with no schedule: doctor i%4==1, chamber 2")

    results = []

    # --- Admin init at 8 doctors ---
    r = measure(client, '/api/v1/admin/dashboard-init/', 'admin init @ 8 doctors')
    results.append(r)
    print_result(r)

    # --- stage 2: remaining doctors (18 total) ---
    seed_doctors(base, N_DOCTORS_STAGE1, N_DOCTORS - N_DOCTORS_STAGE1)
    total = Doctor.objects.count()
    print(f"\nSeed stage 2: doctors={total} total")

    r = measure(client, '/api/v1/admin/dashboard-init/', 'admin init @ 18 doctors')
    results.append(r)
    print_result(r)

    # --- specialties ---
    r = measure(client, '/api/v1/specialties/', '/api/specialties/ (cold cache)')
    results.append(r)
    print_result(r)
    # warm cache
    with CaptureQueriesContext(connection) as ctx:
        resp = client.get('/api/v1/specialties/')
    r = {'label': '/api/specialties/ (warm cache)', 'url': '/api/v1/specialties/',
         'status': resp.status_code, 'bytes': len(resp.content),
         'queries': len(ctx.captured_queries), 'captured': list(ctx.captured_queries), 'note': ''}
    results.append(r)
    print_result(r)

    # --- search metadata ---
    r = measure(client, '/api/v1/search-metadata/', 'search metadata (cold cache)')
    results.append(r)
    print_result(r)
    with CaptureQueriesContext(connection) as ctx:
        resp = client.get('/api/v1/search-metadata/')
    r = {'label': 'search metadata (warm cache)', 'url': '/api/v1/search-metadata/',
         'status': resp.status_code, 'bytes': len(resp.content),
         'queries': len(ctx.captured_queries), 'captured': list(ctx.captured_queries), 'note': ''}
    results.append(r)
    print_result(r)

    # --- doctor list ---
    r = measure(client, '/api/v1/doctors/?page_size=20', '/api/doctors/ list')
    results.append(r)
    print_result(r)

    # --- doctor search (queries + EXPLAIN) ---
    for q, label in (('card', '/api/doctors/?search=card'), ('A-1234', '/api/doctors/?search=A-1234')):
        r = measure(client, f'/api/v1/doctors/?search={q}&page_size=20', label)
        sql, plan = explain_for(r['captured'])
        r['plan'] = plan
        r['search_sql'] = sql
        results.append(r)
        print_result(r)
        if plan:
            print(f"    EXPLAIN (ANALYZE, BUFFERS) for search='{q}':")
            for line in plan:
                print(f"      {line}")
        else:
            print(f"    (no doctors_doctor SELECT captured for search='{q}')")

    # --- doctor detail ---
    doc = Doctor.objects.order_by('id').first()
    r = measure(client, f'/api/v1/doctors/{doc.pk}/', 'GET /api/doctors/{id}/')
    body = client.get(f'/api/v1/doctors/{doc.pk}/').data
    r['has_chambers_key'] = 'chambers' in body
    r['has_affiliations_key'] = 'affiliations' in body
    results.append(r)
    print_result(r)
    print(f"    detail keys include 'chambers': {r['has_chambers_key']}, "
          f"'affiliations': {r['has_affiliations_key']}")

    print('\n' + '=' * 100)
    print('SUMMARY (queries / bytes)')
    print('=' * 100)
    print(f"{'label':<42} {'status':<6} {'bytes':<10} {'queries':<8}")
    print('-' * 100)
    for r in results:
        print(f"{r['label']:<42} {r['status']:<6} {r['bytes']:<10} {r['queries']:<8}")

    # --- the exact SQL the search endpoint sends (P4.7.2 prep) ---
    print('\n' + '=' * 100)
    print('SEARCH SQL (main doctor SELECT)')
    print('=' * 100)
    for r in results:
        if 'search_sql' in r and r['search_sql']:
            print(f"\n--- {r['label']} ---")
            print(r['search_sql'])


if __name__ == '__main__':
    main()
