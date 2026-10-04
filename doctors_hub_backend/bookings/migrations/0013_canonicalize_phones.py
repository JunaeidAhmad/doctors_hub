"""
Data migration: canonicalize phones on Patient, all booking tables, and OTPVerification.
Dry count found 0 duplicate groups, so the merge branch is safety only.
"""
import re
from django.db import migrations


PHONE_RE = re.compile(r'^01[3-9]\d{8}$')


def _canonical(raw):
    """Same logic as core.phone.canonical_bd_phone, inlined for migration safety."""
    if raw is None:
        return None
    digits = re.sub(r'\D', '', str(raw).strip())
    if digits.startswith('8801') and len(digits) == 13:
        digits = digits[2:]
    elif len(digits) == 10 and digits.startswith('1'):
        digits = '0' + digits
    if not PHONE_RE.match(digits):
        return None  # skip un-canonicalizable
    return digits


def canonicalize_phones(apps, schema_editor):
    Patient = apps.get_model('bookings', 'Patient')
    DoctorBooking = apps.get_model('bookings', 'DoctorBooking')
    TestBooking = apps.get_model('bookings', 'TestBooking')
    HospitalServiceBooking = apps.get_model('bookings', 'HospitalServiceBooking')
    OTPVerification = apps.get_model('bookings', 'OTPVerification')

    # -- Step 1: Group patients by canonical phone and merge duplicates --
    from collections import defaultdict
    groups = defaultdict(list)
    skipped = []

    for p in Patient.objects.all().order_by('created_at'):
        canon = _canonical(p.phone)
        if canon is None:
            skipped.append(p.phone)
            continue
        groups[canon].append(p)

    if skipped:
        print(f"  [canonicalize_phones] Skipped {len(skipped)} un-canonicalizable phones: {skipped}")

    merged_count = 0
    for canon, patients in groups.items():
        keeper = patients[0]  # earliest created_at
        if keeper.phone != canon:
            keeper.phone = canon
            keeper.save(update_fields=['phone'])

        for dup in patients[1:]:
            # Repoint bookings
            DoctorBooking.objects.filter(patient=dup).update(patient=keeper)
            TestBooking.objects.filter(patient=dup).update(patient=keeper)
            HospitalServiceBooking.objects.filter(patient=dup).update(patient=keeper)
            dup.delete()
            merged_count += 1

    if merged_count:
        print(f"  [canonicalize_phones] Merged {merged_count} duplicate patient(s).")

    # -- Step 2: Canonicalize patient_phone on all booking tables --
    for Model in (DoctorBooking, TestBooking, HospitalServiceBooking):
        for b in Model.objects.exclude(patient_phone=''):
            canon = _canonical(b.patient_phone)
            if canon and canon != b.patient_phone:
                b.patient_phone = canon
                b.save(update_fields=['patient_phone'])

    # -- Step 3: Canonicalize phone on OTPVerification --
    for otp in OTPVerification.objects.all():
        canon = _canonical(otp.phone)
        if canon and canon != otp.phone:
            otp.phone = canon
            otp.save(update_fields=['phone'])


class Migration(migrations.Migration):

    dependencies = [
        ('bookings', '0012_add_patient_age_gender_to_bookings'),
    ]

    operations = [
        migrations.RunPython(canonicalize_phones, migrations.RunPython.noop),
    ]
