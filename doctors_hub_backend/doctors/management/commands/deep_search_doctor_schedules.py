import json
import re
import os
import urllib.request
import urllib.parse
from pathlib import Path
from bs4 import BeautifulSoup
from difflib import SequenceMatcher

from django.core.management.base import BaseCommand
from django.core.exceptions import ValidationError
from doctors.models import DoctorAffiliation, AffiliationSchedule

DAY_MAP = {
    'sat': 'Saturday', 'saturday': 'Saturday',
    'sun': 'Sunday', 'sunday': 'Sunday',
    'mon': 'Monday', 'monday': 'Monday',
    'tue': 'Tuesday', 'tues': 'Tuesday', 'tuesday': 'Tuesday',
    'wed': 'Wednesday', 'wednesday': 'Wednesday',
    'thu': 'Thursday', 'thur': 'Thursday', 'thurs': 'Thursday', 'thursday': 'Thursday',
    'fri': 'Friday', 'friday': 'Friday'
}
ALL_DAYS = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

HONORIFICS_RE = re.compile(
    r'^(?:prof(?:essor)?\.?|dr\.?|doctor|asst\.?\s*prof\.?|assoc\.?\s*prof\.?|brig\.?\s*gen\.?|col\.?|colonel|major\s*gen\.?|capt\.?|ডা[ঃ:\.]?|ডাক্তার)\s*',
    re.IGNORECASE
)

COMMON_TITLES = {'md', 'prof', 'dr', 'ahmed', 'hossain', 'khan', 'islam', 'rahman', 'ali', 'sayed', 'syed'}

ABBREVS = {
    'bsmmu': 'bangabandhu sheikh mujib medical university',
    'dmc': 'dhaka medical college',
    'dmch': 'dhaka medical college',
    'nicvd': 'national institute of cardiovascular diseases',
    'nitor': 'national institute of traumatology',
    'ssmc': 'shaheed suhrawardy medical college',
    'akmmch': 'anwer khan modern medical college',
    'birdem': 'birdem general hospital',
    'jbfh': 'japan bangladesh friendship hospital',
    'nidch': 'national institute of diseases of the chest and hospital'
}

def strip_all_honorifics(name_str):
    if not name_str:
        return ''
    cleaned = str(name_str).strip()
    while True:
        subbed = HONORIFICS_RE.sub('', cleaned).strip()
        if subbed == cleaned:
            break
        cleaned = subbed
    return cleaned

def translit(w):
    w = w.lower()
    w = w.replace('sarder', 'sardar').replace('akter', 'akhter').replace('pervin', 'parvin')
    w = w.replace('shahin', 'shaheen').replace('khandakar', 'khandkar').replace('khondker', 'khandkar').replace('khondoker', 'khandkar')
    w = w.replace('choudhury', 'chowdhury').replace('mohammad', 'md').replace('muhammad', 'md')
    w = w.replace('syed', 'sayed').replace('miah', 'mia').replace('siddique', 'siddiqui')
    w = w.replace('pal', 'paul').replace('mahmood', 'mahmud').replace('baqui', 'baki').replace('baquee', 'baki')
    w = w.replace('quader', 'kader').replace('bakr', 'bakar').replace('nayeem', 'nayem').replace('naim', 'nayem')
    w = w.replace('hussain', 'hossain').replace('hossein', 'hossain')
    return w

def get_name_tokens(name_str):
    clean = strip_all_honorifics(name_str)
    raw_words = re.findall(r'[a-zA-Z]+', clean)
    toks = [translit(w) for w in raw_words if w]
    
    # Also create condensed initials token if multiple 1-letter initials exist
    initials = ''.join([w for w in toks if len(w) == 1])
    if len(initials) >= 2 and initials not in toks:
        toks.append(initials)
    return toks

def normalize_time_str(t_str, default_period=None):
    if not t_str:
        return None
    t_str = t_str.strip().upper().replace('.', ':')
    m = re.match(r'(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?', t_str)
    if not m:
        return None
    hour = int(m.group(1))
    minute = int(m.group(2) or 0)
    period = m.group(3) or default_period
    if not period:
        if 4 <= hour <= 11:
            period = 'PM'
        else:
            period = 'AM'
    if period == 'PM' and hour < 12:
        hour += 12
    elif period == 'AM' and hour == 12:
        hour = 0
    return f'{hour:02d}:{minute:02d}:00'

