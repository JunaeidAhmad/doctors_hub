#!/usr/bin/env python3
"""
Scrape department-wise test categories and tests from Labaid Diagnostics (labaiddiagnostics.com)
and inject them into Doctors Hub PostgreSQL database (TestCategory, Test, FacilityTest).
"""

import os
import sys
import re
import urllib.request
from decimal import Decimal
from bs4 import BeautifulSoup
import django

# Setup Django Environment
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")
django.setup()

from django.utils.text import slugify
from tests.models import TestCategory, Test, FacilityTest
from facilities.models import DiagnosticCenter, Hospital, Location

EXCLUDED_CATEGORIES = [
    'HEALTH CHECK-UP & CORPORATE SERVICES',
    'Labaid Aesthetic & Laser Center Procedure',
    'WELLNESS PACKAGE',
    'MANPOWER MEDICAL CHECKUP',
    'Others',
    'Delivery',
    'Labaid Hearing Center',
    'Labaid Aesthetic & Laser Lounge',
    'Labaid Aesthetic'
]

DEPARTMENT_ICONS = {
    'molecular-diagnosis-pcr-lab': 'Dna',
    'pharmacogenetics-lab': 'Pill',
    'flowcytometry': 'Activity',
    'dental-procedure': 'Smile',
    'biochemistry': 'FlaskConical',
    'bone-densitometre': 'Bone',
    'broncoscopy': 'Activity',
    'cardiac-test': 'Heart',
    'clinical-pathology': 'FlaskConical',
    'colonoscopy': 'Eye',
    'colposcopy': 'UserCheck',
    'covid-19-pcr-lab': 'ShieldAlert',
    'ct-scan': 'Scan',
    'cyto-pathology': 'Microscope',
    'dental-servicei': 'Smile',
    'endoscopy': 'Eye',
    'ercp': 'Activity',
    'haematology': 'Droplet',
    'histo-pathology': 'Microscope',
    'immunology': 'ShieldCheck',
    'kidney-stone': 'Activity',
    'microbiology': 'Microscope',
    'molecular-biology': 'Dna',
    'mri': 'Scan',
    'neuro-diagnosis': 'Brain',
    'nuclear-medicine': 'Atom',
    'radiology-imaging-ct-scan': 'Scan',
    'serology': 'Droplets',
    'sleep-lab': 'Moon',
    'urea-breath-test': 'Wind',
    'uroflowmetry': 'Activity',
    'usg': 'Scan',
    'usg-3d4d': 'Scan',
    'x-ray-lsh': 'Radio',
    'x-ray-reporting': 'FileText',
}

def clean_title(title):
    cleaned = re.sub(r'\s+', ' ', title).strip()
    if cleaned.isupper():
        return cleaned.title()
    return cleaned

