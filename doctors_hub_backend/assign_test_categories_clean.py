import os
import django
import sys
import uuid
from django.utils.text import slugify
from django.db import transaction

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from api.models import TestCategory, Test

# Category Taxonomy Definitions
HIERARCHY = {
    "Pathology & Clinical Lab": {
        "icon": "FlaskConical",
        "description": "Blood, urine, stool, culture, and routine clinical pathology tests.",
        "subcategories": {
            "Hematology": "Blood counts, hemoglobin, ESR, coagulation, and blood grouping.",
            "Biochemistry": "Blood glucose, lipid profile, liver function, renal function, electrolytes.",
            "Immunology & Serology": "Antibodies, viral markers, thyroid profile, autoimmune markers.",
            "Microbiology & Cultures": "Bacterial and fungal cultures, swabs, sensitivity testing.",
            "Clinical Pathology": "Routine urine, stool, fluid analysis, semen analysis.",
            "Flow Cytometry": "Cell marker analysis and leukemia/lymphoma immunophenotyping.",
            "General Pathology": "General diagnostic pathology profiles and routines.",
        }
    },
    "Radiology & Imaging": {
        "icon": "FileText",
        "description": "X-ray, Ultrasound, CT Scan, MRI, Mammography, and DEXA scans.",
        "subcategories": {
            "X-Ray": "Digital radiography for chest, bones, spine, abdomen, and dental OPG.",
            "Ultrasound & Doppler (USG)": "4D abdominal, pelvic, pregnancy, thyroid, vascular doppler USG.",
            "CT Scan": "High-resolution 128-slice computed tomography brain, chest, abdomen, angiography.",
            "MRI Scan": "3.0T magnetic resonance imaging for neuro, spine, joints, and organs.",
            "Bone Densitometry (DEXA)": "Dual-energy X-ray absorptiometry for bone density.",
            "General Radiology": "Special contrast radiography and radiological reporting.",
        }
    },
    "Cardiology & Vascular": {
        "icon": "Heart",
        "description": "ECG, Echo, TMT, Holter, and cardiovascular diagnostics.",
        "subcategories": {
            "Cardiac Diagnostics": "Electrocardiogram, 2D/Doppler Echo, TMT, Holter, ABPM.",
        }
    },
    "Neurology & Sleep Studies": {
        "icon": "Brain",
        "description": "EEG, EMG, NCV, and sleep lab diagnostics.",
        "subcategories": {
            "Neuro Diagnostics": "Electroencephalogram (EEG), EMG, NCV, evoked potentials.",
            "Sleep Studies (Polysomnography)": "Overnight sleep apnea and sleep disorder diagnostics.",
        }
    },
    "Endoscopy & Procedures": {
        "icon": "Activity",
        "description": "Gastroscopy, Colonoscopy, Bronchoscopy, ERCP, Colposcopy.",
        "subcategories": {
            "Endoscopy": "Upper GI gastroscopy and esophageal procedures.",
            "Colonoscopy": "Lower GI colonoscopy and sigmoidoscopy.",
            "Bronchoscopy": "Pulmonary airway endoscopic examination.",
            "ERCP": "Endoscopic retrograde cholangiopancreatography.",
            "Colposcopy": "Cervical visual inspection and biopsy procedure.",
        }
    },
    "Genetic & Molecular Diagnostics": {
        "icon": "Dna",
        "description": "PCR, DNA testing, cytogenetics, and molecular oncology.",
        "subcategories": {
            "COVID-19 & Viral PCR": "RT-PCR for COVID-19 and viral pathogen panels.",
            "Molecular Biology & Genetics": "DNA fingerprinting, karyotyping, NIPT, PCR panels.",
            "Pharmacogenetics": "Genetic testing for drug response and metabolism.",
        }
    },
    "Histopathology & Cytology": {
        "icon": "Microscope",
        "description": "Tissue biopsy, FNAC, Pap smear, and cytopathology.",
        "subcategories": {
            "Histopathology": "Surgical tissue biopsy, frozen section, IHC.",
            "Cytopathology": "FNAC, Pap smear, fluid cytology.",
        }
    },
    "Nuclear Medicine & Advanced Imaging": {
        "icon": "ShieldAlert",
        "description": "PET-CT, SPECT, Thyroid scan, Bone scan.",
        "subcategories": {
            "Nuclear Medicine": "Positron emission tomography (PET-CT), radioisotope scans.",
        }
    },
    "Dental & Oral Diagnostics": {
        "icon": "Smile",
        "description": "Dental X-rays, root canals, fillings, extractions, dental procedures.",
        "subcategories": {
            "Dental Procedures & Surgery": "Root canal, fillings, extractions, apicoectomy, implants.",
        }
    },
    "Wellness & Health Packages": {
        "icon": "Package",
        "description": "Comprehensive health checkups, corporate packages, manpower checkups.",
        "subcategories": {
            "Wellness Packages": "Master health checkup, cardiac, executive, diabetes packages.",
            "Corporate Health Checkup": "Corporate employee health screening packages.",
            "Manpower & Pre-Employment Checkup": "Pre-employment and overseas manpower medical checkups.",
        }
    },
    "Specialized Diagnostic Tests": {
        "icon": "Stethoscope",
        "description": "Specialized clinical tests, urology, gastroenterology, ENT.",
        "subcategories": {
            "Urology & Kidney Diagnostics": "Uroflowmetry, kidney stone analysis, renal function.",
            "Gastrointestinal Diagnostics": "Urea breath test for H. pylori, motility tests.",
            "Dermatology & Laser Procedures": "Aesthetic laser, chemical cautery, dermatological procedures.",
            "Audiometry & ENT": "Hearing tests, audiometry, tympanometry.",
            "Obstetric & Delivery Procedures": "Maternity and delivery procedure diagnostics.",
            "General Diagnostics": "Other specialized diagnostic services.",
        }
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

def run_migration():
    print("=== ASSIGNING TEST CATEGORIES ===", flush=True)

    with transaction.atomic():
        category_map = {}
        for p_order, (p_name, p_data) in enumerate(HIERARCHY.items(), 1):
            p_slug = slugify(p_name)
            p_cat = TestCategory.objects.filter(slug=p_slug).first()
            if not p_cat:
                p_cat = TestCategory.objects.create(
                    name=p_name,
                    slug=p_slug,
                    icon=p_data['icon'],
                    description=p_data['description'],
                    order=p_order,
                    parent=None
                )
            else:
                p_cat.name = p_name
                p_cat.icon = p_data['icon']
                p_cat.description = p_data['description']
                p_cat.order = p_order
                p_cat.parent = None
                p_cat.save()

            for c_order, (c_name, c_desc) in enumerate(p_data['subcategories'].items(), 1):
                c_slug = slugify(c_name)
                c_cat = TestCategory.objects.filter(slug=c_slug).first()
                if not c_cat:
                    c_cat = TestCategory.objects.create(
                        name=c_name,
                        slug=c_slug,
                        description=c_desc,
                        order=c_order,
                        parent=p_cat
                    )
                else:
                    c_cat.name = c_name
                    c_cat.description = c_desc
                    c_cat.order = c_order
                    c_cat.parent = p_cat
                    c_cat.save()

                category_map[c_name] = c_cat

        all_tests = list(Test.objects.all().select_related('category'))
        print(f"Total tests in DB to process: {len(all_tests)}", flush=True)

        deleted = 0
        assigned = 0

        for t in all_tests:
            name = t.name.strip()
            code = t.code.strip()

            if not name and code and len(code) > 3:
                name = code
                code = ""

            if name in JUNK_NAMES or not name:
                t.delete()
                deleted += 1
                continue

            current_c = t.category.name if t.category else ""
            target_sub = OLD_CAT_MAPPING.get(current_c, "General Diagnostics")

            lname = name.lower()
            if target_sub == "General Diagnostics":
                if any(k in lname for k in ['x-ray', 'xray', 'cxr']):
                    target_sub = "X-Ray"
                elif any(k in lname for k in ['usg', 'ultrasound', 'sonography']):
                    target_sub = "Ultrasound & Doppler (USG)"
                elif 'ct' in lname:
                    target_sub = "CT Scan"
                elif 'mri' in lname:
                    target_sub = "MRI Scan"
                elif any(k in lname for k in ['cbc', 'blood', 'esr', 'hemoglobin', 'platelet', 'anemia']):
                    target_sub = "Hematology"
                elif any(k in lname for k in ['sugar', 'glucose', 'lft', 'kft', 'lipid', 'cholesterol', 'creatinine', 'urea']):
                    target_sub = "Biochemistry"
                elif any(k in lname for k in ['biopsy', 'histology', 'tissue']):
                    target_sub = "Histopathology"
                elif any(k in lname for k in ['fnac', 'pap smear', 'cytology']):
                    target_sub = "Cytopathology"
                elif any(k in lname for k in ['ecg', 'echo', 'tmt', 'holter']):
                    target_sub = "Cardiac Diagnostics"
                elif any(k in lname for k in ['eeg', 'emg', 'ncv', 'nerve']):
                    target_sub = "Neuro Diagnostics"

            target_category_obj = category_map.get(target_sub) or category_map.get("General Diagnostics")
            
            t.category = target_category_obj
            t.name = name
            t.code = code
            base_s = slugify(name[:150]) or f"test-{uuid.uuid4().hex[:6]}"
            t.slug = f"{base_s}-{str(t.id)[:8]}"
            t.save()
            assigned += 1

        # Clean up empty raw old categories
        valid_c_ids = [c.id for c in category_map.values()] + [p.id for p in TestCategory.objects.filter(parent__isnull=True)]
        unused = TestCategory.objects.exclude(id__in=valid_c_ids)
        unused_count = unused.count()
        unused.delete()
        print(f"Cleaned up {unused_count} old unused flat categories.", flush=True)

    print(f"DONE! Deleted {deleted} junk tests. Assigned categories to {assigned} legitimate tests.", flush=True)
    print(f"Current total tests in DB: {Test.objects.count()}", flush=True)
    print(f"Uncategorized tests count: {Test.objects.filter(category__isnull=True).count()}", flush=True)

if __name__ == "__main__":
    run_migration()