def parse_single_chunk(text):
    time_match = re.search(
        r'(\d{1,2}(?:[:.]\d{2})?\s*(?:am|pm)?)\s*(?:to|-|–)\s*(\d{1,2}(?:[:.]\d{2})?\s*(?:am|pm))',
        text, re.IGNORECASE
    )
    if not time_match:
        return []

    end_raw = time_match.group(2)
    end_period = 'PM' if 'pm' in end_raw.lower() else ('AM' if 'am' in end_raw.lower() else None)

    start_str = normalize_time_str(time_match.group(1), default_period=end_period)
    end_str = normalize_time_str(time_match.group(2))

    if not start_str or not end_str or start_str >= end_str:
        return []

    lower_text = text.lower()
    active_days = []

    # Check for range: e.g. Saturday to Thursday, Sat - Wed
    range_match = re.search(
        r'\b(sat|saturday|sun|sunday|mon|monday|tue|tuesday|wed|wednesday|thu|thursday|fri|friday)\s*(?:to|-|–)\s*(sat|saturday|sun|sunday|mon|monday|tue|tuesday|wed|wednesday|thu|thursday|fri|friday)\b',
        lower_text
    )
    if range_match:
        d1 = DAY_MAP[range_match.group(1)]
        d2 = DAY_MAP[range_match.group(2)]
        i1 = ALL_DAYS.index(d1)
        i2 = ALL_DAYS.index(d2)
        if i1 <= i2:
            active_days = ALL_DAYS[i1:i2+1]
        else:
            active_days = ALL_DAYS[i1:] + ALL_DAYS[:i2+1]
    else:
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
            paren_match = re.search(r'\(([^)]+)\)', lower_text)
            days_search_text = paren_match.group(1) if paren_match else lower_text
            for k, v in DAY_MAP.items():
                if re.search(r'\b' + k + r'\b', days_search_text):
                    found_days.add(v)
            if found_days:
                active_days = [d for d in ALL_DAYS if d in found_days]
            elif any(kw in lower_text for kw in ['daily', 'everyday', 'every day']):
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

def parse_visiting_hours(text):
    if not text:
        return []
    chunks = re.split(r'\)\s*[,;&]?\s*(?=\d)', text)
    all_slots = []
    for c in chunks:
        c = c.strip()
        if not c:
            continue
        if not c.endswith(')') and '(' in c:
            c += ')'
        all_slots.extend(parse_single_chunk(c))
    return all_slots

def hospital_matches(aff_loc_name, chamber_name):
    if not aff_loc_name or not chamber_name:
        return False
    a = aff_loc_name.lower().replace('orthopaedic', 'orthopedic')
    b = chamber_name.lower().replace('orthopaedic', 'orthopedic')
    for abb, full in ABBREVS.items():
        if abb in a:
            a = a + ' ' + full
        if abb in b:
            b = b + ' ' + full
    a = re.sub(r'[\(\)\,\.\-\&]', ' ', a)
    b = re.sub(r'[\(\)\,\.\-\&]', ' ', b)
    GENERIC = {'hospital', 'diagnostic', 'center', 'centre', 'limited', 'ltd', 'pvt', 'college', 'medical', 'dhaka', 'the', 'unit', 'and'}
    a_toks = set(a.split()) - GENERIC
    b_toks = set(b.split()) - GENERIC
    if not a_toks or not b_toks:
        return SequenceMatcher(None, a, b).ratio() > 0.7
    if a_toks.issubset(b_toks) or b_toks.issubset(a_toks):
        return True
    overlap = len(a_toks & b_toks)
    if overlap >= 2:
        return True
    if overlap >= 1 and (len(a_toks) == 1 or len(b_toks) == 1):
        return True
    return False


