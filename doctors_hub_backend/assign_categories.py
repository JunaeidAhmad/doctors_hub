import os
import django
import sys
import uuid
from django.utils.text import slugify
from django.db import transaction

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from api.models import TestCategory, Test

CATEGORY_HIERARCHY = {
    "Pathology & Clinical Lab": {
        "icon": "FlaskConical",
        "description": "Blood, urine, stool, culture, and routine clinical pathology tests.",
        "children": [
            ("Hematology", "Blood counts, hemoglobin, ESR, coagulation, and blood grouping."),
            ("Biochemistry", "Blood glucose, lipid profile, liver function, renal function, electrolytes."),
            ("Immunology & Serology", "Antibodies, viral markers, thyroid profile, autoimmune markers."),
            ("Microbiology & Cultures", "Bacterial and fungal cultures, swabs, sensitivity testing."),
            ("Clinical Pathology", "Routine urine, stool, fluid analysis, semen analysis."),
            ("Flow Cytometry", "Cell marker analysis and leukemia/lymphoma immunophenotyping."),
            ("General Pathology", "General diagnostic pathology profiles and routines."),
        ]
    },
    "Radiology & Imaging": {
        "icon": "FileText",
        "description": "X-ray, Ultrasound, CT Scan, MRI, Mammography, and DEXA scans.",
        "children": [
            ("X-Ray", "Digital radiography for chest, bones, spine, abdomen, and dental OPG."),
            ("Ultrasound & Doppler (USG)", "4D abdominal, pelvic, pregnancy, thyroid, vascular doppler USG."),
            ("CT Scan", "High-resolution 128-slice computed tomography brain, chest, abdomen, angiography."),
            ("MRI Scan", "3.0T magnetic resonance imaging for neuro, spine, joints, and organs."),
            ("Bone Densitometry (DEXA)", "Dual-energy X-ray absorptiometry for bone density."),
            ("General Radiology", "Special contrast radiography and radiological reporting."),
        ]
    },
    "Cardiology & Vascular": {
        "icon": "Heart",
        "description": "ECG, Echo, TMT, Holter, and cardiovascular diagnostics.",
        "children": [
            ("Cardiac Diagnostics", "Electrocardiogram, 2D/Doppler Echo, TMT, Holter, ABPM."),
        ]
    },
    "Neurology & Sleep Studies": {
        "icon": "Brain",
        "description": "EEG, EMG, NCV, and sleep lab diagnostics.",
        "children": [
            ("Neuro Diagnostics", "Electroencephalogram (EEG), EMG, NCV, evoked potentials."),
            ("Sleep Studies (Polysomnography)", "Overnight sleep apnea and sleep disorder diagnostics."),
        ]
    },
    "Endoscopy & Procedures": {
        "icon": "Activity",
        "description": "Gastroscopy, Colonoscopy, Bronchoscopy, ERCP, Colposcopy.",
        "children": [
            ("Endoscopy", "Upper GI gastroscopy and esophageal procedures."),
            ("Colonoscopy", "Lower GI colonoscopy and sigmoidoscopy."),
            ("Bronchoscopy", "Pulmonary airway endoscopic examination."),
            ("ERCP", "Endoscopic retrograde cholangiopancreatography."),
            ("Colposcopy", "Cervical visual inspection and biopsy procedure."),
        ]
    },
    "Genetic & Molecular Diagnostics": {
        "icon": "Dna",
        "description": "PCR, DNA testing, cytogenetics, and molecular oncology.",
        "children": [
            ("COVID-19 & Viral PCR", "RT-PCR for COVID-19 and viral pathogen panels."),
            ("Molecular Biology & Genetics", "DNA fingerprinting, karyotyping, NIPT, PCR panels."),
            ("Pharmacogenetics", "Genetic testing for drug response and metabolism."),
        ]
    },
    "Histopathology & Cytology": {
        "icon": "Microscope",
        "description": "Tissue biopsy, FNAC, Pap smear, and cytopathology.",
        "children": [
            ("Histopathology", "Surgical tissue biopsy, frozen section, IHC."),
            ("Cytopathology", "FNAC, Pap smear, fluid cytology."),
        ]
    },
    "Nuclear Medicine & Advanced Imaging": {
        "icon": "ShieldAlert",
        "description": "PET-CT, SPECT, Thyroid scan, Bone scan.",
        "children": [
            ("Nuclear Medicine", "Positron emission tomography (PET-CT), radioisotope scans."),
        ]
    },
    "Dental & Oral Diagnostics": {
        "icon": "Smile",
        "description": "Dental X-rays, root canals, fillings, extractions, dental procedures.",
        "children": [
            ("Dental Procedures & Surgery", "Root canal, fillings, extractions, apicoectomy, implants."),
        ]
    },
    "Wellness & Health Packages": {
        "icon": "Package",
        "description": "Comprehensive health checkups, corporate packages, manpower checkups.",
        "children": [
            ("Wellness Packages", "Master health checkup, cardiac, executive, diabetes packages."),
            ("Corporate Health Checkup", "Corporate employee health screening packages."),
            ("Manpower & Pre-Employment Checkup", "Pre-employment and overseas manpower medical checkups."),
        ]
    },
    "Specialized Diagnostic Tests": {
        "icon": "Stethoscope",
        "description": "Specialized clinical tests, urology, gastroenterology, ENT.",
        "children": [
            ("Urology & Kidney Diagnostics", "Uroflowmetry, kidney stone analysis, renal function."),
            ("Gastrointestinal Diagnostics", "Urea breath test for H. pylori, motility tests."),
            ("Dermatology & Laser Procedures", "Aesthetic laser, chemical cautery, dermatological procedures."),
            ("Audiometry & ENT", "Hearing tests, audiometry, tympanometry."),
            ("Obstetric & Delivery Procedures", "Maternity and delivery procedure diagnostics."),
            ("General Diagnostics", "Other specialized diagnostic services."),
        ]
    }
}

