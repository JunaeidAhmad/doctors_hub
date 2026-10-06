#!/usr/bin/env python3
"""
P4.0.3 — Reproduce the DoctorModal chamber deletion on a test database.

What this does:
1. Creates a throwaway test database (never the dev database).
2. Seeds a superadmin and one doctor with TWO chambers (two facilities, one
   schedule each) — the exact shape the reviewer used.
3. Builds the sync payload the way DoctorModal.jsx builds it TODAY (a faithful
   port of the modal's init + submit logic, with source line references).
4. PUTs it to /api/v1/doctors/{id}/chambers/.
5. Prints the chamber list before and after.

Why chambers get deleted today (root cause):
admin init returns the lean doctor shape (key ``chambers``, DoctorListSerializer),
but DoctorModal reads ``editingDoctor.affiliations`` -> finds nothing -> the form
opens with ONE blank chamber row -> on save the blank row is either filled by the
admin (so the two real chambers are absent from the payload) or dropped by the
submit filter (payload = [] -> every chamber deleted).

Usage:
    python scripts/part4_repro_chamber_delete.py
"""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'doctors_hub_backend'))
os.chdir(os.path.join(os.path.dirname(__file__), '..', 'doctors_hub_backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

import django
django.setup()

from django.db import connection
from django.test.utils import setup_test_environment
from rest_framework.test import APIClient


# ---------------------------------------------------------------------------
# Faithful port of DoctorModal.jsx's "form state -> sync payload" as it exists
# today (before Part 4). Source: doctors_hub/src/views/AdminDashboard/
# components/modals/DoctorModal.jsx
#
#   init (edit mode):  lines 111-203  -- reads editingDoctor.affiliations
#   submit:            lines 497-535  -- builds chambersPayload
#
# The form state the modal would hold after init, for a doctor whose admin-init
# record has NO ``affiliations`` key (only ``chambers``), is exactly one blank
# row. The admin cannot save without a facility (client validation line 371-375),
# so the realistic save is: admin fills the one blank row and presses Save.
# ---------------------------------------------------------------------------

def modal_form_state_after_init(editing_doctor, all_locations_ids):
    """Port of DoctorModal's useEffect init (edit branch)."""
    all_location_ids = {str(i) for i in all_locations_ids}
    managed_affiliations = [
        a for a in (editing_doctor.get('affiliations') or [])
        if str(a.get('facility', {}).get('id') or a.get('location_id') or '') in all_location_ids
    ]
    if managed_affiliations:
        # (not reachable for the admin-init shape, see note above)
        return managed_affiliations
    # -> one blank chamber row with the invented Saturday 17:00-21:00 schedule
    return [{
        'id': 'temp-aff-0',
        'location_id': '',
        'chamber_type': 'Primary Chamber',
        'advance_booking_days': 14,
        'fee': '',
        'schedules': [{
            'id': 'temp-sched-0',
            'day_of_week': 'Saturday',
            'start_time': '17:00',
            'end_time': '21:00',
            'max_patients': 30,
            'avg_consult_minutes': 10,
        }],
    }]


def modal_submit_payload(form_state):
    """Port of DoctorModal's handleSaveDoctor chambersPayload build (lines 497-535)."""
    chambers_payload = []
    for a in form_state:
        loc_id = a.get('location_id')
        if not (loc_id and not str(loc_id).startswith('temp-')):
            continue  # filter: rows without a real facility are dropped
        chamber = {
            'location_id': a['location_id'],
            'fee': float(a['fee']),
            'chamber_type': a.get('chamber_type') or 'Primary Chamber',
            'advance_booking_days': int(a.get('advance_booking_days') or 14),
            'schedules': [
                {
                    'day_of_week': s.get('day_of_week') or 'Monday',
                    'start_time': (s['start_time'] + ':00') if len(s.get('start_time', '')) == 5 else (s.get('start_time') or '09:00:00'),
                    'end_time': (s['end_time'] + ':00') if len(s.get('end_time', '')) == 5 else (s.get('end_time') or '13:00:00'),
                    'max_patients': int(s.get('max_patients') or 30),
                    'avg_consult_minutes': int(s.get('avg_consult_minutes') or 10),
                }
                for s in (a.get('schedules') or [])
            ],
        }
        if a.get('id') and not str(a['id']).startswith('temp-'):
            chamber['id'] = a['id']
            chamber['schedules'] = [
                {
                    'day_of_week': s.get('day_of_week') or 'Monday',
                    'start_time': (s['start_time'] + ':00') if len(s.get('start_time', '')) == 5 else (s.get('start_time') or '09:00:00'),
                    'end_time': (s['end_time'] + ':00') if len(s.get('end_time', '')) == 5 else (s.get('end_time') or '13:00:00'),
                    'max_patients': int(s.get('max_patients') or 30),
                    'avg_consult_minutes': int(s.get('avg_consult_minutes') or 10),
                    **({'id': s['id']} if s.get('id') and not str(s['id']).startswith('temp-') else {}),
                }
                for s in (a.get('schedules') or [])
            ]
        chambers_payload.append(chamber)
    return chambers_payload


def print_chambers(doctor, title):
    from doctors.models import DoctorAffiliation
    print(f"\n{title}")
    affs = DoctorAffiliation.objects.filter(doctor=doctor).order_by('id')
    if not affs:
        print("  (no chambers)")
    for aff in affs:
        scheds = ', '.join(
            f"{s.day_of_week} {s.start_time:%H:%M}-{s.end_time:%H:%M}"
            for s in aff.schedules.order_by('day_of_week', 'start_time')
        ) or 'No schedule set'
        print(f"  id={aff.id} facility={aff.location.display_name!r} fee={aff.fee} "
              f"active={aff.is_active} schedules=[{scheds}]")


def main():
    setup_test_environment()
    old_config = connection.creation.create_test_db(verbosity=0, serialize=False)
    try:
        run()
    finally:
        try:
            connection.creation.destroy_test_db(old_config, verbosity=0)
        except Exception as exc:  # noqa: BLE001 — teardown must never mask the repro
            print(f"\n[teardown warning] destroy_test_db failed: {exc}")


def run():
    from django.contrib.auth import get_user_model
    from doctors.models import Doctor, DoctorAffiliation, AffiliationSchedule
    from facilities.models import Location, Hospital, Division, District, Thana

    User = get_user_model()
    admin = User.objects.create_superuser(phone_number='01700000002', password='part4-repro')
    client = APIClient()
    client.force_authenticate(user=admin)

    div, _ = Division.objects.get_or_create(name='Dhaka')
    dist, _ = District.objects.get_or_create(name='Dhaka', division=div)
    thana, _ = Thana.objects.get_or_create(name='Dhanmondi', district=dist)

    loc1 = Location.objects.create(location_type='hospital', name='Repro Hospital A',
                                   branch='Uttara', address_line='House 1, Road 1, Dhanmondi',
                                   thana=thana, is_verified=True, is_active=True)
    Hospital.objects.create(location=loc1)
    loc2 = Location.objects.create(location_type='hospital', name='Repro Hospital B',
                                   branch='Mirpur', address_line='House 2, Road 2, Mirpur',
                                   thana=thana, is_verified=True, is_active=True)
    Hospital.objects.create(location=loc2)
    # A third facility: the one the admin picks in the single blank chamber row the
    # modal opens with (the two real chambers are invisible to the form).
    loc3 = Location.objects.create(location_type='hospital', name='Repro Hospital C',
                                   branch='Bashundhara', address_line='House 3, Road 3, Bashundhara',
                                   thana=thana, is_verified=True, is_active=True)
    Hospital.objects.create(location=loc3)

    doctor = Doctor.objects.create(name='Dr. Repro Two Chambers', qualification='MBBS',
                                   experience='8 Years', is_verified=True, status='Active')
    aff1 = DoctorAffiliation.objects.create(doctor=doctor, location=loc1, fee=500,
                                            chamber_type='Primary Chamber')
    AffiliationSchedule.objects.create(affiliation=aff1, day_of_week='Monday',
                                       start_time='09:00:00', end_time='12:00:00',
                                       max_patients=25, avg_consult_minutes=10)
    aff2 = DoctorAffiliation.objects.create(doctor=doctor, location=loc2, fee=800,
                                            chamber_type='Visiting Chamber')
    AffiliationSchedule.objects.create(affiliation=aff2, day_of_week='Tuesday',
                                       start_time='14:00:00', end_time='17:00:00',
                                       max_patients=20, avg_consult_minutes=10)

    print('=' * 90)
    print('P4.0.3 — DoctorModal chamber-deletion repro (today\'s payload builder)')
    print('=' * 90)

    print_chambers(doctor, 'BEFORE (2 chambers, 1 schedule each):')

    # --- What admin init hands the modal (lean shape: ``chambers``, no ``affiliations``) ---
    init_resp = client.get('/api/v1/admin/dashboard-init/')
    admin_init_doctor = None
    for d in init_resp.data.get('doctors', []):
        if str(d.get('id')) == str(doctor.pk):
            admin_init_doctor = d
            break
    assert admin_init_doctor is not None, 'doctor not found in admin init'
    print(f"\nAdmin-init doctor record keys: {sorted(admin_init_doctor.keys())}")
    print(f"  has 'affiliations' key: {'affiliations' in admin_init_doctor}   "
          f"has 'chambers' key: {'chambers' in admin_init_doctor}")
    print(f"  chambers returned by admin init: {len(admin_init_doctor.get('chambers') or [])}")

    # --- Modal init -> form state ---
    all_locations_ids = [loc1.pk, loc2.pk, loc3.pk]  # all in the preloaded list here
    form_state = modal_form_state_after_init(admin_init_doctor, all_locations_ids)
    print(f"\nModal form state after init ({len(form_state)} row(s)):")
    for row in form_state:
        print(f"  {row}")

    # --- Admin satisfies client validation: fills the one blank row ---
    # (validation lines 370-378 require a facility and fee > 0 on every row)
    form_state[0]['location_id'] = str(loc3.pk)
    form_state[0]['fee'] = '600'

    payload = modal_submit_payload(form_state)
    print(f"\nSync payload DoctorModal sends today: {payload}")

    resp = client.put(f'/api/v1/doctors/{doctor.pk}/chambers/', {'chambers': payload}, format='json')
    print(f"\nPUT /api/v1/doctors/{doctor.pk}/chambers/ -> HTTP {resp.status_code}")
    if resp.status_code == 200:
        print(f"  response: deleted={resp.data.get('deleted')} deactivated={resp.data.get('deactivated')}")
    else:
        print(f"  response: {resp.data}")

    print_chambers(doctor, 'AFTER:')

    from doctors.models import DoctorAffiliation
    remaining = DoctorAffiliation.objects.filter(doctor=doctor).count()
    print(f"\nRESULT: chambers before=2, after={remaining} "
          f"({'CHAMBERS DELETED — bug reproduced' if remaining < 2 else 'nothing deleted'})")


if __name__ == '__main__':
    main()