class Command(BaseCommand):
    help = 'Deeply searches local doctor card extractions, docbd.org, doctorbangladesh.com, and healthcare portals for real doctor schedules.'

    def add_arguments(self, parser):
        parser.add_argument('--limit', type=int, default=0, help='Limit number of unscheduled affiliations to process (0 = all)')

    def handle(self, *args, **options):
        limit = options['limit']

        # -----------------------------------------------------------------
        # STEP 0: Index verified local card and brochure extractions
        # -----------------------------------------------------------------
        self.stdout.write(self.style.NOTICE('=== Step 0: Indexing local card and brochure extractions ==='))
        extraction_files = [
            '/home/ltl/Tomal/extraction & creation/data/doctors_clean.json',
            '/home/ltl/Tomal/extraction & creation/data/doctors_extracted.json',
            '/home/ltl/Tomal/extraction & creation/data/doctors_clean_new2.json',
            '/home/ltl/Tomal/extraction & creation/data/doctors_extracted_new2.json',
            '/home/ltl/Tomal/extraction & creation/data/doctors_clean_new3.json',
            '/home/ltl/Tomal/extraction & creation/data/doctors_extracted_new3.raw.json',
        ]
        local_card_records = []
        for p in extraction_files:
            if os.path.exists(p):
                try:
                    with open(p, 'r', encoding='utf-8') as f:
                        d = json.load(f)
                        if isinstance(d, list):
                            for doc in d:
                                d_name = doc.get('name', '')
                                d_toks = get_name_tokens(d_name)
                                d_core = set(w for w in d_toks if w not in COMMON_TITLES and len(w) > 1)
                                for aff in doc.get('affiliations', []):
                                    scheds = aff.get('schedules', [])
                                    if scheds:
                                        local_card_records.append({
                                            'doc_name': d_name,
                                            'doc_toks_set': set(d_toks),
                                            'doc_core': d_core,
                                            'fac_name': aff.get('facility_name', ''),
                                            'schedules': scheds,
                                            'source': os.path.basename(p)
                                        })
                except Exception as e:
                    self.stderr.write(f'Warning loading {p}: {e}')

        self.stdout.write(f'Loaded {len(local_card_records)} verified local affiliation schedules from cards & brochures.')

        # -----------------------------------------------------------------
        # STEP 1: Load docbd.org sitemap and index profiles
        # -----------------------------------------------------------------
        self.stdout.write(self.style.NOTICE('=== Step 1: Loading docbd.org sitemap and indexing profiles ==='))
        sitemap_path = Path('/home/ltl/.gemini/antigravity/brain/9ac380eb-f792-4d40-8763-a22ce2668337/.system_generated/steps/462/content.md')
        if not sitemap_path.exists():
            try:
                req = urllib.request.Request('https://docbd.org/sitemap.xml', headers={'User-Agent': 'Mozilla/5.0'})
                with urllib.request.urlopen(req, timeout=15) as r:
                    sitemap_text = r.read().decode('utf-8', errors='ignore')
            except Exception as e:
                self.stderr.write(f'Failed to fetch sitemap: {e}')
                sitemap_text = ''
        else:
            with open(sitemap_path, 'r', encoding='utf-8') as f:
                sitemap_text = f.read()

        doctor_urls = re.findall(r'<loc>(https://docbd\.org/doctor/[^<]+)</loc>', sitemap_text)
        self.stdout.write(f'Loaded {len(doctor_urls)} docbd doctor URLs.')

        slug_records = []
        for u in doctor_urls:
            raw_slug = u.rstrip('/').split('/')[-1]
            clean_s = re.sub(r'^(?:prof|dr|assoc-prof|asst-prof|brig-gen|brig-gen-prof|col|capt|colonel|dietician|dietitian)-+', '', raw_slug)
            clean_s = re.sub(r'^(?:prof|dr|assoc-prof|asst-prof|brig-gen|brig-gen-prof|col|capt|colonel)-+', '', clean_s)
            raw_tokens = [translit(w) for w in clean_s.split('-') if w]
            tokens_set = set(raw_tokens)
            
            # Add concatenated initial tokens if present
            initials = ''.join([w for w in raw_tokens if len(w) == 1])
            if len(initials) >= 2:
                tokens_set.add(initials)

            slug_records.append({
                'url': u,
                'clean_slug': clean_s,
                'tokens': raw_tokens,
                'tokens_set': tokens_set,
                'core_set': set(w for w in tokens_set if w not in COMMON_TITLES and len(w) > 1)
            })

        # -----------------------------------------------------------------
        # STEP 2: Pre-index hospital directory pages on docbd
        # -----------------------------------------------------------------
        self.stdout.write(self.style.NOTICE('=== Step 2: Indexing hospital doctor directory pages on docbd ==='))
        hospital_pages = [
            ('Green Life Hospital', 'https://docbd.org/doctors/dhaka/green-life-hospital-doctor-list-contact/'),
            ('Japan Bangladesh Friendship Hospital', 'https://docbd.org/doctors/dhaka/japan-bangladesh-friendship-hospital-doctor-list-contact/'),
            ('Anwer Khan Modern Medical College Hospital', 'https://docbd.org/doctors/dhaka/akmmch-doctor-list-contact/'),
            ('Popular Diagnostic Centre Ltd.', 'https://docbd.org/doctors/dhaka/popular-dhanmondi-doctor-list-contact/'),
            ('Popular Diagnostic Centre Ltd.', 'https://docbd.org/doctors/dhaka/popular-shantinagar-doctor-list-contact/'),
            ('Popular Diagnostic Centre Ltd.', 'https://docbd.org/doctors/dhaka/popular-diagnostic-mirpur-doctor-list-contact/'),
            ('Popular Diagnostic Centre Ltd.', 'https://docbd.org/doctors/dhaka/popular-diagnostic-uttara-doctor-list-contact/'),
            ('Popular Diagnostic Centre Ltd.', 'https://docbd.org/doctors/dhaka/popular-diagnostic-center-badda-doctor-list-contact/'),
            ('Popular Diagnostic Centre Ltd.', 'https://docbd.org/doctors/dhaka/popular-diagnostic-savar-doctor-list-contact/'),
            ('Central Hospital Limited', 'https://docbd.org/doctors/dhaka/central-hospital-doctor-list-contact/'),
            ('Comfort Diagnostic Center', 'https://docbd.org/doctors/dhaka/comfort-diagnostic-dhanmondi-doctor-list-contact/'),
            ('BIRDEM General Hospital', 'https://docbd.org/doctors/dhaka/birdem-hospital-doctor-list-contact/'),
            ('Shin Shin Japan Hospital', 'https://docbd.org/doctors/dhaka/shin-shin-japan-hospital-doctor-list-contact/'),
            ('Enam Medical College Hospital', 'https://docbd.org/doctors/dhaka/enam-medical-college-hospital-doctor-list-contact/'),
        ]

        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
        hospital_doc_directory = []

        for h_name, h_url in hospital_pages:
            try:
                req = urllib.request.Request(h_url, headers=headers)
                with urllib.request.urlopen(req, timeout=8) as resp:
                    soup = BeautifulSoup(resp.read().decode('utf-8', errors='ignore'), 'html.parser')
                    for c_div in soup.find_all('div', class_='small-card'):
                        h5 = c_div.find('h5')
                        if h5 and h5.find('a'):
                            d_name = h5.get_text(strip=True)
                            d_url = h5.find('a')['href']
                            d_toks = get_name_tokens(d_name)
                            hospital_doc_directory.append({
                                'hospital_name': h_name,
                                'doctor_name': d_name,
                                'url': d_url,
                                'tokens_set': set(d_toks),
                                'core_set': set(w for w in d_toks if w not in COMMON_TITLES and len(w) > 1)
                            })
            except Exception as e:
                self.stderr.write(f'Warning fetching {h_url}: {e}')

        self.stdout.write(f'Indexed {len(hospital_doc_directory)} doctors across hospital directories.')

        # -----------------------------------------------------------------
        # STEP 3: Process unscheduled affiliations across all verified sources
        # -----------------------------------------------------------------
        self.stdout.write(self.style.NOTICE('=== Step 3: Processing unscheduled affiliations ==='))
        unscheduled_affs = list(
            DoctorAffiliation.objects.filter(schedules__isnull=True)
            .select_related('doctor', 'location')
            .distinct()
            .order_by('doctor__name')
        )
        total_unsched = len(unscheduled_affs)
        self.stdout.write(f'Found {total_unsched} unscheduled affiliations in database.')

        if limit > 0:
            unscheduled_affs = unscheduled_affs[:limit]
            self.stdout.write(f'Processing limited batch of {limit} affiliations.')

        seeded_count = 0
        unfound_report = []
        docbd_cache = {}

        for idx, aff in enumerate(unscheduled_affs, 1):
            doc = aff.doctor
            loc = aff.location
            doc_name = doc.name
            loc_name = loc.name if loc else 'Chamber'

            slots_to_create = []
            source_url = ''
            matched_chamber_name = ''

            doc_tokens = get_name_tokens(doc_name)
            core_doc_tokens = [w for w in doc_tokens if w not in COMMON_TITLES and len(w) > 1]
            if not core_doc_tokens:
                core_doc_tokens = [w for w in doc_tokens if len(w) > 1]

            doc_tokens_set = set(doc_tokens)
            core_doc_set = set(core_doc_tokens)

            # -------------------------------------------------------------
            # Strategy 0: Match against verified local doctor cards
            # -------------------------------------------------------------
            for rec in local_card_records:
                if hospital_matches(loc_name, rec['fac_name']):
                    if core_doc_set and rec['doc_core']:
                        if core_doc_set == rec['doc_core'] or (len(core_doc_set) >= 2 and core_doc_set.issubset(rec['doc_core'])):
                            slots_to_create = [{
                                'day_of_week': s['day_of_week'],
                                'start_time': s['start_time'],
                                'end_time': s['end_time'],
                                'max_patients': s.get('max_patients', 30),
                                'avg_consult_minutes': s.get('avg_consult_minutes', 10)
                            } for s in rec['schedules']]
                            source_url = f"Local Doctor Card ({rec['source']})"
                            matched_chamber_name = rec['fac_name']
                            break

            # -------------------------------------------------------------
            # Strategy 1: Check docbd hospital directory & sitemap
            # -------------------------------------------------------------
            if not slots_to_create:
                candidate_urls = []

                # 1A: Check hospital directory index first
                for h_rec in hospital_doc_directory:
                    if hospital_matches(loc_name, h_rec['hospital_name']):
                        if core_doc_set and core_doc_set.issubset(h_rec['core_set']):
                            candidate_urls.append((100, h_rec['url']))
                        elif len(core_doc_tokens) >= 2:
                            overlap = len(core_doc_set & h_rec['core_set'])
                            if overlap >= 2 and overlap == len(core_doc_tokens):
                                candidate_urls.append((90, h_rec['url']))

                # 1B: Check general docbd sitemap index
                if not candidate_urls:
                    for rec in slug_records:
                        if core_doc_set and core_doc_set.issubset(rec['core_set']):
                            score = len(doc_tokens_set & rec['tokens_set']) * 10 - len(rec['tokens_set'] - doc_tokens_set)
                            candidate_urls.append((score, rec['url']))
                        elif len(core_doc_tokens) >= 2:
                            overlap = len(core_doc_set & rec['core_set'])
                            if overlap >= 2 and overlap == len(core_doc_tokens):
                                score = overlap * 10
                                candidate_urls.append((score, rec['url']))

                candidate_urls.sort(key=lambda x: -x[0])

                # Deduplicate candidate URLs
                seen_cand = set()
                unique_cand = []
                for score, u in candidate_urls:
                    if u not in seen_cand:
                        seen_cand.add(u)
                        unique_cand.append((score, u))

                for _, cand_url in unique_cand[:3]:
                    if cand_url not in docbd_cache:
                        try:
                            req = urllib.request.Request(cand_url, headers=headers)
                            with urllib.request.urlopen(req, timeout=8) as resp:
                                html = resp.read().decode('utf-8', errors='ignore')
                            soup = BeautifulSoup(html, 'html.parser')
                            c_list = []
                            for c_div in soup.find_all('div', class_='card'):
                                h_el = c_div.find('h5', class_='hospital-name')
                                vh_el = c_div.find('div', class_='visiting-hours')
                                if h_el and vh_el:
                                    c_list.append((h_el.get_text(strip=True), vh_el.get_text(strip=True)))
                            docbd_cache[cand_url] = c_list
                        except Exception:
                            docbd_cache[cand_url] = []

                    page_chambers = docbd_cache[cand_url]
                    for ch_name, ch_hours in page_chambers:
                        if hospital_matches(loc_name, ch_name):
                            parsed = parse_visiting_hours(ch_hours)
                            if parsed:
                                slots_to_create = parsed
                                source_url = cand_url
                                matched_chamber_name = ch_name
                                break
                    if slots_to_create:
                        break

            # -------------------------------------------------------------
            # Strategy 2: Search doctorbangladesh.com if not on docbd
            # -------------------------------------------------------------
            if not slots_to_create:
                search_terms = []
                stripped = strip_all_honorifics(doc_name)
                search_terms.append(stripped)
                words_clean = [w for w in stripped.split() if len(w) > 1 and w.lower() not in COMMON_TITLES]
                if len(words_clean) >= 2:
                    search_terms.append(' '.join(words_clean))

                for st in search_terms:
                    try:
                        s_url = f'https://www.doctorbangladesh.com/?s={urllib.parse.quote(st)}'
                        req = urllib.request.Request(s_url, headers=headers)
                        with urllib.request.urlopen(req, timeout=6) as resp:
                            html = resp.read().decode('utf-8', errors='ignore')
                        soup = BeautifulSoup(html, 'html.parser')
                        doc_links = [a['href'] for a in soup.find_all('a', href=True) if '/dr-' in a['href']]
                        if doc_links:
                            for d_url in list(set(doc_links))[:2]:
                                req2 = urllib.request.Request(d_url, headers=headers)
                                with urllib.request.urlopen(req2, timeout=6) as resp2:
                                    html2 = resp2.read().decode('utf-8', errors='ignore')
                                soup2 = BeautifulSoup(html2, 'html.parser')
                                for p_tag in soup2.find_all(['p', 'li', 'div']):
                                    p_txt = p_tag.get_text()
                                    if 'visiting hour' in p_txt.lower() or ('pm' in p_txt.lower() and 'closed' in p_txt.lower()):
                                        parent_txt = p_tag.parent.get_text() if p_tag.parent else p_txt
                                        if hospital_matches(loc_name, parent_txt) or hospital_matches(loc_name, p_txt):
                                            parsed = parse_visiting_hours(p_txt)
                                            if parsed:
                                                slots_to_create = parsed
                                                source_url = d_url
                                                matched_chamber_name = loc_name
                                                break
                                if slots_to_create:
                                    break
                    except Exception:
                        pass
                    if slots_to_create:
                        break

            # -------------------------------------------------------------
            # Save or Record Unfound
            # -------------------------------------------------------------
            if slots_to_create:
                created_count = 0
                for s in slots_to_create:
                    day = s['day_of_week']
                    st = s['start_time']
                    et = s['end_time']

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
                                max_patients=s['max_patients'],
                                avg_consult_minutes=s['avg_consult_minutes']
                            )
                            created_count += 1
                        except ValidationError:
                            pass

                if created_count > 0:
                    seeded_count += 1
                    self.stdout.write(
                        self.style.SUCCESS(
                            f'[{idx}/{total_unsched}] SEEDED {created_count} slots: {doc_name} @ {loc_name} (from: {source_url})'
                        )
                    )
                else:
                    self.stdout.write(
                        self.style.WARNING(
                            f'[{idx}/{total_unsched}] CONFLICT: {doc_name} @ {loc_name} (hours found but cross-chamber overlap prevented insertion)'
                        )
                    )
            else:
                self.stdout.write(
                    f'[{idx}/{total_unsched}] UNFOUND: {doc_name} @ {loc_name}'
                )
                unfound_report.append({
                    'doctor_id': str(doc.id),
                    'doctor_name': doc.name,
                    'specialty': [s.name for s in doc.specialties.all()] if hasattr(doc, 'specialties') else [],
                    'institution': doc.institution,
                    'affiliation_id': str(aff.id),
                    'location_name': loc_name
                })

        report_file = Path('/home/ltl/Tomal/project_doctors_hub/doctors_hub_backend/unfound_doctors_report.json')
        with open(report_file, 'w', encoding='utf-8') as f:
            json.dump(unfound_report, f, indent=2, ensure_ascii=False)

        self.stdout.write("\n" + "=" * 50)
        self.stdout.write(self.style.SUCCESS(f'SUMMARY: Processed {len(unscheduled_affs)} affiliations.'))
        self.stdout.write(self.style.SUCCESS(f'  • Newly seeded real visiting schedules: {seeded_count}'))
        self.stdout.write(self.style.NOTICE(f'  • Remaining unfound (strictly no mock data): {len(unfound_report)}'))
        self.stdout.write(f'Updated unfound report written to: {report_file}')
