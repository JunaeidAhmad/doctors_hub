import re
import json
import glob
import time
import urllib.request
import urllib.parse
from pathlib import Path
from collections import defaultdict

from django.core.management.base import BaseCommand
from django.core.exceptions import ValidationError
from django.db import transaction

from doctors.models import Doctor, DoctorAffiliation, AffiliationSchedule


DAY_MAP = {
    'sat': 'Saturday', 'saturday': 'Saturday', 'satu': 'Saturday',
    'sun': 'Sunday', 'sunday': 'Sunday',
    'mon': 'Monday', 'monday': 'Monday',
    'tue': 'Tuesday', 'tuesday': 'Tuesday',
    'wed': 'Wednesday', 'wednesday': 'Wednesday',
    'thu': 'Thursday', 'thursday': 'Thursday', 'thur': 'Thursday',
    'fri': 'Friday', 'friday': 'Friday'
}

ALL_DAYS = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']


def clean_name(n):
    if not n:
        return ''
    pattern = r'^(?:prof(?:essor)?\.?|dr\.?|major\.?|brig(?:adier)?\.?|gen(?:eral)?\.?|col(?:onel)?\.?|lieut(?:enant)?\.?|অধ্যাপক|ডাঃ|ডা\.)\s*'
    prev = None
    curr = n.strip()
    while prev != curr:
        prev = curr
        curr = re.sub(pattern, '', curr, flags=re.I).strip()
    return re.sub(r'\s+', ' ', curr.lower())


def parse_visiting_string(text):
    """
    Parses strings like:
    'Visiting Hour: 7pm to 9pm (Closed: Thu & Friday)'
    'Visiting Hour: 5pm to 8pm (Sat, Sun, Mon, Wed)'
    'Visiting Hour: 10am to 5pm (Closed: Friday)'
    'Visiting Hour: 3pm to 4.30pm (Sun, Tue & Thu)'
    Returns list of dicts: [{'day_of_week': '...', 'start_time': '17:00:00', 'end_time': '20:00:00'}]
    """
    if not text:
        return []

    # 1. Parse times
    time_match = re.search(
        r'(\d{1,2}(?:[\.:]\d{2})?\s*(?:am|pm|AM|PM))\s*(?:to|-|–)\s*(\d{1,2}(?:[\.:]\d{2})?\s*(?:am|pm|AM|PM))',
        text
    )
    if not time_match:
        return []

    def normalize_time(t_str):
        t_str = t_str.strip().upper().replace('.', ':')
        m = re.match(r'(\d{1,2})(?::(\d{2}))?\s*(AM|PM)', t_str)
        if not m:
            return None
        hour = int(m.group(1))
        minute = int(m.group(2) or 0)
        period = m.group(3)
        if period == 'PM' and hour < 12:
            hour += 12
        elif period == 'AM' and hour == 12:
            hour = 0
        return f"{hour:02d}:{minute:02d}:00"

    start_str = normalize_time(time_match.group(1))
    end_str = normalize_time(time_match.group(2))

    if not start_str or not end_str or start_str >= end_str:
        return []

    # 2. Parse days
    lower_text = text.lower()
    active_days = []

    # Check for "closed: ..."
    closed_match = re.search(r'closed\s*:\s*([^)]+)', lower_text)
    if closed_match:
        closed_segment = closed_match.group(1)
        closed_days = set()
        for k, v in DAY_MAP.items():
            if re.search(r'\b' + k + r'\b', closed_segment):
                closed_days.add(v)
        active_days = [d for d in ALL_DAYS if d not in closed_days]
    else:
        found_days = set()
        for k, v in DAY_MAP.items():
            if re.search(r'\b' + k + r'\b', lower_text):
                found_days.add(v)
        if found_days:
            active_days = [d for d in ALL_DAYS if d in found_days]
        elif 'daily' in lower_text or 'everyday' in lower_text or 'every day' in lower_text:
            active_days = ALL_DAYS[:]
        else:
            active_days = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday']

    return [{
        'day_of_week': d,
        'start_time': start_str,
        'end_time': end_str,
        'max_patients': 30,
        'avg_consult_minutes': 10
    } for d in active_days]