OLD_CAT_MAPPING = {
    "Biochemistry": "Biochemistry",
    "Bone Densitometre": "Bone Densitometry (DEXA)",
    "Broncoscopy": "Bronchoscopy",
    "Cardiac Test": "Cardiac Diagnostics",
    "Clinical Pathology": "Clinical Pathology",
    "Colonoscopy": "Colonoscopy",
    "Colposcopy": "Colposcopy",
    "Covid 19 Pcr Lab": "COVID-19 & Viral PCR",
    "Ct Scan": "CT Scan",
    "Radiology Imaging Ct Scan": "CT Scan",
    "Cyto Pathology": "Cytopathology",
    "Delivery": "Obstetric & Delivery Procedures",
    "Dental Aneasthesia Others": "Dental Procedures & Surgery",
    "Dental Others": "Dental Procedures & Surgery",
    "Dental Procedure": "Dental Procedures & Surgery",
    "Dental Servicei": "Dental Procedures & Surgery",
    "Endoscopy": "Endoscopy",
    "Ercp": "ERCP",
    "Flowcytometry": "Flow Cytometry",
    "Haematology": "Hematology",
    "Health Check Up Corporate Services": "Corporate Health Checkup",
    "Histo Pathology": "Histopathology",
    "Immunology": "Immunology & Serology",
    "Kidney Stone": "Urology & Kidney Diagnostics",
    "Labaid Aesthetic Laser Center Procedure": "Dermatology & Laser Procedures",
    "Labaid Hearing Center": "Audiometry & ENT",
    "Manpower Medical Checkup": "Manpower & Pre-Employment Checkup",
    "Microbiology": "Microbiology & Cultures",
    "Molecular Biology": "Molecular Biology & Genetics",
    "Molecular Diagnosis Pcr Lab": "Molecular Biology & Genetics",
    "Molecular Oncology Test": "Molecular Biology & Genetics",
    "Mri": "MRI Scan",
    "Neuro Diagnosis": "Neuro Diagnostics",
    "Nuclear Medicine": "Nuclear Medicine",
    "Others": "General Diagnostics",
    "Pathology": "General Pathology",
    "Pharmacogenetics Lab": "Pharmacogenetics",
    "Radiology": "General Radiology",
    "Serology": "Immunology & Serology",
    "Sleep Lab": "Sleep Studies (Polysomnography)",
    "Urea Breath Test": "Gastrointestinal Diagnostics",
    "Uroflowmetry": "Urology & Kidney Diagnostics",
    "Usg": "Ultrasound & Doppler (USG)",
    "Usg 3D4D": "Ultrasound & Doppler (USG)",
    "Wellness Package": "Wellness Packages",
    "X Ray Lsh": "X-Ray",
    "X Ray Reporting": "X-Ray",
}

JUNK_NAMES = {'Feedback', 'SERVICES', 'QUICK LINKS', 'FOLLOW US', 'Demo', 'tests'}

def get_or_create_cat(name, parent=None, icon='', description='', order=0):
    target_slug = slugify(name)
    cat = TestCategory.objects.filter(name__iexact=name).first() or TestCategory.objects.filter(slug=target_slug).first()
    if cat:
        cat.name = name
        cat.parent = parent
        if icon: cat.icon = icon
        if description: cat.description = description
        cat.order = order
        cat.slug = target_slug
        cat.save()
        return cat
    else:
        cat = TestCategory.objects.create(
            name=name,
            slug=target_slug,
            parent=parent,
            icon=icon,
            description=description,
            order=order
        )
        return cat