def fetch_labaid_catalog():
    print("=" * 60)
    print("Fetching Labaid Department-Wise Tests from labaiddiagnostics.com...")
    print("=" * 60)

    base_url = 'https://labaiddiagnostics.com/department-wise-test'
    req = urllib.request.Request(base_url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
    html = urllib.request.urlopen(req, timeout=20).read().decode('utf-8')
    soup = BeautifulSoup(html, 'html.parser')

    dept_links = []
    for a in soup.find_all('a', href=True):
        href = a['href']
        text = a.get_text().strip()
        if '/tests/' in href:
            if not any(ex.lower() in text.lower() for ex in EXCLUDED_CATEGORIES) and not any(ex.lower() in href.lower() for ex in EXCLUDED_CATEGORIES):
                dept_links.append((text, href))

    seen = set()
    unique_depts = []
    for text, href in dept_links:
        if href not in seen and text:
            seen.add(href)
            unique_depts.append((text, href))

    print(f"Found {len(unique_depts)} valid departments to scrape.\n")

    catalog = []
    for idx, (raw_dept_name, dept_url) in enumerate(unique_depts, 1):
        dept_name = clean_title(raw_dept_name)
        slug = dept_url.split('/tests/')[-1].strip('/')
        if not slug:
            slug = slugify(dept_name)
            
        print(f"[{idx}/{len(unique_depts)}] Scraping {dept_name} ({slug})...")
        try:
            d_req = urllib.request.Request(dept_url, headers={'User-Agent': 'Mozilla/5.0'})
            d_html = urllib.request.urlopen(d_req, timeout=15).read().decode('utf-8')
            d_soup = BeautifulSoup(d_html, 'html.parser')
            
            cards = d_soup.find_all('div', class_='card')
            tests = []
            for c in cards:
                title_el = c.find(['h5', 'h4', 'h6'])
                if not title_el:
                    continue
                test_name = title_el.get_text().strip()
                if not test_name or test_name.lower() in ['cart', 'add to cart', 'view details', 'book']:
                    continue
                
                ref_num = ''
                ref_el = c.find('p', class_='card-text')
                if ref_el:
                    ref_text = ref_el.get_text().strip()
                    match = re.search(r'Reference Number:\s*([A-Za-z0-9_\-]+)', ref_text, re.IGNORECASE)
                    if match:
                        ref_num = match.group(1)
                
                if not ref_num:
                    ref_num = f"LAB-{slug[:4].upper()}-{len(tests)+1:03d}"
                
                tests.append({
                    'name': test_name,
                    'code': ref_num,
                })
                if len(tests) >= 15:
                    break
                    
            icon = DEPARTMENT_ICONS.get(slug, 'FlaskConical')
            catalog.append({
                'name': dept_name,
                'slug': slug,
                'icon': icon,
                'description': f"Diagnostic investigations and clinical tests performed under {dept_name}.",
                'tests': tests
            })
            print(f"    ✓ {len(tests)} tests scraped for {dept_name}")
        except Exception as e:
            print(f"    ✗ Error scraping {dept_name}: {e}")

    total_scraped_tests = sum(len(c['tests']) for c in catalog)
    print(f"\nCompleted Scraping: {len(catalog)} Categories, {total_scraped_tests} Tests.")
    return catalog

def ingest_to_database(catalog):
    print("\n" + "=" * 60)
    print("Injecting Scraped Labaid Data into Database...")
    print("=" * 60)

    # 1. Clean existing test relations
    print("Deleting old Test and TestCategory rows...")
    FacilityTest.objects.all().delete()
    Test.objects.all().delete()
    TestCategory.objects.all().delete()

    created_cats = {}
    total_tests_created = 0

    for item in catalog:
        cat_obj = TestCategory.objects.create(
            name=item['name'],
            slug=item['slug'],
            icon=item['icon'],
            description=item['description']
        )
        created_cats[item['slug']] = cat_obj

        for t in item['tests']:
            # Determine realistic sample & fasting
            sample = 'Blood (Serum)'
            fasting = False
            hrs = 12
            prep = 'No special preparation needed.'

            lower_name = t['name'].lower()
            if 'urine' in lower_name:
                sample = 'Urine (Clean Catch)'
                hrs = 6
                prep = 'Collect midstream early morning urine sample.'
            elif 'stool' in lower_name:
                sample = 'Stool Specimen'
                hrs = 12
            elif 'x-ray' in lower_name or 'xray' in lower_name:
                sample = 'Imaging / Radiograph'
                hrs = 2
                prep = 'Remove metallic objects, jewelry, and belts before imaging.'
            elif 'mri' in lower_name or 'ct' in lower_name:
                sample = 'Digital Imaging / Scan'
                hrs = 24
                prep = 'Fasting for 4 hours if IV contrast is prescribed. Inform technician if you have implants.'
            elif 'usg' in lower_name or 'ultrasound' in lower_name or 'echo' in lower_name:
                sample = 'Acoustic / Ultrasound'
                hrs = 4
                prep = 'Full bladder required for pelvic/lower abdomen scanning.'
            elif 'fasting' in lower_name or 'sugar' in lower_name or 'lipid' in lower_name:
                sample = 'Blood (Plasma)'
                fasting = True
                hrs = 6
                prep = 'Requires 8-10 hours overnight fasting prior to sample draw.'
            elif 'biopsy' in lower_name or 'histo' in lower_name:
                sample = 'Tissue / Cell Specimen'
                hrs = 72
                prep = 'Formalin preserved specimen.'

            Test.objects.create(
                category=cat_obj,
                name=t['name'],
                code=t['code'],
                sample_type=sample,
                fasting_required=fasting,
                report_time_hours=hrs,
                preparation_instructions=prep,
                description=f"Standard laboratory investigation for {t['name']} (Ref: {t['code']}) under {cat_obj.name}.",
                is_active=True
            )
            total_tests_created += 1

    print(f"✓ Test Categories created: {TestCategory.objects.count()} total.")
    print(f"✓ Medical Tests created: {Test.objects.count()} total.")

    # 2. Auto-associate tests with Diagnostic Centers & Hospitals
    print("\nAuto-associating tests with Diagnostic Centers & Hospitals...")
    diag_centers = list(DiagnosticCenter.objects.select_related('location').all())
    hospitals = list(Hospital.objects.select_related('location').all())

    facilities = [dc.location for dc in diag_centers] + [h.location for h in hospitals if h.has_diagnostic_center]
    all_tests = list(Test.objects.select_related('category').all())

    facility_tests_count = 0
    for idx, loc in enumerate(facilities):
        assigned_tests = all_tests if idx % 2 == 0 else all_tests[:len(all_tests)//2]
        
        for t_obj in assigned_tests:
            base_p = Decimal(str(300 + (abs(hash(t_obj.name)) % 35) * 50))
            if base_p < 200:
                base_p = Decimal("250.00")
            
            disc_p = None
            badge = ""
            orig_p = None
            if abs(hash(t_obj.name + str(loc.id))) % 3 == 0:
                orig_p = base_p
                disc_p = (base_p * Decimal("0.85")).quantize(Decimal("1.00"))
                price_val = disc_p
                badge = "15% OFF"
            else:
                price_val = base_p

            FacilityTest.objects.create(
                location=loc,
                test=t_obj,
                price=price_val,
                discounted_price=disc_p,
                original_price=orig_p,
                discount=badge,
                report_time="Same Day (6-8 Hours)" if (t_obj.report_time_hours or 12) <= 12 else "Next Day (24 Hours)",
                is_available=True,
                home_sample_collection=t_obj.sample_type.startswith("Blood") or t_obj.sample_type.startswith("Urine")
            )
            facility_tests_count += 1

    print(f"✓ Facility Tests created: {FacilityTest.objects.count()} total across {len(facilities)} facilities.")

    print("\n" + "=" * 60)
    print("INGESTION SUMMARY:")
    print("=" * 60)
    print(f"  TestCategory : {TestCategory.objects.count()} rows")
    print(f"  Test         : {Test.objects.count()} rows")
    print(f"  FacilityTest : {FacilityTest.objects.count()} rows")
    print("=" * 60)
    print("🎉 SUCCESS: Labaid department tests ingested and linked successfully!")

if __name__ == '__main__':
    catalog = fetch_labaid_catalog()
    ingest_to_database(catalog)