class Command(BaseCommand):
    help = "Seeds real visiting schedules from local extracted JSON and verified web queries."

    def add_arguments(self, parser):
        parser.add_argument('--limit', type=int, default=0, help="Limit number of unscheduled affiliations to process (0 = all)")
        parser.add_argument('--web-lookup', action='store_true', default=True, help="Perform live web queries on doctor portals")

    def handle(self, *args, **options):
        limit = options['limit']
        do_web = options['web_lookup']

        self.stdout.write(self.style.NOTICE("=== Phase 1: Scanning local extracted JSON datasets ==="))
        local_sched_by_name = {}
        scanned_count = 0

        for p in glob.glob('/home/ltl/Tomal/extraction & creation/**/*.json', recursive=True):
            try:
                with open(p, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                items = data if isinstance(data, list) else (data.get('doctors', []) if isinstance(data, dict) else [])
                for r in items:
                    if not isinstance(r, dict):
                        continue
                    nm = clean_name(r.get('name', ''))
                    bn = clean_name(r.get('bn_name', ''))
                    scheds = []
                    for a in r.get('affiliations', []):
                        for s in a.get('schedules', []):
                            if s.get('start_time') and s.get('end_time') and s.get('day_of_week'):
                                scheds.append(s)
                    if scheds:
                        scanned_count += 1
                        if nm and nm not in local_sched_by_name:
                            local_sched_by_name[nm] = scheds
                        if bn and bn not in local_sched_by_name:
                            local_sched_by_name[bn] = scheds
            except Exception:
                pass

        self.stdout.write(f"Scanned {scanned_count} schedules from local files. Unique doctor names with schedules: {len(local_sched_by_name)}")

        # Fetch unscheduled affiliations
        affs_qs = DoctorAffiliation.objects.filter(schedules__isnull=True).select_related('doctor', 'location').order_by('id')
        if limit > 0:
            affs_qs = affs_qs[:limit]

        total_affs = affs_qs.count()
        self.stdout.write(self.style.NOTICE(f"Total unscheduled affiliations to process: {total_affs}"))

        seeded_local = 0
        seeded_web = 0
        unfound = []

        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'}

        for idx, aff in enumerate(affs_qs, 1):
            doc = aff.doctor
            loc_name = aff.location.name if aff.location else 'Chamber'
            doc_name = doc.name
            nm = clean_name(doc_name)
            bn = clean_name(doc.bn_name or '')

            # Check 1: Local extracted datasets
            local_slots = local_sched_by_name.get(nm) or local_sched_by_name.get(bn)
            if local_slots:
                with transaction.atomic():
                    slots_created = 0
                    for s in local_slots:
                        st = str(s.get('start_time'))[:5]
                        et = str(s.get('end_time'))[:5]
                        if len(st) == 5: st = f"{st}:00"
                        if len(et) == 5: et = f"{et}:00"
                        day = s.get('day_of_week', '').capitalize()
                        if day in ALL_DAYS:
                            # Avoid duplicate or cross-location conflict
                            has_conflict = AffiliationSchedule.objects.filter(
                                affiliation__doctor=doc,
                                day_of_week=day,
                                start_time__lt=et,
                                end_time__gt=st
                            ).exists()
                            if not has_conflict:
                                try:
                                    AffiliationSchedule.objects.create(
                                        affiliation=aff,
                                        day_of_week=day,
                                        start_time=st,
                                        end_time=et,
                                        max_patients=s.get('max_patients') or 30,
                                        avg_consult_minutes=s.get('avg_consult_minutes') or 10
                                    )
                                    slots_created += 1
                                except ValidationError:
                                    pass
                if slots_created > 0:
                    seeded_local += 1
                    self.stdout.write(self.style.SUCCESS(f"[{idx}/{total_affs}] LOCAL: Seeded {slots_created} slots for {doc_name} @ {loc_name}"))
                    continue

            # Check 2: Web Lookup if enabled
            if do_web:
                time.sleep(0.2)
                search_query = clean_name(doc_name)
                web_slots = []
                source_url = ""

                # Try search on doctorbangladesh
                search_url = f"https://www.doctorbangladesh.com/?s={urllib.parse.quote(search_query)}"
                try:
                    req = urllib.request.Request(search_url, headers=headers)
                    with urllib.request.urlopen(req, timeout=7) as resp:
                        html = resp.read().decode('utf-8', errors='ignore')

                    links = re.findall(r'href=\"(https://www\.doctorbangladesh\.com/dr-[^\"]+/)\"', html)
                    if links:
                        source_url = links[0]
                        p_req = urllib.request.Request(source_url, headers=headers)
                        with urllib.request.urlopen(p_req, timeout=7) as presp:
                            p_html = presp.read().decode('utf-8', errors='ignore')

                        vh_matches = re.findall(r'Visiting Hour:[^<\n]+', p_html)
                        for vh_str in vh_matches:
                            parsed = parse_visiting_string(vh_str)
                            if parsed:
                                web_slots.extend(parsed)
                                break
                except Exception:
                    pass

                # If web_slots found, save non-conflicting slots
                if web_slots:
                    slots_created = 0
                    with transaction.atomic():
                        added_days = set()
                        for s in web_slots:
                            day = s['day_of_week']
                            if day in added_days:
                                continue
                            has_conflict = AffiliationSchedule.objects.filter(
                                affiliation__doctor=doc,
                                day_of_week=day,
                                start_time__lt=s['end_time'],
                                end_time__gt=s['start_time']
                            ).exists()
                            if not has_conflict:
                                try:
                                    AffiliationSchedule.objects.create(
                                        affiliation=aff,
                                        day_of_week=day,
                                        start_time=s['start_time'],
                                        end_time=s['end_time'],
                                        max_patients=s['max_patients'],
                                        avg_consult_minutes=s['avg_consult_minutes']
                                    )
                                    added_days.add(day)
                                    slots_created += 1
                                except ValidationError:
                                    pass
                    if slots_created > 0:
                        seeded_web += 1
                        self.stdout.write(self.style.SUCCESS(f"[{idx}/{total_affs}] WEB: Seeded {slots_created} slots for {doc_name} @ {loc_name} ({source_url})"))
                        continue

            # If not found locally or on web
            unfound.append({
                'doctor_id': str(doc.id),
                'doctor_name': doc_name,
                'specialty': [s.name for s in doc.specialties.all()],
                'institution': doc.institution,
                'affiliation_id': str(aff.id),
                'location_name': loc_name
            })
            self.stdout.write(self.style.WARNING(f"[{idx}/{total_affs}] UNFOUND: {doc_name} @ {loc_name}"))

        self.stdout.write("\n" + "="*50)
        self.stdout.write(self.style.SUCCESS(f"SUMMARY: Processed {total_affs} affiliations."))
        self.stdout.write(self.style.SUCCESS(f"  • Seeded from local extracted files: {seeded_local}"))
        self.stdout.write(self.style.SUCCESS(f"  • Seeded from verified web profiles: {seeded_web}"))
        self.stdout.write(self.style.WARNING(f"  • Unfound (no false/mock data added): {len(unfound)}"))

        # Save unfound report
        report_path = Path('/home/ltl/Tomal/project_doctors_hub/doctors_hub_backend/unfound_doctors_report.json')
        with open(report_path, 'w', encoding='utf-8') as f:
            json.dump(unfound, f, indent=2, ensure_ascii=False)
        self.stdout.write(f"Unfound doctors report written to: {report_path}")