def run_migration():
    print("=== STARTING FAST BULK CATEGORY ASSIGNMENT & CLEANUP ===", flush=True)
    
    with transaction.atomic():
        # Step 1: Build Category Hierarchy
        category_objs = {}
        for order_idx, (parent_name, pdata) in enumerate(CATEGORY_HIERARCHY.items(), start=1):
            parent_cat = get_or_create_cat(
                name=parent_name,
                parent=None,
                icon=pdata.get('icon', 'FlaskConical'),
                description=pdata.get('description', ''),
                order=order_idx
            )
            category_objs[parent_name] = parent_cat
            
            for sub_idx, (child_name, child_desc) in enumerate(pdata['children'], start=1):
                child_cat = get_or_create_cat(
                    name=child_name,
                    parent=parent_cat,
                    description=child_desc,
                    order=sub_idx
                )
                category_objs[child_name] = child_cat

        # Step 2: Clean up Tests and Assign Categories in Memory
        all_tests = list(Test.objects.all().select_related('category'))
        print(f"Processing {len(all_tests)} tests in database...", flush=True)
        
        to_delete_ids = []
        to_update_tests = []
        used_slugs = set()

        deleted_junk_count = 0
        fixed_name_count = 0
        assigned_count = 0

        for test in all_tests:
            name = test.name.strip()
            code = test.code.strip()

            # Fix reversed name/code from scraping
            if not name and code and len(code) > 3:
                name = code
                code = ""
                fixed_name_count += 1

            # Mark junk for deletion
            if name in JUNK_NAMES or not name:
                to_delete_ids.append(test.id)
                deleted_junk_count += 1
                continue

            # Determine target subcategory
            current_cat_name = test.category.name if test.category else ""
            target_subcat_name = OLD_CAT_MAPPING.get(current_cat_name, "General Diagnostics")
            
            lname = name.lower()
            if target_subcat_name == "General Diagnostics":
                if any(k in lname for k in ['x-ray', 'xray', 'cxr']):
                    target_subcat_name = "X-Ray"
                elif any(k in lname for k in ['usg', 'ultrasound', 'sonography']):
                    target_subcat_name = "Ultrasound & Doppler (USG)"
                elif 'ct' in lname:
                    target_subcat_name = "CT Scan"
                elif 'mri' in lname:
                    target_subcat_name = "MRI Scan"
                elif any(k in lname for k in ['cbc', 'blood', 'esr', 'hemoglobin', 'platelet', 'anemia']):
                    target_subcat_name = "Hematology"
                elif any(k in lname for k in ['sugar', 'glucose', 'lft', 'kft', 'lipid', 'cholesterol', 'creatinine', 'urea']):
                    target_subcat_name = "Biochemistry"
                elif any(k in lname for k in ['biopsy', 'histology', 'tissue']):
                    target_subcat_name = "Histopathology"
                elif any(k in lname for k in ['fnac', 'pap smear', 'cytology']):
                    target_subcat_name = "Cytopathology"
                elif any(k in lname for k in ['ecg', 'echo', 'tmt', 'holter']):
                    target_subcat_name = "Cardiac Diagnostics"
                elif any(k in lname for k in ['eeg', 'emg', 'ncv', 'nerve']):
                    target_subcat_name = "Neuro Diagnostics"

            target_cat = category_objs.get(target_subcat_name) or category_objs.get("General Diagnostics")

            base_slug = slugify(name[:160]) or f"test-{uuid.uuid4().hex[:8]}"
            unique_slug = base_slug
            if unique_slug in used_slugs:
                unique_slug = f"{base_slug}-{str(test.id)[:8]}"
            used_slugs.add(unique_slug)

            test.category = target_cat
            test.name = name
            test.code = code
            test.slug = unique_slug
            to_update_tests.append(test)
            assigned_count += 1

        # Delete junk tests
        if to_delete_ids:
            Test.objects.filter(id__in=to_delete_ids).delete()

        # Bulk update valid tests
        if to_update_tests:
            Test.objects.bulk_update(to_update_tests, ['category', 'name', 'code', 'slug'], batch_size=200)

        # Delete unused empty old categories
        valid_cat_ids = [cat.id for cat in category_objs.values()]
        unused_cats = TestCategory.objects.exclude(id__in=valid_cat_ids)
        unused_count = unused_cats.count()
        unused_cats.delete()
        print(f"Cleaned up {unused_count} old/unused flat categories.", flush=True)

    print(f"\n=== CLEANUP & ASSIGNMENT COMPLETED ===", flush=True)
    print(f"Junk tests deleted: {deleted_junk_count}", flush=True)
    print(f"Reversed names fixed: {fixed_name_count}", flush=True)
    print(f"Total valid tests assigned to categories: {assigned_count}", flush=True)

    # Summary by Category
    print("\n=== FINAL TEST COUNT PER CATEGORY ===", flush=True)
    parents = TestCategory.objects.filter(parent__isnull=True).order_by('order')
    total_tests_in_db = Test.objects.count()
    print(f"TOTAL LEGITIMATE TESTS IN DB: {total_tests_in_db}", flush=True)
    print(f"UNCATEGORIZED TESTS (category=null): {Test.objects.filter(category__isnull=True).count()}", flush=True)
    
    for p_cat in parents:
        subcats = TestCategory.objects.filter(parent=p_cat).order_by('order')
        total_p_tests = Test.objects.filter(category__in=subcats).count() + Test.objects.filter(category=p_cat).count()
        print(f"\n📁 {p_cat.name} (Total: {total_p_tests})", flush=True)
        for subcat in subcats:
            sc_count = subcat.tests.count()
            print(f"    └── {subcat.name}: {sc_count} tests", flush=True)

if __name__ == "__main__":
    run_migration()
